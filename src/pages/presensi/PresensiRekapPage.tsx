import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';

interface Lokasi { id: string; nama: string; kota?: string; }
interface Jadwal {
  id: string;
  judul_materi: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  tipe_latihan: string;
  hari?: string;
  tempat?: { id: string; nama: string; kota?: string };
  pelatih?: { id: string; nama_lengkap: string };
}
interface Presensi {
  id: string;
  status: string;
  keterangan?: string;
  anggota?: { id: string; id_anggota: string; nama_lengkap: string; sabuk: string };
}

export function PresensiRekapPage() {
  const navigate = useNavigate();
  const [lokasiList, setLokasiList] = useState<Lokasi[]>([]);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [presensiList, setPresensiList] = useState<Presensi[]>([]);

  const [selectedLokasiId, setSelectedLokasiId] = useState('');
  const [selectedJadwalId, setSelectedJadwalId] = useState('');
  const [loadingJadwal, setLoadingJadwal] = useState(false);
  const [loadingPresensi, setLoadingPresensi] = useState(false);

  // Load lokasi on mount
  useEffect(() => {
    apiClient.get('/lokasi', { params: { limit: 100 } })
      .then(res => setLokasiList(res.data?.data || []))
      .catch(() => {});
  }, []);

  // Load jadwal when lokasi changes
  useEffect(() => {
    if (!selectedLokasiId) {
      setJadwalList([]);
      setSelectedJadwalId('');
      setPresensiList([]);
      return;
    }
    setLoadingJadwal(true);
    setSelectedJadwalId('');
    setPresensiList([]);
    apiClient.get('/jadwal', { params: { limit: 200, lokasi_id: selectedLokasiId } })
      .then(res => setJadwalList(res.data?.data || []))
      .catch(() => setJadwalList([]))
      .finally(() => setLoadingJadwal(false));
  }, [selectedLokasiId]);

  // Load presensi when jadwal changes
  useEffect(() => {
    if (!selectedJadwalId) {
      setPresensiList([]);
      return;
    }
    setLoadingPresensi(true);
    apiClient.get(`/presensi/jadwal/${selectedJadwalId}`)
      .then(res => setPresensiList(res.data?.data || []))
      .catch(() => setPresensiList([]))
      .finally(() => setLoadingPresensi(false));
  }, [selectedJadwalId]);

  // Selected jadwal info
  const selectedJadwal = jadwalList.find(j => j.id === selectedJadwalId) || null;

  // Stats
  const stats = {
    total: presensiList.length,
    hadir: presensiList.filter(p => p.status === 'Hadir').length,
    sakit: presensiList.filter(p => p.status === 'Sakit').length,
    alpa: presensiList.filter(p => p.status === 'Alpa').length,
    terlambat: presensiList.filter(p => p.status === 'Terlambat').length,
  };

  const selectClass = 'h-11 w-full appearance-none rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 pr-10 text-[14px] text-gray-800 transition-all duration-150 hover:border-gray-300 hover:bg-white focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/15';
  const chevron = <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/presensi')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 transition-colors">← Kembali</button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Rekap Presensi</h1>
            <p className="text-gray-500">Lihat rekap kehadiran anggota berdasarkan jadwal</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-gray-800">Pilih Lokasi & Jadwal</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-gray-600">Lokasi Latihan</label>
            <div className="relative">
              <select value={selectedLokasiId} onChange={e => setSelectedLokasiId(e.target.value)} className={selectClass}>
                <option value="">Semua Lokasi</option>
                {lokasiList.map(l => <option key={l.id} value={l.id}>{l.nama}{l.kota ? ` — ${l.kota}` : ''}</option>)}
              </select>
              {chevron}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-gray-600">Jadwal Latihan</label>
            <div className="relative">
              <select value={selectedJadwalId} onChange={e => setSelectedJadwalId(e.target.value)} disabled={loadingJadwal} className={selectClass + ' disabled:opacity-50'}>
                <option value="">{loadingJadwal ? 'Memuat jadwal...' : 'Pilih jadwal'}</option>
                {jadwalList.map(j => (
                  <option key={j.id} value={j.id}>{j.judul_materi} — {j.hari || new Date(j.tanggal).toLocaleDateString('id-ID')}</option>
                ))}
              </select>
              {chevron}
            </div>
          </div>
        </div>
      </div>

      {/* Jadwal Info */}
      {selectedJadwal && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div><span className="text-gray-400">Judul:</span> <span className="font-medium">{selectedJadwal.judul_materi}</span></div>
            <div className="h-5 w-px bg-gray-200" />
            <div><span className="text-gray-400">Hari:</span> <span className="font-medium">{selectedJadwal.hari || '-'}</span></div>
            <div className="h-5 w-px bg-gray-200" />
            <div><span className="text-gray-400">Waktu:</span> <span className="font-medium">{new Date(selectedJadwal.jam_mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedJadwal.jam_selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span></div>
            <div className="h-5 w-px bg-gray-200" />
            <div><span className="text-gray-400">Lokasi:</span> <span className="font-medium">{selectedJadwal.tempat?.nama || '-'}</span></div>
          </div>
        </div>
      )}

      {/* Stats */}
      {selectedJadwalId && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: 'Total', value: stats.total, color: 'text-gray-800' },
            { label: 'Hadir', value: stats.hadir, color: 'text-green-600' },
            { label: 'Sakit', value: stats.sakit, color: 'text-purple-600' },
            { label: 'Alpa', value: stats.alpa, color: 'text-red-600' },
            { label: 'Terlambat', value: stats.terlambat, color: 'text-orange-600' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Presensi Table */}
      {selectedJadwalId && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-3">
            <h3 className="text-base font-semibold text-gray-800">Daftar Kehadiran</h3>
          </div>
          <div className="overflow-x-auto">
            {loadingPresensi ? (
              <div className="py-8 text-center text-gray-400">Memuat data...</div>
            ) : presensiList.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <div className="text-lg mb-1">📋</div>
                Belum ada data presensi untuk jadwal ini
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-500">No</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-500">Nama Anggota</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-500">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {presensiList.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-[13px]">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{p.anggota?.nama_lengkap || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[12px] font-medium text-white ${
                          p.status === 'Hadir' ? 'bg-green-500' : p.status === 'Sakit' ? 'bg-purple-500' : p.status === 'Alpa' ? 'bg-red-500' : 'bg-orange-500'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-gray-600">{p.keterangan || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {!selectedJadwalId && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <div className="text-3xl mb-2">📊</div>
          <p className="text-gray-400">Pilih lokasi dan jadwal untuk melihat rekap presensi</p>
        </div>
      )}
    </div>
  );
}
