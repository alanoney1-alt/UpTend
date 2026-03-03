/**
 * Partner Smart Crew Scheduling (#6)
 * 
 * George becomes the partner's dispatch brain:
 * - "Who's free tomorrow morning?" → instant answer
 * - "Schedule Alex for the Johnson job at 2pm" → done
 * - "What's everyone's load this week?" → crew utilization report
 * 
 * Partners text George directly for crew management.
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

// ============================================================
// Types
// ============================================================

export interface CrewMember {
  id?: number;
  partnerSlug: string;
  name: string;
  phone: string;
  email: string;
  role: string; // "tech", "apprentice", "lead", "helper"
  skills: string[]; // ["ac_repair", "duct_cleaning", "installation"]
  isActive: boolean;
  maxJobsPerDay: number;
}

export interface ScheduledJob {
  id?: number;
  partnerSlug: string;
  crewMemberId: number;
  crewMemberName: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string; // "09:00"
  estimatedDurationHours: number;
  status: "scheduled" | "en_route" | "in_progress" | "completed" | "cancelled";
  notes: string;
  jobId: string; // Link to UpTend job if applicable
}

export interface CrewAvailability {
  crewMember: CrewMember;
  scheduledJobs: ScheduledJob[];
  availableSlots: Array<{ start: string; end: string }>;
  utilizationPct: number;
}

// ============================================================
// Database Setup
// ============================================================

export async function ensureSchedulingTables(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_crew_members (
        id SERIAL PRIMARY KEY,
        partner_slug TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT DEFAULT '',
        email TEXT DEFAULT '',
        role TEXT DEFAULT 'tech',
        skills TEXT[] DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        max_jobs_per_day INTEGER DEFAULT 4,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_crew_schedule (
        id SERIAL PRIMARY KEY,
        partner_slug TEXT NOT NULL,
        crew_member_id INTEGER REFERENCES partner_crew_members(id),
        crew_member_name TEXT DEFAULT '',
        customer_name TEXT DEFAULT '',
        customer_phone TEXT DEFAULT '',
        customer_address TEXT DEFAULT '',
        service_type TEXT DEFAULT '',
        scheduled_date DATE NOT NULL,
        scheduled_time TEXT DEFAULT '09:00',
        estimated_duration_hours NUMERIC(4,2) DEFAULT 2,
        status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'en_route', 'in_progress', 'completed', 'cancelled')),
        notes TEXT DEFAULT '',
        job_id TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.error("[CrewScheduling] Table creation error:", err);
  }
}

// ============================================================
// Crew Management
// ============================================================

export async function addCrewMember(member: Omit<CrewMember, "id">): Promise<number> {
  await ensureSchedulingTables();
  const result = await db.execute(sql`
    INSERT INTO partner_crew_members (partner_slug, name, phone, email, role, skills, is_active, max_jobs_per_day)
    VALUES (${member.partnerSlug}, ${member.name}, ${member.phone}, ${member.email}, ${member.role}, ${member.skills}, ${member.isActive}, ${member.maxJobsPerDay})
    RETURNING id
  `);
  return (result.rows[0] as any)?.id || 0;
}

export async function getCrewMembers(partnerSlug: string): Promise<CrewMember[]> {
  await ensureSchedulingTables();
  const result = await db.execute(sql`
    SELECT * FROM partner_crew_members WHERE partner_slug = ${partnerSlug} AND is_active = true ORDER BY name
  `);
  return (result.rows as any[]).map(r => ({
    id: r.id,
    partnerSlug: r.partner_slug,
    name: r.name,
    phone: r.phone,
    email: r.email,
    role: r.role,
    skills: r.skills || [],
    isActive: r.is_active,
    maxJobsPerDay: r.max_jobs_per_day,
  }));
}

// ============================================================
// Scheduling
// ============================================================

export async function scheduleJob(job: Omit<ScheduledJob, "id">): Promise<number> {
  await ensureSchedulingTables();
  const result = await db.execute(sql`
    INSERT INTO partner_crew_schedule (
      partner_slug, crew_member_id, crew_member_name, customer_name, customer_phone,
      customer_address, service_type, scheduled_date, scheduled_time,
      estimated_duration_hours, status, notes, job_id
    ) VALUES (
      ${job.partnerSlug}, ${job.crewMemberId}, ${job.crewMemberName}, ${job.customerName},
      ${job.customerPhone}, ${job.customerAddress}, ${job.serviceType}, ${job.scheduledDate},
      ${job.scheduledTime}, ${job.estimatedDurationHours}, ${job.status}, ${job.notes}, ${job.jobId}
    ) RETURNING id
  `);
  return (result.rows[0] as any)?.id || 0;
}

export async function updateJobStatus(jobId: number, status: ScheduledJob["status"]): Promise<void> {
  await ensureSchedulingTables();
  await db.execute(sql`
    UPDATE partner_crew_schedule SET status = ${status} WHERE id = ${jobId}
  `);
}

// ============================================================
// Availability
// ============================================================

/**
 * "Who's free tomorrow morning?"
 */
