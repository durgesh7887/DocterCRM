import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "./auth";
import { InstallPrompt } from "./InstallPrompt";

const NAV = [
  { to: "/",             label: "Home",          icon: "🏠" },
  { to: "/clinics",      label: "Clinics",        icon: "🏥" },
  { to: "/patients",     label: "Patients",       icon: "🧑‍⚕️" },
  { to: "/consultations",label: "Consultations",  icon: "🩺" },
  { to: "/followups",    label: "Follow-ups",     icon: "🔔" },
  { to: "/appointments", label: "Appointments",   icon: "📅" },
  { to: "/profile",      label: "Profile",        icon: "👤" },
];

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const letters = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-400 text-xs font-bold uppercase text-brand-950">
      {letters}
    </div>
  );
}

export function Shell() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      {/* Top header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">M</div>
          <div>
            <p className="text-sm font-bold text-slate-900">MedFlow</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-brand-600">Doctor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <InstallPrompt />
          {user && <Initials name={user.name} />}
          <button
            onClick={() => logout()}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 active:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </header>


      {/* Page content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white">
        <div className="flex overflow-x-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex flex-1 min-w-[4rem] flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                  isActive ? "text-brand-700 bg-brand-50" : "text-slate-500 hover:text-slate-700"
                }`
              }
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="whitespace-nowrap">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
