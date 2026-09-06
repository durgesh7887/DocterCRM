import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { Card, Empty, LoadingState, PageHeader, Stat, StatusBadge } from "../ui";

export function HomePage() {
  const { user } = useAuth();
  if (user?.role === "SUPER_ADMIN") return <SuperDashboard />;
  if (user?.role === "ADMIN") return <AdminHome />;
  return <ClinicOpsDashboard />;
}

/* ─── Super Admin Dashboard ─────────────────────────────────────────────── */
function SuperDashboard() {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Record<string, any>>("/api/v1/dashboard")
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <Empty text={error} icon="⚠️" />;
  if (!data) return <LoadingState text="Loading dashboard…" />;

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="System Overview"
        subtitle="Live counts from MongoDB — refreshes on page load"
      />

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total Clinics"   value={data.totalClinics}   icon="🏥" color="brand" />
        <Stat label="Active Clinics"  value={data.activeClinics}  icon="✅" color="emerald" />
        <Stat label="Total Patients"  value={data.totalPatients}  icon="🧑‍⚕️" color="sky" />
        <Stat label="Pending Follow-ups" value={data.pendingFollowups} icon="🔔" color="amber" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Doctors"    value={data.totalDoctors}    icon="👨‍⚕️" color="brand" />
        <Stat label="Admins"     value={data.totalAdmins}     icon="👤" color="sky" />
        <Stat label="Reception"  value={data.totalReception}  icon="🗂️" color="emerald" />
        <Stat label="Inactive Clinics" value={data.inactiveClinics} icon="⏸️" color="red" />
      </div>

      {/* Revenue + Recent clinics */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Revenue</p>
          <p className="mt-2 text-4xl font-extrabold text-slate-900">₹{(data.revenue?.total ?? 0).toLocaleString()}</p>
          <div className="mt-3 flex gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Pending: {data.revenue?.pendingPayments ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              Overdue: {data.revenue?.overduePayments ?? 0}
            </span>
          </div>
        </Card>

        <Card>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Recent Clinics</p>
          <div className="space-y-2">
            {(data.recentClinics ?? []).map((clinic: any) => (
              <div key={clinic._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-sm font-medium text-slate-800">{clinic.name}</span>
                <StatusBadge status={clinic.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick links */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { to: "/clinics", label: "Manage Clinics", icon: "🏥", desc: "View, create, activate clinics" },
          { to: "/users",   label: "Manage Users",   icon: "👥", desc: "Create staff and assign roles" },
          { to: "/payments",label: "Payments",       icon: "💳", desc: "Track billing and subscriptions" },
        ].map((l) => (
          <Link key={l.to} to={l.to}>
            <Card className="group cursor-pointer transition-all hover:-translate-y-0.5">
              <p className="text-2xl">{l.icon}</p>
              <p className="mt-2 font-semibold text-slate-900 group-hover:text-brand-700">{l.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{l.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ─── Admin Home ─────────────────────────────────────────────────────────── */
function AdminHome() {
  const { setClinicId } = useAuth();
  const navigate = useNavigate();
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ items: any[] }>("/api/v1/clinics")
      .then((d) => setClinics(d.items))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div className="animate-slide-up">
      <PageHeader title="My Clinics" subtitle="Clinics assigned to your account" />
      {clinics.length === 0 ? (
        <Empty text="No clinics assigned to your account." icon="🏥" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clinics.map((clinic) => (
            <Card key={clinic._id} className="group cursor-pointer transition-all hover:-translate-y-0.5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{clinic.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {clinic.address?.city ?? ""}{clinic.address?.city && clinic.address?.state ? ", " : ""}{clinic.address?.state ?? ""}
                  </p>
                </div>
                <StatusBadge status={clinic.status} />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Reception {clinic.settings?.receptionEnabled ? "✅ enabled" : "❌ disabled"}
                </span>
                <button
                  className="rounded-xl bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-brand-700 group-hover:shadow-glow"
                  onClick={() => { setClinicId(clinic._id); navigate(`/clinics/${clinic._id}`); }}
                >
                  Open →
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Clinic Ops Dashboard (Reception) ──────────────────────────────────── */
function ClinicOpsDashboard() {
  const { clinicId, setClinicId } = useAuth();
  const [clinics, setClinics]     = useState<any[]>([]);
  const [data, setData]           = useState<any>(null);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    api<{ items: any[] }>("/api/v1/clinics").then((d) => {
      setClinics(d.items);
      if (!clinicId && d.items[0]) setClinicId(d.items[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!clinicId) return;
    setLoading(true);
    api(`/api/v1/clinics/${clinicId}/dashboard`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [clinicId]);

  const activeName = clinics.find((c) => c._id === clinicId)?.name;

  return (
    <div className="animate-slide-up">
      <PageHeader
        title={activeName ? `Today at ${activeName}` : "Today at the Clinic"}
        subtitle="Live stats for the selected clinic"
        action={
          clinics.length > 1 ? (
            <select
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              value={clinicId ?? ""}
              onChange={(e) => setClinicId(e.target.value)}
            >
              {clinics.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          ) : null
        }
      />

      {loading || !data ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Stat label="Total Patients"      value={data?.overview?.totalPatients  ?? 0} icon="🧑‍⚕️" color="brand" />
            <Stat label="Today's Visits"      value={data?.overview?.todayPatients  ?? 0} icon="🩺"  color="emerald" />
            <Stat label="Today's Appointments"value={data?.overview?.todayAppointments ?? 0} icon="📅" color="sky" />
            <Stat label="Follow-ups Today"    value={data?.followups?.today  ?? 0}       icon="🔔"  color="amber" />
            <Stat label="Pending Follow-ups"  value={data?.followups?.pending ?? 0}      icon="⏳"  color="amber" />
            <Stat label="Overdue Follow-ups"  value={data?.followups?.overdue ?? 0}      icon="⚠️" color="red" />
          </div>

          {/* Quick actions */}
          <div className="mt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Quick actions</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { to: "/consultation", icon: "🩺", label: "New Consultation", desc: "Search patient by mobile" },
                { to: "/patients",     icon: "🧑‍⚕️", label: "Patient Search",   desc: "Find any patient" },
                { to: "/followups",    icon: "🔔", label: "Follow-ups",        desc: "View & complete" },
                { to: "/appointments", icon: "📅", label: "Appointments",      desc: "Schedule & manage" },
              ].map((a) => (
                <Link key={a.to} to={a.to}>
                  <Card className="group cursor-pointer text-center transition-all hover:-translate-y-0.5">
                    <p className="text-3xl">{a.icon}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800 group-hover:text-brand-700">{a.label}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{a.desc}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
