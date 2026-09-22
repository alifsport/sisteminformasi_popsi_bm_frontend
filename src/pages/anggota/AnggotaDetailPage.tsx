import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { SABUK_LABELS, SABUK_COLORS, STATUS_COLORS } from '../../lib/constants';
import { formatDate } from '../../lib/utils';

interface AnggotaDetail {
  id: string;
  id_anggota: string;
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  no_telepon: string;
  email_pribadi?: string;
  foto_url?: string;
  sabuk: string;
  tanggal_gabung: string;
  status_keanggotaan: string;
  tempat_latihan_pertama?: { id: string; nama: string; kota?: string } | null;
  tempat_latihan_saat_ini?: { id: string; nama: string; kota?: string } | null;
  pelatih_pertama?: { id: string; nama_lengkap: string } | null;
  pelatih_saat_ini?: { id: string; nama_lengkap: string } | null;
  created_at: string;
  updated_at: string;
}

type TabKey = 'profil' | 'prestasi' | 'presensi';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'profil', label: 'Profil' },
  { key: 'prestasi', label: 'Riwayat Prestasi' },
  { key: 'presensi', label: 'Riwayat Presensi' },
];

// -----------------------------------------------------------
// Loading skeleton
// -----------------------------------------------------------
function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-5 w-24 rounded bg-gray-200" />
        <div className="h-5 w-32 rounded bg-gray-200 ml-auto" />
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-6 w-48 rounded bg-gray-200" />
            <div className="flex gap-2">
              <div className="h-5 w-16 rounded bg-gray-200" />
              <div className="h-5 w-20 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
      {/* Grid skeleton */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-24 rounded bg-gray-200" />
              <div className="h-5 w-40 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------
// Main component
// -----------------------------------------------------------
export function AnggotaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [anggota, setAnggota] = useState<AnggotaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('profil');

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function fetchAnggota() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get(`/anggota/${id}`);
        if (!cancelled) {
          setAnggota(res.data.data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Gagal memuat data anggota');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchAnggota();
    return () => { cancelled = true; };
  }, [id]);

  // ---------- Error state ----------
  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/anggota')}
          className="inline-flex items-center gap-1 text-sm font-medium text-cyan-600 hover:underline"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Daftar
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-red-700 underline hover:text-red-900"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // ---------- Loading skeleton ----------
  if (loading) {
    return <DetailSkeleton />;
  }

  // ---------- Not found ----------
  if (!anggota) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/anggota')}
          className="inline-flex items-center gap-1 text-sm font-medium text-cyan-600 hover:underline"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Daftar
        </button>
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-gray-500">Data anggota tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  // ---------- Derived values ----------
  const sabukLabel = SABUK_LABELS[anggota.sabuk] || anggota.sabuk;
  const sabukColor = SABUK_COLORS[anggota.sabuk] || '#D1D5DB';
  const statusLabel = anggota.status_keanggotaan?.replace(/_/g, ' ') || '-';
  const statusColorClasses =
    STATUS_COLORS[anggota.status_keanggotaan] || 'bg-gray-100 text-gray-800';

  // ---------- Render helpers ----------
  function renderField(label: string, value: React.ReactNode) {
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-gray-900">{value || '-'}</p>
      </div>
    );
  }

  // ---------- Info grid data ----------
  const leftFields: { label: string; value: React.ReactNode }[] = [
    { label: 'ID Anggota', value: anggota.id_anggota },
    { label: 'Nama Lengkap', value: anggota.nama_lengkap },
    { label: 'Tempat Lahir', value: anggota.tempat_lahir },
    { label: 'Tanggal Lahir', value: formatDate(anggota.tanggal_lahir) },
    {
      label: 'Jenis Kelamin',
      value: anggota.jenis_kelamin?.replace(/_/g, ' '),
    },
    { label: 'No. Telepon', value: anggota.no_telepon },
    { label: 'Email Pribadi', value: anggota.email_pribadi || '-' },
  ];

  const rightFields: { label: string; value: React.ReactNode }[] = [
    {
      label: 'Sabuk',
      value: (
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: sabukColor }}
          />
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
            style={{ backgroundColor: sabukColor }}
          >
            {sabukLabel}
          </span>
        </span>
      ),
    },
    { label: 'Tanggal Gabung', value: formatDate(anggota.tanggal_gabung) },
    {
      label: 'Status Keanggotaan',
      value: (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColorClasses}`}
        >
          {statusLabel}
        </span>
      ),
    },
    {
      label: 'Tempat Latihan Pertama',
      value: anggota.tempat_latihan_pertama
        ? anggota.tempat_latihan_pertama.kota
          ? `${anggota.tempat_latihan_pertama.nama} (${anggota.tempat_latihan_pertama.kota})`
          : anggota.tempat_latihan_pertama.nama
        : '-',
    },
    {
      label: 'Tempat Latihan Saat Ini',
      value: anggota.tempat_latihan_saat_ini
        ? anggota.tempat_latihan_saat_ini.kota
          ? `${anggota.tempat_latihan_saat_ini.nama} (${anggota.tempat_latihan_saat_ini.kota})`
          : anggota.tempat_latihan_saat_ini.nama
        : '-',
    },
    {
      label: 'Guru/Pelatih Pertama',
      value: anggota.pelatih_pertama?.nama_lengkap || '-',
    },
    {
      label: 'Guru/Pelatih Saat Ini',
      value: anggota.pelatih_saat_ini?.nama_lengkap || '-',
    },
  ];

  // ---------- Tab content placeholders ----------
  function renderTabContent() {
    switch (activeTab) {
      case 'profil':
        return (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              {leftFields.map((f) => (
                <div key={f.label}>{renderField(f.label, f.value)}</div>
              ))}
            </div>
            <div className="space-y-4">
              {rightFields.map((f) => (
                <div key={f.label}>{renderField(f.label, f.value)}</div>
              ))}
            </div>
          </div>
        );
      case 'prestasi':
        return (
          <div className="py-12 text-center text-sm text-gray-400">
            Riwayat prestasi akan ditampilkan di sini.
          </div>
        );
      case 'presensi':
        return (
          <div className="py-12 text-center text-sm text-gray-400">
            Riwayat presensi akan ditampilkan di sini.
          </div>
        );
      default:
        return null;
    }
  }

  // ---------- Main render ----------
  return (
    <div className="space-y-6">
      {/* ---- Back link ---- */}
      <Link
        to="/anggota"
        className="inline-flex items-center gap-1 text-sm font-medium text-cyan-600 hover:underline"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Kembali ke Daftar
      </Link>

      {/* ---- Header card ---- */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            {anggota.foto_url ? (
              <img
                src={anggota.foto_url}
                alt={anggota.nama_lengkap}
                className="h-14 w-14 rounded-full object-cover ring-2 ring-white shadow"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 text-xl font-bold text-white shadow">
                {anggota.nama_lengkap?.charAt(0) || '?'}
              </div>
            )}

            <div>
              <h1 className="text-xl font-bold text-gray-900">{anggota.nama_lengkap}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {/* ID Anggota badge */}
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                  {anggota.id_anggota}
                </span>
                {/* Sabuk badge */}
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: sabukColor }}
                >
                  {sabukLabel}
                </span>
                {/* Status badge */}
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColorClasses}`}
                >
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Link
              to={`/anggota/${id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-300 bg-white px-4 py-2 text-sm font-medium text-cyan-700 shadow-sm transition hover:bg-cyan-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* ---- Tabs ---- */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'border-cyan-500 text-cyan-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ---- Tab content ---- */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {renderTabContent()}
      </div>
    </div>
  );
}
