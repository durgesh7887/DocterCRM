# MedFlow CRM

Multi-clinic healthcare CRM: MongoDB foundation, REST API, web CRM, and Doctor PWA.

## Run locally

```bash
cd server
npm install
npm run dev
```

In two more terminals:

```bash
cd web
npm install
npm run dev
```

```bash
cd doctor-pwa
npm install
npm run dev
```

- API: http://localhost:4000
- Web CRM (Super Admin / Admin / Reception): web-six-virid-gza34xaqcf.vercel.app
- Doctor PWA: docter-crm-pwa.vercel.app

If MongoDB is not running, the API starts an in-memory database and seeds demo data.

## Demo logins

Password for all: `ChangeMe!MedFlow1`

| App        | Email                     |
| ---------- | ------------------------- |
| Web        | superadmin@medflow.local  |
| Web        | admin.a@medflow.local     |
| Web        | reception.a@medflow.local |
| Doctor PWA | doctor.a@medflow.local    |
