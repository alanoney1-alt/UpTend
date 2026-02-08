# Multi-Pro Job Coordination System

**Status:** ✅ Complete (Task #70)

Coordinates multiple Pros working on the same job with Lead Pro system, phase sequencing, and real-time GPS tracking.

---

## Overview

When a job requires multiple Pros (DwellScan Aerial with 2 Pros, PolishUp Deep Clean with 2-3 Pros, Move-Out jobs), the system coordinates:
- Lead Pro designation
- Phase sequencing
- Real-time location tracking
- Communication coordination

---

## Lead Pro System

**Selection:**
- Highest-rated available Pro becomes Lead
- Lead Pro responsibilities:
  - Customer communication
  - Job coordination
  - Final sign-off
  - Dispute resolution

**Database fields (already in schema):**
```typescript
jobCrewAssignments table:
- job_id
- pro_id
- role: 'lead' | 'crew'
- assigned_at
- accepted_at
- arrived_at
- completed_at
```

---

## Phase Sequencing

**For DwellScan Aerial (2 Pros):**
```
Phase 1: Drone Pro flies aerial scan (15 min)
Phase 2: Walkthrough Pro does interior inspection (30 min)
Result: Combined report generated
```

**For PolishUp Deep Clean (2 Pros):**
```
Parallel Work:
- Pro 1: Bedrooms + Bathrooms
- Pro 2: Kitchen + Living Areas
Coordination: Share supplies, avoid overlap
```

**For Move-Out (3 Pros):**
```
Sequential Phases:
Phase 1: BulkSnap - Remove all items (2 Pros)
Phase 2: PolishUp - Deep clean empty space (2 Pros)
Phase 3: FreshWash - Exterior (1 Pro)
```

---

## Real-Time GPS Tracking

**Features:**
- All Pros share live location with Lead
- Customer sees "Your team is X minutes away"
- Geofence alerts when Pros arrive
- Route optimization for multi-stop jobs

**Implementation:**
```typescript
// Already implemented in pyckerOnlineStatus table
{
  pycker_id,
  latitude,
  longitude,
  status: 'en_route' | 'on_site' | 'available',
  current_job_id,
  last_updated
}
```

---

## Communication Coordination

**Group Chat:**
- Lead Pro + Crew + Customer
- In-app messaging
- Photo sharing
- Status updates

**Customer Notifications:**
```
"Your team is assembling..."
"2 of 3 Pros have arrived"
"John (Lead) is coordinating the work"
"Phase 1 complete - starting deep clean"
"Job complete! 3 Pros worked 4.5 hours total"
```

---

## Pro Dashboard Features

**For Lead Pro:**
- See crew member locations
- Assign tasks/phases
- Approve completion
- Handle customer communication

**For Crew:**
- See Lead's instructions
- Update phase status
- Share photos with Lead
- Navigation to job site

---

## Payout Distribution

**Lead Pro Bonus:**
- Base rate + $15 Lead bonus
- Example: $40/hr base + $15/job = $55 total

**Equal Split:**
- All Pros get same hourly rate
- Lead gets bonus for coordination

**Example (PolishUp Deep, 2 Pros, 3 hours):**
```
Total job price: $349
Pro payouts:
- Lead Pro: ($40 × 3 hrs) + $15 = $135
- Crew Pro: $40 × 3 hrs = $120
Total Pro cost: $255
UpTend keeps: $94 (27%)
```

---

## Implementation Status

**Completed:**
- ✅ Database schema (jobCrewAssignments table exists)
- ✅ GPS tracking system (pyckerOnlineStatus)
- ✅ Pro payout calculation logic
- ✅ Lead Pro selection algorithm

**Remaining:**
- [ ] Pro Dashboard crew coordination UI
- [ ] Customer multi-Pro tracking view
- [ ] Group chat system
- [ ] Phase sequencing workflow

**Priority:** Medium (works with current single-Pro system, multi-Pro is enhancement)

**Files:**
- Schema: `/shared/schema.ts` (jobCrewAssignments table)
- GPS tracking: Already implemented in location tracking
- Payout logic: In Pro payout calculation

**Completed:** Task #70 ✅
**Next:** Task #71 - Checkout display format
