"use client";

import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, Users, Briefcase, 
  Settings, UserCog, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import clsx from 'clsx';

const OUTER = "M11 3H13C16.7712 3 18.6569 3 19.8284 4.17157C21 5.34315 21 7.22876 21 11V13C21 16.7712 21 18.6569 19.8284 19.8284C18.6569 21 16.7712 21 13 21H11C7.2288 21 5.3431 21 4.1716 19.8284C3 18.6569 3 16.7712 3 13V11C3 7.22876 3 5.34315 4.1716 4.17157C5.3431 3 7.2288 3 11 3Z";
const PANEL_CLOSED = "M10 5.5 C10 4.793 10 4.439 9.780 4.220 C9.560 4 9.207 4 8.5 4 H8.5 C6.379 4 5.318 4 4.659 4.659 C4 5.318 4 6.379 4 8.5 V15.5 C4 17.621 4 18.682 4.659 19.341 C5.318 20 6.379 20 8.5 20 H8.5 C9.207 20 9.561 20 9.780 19.780 C10 19.561 10 19.207 10 18.5 V5.5 Z";
const PANEL_OPEN = "M14 6 C14 5.057 14 4.586 13.707 4.293 C13.414 4 12.943 4 12 4 H10 C7.172 4 5.757 4 4.879 4.879 C4 5.757 4 7.172 4 10 V14 C4 16.828 4 18.243 4.879 19.121 C5.757 20 7.172 20 10 20 H12 C12.943 20 13.414 20 13.707 19.707 C14 19.414 14 18.943 14 18 V6 Z";

function SidebarToggleIcon({ isOpen, className }: { isOpen: boolean; className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={className}>
      <path d={OUTER} fill="currentColor" opacity="0.15" />
      <motion.path
        initial={false}
        animate={{ d: isOpen ? PANEL_OPEN : PANEL_CLOSED }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        fill="currentColor"
      />
    </svg>
  );
}

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/quotes', label: 'Quotes', icon: FileText },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/team', label: 'Team', icon: UserCog },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setIsMobileOpen(false); }, [location]);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* 1. BRAND LOGO */}
      <div className={clsx("p-8 flex items-center transition-all", sidebarCollapsed ? "justify-center" : "justify-start gap-4")}>
        <div className="w-10 h-10 bg-[#f1f1f1] rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-navy-900/10">
          <img src="/vingrity-icon.svg" alt="" />
        </div>
        {!sidebarCollapsed && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-xl tracking-tight text-[#202060]">
            Vingrity
          </motion.span>
        )}
      </div>

      {/* 2. NAVIGATION */}
      <nav className="flex-1 px-4 space-y-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => clsx(
              'group flex items-center rounded-3xl transition-all duration-300 relative',
              sidebarCollapsed ? "justify-center w-14 h-14 mx-auto" : "px-5 py-4",
              isActive 
                ? 'bg-[#202060] text-white shadow-xl shadow-indigo-900/20' 
                : 'text-gray-400 hover:text-[#202060] hover:bg-gray-100/50'
            )}
          >
            {/* FIX: Access isActive via child function */}
            {({ isActive }) => (
              <>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.5} className="shrink-0" />
                {!sidebarCollapsed && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    className="ml-4 text-[15px] font-bold tracking-tight"
                  >
                    {item.label}
                  </motion.span>
                )}
                {/* Active Indicator Dot for Collapsed View */}
                {sidebarCollapsed && isActive && (
                    <motion.div layoutId="activeDot" className="absolute right-0 w-1 h-6 bg-[#0071fe] rounded-l-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* 3. FOOTER */}
      <div className="p-6 space-y-3">
         <NavLink
            to="/settings"
            className={({ isActive }) => clsx(
              'flex items-center rounded-3xl transition-all',
              sidebarCollapsed ? "justify-center w-14 h-14 mx-auto" : "px-5 py-4",
              isActive ? 'bg-gray-100 text-[#202060]' : 'text-gray-400 hover:text-[#202060] hover:bg-gray-100/50'
            )}
          >
            {({ isActive }) => (
              <>
                <Settings size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                {!sidebarCollapsed && <span className="ml-4 text-[15px] font-bold tracking-tight">Settings</span>}
              </>
            )}
          </NavLink>

          <button 
            onClick={toggleSidebar} 
            className={clsx(
              "flex items-center transition-all duration-300 group w-full",
              sidebarCollapsed ? "justify-center h-14" : "px-5 py-4 rounded-3xl hover:bg-gray-100/50"
            )}
          >
            <SidebarToggleIcon 
              isOpen={!sidebarCollapsed} 
              className="text-[#202060] transition-colors" 
            />
            {!sidebarCollapsed && (
              <span className="ml-4 text-[15px] font-bold text-gray-400 group-hover:text-[#202060]">
                Collapse
              </span>
            )}
          </button>
      </div>
    </div>
  );

  return (
    <>
      {/* MOBILE TRIGGER */}
      <div className="md:hidden fixed top-8 left-8 z-[45]">
        <button onClick={() => setIsMobileOpen(true)} className="w-12 h-12 bg-white border border-gray-100 rounded-2xl shadow-xl flex items-center justify-center text-[#202060]">
          <SidebarToggleIcon isOpen={false} />
        </button>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileOpen(false)} className="fixed inset-0 bg-[#202060]/20 backdrop-blur-md z-[50] md:hidden" />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="fixed inset-y-0 left-0 w-[300px] bg-white z-[60] flex flex-col shadow-2xl md:hidden">
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarCollapsed ? 100 : 280 }}
        className="hidden md:flex h-[calc(100vh-3rem)] bg-white border-r border-gray-100 rounded-[40px] flex-col shrink-0 sticky top-6 ml-6 my-6 shadow-[0_10px_40px_rgba(32,32,96,0.03)] overflow-hidden"
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}