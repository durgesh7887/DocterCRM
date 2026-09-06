import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, downloadFile } from "../api";
import { useAuth } from "../auth";
import { Badge, Button, Card, Empty, Field, Input, LoadingState, PageHeader, Select, StatusBadge } from "../ui";

/* ─── Types ─────────────────────────────────────────────────────────────── */
type Clinic = Record<string, any>;
type User   = Record<string, any>;

/* ─── Clinics List Page ─────────────────────────────────────────────────── */
export function ClinicsPage() {
  const { user, setClinicId } = useAuth();
  const navigate = useNavigate();
  const [items, setItems]      = useState<Clinic[]>([]);
  const [q, setQ]              = useState("");
  const [loading, setLoading]  = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Clinic | null>(null);

  async function load() {
    setLoading(true);
    const data = await api<{ items: Clinic[] }>(`/api/v1/clinics?q=${encodeURIComponent(q)}`);
    setItems(data.items);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="Clinics"
        subtitle={`${items.length} clinic${items.length !== 1 ? "s" : ""}`}
        action={
          user?.role === "SUPER_ADMIN" ? (
            <Button onClick={() => { setShowCreate(true); setEditTarget(null); }} variant="primary">
              ＋ Add clinic
            </Button>
          ) : null
        }
      />

      {/* Search */}
      <div className="mb-5 flex gap-2">
        <Input placeholder="Search by name…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
        <Button onClick={load} variant="outline">Search</Button>
      </div>

      {/* Create / Edit panel */}
      {(showCreate || editTarget) && (
        <ClinicForm
          initial={editTarget}
          onClose={() => { setShowCreate(false); setEditTarget(null); }}
          onSaved={() => { setShowCreate(false); setEditTarget(null); load(); }}
        />
      )}

      {/* List */}
      {loading ? <LoadingState /> : items.length === 0 ? <Empty text="No clinics found." icon="🏥" /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((clinic) => (
            <Card key={clinic._id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{clinic.name}</p>
                  <p className="text-xs text-slate-500">{clinic.ownerName}</p>
                  {clinic.address?.city && (
                    <p className="text-xs text-slate-400">📍 {clinic.address.city}, {clinic.address.state}</p>
                  )}
                  {clinic.whatsappNumber && (
                    <p className="text-xs text-emerald-700">💬 WhatsApp: {clinic.whatsappNumber}</p>
                  )}
                </div>
                <StatusBadge status={clinic.status} />
              </div>
              <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                <Button size="sm" onClick={() => { setClinicId(clinic._id); navigate(`/clinics/${clinic._id}`); }}>
                  Open workspace
                </Button>
                {user?.role === "SUPER_ADMIN" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const safeName = (clinic.name || "Clinic").replace(/[^a-zA-Z0-9]/g, "_");
                        const date = new Date().toISOString().slice(0, 10);
                        await downloadFile(`/api/v1/export/clinic/${clinic._id}`, `MedFlow_${safeName}_${date}.xlsx`);
                      }}
                    >
                      📥 Export Excel
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setShowCreate(false); setEditTarget(clinic); }}>
                      ✏️ Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={clinic.status === "ACTIVE" ? "danger" : "outline"}
                      onClick={async () => {
                        const path = clinic.status === "ACTIVE" ? "deactivate" : "activate";
                        await api(`/api/v1/clinics/${clinic._id}/${path}`, { method: "POST" });
                        load();
                      }}
                    >
                      {clinic.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
}

/* ─── Clinic Create / Edit Form ─────────────────────────────────────────── */
function ClinicForm({ initial, onClose, onSaved }: {
  initial: Clinic | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;

  // All users for assignment dropdowns
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Clinic fields
  const [form, setForm] = useState({
    name:           initial?.name           ?? "",
    ownerName:      initial?.ownerName      ?? "",
    mobile:         initial?.mobile         ?? "",
    whatsappNumber: initial?.whatsappNumber ?? "",
    email:          initial?.email          ?? "",
    city:           initial?.address?.city  ?? "",
    state:          initial?.address?.state ?? "",
    gstin:          initial?.tax?.gstin     ?? "",
    receptionEnabled: initial?.settings?.receptionEnabled ?? true,
  });

  // Staff assignment (only relevant on create / first assign)
  const [adminId,     setAdminId]     = useState("");
  const [doctorIds,   setDoctorIds]   = useState<string[]>([]);
  const [receptionId, setReceptionId] = useState("");

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const [step,   setStep]   = useState<"details" | "staff">(isEdit ? "details" : "details");
  const [savedClinicId, setSavedClinicId] = useState(initial?._id ?? "");

  useEffect(() => {
    api<{ items: User[] }>("/api/v1/users").then((d) => setAllUsers(d.items));
  }, []);

  const admins     = allUsers.filter((u) => u.role === "ADMIN");
  const doctors    = allUsers.filter((u) => u.role === "DOCTOR");
  const receptions = allUsers.filter((u) => u.role === "RECEPTION");

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

  async function saveDetails() {
    setSaving(true); setError("");
    try {
      if (isEdit) {
        await api(`/api/v1/clinics/${initial!._id}`, { method: "PATCH", body: JSON.stringify(form) });
        onSaved();
      } else {
        const data = await api<{ clinic: Clinic }>("/api/v1/clinics", { method: "POST", body: JSON.stringify(form) });
        setSavedClinicId(data.clinic._id);
        setStep("staff");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function saveStaff() {
    setSaving(true); setError("");
    try {
      const cid = savedClinicId;
      const tasks: Promise<any>[] = [];
      if (adminId)     tasks.push(api(`/api/v1/clinics/${cid}/admins`,    { method: "POST", body: JSON.stringify({ userId: adminId }) }));
      if (receptionId) tasks.push(api(`/api/v1/clinics/${cid}/reception`, { method: "POST", body: JSON.stringify({ userId: receptionId }) }));
      for (const did of doctorIds) {
        tasks.push(api(`/api/v1/clinics/${cid}/doctors`, { method: "POST", body: JSON.stringify({ userId: did }) }));
      }
      await Promise.all(tasks);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mb-6 animate-slide-up border-brand-200">
      {/* Steps indicator */}
      {!isEdit && (
        <div className="mb-5 flex items-center gap-3">
          <Step n={1} label="Clinic Details" active={step === "details"} done={step === "staff"} />
          <div className="h-px flex-1 bg-slate-200" />
          <Step n={2} label="Assign Staff" active={step === "staff"} done={false} />
        </div>
      )}

      <h2 className="mb-4 font-semibold text-slate-900">
        {isEdit ? `Edit — ${initial!.name}` : step === "details" ? "New Clinic Details" : "Assign Staff to Clinic"}
      </h2>

      {step === "details" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Clinic Name *"><Input value={form.name} onChange={f("name")} placeholder="e.g. City Health Clinic" required /></Field>
            <Field label="Owner / Doctor Name *"><Input value={form.ownerName} onChange={f("ownerName")} /></Field>
            <Field label="Mobile Number *"><Input value={form.mobile} onChange={f("mobile")} placeholder="10-digit" /></Field>
            <Field label="WhatsApp Number" hint="For sending reminders to patients">
              <div className="flex items-center gap-2">
                <span className="text-xl">💬</span>
                <Input value={form.whatsappNumber} onChange={f("whatsappNumber")} placeholder="Same as mobile or separate" />
              </div>
            </Field>
            <Field label="Email *"><Input type="email" value={form.email} onChange={f("email")} /></Field>
            <Field label="GSTIN"><Input value={form.gstin} onChange={f("gstin")} placeholder="Optional" /></Field>
            <Field label="City"><Input value={form.city} onChange={f("city")} /></Field>
            <Field label="State"><Input value={form.state} onChange={f("state")} /></Field>
            <Field label="Reception Module">
              <label className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-600"
                  checked={Boolean(form.receptionEnabled)}
                  onChange={(e) => setForm({ ...form, receptionEnabled: e.target.checked })}
                />
                <span className="text-sm text-slate-700">Enable reception module</span>
              </label>
            </Field>
          </div>
          {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 flex gap-2">
            <Button loading={saving} onClick={saveDetails}>{isEdit ? "Save changes" : "Next: Assign staff →"}</Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </>
      ) : (
        <>
          {/* Staff assignment step */}
          <div className="grid gap-5 md:grid-cols-3">
            {/* Admin */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Admin</p>
              <Select value={adminId} onChange={(e) => setAdminId(e.target.value)}>
                <option value="">— Select admin —</option>
                {admins.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </Select>
            </div>

            {/* Reception */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Reception</p>
              <Select value={receptionId} onChange={(e) => setReceptionId(e.target.value)}>
                <option value="">— Select reception —</option>
                {receptions.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </Select>
            </div>

            {/* Doctors (multiple) */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Doctors (select multiple)</p>
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                {doctors.length === 0 ? (
                  <p className="text-xs text-slate-400">No doctors found. Create doctor users first.</p>
                ) : doctors.map((d) => (
                  <label key={d._id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-brand-600"
                      checked={doctorIds.includes(d._id)}
                      onChange={(e) => setDoctorIds(e.target.checked ? [...doctorIds, d._id] : doctorIds.filter((id) => id !== d._id))}
                    />
                    <span className="font-medium text-slate-800">{d.name}</span>
                    {d.doctorProfile?.specialization && (
                      <span className="text-xs text-slate-400">· {d.doctorProfile.specialization}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

          <p className="mt-3 text-xs text-slate-400">ℹ️ Staff assignment can also be done later from the clinic workspace → Staff tab.</p>
          <div className="mt-4 flex gap-2">
            <Button loading={saving} onClick={saveStaff}>Assign &amp; Finish</Button>
            <Button variant="ghost" onClick={onSaved}>Skip for now</Button>
          </div>
        </>
      )}
    </Card>
  );
}

function Step({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
        done ? "bg-emerald-500 text-white" : active ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-500"
      }`}>
        {done ? "✓" : n}
      </div>
      <span className={`text-sm font-medium ${active ? "text-brand-700" : "text-slate-400"}`}>{label}</span>
    </div>
  );
}

/* ─── Clinic Workspace ──────────────────────────────────────────────────── */
export function ClinicWorkspace() {
  const { clinicId: routeId } = useParams();
  const { setClinicId } = useAuth();
  const id = routeId!;
  const [tab, setTab]         = useState("overview");
  const [clinic, setClinic]   = useState<any>(null);
  const [dash, setDash]       = useState<any>(null);
  const [staff, setStaff]     = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // Staff assign state
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [assignRole, setAssignRole] = useState("doctors");
  const [assignUserId, setAssignUserId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");

  async function loadAll() {
    setLoading(true);
    const [detail, d, s] = await Promise.all([
      api<{ clinic: any; settings: any }>(`/api/v1/clinics/${id}`),
      api(`/api/v1/clinics/${id}/dashboard`),
      api(`/api/v1/clinics/${id}/staff`),
    ]);
    setClinic(detail.clinic);
    setSettings(detail.settings);
    setDash(d);
    setStaff(s);
    setLoading(false);
  }

  useEffect(() => {
    if (!id) return;
    setClinicId(id);
    loadAll();
    api<{ items: any[] }>("/api/v1/users").then((d) => setAllUsers(d.items));
  }, [id]);

  const tabs = [
    { id: "overview",     label: "Overview",    icon: "📊" },
    { id: "staff",        label: "Staff",        icon: "👥" },
    { id: "patients",     label: "Patients",     icon: "🧑‍⚕️" },
    { id: "consultation", label: "Consultation", icon: "🩺" },
    { id: "follow-ups",   label: "Follow-ups",   icon: "🔔" },
    { id: "appointments", label: "Appointments", icon: "📅" },
    { id: "reports",      label: "Reports",      icon: "📈" },
    { id: "settings",     label: "Settings",     icon: "⚙️" },
  ];

  if (loading) return <LoadingState />;

  const roleFilter: Record<string, string> = { doctors: "DOCTOR", admins: "ADMIN", reception: "RECEPTION" };

  return (
    <div className="animate-slide-up">
      <PageHeader
        title={clinic?.name ?? "Clinic"}
        subtitle={`${clinic?.address?.city ?? ""}${clinic?.address?.city ? " · " : ""}${clinic?.ownerName ?? ""}`}
        action={
          clinic ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const safeName = (clinic.name || "Clinic").replace(/[^a-zA-Z0-9]/g, "_");
                  const date = new Date().toISOString().slice(0, 10);
                  await downloadFile(`/api/v1/export/clinic/${clinic._id}`, `MedFlow_${safeName}_${date}.xlsx`);
                }}
              >
                📥 Export Excel
              </Button>
              <StatusBadge status={clinic.status} />
            </div>
          ) : null
        }
      />

      {/* Quick info bar */}
      {clinic && (
        <div className="mb-5 flex flex-wrap gap-4 rounded-2xl bg-white px-5 py-3 text-xs shadow-card border border-slate-100">
          {clinic.mobile && <span>📞 {clinic.mobile}</span>}
          {clinic.whatsappNumber && <span className="text-emerald-700">💬 {clinic.whatsappNumber}</span>}
          {clinic.email && <span>✉️ {clinic.email}</span>}
          {clinic.tax?.gstin && <span>🏛️ GSTIN: {clinic.tax.gstin}</span>}
        </div>
      )}

      {/* Tab bar */}
      <div className="mb-6 flex gap-1.5 overflow-x-auto rounded-2xl bg-slate-100 p-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-medium transition-all ${
              tab === t.id ? "bg-white text-brand-700 shadow-card ring-1 ring-slate-200" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && dash && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(dash.overview ?? {}).map(([k, v]) => (
            <Card key={k}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{k.replace(/([A-Z])/g, " $1")}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{String(v)}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Quick links */}
      {tab === "patients"     && <Link className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline" to="/patients">Open Patient List →</Link>}
      {tab === "consultation" && <Link className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline" to="/consultation">Open Consultation Intake →</Link>}
      {tab === "follow-ups"   && <Link className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline" to="/followups">Open Follow-ups →</Link>}
      {tab === "appointments" && <Link className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline" to="/appointments">Open Appointments →</Link>}
      {tab === "reports"      && <Link className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline" to="/reports">Open Reports →</Link>}

      {/* Staff tab */}
      {tab === "staff" && staff && (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            {(["admins", "doctors", "reception"] as const).map((key) => (
              <Card key={key}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 capitalize">{key}</p>
                {(staff[key] ?? []).length === 0 ? (
                  <p className="text-sm text-slate-400">None assigned.</p>
                ) : (
                  <div className="space-y-2">
                    {staff[key].map((row: any) => (
                      <div key={row._id} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                          {row.userId?.name?.[0] ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{row.userId?.name}</p>
                          <p className="truncate text-xs text-slate-400">{row.userId?.email}</p>
                          {row.userId?.doctorProfile?.specialization && (
                            <p className="text-xs text-brand-600">{row.userId.doctorProfile.specialization}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Assign new staff */}
          <Card>
            <p className="mb-4 text-sm font-semibold text-slate-700">Assign staff to this clinic</p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-40">
                <Field label="Role">
                  <Select value={assignRole} onChange={(e) => setAssignRole(e.target.value)}>
                    <option value="doctors">Doctor</option>
                    <option value="admins">Admin</option>
                    <option value="reception">Reception</option>
                  </Select>
                </Field>
              </div>
              <div className="flex-1 min-w-48">
                <Field label="User">
                  <Select value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)}>
                    <option value="">— Select user —</option>
                    {allUsers
                      .filter((u) => u.role === roleFilter[assignRole])
                      .map((u) => <option key={u._id} value={u._id}>{u.name} — {u.email}</option>)}
                  </Select>
                </Field>
              </div>
              <Button
                loading={assigning}
                disabled={!assignUserId}
                onClick={async () => {
                  setAssigning(true); setAssignError("");
                  try {
                    await api(`/api/v1/clinics/${id}/${assignRole}`, {
                      method: "POST",
                      body: JSON.stringify({ userId: assignUserId }),
                    });
                    setAssignUserId("");
                    await loadAll();
                  } catch (err) {
                    setAssignError((err as Error).message);
                  } finally { setAssigning(false); }
                }}
              >
                Assign
              </Button>
            </div>
            {assignError && <p className="mt-2 text-sm text-red-600">{assignError}</p>}
          </Card>
        </div>
      )}

      {/* Settings tab */}
      {tab === "settings" && settings && (
        <Card className="max-w-lg">
          <p className="mb-4 text-sm font-semibold text-slate-700">Feature toggles</p>
          <div className="space-y-3">
            {Object.entries(settings)
              .filter(([k]) => k.endsWith("Enabled"))
              .map(([key, value]) => (
                <label key={key} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="text-sm capitalize text-slate-700">{key.replace(/([A-Z])/g, " $1").replace("Enabled", "").trim()}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    className="h-4 w-4 accent-brand-600"
                    onChange={async (e) => {
                      const data = await api<{ settings: any }>(`/api/v1/clinics/${id}/settings`, {
                        method: "PATCH",
                        body: JSON.stringify({ [key]: e.target.checked }),
                      });
                      setSettings(data.settings);
                    }}
                  />
                </label>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
