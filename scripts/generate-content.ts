/**
 * CLI script to generate the first content batch
 */
import { generateContentBatch } from '../server/services/content-batch.js';

const posts = await generateContentBatch(10, undefined, '2026-02-18');
console.log(`✅ Generated ${posts.length} posts to scripts/content/posts/2026-02-18/`);
console.log(`Topics covered:`);
const topics = [...new Set(posts.map(p => p.videoTitle))];
for (const t of topics) {
  console.log(`  - ${t}`);
}
