#!/usr/bin/env tsx
/**
 * Print exact environment variable values for debugging
 */

import 'dotenv/config';

console.log('='.repeat(60));
console.log('ENVIRONMENT VARIABLE DEBUG');
console.log('='.repeat(60));
console.log();

console.log('DATABASE_URL:');
console.log('  Type:', typeof process.env.DATABASE_URL);
console.log('  Value:', JSON.stringify(process.env.DATABASE_URL));
console.log('  Length:', process.env.DATABASE_URL?.length || 0);
console.log('  Raw:', process.env.DATABASE_URL);
console.log();

console.log('SESSION_SECRET:');
console.log('  Type:', typeof process.env.SESSION_SECRET);
console.log('  Value:', JSON.stringify(process.env.SESSION_SECRET));
console.log('  Length:', process.env.SESSION_SECRET?.length || 0);
console.log('  Present:', !!process.env.SESSION_SECRET);
console.log();

console.log('All DATABASE_* vars:');
Object.keys(process.env)
  .filter(key => key.includes('DATABASE'))
  .forEach(key => {
    console.log(`  ${key}: ${JSON.stringify(process.env[key])}`);
  });
console.log();

console.log('All env vars count:', Object.keys(process.env).length);
console.log();

// Check if .env file exists
import { existsSync, readFileSync } from 'fs';
const envPath = '.env';
if (existsSync(envPath)) {
  console.log('.env file exists: YES');
  const content = readFileSync(envPath, 'utf-8');
  console.log('.env file size:', content.length, 'bytes');
  console.log();

  console.log('.env file contents (showing DATABASE_URL lines):');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('DATABASE') || line.trim().startsWith('DATABASE')) {
      console.log(`  Line ${i + 1}: ${JSON.stringify(line)}`);
    }
  });
} else {
  console.log('.env file exists: NO');
}
console.log();

console.log('='.repeat(60));
