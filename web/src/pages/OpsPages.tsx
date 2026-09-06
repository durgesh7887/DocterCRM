import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import {
  Badge, Button, Card, Empty, Field, Input, LoadingState,
  PageHeader, Select, Stat, StatusBadge, Table, Td, Tr,
} from "../ui";

/* ─── Users Page ─────────────────────────────────────────────────────────── */
export function UsersPage() {
  const [items, setItems]   = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "ChangeMe!MedFlow1",
    role: "ADMIN", mobileNumber: "", clinicId: "",
  });

  async function load() {
    setLoading(true);
    try {
      const [usersData, clinicsData] = await Promise.all([
        api<{ items: any[] }>("/api/v1/users"),
        api<{ items: any[] }>("/api/v1/clinics"),
      ]);
      setItems(usersData.items);
      setClinics(clinicsData.items);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const roleColor: Record<string, "info" | "success" | "warning" | "neutral"> = {
    SUPER_ADMIN: "info", ADMIN: "success", DOCTOR: "warning", RECEPTION: "neutral",
  };

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="Users"
        subtitle="All staff accounts · passwords are hashed and cannot be viewed"
        action={
          <Button onClick={() => setShowForm((s) => !s)} variant={showForm ? "ghost" : "primary"}>
            {showForm ? "Cancel" : "＋ Create user"}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 animate-slide-up">
          <h2 className="mb-4 font-semibold">Create user</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Full name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Password"><Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
            <Field label="Mobile"><Input value={form.mobileNumber} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} /></Field>
            <Field label="Role">
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="ADMIN">Admin</option>
                <option value="DOCTOR">Doctor</option>
                <option value="RECEPTION">Reception</option>
              </Select>
            </Field>
            <Field label="Assign to clinic">
              <Select value={form.clinicId} onChange={(e) => setForm({ ...form, clinicId: e.target.value })}>
                <option value="">— None —</option>
                {clinics.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </Select>
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              loading={creating}
              onClick={async () => {
                setCreating(true);
                try {
                  await api("/api/v1/users", { method: "POST", body: JSON.stringify(form) });
                  setShowForm(false);
                  setForm({ name: "", email: "", password: "ChangeMe!MedFlow1", role: "ADMIN", mobileNumber: "", clinicId: "" });
                  load();
                } finally { setCreating(false); }
              }}
            >
              Create
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {loading ? <LoadingState /> : (
        <Table headers={["Name", "Email", "Role", "Assigned Clinics", "Status"]}>
          {items.map((user) => (
            <Tr key={user._id}>
              <Td><span className="font-medium text-slate-900">{user.name}</span></Td>
              <Td><span className="font-mono text-xs">{user.email}</span></Td>
              <Td><Badge variant={roleColor[user.role] ?? "neutral"}>{user.role}</Badge></Td>
              <Td>{(user.assignedClinics ?? []).join(", ") || <span className="text-slate-400">—</span>}</Td>
              <Td><StatusBadge status={user.status ?? "ACTIVE"} /></Td>
            </Tr>
          ))}
        </Table>
      )}
    </div>
  );
}

/* ─── Payments Page ─────────────────────────────────────────────────────── */
export function PaymentsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/v1/payments").then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div className="animate-slide-up">
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Total Revenue"   value={`₹${(data?.totalRevenue ?? 0).toLocaleString()}`} icon="💰" color="emerald" />
        <Stat label="Total Records"   value={data?.total ?? 0} icon="📋" color="brand" />
        <Stat label="Current Page"    value={`Page ${data?.page ?? 1}`} icon="📄" color="sky" />
      </div>
      <PageHeader title="Payments" subtitle="All billing history" />
      <Table headers={["Clinic", "Status", "Amount", "Paid", "Method", "Due"]}>
        {(data?.items ?? []).map((p: any) => (
          <Tr key={p._id}>
            <Td><span className="font-medium">{p.clinicId?.name ?? "—"}</span></Td>
            <Td><StatusBadge status={p.status} /></Td>
            <Td>₹{(p.amount ?? 0).toLocaleString()}</Td>
            <Td>₹{(p.paidAmount ?? 0).toLocaleString()}</Td>
            <Td>{p.method ?? <span className="text-slate-400">—</span>}</Td>
            <Td className="text-xs text-slate-400">{p.dueDate ? new Date(p.dueDate).toLocaleDateString() : "—"}</Td>
          </Tr>
        ))}
      </Table>
    </div>
  );
}

