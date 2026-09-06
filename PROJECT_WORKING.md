Last updated: 2026-08-27  
Current phase: **API + role frontends available**

| Surface | URL | Roles |
| --- | --- | --- |
| API | http://localhost:4000 | JWT `/api/v1` |
| Web CRM | http://localhost:5173 | Super Admin, Admin, Reception |
| Doctor PWA | http://localhost:5174 | Doctor |

Demo password: `ChangeMe!MedFlow1`

Phase 1 database remains the source of truth. HTTP routes call existing services (`findPatientsByMobile`, `createVisit`, assignments). Clinic access is enforced on the API, not only in the UI.
