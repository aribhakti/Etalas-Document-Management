import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, FileBarChart, Settings, Plus, Bell, User, Menu, X } from 'lucide-react';
import { clsx } from 'clsx';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchNotifications = () => {
      fetch('/api/notifications')
        .then(res => res.json())
        .then(data => setNotifications(data));
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: number) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: FileText, label: 'Templates', path: '/templates' },
    { icon: FileBarChart, label: 'Reports', path: '/reports' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">E</div>
            <span className="text-xl font-bold tracking-tight">Etalas</span>
          </div>
          <button 
            className="md:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <div className="px-4 mb-6">
          <Link 
            to="/create" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-center gap-2 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>Create Envelope</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-emerald-50 text-emerald-700" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
              <User size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Demo User</p>
              <p className="text-xs text-gray-500 truncate">demo@etalas.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 z-20 relative">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-gray-500 hover:text-gray-700"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-semibold text-gray-800">
              {navItems.find(i => i.path === location.pathname)?.label || 'Overview'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-gray-400 hover:text-gray-600 relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    <span className="text-xs text-gray-500">{unreadCount} unread</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 text-sm">No notifications</div>
                    ) : (
                      notifications.map((n) => (
                        <Link 
                          key={n.id}
                          to={n.link || '#'}
                          onClick={() => {
                            markAsRead(n.id);
                            setShowNotifications(false);
                          }}
                          className={`block p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                              {n.title}
                            </p>
                            {!n.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></span>}
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8" onClick={() => setShowNotifications(false)}>
          {children}
        </div>
      </main>
    </div>
  );
}
