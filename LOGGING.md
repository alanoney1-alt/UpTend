# Logging Strategy

**Last Updated:** 2026-02-09
**Status:** Implementation In Progress

## Overview

This document outlines UpTend's logging strategy and migration plan from ad-hoc `console.log` statements to structured logging.

---

## Current State

### Statistics
- **Server code:** 384 console statements across 60 files
- **Client code:** 19 console.log statements
- **Total:** 400+ logging statements

### Problems with Current Approach
1. **Unstructured:** No consistent format, hard to search/filter
2. **No levels:** Can't distinguish between debug, info, warn, error
3. **No context:** Missing metadata (user ID, request ID, timestamps)
4. **Production noise:** Debug logs clutter production output
5. **No aggregation:** Can't integrate with monitoring tools (Datadog, Sentry, etc.)

---

## New Logging Utility

### Location
`/server/utils/logger.ts`

### Features
- ✅ Log levels: debug, info, warn, error
- ✅ Structured JSON output in production
- ✅ Pretty formatting in development
- ✅ Context metadata support
- ✅ HTTP request logging middleware
- ✅ Environment-aware (respects LOG_LEVEL env var)
- ✅ Ready for external service integration

### Usage Examples

```typescript
import { logger, logError } from '@/utils/logger';

// Basic logging
logger.info('User registered successfully', {
  userId: 123,
  email: 'user@example.com'
});

// Error logging with context
try {
  await processPayment(orderId);
} catch (error) {
  logError(error, 'Payment processing failed', {
    orderId,
    customerId
  });
}

// HTTP request logging (middleware)
app.use(requestLogger);

// Debug logging (only shows in development)
logger.debug('Cache hit', { key: 'user:123', ttl: 300 });

// Warning for non-critical issues
logger.warn('Rate limit approaching', {
  ip: req.ip,
  count: 95,
  limit: 100
});
```

---

## Migration Plan

### Phase 1: Critical Server Logging ✅ CURRENT
**Priority:** Error and warning messages
**Files:** Server routes, middleware, services
**Timeline:** This week

Replace all `console.error()` and `console.warn()` statements with structured logging:

```typescript
// Before
console.error('Database connection failed:', error);

// After
logError(error, 'Database connection failed', {
  host: dbConfig.host,
  database: dbConfig.database
});
```

**Target files:**
- `/server/services/*.ts` - Business logic errors
- `/server/routes/**/*.ts` - API endpoint errors
- `/server/middleware/*.ts` - Auth/validation errors
- `/server/storage/**/*.ts` - Database errors

### Phase 2: Informational Logging (NEXT SPRINT)
**Priority:** Key system events
**Files:** Authentication, payments, job matching
**Timeline:** Next 2 weeks

Replace important `console.log()` statements with `logger.info()`:

```typescript
// Before
console.log(`Email sent to ${options.to}`);

// After
logger.info('Email sent successfully', {
  to: options.to,
  subject: options.subject,
  provider: 'SendGrid'
});
```

**Target events to log:**
- User authentication (login, logout, signup)
- Payment processing (charges, refunds, failures)
- Job lifecycle (created, matched, started, completed)
- Notification sending (SMS, email, push)
- External API calls (Stripe, Twilio, SendGrid)

### Phase 3: Debug Logging (FUTURE)
**Priority:** Development troubleshooting
**Files:** All server code
**Timeline:** Ongoing as needed

Convert remaining `console.log()` to `logger.debug()`:

```typescript
// Before
console.log('Fetching user profile:', userId);

// After
logger.debug('Fetching user profile', { userId });
```

**Note:** Debug logs are only shown in development, not production.

### Phase 4: Client-Side Logging (LOW PRIORITY)
**Priority:** Low - client logs are acceptable for now
**Files:** React components, hooks
**Timeline:** TBD

Client-side console.log statements are generally acceptable for development. In production, consider:
- Removing debug logs via build process (Vite drop_console plugin)
- Sending errors to Sentry for monitoring
- Keeping critical user-facing errors in console for support debugging

---

## Log Levels Guide

### When to Use Each Level

#### `logger.debug()`
- Verbose information for troubleshooting
- Only visible in development (LOG_LEVEL=debug)
- Examples: Cache hits/misses, query details, internal state

#### `logger.info()`
- General informational messages
- Key system events worth knowing about
- Examples: User actions, successful operations, state changes

#### `logger.warn()`
- Potentially harmful situations that aren't errors
- Things that might need attention but don't break functionality
- Examples: Rate limit warnings, deprecated API usage, failed retries, missing optional data

#### `logger.error()`
- Error events that need immediate attention
- Always logged regardless of log level
- Examples: Exceptions, failed requests, data corruption, payment failures

---

## Environment Variables

### `LOG_LEVEL`
Controls minimum log level to display.

**Options:** `debug` | `info` | `warn` | `error`

**Defaults:**
- Development: `debug` (show everything)
- Production: `info` (hide debug logs)