/* ─── Subscriptions Page ────────────────────────────────────────────────── */
export function SubscriptionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<{ items: any[] }>("/api/v1/subscriptions").then((d) => setItems(d.items)).finally(() => setLoading(false));
  }, []);
  if (loading) return <LoadingState />;
  return (
    <div className="animate-slide-up">
      <PageHeader title="Subscriptions" subtitle="Clinic subscription plans" />
      <Table headers={["Clinic", "Plan", "Cycle", "Amount", "Status", "Next Due"]}>
        {items.map((s) => (
          <Tr key={s._id}>
            <Td><span className="font-medium">{s.clinicId?.name ?? "—"}</span></Td>
            <Td>{s.planName}</Td>
            <Td><Badge variant="neutral">{s.billingCycle}</Badge></Td>
            <Td>₹{(s.amount ?? 0).toLocaleString()}</Td>
            <Td><StatusBadge status={s.status} /></Td>
            <Td className="text-xs text-slate-400">{s.nextDueDate ? new Date(s.nextDueDate).toLocaleDateString() : "—"}</Td>
          </Tr>
        ))}
      </Table>
    </div>
  );
}

/* ─── Audit Logs ────────────────────────────────────────────────────────── */
export function AuditPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<{ items: any[] }>("/api/v1/audit-logs").then((d) => setItems(d.items)).finally(() => setLoading(false));
  }, []);
  if (loading) return <LoadingState />;
  return (
    <div className="animate-slide-up">
      <PageHeader title="Audit Logs" subtitle="Append-only action history · Super Admin only" />
      <Table headers={["Action", "Module", "Actor", "Clinic", "When"]}>
        {items.map((log) => (
          <Tr key={log._id}>
            <Td><span className="font-medium text-slate-900">{log.action}</span></Td>
            <Td><Badge variant="info">{log.module}</Badge></Td>
            <Td>{log.actorUserId?.name ?? "—"}</Td>
            <Td>{log.clinicId?.name ?? <span className="text-slate-400">system</span>}</Td>
            <Td className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</Td>
          </Tr>
        ))}
      </Table>
    </div>
  );
}

