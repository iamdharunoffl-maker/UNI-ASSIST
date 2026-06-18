import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HiChevronDoubleLeft, 
  HiChevronDoubleRight,
  HiArrowLeftOnRectangle 
} from 'react-icons/hi2';
import { 
  HiChartBar, 
  HiUserGroup, 
  HiAcademicCap, 
  HiSquare3Stack3D, 
  HiCog8Tooth 
} from 'react-icons/hi2';
import useAuth from '../hooks/useAuth';

export const Sidebar = ({ isCollapsed, toggleCollapse }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: HiChartBar },
    { name: 'Leads', path: '/leads', icon: HiUserGroup },
    { name: 'Students', path: '/students', icon: HiAcademicCap },
    { name: 'Masters', path: '/masters', icon: HiSquare3Stack3D },
    { name: 'Settings', path: '/settings', icon: HiCog8Tooth },
  ];

  return (
    <aside 
      className={`bg-slate-900 border-r border-slate-800 text-white flex flex-col justify-between h-screen fixed left-0 top-0 z-30 transition-all duration-300 shadow-xl ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 animate-fade-in">
              <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center font-bold text-white shadow-lg text-lg">
                U
              </div>
              <span className="font-extrabold text-base tracking-wide font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-brand-100">
                UNI ASSIST
              </span>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center font-bold text-white shadow-lg mx-auto text-lg">
              U
            </div>
          )}
          <button
            onClick={toggleCollapse}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none ${isCollapsed ? 'hidden' : ''}`}
          >
            <HiChevronDoubleLeft className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 flex flex-col gap-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-2xl font-sans text-sm font-semibold transition-all group ${
                  isActive 
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/10' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="animate-fade-in">{item.name}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-800 flex flex-col gap-3">
        {/* User Card */}
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
          <div className="w-9 h-9 rounded-full bg-slate-800 text-brand-300 flex items-center justify-center font-bold border border-slate-700">
            {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col animate-fade-in">
              <span className="text-sm font-semibold text-white leading-tight capitalize">
                {user?.username || 'Admin'}
              </span>
              <span className="text-xs text-slate-500 font-medium capitalize">
                {user?.role || 'Staff'}
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-1">
          {isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="p-3 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mx-auto"
            >
              <HiChevronDoubleRight className="w-4.5 h-4.5" />
            </button>
          )}

          <button
            onClick={logout}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-rose-400 hover:text-white hover:bg-rose-950/40 transition-all font-sans ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <HiArrowLeftOnRectangle className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="animate-fade-in">Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
