import { useEffect, useState } from "react";
import { api, downloadFile } from "../api";
import { useAuth } from "../auth";
import { Button, Card, Empty, LoadingState, PageHeader, StatusBadge } from "../ui";

type Clinic = { _id: string; name: string; status: string; ownerName: string; address?: { city?: string } };

/* ─── ExportPage ─────────────────────────────────────────────────────────── */
export function ExportPage() {
  const { user } = useAuth();
  const [clinics, setClinics]       = useState<Clinic[]>([]);
  const [loading, setLoading]       = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null); // "all" | clinicId
  const [success, setSuccess]       = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    api<{ items: Clinic[] }>("/api/v1/clinics")
      .then((d) => setClinics(d.items))
      .finally(() => setLoading(false));
  }, []);

  if (user?.role !== "SUPER_ADMIN") {
    return <Empty text="Export is only available for Super Admin." icon="🔒" />;
  }

  async function handleDownload(key: string, url: string, filename: string) {
    setDownloading(key);
    setSuccess(null);
    setError(null);
    try {
      await downloadFile(url, filename);
      setSuccess(`✅ "${filename}" downloaded successfully!`);
    } catch (err) {
      setError(`❌ ${(err as Error).message}`);
    } finally {
      setDownloading(null);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="Export Data"
        subtitle="Download clinic and patient data as Excel spreadsheets"
      />

      {/* Status banner */}
      {success && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800 animate-slide-up">
          <span className="text-xl">📥</span>
          {success}
          <button onClick={() => setSuccess(null)} className="ml-auto text-emerald-600 hover:text-emerald-800">✕</button>
        </div>
      )}
      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-800 animate-slide-up">
          <span className="text-xl">⚠️</span>
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">✕</button>
        </div>
      )}

      {/* Export All */}
      <Card className="mb-6 border-brand-100 bg-gradient-to-br from-brand-50 to-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-2xl text-white shadow-sm">
              📊
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">Export All Clinics</p>
              <p className="mt-0.5 text-sm text-slate-500">
                Full export of every clinic, patient, follow-up, visit, consultation &amp; appointment
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {["Clinics", "Patients", "Follow-ups", "Visits", "Consultations", "Appointments"].map((sheet) => (
                  <span key={sheet} className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-800">
                    {sheet}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <Button
            variant="primary"
            loading={downloading === "all"}
            onClick={() => handleDownload("all", "/api/v1/export/all", `MedFlow_All_Data_${today}.xlsx`)}
            className="shrink-0"
          >
            <span>⬇</span> Download all
          </Button>
        </div>
      </Card>

      {/* Per-clinic exports */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
        Export by clinic ({clinics.length})
      </h2>

      {loading ? <LoadingState /> : clinics.length === 0 ? <Empty text="No clinics found." icon="🏥" /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clinics.map((clinic) => {
            const safeName = clinic.name.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
            const filename = `MedFlow_${safeName}_${today}.xlsx`;
            const isDownloading = downloading === clinic._id;

            return (
              <Card key={clinic._id} className="flex flex-col gap-4">
                {/* Clinic info */}
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl font-bold text-slate-600">
                    {clinic.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-slate-900">{clinic.name}</p>
                      <StatusBadge status={clinic.status} />
                    </div>
                    <p className="truncate text-xs text-slate-500">
                      {clinic.ownerName}
                      {clinic.address?.city ? ` · ${clinic.address.city}` : ""}
                    </p>
                  </div>
                </div>

                {/* Sheets that will be exported */}
                <div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                  {["Summary", "Patients", "Follow-ups", "Visits", "Consultations", "Appointments"].map((sheet) => (
                    <span key={sheet} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {sheet}
                    </span>
                  ))}
                </div>

                {/* Download button */}
                <Button
                  variant="outline"
                  size="sm"
                  loading={isDownloading}
                  onClick={() => handleDownload(clinic._id, `/api/v1/export/clinic/${clinic._id}`, filename)}
                  className="w-full justify-center"
                >
                  <span>⬇</span> Export {clinic.name}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Format info */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p className="mb-3 text-sm font-semibold text-slate-700">📋 About the export format</p>
        <div className="grid gap-3 sm:grid-cols-2 text-sm text-slate-600">
          <div>
            <p className="font-medium text-slate-800">All Clinics export contains:</p>
            <ul className="mt-1 space-y-0.5 text-xs text-slate-500 list-disc list-inside">
              <li>Sheet 1: All Clinics (name, contact, address, status)</li>
              <li>Sheet 2: All Patients (code, name, mobile, gender)</li>
              <li>Sheet 3: All Follow-ups (patient, doctor, date, status)</li>
              <li>Sheet 4: All Visits (type, complaint, date)</li>
              <li>Sheet 5: All Consultations (diagnosis, notes)</li>
              <li>Sheet 6: All Appointments</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-slate-800">Per-clinic export contains:</p>
            <ul className="mt-1 space-y-0.5 text-xs text-slate-500 list-disc list-inside">
              <li>Sheet 1: Summary (clinic info + counts)</li>
              <li>Sheet 2: Patients</li>
              <li>Sheet 3: Follow-ups</li>
              <li>Sheet 4: Visits</li>
              <li>Sheet 5: Consultations</li>
              <li>Sheet 6: Appointments</li>
            </ul>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          ℹ️ All files are in <strong>.xlsx</strong> format compatible with Microsoft Excel, Google Sheets, and LibreOffice.
        </p>
      </div>
    </div>
  );
}
