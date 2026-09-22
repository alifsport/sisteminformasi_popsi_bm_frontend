import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';

interface Lokasi {
  id: string;
  nama: string;
  kota?: string;
  pelatih_pj_id?: string;
  pelatih_pj?: { id: string; nama_lengkap: string; id_pelatih?: string } | null;
}

export function JadwalCreatePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lokasiList, setLokasiList] = useState<Lokasi[]>([]);
  const [selectedPelatih, setSelectedPelatih] = useState<{ id: string; nama: string } | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [form, setForm] = useState({
    judul_materi: '',
    tanggal: '',
    jam_mulai: '',
    jam_selesai: '',
    tempat_id: '',
    tipe_latihan: 'Rutin',
    target_peserta: 'Semua_Anggota',
    catatan: '',
    pengulangan: 'tidak',
  });

  useEffect(() => {
    apiClient.get('/lokasi', { params: { limit: 100 } })
      .then(res => setLokasiList(res.data?.data || []))
      .catch(() => toast.error('Gagal memuat data lokasi'))
      .finally(() => setIsLoadingData(false));
  }, []);

  // Auto-select pelatih when lokasi changes
  useEffect(() => {
    if (form.tempat_id) {
      const selected = lokasiList.find(l => l.id === form.tempat_id);
      if (selected?.pelatih_pj) {
        setSelectedPelatih({ id: selected.pelatih_pj.id, nama: selected.pelatih_pj.nama_lengkap });
      } else {
        setSelectedPelatih(null);
      }
    } else {
      setSelectedPelatih(null);
    }
  }, [form.tempat_id, lokasiList]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPelatih) {
      toast.error('Lokasi yang dipilih belum memiliki Pelatih PJ');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        judul_materi: form.judul_materi,
        tempat_id: form.tempat_id,
        pelatih_id: selectedPelatih.id,
        tipe_latihan: form.tipe_latihan,
        target_peserta: form.target_peserta,
        pengulangan: form.pengulangan,
      };

      // For Khusus/Ujian/Kejuaraan/Peringatan: include tanggal
      if (form.tipe_latihan !== 'Rutin' && form.tanggal) {
        payload.tanggal = form.tanggal;
        payload.jam_mulai = `${form.tanggal}T${form.jam_mulai}:00`;
        payload.jam_selesai = `${form.tanggal}T${form.jam_selesai}:00`;
      } else {
        // Rutin: use a default date (will be handled by backend)
        payload.tanggal = '1970-01-01';
        payload.jam_mulai = `1970-01-01T${form.jam_mulai}:00`;
        payload.jam_selesai = `1970-01-01T${form.jam_selesai}:00`;
      }
      if (form.catatan) payload.catatan = form.catatan;

      await apiClient.post('/jadwal', payload);
      toast.success('Jadwal latihan berhasil dibuat!');
      navigate('/jadwal');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal membuat jadwal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tambah Jadwal Latihan</h1>
        <p className="text-muted-foreground">Buat jadwal latihan baru</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Informasi Jadwal */}
        <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold border-b pb-3">Informasi Jadwal</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Judul/Materi <span className="text-red-500">*</span></label>
              <input name="judul_materi" value={form.judul_materi} onChange={handleChange} className={inputClass} placeholder="Contoh: Latihan Teknik Dasar" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tipe Latihan <span className="text-red-500">*</span></label>
              <select name="tipe_latihan" value={form.tipe_latihan} onChange={handleChange} className={inputClass} required>
                <option value="Rutin">Rutin</option>
                <option value="Khusus">Khusus</option>
                <option value="Ujian">Ujian</option>
                <option value="Kejuaraan">Kejuaraan</option>
                <option value="Peringatan">Peringatan</option>
              </select>
            </div>
            {form.tipe_latihan !== 'Rutin' && (
              <div>
                <label className="mb-1 block text-sm font-medium">Tanggal <span className="text-red-500">*</span></label>
                <input name="tanggal" type="date" value={form.tanggal} onChange={handleChange} className={inputClass} required />
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">Jam Mulai <span className="text-red-500">*</span></label>
              <input name="jam_mulai" type="time" value={form.jam_mulai} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Jam Selesai <span className="text-red-500">*</span></label>
              <input name="jam_selesai" type="time" value={form.jam_selesai} onChange={handleChange} className={inputClass} required />
            </div>
          </div>
        </div>

        {/* Tempat & Pelatih — INTEGRASI */}
        <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold border-b pb-3">Tempat & Pelatih</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Tempat Latihan <span className="text-red-500">*</span></label>
              <select name="tempat_id" value={form.tempat_id} onChange={handleChange} className={inputClass} disabled={isLoadingData} required>
                <option value="">{isLoadingData ? 'Memuat...' : 'Pilih Tempat Latihan'}</option>
                {lokasiList.filter(l => l.status === 'Aktif').map(l => (
                  <option key={l.id} value={l.id}>{l.nama}{l.kota ? ` — ${l.kota}` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Pelatih (Otomatis dari PJ Lokasi)</label>
              {selectedPelatih ? (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
                  <span className="text-green-600">✅</span>
                  <span className="text-sm font-medium text-green-800">{selectedPelatih.nama}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                  <span className="text-gray-400">—</span>
                  <span className="text-sm text-gray-500">
                    {form.tempat_id ? 'Lokasi belum memiliki Pelatih PJ' : 'Pilih lokasi terlebih dahulu'}
                  </span>
                </div>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Pelatih otomatis diambil dari Pelatih Penanggung Jawab (PJ) lokasi yang dipilih.
          </p>
        </div>

        {/* Target & Pengulangan */}
        <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold border-b pb-3">Target & Pengulangan</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Target Peserta <span className="text-red-500">*</span></label>
              <select name="target_peserta" value={form.target_peserta} onChange={handleChange} className={inputClass} required>
                <option value="Semua_Anggota">Semua Anggota</option>
                <option value="Sabuk_Putih_Hijau">Sabuk Putih - Hijau</option>
                <option value="Sabuk_Biru_Hitam">Sabuk Biru - Hitam</option>
                <option value="Aturan_Khusus">Aturan Khusus</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Pengulangan</label>
              <select name="pengulangan" value={form.pengulangan} onChange={handleChange} className={inputClass}>
                <option value="tidak">Tidak Berulang</option>
                <option value="harian">Harian</option>
                <option value="mingguan">Mingguan</option>
                <option value="bulanan">Bulanan</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Catatan/Materi</label>
              <textarea name="catatan" value={form.catatan} onChange={handleChange} rows={3} className={inputClass} placeholder="Detail materi latihan..." />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting || !selectedPelatih} className="rounded-lg bg-gradient-to-r from-primary to-primary-dark px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 hover:shadow-xl disabled:opacity-50">
            {isSubmitting ? 'Menyimpan...' : 'Simpan Jadwal'}
          </button>
          <button type="button" onClick={() => navigate('/jadwal')} className="rounded-lg border px-6 py-2.5 text-sm font-medium hover:bg-gray-50">Batal</button>
        </div>
      </form>
    </div>
  );
}
