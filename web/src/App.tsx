import type { ReactElement } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { useAuth } from "./auth";
import { AppLayout } from "./layout";
import { ClinicWorkspace, ClinicsPage } from "./pages/ClinicsPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import {
  AppointmentsPage,
  AuditPage,
  ConsultationPage,
  FollowupsPage,
  PatientProfilePage,
  PatientsPage,
  PaymentsPage,
  ReportsPage,
  SettingsPage,
  SubscriptionsPage,
  UsersPage,
} from "./pages/OpsPages";
import { ExportPage } from "./pages/ExportPage";

function Guard({ children, roles }: { children: ReactElement; roles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8 text-sm text-slate-500">Loading session…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function PatientRoute() {
  const { patientId } = useParams();
  return <PatientProfilePage patientId={patientId!} />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Guard>
            <AppLayout />
          </Guard>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="clinics" element={<ClinicsPage />} />
        <Route path="clinics/:clinicId" element={<ClinicWorkspace />} />
        <Route path="users" element={<Guard roles={["SUPER_ADMIN"]}><UsersPage /></Guard>} />
        <Route path="payments" element={<Guard roles={["SUPER_ADMIN"]}><PaymentsPage /></Guard>} />
        <Route path="subscriptions" element={<Guard roles={["SUPER_ADMIN"]}><SubscriptionsPage /></Guard>} />
        <Route path="audit" element={<Guard roles={["SUPER_ADMIN"]}><AuditPage /></Guard>} />
        <Route path="settings" element={<Guard roles={["SUPER_ADMIN"]}><SettingsPage /></Guard>} />
        <Route path="consultation" element={<ConsultationPage />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="patients/:patientId" element={<PatientRoute />} />
        <Route path="followups" element={<FollowupsPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="export" element={<Guard roles={["SUPER_ADMIN"]}><ExportPage /></Guard>} />
      </Route>
    </Routes>
  );
}
