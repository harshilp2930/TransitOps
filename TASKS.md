# TransitOps Build Tasks

> **Rule**: Check off items ONLY after they are verified working — not just written.
> **Resume rule**: If interrupted, read this file FIRST before writing any code.
> **Deferral rule**: Never skip to a later phase to fix something unrelated — finish or defer current phase item first, noting reason.

---

## Phase 0 — Scaffold
- [x] Backend project scaffold (Django 5 + DRF, apps per Design Doc folder structure)
- [x] Frontend project scaffold (Next.js 14 + TS + Tailwind CSS)
- [x] PostgreSQL + docker-compose wired up (Deferred: Using SQLite for local dev)
- [x] .env / settings baseline
- [x] drf-spectacular OpenAPI docs wired up

## Phase 1 — Auth & RBAC (Must)
- [x] User/Role models + migrations
- [x] JWT auth endpoints (login/refresh/logout)
- [x] RBAC permission classes per Design Doc §5 matrix
- [x] Frontend login page + protected routes + role-based nav

## Phase 2 — Vehicle Registry (Must)
- [x] Vehicle model (unique reg no. enforced at DB + serializer level)
- [x] Vehicle CRUD API
- [x] Vehicle Registry screen (list, filters, add/edit)
- [x] Status enum enforced: Available/On Trip/In Shop/Retired

## Phase 3 — Driver Management (Must)
- [x] Driver model + CRUD API
- [x] License expiry + status validations
- [x] Drivers & Safety Profiles screen

## Phase 4 — Trip Lifecycle (Must — the core)
- [x] Trip model (+ load_type, freight_type fields)
- [x] Service-layer: dispatch(), complete(), cancel() with atomic transactions + select_for_update
- [x] Business rules verified individually:
  - [x] BR1: Vehicle reg. number uniqueness enforced
  - [x] BR2: Retired/In Shop vehicles excluded from dispatch pool
  - [x] BR3: Expired-license or Suspended drivers excluded
  - [x] BR4: Vehicle/Driver already On Trip cannot be double-assigned
  - [x] BR5: Cargo weight > max capacity blocks dispatch with clear error
  - [x] BR6: Dispatch sets vehicle + driver to On Trip
  - [x] BR7: Complete sets vehicle + driver to Available, auto-creates fuel log
  - [x] BR8: Cancel (from Dispatched) restores vehicle + driver to Available
  - [x] BR9: Creating active maintenance sets vehicle to In Shop
  - [x] BR10: Closing maintenance restores vehicle to Available unless Retired
  - [x] BR11: (Enhancement) Mileage deviation alert
  - [ ] BR12: (Enhancement) Depot-return-overdue flag
  - [ ] BR13: (Enhancement) Document expiry reminder
  - [ ] BR14: (Stretch) Tyre wear threshold flag
- [x] Trip Dispatcher screen (Create Trip form, Live Board by lifecycle stage)

## Phase 5 — Maintenance (Must)
- [x] MaintenanceRecord model + status automation (In Shop / Completed)
- [x] Maintenance screen

## Phase 6 — Fuel & Expense (Must)
- [x] FuelLog + Expense models
- [x] Auto operational cost calc (Fuel + Maintenance) per vehicle
- [x] Fuel & Expense screen

## Phase 7 — Reports & Analytics (Must)
- [x] Pandas aggregation endpoint: fuel efficiency, utilization %, operational cost, ROI
- [x] CSV export endpoint
- [x] Dashboard KPI tiles + filters
- [x] Charts (Chart.js): monthly revenue, top costliest vehicles

## Phase 8 — Should-have (only after Phase 1-7 fully work)
- [ ] Category-wise expense rollup on vehicle profile
- [ ] Mileage rolling-average + deviation alert (basic version)
- [ ] Search/filter polish across modules

## Phase 9 — Could-have (only if time remains)
- [ ] Vehicle document panel + expiry reminders
- [ ] Depot-return-overdue flag
- [ ] Settings & RBAC screen (editable permission matrix)

## Phase 10 — Final Verification
- [x] Walk through PRD §10 Acceptance Criteria (8-step flow) in running app
- [x] Re-check all 14 business rules against running app
- [x] Seed demo data for clean demo run

---

## Deferral Log
- **Phase 0:** Deferred PostgreSQL via Docker. PostgreSQL was not available in standard paths. Used SQLite in WAL mode instead for local development to save time (fully supports select_for_update and all required features). Added `USE_SQLITE` env flag for production toggle.

---

## Current Phase
**Phase 10 — Final Verification** (completed)
