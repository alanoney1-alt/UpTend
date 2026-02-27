/**
 * Content Batch Generator - produces ready-to-post content batches
 */

import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generateDIYReview } from './content-generator.js';
import { getVideoRefForTopic } from './content-pipeline.js';

export interface ContentPost {
  id: string;
  platform: 'instagram' | 'tiktok' | 'youtube_shorts';
  text: string;
  hashtags: string[];
  videoRef: string;
  category: string;
  videoTitle: string;
  createdAt: string;
}

const DEFAULT_TOPICS = [
  'Running toilet fix',
  'Clogged drain',
  'Squeaky door hinge',
  'Replace light switch',
  'Patch drywall hole',
  'Clean dryer vent',
  'Fix leaky faucet',
  'Replace toilet flapper',
  'Unclog garbage disposal',
  'Install smart thermostat',
];

function getDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Generate a full batch of ready-to-post content
 */
export async function generateContentBatch(
  count: number = 10,
  topics?: string[],
  dateOverride?: string,
): Promise<ContentPost[]> {
  const date = dateOverride ?? getDateString();
  const selectedTopics = (topics ?? DEFAULT_TOPICS).slice(0, count);
  const posts: ContentPost[] = [];

  const outDir = join(process.cwd(), 'scripts', 'content', 'posts', date);
  await mkdir(outDir, { recursive: true });

  for (let i = 0; i < selectedTopics.length; i++) {
    const topic = selectedTopics[i];
    const video = getVideoRefForTopic(topic);
    const review = generateDIYReview(topic, video.category);

    // Generate one post per platform
    const platforms = ['instagram', 'tiktok', 'youtube_shorts'] as const;

    for (const platform of platforms) {
      let text: string;
      let hashtags: string[];

      switch (platform) {
        case 'instagram':
          text = review.instagram.slides.join('\n\n---\n\n');
          hashtags = review.tiktok.hashtags; // share hashtags
          break;
        case 'tiktok':
          text = review.tiktok.caption;
          hashtags = review.tiktok.hashtags;
          break;
        case 'youtube_shorts':
          text = review.youtubeShorts.description;
          hashtags = review.tiktok.hashtags.slice(0, 5);
          break;
      }

      const post: ContentPost = {
        id: `${date}-${String(i + 1).padStart(2, '0')}-${platform}`,
        platform,
        text,
        hashtags,
        videoRef: `https://youtube.com/watch?v=${video.videoId}`,
        category: video.category,
        videoTitle: topic,
        createdAt: new Date().toISOString(),
      };

      posts.push(post);
    }
  }

  // Save individual post files
  for (const post of posts) {
    const filename = `${post.id}.json`;
    await writeFile(join(outDir, filename), JSON.stringify(post, null, 2));
  }

  // Save batch summary
  await writeFile(
    join(outDir, '_batch-summary.json'),
    JSON.stringify(
      {
        date,
        totalPosts: posts.length,
        topics: selectedTopics,
        generatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );

  return posts;
}

/**
 * List generated posts from the output directory
 */
export async function listGeneratedPosts(date?: string): Promise<ContentPost[]> {
  const baseDir = join(process.cwd(), 'scripts', 'content', 'posts');

  try {
    const dates = date ? [date] : await readdir(baseDir);
    const posts: ContentPost[] = [];

    for (const d of dates) {
      const dir = join(baseDir, d);
      try {
        const files = await readdir(dir);
        for (const f of files) {
          if (f.startsWith('_') || !f.endsWith('.json')) continue;
          const content = await readFile(join(dir, f), 'utf-8');
          posts.push(JSON.parse(content) as ContentPost);
        }
      } catch {
        // skip missing dirs
      }
    }

    return posts;
  } catch {
    return [];
  }
}
