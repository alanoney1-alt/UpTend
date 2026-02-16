# UpTend API Endpoint Analysis

## Frontend Calls vs Backend Routes

### CRITICAL ISSUES:

1. **Admin Auth Issue**: `/api/admin/check` checks session.isAdmin but other admin routes use requireAuth+requireAdmin (req.user.role)
2. **Missing Customer Endpoints**: Many customer dashboard endpoints missing
3. **Missing Business Dashboard Endpoints**: Business routes exist but missing specific dashboard endpoints
4. **Missing Pro Dashboard Endpoints**: Some pro endpoints missing 
5. **Service Requests Mismatch**: Frontend calls `/api/service-requests` but backend has `/api/customers/:customerId/requests`

### BROKEN ENDPOINTS TO FIX:

#### Customer (GET endpoints missing):
- ❌ `/api/service-requests` → Should route to `/api/customers/:customerId/requests` or create new endpoint
- ❌ `/api/customers/dashboard` → Need to create
- ❌ `/api/customers/profile` → Exists as PATCH only, need GET
- ❌ `/api/customers/notifications` → Need to create
- ❌ `/api/customers/history` → Need to create
- ❌ `/api/customers/jobs` → Need to create

#### Business (missing dashboard endpoints):
- ❌ `/api/business/team` → Team routes exist but need GET endpoint  
- ❌ `/api/business/billing` → Billing routes exist but need GET endpoint
- ❌ `/api/business/jobs` → Need to create
- ❌ `/api/business/booking` → Booking routes exist but need GET endpoint
- ❌ `/api/business/dashboard` → Need to create
- ❌ `/api/business/analytics` → Need to create
- ❌ `/api/business/invoices` → Need to create
- ❌ `/api/business/esg` → Need to create
- ❌ `/api/business/service-requests` → Need to create

#### Pro/Hauler (missing dashboard endpoints):
- ✅ `/api/pros/certifications` → EXISTS in hauler/academy.routes.ts
- ❌ `/api/pro/dashboard` → Need to create
- ❌ `/api/pro/schedule` → Need to create
- ❌ `/api/pro/reviews` → Need to create
- ❌ `/api/pro/notifications` → Need to create
- ❌ `/api/pro/jobs` → Need to create

#### Admin (auth issue + missing endpoints):
- 🔧 `/api/admin/check` → Fix to be consistent with other admin routes
- ❌ `/api/admin/customers` → Need to create
- ❌ `/api/admin/stats` → Need to create
- ❌ `/api/admin/service-requests` → Need to create
- ❌ `/api/admin/businesses` → Need to create
- ❌ `/api/admin/users` → Need to create (users/search exists)

#### Public (missing):
- ❌ `/api/services` → Need to create public services list
- ❌ `/api/pricing` → Need to create public pricing info

### EXISTING ENDPOINTS THAT WORK:
✅ `/api/admin/pyckers/all` - works
✅ `/api/pro/certifications` - works  
✅ `/api/pro/fee-status` - works
✅ `/api/pro/profile` - works
✅ `/api/service-requests/pending` - works
✅ Many others...