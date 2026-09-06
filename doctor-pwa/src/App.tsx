import type React from "react";
import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { api } from "./api";
import { useAuth } from "./auth";
import { Shell } from "./shell";
import { PwaInstallCard } from "./InstallPrompt";


/* ─── Helpers ────────────────────────────────────────────────────────────── */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`pwa-card ${className}`}>{children}</div>;
}
function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="pwa-card text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-brand-700">{value ?? "—"}</p>
    </div>
  );
}
function Loading() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      <p className="text-sm text-slate-400">Loading…</p>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-slate-400">{text}</p>;
}
function StatusPill({ status }: { status: string }) {
  const color: Record<string, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-800", COMPLETED: "bg-emerald-100 text-emerald-800",
    SCHEDULED: "bg-sky-100 text-sky-800", UPCOMING: "bg-sky-100 text-sky-800",
    PENDING: "bg-amber-100 text-amber-800", DUE: "bg-amber-100 text-amber-800",
    OVERDUE: "bg-red-100 text-red-800", MISSED: "bg-red-100 text-red-800",
    CANCELLED: "bg-slate-100 text-slate-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${color[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

/* ─── Login ──────────────────────────────────────────────────────────────── */
function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState("doctor.a@medflow.local");
  const [password, setPassword] = useState("ChangeMe!MedFlow1");
  const [error, setError]       = useState("");
  const [busy, setBusy]         = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-brand-950 to-brand-800">
      {/* Top branding */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 pt-12 pb-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-400 text-3xl font-extrabold text-brand-950 shadow-lg">
          M
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-white">MedFlow Doctor</h1>
        <p className="mt-1 text-sm text-brand-200/70">Your clinic companion</p>
      </div>

      {/* Form card */}
      <div className="rounded-t-3xl bg-white px-6 pt-8 pb-10">
        <h2 className="text-lg font-bold text-slate-900">Doctor sign in</h2>
        <p className="mt-0.5 text-xs text-slate-500">For admin/reception use the CRM web app.</p>
        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              const user = await login(email, password);
              if (user.role !== "DOCTOR") {
                setError("This app is for doctors only. Use the CRM web app instead.");
                return;
              }
              navigate("/");
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
            <input className="pwa-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Password</label>
            <input className="pwa-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}
          <button type="submit" disabled={busy} className="pwa-btn-primary mt-2">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Demo hint */}
        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-500 mb-2">Demo · password: ChangeMe!MedFlow1</p>
          <button
            type="button"
            onClick={() => setEmail("doctor.a@medflow.local")}
            className="text-xs text-brand-700 font-medium"
          >
            Dr. Kavya Menon — doctor.a@medflow.local
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Guard ──────────────────────────────────────────────────────────────── */
function Guard({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/* ─── Home ───────────────────────────────────────────────────────────────── */
function Home() {
  const { user, clinicId } = useAuth();
  const [clinics, setClinics] = useState<any[]>([]);
  const [dash, setDash]       = useState<any>(null);

  useEffect(() => {
    api<{ items: any[] }>("/api/v1/clinics").then((d) => setClinics(d.items));
  }, []);

  useEffect(() => {
    if (!clinicId) return;
    api(`/api/v1/clinics/${clinicId}/dashboard`).then(setDash);
  }, [clinicId]);

  const clinic = clinics.find((c) => c._id === clinicId);

  return (
    <div className="space-y-4">
      {/* Welcome */}
      <div className="pwa-card bg-gradient-to-br from-brand-700 to-brand-900 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">Welcome back</p>
        <p className="mt-1 text-lg font-bold">{user?.name}</p>
        {clinic && <p className="mt-0.5 text-sm text-brand-200">{clinic.name}</p>}
      </div>

      {/* Switch clinic link */}
      <Link to="/clinics" className="pwa-card flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏥</span>
          <div>
            <p className="text-sm font-semibold">{clinic?.name ?? "Select a clinic"}</p>
            <p className="text-xs text-slate-400">Tap to switch</p>
          </div>
        </div>
        <span className="text-slate-400">›</span>
      </Link>

      {/* Stats */}
      {dash ? (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="My patients"    value={dash.overview?.totalPatients ?? 0} />
          <Stat label="Today visits"   value={dash.overview?.todayPatients ?? 0} />
          <Stat label="Follow-ups"     value={dash.followups?.today ?? 0} />
          <Stat label="Appointments"   value={dash.overview?.todayAppointments ?? 0} />
        </div>
      ) : (
        <p className="text-center text-sm text-slate-400">Select a clinic to see today's summary.</p>
      )}

      {/* Quick nav */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { to: "/patients",      icon: "🧑‍⚕️", label: "Patients" },
          { to: "/consultations", icon: "🩺",  label: "Consultations" },
          { to: "/followups",     icon: "🔔",  label: "Follow-ups" },
          { to: "/appointments",  icon: "📅",  label: "Appointments" },
          { to: "/reports",       icon: "📈",  label: "Reports" },
          { to: "/settings",      icon: "⚙️",  label: "Settings" },
        ].map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="pwa-card flex items-center gap-3 active:bg-slate-50 transition-colors"
          >
            <span className="text-2xl">{l.icon}</span>
            <span className="text-sm font-medium">{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ─── Clinics ────────────────────────────────────────────────────────────── */
function Clinics() {
  const { setClinicId, clinicId } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api<{ items: any[] }>("/api/v1/clinics").then((d) => setItems(d.items));
  }, []);

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-bold text-slate-900">My Clinics</h1>
      {items.length === 0 ? <Empty text="No clinics assigned." /> : items.map((clinic) => (
        <button
          key={clinic._id}
          onClick={() => { setClinicId(clinic._id); navigate("/"); }}
          className={`pwa-card w-full text-left transition-all ${
            clinicId === clinic._id ? "ring-2 ring-brand-500 bg-brand-50" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">{clinic.name}</p>
              <p className="text-xs text-slate-500">📍 {clinic.address?.city ?? ""}</p>
            </div>
            {clinicId === clinic._id && (
              <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">Active</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

function needClinic() {
  return <p className="py-8 text-center text-sm text-slate-400">🏥 Select a clinic first.</p>;
}

/* ─── Patients ───────────────────────────────────────────────────────────── */
function Patients() {
  const { clinicId } = useAuth();
  const [q, setQ]       = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  if (!clinicId) return needClinic();

  return (
    <div>
      <h1 className="mb-3 text-lg font-bold">Patients</h1>
      <div className="mb-3 flex gap-2">
        <input
          className="pwa-input flex-1"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name or mobile…"
        />
        <button
          className="rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white active:bg-brand-700"
          onClick={async () => {
            setLoading(true);
            try {
              const d = await api<{ items: any[] }>(`/api/v1/clinics/${clinicId}/patients?q=${encodeURIComponent(q)}`);
              setItems(d.items);
            } finally { setLoading(false); }
          }}
        >
          Search
        </button>
      </div>
      {loading ? <Loading /> : (
        <div className="space-y-2">
          {items.map((p) => (
            <Link key={p._id} to={`/patients/${p._id}`} className="pwa-card block">
              <p className="font-semibold">{p.name}</p>
              <p className="text-xs text-slate-500">{p.patientCode} · 📱 {p.mobileNumber}</p>
            </Link>
          ))}
          {items.length === 0 && q && <Empty text="No patients found." />}
        </div>
      )}
    </div>
  );
}

/* ─── Patient Profile ────────────────────────────────────────────────────── */
function PatientProfile() {
  const { clinicId } = useAuth();
  const { patientId } = useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!clinicId || !patientId) return;
    api(`/api/v1/clinics/${clinicId}/patients/${patientId}`).then(setData);
  }, [clinicId, patientId]);

  if (!data) return <Loading />;
  const { patient, visits, consultations, followups } = data;

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-brand-700 to-brand-900 text-white">
        <p className="text-lg font-bold">{patient.name}</p>
        <p className="text-sm text-brand-200">{patient.patientCode} · 📱 {patient.mobileNumber}</p>
        <p className="text-xs text-brand-300 mt-1">{patient.gender ?? "—"}</p>
      </Card>
      <Card>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Visit history ({visits.length})</p>
        {visits.length === 0 ? <Empty text="No visits." /> : visits.slice(0, 5).map((v: any) => (
          <div key={v._id} className="border-b border-slate-50 py-2 last:border-0">
            <p className="text-sm font-medium">{v.chiefComplaint || "Visit"}</p>
            <p className="text-xs text-slate-400">{new Date(v.visitDate).toLocaleDateString()} · {v.visitType}</p>
          </div>
        ))}
      </Card>
      <Card>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Consultations ({consultations.length})</p>
        {consultations.length === 0 ? <Empty text="No consultations." /> : consultations.slice(0, 5).map((c: any) => (
          <div key={c._id} className="border-b border-slate-50 py-2 last:border-0">
            <p className="text-sm font-medium">{c.diagnosis || c.chiefComplaint || "—"}</p>
            <p className="text-xs text-slate-400">{c.notes}</p>
          </div>
        ))}
      </Card>
      <Card>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Follow-ups</p>
        {followups.length === 0 ? <Empty text="No follow-ups." /> : followups.map((f: any) => (
          <div key={f._id} className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0">
            <p className="text-sm">{new Date(f.followupDate).toLocaleDateString()}</p>
            <StatusPill status={f.status} />
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ─── Consultations ──────────────────────────────────────────────────────── */
function Consultations() {
  const { clinicId } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) return;
    api<{ items: any[] }>(`/api/v1/clinics/${clinicId}/patients`).then(async (d) => {
      try {
        const profiles = await Promise.all(
          d.items.slice(0, 8).map((p) => api<any>(`/api/v1/clinics/${clinicId}/patients/${p._id}`)),
        );
        setItems(profiles.flatMap((p) => p.consultations.map((c: any) => ({ ...c, patient: p.patient }))));
      } finally { setLoading(false); }
    });
  }, [clinicId]);

  if (!clinicId) return needClinic();
  if (loading) return <Loading />;

  return (
    <div>
      <h1 className="mb-3 text-lg font-bold">Recent Consultations</h1>
      {items.length === 0 ? <Empty text="No consultations yet." /> : (
        <div className="space-y-2">
          {items.map((c) => (
            <Card key={c._id}>
              <p className="font-semibold">{c.patient?.name}</p>
              <p className="text-sm text-slate-600">{c.diagnosis || c.chiefComplaint || "—"}</p>
              {c.notes && <p className="text-xs text-slate-400">{c.notes}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Follow-ups ─────────────────────────────────────────────────────────── */
function Followups() {
  const { clinicId } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) return;
    api<{ items: any[] }>(`/api/v1/clinics/${clinicId}/followups`)
      .then((d) => setItems(d.items))
      .finally(() => setLoading(false));
  }, [clinicId]);

  if (!clinicId) return needClinic();
  if (loading) return <Loading />;

  return (
    <div>
      <h1 className="mb-3 text-lg font-bold">Follow-ups</h1>
      {items.length === 0 ? <Empty text="No follow-ups scheduled." /> : (
        <div className="space-y-2">
          {items.map((f) => (
            <Card key={f._id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{f.patientId?.name ?? "—"}</p>
                  <p className="text-xs text-slate-400">📅 {new Date(f.followupDate).toLocaleDateString()}</p>
                </div>
                <StatusPill status={f.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Appointments ───────────────────────────────────────────────────────── */
function Appointments() {
  const { clinicId } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) return;
    api<{ items: any[] }>(`/api/v1/clinics/${clinicId}/appointments`)
      .then((d) => setItems(d.items))
      .finally(() => setLoading(false));
  }, [clinicId]);

  if (!clinicId) return needClinic();
  if (loading) return <Loading />;

  return (
    <div>
      <h1 className="mb-3 text-lg font-bold">Appointments</h1>
      {items.length === 0 ? <Empty text="No appointments scheduled." /> : (
        <div className="space-y-2">
          {items.map((a) => (
            <Card key={a._id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{a.patientId?.name ?? "—"}</p>
                  <p className="text-xs text-slate-400">📅 {new Date(a.appointmentDate).toLocaleString()}</p>
                  {a.notes && <p className="text-xs text-slate-500 mt-1">{a.notes}</p>}
                </div>
                <StatusPill status={a.status ?? "SCHEDULED"} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Reports ────────────────────────────────────────────────────────────── */
function Reports() {
  const { clinicId } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) return;
    api(`/api/v1/clinics/${clinicId}/reports`).then(setData).finally(() => setLoading(false));
  }, [clinicId]);

  if (!clinicId) return needClinic();
  if (loading) return <Loading />;

  return (
    <div>
      <h1 className="mb-3 text-lg font-bold">Reports</h1>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Patients" value={data?.patients ?? 0} />
        <Stat label="Visits"   value={data?.visits ?? 0} />
      </div>
    </div>
  );
}

/* ─── Profile ────────────────────────────────────────────────────────────── */
function Profile() {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-brand-700 to-brand-900 text-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-3xl font-extrabold">
          {user?.name?.[0] ?? "?"}
        </div>
        <p className="mt-3 text-xl font-bold">{user?.name}</p>
        <p className="text-sm text-brand-200">{user?.email}</p>
        <span className="mt-2 inline-block rounded-full bg-brand-400/30 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-brand-100">
          {user?.role}
        </span>
      </Card>
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Clinics assigned</p>
        <p className="text-sm text-slate-700">{user?.clinicIds?.length ?? 0} clinic(s)</p>
      </Card>
      <PwaInstallCard />
    </div>
  );
}

/* ─── Settings ───────────────────────────────────────────────────────────── */
function Settings() {
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-bold">Settings</h1>
      <Card>
        <p className="text-sm font-semibold text-slate-800 mb-1">Data & Privacy</p>
        <p className="text-xs text-slate-500">Clinical data is fetched live from the API and is not cached locally.</p>
      </Card>
      <PwaInstallCard />
      <Card>
        <p className="text-xs text-slate-400">MedFlow Doctor PWA · v0.1.0</p>
      </Card>
    </div>
  );
}

/* ─── App ────────────────────────────────────────────────────────────────── */
export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Guard>
            <Shell />
          </Guard>
        }
      >
        <Route index              element={<Home />} />
        <Route path="clinics"     element={<Clinics />} />
        <Route path="patients"    element={<Patients />} />
        <Route path="patients/:patientId" element={<PatientProfile />} />
        <Route path="consultations" element={<Consultations />} />
        <Route path="followups"   element={<Followups />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="reports"     element={<Reports />} />
        <Route path="profile"     element={<Profile />} />
        <Route path="settings"    element={<Settings />} />
      </Route>
    </Routes>
  );
}
