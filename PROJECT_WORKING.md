Last updated: 2026-08-27  
Current phase: **API + role frontends available**

| Surface    | URL                                 | Roles                         |
| ---------- | ----------------------------------- | ----------------------------- |
| API        | http://localhost:4000               | JWT `/api/v1`                 |
| Web CRM    | web-six-virid-gza34xaqcf.vercel.app | Super Admin, Admin, Reception |
| Doctor PWA | docter-crm-pwa.vercel.app           | Doctor                        |

Demo password: `ChangeMe!MedFlow1`

Phase 1 database remains the source of truth. HTTP routes call existing services (`findPatientsByMobile`, `createVisit`, assignments). Clinic access is enforced on the API, not only in the UI.
