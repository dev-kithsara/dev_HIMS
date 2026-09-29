import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route } from 'react-router-dom';
import { CreateIncident } from './pages/CreateIncident';
import { IncidentsList } from './pages/IncidentsList';
import { ManagerDashboard } from './pages/ManagerDashboard';
import { IncidentDetails } from './pages/IncidentDetails';
import InvestigatorDashboard from './pages/InvestigatorDashboard';
import InvestigatorWorkspace from './pages/InvestigatorWorkspace';
import { Login } from './pages/Login';
import { ActionOwnerDashboard } from './pages/ActionOwnerDashboard';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/MainLayout';
import ActionOwnerIncidentDetails from './pages/ActionOwnerIncidentDetails';
import { TeamManagement } from './pages/TeamManagement';
import MyIncidentsPage from './pages/MyIncidentsPage';
import { useAuthContext } from './context/AuthContext';
import { AdminDashboard } from './pages/AdminDashboard';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

// Route the root path ("/") to the correct home page based on the user's role
// so that e.g. STAFF never renders the ManagerDashboard (which calls MANAGER-only APIs).
const HomeRoute = () => {
  const { user } = useAuthContext();

  switch (user?.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'INVESTIGATOR':
      return <InvestigatorDashboard />;
    case 'ACTION_OWNER':
      return <ActionOwnerDashboard />;
    case 'STAFF':
      return <MyIncidentsPage />;
    case 'MANAGER':
    default:
      return <ManagerDashboard />;
  }
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF', 'INVESTIGATOR', 'ACTION_OWNER']} />
            }
          >
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomeRoute />} />
              <Route path="/my-incidents" element={<MyIncidentsPage />} />
              <Route path="/submit-incident" element={<CreateIncident />} />
              <Route path="/investigator" element={<InvestigatorDashboard />} />
              <Route path="/investigator/:id" element={<InvestigatorWorkspace />} />
              <Route path="/action-owner" element={<ActionOwnerDashboard />} />
              <Route path="/action-owner/:id" element={<ActionOwnerIncidentDetails />} />
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
              {/* Manager Only - Team Management */}
              <Route element={<ProtectedRoute allowedRoles={['MANAGER']} />}>
                <Route path="/incidents" element={<IncidentsList />} />
                <Route path="/incidents/:id" element={<IncidentDetails />} />
                <Route path="/team" element={<TeamManagement />} />
                <Route path="/analytics" element={<ManagerDashboard />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
