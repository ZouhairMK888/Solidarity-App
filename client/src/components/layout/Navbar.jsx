import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import toast from 'react-hot-toast';
import Button from '../ui/Button';

const SolidarityLogo = () => (
  <Link to="/" className="flex items-center gap-2.5 group">
    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-sm group-hover:bg-emerald-700 transition-colors">
      <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </div>
    <span className="font-display font-bold text-lg text-slate-900 tracking-tight">Solidarity</span>
  </Link>
);

const UserMenu = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors group"
      >
        <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
          {initials}
        </div>
        <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 max-w-[120px] truncate">
          {user.name}
        </span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 card p-1.5 z-50 animate-fade-in">
          <div className="px-3 py-2 mb-1 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-800 truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
            <span className="mt-1 inline-block text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full capitalize">
              {user.role}
            </span>
          </div>
          {(user.role === 'admin' || user.role === 'organizer') && (
            <button
              onClick={() => {
                setOpen(false);
                navigate('/dashboard');
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h8V3H3v10zm10 8h8v-6h-8v6zm0-10h8V3h-8v8zM3 21h8v-6H3v6z" />
              </svg>
              Dashboard
            </button>
          )}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

const formatNotificationTime = (value) => {
  if (!value) return '';

  const createdAt = new Date(value);
  const seconds = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 1000));

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  return createdAt.toLocaleDateString();
};

const resolveNotificationPath = ({ notification, role }) => {
  switch (notification.type) {
    case 'campaign_created':
    case 'campaign_updated':
    case 'campaign_status':
    case 'mission_created':
    case 'mission_updated':
    case 'mission_status':
    case 'application_accepted':
      return '/';
    case 'application_submitted':
      return '/dashboard/control';
    case 'organizer_created':
      return role === 'admin' ? '/dashboard/organizers' : '/dashboard/overview';
    default:
      return role === 'admin' || role === 'organizer' ? '/dashboard/overview' : '/';
  }
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    setOpen(false);
    navigate(resolveNotificationPath({ notification, role: user?.role }));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
        aria-label="Open notifications"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17H9.143m9.714 0H19a2 2 0 001-3.732l-.555-.278A2 2 0 0118.333 11.2V9a6.333 6.333 0 10-12.666 0v2.2a2 2 0 01-1.112 1.79L4 13.268A2 2 0 005 17h.143m9.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-3 w-[22rem] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
              <p className="text-xs text-slate-500">Important updates for volunteers</p>
            </div>
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={!notifications.length || unreadCount === 0}
              className="text-xs font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-5 py-6 text-sm text-slate-500">Loading notifications...</div>
            ) : notifications.length ? notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleNotificationClick(notification)}
                className={`w-full border-b border-slate-100 px-5 py-4 text-left transition-colors last:border-b-0 ${
                  notification.is_read ? 'bg-white' : 'bg-emerald-50/60 hover:bg-emerald-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-1 h-2.5 w-2.5 rounded-full ${notification.is_read ? 'bg-slate-300' : 'bg-emerald-500'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">{notification.title || 'Notification'}</p>
                      <span className="shrink-0 text-[11px] text-slate-400">{formatNotificationTime(notification.created_at)}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{notification.message}</p>
                  </div>
                </div>
              </button>
            )) : (
              <div className="px-5 py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h11zm0 0a3 3 0 11-6 0h6z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-700">No notifications yet</p>
                <p className="mt-1 text-xs text-slate-500">New missions and updates from admins or organizers will appear here.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully.');
    navigate('/');
  };

  const navLinks = [
    { label: 'Campaigns', to: '/' },
    ...((isAuthenticated && (user?.role === 'admin' || user?.role === 'organizer'))
      ? [{ label: user?.role === 'admin' ? 'Admin Dashboard' : 'Organizer Studio', to: '/dashboard' }]
      : []),
  ];

  const isActiveLink = (to) => (
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
  );

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <SolidarityLogo />

          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActiveLink(link.to)
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth area */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <UserMenu user={user} onLogout={handleLogout} />
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')}>Sign in</Button>
                <Button variant="primary" onClick={() => navigate('/register')}>Get started</Button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white animate-slide-up">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActiveLink(link.to) ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-100'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-2 text-sm text-slate-600">
                    Signed in as <strong className="text-slate-800">{user?.name}</strong>
                  </div>
                  <div className="px-4 py-2">
                    <NotificationBell />
                  </div>
                  {(user?.role === 'admin' || user?.role === 'organizer') && (
                    <button
                      onClick={() => { navigate('/dashboard'); setMobileOpen(false); }}
                      className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      Open dashboard
                    </button>
                  )}
                  <button
                    onClick={() => { handleLogout(); setMobileOpen(false); }}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Button variant="secondary" className="w-full" onClick={() => { navigate('/login'); setMobileOpen(false); }}>Sign in</Button>
                  <Button variant="primary" className="w-full" onClick={() => { navigate('/register'); setMobileOpen(false); }}>Get started</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
