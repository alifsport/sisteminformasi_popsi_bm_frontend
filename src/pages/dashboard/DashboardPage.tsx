import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  MapPin,
  Calendar,
  TrendingUp,
  Plus,
  Clock,
  Trophy,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { laporanApi } from '../../api/laporan.api';
import { useJadwalSaya, useJadwalList } from '../../hooks/useJadwal';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatDate } from '../../lib/utils';

// ============================================================
// Loading Skeletons
// ============================================================

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    </div>
  );
}

// ============================================================
// Stat Card
// ============================================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  bgColor: string;
  iconColor: string;
}

function StatCard({ icon, label, value, bgColor, iconColor }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${bgColor}`}>
            <div className={iconColor}>{icon}</div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Bar Chart (CSS-only)
// ============================================================

interface BarChartData {
  label: string;
  value: number;
}

function BarChart({ data, title }: { data: BarChartData[]; title: string }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const barColors = [
    'bg-primary',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Belum ada data</p>
        ) : (
          <div className="space-y-3">
            {data.map((item, index) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-muted-foreground">{item.value} anggota</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      barColors[index % barColors.length]
                    }`}
                    style={{ width: `${(item.value / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Jadwal Item
// ============================================================

function JadwalItem({ jadwal }: { jadwal: any }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Calendar className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{jadwal.judul_materi}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(jadwal.tanggal)} - {jadwal.jam_mulai} s/d {jadwal.jam_selesai}
        </p>
      </div>
      <StatusBadge status={jadwal.status} type="jadwal" />
    </div>
  );
}

// ============================================================
// Admin Dashboard
// ============================================================

function AdminDashboard() {
  const navigate = useNavigate();

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard-admin'],
    queryFn: async () => {
      const res = await laporanApi.getDashboard();
      return res.data.data;
    },
  });

  const { data: jadwalData, isLoading: jadwalLoading } = useJadwalList({
    limit: 5,
    status: 'Dijadwalkan',
  });

  if (dashboardLoading) return <DashboardSkeleton />;

  const distribusi = dashboard?.distribusiPerLokasi || [];
  const prestasi = dashboard?.prestasiTerbaru || [];
  const jadwalList = jadwalData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Admin</h1>
          <p className="text-muted-foreground">Ringkasan data SIPBM</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => navigate('/anggota/tambah')}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Anggota
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/jadwal')}>
            <Calendar className="mr-2 h-4 w-4" />
            Lihat Jadwal
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-6 w-6" />}
          label="Total Anggota Aktif"
          value={dashboard?.totalAnggotaAktif ?? 0}
          bgColor="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          icon={<UserCheck className="h-6 w-6" />}
          label="Total Pelatih"
          value={dashboard?.totalPelatih ?? 0}
          bgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          icon={<MapPin className="h-6 w-6" />}
          label="Total Lokasi"
          value={dashboard?.totalLokasi ?? 0}
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={<TrendingUp className="h-6 w-6" />}
          label="Anggota Baru Bulan Ini"
          value={dashboard?.anggotaBaruBulanIni ?? 0}
          bgColor="bg-orange-50"
          iconColor="text-orange-600"
        />
      </div>

      {/* Bar Chart + Jadwal */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BarChart
          data={distribusi.map((d: any) => ({
            label: d.nama,
            value: d.jumlah_anggota,
          }))}
          title="Distribusi Anggota per Lokasi"
        />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Jadwal Hari Ini</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/jadwal')}
            >
              Lihat Semua
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {jadwalLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : jadwalList.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Tidak ada jadwal hari ini
              </p>
            ) : (
              <div className="space-y-3">
                {jadwalList.slice(0, 5).map((jadwal: any) => (
                  <JadwalItem key={jadwal.id} jadwal={jadwal} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Prestasi Terbaru */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Prestasi Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {prestasi.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada data prestasi
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {prestasi.slice(0, 6).map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-yellow-50">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.nama_kejuaraan}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.nama_anggota} - {item.prestasi}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Pelatih Dashboard
// ============================================================

function PelatihDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard-pelatih'],
    queryFn: async () => {
      const res = await laporanApi.getDashboard();
      return res.data.data;
    },
  });

  const { data: jadwalData, isLoading: jadwalLoading } = useJadwalSaya();

  if (dashboardLoading) return <DashboardSkeleton />;

  if (dashboardLoading) return <DashboardSkeleton />;

  const jadwalList = Array.isArray(jadwalData) ? jadwalData : [];
  const today = new Date().toISOString().split('T')[0];
  const hariIni = jadwalList.filter((j: any) => j.tanggal === today);
  const mendatang = jadwalList
    .filter((j: any) => j.tanggal > today && j.status !== 'Dibatalkan')
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Pelatih</h1>
        <p className="text-muted-foreground">Selamat datang, {user?.email}</p>
      </div>

      {/* Stat Card */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-6 w-6" />}
          label="Anggota di Lokasi Saya"
          value={dashboard?.totalAnggota ?? 0}
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Jadwal Hari Ini */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Jadwal Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            {jadwalLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : hariIni.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Clock className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Tidak ada jadwal hari ini</p>
              </div>
            ) : (
              <div className="space-y-3">
                {hariIni.map((jadwal: any) => (
                  <JadwalItem key={jadwal.id} jadwal={jadwal} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Jadwal Mendatang */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Jadwal Mendatang</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/jadwal')}
            >
              Lihat Semua
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {jadwalLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : mendatang.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Calendar className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Tidak ada jadwal mendatang</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mendatang.map((jadwal: any) => (
                  <JadwalItem key={jadwal.id} jadwal={jadwal} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// Anggota Dashboard
// ============================================================

function AnggotaDashboard() {
  const { user } = useAuthStore();

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard-anggota'],
    queryFn: async () => {
      const res = await laporanApi.getDashboard();
      return res.data.data;
    },
  });

  const { data: jadwalData, isLoading: jadwalLoading } = useJadwalSaya();

  if (dashboardLoading) return <DashboardSkeleton />;

  const profile = dashboard?.profil || {};
  const jadwalList = Array.isArray(jadwalData) ? jadwalData : [];
  const today = new Date().toISOString().split('T')[0];
  const jadwalTerdekat = jadwalList
    .filter((j: any) => j.tanggal >= today && j.status !== 'Dibatalkan')
    .slice(0, 5);

  const sabukColorMap: Record<string, string> = {
    Belum_Sabuk: 'bg-gray-100 border-gray-300',
    Merah_Strip_1: 'bg-red-50 border-red-300',
    Merah_Strip_2: 'bg-red-50 border-red-400',
    Merah_Strip_3: 'bg-red-100 border-red-500',
    Biru_Polos: 'bg-blue-50 border-blue-400',
    Biru_Strip_1: 'bg-blue-50 border-blue-500',
    Biru_Strip_2: 'bg-blue-100 border-blue-600',
    Biru_Strip_3: 'bg-blue-100 border-blue-700',
    Hijau_Polos: 'bg-green-50 border-green-400',
    Hijau_Strip_1: 'bg-green-50 border-green-500',
    Hijau_Strip_2: 'bg-green-100 border-green-600',
    Hijau_Strip_3: 'bg-green-100 border-green-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Saya</h1>
        <p className="text-muted-foreground">Selamat datang kembali!</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                {profile.nama_lengkap?.charAt(0) || user?.email?.charAt(0) || '?'}
              </div>
              <h3 className="text-lg font-semibold">{profile.nama_lengkap || user?.email}</h3>
              {profile.sabuk && (
                <Badge
                  variant="outline"
                  className={`mt-2 ${sabukColorMap[profile.sabuk] || ''}`}
                >
                  Sabuk {profile.sabuk}
                </Badge>
              )}
              {profile.status_keanggotaan && (
                <StatusBadge status={profile.status_keanggotaan} type="anggota" />
              )}
              {profile.lokasi_nama && (
                <p className="mt-3 text-sm text-muted-foreground">
                  <MapPin className="mr-1 inline h-3 w-3" />
                  {profile.lokasi_nama}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Jadwal Latihan */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Jadwal Latihan</CardTitle>
          </CardHeader>
          <CardContent>
            {jadwalLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : jadwalTerdekat.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Calendar className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Belum ada jadwal latihan</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jadwalTerdekat.map((jadwal: any) => (
                  <JadwalItem key={jadwal.id} jadwal={jadwal} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Riwayat Presensi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Riwayat Presensi Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          {presensi.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <LayoutDashboard className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Belum ada riwayat presensi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {presensi.slice(0, 5).map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.judul_materi || 'Latihan'}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(item.tanggal)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={item.status} type="presensi" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Main Dashboard Page
// ============================================================

export function DashboardPage() {
  const { user } = useAuthStore();

  if (!user) return <DashboardSkeleton />;

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'pelatih':
      return <PelatihDashboard />;
    case 'anggota':
      return <AnggotaDashboard />;
    default:
      return <AdminDashboard />;
  }
}
