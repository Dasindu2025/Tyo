import  { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Login Pages
import LoginSelection from './pages/LoginSelection';
import SuperAdminLogin from './pages/auth/SuperAdminLogin';
import AdminLogin from './pages/auth/AdminLogin';
import EmployeeLogin from './pages/auth/EmployeeLogin';

// Super Admin Pages
import SuperAdminDashboard from './pages/super-admin/Dashboard';
import CompanyManagement from './pages/super-admin/CompanyManagement';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import EmployeeManagement from './pages/admin/EmployeeManagement';
import ProjectManagement from './pages/admin/ProjectManagement';
import WorkplaceManagement from './pages/admin/WorkplaceManagement';
import TimeEntryApprovals from './pages/admin/TimeEntryApprovals';
import WorkingHoursConfig from './pages/admin/WorkingHoursConfig';
import Reports from './pages/admin/Reports';

// Employee Pages
import EmployeeDashboard from './pages/employee/Dashboard';
import TimeEntryForm from './pages/employee/TimeEntryForm';
import TimeEntryHistory from './pages/employee/TimeEntryHistory';
import EmployeeProfile from './pages/employee/Profile';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LoginSelection />} />
        <Route path="/login/super-admin" element={<SuperAdminLogin />} />
        <Route path="/login/admin" element={<AdminLogin />} />
        <Route path="/login/employee" element={<EmployeeLogin />} />

        {/* Super Admin Routes */}
        <Route
          path="/super-admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/super-admin/companies"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <CompanyManagement />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/employees"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <EmployeeManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/projects"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ProjectManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/workplaces"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <WorkplaceManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <TimeEntryApprovals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/working-hours"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <WorkingHoursConfig />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* Employee Routes */}
        <Route
          path="/employee/dashboard"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/time-entry"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <TimeEntryForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/history"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <TimeEntryHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/profile"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <EmployeeProfile />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
