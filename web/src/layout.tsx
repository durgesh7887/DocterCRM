import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./auth";
import { Button } from "./ui";

const NAV: Record<string, Array<{ to: string; label: string; icon: string }>> = {
  SUPER_ADMIN: [
    { to: "/",              label: "Dashboard",     icon: "📊" },
    { to: "/clinics",       label: "Clinics",       icon: "🏥" },
    { to: "/users",         label: "Users",         icon: "👥" },
    { to: "/consultation",  label: "Consultation",  icon: "🩺" },
    { to: "/patients",      label: "Patients",      icon: "🧑‍⚕️" },
    { to: "/followups",     label: "Follow-ups",    icon: "🔔" },
    { to: "/appointments",  label: "Appointments",  icon: "📅" },
    { to: "/payments",      label: "Payments",      icon: "💳" },
    { to: "/subscriptions", label: "Subscriptions", icon: "📦" },
    { to: "/reports",       label: "Reports",       icon: "📈" },
    { to: "/export",        label: "Export Data",   icon: "⬇️" },
    { to: "/audit",         label: "Audit Logs",    icon: "📋" },
    { to: "/settings",      label: "Settings",      icon: "⚙️" },
  ],
  ADMIN: [
    { to: "/",        label: "Dashboard", icon: "📊" },
    { to: "/clinics", label: "Clinics",   icon: "🏥" },
  ],
  RECEPTION: [
    { to: "/",              label: "Dashboard",    icon: "📊" },
    { to: "/consultation",  label: "Consultation", icon: "🩺" },
    { to: "/patients",      label: "Patients",     icon: "🧑‍⚕️" },
    { to: "/followups",     label: "Follow-ups",   icon: "🔔" },
    { to: "/appointments",  label: "Appointments", icon: "📅" },
    { to: "/reports",       label: "Reports",      icon: "📈" },
  ],
  DOCTOR: [{ to: "/", label: "Use Doctor PWA", icon: "💊" }],
};

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const letters = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-400 text-xs font-bold text-white uppercase">
      {letters}
    </div>
  );
}

export function AppLayout() {
  const { user, logout, clinicId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nav = NAV[user?.role ?? "RECEPTION"] ?? [];

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[256px_1fr]">
      {/* Sidebar */}
      <aside className="flex flex-col border-b border-brand-800 bg-gradient-to-b from-brand-950 to-brand-900 text-white lg:min-h-screen lg:border-b-0 lg:border-r lg:border-brand-800">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-brand-800/60">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-400 text-lg font-bold text-brand-950">
            M
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight">MedFlow</p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-brand-300/70">
              {user?.role.replace("_", " ")}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-visible">
          {nav.map((item) => {
            const isActive = item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={`flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-brand-400/20 text-white ring-1 ring-brand-400/30"
                    : "text-brand-100/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="hidden lg:block">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div className="mt-auto hidden border-t border-brand-800/60 p-4 lg:block">
          <div className="flex items-center gap-3">
            <Initials name={user?.name ?? "U"} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user?.name}</p>
              <p className="truncate text-xs text-brand-300/70">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-h-screen flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {clinicId ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-100">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
                Clinic active
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <Initials name={user?.name ?? "U"} />
            <span className="hidden text-sm font-medium text-slate-700 sm:block">{user?.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
            >
              Sign out
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
