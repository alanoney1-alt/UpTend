/**
 * Partner Analytics Service
 * 
 * Calculates and caches analytics for partner performance dashboards.
 * Includes jobs completed, revenue, ratings, response times, and trends.
 */

import { pool } from "../db";

interface AnalyticsData {
  // Summary metrics
  jobsCompleted: number;
  totalRevenue: number;
  averageJobValue: number;
  averageRating: number;
  averageResponseTime: number; // Minutes from dispatched to arrived
  
  // Job status breakdown
  statusBreakdown: {
    scheduled: number;
    dispatched: number;
    en_route: number;
    arrived: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  
  // Time series data
  jobsPerDay: Array<{ date: string; count: number; revenue: number }>;
  
  // Pro performance
  topPros: Array<{
    id: string;
    name: string;
    jobsCompleted: number;
    averageRating: number;
    averageResponseTime: number;
    revenue: number;
  }>;
  
  // Service type breakdown
  serviceTypes: Array<{
    type: string;
    count: number;
    revenue: number;
    averageValue: number;
  }>;
  
  // Performance trends
  trends: {
    jobsCompletedChange: number; // Percentage change vs previous period
    revenueChange: number;
    ratingChange: number;
    responseTimeChange: number;
  };
}

/**
 * Calculate date range for analytics period
 */
function getDateRange(period: string): { startDate: string; endDate: string; previousStartDate: string } {
  const now = new Date();
  const endDate = now.toISOString().split('T')[0];
  
  let daysBack = 7;
  switch (period) {
    case '7d':
      daysBack = 7;
      break;
    case '30d':
      daysBack = 30;
      break;
    case '90d':
      daysBack = 90;
      break;
  }
  
  const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const previousStartDate = new Date(now.getTime() - daysBack * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  return { startDate, endDate, previousStartDate };
}

/**
 * Calculate summary metrics
 */
async function calculateSummaryMetrics(partnerSlug: string, startDate: string, endDate: string) {
  const result = await pool.query(`
    SELECT 
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as jobs_completed,
      COALESCE(SUM(CASE WHEN status = 'completed' THEN invoice_amount END), 0) as total_revenue,
      COALESCE(AVG(CASE WHEN status = 'completed' THEN invoice_amount END), 0) as average_job_value,
      COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_count,
      COUNT(CASE WHEN status = 'dispatched' THEN 1 END) as dispatched_count,
      COUNT(CASE WHEN status = 'en_route' THEN 1 END) as en_route_count,
      COUNT(CASE WHEN status = 'arrived' THEN 1 END) as arrived_count,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count
    FROM dispatch_jobs
    WHERE partner_slug = $1 
    AND scheduled_date >= $2 
    AND scheduled_date <= $3
  `, [partnerSlug, startDate, endDate]);

  return result.rows[0];
}

/**
 * Calculate average rating
 */
async function calculateAverageRating(partnerSlug: string, startDate: string, endDate: string): Promise<number> {
  const result = await pool.query(`
    SELECT COALESCE(AVG(rating), 0) as average_rating
    FROM customer_reviews cr
    JOIN dispatch_jobs dj ON cr.job_id = dj.id
    WHERE cr.partner_slug = $1 
    AND dj.scheduled_date >= $2 
    AND dj.scheduled_date <= $3
  `, [partnerSlug, startDate, endDate]);

  return parseFloat(result.rows[0].average_rating);
}

/**
 * Calculate average response time (dispatched to arrived)
 */
async function calculateAverageResponseTime(partnerSlug: string, startDate: string, endDate: string): Promise<number> {
  const result = await pool.query(`
    SELECT AVG(
      EXTRACT(EPOCH FROM (actual_arrival - updated_at)) / 60
    ) as avg_response_minutes
    FROM dispatch_jobs
    WHERE partner_slug = $1 
    AND scheduled_date >= $2 
    AND scheduled_date <= $3
    AND status IN ('arrived', 'in_progress', 'completed')
    AND actual_arrival IS NOT NULL
  `, [partnerSlug, startDate, endDate]);

  return parseFloat(result.rows[0]?.avg_response_minutes || '0');
}

/**
 * Get jobs per day time series
 */
async function getJobsPerDay(partnerSlug: string, startDate: string, endDate: string) {
  const result = await pool.query(`
    SELECT 
      scheduled_date::text as date,
      COUNT(*) as count,
      COALESCE(SUM(CASE WHEN status = 'completed' THEN invoice_amount END), 0) as revenue
    FROM dispatch_jobs
    WHERE partner_slug = $1 
    AND scheduled_date >= $2 
    AND scheduled_date <= $3
    GROUP BY scheduled_date
    ORDER BY scheduled_date
  `, [partnerSlug, startDate, endDate]);

  return result.rows.map(row => ({
    date: row.date,
    count: parseInt(row.count),
    revenue: parseFloat(row.revenue)
  }));
}

/**
 * Get top performing pros
 */
async function getTopPros(partnerSlug: string, startDate: string, endDate: string) {
  const result = await pool.query(`
    SELECT 
      u.id,
      CONCAT(u.first_name, ' ', u.last_name) as name,
      COUNT(dj.id) as jobs_completed,
      COALESCE(AVG(cr.rating), 0) as average_rating,
      COALESCE(SUM(dj.invoice_amount), 0) as revenue,
      AVG(
        CASE WHEN dj.actual_arrival IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (dj.actual_arrival - dj.updated_at)) / 60
        END
      ) as avg_response_time
    FROM users u
    JOIN dispatch_jobs dj ON u.id = dj.assigned_pro_id
    LEFT JOIN customer_reviews cr ON dj.id = cr.job_id
    WHERE dj.partner_slug = $1 
    AND dj.scheduled_date >= $2 
    AND dj.scheduled_date <= $3
    AND dj.status = 'completed'
    GROUP BY u.id, u.first_name, u.last_name
    HAVING COUNT(dj.id) > 0
    ORDER BY jobs_completed DESC, average_rating DESC
    LIMIT 10
  `, [partnerSlug, startDate, endDate]);

  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    jobsCompleted: parseInt(row.jobs_completed),
    averageRating: parseFloat(row.average_rating),
    averageResponseTime: parseFloat(row.avg_response_time || '0'),
    revenue: parseFloat(row.revenue)
  }));
}

