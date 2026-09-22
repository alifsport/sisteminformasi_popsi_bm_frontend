import { useState, useEffect, useMemo } from 'react';
import apiClient from '../../api/client';
import { PageHeader } from '../../components/shared/PageHeader';
import { TIPE_LATIHAN_COLORS } from '../../lib/constants';

interface Lokasi { id: string; nama: string; kota?: string; }
interface Pelatih { id: string; nama_lengkap: string; id_pelatih?: string; }
interface Jadwal {
  id: string;
  judul_materi: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  tipe_latihan: string;
  hari?: string;
  catatan?: string;
  tempat?: { id: string; nama: string; kota?: string };
  pelatih?: { id: string; nama_lengkap: string; id_pelatih?: string };
}

const TIPE_OPTIONS = ['', 'Rutin', 'Khusus', 'Ujian', 'Kejuaraan', 'Peringatan'];

export function JadwalPage() {
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lokasiList, setLokasiList] = useState<Lokasi[]>([]);
  const [pelatihPJList, setPelatihPJList] = useState<Pelatih[]>([]);

  // Filters
  const [filterLokasi, setFilterLokasi] = useState('');
  const [filterPelatih, setFilterPelatih] = useState('');
  const [filterHari, setFilterHari] = useState('');
  const [filterTipe, setFilterTipe] = useState('');

  // Fetch lokasi + pelatih PJ (active only)
  useEffect(() => {
    Promise.all([
      apiClient.get('/lokasi', { params: { limit: 100 } }),
      apiClient.get('/pelatih/active-pj'),
    ]).then(([lokRes, pltRes]) => {
      setLokasiList(lokRes.data?.data || []);
      setPelatihPJList(pltRes.data?.data || []);
    }).catch(() => {});
  }, []);

  // Fetch jadwal based on filters
  useEffect(() => {
    setIsLoading(true);
    const params: any = { limit: 200 };
    if (filterLokasi) params.lokasi_id = filterLokasi;
    if (filterPelatih) params.pelatih_id = filterPelatih;
    if (filterHari) params.hari = filterHari;
    if (filterTipe) params.tipe = filterTipe;

    apiClient.get('/jadwal', { params })
      .then(res => setJadwalList(res.data?.data || []))
      .catch(() => setJadwalList([]))
      .finally(() => setIsLoading(false));
  }, [filterLokasi, filterPelatih, filterHari, filterTipe]);

  // Dynamic Hari options from active jadwal
  const availableHari = useMemo(() => {
    const hariSet = new Set<string>();
    jadwalList.forEach(j => { if (j.hari) hariSet.add(j.hari); });
    return Array.from(hariSet).sort();
  }, [jadwalList]);

  const hasFilters = filterLokasi || filterPelatih || filterHari || filterTipe;

  return (
    <div className="space-y-4">
      <PageHeader title="Jadwal Latihan" description="Informasi tempat latihan dan jadwal latihan" />

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Lokasi */}
          <div className="lg:col-span-2">
            <label className="mb-1.5 block text-[13px] font-medium text-gray-600">Lokasi</label>
            <div className="relative">
              <select
                value={filterLokasi}
                onChange={e => setFilterLokasi(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 pr-10 text-[14px] text-gray-800 transition-all duration-150 hover:border-gray-300 hover:bg-white focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/15"
              >
                <option value="">Semua Lokasi</option>
                {lokasiList.map(l => (
                  <option key={l.id} value={l.id}>{l.nama}{l.kota ? ` — ${l.kota}` : ''}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {/* Pelatih PJ */}
          <div className="lg:col-span-2">
            <label className="mb-1.5 block text-[13px] font-medium text-gray-600">Pelatih PJ</label>
            <div className="relative">
              <select
                value={filterPelatih}
                onChange={e => setFilterPelatih(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 pr-10 text-[14px] text-gray-800 transition-all duration-150 hover:border-gray-300 hover:bg-white focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/15"
              >
                <option value="">Semua Pelatih</option>
                {pelatihPJList.map(p => (
                  <option key={p.id} value={p.id}>{p.nama_lengkap}{p.id_pelatih ? ` (${p.id_pelatih})` : ''}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {/* Hari */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-gray-600">Hari</label>
            <div className="relative">
              <select
                value={filterHari}
                onChange={e => setFilterHari(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 pr-10 text-[14px] text-gray-800 transition-all duration-150 hover:border-gray-300 hover:bg-white focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/15"
              >
                <option value="">Semua Hari</option>
                {availableHari.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {/* Tipe */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-gray-600">Tipe</label>
            <div className="relative">
              <select
                value={filterTipe}
                onChange={e => setFilterTipe(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 pr-10 text-[14px] text-gray-800 transition-all duration-150 hover:border-gray-300 hover:bg-white focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/15"
              >
                <option value="">Semua Tipe</option>
                {TIPE_OPTIONS.filter(Boolean).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        {hasFilters && (
          <div className="mt-3 flex justify-end border-t border-gray-100 pt-3">
            <button
              onClick={() => { setFilterLokasi(''); setFilterPelatih(''); setFilterHari(''); setFilterTipe(''); }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-[13px] font-medium text-gray-500 transition-all duration-150 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/80">
            <tr>
              <th className="px-4 py-3 text-[13px] font-semibold text-gray-500">No</th>
              <th className="px-4 py-3 text-[13px] font-semibold text-gray-500">Judul/Materi</th>
              <th className="px-4 py-3 text-[13px] font-semibold text-gray-500">Lokasi</th>
              <th className="px-4 py-3 text-[13px] font-semibold text-gray-500">Pelatih PJ</th>
              <th className="px-4 py-3 text-[13px] font-semibold text-gray-500">Hari/Tanggal</th>
              <th className="px-4 py-3 text-[13px] font-semibold text-gray-500">Jam</th>
              <th className="px-4 py-3 text-[13px] font-semibold text-gray-500">Tipe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                <div className="inline-flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                  Memuat data...
                </div>
              </td></tr>
            ) : jadwalList.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                <div className="text-lg mb-1">📋</div>
                Tidak ada jadwal latihan
              </td></tr>
            ) : (
              jadwalList.map((j, idx) => (
                <tr key={j.id} className="transition-colors hover:bg-gray-50/60">
                  <td className="px-4 py-3 text-gray-400 text-[13px]">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{j.judul_materi}</td>
                  <td className="px-4 py-3">
                    <div className="text-[13px] font-medium text-gray-700">{j.tempat?.nama || '-'}</div>
                    {j.tempat?.kota && <div className="text-[11px] text-gray-400 mt-0.5">{j.tempat.kota}</div>}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-600">{j.pelatih?.nama_lengkap || '-'}</td>
                  <td className="px-4 py-3">
                    {j.hari ? (
                      <span className="inline-flex items-center rounded-md bg-cyan-50 px-2.5 py-1 text-[12px] font-medium text-cyan-700 ring-1 ring-inset ring-cyan-600/20">{j.hari}</span>
                    ) : (
                      <span className="text-[13px] text-gray-600">
                        {j.tanggal ? new Date(j.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-600">
                    {new Date(j.jam_mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} -{' '}
                    {new Date(j.jam_selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-md px-2.5 py-1 text-[12px] font-medium text-white ring-1 ring-inset ring-black/5"
                      style={{ backgroundColor: TIPE_LATIHAN_COLORS[j.tipe_latihan] || '#6B7280' }}>
                      {j.tipe_latihan}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && jadwalList.length > 0 && (
        <div className="text-right text-[12px] text-gray-400">
          Menampilkan {jadwalList.length} jadwal
        </div>
      )}
    </div>
  );
}
