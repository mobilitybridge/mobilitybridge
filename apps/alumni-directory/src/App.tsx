import { Route, Routes } from 'react-router';
import { RequireAdmin } from './lib/auth';
import AdminLayout from './features/admin/AdminLayout';
import LoginPage from './features/admin/LoginPage';
import AlumniFormPage from './features/alumni-form/AlumniFormPage';
import DashboardPage from './features/dashboard/DashboardPage';
import DirectoryPage from './features/directory/DirectoryPage';
import ImportPage from './features/import/ImportPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AlumniFormPage />} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<DirectoryPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="import" element={<ImportPage />} />
      </Route>
    </Routes>
  );
}
