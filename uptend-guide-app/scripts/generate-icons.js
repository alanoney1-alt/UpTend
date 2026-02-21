#!/usr/bin/env node
/**
 * Generate app icon and splash screen as SVGs, then convert to PNG via sharp.
 * Run: node scripts/generate-icons.js
 * Requires: npm install sharp (dev dependency)
 */

const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.log('sharp not installed. Generating SVG files only.');
  console.log('Install sharp to auto-convert: npm install --save-dev sharp');
  sharp = null;
}

const ASSETS = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(ASSETS)) fs.mkdirSync(ASSETS, { recursive: true });

// --- App Icon (1024x1024) ---
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="180" fill="url(#bg)"/>
  <!-- House/roof icon -->
  <path d="M512 250 L250 500 L330 500 L330 750 L694 750 L694 500 L774 500 Z" 
        fill="white" opacity="0.95"/>
  <!-- Door -->
  <rect x="462" y="580" width="100" height="170" rx="8" fill="#D97706" opacity="0.7"/>
</svg>`;

// --- Adaptive Icon foreground (1024x1024, transparent bg) ---
const adaptiveSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <path d="M512 250 L250 500 L330 500 L330 750 L694 750 L694 500 L774 500 Z" 
        fill="white" opacity="0.95"/>
  <rect x="462" y="580" width="100" height="170" rx="8" fill="white" opacity="0.5"/>
</svg>`;

// --- Splash screen (1284x2778 iPhone 14 Pro Max size) ---
const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1284" height="2778" viewBox="0 0 1284 2778">
  <rect width="1284" height="2778" fill="#FFFBF5"/>
  <!-- House icon centered -->
  <g transform="translate(492, 1100)">
    <defs>
      <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F59E0B"/>
        <stop offset="100%" stop-color="#D97706"/>
      </linearGradient>
    </defs>
    <path d="M150 0 L0 130 L40 130 L40 260 L260 260 L260 130 L300 130 Z" 
          fill="url(#iconGrad)"/>
    <rect x="115" y="170" width="70" height="90" rx="6" fill="#FFFBF5" opacity="0.8"/>
  </g>
  <!-- App name -->
  <text x="642" y="1500" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" 
        font-size="72" font-weight="700" fill="#1F2937">UpTend</text>
  <!-- Tagline -->
  <text x="642" y="1580" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" 
        font-size="36" fill="#6B7280">Your Home, Handled.</text>
</svg>`;

// --- Notification icon (96x96, white on transparent) ---
const notifSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <path d="M48 12 L12 48 L22 48 L22 80 L74 80 L74 48 L84 48 Z" fill="white"/>
</svg>`;

// Write SVGs
fs.writeFileSync(path.join(ASSETS, 'icon.svg'), iconSvg);
fs.writeFileSync(path.join(ASSETS, 'adaptive-icon.svg'), adaptiveSvg);
fs.writeFileSync(path.join(ASSETS, 'splash.svg'), splashSvg);
fs.writeFileSync(path.join(ASSETS, 'notification-icon.svg'), notifSvg);

console.log('SVG files written to assets/');

if (sharp) {
  (async () => {
    await sharp(Buffer.from(iconSvg)).resize(1024, 1024).png().toFile(path.join(ASSETS, 'icon.png'));
    console.log('✓ icon.png (1024x1024)');

    await sharp(Buffer.from(adaptiveSvg)).resize(1024, 1024).png().toFile(path.join(ASSETS, 'adaptive-icon.png'));
    console.log('✓ adaptive-icon.png (1024x1024)');

    await sharp(Buffer.from(splashSvg)).resize(1284, 2778).png().toFile(path.join(ASSETS, 'splash.png'));
    console.log('✓ splash.png (1284x2778)');

    await sharp(Buffer.from(notifSvg)).resize(96, 96).png().toFile(path.join(ASSETS, 'notification-icon.png'));
    console.log('✓ notification-icon.png (96x96)');

    console.log('Done! All PNGs generated.');
  })();
} else {
  console.log('\nTo convert to PNG, install sharp and re-run:');
  console.log('  npm install --save-dev sharp && node scripts/generate-icons.js');
}
