import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';

interface Pelatih { id: string; nama_lengkap: string; id_pelatih?: string; }
interface Jadwal {
  id: string;
  judul_materi: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  tipe_latihan: string;
  hari?: string;
  status: string;
  catatan?: string;
}

const HARI_OPTIONS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

function getNextDayDate(dayName: string): string {
  const days: Record<string, number> = { 'Minggu': 0, 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6 };
  const target = days[dayName];
  if (target === undefined) return new Date().toISOString().split('T')[0];
  const today = new Date();
  const diff = (target - today.getDay() + 7) % 7 || 7;
  const next = new Date(today);
  next.setDate(today.getDate() + diff);
  return next.toISOString().split('T')[0];
}

export function LokasiEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pelatihList, setPelatihList] = useState<Pelatih[]>([]);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [loadingJadwal, setLoadingJadwal] = useState(false);

  // Jadwal form state
  const [jadwalTipe, setJadwalTipe] = useState<'Rutin' | 'Tambahan'>('Rutin');
  const [jadwalHari, setJadwalHari] = useState('');
  const [jadwalTanggal, setJadwalTanggal] = useState('');
  const [jadwalJamMulai, setJadwalJamMulai] = useState('');
  const [jadwalJamSelesai, setJadwalJamSelesai] = useState('');
  const [jadwalKeterangan, setJadwalKeterangan] = useState('');
  const [showJadwalForm, setShowJadwalForm] = useState(false);
  const [isSavingJadwal, setIsSavingJadwal] = useState(false);

  const [form, setForm] = useState({
    nama: '', alamat: '', kota: '', provinsi: '', kecamatan: '', kelurahan: '', desa: '', kode_pos: '',
    kapasitas: '', pelatih_pj_id: '', status: 'Aktif',
  });

  useEffect(() => {
    if (!id) return;
    Promise.all([
      apiClient.get(`/lokasi/${id}`),
      apiClient.get('/pelatih', { params: { limit: 100 } }),
    ]).then(([lokasiRes, pelatihRes]) => {
      const l = lokasiRes.data.data;
      setForm({
        nama: l.nama || '', alamat: l.alamat || '', kota: l.kota || '',
        provinsi: l.provinsi || '', kecamatan: l.kecamatan || '',
        kelurahan: l.kelurahan || '', desa: l.desa || '',
        kode_pos: l.kode_pos || '',
        kapasitas: l.kapasitas?.toString() || '',
        pelatih_pj_id: l.pelatih_pj_id || '', status: l.status || 'Aktif',
      });
      setPelatihList(pelatihRes.data?.data || []);
      loadJadwal();
    }).catch(() => { toast.error('Gagal memuat data'); navigate('/lokasi'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const loadJadwal = () => {
    if (!id) return;
    setLoadingJadwal(true);
    apiClient.get('/jadwal', { params: { limit: 200, lokasi_id: id } })
      .then(res => setJadwalList(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoadingJadwal(false));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Save lokasi info
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);
    try {
      const payload: any = {
        nama: form.nama, kota: form.kota,
        provinsi: form.provinsi, kapasitas: parseInt(form.kapasitas) || 0, status: form.status,
      };
      if (form.alamat) payload.alamat = form.alamat;
      if (form.kecamatan) payload.kecamatan = form.kecamatan;
      if (form.kelurahan) payload.kelurahan = form.kelurahan;
      if (form.desa) payload.desa = form.desa;
      if (form.kode_pos) payload.kode_pos = form.kode_pos;
      if (form.pelatih_pj_id) payload.pelatih_pj_id = form.pelatih_pj_id;
      else payload.pelatih_pj_id = null;

      await apiClient.put(`/lokasi/${id}`, payload);
      toast.success('Lokasi berhasil diperbarui!');
      navigate(`/lokasi/${id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memperbarui lokasi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add jadwal
  const handleAddJadwal = async () => {
    if (!id) return;
    if (!jadwalJamMulai || !jadwalJamSelesai) {
      toast.error('Jam mulai dan jam selesai wajib diisi');
      return;
    }
    if (jadwalTipe === 'Rutin' && !jadwalHari) {
      toast.error('Hari wajib dipilih untuk latihan rutin');
      return;
    }
    if (jadwalTipe === 'Tambahan') {
      if (!jadwalTanggal) { toast.error('Tanggal wajib diisi untuk latihan tambahan'); return; }
      if (!jadwalKeterangan) { toast.error('Keterangan wajib diisi untuk latihan tambahan'); return; }
    }

    setIsSavingJadwal(true);
    try {
      let tanggal: string;
      let judulMateri: string;
      let catatan: string | undefined;

      if (jadwalTipe === 'Rutin') {
        tanggal = getNextDayDate(jadwalHari);
        judulMateri = `Latihan Rutin ${jadwalHari}`;
        catatan = undefined;
      } else {
        tanggal = jadwalTanggal;
        judulMateri = `Latihan Tambahan — ${jadwalKeterangan}`;
        catatan = jadwalKeterangan;
      }

      const payload: any = {
        judul_materi: judulMateri,
        tanggal,
        jam_mulai: `${tanggal}T${jadwalJamMulai}:00`,
        jam_selesai: `${tanggal}T${jadwalJamSelesai}:00`,
        tempat_id: id,
        tipe_latihan: jadwalTipe === 'Rutin' ? 'Rutin' : 'Khusus',
        target_peserta: 'Semua_Anggota',
        hari: jadwalTipe === 'Rutin' ? jadwalHari : undefined,
        catatan,
      };

      if (form.pelatih_pj_id) payload.pelatih_id = form.pelatih_pj_id;

      await apiClient.post('/jadwal', payload);
      toast.success('Jadwal berhasil ditambahkan!');

      // Reset form & close
      setJadwalHari('');
      setJadwalTanggal('');
      setJadwalJamMulai('');
      setJadwalJamSelesai('');
      setJadwalKeterangan('');
      setShowJadwalForm(false);

      // Reload jadwal list
      loadJadwal();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.errors?.[0]?.message || 'Gagal menambahkan jadwal';
      toast.error(msg);
    } finally {
      setIsSavingJadwal(false);
    }
  };

  // Delete jadwal
  const handleDeleteJadwal = async (jadwalId: string, judul: string) => {
    if (!confirm(`Hapus jadwal "${judul}"?`)) return;
    try {
      await apiClient.delete(`/jadwal/${jadwalId}`);
      toast.success('Jadwal berhasil dihapus');
      loadJadwal();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus jadwal');
    }
  };

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors';

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Edit Lokasi</h1><p className="text-muted-foreground">Perbarui data lokasi dan tambah jadwal latihan</p></div>

      {/* Form Lokasi */}
      <form onSubmit={handleSubmit}>
        <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold border-b pb-3">Informasi Dasar</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2"><label className="mb-1 block text-sm font-medium">Nama Lokasi <span className="text-red-500">*</span></label><input name="nama" value={form.nama} onChange={handleChange} className={inputClass} required /></div>
            <div className="md:col-span-2"><label className="mb-1 block text-sm font-medium">Alamat</label><input name="alamat" value={form.alamat} onChange={handleChange} className={inputClass} /></div>
            <div><label className="mb-1 block text-sm font-medium">Kota/Kabupaten <span className="text-red-500">*</span></label><input name="kota" value={form.kota} onChange={handleChange} className={inputClass} required /></div>
            <div><label className="mb-1 block text-sm font-medium">Provinsi <span className="text-red-500">*</span></label><input name="provinsi" value={form.provinsi} onChange={handleChange} className={inputClass} required /></div>
            <div><label className="mb-1 block text-sm font-medium">Kecamatan</label><input name="kecamatan" value={form.kecamatan} onChange={handleChange} className={inputClass} /></div>
            <div><label className="mb-1 block text-sm font-medium">Kelurahan</label><input name="kelurahan" value={form.kelurahan} onChange={handleChange} className={inputClass} /></div>
            <div><label className="mb-1 block text-sm font-medium">Desa</label><input name="desa" value={form.desa} onChange={handleChange} className={inputClass} /></div>
            <div><label className="mb-1 block text-sm font-medium">Kode Pos</label><input name="kode_pos" value={form.kode_pos} onChange={handleChange} className={inputClass} /></div>
            <div><label className="mb-1 block text-sm font-medium">Status <span className="text-red-500">*</span></label><select name="status" value={form.status} onChange={handleChange} className={inputClass} required><option value="Aktif">Aktif</option><option value="Tidak_Aktif">Tidak Aktif</option><option value="Maintenance">Maintenance</option></select></div>
          </div>
        </div>
        <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold border-b pb-3">Operasional</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div><label className="mb-1 block text-sm font-medium">Kapasitas (orang) <span className="text-red-500">*</span></label><input name="kapasitas" type="number" min="1" value={form.kapasitas} onChange={handleChange} className={inputClass} required /></div>
            <div><label className="mb-1 block text-sm font-medium">Pelatih PJ</label><select name="pelatih_pj_id" value={form.pelatih_pj_id} onChange={handleChange} className={inputClass}><option value="">Pilih Pelatih PJ</option>{pelatihList.map(p => <option key={p.id} value={p.id}>{p.nama_lengkap}{p.id_pelatih ? ` (${p.id_pelatih})` : ''}</option>)}</select></div>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-gradient-to-r from-primary to-primary-dark px-6 py-2.5 text-sm font-semibold text-white shadow-lg disabled:opacity-50">{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
          <button type="button" onClick={() => navigate('/lokasi')} className="rounded-lg border px-6 py-2.5 text-sm font-medium hover:bg-gray-50">Batal</button>
        </div>
      </form>

      {/* ==================== SECTION JADWAL ==================== */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <h2 className="text-lg font-semibold">Jadwal Latihan</h2>
          <button type="button" onClick={() => {
            setJadwalHari(''); setJadwalTanggal(''); setJadwalJamMulai(''); setJadwalJamSelesai(''); setJadwalKeterangan('');
            setShowJadwalForm(!showJadwalForm);
          }} className="rounded-lg bg-cyan-50 px-3 py-1.5 text-sm font-medium text-cyan-700 hover:bg-cyan-100 transition-colors">
            {showJadwalForm ? '✕ Batal' : '+ Tambah Jadwal'}
          </button>
        </div>

        {/* Form Tambah Jadwal */}
        {showJadwalForm && (
          <div className="mb-4 rounded-lg border border-cyan-200 bg-cyan-50 p-4 space-y-3">
            {/* Tipe Jadwal Toggle */}
            <div className="flex gap-2">
              <button type="button" onClick={() => setJadwalTipe('Rutin')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${jadwalTipe === 'Rutin' ? 'bg-cyan-500 text-white shadow-sm' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
                🔄 Latihan Rutin
              </button>
              <button type="button" onClick={() => setJadwalTipe('Tambahan')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${jadwalTipe === 'Tambahan' ? 'bg-orange-500 text-white shadow-sm' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
                📅 Latihan Tambahan
              </button>
            </div>

            {jadwalTipe === 'Rutin' ? (
              /* RUTIN: Hari + Jam */
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-40">
                  <label className="mb-1 block text-xs font-medium text-gray-600">Hari <span className="text-red-500">*</span></label>
                  <select value={jadwalHari} onChange={e => setJadwalHari(e.target.value)} className={inputClass} required>
                    <option value="">Pilih Hari</option>
                    {HARI_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div className="w-28">
                  <label className="mb-1 block text-xs font-medium text-gray-600">Jam Mulai <span className="text-red-500">*</span></label>
                  <input type="time" value={jadwalJamMulai} onChange={e => setJadwalJamMulai(e.target.value)} className={inputClass} required />
                </div>
                <div className="w-28">
                  <label className="mb-1 block text-xs font-medium text-gray-600">Jam Selesai <span className="text-red-500">*</span></label>
                  <input type="time" value={jadwalJamSelesai} onChange={e => setJadwalJamSelesai(e.target.value)} className={inputClass} required />
                </div>
                <button type="button" onClick={handleAddJadwal} disabled={isSavingJadwal}
                  className="rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-cyan-600 disabled:opacity-50">
                  {isSavingJadwal ? 'Menyimpan...' : '💾 Simpan'}
                </button>
              </div>
            ) : (
              /* TAMBAHAN: Tanggal + Jam + Keterangan */
              <div className="space-y-3">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[160px]">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Tanggal <span className="text-red-500">*</span></label>
                    <input type="date" value={jadwalTanggal} onChange={e => setJadwalTanggal(e.target.value)} className={inputClass} required />
                  </div>
                  <div className="w-28">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Jam Mulai <span className="text-red-500">*</span></label>
                    <input type="time" value={jadwalJamMulai} onChange={e => setJadwalJamMulai(e.target.value)} className={inputClass} required />
                  </div>
                  <div className="w-28">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Jam Selesai <span className="text-red-500">*</span></label>
                    <input type="time" value={jadwalJamSelesai} onChange={e => setJadwalJamSelesai(e.target.value)} className={inputClass} required />
                  </div>
                  <button type="button" onClick={handleAddJadwal} disabled={isSavingJadwal}
                    className="rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-cyan-600 disabled:opacity-50">
                    {isSavingJadwal ? 'Menyimpan...' : '💾 Simpan'}
                  </button>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Keterangan <span className="text-red-500">*</span></label>
                  <input type="text" value={jadwalKeterangan} onChange={e => setJadwalKeterangan(e.target.value)} className={inputClass} placeholder="Contoh: Latihan persiapan kejuaraan" required />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Daftar Jadwal Existing */}
        {loadingJadwal ? (
          <div className="py-4 text-center text-gray-500">Memuat jadwal...</div>
        ) : jadwalList.length === 0 ? (
          <div className="py-6 text-center text-gray-400">Belum ada jadwal latihan</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600 w-10">No</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Judul/Materi</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Hari/Tanggal</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Jam</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Tipe</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-600 w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {jadwalList.map((j, idx) => (
                  <tr key={j.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-2 font-medium">{j.judul_materi}</td>
                    <td className="px-4 py-2 text-sm">
                      {j.hari ? (
                        <span className="inline-block rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-medium text-cyan-700">{j.hari}</span>
                      ) : (
                        <span>{j.tanggal ? new Date(j.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {new Date(j.jam_mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {new Date(j.jam_selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white ${j.tipe_latihan === 'Rutin' ? 'bg-cyan-500' : 'bg-orange-500'}`}>
                        {j.tipe_latihan}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${j.status === 'Dijadwalkan' ? 'bg-green-100 text-green-700' : j.status === 'Selesai' ? 'bg-gray-100 text-gray-600' : j.status === 'Dibatalkan' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {j.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => handleDeleteJadwal(j.id, j.judul_materi)}
                        className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors">
                        🗑️ Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
