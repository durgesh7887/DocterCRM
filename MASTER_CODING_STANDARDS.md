# MASTER_CODING_STANDARDS.md

Last updated: 2026-08-27

## Language and packages

- TypeScript, `strict` true.
- Backend: Node.js, Express (from Phase 2), Mongoose.
- Frontend (later): React + TypeScript.
- ESM (`"module": "Node16"`). Import local files with `.js` extensions in TypeScript sources.

## Architecture

- Controllers stay thin. Domain rules live in `server/src/services`.
- Mongoose schemas: validation, indexes, refs, defaults. No heavy business logic in schema methods.
- Policies/middleware (Phase 2) enforce auth, RBAC, and clinic access on every mutating or sensitive read.
- Do not duplicate collections, routes, or UI modules. Inspect `server/src/models` and docs first.

## Data and security

- Hash passwords with bcrypt (or Argon2 later). Never store or log plaintext passwords. Never return `passwordHash` in APIs.
- Normalize mobiles to 10 digits before storage and lookup.
- Scope every patient/visit/follow-up/appointment query with `clinicId` plus assignment checks.
- Prefer `lean()` and field projection on list endpoints.
- Paginate. Default 20, max 100.
- Use transactions when a single user action must write visit + consultation + follow-up together and a replica set is available.
- Validate with dedicated validators (Phase 2). Do not trust client IDs.

## MongoDB

- Compound indexes from real query patterns (see `MASTER_DATABASE.md`).
- Partial unique indexes for soft-deleted uniqueness.
- Aggregation for dashboards; never load entire collections into Node to count.

## Testing

- Database rules are tested in `server/tests` with `mongodb-memory-server`.
- Add API tests when routes exist. A change to identity or isolation must update tests in the same change.

## Documentation

Keep these files aligned with code:

- `PROJECT_WORKING.md`
- `MASTER_DATABASE.md`
- `MASTER_API.md`
- `MASTER_UI_GUIDELINES.md`
- `MASTER_CODING_STANDARDS.md`

## Git

Do not commit `.env`. Do not commit secrets. Seed passwords are local development only.
