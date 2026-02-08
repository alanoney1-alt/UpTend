#!/usr/bin/env tsx
/**
 * UPTEND Setup Script
 * Validates environment configuration and helps with local development setup
 */

import { existsSync, readFileSync, copyFileSync } from 'fs';
import { join } from 'path';
import * as readline from 'readline';
import pg from 'pg';

const { Pool } = pg;

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(message: string) {
  console.log();
  log(`${'='.repeat(60)}`, colors.cyan);
  log(`  ${message}`, colors.bold + colors.cyan);
  log(`${'='.repeat(60)}`, colors.cyan);
  console.log();
}

function success(message: string) {
  log(`✅ ${message}`, colors.green);
}

function warning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

function error(message: string) {
  log(`❌ ${message}`, colors.red);
}

function info(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

interface EnvCheck {
  name: string;
  required: boolean;
  critical: boolean;
  description: string;
  hint?: string;
}

const ENV_CHECKS: EnvCheck[] = [
  // REQUIRED
  {
    name: 'DATABASE_URL',
    required: true,
    critical: false,
    description: 'PostgreSQL connection string',
    hint: 'postgresql://postgres:password@localhost:5432/uptend',
  },
  {
    name: 'SESSION_SECRET',
    required: true,
    critical: false,
    description: 'Session encryption secret',
    hint: 'Generate with: openssl rand -base64 32',
  },

  // CRITICAL - Stripe (need one configuration)
  {
    name: 'STRIPE_SECRET_KEY',
    required: false,
    critical: true,
    description: 'Stripe secret key (or use REPLIT_CONNECTORS_HOSTNAME)',
    hint: 'Get from: https://dashboard.stripe.com/test/apikeys',
  },
  {
    name: 'STRIPE_PUBLISHABLE_KEY',
    required: false,
    critical: true,
    description: 'Stripe publishable key',
    hint: 'Get from: https://dashboard.stripe.com/test/apikeys',
  },

  // CRITICAL - AI
  {
    name: 'AI_INTEGRATIONS_OPENAI_API_KEY',
    required: false,
    critical: true,
    description: 'OpenAI API key for AI features',
    hint: 'Get from: https://platform.openai.com/api-keys',
  },
];

async function promptYesNo(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} (y/n): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim() === 'y');
    });
  });
}

async function checkEnvFile(): Promise<boolean> {
  const envPath = join(process.cwd(), '.env');
  const envExamplePath = join(process.cwd(), '.env.example');

  if (!existsSync(envPath)) {
    header('Environment File Missing');
    error('No .env file found in project root');
    console.log();

    if (existsSync(envExamplePath)) {
      info('Found .env.example file');
      console.log();

      const shouldCopy = await promptYesNo('Would you like to create .env from .env.example?');

      if (shouldCopy) {
        try {
          copyFileSync(envExamplePath, envPath);
          success('Created .env file from .env.example');
          console.log();
          warning('Please edit .env and fill in your configuration values');
          console.log();
          info('Minimum required variables:');
          console.log('  - DATABASE_URL');
          console.log('  - SESSION_SECRET');
          console.log('  - STRIPE_SECRET_KEY + STRIPE_PUBLISHABLE_KEY');
          console.log('  - AI_INTEGRATIONS_OPENAI_API_KEY');
          console.log();
          process.exit(0);
        } catch (err) {
          error(`Failed to create .env: ${err}`);
          return false;
        }
      } else {
        info('You can manually copy .env.example to .env and edit it');
        return false;
      }
    } else {
      error('No .env.example file found either!');
      return false;
    }
  }

  return true;
}

async function loadEnv(): Promise<Record<string, string>> {
  const envPath = join(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf-8');

  const env: Record<string, string> = {};

  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        env[key.trim()] = value.trim();
      }
    }
  }

  return env;
}

