import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import HomePage from './pages/public/HomePage';
import CampaignDetailPage from './pages/public/CampaignDetailPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import NotFoundPage from './pages/public/NotFoundPage';
import ProtectedRoute from './components/layout/ProtectedRoute';
import DashboardPage from './pages/dashboard/DashboardPage';

// Redirect logged-in users away from auth pages
const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

const App = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/campaigns/:id" element={<CampaignDetailPage />} />

      {/* Guest-only routes */}
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* Example protected route (dashboard - placeholder) */}
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute roles={['admin', 'organizer']}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