**Usage:**
```bash
# Development - show all logs including debug
LOG_LEVEL=debug npm run dev

# Production - only info/warn/error
LOG_LEVEL=info npm start

# Production critical only - only errors
LOG_LEVEL=error npm start
```

---

## Output Formats

### Development (Pretty)
```
ℹ️ [INFO] User logged in
{
  "userId": 123,
  "email": "user@example.com",
  "ip": "192.168.1.1"
}
```

### Production (JSON)
```json
{"timestamp":"2026-02-09T10:30:45.123Z","level":"info","message":"User logged in","context":{"userId":123,"email":"user@example.com","ip":"192.168.1.1"},"env":"production"}
```

---

## Integration Readiness

The logger is designed to easily integrate with external services:

### Datadog
```typescript
// In logger.ts, add to error() and warn() methods:
if (process.env.DATADOG_API_KEY) {
  // Send to Datadog API
}
```

### Sentry
```typescript
import * as Sentry from '@sentry/node';

// In logError() helper:
export function logError(error: Error, message: string, context?: LogContext) {
  logger.error(message, { ...context, error: error.message, stack: error.stack });
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, { contexts: { custom: context } });
  }
}
```

### Winston (Popular Node.js Logger)
Replace console.log/error in logger.ts with Winston transports for advanced features (file rotation, multiple outputs, etc.)

---

## Quick Reference

### Common Patterns

**HTTP Requests:**
```typescript
app.use(requestLogger); // Auto-logs all requests
```

**Errors:**
```typescript
try {
  await operation();
} catch (error) {
  logError(error, 'Operation failed', { operationId });
}
```

**External API Calls:**
```typescript
const start = Date.now();
const response = await fetch(url);
logger.externalApi('Stripe', '/v1/charges', response.status, Date.now() - start);
```

**Database Queries:**
```typescript
const start = Date.now();
const result = await db.query(sql, params);
logger.query(sql, Date.now() - start, { rowCount: result.rows.length });
```

---

## Migration Progress

| Category | Total | Migrated | Status |
|----------|-------|----------|--------|
| Logger utility created | 1 | 1 | ✅ Complete |
| Documentation written | 1 | 1 | ✅ Complete |
| Server console.error | ~80 | 2 | 🟡 Started (stripeService.ts) |
| Server console.warn | ~40 | 0 | 🔴 Not started |
| Server console.log (info) | ~200 | 0 | 🟡 Planned |
| Server console.log (debug) | ~64 | 0 | 🟢 Low priority |
| Client console statements | 19 | 0 | 🟢 Optional |

### Completed Files
- ✅ `/server/utils/logger.ts` - Created comprehensive logging utility
- 🟡 `/server/stripeService.ts` - Migrated 2/20 console.error statements (10% complete)

### Files Ready for Migration (Priority Order)
1. `/server/stripeService.ts` - Payment errors (18 remaining)
2. `/server/middleware/audit.ts` - Audit logging errors (3 errors)
3. `/server/services/notifications.ts` - Email/SMS sending (verified already good)
4. `/server/routes/**/*.ts` - API endpoint errors (~50 errors)
5. `/server/storage/**/*.ts` - Database errors (~20 errors)

---

## Best Practices

### DO:
✅ Use structured logging with context metadata
✅ Log errors with full context (IDs, user info, request data)
✅ Use appropriate log levels
✅ Include timing information for performance monitoring
✅ Sanitize sensitive data (passwords, tokens, credit cards)

### DON'T:
❌ Log sensitive user data (passwords, SSNs, full credit card numbers)
❌ Use console.log/error directly (use logger instead)
❌ Log in tight loops (can cause performance issues)
❌ Mix log levels (don't use logger.error() for warnings)
❌ Forget to add context (logs without context are hard to debug)

---

## Examples from Codebase

### Before (Current)
```typescript
// server/services/notifications.ts:50
console.log(`Email sent to ${options.to}`);

// server/routes/ai/chatbot.routes.ts:89
console.error('OpenAI API error:', error);

// server/storage/domains/service-requests/storage.ts:125
console.warn('Service request not found:', id);
```

### After (Migrated)
```typescript
// server/services/notifications.ts:50
logger.info('Email sent successfully', {
  to: options.to,
  subject: options.subject,
  provider: 'SendGrid'
});

// server/routes/ai/chatbot.routes.ts:89
logError(error, 'OpenAI API request failed', {
  model: 'gpt-4',
  endpoint: '/v1/chat/completions',
  conversationId
});

// server/storage/domains/service-requests/storage.ts:125
logger.warn('Service request not found in database', {
  requestId: id,
  operation: 'getById'
});
```

---

## Next Steps

1. ✅ Create logger utility (`/server/utils/logger.ts`)
2. ✅ Document logging strategy (this file)
3. ⏳ Migrate critical errors (console.error → logError)
4. ⏳ Migrate warnings (console.warn → logger.warn)
5. ⏳ Migrate key events (console.log → logger.info)
6. ⏳ Add HTTP request logging middleware
7. ⏳ Configure production log aggregation (Datadog/Sentry)
8. ⏳ Set up alerting for critical errors
