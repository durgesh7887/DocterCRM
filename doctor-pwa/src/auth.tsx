import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, setToken, type AuthUser } from "./api";

type AuthState = {
  user: AuthUser | null;
  clinicId: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  setClinicId: (id: string) => void;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [clinicId, setClinicIdState] = useState<string | null>(sessionStorage.getItem("medflow_doctor_clinic"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ user: AuthUser }>("/api/v1/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      clinicId,
      loading,
      login: async (email, password) => {
        const data = await api<{ accessToken: string; user: AuthUser }>("/api/v1/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setToken(data.accessToken);
        setUser(data.user);
        const first = data.user.clinicIds[0];
        if (first) {
          sessionStorage.setItem("medflow_doctor_clinic", first);
          setClinicIdState(first);
        }
        return data.user;
      },
      logout: async () => {
        await api("/api/v1/auth/logout", { method: "POST" }).catch(() => undefined);
        setToken(null);
        sessionStorage.removeItem("medflow_doctor_clinic");
        setUser(null);
        setClinicIdState(null);
      },
      setClinicId: (id) => {
        sessionStorage.setItem("medflow_doctor_clinic", id);
        setClinicIdState(id);
      },
    }),
    [user, clinicId, loading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Auth missing");
  return ctx;
}
