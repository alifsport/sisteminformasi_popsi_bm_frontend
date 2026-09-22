// === Brand Colors (from logo) ===
export const COLORS = {
  cyan: '#00C8FF',
  cyanDark: '#009FD4',
  cyanLight: '#4DD6FF',
  red: '#E31E24',
  redDark: '#B81820',
  white: '#FFFFFF',
  black: '#000000',
};

// === Sabuk Options (12 pilihan sesuai requirement) ===
export const SABUK_OPTIONS = [
  { value: 'Belum_Sabuk', label: 'Belum Sabuk', color: '#D1D5DB' },
  { value: 'Merah_Strip_1', label: 'Merah Strip 1', color: '#EF4444' },
  { value: 'Merah_Strip_2', label: 'Merah Strip 2', color: '#DC2626' },
  { value: 'Merah_Strip_3', label: 'Merah Strip 3', color: '#B91C1C' },
  { value: 'Biru_Polos', label: 'Biru Polos', color: '#3B82F6' },
  { value: 'Biru_Strip_1', label: 'Biru Strip 1', color: '#2563EB' },
  { value: 'Biru_Strip_2', label: 'Biru Strip 2', color: '#1D4ED8' },
  { value: 'Biru_Strip_3', label: 'Biru Strip 3', color: '#1E40AF' },
  { value: 'Hijau_Polos', label: 'Hijau Polos', color: '#22C55E' },
  { value: 'Hijau_Strip_1', label: 'Hijau Strip 1', color: '#16A34A' },
  { value: 'Hijau_Strip_2', label: 'Hijau Strip 2', color: '#15803D' },
] as const;

export const SABUK_COLORS: Record<string, string> = Object.fromEntries(
  SABUK_OPTIONS.map((s) => [s.value, s.color])
);

export const SABUK_LABELS: Record<string, string> = Object.fromEntries(
  SABUK_OPTIONS.map((s) => [s.value, s.label])
);

// Status Colors
export const STATUS_COLORS: Record<string, string> = {
  Aktif: 'bg-green-100 text-green-800',
  Tidak_Aktif: 'bg-gray-100 text-gray-800',
  Pengurus: 'bg-blue-100 text-blue-800',
  Pelatih: 'bg-purple-100 text-purple-800',
};

// Schedule Status Colors
export const JADWAL_STATUS_COLORS: Record<string, string> = {
  Dijadwalkan: 'bg-cyan-100 text-cyan-800',
  Berlangsung: 'bg-yellow-100 text-yellow-800',
  Selesai: 'bg-green-100 text-green-800',
  Dibatalkan: 'bg-red-100 text-red-800',
};

// Training Type Colors
export const TIPE_LATIHAN_COLORS: Record<string, string> = {
  Rutin: '#00C8FF',
  Khusus: '#22C55E',
  Ujian: '#F59E0B',
  Kejuaraan: '#E31E24',
  Peringatan: '#8B5CF6',
};

// Attendance Status
export const PRESENSI_STATUS: Record<string, { label: string; icon: string; color: string }> = {
  Hadir: { label: 'Hadir', icon: '✅', color: 'bg-green-100 text-green-800' },
  Izin: { label: 'Izin', icon: '📋', color: 'bg-yellow-100 text-yellow-800' },
  Alpa: { label: 'Alpa', icon: '❌', color: 'bg-red-100 text-red-800' },
  Terlambat: { label: 'Terlambat', icon: '⏰', color: 'bg-orange-100 text-orange-800' },
  Sakit: { label: 'Sakit', icon: '🏥', color: 'bg-purple-100 text-purple-800' },
};

// Role Labels
export const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin (Pengurus)',
  pelatih: 'Pelatih',
  anggota: 'Anggota',
};

// Menu items per role
export const MENU_ITEMS = {
  admin: [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Anggota', path: '/anggota', icon: '👥' },
    { label: 'Pelatih', path: '/pelatih', icon: '🏋️' },
    { label: 'Lokasi', path: '/lokasi', icon: '🏢' },
    { label: 'Jadwal', path: '/jadwal', icon: '📅' },
    { label: 'Presensi', path: '/presensi', icon: '✅' },
    { label: 'Laporan', path: '/laporan', icon: '📄' },
    { label: 'Pengaturan', path: '/pengaturan', icon: '⚙️' },
  ],
  pelatih: [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Jadwal', path: '/jadwal', icon: '📅' },
    { label: 'Presensi', path: '/presensi', icon: '✅' },
    { label: 'Lokasi', path: '/lokasi', icon: '🏢' },
    { label: 'Laporan', path: '/laporan', icon: '📄' },
  ],
  anggota: [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Jadwal', path: '/jadwal', icon: '📅' },
    { label: 'Profil', path: '/profil', icon: '👤' },
  ],
};