async function validateEnvironment(env: Record<string, string>): Promise<boolean> {
  header('Environment Variable Validation');

  let hasErrors = false;
  let hasWarnings = false;

  // Check REQUIRED variables
  const missingRequired: string[] = [];
  for (const check of ENV_CHECKS.filter((c) => c.required)) {
    if (!env[check.name]) {
      missingRequired.push(check.name);
      error(`REQUIRED: ${check.name} - ${check.description}`);
      if (check.hint) {
        info(`  Hint: ${check.hint}`);
      }
      hasErrors = true;
    } else {
      success(`${check.name}`);
    }
  }

  console.log();

  // Check CRITICAL variables
  const missingCritical: string[] = [];
  for (const check of ENV_CHECKS.filter((c) => c.critical)) {
    if (!env[check.name]) {
      missingCritical.push(check.name);
    }
  }

  // Special check: Stripe (need either Replit connectors OR direct keys)
  const hasReplitStripe = !!env.REPLIT_CONNECTORS_HOSTNAME;
  const hasDirectStripe = !!(env.STRIPE_SECRET_KEY && env.STRIPE_PUBLISHABLE_KEY);

  if (!hasReplitStripe && !hasDirectStripe) {
    warning('CRITICAL: Missing Stripe configuration');
    info('  You need EITHER:');
    info('    - REPLIT_CONNECTORS_HOSTNAME (for Replit)');
    info('    - OR STRIPE_SECRET_KEY + STRIPE_PUBLISHABLE_KEY (for direct integration)');
    hasWarnings = true;
  } else {
    success(hasReplitStripe ? 'Stripe (Replit Connectors)' : 'Stripe (Direct Integration)');
  }

  // Check OpenAI
  if (!env.AI_INTEGRATIONS_OPENAI_API_KEY) {
    warning('CRITICAL: Missing AI_INTEGRATIONS_OPENAI_API_KEY');
    info('  All AI features will be disabled:');
    info('    - Photo analysis, AI triage, sentiment analysis');
    info('    - Conflict shield, smart dispatch, hazard detection');
    info('    - Home inventory, rebate validation, chat AI');
    hasWarnings = true;
  } else {
    success('OpenAI API Key');
  }

  console.log();

  // Check OPTIONAL but useful variables
  const optionalChecks = [
    { name: 'SENDGRID_API_KEY', desc: 'Email notifications' },
    { name: 'TWILIO_ACCOUNT_SID', desc: 'SMS notifications' },
    { name: 'ADMIN_PASSWORD', desc: 'Admin dashboard access' },
    { name: 'REPL_ID', desc: 'Replit OAuth (if using Replit auth)' },
  ];

  const missingOptional: string[] = [];
  for (const check of optionalChecks) {
    if (!env[check.name]) {
      missingOptional.push(check.name);
    }
  }

  if (missingOptional.length > 0) {
    info('Optional variables not set (features will be limited):');
    for (const check of optionalChecks) {
      if (!env[check.name]) {
        console.log(`  - ${check.name} (${check.desc})`);
      }
    }
    console.log();
  }

  return !hasErrors;
}

async function testDatabaseConnection(databaseUrl: string): Promise<boolean> {
  header('Database Connection Test');

  try {
    info('Attempting to connect to PostgreSQL...');
    const pool = new Pool({ connectionString: databaseUrl });

    const client = await pool.connect();
    const result = await client.query('SELECT version()');

    client.release();
    await pool.end();

    success('Database connection successful!');
    info(`PostgreSQL version: ${result.rows[0].version.split(',')[0]}`);
    console.log();

    return true;
  } catch (err: any) {
    error('Database connection failed!');
    console.log();
    error(`Error: ${err.message}`);
    console.log();

    if (err.code === 'ECONNREFUSED') {
      warning('Connection refused - is PostgreSQL running?');
      info('To start PostgreSQL locally:');
      info('  macOS: brew services start postgresql');
      info('  Linux: sudo systemctl start postgresql');
      info('  Windows: Start PostgreSQL service from Services app');
    } else if (err.code === 'ENOTFOUND') {
      warning('Database host not found');
      info('Check your DATABASE_URL hostname');
    } else if (err.message.includes('password authentication failed')) {
      warning('Authentication failed');
      info('Check your DATABASE_URL username and password');
    }

    console.log();
    return false;
  }
}

async function showNextSteps(dbConnected: boolean) {
  header('Next Steps');

  if (dbConnected) {
    success('Your environment is configured! Here\'s what to do next:');
    console.log();
    console.log('  1. Run database migrations:');
    console.log('     npm run db:push');
    console.log();
    console.log('  2. Start the development server:');
    console.log('     npm run dev');
    console.log();
    console.log('  3. Open your browser to:');
    console.log('     http://localhost:5000');
    console.log();
  } else {
    warning('Database connection failed. Please fix the issues above and run:');
    console.log('     npm run setup');
    console.log();
  }

  info('Useful commands:');
  console.log('  npm run dev        - Start development server');
  console.log('  npm run db:push    - Push database schema');
  console.log('  npm run db:studio  - Open Drizzle Studio (DB GUI)');
  console.log('  npm run setup      - Run this setup script again');
  console.log();
}

async function main() {
  console.clear();
  log('╔════════════════════════════════════════════════════════════╗', colors.cyan);
  log('║                     UPTEND SETUP                           ║', colors.bold + colors.cyan);
  log('║          Environment Configuration & Validation            ║', colors.cyan);
  log('╚════════════════════════════════════════════════════════════╝', colors.cyan);
  console.log();

  // Step 1: Check for .env file
  const hasEnv = await checkEnvFile();
  if (!hasEnv) {
    error('Setup cannot continue without .env file');
    process.exit(1);
  }

  // Step 2: Load environment variables
  const env = await loadEnv();

  // Step 3: Validate environment variables
  const isValid = await validateEnvironment(env);

  if (!isValid) {
    console.log();
    error('Setup failed: Missing required environment variables');
    console.log();
    info('Please edit .env and fill in the required values, then run:');
    console.log('  npm run setup');
    console.log();
    process.exit(1);
  }

  // Step 4: Test database connection
  let dbConnected = false;
  if (env.DATABASE_URL) {
    dbConnected = await testDatabaseConnection(env.DATABASE_URL);
  }

  // Step 5: Show next steps
  await showNextSteps(dbConnected);

  process.exit(dbConnected ? 0 : 1);
}

main().catch((err) => {
  console.error();
  error(`Setup script failed: ${err.message}`);
  console.error(err);
  process.exit(1);
});
