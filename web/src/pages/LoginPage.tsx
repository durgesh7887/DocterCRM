import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { Button, ErrorText, Field, Input, onSubmit } from "../ui";

const DEMO_ACCOUNTS = [
  { role: "Super Admin", email: "superadmin@medflow.local" },
  { role: "Admin",       email: "admin.a@medflow.local" },
  { role: "Reception",   email: "reception.a@medflow.local" },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState("superadmin@medflow.local");
  const [password, setPassword] = useState("ChangeMe!MedFlow1");
  const [error, setError]       = useState<string | null>(null);
  const [busy, setBusy]         = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-400 text-lg font-bold text-brand-950">M</div>
          <span className="text-xl font-bold">MedFlow</span>
        </div>
        <div>
          <h2 className="text-4xl font-extrabold leading-tight">
            Healthcare CRM<br />
            <span className="text-brand-300">built for clinics.</span>
          </h2>
          <p className="mt-4 max-w-sm text-brand-100/70">
            Manage patients, visits, follow-ups, appointments, and billing — all in one place.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { icon: "🏥", label: "Multi-clinic" },
              { icon: "🔒", label: "Role-based" },
              { icon: "📊", label: "Live insights" },
            ].map((f) => (
              <div key={f.label} className="rounded-2xl bg-white/5 p-4 text-center ring-1 ring-white/10">
                <p className="text-2xl">{f.icon}</p>
                <p className="mt-1 text-xs font-medium text-brand-200">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-brand-300/50">© 2026 MedFlow · Healthcare CRM</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">M</div>
            <span className="text-xl font-bold text-slate-900">MedFlow</span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to your workspace. Doctors use the{" "}
            <span className="font-medium text-brand-700">Doctor PWA</span>.
          </p>

          <form
            className="mt-8 space-y-4"
            onSubmit={onSubmit(async () => {
              setBusy(true);
              setError(null);
              try {
                const user = await login(email, password);
                if (user.role === "DOCTOR") {
                  setError("Doctors should use the Doctor PWA on port .");
                  return;
                }
                navigate("/");
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setBusy(false);
              }
            })}
          >
            <Field label="Email address">
              <Input
                id="login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@clinic.com"
                required
                autoComplete="email"
              />
            </Field>
            <Field label="Password">
              <Input
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </Field>
            <ErrorText error={error} />
            <Button type="submit" loading={busy} className="w-full" size="lg">
              Sign in
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Demo accounts · password: ChangeMe!MedFlow1
            </p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acct) => (
                <button
                  key={acct.email}
                  type="button"
                  onClick={() => setEmail(acct.email)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-all ${
                    email === acct.email
                      ? "bg-brand-50 text-brand-800 ring-1 ring-brand-200"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="font-medium">{acct.role}</span>
                  <span className="font-mono text-xs text-slate-400">{acct.email.split("@")[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
