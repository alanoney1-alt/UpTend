import { pool } from "../db.js";
import { nanoid } from "nanoid";

const ENSURE_TABLE = `
CREATE TABLE IF NOT EXISTS job_photos (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  pro_id TEXT,
  customer_id TEXT,
  service_type TEXT,
  photo_url TEXT NOT NULL,
  photo_type TEXT DEFAULT 'completion',
  tags JSONB DEFAULT '[]'::jsonb,
  ai_analysis JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
`;

let tableEnsured = false;
async function ensureTable() {
  if (tableEnsured) return;
  await pool.query(ENSURE_TABLE);
  tableEnsured = true;
}

export interface StoreJobPhotoOpts {
  job_id: string;
  pro_id?: string;
  customer_id?: string;
  service_type?: string;
  photo_url: string;
  photo_type?: "before" | "after" | "issue" | "completion";
  tags?: string[];
}

export async function storeJobPhoto(opts: StoreJobPhotoOpts) {
  await ensureTable();
  const id = nanoid();
  await pool.query(
    `INSERT INTO job_photos (id, job_id, pro_id, customer_id, service_type, photo_url, photo_type, tags, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,NOW())`,
    [id, opts.job_id, opts.pro_id || null, opts.customer_id || null,
     opts.service_type || null, opts.photo_url, opts.photo_type || "completion",
     JSON.stringify(opts.tags || [])]
  );
  return { id, ...opts };
}

export async function getJobPhotos(jobId: string) {
  await ensureTable();
  const { rows } = await pool.query(
    `SELECT * FROM job_photos WHERE job_id = $1 ORDER BY created_at ASC`, [jobId]
  );
  return rows;
}

export async function getPhotosByService(serviceType: string, limit = 100) {
  await ensureTable();
  const { rows } = await pool.query(
    `SELECT * FROM job_photos WHERE service_type = $1 ORDER BY created_at DESC LIMIT $2`,
    [serviceType, limit]
  );
  return rows;
}

export async function tagPhoto(photoId: string, tags: string[]) {
  await ensureTable();
  await pool.query(
    `UPDATE job_photos SET tags = $1::jsonb WHERE id = $2`,
    [JSON.stringify(tags), photoId]
  );
  return { photoId, tags };
}

export async function getPhoto(photoId: string) {
  await ensureTable();
  const { rows } = await pool.query(`SELECT * FROM job_photos WHERE id = $1`, [photoId]);
  return rows[0] || null;
}

export async function analyzePhoto(photoId: string) {
  await ensureTable();
  const photo = await getPhoto(photoId);
  if (!photo) throw new Error("Photo not found");

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn("[PhotoPipeline] OPENAI_API_KEY not set, skipping analysis");
      return { photoId, analysis: null, skipped: true };
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this job photo. Describe what you see, identify any issues, estimate completion quality (1-10), and suggest relevant tags. Return JSON with fields: description, issues, quality_score, suggested_tags." },
              { type: "image_url", image_url: { url: photo.photo_url } },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.warn("[PhotoPipeline] OpenAI API error:", err);
      return { photoId, analysis: null, error: "API error" };
    }

    const data = await response.json() as any;
    const analysis = data.choices?.[0]?.message?.content || null;
    let parsed: any;
    try {
      parsed = JSON.parse(analysis);
    } catch {
      parsed = { raw: analysis };
    }

    await pool.query(`UPDATE job_photos SET ai_analysis = $1::jsonb WHERE id = $2`, [JSON.stringify(parsed), photoId]);
    return { photoId, analysis: parsed };
  } catch (e: any) {
    console.warn("[PhotoPipeline] Analysis failed:", e.message);
    return { photoId, analysis: null, error: e.message };
  }
}
