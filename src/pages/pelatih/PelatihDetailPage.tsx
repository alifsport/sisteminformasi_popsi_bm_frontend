import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PelatihDetail {
  id: string;
  id_pelatih: string;
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  alamat: string;
  no_telepon: string;
  email_pribadi?: string;
  foto_url?: string;
  tempat_melatih?: { id: string; nama: string; kota?: string } | null;
  tempat_melatih_id?: string;
  tanggal_gabung: string;
  anggota_count?: number;
  user?: { email: string } | null;
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/*  Loading Skeleton                                                   */
/* ------------------------------------------------------------------ */

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
              <div className="h-5 w-20 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
      {/* Grid skeleton */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 12 }).map((_, i) => (
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

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function PelatihDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [pelatih, setPelatih] = useState<PelatihDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function fetchPelatih() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get('/pelatih/' + id);
        if (!cancelled) {
          setPelatih(res.data.data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Gagal memuat data pelatih');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPelatih();
    return () => { cancelled = true; };
  }, [id]);

  /* Loading skeleton */
  if (loading) {
    return <DetailSkeleton />;
  }

  /* Error state */
  if (error || !pelatih) {
    return (
      <div className="space-y-4">
        <Link
          to="/pelatih"
          className="inline-flex items-center gap-1 text-sm font-medium text-cyan-600 hover:underline"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Daftar
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-red-600">
            {error || 'Data pelatih tidak ditemukan'}
          </p>
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

  /* Derived values */
  const jenisKelaminLabel = pelatih.jenis_kelamin === 'Laki_laki' ? 'Laki-laki' : 'Perempuan';
  const tanggalLahir = pelatih.tanggal_lahir?.split('T')[0] || '-';
  const tanggalGabung = pelatih.tanggal_gabung?.split('T')[0] || '-';
  const namaTempatMelatih = pelatih.tempat_melatih
    ? pelatih.tempat_melatih.kota
      ? `${pelatih.tempat_melatih.nama} (${pelatih.tempat_melatih.kota})`
      : pelatih.tempat_melatih.nama
    : '-';
  const jumlahAnggota = pelatih.anggota_count ?? 0;

  /* Render helper */
  function renderField(label: string, value: React.ReactNode) {
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-gray-900">{value || '-'}</p>
      </div>
    );
  }

  /* Field definitions */
  const leftFields: { label: string; value: React.ReactNode }[] = [
    { label: 'ID Pelatih', value: pelatih.id_pelatih },
    { label: 'Nama Lengkap', value: pelatih.nama_lengkap },
    { label: 'Tempat Lahir', value: pelatih.tempat_lahir },
    { label: 'Tanggal Lahir', value: tanggalLahir },
    { label: 'Jenis Kelamin', value: jenisKelaminLabel },
    { label: 'No. Telepon', value: pelatih.no_telepon },
  ];

  const rightFields: { label: string; value: React.ReactNode }[] = [
    { label: 'Email (Login)', value: pelatih.user?.email || '-' },
    { label: 'Email Pribadi', value: pelatih.email_pribadi || '-' },
    { label: 'Tempat Melatih', value: namaTempatMelatih },
    { label: 'Tanggal Gabung', value: tanggalGabung },
    { label: 'Jumlah Anggota', value: String(jumlahAnggota) },
  ];

  /* ---------- Main render ---------- */
  return (
    <div className="space-y-6">
      {/* ---- Back link ---- */}
      <Link
        to="/pelatih"
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
            {pelatih.foto_url ? (
              <img
                src={pelatih.foto_url}
                alt={pelatih.nama_lengkap}
                className="h-14 w-14 rounded-full object-cover ring-2 ring-white shadow"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 text-xl font-bold text-white shadow">
                {pelatih.nama_lengkap?.charAt(0) || '?'}
              </div>
            )}

            <div>
              <h1 className="text-xl font-bold text-gray-900">{pelatih.nama_lengkap}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {/* ID Pelatih badge */}
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                  {pelatih.id_pelatih}
                </span>
                {/* Status badge - always Aktif */}
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                  Aktif
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Link
              to={`/pelatih/${id}/edit`}
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

      {/* ---- Info Grid ---- */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 border-b pb-3 text-lg font-semibold text-gray-800">Informasi Lengkap</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-5">
            {leftFields.map((f) => (
              <div key={f.label}>{renderField(f.label, f.value)}</div>
            ))}
          </div>
          <div className="space-y-5">
            {rightFields.map((f) => (
              <div key={f.label}>{renderField(f.label, f.value)}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
