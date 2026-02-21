const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const client = new OpenAI();

const outputDir = '/Users/ao/uptend-openclaw/marketing-assets';
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const images = [
  ['hero-george.png', 'Friendly illustrated character (warm, approachable middle-aged man in orange polo shirt) standing in front of a beautiful Orlando Florida home. Warm sunlight, palm trees, clean modern house. Flat illustration style with warm orange and cream color palette. No text.'],
  ['services-pressure-washing.png', 'Professional pressure washing a concrete driveway in Florida. Dramatic before/after split image. Left side dirty and stained, right side sparkling clean. Bright sunny day. Professional in orange branded shirt. Photorealistic.'],
  ['services-junk-removal.png', 'Professional junk removal team loading items into a clean truck. Garage cleanout in progress. Organized, professional look. Florida suburban home background. Warm lighting. Photorealistic.'],
  ['services-handyman.png', 'Professional handyman fixing a kitchen faucet. Clean, modern Florida kitchen. Tool belt visible. Friendly, competent look. Warm lighting. Photorealistic.'],
  ['app-mockup.png', 'Modern smartphone showing a chat interface with an AI assistant. Clean UI with orange/amber accent colors on cream background. Chat bubbles visible. The phone is floating at an angle with a subtle shadow. Minimalist product photography style.'],
  ['trust-badge.png', 'Clean professional badge/seal design. Shield shape with a checkmark. Text-free. Orange and gold color scheme. Conveying trust, verification, quality. Flat design style on transparent-style white background.'],
  ['social-gutter-cleaning.png', 'Before and after gutter cleaning on a Florida home. Left: gutters overflowing with debris and leaves. Right: clean gutters with proper drainage. Split image. Sunny day. Professional work.'],
  ['social-pool-cleaning.png', 'Beautiful clean swimming pool in a Florida backyard. Crystal clear blue water, palm trees, pool equipment visible. Warm sunset lighting. Inviting, well-maintained. Photorealistic.'],
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = [];

(async () => {
  for (const [filename, prompt] of images) {
    try {
      console.log(`Generating ${filename}...`);
      const response = await client.images.generate({
        model: 'gpt-image-1',
        prompt,
        n: 1,
        size: '1024x1024',
      });
      fs.writeFileSync(path.join(outputDir, filename), Buffer.from(response.data[0].b64_json, 'base64'));
      console.log(`✅ ${filename}`);
      results.push({ filename, status: 'success' });
    } catch (err) {
      console.error(`❌ ${filename}: ${err.message}`);
      results.push({ filename, status: 'failed', error: err.message });
    }
    await sleep(2000);
  }
  console.log('\n=== SUMMARY ===');
  for (const r of results) {
    console.log(`${r.status === 'success' ? '✅' : '❌'} ${r.filename}${r.error ? ' — ' + r.error : ''}`);
  }
  console.log(`\n${results.filter(r => r.status === 'success').length}/8 succeeded`);
})();
