import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useUnreadCount } from '../../hooks/useNotifikasi';
import { ROLE_LABELS } from '../../lib/constants';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const { user, logout, activeRole, setActiveRole, isDualRole } = useAuthStore();
  const { data: unreadCount } = useUnreadCount();
  const navigate = useNavigate();
  const dualRole = isDualRole();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleRoleSwitch = (role: 'pelatih' | 'anggota') => {
    setActiveRole(role);
    navigate('/dashboard');
  };

  // Determine display info based on active role
  const displayName = dualRole
    ? (activeRole === 'pelatih'
        ? user?.pelatihProfile?.nama_lengkap
        : user?.anggotaProfile?.nama_lengkap) || user?.email?.split('@')[0]
    : user?.pelatihProfile?.nama_lengkap || user?.anggotaProfile?.nama_lengkap || user?.email?.split('@')[0];

  const displayRole = dualRole
    ? (activeRole === 'pelatih' ? 'Pelatih' : 'Anggota')
    : ROLE_LABELS[user?.role || ''] || user?.role;

  return (
    <header className="flex h-16 items-center justify-between bg-gradient-to-r from-primary to-primary-dark px-4 shadow-md lg:px-6">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
          className="rounded-md p-2 text-white hover:bg-white/10 lg:hidden"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center space-x-2.5">
          <img src="/logo.jpeg" alt="Logo BM" className="h-9 w-9 rounded-full border-2 border-white/40 shadow-sm object-cover" />
          <div className="hidden sm:block">
            <span className="text-lg font-black text-white tracking-wide">SIPBM</span>
            <span className="ml-1.5 text-xs text-white/60 font-medium hidden md:inline">Bhayu Manunggal</span>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-3">
        {/* Role Switcher — only for dual-profile users */}
        {dualRole && (
          <div className="hidden sm:flex items-center rounded-lg bg-white/15 p-0.5">
            <button
              onClick={() => handleRoleSwitch('pelatih')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeRole === 'pelatih'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              🏋️ Pelatih
            </button>
            <button
              onClick={() => handleRoleSwitch('anggota')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeRole === 'anggota'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              👥 Anggota
            </button>
          </div>
        )}

        {/* Notification bell */}
        <button
          onClick={() => navigate('/notifikasi')}
          className="relative rounded-lg p-2 text-white hover:bg-white/10 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {(unreadCount ?? 0) > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold text-white shadow-sm">
              {(unreadCount ?? 0) > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* User info */}
        <div className="flex items-center space-x-2.5">
          <div className="hidden text-right md:block">
            <p className="text-sm font-semibold text-white leading-tight">{displayName}</p>
            <p className="text-[11px] text-white/60 font-medium">{displayRole}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-bold text-white shadow-sm border-2 border-white/30">
            {displayName?.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            Keluar
          </button>
        </div>
      </div>
    </header>
  );
}
