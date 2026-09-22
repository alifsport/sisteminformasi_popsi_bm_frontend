import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleRoute } from './routes/RoleRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Real page imports
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { AnggotaListPage } from './pages/anggota/AnggotaListPage';
import { AnggotaCreatePage } from './pages/anggota/AnggotaCreatePage';
import { AnggotaDetailPage } from './pages/anggota/AnggotaDetailPage';
import { AnggotaEditPage } from './pages/anggota/AnggotaEditPage';
import { AnggotaImportPage } from './pages/anggota/AnggotaImportPage';
import { PelatihListPage } from './pages/pelatih/PelatihListPage';
import { PelatihCreatePage } from './pages/pelatih/PelatihCreatePage';
import { PelatihDetailPage } from './pages/pelatih/PelatihDetailPage';
import { PelatihEditPage } from './pages/pelatih/PelatihEditPage';
import { PelatihImportPage } from './pages/pelatih/PelatihImportPage';
import { LokasiListPage } from './pages/lokasi/LokasiListPage';
import { LokasiCreatePage } from './pages/lokasi/LokasiCreatePage';
import { LokasiDetailPage } from './pages/lokasi/LokasiDetailPage';
import { LokasiEditPage } from './pages/lokasi/LokasiEditPage';
import { JadwalPage } from './pages/jadwal/JadwalPage';
import { JadwalCreatePage } from './pages/jadwal/JadwalCreatePage';
import { JadwalDetailPage } from './pages/jadwal/JadwalDetailPage';
import { PresensiInputPage } from './pages/presensi/PresensiInputPage';
import { PresensiRekapPage } from './pages/presensi/PresensiRekapPage';
import { LaporanPage } from './pages/laporan/LaporanPage';
import { ProfilPage } from './pages/profil/ProfilPage';
import { PengaturanPage } from './pages/pengaturan/PengaturanPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-primary via-primary-dark to-[#004F73]">
        <div className="text-center">
          <img
            src="/logo.jpeg"
            alt="Logo BM"
            className="mx-auto mb-6 h-24 w-24 rounded-full border-4 border-white/30 shadow-2xl object-cover animate-pulse"
          />
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent mx-auto" />
          <p className="mt-4 text-white/70 text-sm font-medium">Memuat SIPBM...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { background: '#363636', color: '#fff' },
            success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<div className="p-8 text-center">Halaman Lupa Password</div>} />
          <Route path="/reset-password/:token" element={<div className="p-8 text-center">Halaman Reset Password</div>} />

          {/* Protected routes with DashboardLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Admin only */}
              <Route element={<RoleRoute allowedRoles={['admin']} />}>
                <Route path="/anggota" element={<AnggotaListPage />} />
                <Route path="/anggota/tambah" element={<AnggotaCreatePage />} />
                <Route path="/anggota/import" element={<AnggotaImportPage />} />
                <Route path="/anggota/:id" element={<AnggotaDetailPage />} />
                <Route path="/anggota/:id/edit" element={<AnggotaEditPage />} />
                <Route path="/pelatih" element={<PelatihListPage />} />
                <Route path="/pelatih/tambah" element={<PelatihCreatePage />} />
                <Route path="/pelatih/import" element={<PelatihImportPage />} />
                <Route path="/pelatih/:id" element={<PelatihDetailPage />} />
                <Route path="/pelatih/:id/edit" element={<PelatihEditPage />} />
                <Route path="/lokasi/tambah" element={<LokasiCreatePage />} />
                <Route path="/lokasi/:id/edit" element={<LokasiEditPage />} />
                <Route path="/pengaturan" element={<PengaturanPage />} />
              </Route>

              {/* Admin + Pelatih */}
              <Route element={<RoleRoute allowedRoles={['admin', 'pelatih']} />}>
                <Route path="/presensi" element={<PresensiInputPage />} />
                <Route path="/presensi/rekap" element={<PresensiRekapPage />} />
                <Route path="/laporan" element={<LaporanPage />} />
              </Route>

              {/* All authenticated */}
              <Route path="/lokasi" element={<LokasiListPage />} />
              <Route path="/lokasi/:id" element={<LokasiDetailPage />} />
              <Route path="/jadwal" element={<JadwalPage />} />
              <Route path="/jadwal/tambah" element={<JadwalCreatePage />} />
              <Route path="/jadwal/:id" element={<JadwalDetailPage />} />
              <Route path="/profil" element={<ProfilPage />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
