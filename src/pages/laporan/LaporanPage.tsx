import { useState } from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { laporanApi } from '../../api/laporan.api';
import { useAuthStore } from '../../stores/authStore';
import { Skeleton } from '../../components/ui/skeleton';

export function LaporanPage() {
  const { user } = useAuthStore();
  const [selectedReport, setSelectedReport] = useState<string>('anggota');
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => laporanApi.getDashboard(),
    select: (data) => data.data,
  });

  const reportTypes = [
    { id: 'anggota', label: 'Laporan Data Anggota', icon: '👥', description: 'Daftar lengkap anggota dengan filter' },
    { id: 'presensi', label: 'Laporan Presensi', icon: '✅', description: 'Rekap kehadiran per bulan per lokasi' },
    { id: 'prestasi', label: 'Laporan Prestasi', icon: '🏆', description: 'Daftar prestasi anggota per periode' },
    { id: 'lokasi', label: 'Laporan Lokasi', icon: '🏢', description: 'Data seluruh lokasi beserta statistik' },
    { id: 'pelatih', label: 'Laporan Pelatih', icon: '🏋️', description: 'Data seluruh pelatih' },
  ];

  const handleDownload = () => {
    // TODO: Implement actual download
    alert(`Download ${selectedReport} dalam format ${format.toUpperCase()} akan tersedia segera.`);
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Laporan & Statistik" description="Generate dan download laporan organisasi" />
        <div className="mt-6 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Laporan & Statistik" description="Generate dan download laporan organisasi" />

      {/* Stats Overview */}
      {dashboard && (
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total Anggota Aktif</p>
            <p className="text-2xl font-bold text-primary">{dashboard.totalAnggotaAktif}</p>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total Pelatih</p>
            <p className="text-2xl font-bold text-primary">{dashboard.totalPelatih}</p>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total Lokasi</p>
            <p className="text-2xl font-bold text-primary">{dashboard.totalLokasi}</p>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Anggota Baru Bulan Ini</p>
            <p className="text-2xl font-bold text-green-600">{dashboard.anggotaBaruBulanIni}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Report Type Selection */}
        <div className="lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Pilih Jenis Laporan</h3>
          <div className="space-y-3">
            {reportTypes.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`flex w-full items-center space-x-4 rounded-lg border p-4 text-left transition-colors ${
                  selectedReport === report.id
                    ? 'border-primary bg-primary-50 ring-1 ring-primary'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{report.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{report.label}</p>
                  <p className="text-sm text-gray-500">{report.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Download Options */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Opsi Download</h3>
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">Format</label>
              <div className="flex space-x-3">
                <button
                  onClick={() => setFormat('pdf')}
                  className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium ${
                    format === 'pdf'
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  📄 PDF
                </button>
                <button
                  onClick={() => setFormat('excel')}
                  className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium ${
                    format === 'excel'
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  📊 Excel
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">Periode</label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                <option>Semua Data</option>
                <option>Bulan Ini</option>
                <option>3 Bulan Terakhir</option>
                <option>6 Bulan Terakhir</option>
                <option>Tahun Ini</option>
                <option>Custom Range</option>
              </select>
            </div>

            <button
              onClick={handleDownload}
              className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white hover:bg-primary-dark"
            >
              Download Laporan
            </button>
          </div>

          {/* Distribusi per Lokasi */}
          {dashboard?.distribusiPerLokasi && (
            <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
              <h4 className="mb-4 font-semibold text-gray-900">Distribusi per Lokasi</h4>
              <div className="space-y-3">
                {dashboard.distribusiPerLokasi.map((lokasi: any) => (
                  <div key={lokasi.id}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-gray-700">{lokasi.nama}</span>
                      <span className="font-medium text-gray-900">{lokasi.jumlah_anggota} anggota</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${(lokasi.jumlah_anggota / (dashboard.totalAnggotaAktif || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
