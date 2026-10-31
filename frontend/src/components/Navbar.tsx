import React, { useState, useEffect, useRef } from 'react';
import { HeartHandshake, ShieldAlert, User, LogOut, Building2, Search, Activity, Lock, Menu, X } from './Icons';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, logout, isSuperAdmin, isHospitalStaff } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on navigation
  const handleNav = (view: string) => {
    setMobileMenuOpen(false);
    onNavigate(view);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  // Close mobile menu on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { view: 'search', label: 'Find Blood', icon: Search, show: true },
    { view: 'track', label: 'Track Request', icon: Activity, show: true },
    { view: 'hospital', label: 'Hospital Portal', icon: Building2, show: isHospitalStaff },
    { view: 'admin', label: 'Admin Center', icon: Lock, show: isSuperAdmin },
    { view: 'apply', label: 'Hospital Registration', icon: Building2, show: true },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      {/* Top Info Bar */}
      <div className="bg-slate-950 text-slate-300 text-xs py-1.5 px-4 tracking-wide border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-hidden">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block shrink-0"></span>
            <span className="text-slate-200 font-semibold text-[11px] uppercase tracking-wider truncate">
              National Blood Exchange Protocol Active
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-[11px] text-slate-400 shrink-0">
            <span>24/7 Emergency Hotline: <strong className="text-white font-mono font-bold">1800-11-BLOOD (25663)</strong></span>
            <span className="text-slate-700">|</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              ✓ CDSCO & NBTC Accredited
            </span>
          </div>
        </div>
      </div>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" ref={menuRef}>
        {/* Brand — clickable logo */}
        <button
          onClick={() => handleNav('landing')}
          className="flex items-center gap-2.5 group focus:outline-none text-left shrink-0"
          aria-label="Go to home page"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-200 group-hover:bg-rose-700 transition">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-rose-600 transition">
              Blood<span className="text-rose-600">Connect</span>
            </span>
            <span className="hidden sm:block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              National Blood Transfusion Network
            </span>
          </div>
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1.5">
          {navItems.filter(n => n.show).map((item) => (
            <button
              key={item.view}
              onClick={() => handleNav(item.view)}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                currentView === item.view
                  ? 'bg-rose-50 text-rose-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Right side: Auth + Mobile Hamburger */}
        <div className="flex items-center gap-2">
          {/* Auth Status (always visible) */}
          {user ? (
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">{user.full_name}</p>
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleNav('login')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-xl md:hidden mobile-menu-animate z-50">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {navItems.filter(n => n.show).map((item) => (
                <button
                  key={item.view}
                  onClick={() => handleNav(item.view)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition flex items-center gap-3 ${
                    currentView === item.view
                      ? 'bg-rose-50 text-rose-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}

              {/* Mobile user info */}
              {user && (
                <div className="pt-3 mt-2 border-t border-slate-100">
                  <div className="px-4 py-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{user.full_name}</p>
                      <span className="text-[10px] font-bold uppercase text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                    <button
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