/**
 * Get service type breakdown
 */
async function getServiceTypes(partnerSlug: string, startDate: string, endDate: string) {
  const result = await pool.query(`
    SELECT 
      service_type,
      COUNT(*) as count,
      COALESCE(SUM(CASE WHEN status = 'completed' THEN invoice_amount END), 0) as revenue,
      COALESCE(AVG(CASE WHEN status = 'completed' THEN invoice_amount END), 0) as average_value
    FROM dispatch_jobs
    WHERE partner_slug = $1 
    AND scheduled_date >= $2 
    AND scheduled_date <= $3
    GROUP BY service_type
    ORDER BY count DESC
  `, [partnerSlug, startDate, endDate]);

  return result.rows.map(row => ({
    type: row.service_type,
    count: parseInt(row.count),
    revenue: parseFloat(row.revenue),
    averageValue: parseFloat(row.average_value)
  }));
}

/**
 * Calculate trends vs previous period
 */
async function calculateTrends(
  partnerSlug: string, 
  startDate: string, 
  endDate: string, 
  previousStartDate: string
) {
  // Current period metrics
  const currentMetrics = await calculateSummaryMetrics(partnerSlug, startDate, endDate);
  const currentRating = await calculateAverageRating(partnerSlug, startDate, endDate);
  const currentResponseTime = await calculateAverageResponseTime(partnerSlug, startDate, endDate);

  // Previous period metrics
  const previousMetrics = await calculateSummaryMetrics(partnerSlug, previousStartDate, startDate);
  const previousRating = await calculateAverageRating(partnerSlug, previousStartDate, startDate);
  const previousResponseTime = await calculateAverageResponseTime(partnerSlug, previousStartDate, startDate);

  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    jobsCompletedChange: calculateChange(
      parseInt(currentMetrics.jobs_completed), 
      parseInt(previousMetrics.jobs_completed)
    ),
    revenueChange: calculateChange(
      parseFloat(currentMetrics.total_revenue), 
      parseFloat(previousMetrics.total_revenue)
    ),
    ratingChange: calculateChange(currentRating, previousRating),
    responseTimeChange: calculateChange(currentResponseTime, previousResponseTime) * -1 // Negative is good for response time
  };
}