/* ─── Settings Page ─────────────────────────────────────────────────────── */
export function SettingsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<{ items: any[] }>("/api/v1/settings").then((d) => setItems(d.items)).finally(() => setLoading(false));
  }, []);
  if (loading) return <LoadingState />;
  return (
    <div className="animate-slide-up">
      <PageHeader title="System Settings" subtitle="Global key-value configuration" />
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((s) => (
          <Card key={s._id} className="flex items-center justify-between">
            <span className="font-mono text-sm text-slate-700">{s.key}</span>
            <Badge variant="neutral">{String(s.value)}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── Consultation Page ─────────────────────────────────────────────────── */
export function ConsultationPage() {
  const { clinicId } = useAuth();
  const [mobile, setMobile]     = useState("9876543210");
  const [matches, setMatches]   = useState<any[] | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [doctors, setDoctors]   = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "", gender: "UNSPECIFIED", chiefComplaint: "", diagnosis: "",
    notes: "", followUpRequired: true, followUpAfterDays: 7, doctorId: "",
  });
  // Family member state
  const [addingFamily, setAddingFamily]   = useState(false);
  const [familyForm, setFamilyForm]       = useState({ name: "", gender: "UNSPECIFIED" });
  const [addingFamilyBusy, setAddingFamilyBusy] = useState(false);

  const [message, setMessage]         = useState("");
  const [error, setError]             = useState("");
  const [searching, setSearching]     = useState(false);
  const [saving, setSaving]           = useState(false);
  const [creatingPatient, setCreatingPatient] = useState(false);

  useEffect(() => {
    if (!clinicId) return;
    api<{ items: any[] }>(`/api/v1/clinics/${clinicId}/doctors`).then((d) => setDoctors(d.items));
  }, [clinicId]);

  async function doSearch() {
    setSearching(true); setError(""); setSelected(null); setMessage(""); setAddingFamily(false);
    try {
      const data = await api<{ patients: any[] }>(`/api/v1/clinics/${clinicId}/patients/lookup?mobile=${encodeURIComponent(mobile)}`);
      setMatches(data.patients);
    } catch (err) { setError((err as Error).message); }
    finally { setSearching(false); }
  }

  async function addFamilyMember() {
    if (!matches || matches.length === 0) return;
    setAddingFamilyBusy(true); setError("");
    try {
      const owner = matches.find((p) => p.isMobileOwner) ?? matches[0];
      const data = await api<{ patient: any }>(`/api/v1/clinics/${clinicId}/patients`, {
        method: "POST",
        body: JSON.stringify({
          name: familyForm.name,
          mobileNumber: mobile,
          gender: familyForm.gender,
          isMobileOwner: false,
          allowDuplicateMobile: true,
          familyId: owner.familyId ?? undefined,
        }),
      });
      setMatches([...matches, data.patient]);
      setAddingFamily(false);
      setFamilyForm({ name: "", gender: "UNSPECIFIED" });
    } catch (err) {
      setError((err as Error).message);
    } finally { setAddingFamilyBusy(false); }
  }


  if (!clinicId) return <Empty text="Select a clinic first." icon="🏥" />;

  return (
    <div className="animate-slide-up max-w-2xl">
      <PageHeader title="Consultation" subtitle="Mobile lookup → patient → visit → consultation" />

      {/* Step 1: Mobile lookup */}
      <Card>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Step 1 — Find patient</p>
        <Field label="Mobile number">
          <div className="flex gap-2">
            <Input
              value={mobile}
              onChange={(e) => { setMobile(e.target.value); setMatches(null); setSelected(null); setMessage(""); setError(""); setAddingFamily(false); }}
              placeholder="10-digit mobile"
              maxLength={10}
            />
            <Button loading={searching} onClick={doSearch}>Search</Button>
          </div>
        </Field>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        {/* Existing patients + Add family member */}
        {matches && matches.length > 0 && (
          <div className="mt-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <p className="flex-1 text-xs font-semibold text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                ⚠️ Existing patients on this mobile — select one or add a family member.
              </p>
              <Button size="sm" variant="outline" onClick={() => setAddingFamily((v) => !v)}>
                {addingFamily ? "Cancel" : "＋ Add family member"}
              </Button>
            </div>

            {/* Add family member inline form */}
            {addingFamily && (
              <div className="mb-4 rounded-2xl border border-brand-200 bg-brand-50 p-4 animate-slide-up">
                <p className="mb-3 text-sm font-semibold text-brand-800">Add family member (mobile: {mobile})</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Full name">
                    <Input value={familyForm.name} onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })} placeholder="Member's name" />
                  </Field>
                  <Field label="Gender">
                    <Select value={familyForm.gender} onChange={(e) => setFamilyForm({ ...familyForm, gender: e.target.value })}>
                      <option value="UNSPECIFIED">Unspecified</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </Select>
                  </Field>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button loading={addingFamilyBusy} onClick={addFamilyMember} disabled={!familyForm.name}>
                    Add family member
                  </Button>
                  <Button variant="ghost" onClick={() => setAddingFamily(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {/* Patient selector list */}
            <div className="space-y-2">
              {matches.map((p) => (
                <button
                  key={p._id}
                  onClick={() => setSelected(p)}
                  className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                    selected?._id === p._id
                      ? "border-brand-400 bg-brand-50 ring-1 ring-brand-200"
                      : "border-slate-200 hover:border-brand-200 hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <p className="font-medium text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.patientCode} · {p.gender}</p>
                  </div>
                  <Badge variant={p.isMobileOwner ? "success" : "info"}>
                    {p.isMobileOwner ? "Mobile owner" : "Family member"}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )}


        {/* Create new patient */}
        {matches && matches.length === 0 && !selected && (
          <div className="mt-4">
            <p className="mb-3 text-xs font-semibold text-slate-500">No patient found for this mobile — create one:</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Gender">
                <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="UNSPECIFIED">Unspecified</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </Select>
              </Field>
            </div>
            <Button
              className="mt-3"
              loading={creatingPatient}
              onClick={async () => {
                setCreatingPatient(true);
                try {
                  const data = await api<{ patient: any }>(`/api/v1/clinics/${clinicId}/patients`, {
                    method: "POST",
                    body: JSON.stringify({ name: form.name, mobileNumber: mobile, gender: form.gender }),
                  });
                  setSelected(data.patient);
                  setMatches([data.patient]);
                } finally { setCreatingPatient(false); }
              }}
            >
              Create patient
            </Button>
          </div>
        )}
      </Card>

      {/* Step 2: Visit + Consultation */}
      {selected && (
        <Card className="mt-4 animate-slide-up">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Step 2 — Visit & consultation for <span className="text-brand-700">{selected.name}</span></p>
          <div className="space-y-4">
            <Field label="Doctor">
              <Select value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}>
                <option value="">Select doctor</option>
                {doctors.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </Select>
            </Field>
            <Field label="Chief complaint">
              <Input value={form.chiefComplaint} onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })} placeholder="e.g. Fever, back pain" />
            </Field>
            <Field label="Diagnosis">
              <Input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} placeholder="e.g. Viral fever" />
            </Field>
            <Field label="Notes">
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes" />
            </Field>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand-600"
                checked={form.followUpRequired}
                onChange={(e) => setForm({ ...form, followUpRequired: e.target.checked })}
              />
              <span className="font-medium text-slate-700">Schedule follow-up</span>
            </label>
            {form.followUpRequired && (
              <Field label="Follow-up after (days)">
                <Input
                  type="number"
                  min={1}
                  value={form.followUpAfterDays}
                  onChange={(e) => setForm({ ...form, followUpAfterDays: Number(e.target.value) })}
                />
              </Field>
            )}
            <Button
              loading={saving}
              onClick={async () => {
                setSaving(true); setMessage(""); setError("");
                try {
                  const visitRes = await api<{ visit: any }>(`/api/v1/clinics/${clinicId}/patients/${selected._id}/visits`, {
                    method: "POST",
                    body: JSON.stringify({ doctorId: form.doctorId || undefined, chiefComplaint: form.chiefComplaint, visitType: "WALK_IN" }),
                  });
                  await api(`/api/v1/clinics/${clinicId}/visits/${visitRes.visit._id}/consultations`, {
                    method: "POST",
                    body: JSON.stringify({
                      patientId: selected._id, doctorId: form.doctorId || undefined,
                      chiefComplaint: form.chiefComplaint, diagnosis: form.diagnosis, notes: form.notes,
                      followUpRequired: form.followUpRequired,
                      followUpAfterDays: form.followUpRequired ? form.followUpAfterDays : undefined,
                    }),
                  });
                  setMessage(`✅ Saved. Visit + consultation recorded for ${selected.name}.`);
                } catch (err) { setError((err as Error).message); }
                finally { setSaving(false); }
              }}
            >
              Save visit & consultation
            </Button>
            {message && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p>}
            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <Link className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline" to={`/patients/${selected._id}`}>
              Open patient profile →
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ─── Patients Page ─────────────────────────────────────────────────────── */
export function PatientsPage() {
  const { clinicId } = useAuth();
  const [q, setQ]       = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function search() {
    if (!clinicId) return;
    setLoading(true);
    try {
      const d = await api<{ items: any[] }>(`/api/v1/clinics/${clinicId}/patients?q=${encodeURIComponent(q)}`);
      setItems(d.items);
    } finally { setLoading(false); }
  }

  useEffect(() => { search(); }, [clinicId]);

  if (!clinicId) return <Empty text="Select a clinic first." icon="🏥" />;

  return (
    <div className="animate-slide-up">
      <PageHeader title="Patients" subtitle="Search by name, mobile, or patient code" />
      <div className="mb-5 flex gap-2">
        <Input
          placeholder="Name, mobile or patient ID…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <Button onClick={search} loading={loading}>Search</Button>
      </div>
      {loading ? <LoadingState /> : items.length === 0 ? <Empty text="No patients match your search." icon="🧑‍⚕️" /> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((p) => (
            <Link key={p._id} to={`/patients/${p._id}`}>
              <Card className="group cursor-pointer transition-all hover:-translate-y-0.5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 group-hover:text-brand-700">{p.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{p.patientCode}</p>
                  </div>
                  <Badge variant={p.gender === "MALE" ? "info" : p.gender === "FEMALE" ? "warning" : "neutral"}>
                    {p.gender ?? "—"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-slate-500">📱 {p.mobileNumber ?? "—"}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Patient Profile ───────────────────────────────────────────────────── */
export function PatientProfilePage({ patientId }: { patientId: string }) {
  const { clinicId } = useAuth();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!clinicId) return;
    api(`/api/v1/clinics/${clinicId}/patients/${patientId}`).then(setData);
  }, [clinicId, patientId]);

  if (!data) return <LoadingState text="Loading patient profile…" />;
  const { patient, visits, consultations, followups, appointments } = data;

  return (
    <div className="animate-slide-up">
      <PageHeader
        title={patient.name}
        subtitle={`${patient.patientCode} · ${patient.mobileNumber ?? "no mobile"} · ${patient.gender ?? ""}`}
        action={<StatusBadge status={patient.status ?? "ACTIVE"} />}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Visits */}
        <Card>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Visits ({visits.length})</p>
          {visits.length === 0 ? <p className="text-sm text-slate-400">No visits yet.</p> : (
            <div className="space-y-2">
              {visits.map((v: any) => (
                <div key={v._id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <p className="font-medium text-slate-800">{v.visitCode} · {v.visitType}</p>
                  <p className="text-xs text-slate-500">{new Date(v.visitDate).toLocaleDateString()} · {v.chiefComplaint}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
        {/* Consultations */}
        <Card>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Consultations ({consultations.length})</p>
          {consultations.length === 0 ? <p className="text-sm text-slate-400">No consultations yet.</p> : (
            <div className="space-y-2">
              {consultations.map((c: any) => (
                <div key={c._id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <p className="font-medium text-slate-800">{c.diagnosis || c.chiefComplaint || "—"}</p>
                  <p className="text-xs text-slate-500">{c.notes}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
        {/* Follow-ups */}
        <Card>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Follow-ups ({followups.length})</p>
          {followups.length === 0 ? <p className="text-sm text-slate-400">No follow-ups.</p> : (
            <div className="space-y-2">
              {followups.map((f: any) => (
                <div key={f._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <span>{new Date(f.followupDate).toLocaleDateString()}</span>
                  <StatusBadge status={f.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
        {/* Appointments */}
        <Card>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Appointments ({appointments.length})</p>
          {appointments.length === 0 ? <p className="text-sm text-slate-400">No appointments.</p> : (
            <div className="space-y-2">
              {appointments.map((a: any) => (
                <div key={a._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <span>{new Date(a.appointmentDate).toLocaleString()}</span>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ─── Follow-ups Page ───────────────────────────────────────────────────── */
export function FollowupsPage() {
  const { clinicId } = useAuth();
  const [items, setItems]      = useState<any[]>([]);
  const [loading, setLoading]  = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [nextForm, setNextForm] = useState<Record<string, { date: string; days: number; notes: string }>>({});
  const [savingNext, setSavingNext] = useState<Record<string, boolean>>({});
  const [nextMsg, setNextMsg]  = useState<Record<string, string>>({});

  async function load() {
    if (!clinicId) return;
    const d = await api<{ items: any[] }>(`/api/v1/clinics/${clinicId}/followups`);
    setItems(d.items);
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, [clinicId]);
  if (!clinicId) return <Empty text="Select a clinic first." icon="🏥" />;
  if (loading)   return <LoadingState />;

  const pending = items.filter((f) => f.status !== "COMPLETED" && f.status !== "CANCELLED");
  const done    = items.filter((f) => f.status === "COMPLETED"  || f.status === "CANCELLED");

  function defaultNf(f: any) {
    const base = new Date(f.followupDate);
    const days = f.followUpAfterDays ?? 7;
    base.setDate(base.getDate() + days);
    return { date: base.toISOString().slice(0, 10), days, notes: "" };
  }

  async function scheduleNext(f: any) {
    const nf = nextForm[f._id] ?? defaultNf(f);
    setSavingNext((s) => ({ ...s, [f._id]: true }));
    setNextMsg((s) => ({ ...s, [f._id]: "" }));
    try {
      await api(`/api/v1/clinics/${clinicId}/followups`, {
        method: "POST",
        body: JSON.stringify({
          patientId: typeof f.patientId === "object" ? f.patientId._id : f.patientId,
          visitId:   f.visitId,
          doctorId:  typeof f.doctorId  === "object" ? f.doctorId?._id  : (f.doctorId ?? undefined),
          followupDate:     nf.date,
          followUpAfterDays: nf.days,
          notes: nf.notes,
        }),
      });
      setNextMsg((s) => ({ ...s, [f._id]: "✅ Next follow-up scheduled!" }));
      load();
    } catch (err) {
      setNextMsg((s) => ({ ...s, [f._id]: `❌ ${(err as Error).message}` }));
    } finally {
      setSavingNext((s) => ({ ...s, [f._id]: false }));
    }
  }

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="Follow-ups"
        subtitle={`${pending.length} pending · ${done.length} completed / cancelled`}
      />

      {items.length === 0 ? <Empty text="No follow-ups scheduled." icon="🔔" /> : (
        <div className="space-y-3">
          {items.map((f) => {
            const isExpanded = expandedId === f._id;
            const nf = nextForm[f._id] ?? defaultNf(f);
            const isDone = f.status === "COMPLETED" || f.status === "CANCELLED";

            return (
              <Card key={f._id}>
                {/* Summary row */}
                <div className="flex items-start gap-3">
                  <button
                    className="mt-1 text-slate-400 hover:text-brand-600 text-sm"
                    onClick={() => setExpandedId(isExpanded ? null : f._id)}
                  >
                    {isExpanded ? "▼" : "▶"}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{f.patientId?.name ?? "—"}</p>
                      <StatusBadge status={f.status} />
                      {f.doctorId?.name && (
                        <span className="text-xs text-slate-400">👨‍⚕️ {f.doctorId.name}</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">
                      📅 Due: {new Date(f.followupDate).toLocaleDateString()}
                      {f.followUpAfterDays ? ` · every ${f.followUpAfterDays} day(s)` : ""}
                    </p>
                    {f.notes && <p className="mt-1 text-xs italic text-slate-400">{f.notes}</p>}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {!isDone && (
                      <Button
                        size="sm"
                        onClick={async () => {
                          await api(`/api/v1/clinics/${clinicId}/followups/${f._id}/complete`, {
                            method: "POST",
                            body: JSON.stringify({ createVisit: true }),
                          });
                          load();
                        }}
                      >
                        ✅ Complete
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setExpandedId(isExpanded ? null : f._id)}>
                      {isExpanded ? "Hide" : "Details / Next"}
                    </Button>
                  </div>
                </div>

                {/* Expanded: details + schedule next follow-up */}
                {isExpanded && (
                  <div className="mt-4 border-t border-slate-100 pt-4 animate-slide-up">
                    {/* Info grid */}
                    <div className="mb-5 grid gap-3 sm:grid-cols-3 text-sm">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Patient</p>
                        <p className="font-medium">{f.patientId?.name ?? "—"}</p>
                        <p className="text-xs text-slate-400">{f.patientId?.mobileNumber ?? ""}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Doctor</p>
                        <p className="font-medium">{f.doctorId?.name ?? "—"}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Status</p>
                        <StatusBadge status={f.status} />
                        {f.completedAt && (
                          <p className="mt-1 text-xs text-slate-400">
                            Completed: {new Date(f.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Schedule next follow-up */}
                    <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4">
                      <p className="mb-3 text-sm font-semibold text-brand-800">🔔 Schedule Next Follow-up</p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Field label="Follow-up date">
                          <Input
                            type="date"
                            value={nf.date}
                            onChange={(e) => setNextForm((s) => ({ ...s, [f._id]: { ...nf, date: e.target.value } }))}
                          />
                        </Field>
                        <Field label="Interval (days)">
                          <Input
                            type="number"
                            min={1}
                            value={nf.days}
                            onChange={(e) => setNextForm((s) => ({ ...s, [f._id]: { ...nf, days: Number(e.target.value) } }))}
                          />
                        </Field>
                        <Field label="Notes (optional)">
                          <Input
                            value={nf.notes}
                            placeholder="e.g. Review BP"
                            onChange={(e) => setNextForm((s) => ({ ...s, [f._id]: { ...nf, notes: e.target.value } }))}
                          />
                        </Field>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <Button size="sm" loading={savingNext[f._id]} onClick={() => scheduleNext(f)}>
                          Schedule next follow-up
                        </Button>
                        {nextMsg[f._id] && (
                          <p className={`text-sm font-medium ${nextMsg[f._id].startsWith("✅") ? "text-emerald-700" : "text-red-600"}`}>
                            {nextMsg[f._id]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}



/* ─── Appointments Page ─────────────────────────────────────────────────── */
export function AppointmentsPage() {
  const { clinicId } = useAuth();
  const [items, setItems]     = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors]  = useState<any[]>([]);
  const [form, setForm]        = useState({ patientId: "", doctorId: "", appointmentDate: "", notes: "" });
  const [loading, setLoading]  = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    if (!clinicId) return;
    const [appts, pts, docs] = await Promise.all([
      api<{ items: any[] }>(`/api/v1/clinics/${clinicId}/appointments`),
      api<{ items: any[] }>(`/api/v1/clinics/${clinicId}/patients`),
      api<{ items: any[] }>(`/api/v1/clinics/${clinicId}/doctors`),
    ]);
    setItems(appts.items);
    setPatients(pts.items);
    setDoctors(docs.items);
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, [clinicId]);
  if (!clinicId) return <Empty text="Select a clinic first." icon="🏥" />;
  if (loading) return <LoadingState />;

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="Appointments"
        subtitle={`${items.length} appointment${items.length !== 1 ? "s" : ""}`}
        action={
          <Button onClick={() => setShowForm((s) => !s)} variant={showForm ? "ghost" : "primary"}>
            {showForm ? "Cancel" : "＋ Schedule"}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-5 animate-slide-up">
          <h2 className="mb-4 font-semibold">New appointment</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Patient">
              <Select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
                <option value="">Select patient</option>
                {patients.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </Select>
            </Field>
            <Field label="Doctor">
              <Select value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}>
                <option value="">Select doctor</option>
                {doctors.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </Select>
            </Field>
            <Field label="Date & Time">
              <Input type="datetime-local" value={form.appointmentDate} onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })} />
            </Field>
            <Field label="Notes">
              <Input value={form.notes} placeholder="Optional notes" onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              loading={creating}
              onClick={async () => {
                setCreating(true);
                try {
                  await api(`/api/v1/clinics/${clinicId}/appointments`, {
                    method: "POST",
                    body: JSON.stringify({ ...form, appointmentDate: new Date(form.appointmentDate).toISOString() }),
                  });
                  setShowForm(false);
                  load();
                } finally { setCreating(false); }
              }}
            >Create</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {items.length === 0 ? <Empty text="No appointments scheduled." icon="📅" /> : (
        <Table headers={["Patient", "Doctor", "Date & Time", "Status", "Notes"]}>
          {items.map((a) => (
            <Tr key={a._id}>
              <Td><span className="font-medium">{a.patientId?.name ?? "—"}</span></Td>
              <Td>{a.doctorId?.name ?? "—"}</Td>
              <Td className="text-xs">{new Date(a.appointmentDate).toLocaleString()}</Td>
              <Td><StatusBadge status={a.status ?? "SCHEDULED"} /></Td>
              <Td className="text-xs text-slate-400">{a.notes || "—"}</Td>
            </Tr>
          ))}
        </Table>
      )}
    </div>
  );
}

/* ─── Reports Page ──────────────────────────────────────────────────────── */
export function ReportsPage() {
  const { clinicId } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) return;
    api(`/api/v1/clinics/${clinicId}/reports`).then(setData).finally(() => setLoading(false));
  }, [clinicId]);

  if (!clinicId) return <Empty text="Select a clinic first." icon="🏥" />;
  if (loading) return <LoadingState />;

  return (
    <div className="animate-slide-up">
      <PageHeader title="Reports" subtitle="Clinic-wide aggregated stats" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total Patients" value={data?.patients ?? 0} icon="🧑‍⚕️" color="brand" />
        <Stat label="Total Visits"   value={data?.visits ?? 0}   icon="🩺"  color="emerald" />
      </div>
      {data?.followups?.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Follow-up breakdown</p>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {data.followups.map((f: any) => (
              <Card key={f._id}>
                <StatusBadge status={f._id} />
                <p className="mt-2 text-2xl font-bold text-slate-900">{f.count}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
