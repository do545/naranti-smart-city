import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { TotemProvider } from '@/contexts/TotemContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/toaster';
import ErrorBoundary from '@/components/ErrorBoundary';

// Páginas
import LoginPage from '@/pages/LoginPage';
import AdminDashboard from '@/pages/AdminDashboard';
import KioskDisplay from '@/pages/KioskDisplay';
import ScreenMode from '@/pages/ScreenMode';

// Módulos del Kiosco
import Noticias from '@/pages/Noticias';
import Fitness from '@/pages/Fitness';
import Empleo from '@/pages/Empleo';
import Arcade from '@/pages/Arcade';
import Spotlight from '@/pages/Spotlight';

// Componente de Seguridad
const PrivateRoute = ({ children, requiredRole }) => {
  const { currentUser, userRole, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-[#F36F21]">Cargando...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // ✅ PERMITIR QUE ADMIN ADMINISTRE KIOSCO Y PANTALLA TAMBIÉN
  const hasAccess = userRole === requiredRole || (userRole === 'admin' && (requiredRole === 'kiosk' || requiredRole === 'screen'));

  if (requiredRole && !hasAccess) {
    let redirectPath = '/login';
    if (userRole === 'admin') redirectPath = '/smartcity/admin';
    else if (userRole === 'kiosk') redirectPath = '/smartcity/display';
    else if (userRole === 'screen') redirectPath = '/smartcity/screen';

    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

function App() {
  return (
    // ✅ SOLUCIÓN AQUÍ: ThemeProvider envuelve a toda la aplicación
    <ErrorBoundary>
    <ThemeProvider defaultTheme="dark" storageKey="naranti-theme">
      <AuthProvider>
        <TotemProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              {/* ADMIN */}
              <Route
                path="/smartcity/admin/*"
                element={
                  <PrivateRoute requiredRole="admin">
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />

              {/* KIOSCO */}
              <Route
                path="/smartcity/display"
                element={
                  <PrivateRoute requiredRole="kiosk">
                    <KioskDisplay />
                  </PrivateRoute>
                }
              />

              {/* PANTALLA (NOVASTAR MODE) */}
              <Route
                path="/smartcity/screen"
                element={
                  <PrivateRoute requiredRole="screen">
                    <ScreenMode />
                  </PrivateRoute>
                }
              />

              {/* MÓDULOS */}
              <Route path="/noticias" element={<PrivateRoute requiredRole="kiosk"><Noticias /></PrivateRoute>} />
              <Route path="/fitness" element={<PrivateRoute requiredRole="kiosk"><Fitness /></PrivateRoute>} />
              <Route path="/empleo" element={<PrivateRoute requiredRole="kiosk"><Empleo /></PrivateRoute>} />
              <Route path="/arcade" element={<PrivateRoute requiredRole="kiosk"><Arcade /></PrivateRoute>} />
              <Route path="/spotlight" element={<PrivateRoute requiredRole="kiosk"><Spotlight /></PrivateRoute>} />

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
          <Toaster />
        </TotemProvider>
      </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;