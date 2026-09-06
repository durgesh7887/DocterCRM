import type { ButtonHTMLAttributes, FormEvent, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

/* ─── Card ─────────────────────────────────────────────────────────────── */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover ${className}`}>
      {children}
    </div>
  );
}

/* ─── Button ────────────────────────────────────────────────────────────── */
export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}) {
  const styles: Record<string, string> = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow-glow active:scale-[.98]",
    ghost:   "bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-[.98]",
    danger:  "bg-red-600 text-white hover:bg-red-700 shadow-sm active:scale-[.98]",
    outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:scale-[.98]",
  };
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center gap-2 rounded-xl font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${sizes[size]} ${props.className ?? ""}`}
    >
      {loading && (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}

/* ─── Input ─────────────────────────────────────────────────────────────── */
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-50 ${props.className ?? ""}`}
    />
  );
}

/* ─── Textarea ──────────────────────────────────────────────────────────── */
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none ${props.className ?? ""}`}
    />
  );
}

/* ─── Select ────────────────────────────────────────────────────────────── */
export function Select(props: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  const { children, ...rest } = props;
  return (
    <select
      {...rest}
      className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${rest.className ?? ""}`}
    >
      {children}
    </select>
  );
}

/* ─── Field ─────────────────────────────────────────────────────────────── */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </label>
  );
}

/* ─── PageHeader ─────────────────────────────────────────────────────────── */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

/* ─── Stat card ─────────────────────────────────────────────────────────── */
export function Stat({ label, value, icon, trend, color = "brand" }: {
  label: string;
  value: string | number;
  icon?: string;
  trend?: string;
  color?: "brand" | "emerald" | "amber" | "red" | "sky";
}) {
  const palette: Record<string, string> = {
    brand:   "from-brand-600 to-brand-700",
    emerald: "from-emerald-500 to-emerald-600",
    amber:   "from-amber-500 to-amber-600",
    red:     "from-red-500 to-red-600",
    sky:     "from-sky-500 to-sky-600",
  };
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${palette[color]} opacity-[.04]`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
          {trend && <p className="mt-1 text-xs text-slate-400">{trend}</p>}
        </div>
        {icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${palette[color]} text-white text-lg shadow-sm`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ─── Empty state ───────────────────────────────────────────────────────── */
export function Empty({ text, icon = "🔍" }: { text: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
      <span className="text-4xl">{icon}</span>
      <p className="mt-3 text-sm text-slate-500">{text}</p>
    </div>
  );
}

/* ─── Error banner ──────────────────────────────────────────────────────── */
export function ErrorText({ error }: { error?: string | null }) {
  if (!error) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
      <span>⚠️</span>
      <span>{error}</span>
    </div>
  );
}

/* ─── Badge ─────────────────────────────────────────────────────────────── */
export function Badge({ children, variant = "neutral" }: {
  children: ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
}) {
  const styles: Record<string, string> = {
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    danger:  "bg-red-100 text-red-800",
    info:    "bg-sky-100 text-sky-800",
    neutral: "bg-slate-100 text-slate-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}

/* ─── Section header ────────────────────────────────────────────────────── */
export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{children}</h2>;
}

/* ─── Spinner ───────────────────────────────────────────────────────────── */
export function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sz = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" }[size];
  return (
    <div className={`${sz} animate-spin rounded-full border-2 border-brand-200 border-t-brand-600`} />
  );
}

/* ─── Loading overlay ───────────────────────────────────────────────────── */
export function LoadingState({ text = "Loading…" }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Spinner size="lg" />
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}

/* ─── Table ─────────────────────────────────────────────────────────────── */
export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function Tr({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <tr onClick={onClick} className={`transition-colors ${onClick ? "cursor-pointer hover:bg-brand-50" : "hover:bg-slate-50/50"}`}>
      {children}
    </tr>
  );
}

export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-sm text-slate-700 ${className}`}>{children}</td>;
}

/* ─── Section divider ───────────────────────────────────────────────────── */
export function Divider({ label }: { label?: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
      {label && (
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-slate-400">{label}</span>
        </div>
      )}
    </div>
  );
}

/* ─── Form helper ───────────────────────────────────────────────────────── */
export function onSubmit(handler: () => Promise<void>) {
  return async (event: FormEvent) => {
    event.preventDefault();
    await handler();
  };
}

/* ─── Status badge helper ───────────────────────────────────────────────── */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
    ACTIVE: "success", PAID: "success", COMPLETED: "success", SCHEDULED: "info",
    INACTIVE: "neutral", PENDING: "warning", OVERDUE: "danger", MISSED: "danger",
    CANCELLED: "danger", DUE: "warning", UPCOMING: "info", PARTIAL: "warning",
  };
  return <Badge variant={map[status] ?? "neutral"}>{status}</Badge>;
}
