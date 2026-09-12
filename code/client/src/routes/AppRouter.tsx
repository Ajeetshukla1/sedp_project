import { type ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PatientAIPage } from '../pages/PatientAIPage';
import { PatientMedicationsPage } from '../pages/PatientMedicationsPage';
import { PatientDoctorsPage } from '../pages/PatientDoctorsPage';
import { PatientNotificationsPage } from '../pages/PatientNotificationsPage';
import { PatientOverviewPage } from '../pages/PatientOverviewPage';
import { PatientReportsPage } from '../pages/PatientReportsPage';
import { PatientTimelinePage } from '../pages/PatientTimelinePage';
import { PatientsPage } from '../pages/PatientsPage';
import { ProfilePage } from '../pages/ProfilePage';
import { RegisterPage } from '../pages/RegisterPage';
import { UploadReportPage } from '../pages/UploadReportPage';
import { ProtectedRoute } from './ProtectedRoute';

export function AppRouter(): ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="patients" element={<PatientsPage />} />
            <Route path="patients/:patientId" element={<PatientOverviewPage />} />
            <Route path="patients/:patientId/timeline" element={<PatientTimelinePage />} />
            <Route path="patients/:patientId/reports" element={<PatientReportsPage />} />
            <Route path="patients/:patientId/reports/upload" element={<UploadReportPage />} />
            <Route path="patients/:patientId/medications" element={<PatientMedicationsPage />} />
            <Route path="patients/:patientId/ai-summary" element={<PatientAIPage />} />
            <Route path="patient/records" element={<PatientOverviewPage />} />
            <Route path="patient/reports" element={<PatientReportsPage />} />
            <Route path="patient/reports/upload" element={<UploadReportPage />} />
            <Route path="patient/medications" element={<PatientMedicationsPage />} />
            <Route path="patient/ai-summary" element={<PatientAIPage />} />
            <Route path="patient/doctors" element={<PatientDoctorsPage />} />
            <Route path="patient/privacy" element={<PatientDoctorsPage />} />
            <Route path="patient/notifications" element={<PatientNotificationsPage />} />
            <Route path="patient/profile" element={<ProfilePage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
