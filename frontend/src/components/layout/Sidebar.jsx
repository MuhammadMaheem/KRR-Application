import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  FileSearch,
  Layers,
  BookOpen,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: UploadCloud, label: 'Upload Data', path: '/upload' },
  { icon: FileSearch, label: 'AI Analysis', path: '/analysis' },
  { icon: Layers, label: 'Comparison', path: '/comparison' },
  { icon: BookOpen, label: 'Literature Review', path: '/topic-input' },
];

const Sidebar = () => {
  return (
    <aside className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col fixed left-0 top-0 z-50 transition-all duration-300">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
          K
        </div>
        <div>
          <h1 className="text-white font-bold text-lg leading-tight">KRR System</h1>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">
            Version 2.0 // Pro
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group relative overflow-hidden',
                isActive
                  ? 'bg-indigo-600/10 text-indigo-400'
                  : 'hover:bg-slate-800 hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={20}
                  className={cn(
                    isActive ? 'text-indigo-500' : 'text-slate-400 group-hover:text-white'
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-500 rounded-r-full" />
                )}
                {!isActive && (
                  <ChevronRight
                    size={14}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer / User */}
      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
          <LogOut size={20} />
          <span>Exit System</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
