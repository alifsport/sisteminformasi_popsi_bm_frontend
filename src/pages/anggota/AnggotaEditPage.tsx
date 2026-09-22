import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import { SABUK_OPTIONS } from '../../lib/constants';

interface Lokasi {
  id: string;
  nama: string;
  kota?: string;
}

interface Pelatih {
  id: string;
  nama_lengkap: string;
}

interface AnggotaDetail {
  id_anggota: string;
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  email_pribadi: string;
  tanggal_gabung: string;
  no_telepon: string;
  sabuk: string;
  status_keanggotaan: string;
  tempat_latihan_pertama_id: string;
  tempat_latihan_saat_ini_id: string;
  pelatih_pertama_id: string;
  pelatih_saat_ini_id: string;
}

const STATUS_OPTIONS = ['Aktif', 'Tidak_Aktif', 'Pengurus', 'Pelatih'];
const JK_OPTIONS = ['Laki_laki', 'Perempuan'];

export function AnggotaEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lokasiList, setLokasiList] = useState<Lokasi[]>([]);
  const [pelatihList, setPelatihList] = useState<Pelatih[]>([]);

  const [form, setForm] = useState({
    nama_lengkap: '',
    id_anggota: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: 'Laki_laki',
    email_pribadi: '',
    tanggal_gabung: '',
    no_telepon: '',
    sabuk: 'Belum_Sabuk',
    status_keanggotaan: 'Aktif',
    tempat_latihan_pertama_id: '',
    tempat_latihan_saat_ini_id: '',
    pelatih_pertama_id: '',
    pelatih_saat_ini_id: '',
  });

  // Fetch anggota detail, lokasi list, and pelatih list on mount
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [anggotaRes, lokasiRes, pelatihRes] = await Promise.all([
          apiClient.get('/anggota/' + id),
          apiClient.get('/lokasi', { params: { limit: 100 } }),
          apiClient.get('/pelatih', { params: { limit: 100 } }),
        ]);

        const anggota = anggotaRes.data.data;
        setForm({
          nama_lengkap: anggota.nama_lengkap || '',
          id_anggota: anggota.id_anggota || anggota.id || '',
          tempat_lahir: anggota.tempat_lahir || '',
          tanggal_lahir: anggota.tanggal_lahir ? anggota.tanggal_lahir.split('T')[0] : '',
          jenis_kelamin: anggota.jenis_kelamin || 'Laki_laki',
          email_pribadi: anggota.email_pribadi || '',
          tanggal_gabung: anggota.tanggal_gabung ? anggota.tanggal_gabung.split('T')[0] : '',
          no_telepon: anggota.no_telepon || '',
          sabuk: anggota.sabuk || 'Belum_Sabuk',
          status_keanggotaan: anggota.status_keanggotaan || 'Aktif',
          tempat_latihan_pertama_id: anggota.tempat_latihan_pertama_id || '',
          tempat_latihan_saat_ini_id: anggota.tempat_latihan_saat_ini_id || '',
          pelatih_pertama_id: anggota.pelatih_pertama_id || '',
          pelatih_saat_ini_id: anggota.pelatih_saat_ini_id || '',
        });

        setLokasiList(lokasiRes.data.data || []);
        setPelatihList(pelatihRes.data.data || []);
      } catch {
        toast.error('Gagal memuat data anggota');
        navigate('/anggota');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSubmitting(true);
    try {
      // Convert empty strings to null for UUID fields
      const payload = {
        ...form,
        email_pribadi: form.email_pribadi || null,
        tempat_latihan_pertama_id: form.tempat_latihan_pertama_id || null,
        tempat_latihan_saat_ini_id: form.tempat_latihan_saat_ini_id || null,
        pelatih_pertama_id: form.pelatih_pertama_id || null,
        pelatih_saat_ini_id: form.pelatih_saat_ini_id || null,
      };
      await apiClient.put('/anggota/' + id, payload);
      toast.success('Data anggota berhasil diperbarui');
      navigate('/anggota/' + id);
    } catch {
      const res = err?.response?.data;
      if (res?.errors?.length) {
        const msgs = res.errors.map((e: any) => `${e.field?.split('.').pop()}: ${e.message}`).join('\n');
        toast.error(msgs, { duration: 5000 });
      } else {
        toast.error(res?.message || 'Gagal memperbarui data anggota');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-200" />
        </div>

        {/* Form skeleton */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}>
                <div className="mb-1 h-4 w-32 animate-pulse rounded bg-gray-200" />
                <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
          <div className="mt-6 flex space-x-3">
            <div className="h-10 w-36 animate-pulse rounded bg-gray-200" />
            <div className="h-10 w-20 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500';
  const selectClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Anggota</h1>
        <p className="mt-1 text-sm text-gray-500">Perbarui data anggota</p>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {/* ---- LEFT COLUMN ---- */}

          {/* Nama Lengkap */}
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

          {/* ---- RIGHT COLUMN ---- */}

          {/* ID Anggota (READ-ONLY + DISABLED) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              ID Anggota
            </label>
            <input
              type="text"
              name="id_anggota"
              value={form.id_anggota}
              className={inputClass}
              readOnly
              disabled
            />
          </div>

          {/* ---- LEFT COLUMN ---- */}

          {/* Tempat Lahir */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tempat Lahir <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="tempat_lahir"
              value={form.tempat_lahir}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>

          {/* ---- RIGHT COLUMN ---- */}

          {/* Tanggal Lahir */}
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

          {/* ---- LEFT COLUMN ---- */}

          {/* Jenis Kelamin */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Jenis Kelamin <span className="text-red-500">*</span>
            </label>
            <select
              name="jenis_kelamin"
              value={form.jenis_kelamin}
              onChange={handleChange}
              className={selectClass}
              required
            >
              {JK_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* ---- RIGHT COLUMN ---- */}

          {/* No. Telepon */}
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

          {/* ---- LEFT COLUMN ---- */}

          {/* Email Pribadi */}
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
            />
          </div>

          {/* ---- RIGHT COLUMN ---- */}

          {/* Sabuk */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Sabuk <span className="text-red-500">*</span>
            </label>
            <select
              name="sabuk"
              value={form.sabuk}
              onChange={handleChange}
              className={selectClass}
              required
            >
              {SABUK_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* ---- LEFT COLUMN ---- */}

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

          {/* ---- RIGHT COLUMN ---- */}

          {/* Status */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              name="status_keanggotaan"
              value={form.status_keanggotaan}
              onChange={handleChange}
              className={selectClass}
              required
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* ---- LEFT COLUMN ---- */}

          {/* Tempat Latihan Pertama */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tempat Latihan Pertama
            </label>
            <select
              name="tempat_latihan_pertama_id"
              value={form.tempat_latihan_pertama_id}
              onChange={handleChange}
              className={selectClass}
            >
              <option value="">-- Pilih Lokasi --</option>
              {lokasiList.map((lokasi) => (
                <option key={lokasi.id} value={lokasi.id}>
                  {lokasi.nama}{lokasi.kota ? ` — ${lokasi.kota}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* ---- RIGHT COLUMN ---- */}

          {/* Tempat Latihan Saat Ini */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tempat Latihan Saat Ini
            </label>
            <select
              name="tempat_latihan_saat_ini_id"
              value={form.tempat_latihan_saat_ini_id}
              onChange={handleChange}
              className={selectClass}
            >
              <option value="">-- Pilih Lokasi --</option>
              {lokasiList.map((lokasi) => (
                <option key={lokasi.id} value={lokasi.id}>
                  {lokasi.nama}{lokasi.kota ? ` — ${lokasi.kota}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* ---- LEFT COLUMN ---- */}

          {/* Guru/Pelatih Pertama */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Guru/Pelatih Pertama
            </label>
            <select
              name="pelatih_pertama_id"
              value={form.pelatih_pertama_id}
              onChange={handleChange}
              className={selectClass}
            >
              <option value="">-- Pilih Pelatih --</option>
              {pelatihList.map((pelatih) => (
                <option key={pelatih.id} value={pelatih.id}>
                  {pelatih.nama_lengkap}
                </option>
              ))}
            </select>
          </div>

          {/* ---- RIGHT COLUMN ---- */}

          {/* Guru/Pelatih Saat Ini */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Guru/Pelatih Saat Ini
            </label>
            <select
              name="pelatih_saat_ini_id"
              value={form.pelatih_saat_ini_id}
              onChange={handleChange}
              className={selectClass}
            >
              <option value="">-- Pilih Pelatih --</option>
              {pelatihList.map((pelatih) => (
                <option key={pelatih.id} value={pelatih.id}>
                  {pelatih.nama_lengkap}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex space-x-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/anggota/' + id)}
            className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
