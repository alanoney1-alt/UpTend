/**
 * Auto-Dispatch Service
 * 
 * Automatically finds and assigns the best available pro for a job
 * based on location, skills, and partner-specific rules.
 */

import { pool } from "../db";

interface ProCandidate {
  id: string;
  firstName: string;
  lastName: string;
  lat: number;
  lng: number;
  distanceMiles: number;
  currentJobs: number;
  rating: number;
  matchesSkills: boolean;
  isPreferred: boolean;
  score: number;
}

interface AutoDispatchResult {
  success: boolean;
  assignedPro?: ProCandidate;
  candidates?: ProCandidate[];
  message: string;
}

/**
 * Calculate distance between two points in miles
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Get auto-dispatch rules for a partner
 */
async function getDispatchRules(partnerSlug: string) {
  const result = await pool.query(`
    SELECT * FROM auto_dispatch_rules 
    WHERE partner_slug = $1 AND active = true
    LIMIT 1
  `, [partnerSlug]);

  // Default rules if none found
  return result.rows[0] || {
    max_radius_miles: 25.0,
    skill_matching: true,
    availability_check: true,
    preferred_pros: [],
  };
}

/**
 * Find available pro candidates for a job
 */
async function findProCandidates(
  partnerSlug: string,
  jobLat: number,
  jobLng: number,
  serviceType: string,
  maxRadius: number,
  preferredPros: string[]
): Promise<ProCandidate[]> {
  
  // Get pros with recent location data (within 30 minutes)
  const result = await pool.query(`
    SELECT DISTINCT ON (u.id)
      u.id,
      u.first_name,
      u.last_name,
      u.current_lat,
      u.current_lng,
      pl.lat as recent_lat,
      pl.lng as recent_lng,
      pl.recorded_at,
      COALESCE(
        AVG(cr.rating), 
        4.0
      ) as avg_rating
    FROM users u
    LEFT JOIN pro_locations pl ON u.id = pl.pro_id 
    LEFT JOIN customer_reviews cr ON u.id = cr.pro_id
    WHERE u.role IN ('hauler', 'pro') 
    AND (pl.recorded_at > NOW() - INTERVAL '30 minutes' OR u.current_lat IS NOT NULL)
    GROUP BY u.id, u.first_name, u.last_name, u.current_lat, u.current_lng, pl.lat, pl.lng, pl.recorded_at
    ORDER BY u.id, pl.recorded_at DESC NULLS LAST
  `);

  const candidates: ProCandidate[] = [];

  for (const row of result.rows) {
    // Use recent GPS location if available, otherwise fall back to user's stored location
    const proLat = row.recent_lat || row.current_lat;
    const proLng = row.recent_lng || row.current_lng;
    
    if (!proLat || !proLng) continue;

    // Calculate distance
    const distance = calculateDistance(jobLat, jobLng, proLat, proLng);
    if (distance > maxRadius) continue;

    // Get current job count for today
    const jobCountResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM dispatch_jobs
      WHERE assigned_pro_id = $1 
      AND scheduled_date = CURRENT_DATE
      AND status NOT IN ('completed', 'cancelled')
    `, [row.id]);

    const currentJobs = parseInt(jobCountResult.rows[0].count);

    // Simple skill matching (would be more sophisticated in production)
    const matchesSkills = true; // For now, assume all pros can do all services

    const isPreferred = preferredPros.includes(row.id);

    // Calculate score (lower is better)
    let score = distance; // Start with distance
    score += currentJobs * 5; // Penalty for busy pros
    score -= isPreferred ? 10 : 0; // Bonus for preferred pros
    score -= (row.avg_rating - 4.0) * 2; // Bonus for high ratings

    candidates.push({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      lat: proLat,
      lng: proLng,
      distanceMiles: Math.round(distance * 10) / 10,
      currentJobs,
      rating: parseFloat(row.avg_rating),
      matchesSkills,
      isPreferred,
      score
    });
  }

  // Sort by score (best first)
  return candidates.sort((a, b) => a.score - b.score);
}

/**
 * Auto-dispatch a job to the best available pro
 */
export async function autoDispatchJob(partnerSlug: string, jobId: string): Promise<AutoDispatchResult> {
  try {
    // Get job details
    const jobResult = await pool.query(`
      SELECT * FROM dispatch_jobs 
      WHERE id = $1 AND partner_slug = $2 AND status = 'scheduled'
    `, [jobId, partnerSlug]);

    if (jobResult.rows.length === 0) {
      return {
        success: false,
        message: 'Job not found or already assigned'
      };
    }

    const job = jobResult.rows[0];

    if (!job.customer_lat || !job.customer_lng) {
      return {
        success: false,
        message: 'Job location coordinates required for auto-dispatch'
      };
    }

    // Get dispatch rules
    const rules = await getDispatchRules(partnerSlug);

    // Find candidates
    const candidates = await findProCandidates(
      partnerSlug,
      job.customer_lat,
      job.customer_lng,
      job.service_type,
      rules.max_radius_miles,
      rules.preferred_pros || []
    );

    if (candidates.length === 0) {
      return {
        success: false,
        candidates: [],
        message: `No available pros found within ${rules.max_radius_miles} miles`
      };
    }

    // Filter by availability if required
    let availableCandidates = candidates;
    if (rules.availability_check) {
      // For now, just exclude pros with 3+ jobs today
      availableCandidates = candidates.filter(c => c.currentJobs < 3);
    }

    if (availableCandidates.length === 0) {
      return {
        success: false,
        candidates,
        message: 'No pros available (all busy with current jobs)'
      };
    }

    // Pick the best candidate
    const bestPro = availableCandidates[0];

    // Assign the job
    await pool.query(`
      UPDATE dispatch_jobs 
      SET assigned_pro_id = $1, status = 'dispatched', updated_at = NOW()
      WHERE id = $2
    `, [bestPro.id, jobId]);

    // Create status update
    await pool.query(`
      INSERT INTO job_status_updates (job_id, status, note)
      VALUES ($1, 'dispatched', $2)
    `, [jobId, `Auto-assigned to ${bestPro.firstName} ${bestPro.lastName} (${bestPro.distanceMiles} miles away)`]);

    return {
      success: true,
      assignedPro: bestPro,
      candidates: availableCandidates,
      message: `Successfully assigned to ${bestPro.firstName} ${bestPro.lastName}`
    };

  } catch (error) {
    console.error('Auto-dispatch error:', error);
    return {
      success: false,
      message: 'Auto-dispatch failed due to system error'
    };
  }
}

/**
 * Get auto-dispatch candidates without actually assigning
 * (useful for showing options to dispatchers)
 */
export async function getDispatchCandidates(partnerSlug: string, jobId: string): Promise<ProCandidate[]> {
  try {
    const jobResult = await pool.query(`
      SELECT * FROM dispatch_jobs 
      WHERE id = $1 AND partner_slug = $2
    `, [jobId, partnerSlug]);

    if (jobResult.rows.length === 0 || !jobResult.rows[0].customer_lat) {
      return [];
    }

    const job = jobResult.rows[0];
    const rules = await getDispatchRules(partnerSlug);

    return await findProCandidates(
      partnerSlug,
      job.customer_lat,
      job.customer_lng,
      job.service_type,
      rules.max_radius_miles,
      rules.preferred_pros || []
    );
  } catch (error) {
    console.error('Error getting dispatch candidates:', error);
    return [];
  }
}