export async function getAvailability(partnerSlug: string, date: string): Promise<CrewAvailability[]> {
  await ensureSchedulingTables();
  
  const crew = await getCrewMembers(partnerSlug);
  const availability: CrewAvailability[] = [];

  for (const member of crew) {
    const jobsResult = await db.execute(sql`
      SELECT * FROM partner_crew_schedule
      WHERE partner_slug = ${partnerSlug}
        AND crew_member_id = ${member.id}
        AND scheduled_date = ${date}
        AND status != 'cancelled'
      ORDER BY scheduled_time
    `);

    const scheduledJobs = (jobsResult.rows as any[]).map(r => ({
      id: r.id,
      partnerSlug: r.partner_slug,
      crewMemberId: r.crew_member_id,
      crewMemberName: r.crew_member_name,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      customerAddress: r.customer_address,
      serviceType: r.service_type,
      scheduledDate: r.scheduled_date,
      scheduledTime: r.scheduled_time,
      estimatedDurationHours: parseFloat(r.estimated_duration_hours),
      status: r.status,
      notes: r.notes,
      jobId: r.job_id,
    }));

    // Calculate available slots (work day 8AM - 6PM)
    const workStart = 8; // 8 AM
    const workEnd = 18; // 6 PM
    const availableSlots: Array<{ start: string; end: string }> = [];
    
    let currentHour = workStart;
    for (const job of scheduledJobs) {
      const jobHour = parseInt(job.scheduledTime.split(":")[0]);
      if (currentHour < jobHour) {
        availableSlots.push({
          start: `${String(currentHour).padStart(2, "0")}:00`,
          end: `${String(jobHour).padStart(2, "0")}:00`,
        });
      }
      currentHour = jobHour + job.estimatedDurationHours;
    }
    if (currentHour < workEnd) {
      availableSlots.push({
        start: `${String(Math.ceil(currentHour)).padStart(2, "0")}:00`,
        end: `${String(workEnd).padStart(2, "0")}:00`,
      });
    }

    const totalWorkHours = workEnd - workStart;
    const scheduledHours = scheduledJobs.reduce((sum, j) => sum + j.estimatedDurationHours, 0);
    const utilizationPct = Math.round((scheduledHours / totalWorkHours) * 100);

    availability.push({
      crewMember: member,
      scheduledJobs,
      availableSlots,
      utilizationPct,
    });
  }

  return availability;
}

/**
 * Natural language summary for George
 */
export async function getAvailabilitySummary(partnerSlug: string, date: string): Promise<string> {
  const availability = await getAvailability(partnerSlug, date);
  
  if (availability.length === 0) {
    return "No crew members registered yet. Want to add your team?";
  }

  const lines: string[] = [];
  for (const a of availability) {
    const jobCount = a.scheduledJobs.length;
    if (a.availableSlots.length === 0) {
      lines.push(`${a.crewMember.name}: Fully booked (${jobCount} jobs)`);
    } else {
      const slots = a.availableSlots.map(s => `${s.start}-${s.end}`).join(", ");
      lines.push(`${a.crewMember.name}: ${jobCount} jobs, free ${slots} (${100 - a.utilizationPct}% available)`);
    }
  }

  return lines.join("\n");
}

/**
 * Weekly utilization report
 */
export async function getWeeklyUtilization(partnerSlug: string): Promise<string> {
  const crew = await getCrewMembers(partnerSlug);
  if (crew.length === 0) return "No crew members registered yet.";

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday

  const lines: string[] = [`Crew utilization this week:`];
  
  for (const member of crew) {
    const result = await db.execute(sql`
      SELECT COUNT(*) as jobs, COALESCE(SUM(estimated_duration_hours), 0) as hours
      FROM partner_crew_schedule
      WHERE partner_slug = ${partnerSlug}
        AND crew_member_id = ${member.id}
        AND scheduled_date >= ${weekStart.toISOString().split("T")[0]}
        AND scheduled_date <= ${today.toISOString().split("T")[0]}
        AND status != 'cancelled'
    `);
    const r: any = result.rows[0] || { jobs: 0, hours: 0 };
    const maxHours = 40; // 8h x 5 days
    const utilization = Math.round((parseFloat(r.hours) / maxHours) * 100);
    lines.push(`  ${member.name}: ${r.jobs} jobs, ${parseFloat(r.hours).toFixed(1)}h (${utilization}%)`);
  }

  return lines.join("\n");
}
