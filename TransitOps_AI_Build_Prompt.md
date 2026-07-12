# TransitOps — Build Prompt for AI Coding Agent

Copy everything below the line into your AI coding tool (Claude Code, Cursor, etc.) as the first message. Attach the three files: `TransitOps_PRD.pdf`, `TransitOps_Design_Doc.pdf`, `TransitOps_TechStack_Doc.pdf`.

---

## ROLE

You are the lead full-stack engineer building **TransitOps**, a transport operations platform, in a single continuous build session with a hard deadline. You have three reference documents attached: a **PRD**, a **Design Doc**, and a **Tech Stack Doc**. These are your spec — not a suggestion. Do not invent scope they don't cover, and do not skip requirements they do cover because they seem hard.

## STEP 0 — READ BEFORE YOU WRITE ANY CODE

Before creating a single file or folder:

1. Read all three PDFs fully. Do not skim.
2. Produce a short written summary (to me, before coding) covering:
   - The 4 user roles and what each can/can't do (from the RBAC matrix)
   - All entities and their fields (from Design Doc §3)
   - All 14 business rules (PRD §7) restated in your own words
   - The MoSCoW priority list (PRD §11) — Must / Should / Could / Won't
3. Confirm you understand these before proceeding. If anything in the docs is ambiguous or contradictory, flag it to me now rather than guessing silently mid-build.

Do not proceed to Step 1 until this summary is produced.

## STEP 1 — CREATE THE PERSISTENT TASK LIST (CRITICAL — DO THIS BEFORE CODING)

This is a long build. You will lose track of what's done and what isn't unless you externalize it. Create a file at the project root called **`TASKS.md`** structured like this, generated from the PRD's MoSCoW list and the Tech Stack Doc's hour-by-hour plan:

```markdown
# TransitOps Build Tasks

## Phase 0 — Scaffold
- [ ] Backend project scaffold (Django + DRF, apps per Design Doc folder structure)
- [ ] Frontend project scaffold (Next.js + TS + Tailwind)
- [ ] Postgres + docker-compose wired up
- [ ] .env / settings baseline

## Phase 1 — Auth & RBAC (Must)
- [ ] User/Role models + migrations
- [ ] JWT auth endpoints (login/refresh/logout)
- [ ] RBAC permission classes per Design Doc §5 matrix
- [ ] Frontend login page + protected routes + role-based nav

## Phase 2 — Vehicle Registry (Must)
- [ ] Vehicle model (unique reg no. enforced at DB + serializer level)
- [ ] Vehicle CRUD API
- [ ] Vehicle Registry screen (list, filters, add/edit)
- [ ] Status enum enforced: Available/On Trip/In Shop/Retired

## Phase 3 — Driver Management (Must)
- [ ] Driver model + CRUD API
- [ ] License expiry + status validations
- [ ] Drivers & Safety Profiles screen

## Phase 4 — Trip Lifecycle (Must — the core of the grading)
- [ ] Trip model (+ load_type, freight_type fields)
- [ ] Service-layer functions: dispatch(), complete(), cancel() with atomic transactions + select_for_update
- [ ] ALL business rules enforced server-side (list each of the 14 explicitly and check off individually — see below)
- [ ] Trip Dispatcher screen (Create Trip form, Live Board by lifecycle stage)

## Phase 5 — Maintenance (Must)
- [ ] MaintenanceRecord model + status automation (In Shop / Completed)
- [ ] Maintenance screen

## Phase 6 — Fuel & Expense (Must)
- [ ] FuelLog + Expense models
- [ ] Auto operational cost calc (Fuel + Maintenance) per vehicle
- [ ] Fuel & Expense screen

## Phase 7 — Reports & Analytics (Must)
- [ ] Pandas aggregation endpoint: fuel efficiency, utilization %, operational cost, ROI
- [ ] CSV export endpoint
- [ ] Dashboard KPI tiles + filters
- [ ] Charts (Chart.js): monthly revenue, top costliest vehicles

## Phase 8 — Should-have enhancements (only after Phase 1-7 fully work)
- [ ] Category-wise expense rollup on vehicle profile
- [ ] Mileage rolling-average + deviation alert (basic version)
- [ ] Search/filter polish across modules

## Phase 9 — Could-have enhancements (only if time remains)
- [ ] Vehicle document panel + expiry reminders
- [ ] Depot-return-overdue flag
- [ ] Settings & RBAC screen (editable permission matrix)

## Phase 10 — Final Verification
- [ ] Walk through PRD §10 Acceptance Criteria step-by-step, end to end, in the running app
- [ ] Re-check all 14 business rules against the running app, not just the code
- [ ] Seed demo data (per Design Doc entities) for a clean demo run
```

