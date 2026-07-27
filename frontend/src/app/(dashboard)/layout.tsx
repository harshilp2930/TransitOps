'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Truck, Users, Activity, LogOut, LayoutDashboard, Wrench, FileText, 
  Moon, Sun, Settings, Menu, X, BarChart3, Bell, CheckCheck,
  ShieldCheck, MapPin, Route, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { api } from '@/lib/api';

interface Notification {
  id: number;
  type: string;
  reference_entity: string;
  reference_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { user, logout, loading, hasRole } = useAuth();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const mounted = typeof window !== 'undefined';

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      setNotifLoading(true);
      const res = await api.get('/notifications/?page_size=20');
      setNotifications(res.data.results || res.data || []);
    } catch {
      // silent fail
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll every 60 seconds
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  // Close notifications panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all/');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {
      // silent fail
    }
  };

  const markRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read/`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {
      // silent fail
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'License Expiry': return <ShieldCheck className="w-4 h-4 text-amber-500" />;
      case 'Document Expiry': return <FileText className="w-4 h-4 text-orange-500" />;
      case 'Mileage Deviation': return <Route className="w-4 h-4 text-blue-500" />;
      case 'Depot Overdue': return <MapPin className="w-4 h-4 text-red-500" />;
      default: return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading TransitOps...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'] },
    { label: 'Fleet', href: '/vehicles', icon: Truck, roles: ['Fleet Manager', 'Dispatcher'] },
    { label: 'Drivers', href: '/drivers', icon: Users, roles: ['Fleet Manager', 'Dispatcher', 'Safety Officer'] },
    { label: 'Trips', href: '/trips', icon: Activity, roles: ['Dispatcher', 'Fleet Manager'] },
    { label: 'Parties', href: '/parties', icon: MapPin, roles: ['Fleet Manager', 'Dispatcher', 'Financial Analyst'] },
    { label: 'Routes', href: '/routes', icon: Route, roles: ['Fleet Manager', 'Dispatcher'] },
    { label: 'Maintenance', href: '/maintenance', icon: Wrench, roles: ['Fleet Manager'] },
    { label: 'Fuel & Expenses', href: '/finance', icon: FileText, roles: ['Financial Analyst', 'Fleet Manager'] },
    { label: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['Financial Analyst', 'Fleet Manager'] },
    { label: 'Compliance', href: '/compliance', icon: ShieldCheck, roles: ['Safety Officer', 'Fleet Manager'] },
    { label: 'Settings', href: '/settings', icon: Settings, roles: ['Fleet Manager'] },
  ];

  const pageTitle = (() => {
    const segment = pathname.split('/').filter(Boolean).pop() || 'dashboard';
    const map: Record<string, string> = {
      dashboard: 'Dashboard',
      vehicles: 'Fleet Registry',
      drivers: 'Driver Management',
      trips: 'Trip Dispatcher',
      maintenance: 'Maintenance',
      finance: 'Fuel & Expenses',
      analytics: 'Analytics',
      compliance: 'Compliance Center',
      settings: 'Settings',
    };
    return map[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
  })();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex text-slate-800 dark:text-slate-300 font-sans transition-colors duration-200">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col fixed inset-y-0 z-30 transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">TransitOps</span>
              <span className="block text-[10px] text-slate-400 dark:text-slate-500 -mt-0.5 font-medium">Fleet Management</span>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-500 hover:text-slate-900 dark:hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navItems.filter(item => hasRole(item.roles)).map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard');
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-150 ${
                  isActive 
                    ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 font-semibold shadow-sm' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <item.icon className={`w-4.5 h-4.5 mr-3 flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-500' : 'text-slate-400 dark:text-slate-500'}`} style={{ width: '18px', height: '18px' }} />
                <span className="text-sm">{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              </div>
              <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${theme === 'dark' ? 'bg-blue-500' : 'bg-slate-300'}`}>
                <div className={`w-3 h-3 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>
          )}

          {/* User Info */}
          <div className="flex items-center px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm mr-3 shadow-sm flex-shrink-0">
              {(user.full_name || 'U').charAt(0)}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.full_name || 'Unknown User'}</p>
              <p className="text-xs text-slate-500 truncate">{user.role_name || 'Unknown Role'}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center px-3 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* System status */}
            <span className="hidden sm:flex px-2.5 py-1 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20 rounded-full text-xs font-medium items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Online
            </span>

            {/* Notifications Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) fetchNotifications();
                }}
                className="relative p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-12 w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl dark:shadow-slate-900/80 z-50 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-slate-500" />
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-96 overflow-y-auto">
                    {notifLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                        <Bell className="w-8 h-8 mb-2 opacity-40" />
                        <p className="text-sm">No notifications</p>
                        <p className="text-xs mt-1 opacity-70">You're all caught up!</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => markRead(notif.id)}
                          className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-800 last:border-b-0 ${
                            notif.is_read 
                              ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50' 
                              : 'bg-blue-50/50 dark:bg-blue-500/5 hover:bg-blue-50 dark:hover:bg-blue-500/10'
                          }`}
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mt-0.5">
                            {getNotifIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-relaxed ${notif.is_read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-800 dark:text-slate-200 font-medium'}`}>
                              {notif.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatTimeAgo(notif.created_at)}</span>
                              {!notif.is_read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                    <Link
                      href="/compliance"
                      onClick={() => setShowNotifications(false)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      View Compliance Center
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