/**
 * Calculate complete analytics for a partner
 */
export async function calculatePartnerAnalytics(partnerSlug: string, period: string = '30d'): Promise<AnalyticsData> {
  try {
    const { startDate, endDate, previousStartDate } = getDateRange(period);

    // Calculate all metrics in parallel
    const [
      summaryMetrics,
      averageRating,
      averageResponseTime,
      jobsPerDay,
      topPros,
      serviceTypes,
      trends
    ] = await Promise.all([
      calculateSummaryMetrics(partnerSlug, startDate, endDate),
      calculateAverageRating(partnerSlug, startDate, endDate),
      calculateAverageResponseTime(partnerSlug, startDate, endDate),
      getJobsPerDay(partnerSlug, startDate, endDate),
      getTopPros(partnerSlug, startDate, endDate),
      getServiceTypes(partnerSlug, startDate, endDate),
      calculateTrends(partnerSlug, startDate, endDate, previousStartDate)
    ]);

    const analytics: AnalyticsData = {
      jobsCompleted: parseInt(summaryMetrics.jobs_completed),
      totalRevenue: parseFloat(summaryMetrics.total_revenue),
      averageJobValue: parseFloat(summaryMetrics.average_job_value),
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      averageResponseTime: Math.round(averageResponseTime),

      statusBreakdown: {
        scheduled: parseInt(summaryMetrics.scheduled_count),
        dispatched: parseInt(summaryMetrics.dispatched_count),
        en_route: parseInt(summaryMetrics.en_route_count),
        arrived: parseInt(summaryMetrics.arrived_count),
        in_progress: parseInt(summaryMetrics.in_progress_count),
        completed: parseInt(summaryMetrics.jobs_completed),
        cancelled: parseInt(summaryMetrics.cancelled_count)
      },

      jobsPerDay,
      topPros,
      serviceTypes,
      trends
    };

    // Cache the analytics
    await cacheAnalytics(partnerSlug, period, analytics);

    return analytics;

  } catch (error) {
    console.error('Error calculating partner analytics:', error);
    throw error;
  }
}

/**
 * Cache analytics data
 */
async function cacheAnalytics(partnerSlug: string, period: string, data: AnalyticsData): Promise<void> {
  try {
    await pool.query(`
      INSERT INTO partner_analytics_cache (partner_slug, period, data, computed_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (partner_slug, period)
      DO UPDATE SET data = $3, computed_at = NOW()
    `, [partnerSlug, period, JSON.stringify(data)]);
  } catch (error) {
    console.error('Error caching analytics:', error);
    // Non-critical error, don't throw
  }
}

/**
 * Get cached analytics if recent (within 1 hour)
 */
export async function getCachedAnalytics(partnerSlug: string, period: string): Promise<AnalyticsData | null> {
  try {
    const result = await pool.query(`
      SELECT data
      FROM partner_analytics_cache
      WHERE partner_slug = $1 
      AND period = $2
      AND computed_at > NOW() - INTERVAL '1 hour'
    `, [partnerSlug, period]);

    return result.rows.length > 0 ? result.rows[0].data : null;
  } catch (error) {
    console.error('Error getting cached analytics:', error);
    return null;
  }
}

/**
 * Get analytics with cache-first strategy
 */
export async function getPartnerAnalytics(partnerSlug: string, period: string = '30d'): Promise<AnalyticsData> {
  // Try cache first
  const cached = await getCachedAnalytics(partnerSlug, period);
  if (cached) {
    return cached;
  }

  // Calculate fresh if not cached
  return await calculatePartnerAnalytics(partnerSlug, period);
}