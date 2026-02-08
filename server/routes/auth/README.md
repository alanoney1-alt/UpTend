# Authentication Routes

This directory contains the authentication route modules extracted from the monolithic `routes.ts` file.

## Modules

### hauler.routes.ts
**Function:** `registerHaulerAuthRoutes(app: Express)`

Handles all PYCKER (hauler) authentication:
- Email verification workflow
- Hauler registration with vehicle information
- Login with role validation
- Logout

**Endpoints:**
- `POST /api/haulers/check-username` - Check username availability
- `POST /api/haulers/send-verification` - Send email verification code
- `POST /api/haulers/verify-email` - Verify email with code
- `POST /api/haulers/register` - Complete hauler registration
- `POST /api/haulers/login` - Hauler login (validates hauler/admin role)
- `POST /api/haulers/logout` - Hauler logout

### customer.routes.ts
**Function:** `registerCustomerAuthRoutes(app: Express)`

Handles all customer authentication:
- Customer registration with SMS opt-in
- Auto-login after registration
- Login with role validation
- Logout

**Endpoints:**
- `POST /api/customers/register` - Customer registration
- `POST /api/customers/login` - Customer login (validates customer role)
- `POST /api/customers/logout` - Customer logout

### admin.routes.ts
**Function:** `registerAdminAuthRoutes(app: Express)`

Handles admin authentication and password reset:
- Session-based admin login
- Password reset workflow with rate limiting
- Secure token-based password reset

**Endpoints:**
- `POST /api/admin/login` - Admin login
- `GET /api/admin/check` - Check admin session
- `POST /api/admin/logout` - Admin logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

## Usage

To integrate these routes into your Express app:

```typescript
import { registerHaulerAuthRoutes } from "./routes/auth/hauler.routes";
import { registerCustomerAuthRoutes } from "./routes/auth/customer.routes";
import { registerAdminAuthRoutes } from "./routes/auth/admin.routes";

export async function registerRoutes(app: Express): Promise<void> {
  // Register authentication routes
  await registerHaulerAuthRoutes(app);
  await registerCustomerAuthRoutes(app);
  await registerAdminAuthRoutes(app);

  // Register other route modules...
}
```

## Dependencies

All modules share these common dependencies:
- `express` - Web framework
- `bcrypt` - Password hashing
- `passport` - Authentication middleware
- `zod` - Schema validation
- `crypto` - Secure token generation
- `../../storage` - Database storage layer
- `../../services/notifications` - Email/SMS services

## Security Features

- **Rate Limiting**: Password reset limited to 3 attempts per 15 minutes
- **Timing-Safe Comparison**: Admin password comparison resistant to timing attacks
- **Token Hashing**: Password reset tokens hashed before storage
- **Email Enumeration Prevention**: Same response for existing/non-existing emails
- **Role Validation**: Each login endpoint validates user role before granting access
- **Session Security**: Admin sessions tracked with timestamp

## Original Source

Extracted from `/Users/ao/uptend/server/routes.ts`:
- Hauler routes: Lines 611-983
- Customer routes: Lines 1308-1407
- Admin routes: Lines 1728-1939

Total: 619 lines extracted from 9,057 line monolithic file.
