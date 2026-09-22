import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { MENU_ITEMS } from '../../lib/constants';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, activeRole, isDualRole } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const dualRole = isDualRole();

  // Determine which menu to show based on active role
  let menuKey: keyof typeof MENU_ITEMS;
  if (dualRole) {
    menuKey = (activeRole || 'pelatih') as keyof typeof MENU_ITEMS;
  } else {
    menuKey = (user?.role || 'anggota') as keyof typeof MENU_ITEMS;
  }
  const menuItems = MENU_ITEMS[menuKey] || [];

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  // Display name
  const displayName = dualRole
    ? (activeRole === 'pelatih'
        ? user?.pelatihProfile?.nama_lengkap
        : user?.anggotaProfile?.nama_lengkap) || user?.email?.split('@')[0]
    : user?.pelatihProfile?.nama_lengkap || user?.anggotaProfile?.nama_lengkap || user?.email?.split('@')[0];

  const displayRole = dualRole
    ? (activeRole === 'pelatih' ? 'Pelatih' : 'Anggota')
    : user?.role?.toUpperCase();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-gradient-to-b from-[#0a1628] via-[#0d1f3c] to-[#0a1628] text-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo header */}
        <div className="flex h-16 items-center space-x-3 border-b border-white/10 px-5">
          <img src="/logo.jpeg" alt="Logo BM" className="h-10 w-10 rounded-full border-2 border-primary/50 shadow-md object-cover" />
          <div>
            <span className="block text-lg font-black tracking-wide text-white">SIPBM</span>
            <span className="block text-[10px] font-medium text-primary/70 -mt-0.5">Bhayu Manunggal</span>
          </div>
        </div>

        {/* Dual-role indicator */}
        {dualRole && (
          <div className="mx-3 mt-3 rounded-lg bg-primary/10 px-3 py-2 text-center">
            <p className="text-[10px] font-medium text-primary/60 uppercase tracking-wider">Mode Aktif</p>
            <p className="text-sm font-bold text-primary">
              {activeRole === 'pelatih' ? '🏋️ Pelatih' : '👥 Anggota'}
            </p>
          </div>
        )}

        {/* Menu items */}
        <nav className="mt-4 flex-1 space-y-1 px-3 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`flex w-full items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/20'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className={`text-base ${isActive ? 'drop-shadow-sm' : ''}`}>{item.icon}</span>
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-secondary shadow-sm" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User card at bottom */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center space-x-3 rounded-lg bg-white/5 px-3 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-sm font-bold text-white shadow-sm">
              {displayName?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-white">{displayName}</p>
              <p className="truncate text-[11px] text-primary/60 font-medium">{displayRole}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
