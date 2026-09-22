import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import { SABUK_OPTIONS } from '../../lib/constants';
import { TempatLahirAutocomplete } from '../../components/shared/TempatLahirAutocomplete';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Lokasi {
  id: string;
  nama: string;
  kota?: string;
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function PelatihEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    nama_lengkap: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: '',
    alamat: '',
    no_telepon: '',
    email_pribadi: '',
    sabuk: '',
    tanggal_gabung: '',
  });

  /* Fetch pelatih detail + lokasi list */
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const pelatihRes = await apiClient.get('/pelatih/' + id);

        const p = pelatihRes.data.data;
        setForm({
          nama_lengkap: p.nama_lengkap || '',
          tempat_lahir: p.tempat_lahir || '',
          tanggal_lahir: p.tanggal_lahir ? p.tanggal_lahir.split('T')[0] : '',
          jenis_kelamin: p.jenis_kelamin || '',
          alamat: p.alamat || '',
          no_telepon: p.no_telepon || '',
          email_pribadi: p.email_pribadi || '',
          sabuk: p.sabuk || '',
          tanggal_gabung: p.tanggal_gabung ? p.tanggal_gabung.split('T')[0] : '',
        });
      } catch {
        toast.error('Gagal memuat data pelatih');
        navigate('/pelatih');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSubmitting(true);
    try {
      const payload: Record<string, string | null> = {
        nama_lengkap: form.nama_lengkap,
        tempat_lahir: form.tempat_lahir,
        tanggal_lahir: form.tanggal_lahir,
        jenis_kelamin: form.jenis_kelamin,
        alamat: form.alamat,
        no_telepon: form.no_telepon,
        email_pribadi: form.email_pribadi || null,
        sabuk: form.sabuk || null,
        tanggal_gabung: form.tanggal_gabung,
      };

      await apiClient.put('/pelatih/' + id, payload);
      toast.success('Pelatih berhasil diperbarui!');
      navigate('/pelatih/' + id);
    } catch (err: any) {
      const res = err?.response?.data;
      if (res?.errors?.length) {
        const msgs = res.errors.map((e: any) => `${e.field?.split('.').pop()}: ${e.message}`).join('\n');
        toast.error(msgs, { duration: 5000 });
      } else {
        toast.error(res?.message || 'Gagal memperbarui pelatih');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors';
  const readOnlyClass =
    'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed';

  /* Loading skeleton */
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i}>
                <div className="mb-1 h-4 w-32 animate-pulse rounded bg-gray-200" />
                <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
          <div className="mt-6 flex space-x-3">
            <div className="h-10 w-40 animate-pulse rounded bg-gray-200" />
            <div className="h-10 w-20 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/pelatih/' + id)}
          className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-cyan-600 hover:underline"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Detail
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Pelatih</h1>
        <p className="mt-1 text-sm text-gray-500">
          Memperbarui data pelatih
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Section: Data Identitas */}
        <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 border-b pb-3 text-lg font-semibold text-gray-800">
            Data Identitas
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Left: Nama Lengkap */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nama_lengkap"
                value={form.nama_lengkap}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            {/* Right: ID Pelatih (read-only) */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                ID Pelatih
              </label>
              <input
                type="text"
                readOnly
                className={readOnlyClass}
                placeholder="Tidak dapat diubah"
              />
            </div>

            {/* Left: Tempat Lahir */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tempat Lahir <span className="text-red-500">*</span>
              </label>
              <TempatLahirAutocomplete
                value={form.tempat_lahir}
                onChange={val => setForm(prev => ({ ...prev, tempat_lahir: val }))}
                className={inputClass}
                placeholder="Ketik nama kota atau kabupaten..."
                required
              />
            </div>

            {/* Right: Tanggal Lahir */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tanggal Lahir <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="tanggal_lahir"
                value={form.tanggal_lahir}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            {/* Left: Jenis Kelamin */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Jenis Kelamin <span className="text-red-500">*</span>
              </label>
              <select
                name="jenis_kelamin"
                value={form.jenis_kelamin}
                onChange={handleChange}
                className={inputClass}
                required
              >
                <option value="">Pilih Jenis Kelamin</option>
                <option value="Laki_laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            {/* Right: No. Telepon */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                No. Telepon <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="no_telepon"
                value={form.no_telepon}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
          </div>

          {/* Alamat (full width) */}
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Alamat <span className="text-red-500">*</span>
            </label>
            <textarea
              name="alamat"
              value={form.alamat}
              onChange={handleChange}
              rows={3}
              className={inputClass}
              required
            />
          </div>
        </div>

        {/* Section: Data Kontak */}
        <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 border-b pb-3 text-lg font-semibold text-gray-800">
            Data Kontak
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Left: Email Pribadi */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email Pribadi
              </label>
              <input
                type="email"
                name="email_pribadi"
                value={form.email_pribadi}
                onChange={handleChange}
                className={inputClass}
                placeholder="email@contoh.com (opsional)"
              />
            </div>
            {/* Right: placeholder for consistency */}
            <div />
          </div>
        </div>

        {/* Section: Data Keanggotaan */}
        <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 border-b pb-3 text-lg font-semibold text-gray-800">
            Data Keanggotaan
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Sabuk */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tingkatan Sabuk <span className="text-red-500">*</span>
              </label>
              <select
                name="sabuk"
                value={form.sabuk}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Pilih Tingkatan Sabuk</option>
                {SABUK_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Tanggal Gabung */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tanggal Gabung <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="tanggal_gabung"
                value={form.tanggal_gabung}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/pelatih/' + id)}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 px-8 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-cyan-600 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Menyimpan...
              </>
            ) : (
              'Simpan Perubahan'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
