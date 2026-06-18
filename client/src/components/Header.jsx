import React from 'react';
import { useLocation } from 'react-router-dom';
import { HiCalendarDays, HiAcademicCap } from 'react-icons/hi2';

export const Header = () => {
  const location = useLocation();
  
  // Create beautiful page titles based on route path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/leads')) return 'Leads Directory';
    if (path.startsWith('/students')) return 'Students Enrolled';
    if (path.startsWith('/masters')) return 'Database Masters';
    if (path.startsWith('/settings')) return 'System Settings';
    return 'Uni Assist CRM';
  };

  const getPageSubtitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Overview of counseling funnels, leads, and intakes.';
    if (path.startsWith('/leads')) return 'Manage inquiries, track statuses, and convert prospects.';
    if (path.startsWith('/students')) return 'Track course admissions, visa progression, and enrollments.';
    if (path.startsWith('/masters')) return 'Manage dropdown lists for Countries, Universities, and Courses.';
    if (path.startsWith('/settings')) return 'Configure consultancy parameters and data parameters.';
    return 'Student and lead database portal.';
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 bg-slate-50/70 backdrop-blur-md border-b border-slate-100 z-20 px-8 py-5 flex items-center justify-between">
      {/* Page Context */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-sans">
          {getPageTitle()}
        </h1>
        <p className="text-xs text-slate-500 font-sans mt-0.5 font-medium">
          {getPageSubtitle()}
        </p>
      </div>

      {/* Action Stats / Calendar widget */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2.5 bg-white border border-slate-200/60 rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
          <HiCalendarDays className="w-4 h-4 text-brand-500" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
