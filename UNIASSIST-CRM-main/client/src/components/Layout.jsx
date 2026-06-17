import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import useAuth from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

export const Layout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // If session is checking, show global loading spinner
  if (loading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest animate-pulse font-sans">
          Loading CRM Portal
        </p>
      </div>
    );
  }

  // Redirect to login if user session is not active
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      {/* Sidebar Navigation */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isSidebarCollapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        <Header />
        
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Outlet resolves current router page */}
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
