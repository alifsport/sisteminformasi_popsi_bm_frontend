import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import { SABUK_OPTIONS } from '../../lib/constants';

interface Lokasi {
  id: string;
  nama: string;
  kota?: string;
}

interface Pelatih {
  id: string;
  nama_lengkap: string;
  id_pelatih?: string;
}

export function AnggotaCreatePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lokasiList, setLokasiList] = useState<Lokasi[]>([]);
  const [pelatihList, setPelatihList] = useState<Pelatih[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [form, setForm] = useState({
    nama_lengkap: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: '',
    no_telepon: '',
    email_pribadi: '',
    sabuk: '',
    tanggal_gabung: new Date().toISOString().split('T')[0],
    status_keanggotaan: '',
    tempat_latihan_pertama_id: '',
    tempat_latihan_saat_ini_id: '',
    pelatih_pertama_id: '',
    pelatih_saat_ini_id: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lokasiRes, pelatihRes] = await Promise.all([
          apiClient.get('/lokasi', { params: { limit: 100 } }),
          apiClient.get('/pelatih', { params: { limit: 100 } }),
        ]);
        setLokasiList(lokasiRes.data?.data?.data ?? lokasiRes.data?.data ?? []);
        setPelatihList(pelatihRes.data?.data?.data ?? pelatihRes.data?.data ?? []);
      } catch (err) {
        toast.error('Gagal memuat data lokasi dan pelatih');
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Clean payload: empty strings → null/undefined for optional fields
      const payload: any = {
        nama_lengkap: form.nama_lengkap,
        tempat_lahir: form.tempat_lahir,
        tanggal_lahir: form.tanggal_lahir,
        jenis_kelamin: form.jenis_kelamin,
        no_telepon: form.no_telepon,
        sabuk: form.sabuk,
        tanggal_gabung: form.tanggal_gabung,
        status_keanggotaan: form.status_keanggotaan || 'Aktif',
      };
      // Only include optional fields if they have values
      if (form.email_pribadi) payload.email_pribadi = form.email_pribadi;
      if (form.tempat_latihan_pertama_id) payload.tempat_latihan_pertama_id = form.tempat_latihan_pertama_id;
      if (form.tempat_latihan_saat_ini_id) payload.tempat_latihan_saat_ini_id = form.tempat_latihan_saat_ini_id;
      if (form.pelatih_pertama_id) payload.pelatih_pertama_id = form.pelatih_pertama_id;
      if (form.pelatih_saat_ini_id) payload.pelatih_saat_ini_id = form.pelatih_saat_ini_id;

      await apiClient.post('/anggota', payload);
      toast.success('Anggota berhasil ditambahkan!');
      navigate('/anggota');
    } catch (err: any) {
      const res = err?.response?.data;
      if (res?.errors?.length) {
        const msgs = res.errors.map((e: any) => `${e.field?.split('.').pop()}: ${e.message}`).join('\n');
        toast.error(msgs, { duration: 5000 });
      } else {
        toast.error(res?.message || 'Gagal menambahkan anggota');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors';
  const readOnlyClass =
    'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed';

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tambah Anggota Baru</h1>
        <p className="mt-1 text-sm text-gray-500">Isi data anggota baru</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Section: Data Identitas */}
        <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 border-b pb-3">
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
                placeholder="Masukkan nama lengkap"
                required
              />
            </div>
            {/* Right: ID Anggota */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                ID Anggota
              </label>
              <input
                type="text"
                readOnly
                className={readOnlyClass}
                placeholder="Auto Generate (AG001)"
              />
            </div>
          </div>
        </div>

        {/* Section: Data Keanggotaan */}
        <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 border-b pb-3">
            Data Keanggotaan
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Left column */}
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
                placeholder="Masukkan tempat lahir"
                required
              />
            </div>
            {/* Right column: Tanggal Lahir */}
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
                placeholder="Masukkan nomor telepon"
                required
              />
            </div>

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
                placeholder="Masukkan email pribadi (opsional)"
              />
            </div>
            {/* Right: Sabuk */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Sabuk <span className="text-red-500">*</span>
              </label>
              <select
                name="sabuk"
                value={form.sabuk}
                onChange={handleChange}
                className={inputClass}
                required
              >
                <option value="">Pilih Sabuk</option>
                {SABUK_OPTIONS.map((sabuk) => (
                  <option key={sabuk.value} value={sabuk.value}>
                    {sabuk.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Left: Tanggal Gabung */}
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
            {/* Right: Status */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status_keanggotaan"
                value={form.status_keanggotaan}
                onChange={handleChange}
                className={inputClass}
                required
              >
                <option value="">Pilih Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Tidak_Aktif">Tidak Aktif</option>
                <option value="Pengurus">Pengurus</option>
                <option value="Pelatih">Pelatih</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section: Riwayat Latihan */}
        <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 border-b pb-3">
            Riwayat Latihan
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Left: Tempat Latihan Pertama */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tempat Latihan Pertama
              </label>
              <select
                name="tempat_latihan_pertama_id"
                value={form.tempat_latihan_pertama_id}
                onChange={handleChange}
                className={inputClass}
                disabled={isLoadingData}
              >
                <option value="">
                  {isLoadingData ? 'Memuat data...' : 'Pilih Tempat Latihan'}
                </option>
                {lokasiList.map((lokasi) => (
                  <option key={lokasi.id} value={lokasi.id}>
                    {lokasi.nama}{lokasi.kota ? ` — ${lokasi.kota}` : ''}
                  </option>
                ))}
              </select>
            </div>
            {/* Right: Tempat Latihan Saat Ini */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tempat Latihan Saat Ini
              </label>
              <select
                name="tempat_latihan_saat_ini_id"
                value={form.tempat_latihan_saat_ini_id}
                onChange={handleChange}
                className={inputClass}
                disabled={isLoadingData}
              >
                <option value="">
                  {isLoadingData ? 'Memuat data...' : 'Pilih Tempat Latihan'}
                </option>
                {lokasiList.map((lokasi) => (
                  <option key={lokasi.id} value={lokasi.id}>
                    {lokasi.nama}{lokasi.kota ? ` — ${lokasi.kota}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Left: Guru/Pelatih Pertama */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Guru/Pelatih Pertama
              </label>
              <select
                name="pelatih_pertama_id"
                value={form.pelatih_pertama_id}
                onChange={handleChange}
                className={inputClass}
                disabled={isLoadingData}
              >
                <option value="">
                  {isLoadingData ? 'Memuat data...' : 'Pilih Guru/Pelatih'}
                </option>
                {pelatihList.map((pelatih) => (
                  <option key={pelatih.id} value={pelatih.id}>
                    {pelatih.nama_lengkap}{pelatih.id_pelatih ? ` (${pelatih.id_pelatih})` : ''}
                  </option>
                ))}
              </select>
            </div>
            {/* Right: Guru/Pelatih Saat Ini */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Guru/Pelatih Saat Ini
              </label>
              <select
                name="pelatih_saat_ini_id"
                value={form.pelatih_saat_ini_id}
                onChange={handleChange}
                className={inputClass}
                disabled={isLoadingData}
              >
                <option value="">
                  {isLoadingData ? 'Memuat data...' : 'Pilih Guru/Pelatih'}
                </option>
                {pelatihList.map((pelatih) => (
                  <option key={pelatih.id} value={pelatih.id}>
                    {pelatih.nama_lengkap}{pelatih.id_pelatih ? ` (${pelatih.id_pelatih})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/anggota')}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 px-8 py-2.5 text-sm font-medium text-white shadow-sm hover:from-cyan-600 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
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
              'Simpan Anggota'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
