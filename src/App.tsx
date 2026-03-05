import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GlobalProvider, useGlobal } from './context/GlobalContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LeadsListPage from './pages/LeadsListPage';
import PipelinePage from './pages/PipelinePage';
import LeadFormPage from './pages/LeadFormPage';
import PropertiesPage from './pages/PropertiesPage';
import FinancialPage from './pages/FinancialPage';
import CalendarPage from './pages/CalendarPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import SitePage from './pages/SitePage';
import ContractsPage from './pages/ContractsPage';
import WhatsAppPage from './pages/WhatsAppPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useGlobal();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PublicOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useGlobal();
  if (user) return <Navigate to="/app" replace />;
  return <>{children}</>;
};

// "/" vira landing pública; se tiver logado, manda direto pro app
const HomeGate: React.FC = () => {
  const { user } = useGlobal();
  if (user) return <Navigate to="/app" replace />;
  return <SitePage />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />

    {/* Public landing */}
    <Route path="/" element={<HomeGate />} />
    {/* Mantém /site funcionando (opcional) */}
    <Route path="/site" element={<SitePage />} />

    {/* Protected app */}
    <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
      <Route index element={<DashboardPage />} />
      <Route path="leads" element={<LeadsListPage />} />
      <Route path="leads/new" element={<LeadFormPage />} />
      <Route path="pipeline" element={<PipelinePage />} />
      <Route path="whatsapp" element={<WhatsAppPage />} />
      <Route path="properties" element={<PropertiesPage />} />
      <Route path="contracts" element={<ContractsPage />} />
      <Route path="financial" element={<FinancialPage />} />
      <Route path="calendar" element={<CalendarPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="settings" element={<SettingsPage />} />
    </Route>
  </Routes>
);

export default function App() {
  return (
    <HashRouter>
      <GlobalProvider>
        <AppRoutes />
      </GlobalProvider>
    </HashRouter>
  );
}