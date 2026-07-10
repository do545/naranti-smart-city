import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

// --- IMPORTACIÓN DE VISTAS (Asegúrate que estas rutas sean correctas) ---
import DashboardView from '@/components/admin/views/DashboardView';
import DevicesView from '@/components/admin/views/DevicesView'; // Refactored from KiosksView
import KioskModeView from '@/components/admin/views/KioskModeView';
import CampaignsView from '@/components/admin/views/CampaignsView';
import SpotlightModerationView from '@/components/admin/views/SpotlightModerationView';
import UsersView from '@/components/admin/views/UsersView';
import JobsView from '@/components/admin/views/JobsView';
import NewsAdminView from '@/components/admin/views/NewsAdminView';
import MetricsView from '@/components/admin/views/MetricsView';
import SettingsView from '@/components/admin/views/SettingsView';

import { AnimatePresence } from 'framer-motion';

const AdminDashboard = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isSidebarOpenMobile, setSidebarOpenMobile] = useState(false);

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpenMobile(!isSidebarOpenMobile);
    } else {
      setSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpenMobile(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <Helmet>
        <title>Centro de Control - Naranti Smart City</title>
      </Helmet>
      <div className="flex h-screen bg-gray-950 text-white font-sans overflow-hidden">
        
        {/* Mobile Sidebar */}
        <AnimatePresence>
        {isSidebarOpenMobile && (
            <>
                <div 
                    onClick={() => setSidebarOpenMobile(false)}
                    className="fixed inset-0 bg-black/60 z-30 lg:hidden"
                ></div>
                 <div className="fixed inset-y-0 left-0 z-40">
                    <AdminSidebar isCollapsed={false} toggleCollapse={toggleSidebar} />
                </div>
            </>
        )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
           <AdminSidebar isCollapsed={isSidebarCollapsed} toggleCollapse={toggleSidebar} />
        </div>
        
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader toggleSidebar={toggleSidebar} />
          
          {/* ÁREA PRINCIPAL (Aquí cargan las vistas) */}
          <main className="flex-1 overflow-y-auto bg-gray-900/50 p-6 scrollbar-thin scrollbar-thumb-gray-800">
            <Routes>
              <Route path="/" element={<DashboardView />} />
              
              {/* GESTIÓN DE FLOTA (Renamed/Refactored) */}
              <Route path="kiosks" element={<DevicesView />} />
              
              {/* EDITOR VISUAL (Celular y Switches) */}
              <Route path="kiosk-mode" element={<KioskModeView />} />
              
              {/* PUBLICIDAD */}
              <Route path="campaigns" element={<CampaignsView />} />
              
              {/* MODERACIÓN DE FOTOS */}
              <Route path="spotlight" element={<SpotlightModerationView />} />
              
              {/* BOLSA DE TRABAJO */}
              <Route path="jobs" element={<JobsView />} />

              {/* NOTICIAS */}
              <Route path="news" element={<NewsAdminView />} />

              {/* OTROS */}
              <Route path="users" element={<UsersView />} />
              <Route path="metrics" element={<MetricsView />} />
              <Route path="settings" element={<SettingsView />} />
              
              {/* Default */}
              <Route path="*" element={<Navigate to="" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;