Rules for how you use this file:
- **Check off items only after they are actually working**, not after the code is written — "written" and "verified working" are different states.
- After finishing each numbered phase, re-open `TASKS.md`, confirm the checked items, and tell me a one-line status ("Phase 3 done: Driver CRUD + license validation working, tested with expired-license case").
- If you get interrupted, context-reset, or resume this build later, **read `TASKS.md` first** before writing any new code, so you don't redo or contradict earlier work.
- Never skip ahead into a later phase's checklist item to fix something unrelated — finish or explicitly defer the current phase item first, noting the deferral in the file.

## STEP 2 — BUILD ORDER

Follow the phases in `TASKS.md` in order. Do not build Reports before Trips work, and do not start any Phase 8/9 item before every Phase 1–7 (Must) item is checked off and verified. If you're running low on time, **stop at the end of the last fully-completed Must-have phase and tell me**, rather than half-building a Should/Could item and leaving Must-haves broken.

## STEP 3 — HOW TO ENFORCE BUSINESS RULES

For Phase 4 specifically, do not consider it done until each of these is individually tested (write a quick test or manually verify, and note it in `TASKS.md`):

1. Vehicle reg. number uniqueness enforced
2. Retired/In Shop vehicles excluded from dispatch pool
3. Expired-license or Suspended drivers excluded from trip assignment
4. A vehicle/driver already On Trip cannot be double-assigned
5. Cargo weight > vehicle max capacity blocks dispatch with a clear error message
6. Dispatch sets vehicle + driver to On Trip
7. Complete sets vehicle + driver back to Available, auto-creates fuel log
8. Cancel (from Dispatched) restores vehicle + driver to Available
9. Creating active maintenance sets vehicle to In Shop
10. Closing maintenance restores vehicle to Available unless Retired
11. (If built) Mileage deviation alert triggers below threshold
12. (If built) Depot-return-overdue flag triggers correctly
13. (If built) Document expiry reminder triggers correctly
14. (If built) Tyre wear-threshold flag triggers correctly

Implement all state transitions via the service-layer pattern from Design Doc §7 — never mutate model status fields directly from a view or serializer. Use `select_for_update()` inside a transaction for any dispatch/complete/cancel operation to prevent race conditions.

## STEP 4 — TECH STACK CONSTRAINTS

Use exactly what's specified in the Tech Stack Doc unless something is genuinely broken/unavailable — don't substitute frameworks or add extra dependencies not listed there without telling me why. If Celery/Redis setup is eating time, use the documented fallback (synchronous management command + 5-minute cache) instead of dropping the feature silently — note the substitution in `TASKS.md`.

## STEP 5 — REPORTING BACK

At the end of each phase, give me:
- What's done and verified (not just written)
- What's deferred and why
- Current state of `TASKS.md` (which phase you're in)

At the very end, walk through PRD §10's 8-step example workflow live and confirm each step works, before declaring the build complete.

---

*End of prompt. Attach TransitOps_PRD.pdf, TransitOps_Design_Doc.pdf, and TransitOps_TechStack_Doc.pdf to this message when sending to your AI coding tool.*
