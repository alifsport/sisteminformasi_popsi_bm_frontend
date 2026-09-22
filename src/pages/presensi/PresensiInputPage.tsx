import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { useInputPresensi } from '../../hooks/usePresensi';
import toast from 'react-hot-toast';

type Step = 1 | 2 | 3;

interface Lokasi {
  id: string;
  nama: string;
  kota?: string;
}

interface Jadwal {
  id: string;
  judul_materi: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  tipe_latihan: string;
  hari?: string;
}

const STATUS_OPTIONS = ['Hadir', 'Sakit', 'Alpa', 'Terlambat'];
const STATUS_ICONS: Record<string, string> = { Hadir: '✅', Sakit: '🏥', Alpa: '❌', Terlambat: '⏰' };
const STATUS_COLORS: Record<string, string> = { Hadir: 'bg-green-500', Sakit: 'bg-purple-500', Alpa: 'bg-red-500', Terlambat: 'bg-orange-500' };

const HARI_MAP: Record<string, number> = { 'Minggu': 0, 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6 };
const HARI_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function getDayName(dateStr: string): string {
  return HARI_NAMES[new Date(dateStr).getDay()];
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function PresensiInputPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);

  // Step 1 state
  const [selectedLokasiId, setSelectedLokasiId] = useState('');
  const [selectedJadwalId, setSelectedJadwalId] = useState('');
  const [selectedDate, setSelectedDate] = useState(''); // YYYY-MM-DD
  const [lokasiList, setLokasiList] = useState<Lokasi[]>([]);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [loadingLokasi, setLoadingLokasi] = useState(true);
  const [loadingJadwal, setLoadingJadwal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Step 2 state
  const [anggotaPresensi, setAnggotaPresensi] = useState<any[]>([]);
  const [loadingAnggota, setLoadingAnggota] = useState(false);

  // Fetch lokasi on mount
  useEffect(() => {
    setLoadingLokasi(true);
    apiClient.get('/lokasi', { params: { limit: 100 } })
      .then(res => setLokasiList(res.data?.data || []))
      .catch(() => toast.error('Gagal memuat data lokasi'))
      .finally(() => setLoadingLokasi(false));
  }, []);

  // Fetch jadwal when lokasi changes
  useEffect(() => {
    if (!selectedLokasiId) {
      setJadwalList([]);
      setSelectedJadwalId('');
      return;
    }
    setLoadingJadwal(true);
    setSelectedJadwalId('');
    apiClient.get('/jadwal', { params: { limit: 200, lokasi_id: selectedLokasiId } })
      .then(res => setJadwalList(res.data?.data || []))
      .catch(() => toast.error('Gagal memuat data jadwal'))
      .finally(() => setLoadingJadwal(false));
  }, [selectedLokasiId]);

  // Get unique hari from jadwal list
  const availableHari = useMemo(() => {
    const hariSet = new Set<string>();
    jadwalList.forEach(j => { if (j.hari) hariSet.add(j.hari); });
    return Array.from(hariSet);
  }, [jadwalList]);

  // Map hari -> jadwal (first jadwal per hari)
  const jadwalByHari = useMemo(() => {
    const map = new Map<string, Jadwal>();
    jadwalList.forEach(j => {
      if (j.hari && !map.has(j.hari)) map.set(j.hari, j);
    });
    return map;
  }, [jadwalList]);

  // Check if a date matches any available jadwal hari
  const isDateAvailable = (date: Date): boolean => {
    const dayName = HARI_NAMES[date.getDay()];
    return availableHari.includes(dayName);
  };

  // Get jadwal for a specific date
  const getJadwalForDate = (date: Date): Jadwal | null => {
    const dayName = HARI_NAMES[date.getDay()];
    return jadwalByHari.get(dayName) || null;
  };

  // Calendar navigation
  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    if (!isDateAvailable(date)) return;
    const jadwal = getJadwalForDate(date);
    if (jadwal) {
      setSelectedJadwalId(jadwal.id);
      setSelectedDate(formatDateStr(date));
    }
  };

  // Selected jadwal info
  const selectedJadwal = useMemo(() => {
    return jadwalList.find(j => j.id === selectedJadwalId) || null;
  }, [jadwalList, selectedJadwalId]);

  const selectedLokasi = useMemo(() => {
    return lokasiList.find(l => l.id === selectedLokasiId) || null;
  }, [lokasiList, selectedLokasiId]);

  // Load anggota
  const loadAnggota = async () => {
    if (!selectedLokasiId || !selectedJadwalId) return;
    setLoadingAnggota(true);
    setStep(2);
    try {
      const anggotaRes = await apiClient.get(`/presensi/anggota-by-lokasi/${selectedLokasiId}`);
      const anggotaList = anggotaRes.data?.data || [];

      let existingMap = new Map<string, string>();
      try {
        const presensiRes = await apiClient.get(`/presensi/jadwal/${selectedJadwalId}`, { params: { tanggal: selectedDate } });
        (presensiRes.data?.data || []).forEach((p: any) => existingMap.set(p.anggota_id, p.status));
      } catch {}

      setAnggotaPresensi(anggotaList.map((a: any) => ({
        anggota_id: a.id,
        nama_lengkap: a.nama_lengkap,
        id_anggota: a.id_anggota,
        sabuk: a.sabuk,
        status: existingMap.get(a.id) || 'Hadir',
      })));
    } catch {
      toast.error('Gagal memuat data anggota');
      setAnggotaPresensi([]);
    } finally {
      setLoadingAnggota(false);
    }
  };

  // Update status
  const updateStatus = (index: number, status: string) => {
    setAnggotaPresensi(prev => prev.map((item, i) => i === index ? { ...item, status } : item));
  };

  // Submit
  const inputMutation = useInputPresensi();
  const handleSubmit = () => {
    if (!selectedJadwalId || anggotaPresensi.length === 0) return;
    inputMutation.mutate(
      { jadwalId: selectedJadwalId, tanggal: selectedDate, data: anggotaPresensi.map(a => ({ anggota_id: a.anggota_id, status: a.status })) },
      { onSuccess: () => navigate('/presensi/rekap') }
    );
  };

  // Stats
  const stats = useMemo(() => {
    const t = anggotaPresensi.length;
    return {
      total: t,
      hadir: anggotaPresensi.filter(a => a.status === 'Hadir').length,
      sakit: anggotaPresensi.filter(a => a.status === 'Sakit').length,
      alpa: anggotaPresensi.filter(a => a.status === 'Alpa').length,
      terlambat: anggotaPresensi.filter(a => a.status === 'Terlambat').length,
    };
  }, [anggotaPresensi]);

  const selectClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors';

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(currentYear, currentMonth, d));
    return cells;
  }, [currentYear, currentMonth]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Input Presensi</h1>
          <p className="text-gray-500">Catat kehadiran anggota untuk jadwal latihan</p>
        </div>
        <button onClick={() => navigate('/presensi/rekap')}
          className="rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-700 hover:bg-cyan-100 transition-colors">
          📊 Lihat Data Presensi
        </button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {[{ num: 1, label: 'Pilih Lokasi & Jadwal' }, { num: 2, label: 'Input Presensi' }, { num: 3, label: 'Review & Submit' }].map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${step === s.num ? 'bg-cyan-500 text-white' : step > s.num ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
              {step > s.num ? '✓' : s.num}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < 2 && <div className={`mx-2 h-px w-8 ${step > s.num ? 'bg-green-300' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* ==================== STEP 1 ==================== */}
      {step === 1 && (
        <div className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold border-b pb-3">Pilih Lokasi & Jadwal</h2>
          <p className="text-sm text-gray-500">Pilih lokasi latihan, lalu pilih tanggal pada kalender sesuai hari jadwal.</p>

          {/* Lokasi */}
          <div>
            <label className="mb-1 block text-sm font-medium">Lokasi Latihan <span className="text-red-500">*</span></label>
            <select value={selectedLokasiId} onChange={e => { setSelectedLokasiId(e.target.value); setSelectedJadwalId(''); setSelectedDate(''); }}
              className={selectClass} disabled={loadingLokasi}>
              <option value="">{loadingLokasi ? 'Memuat lokasi...' : 'Pilih Lokasi Latihan'}</option>
              {lokasiList.filter(l => l.status === 'Aktif').map(l => (
                <option key={l.id} value={l.id}>{l.nama}{l.kota ? ` — ${l.kota}` : ''}</option>
              ))}
            </select>
          </div>

          {/* Kalender Jadwal */}
          {selectedLokasiId && (
            <div>
              <label className="mb-2 block text-sm font-medium">
                Pilih Tanggal Latihan
                {availableHari.length > 0 && (
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    (Hari: {availableHari.join(', ')})
                  </span>
                )}
              </label>

              {loadingJadwal ? (
                <div className="py-8 text-center text-gray-500">
                  <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
                  Memuat jadwal...
                </div>
              ) : jadwalList.length === 0 ? (
                <div className="py-6 text-center text-yellow-600 bg-yellow-50 rounded-lg">
                  Belum ada jadwal latihan pada lokasi ini.
                </div>
              ) : (
                <div className="rounded-lg border p-4">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={prevMonth} className="rounded-lg px-3 py-1 text-sm hover:bg-gray-100">← Prev</button>
                    <h3 className="text-sm font-semibold">{MONTH_NAMES[currentMonth]} {currentYear}</h3>
                    <button onClick={nextMonth} className="rounded-lg px-3 py-1 text-sm hover:bg-gray-100">Next →</button>
                  </div>

                  {/* Day names */}
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
                      <div key={d} className="py-1 text-center text-xs font-medium text-gray-500">{d}</div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((date, i) => {
                      if (!date) return <div key={`empty-${i}`} />;
                      const available = isDateAvailable(date);
                      const isToday = date.getTime() === today.getTime();
                      const isSelected = selectedDate === formatDateStr(date);
                      const isPast = date < today;

                      return (
                        <button
                          key={i}
                          onClick={() => handleDateClick(date)}
                          disabled={!available || isPast}
                          className={`relative h-10 rounded-lg text-sm font-medium transition-all ${
                            !available || isPast
                              ? 'text-gray-300 cursor-not-allowed'
                              : isSelected
                              ? 'bg-cyan-500 text-white shadow-md ring-2 ring-cyan-300'
                              : isToday
                              ? 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 ring-1 ring-cyan-300'
                              : 'bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer'
                          }`}
                        >
                          {date.getDate()}
                          {available && !isPast && (
                            <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-cyan-400'}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cyan-400" /> Hari jadwal tersedia</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gray-300" /> Tidak tersedia</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Selected Info */}
          {selectedJadwal && selectedDate && (
            <div className="rounded-lg bg-cyan-50 p-3 text-sm border border-cyan-200">
              <p className="font-medium text-cyan-800">📋 {selectedJadwal.judul_materi}</p>
              <p className="text-cyan-600">
                {selectedLokasi?.nama} — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} — {new Date(selectedJadwal.jam_mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedJadwal.jam_selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-end pt-2">
            <button onClick={loadAnggota} disabled={!selectedLokasiId || !selectedJadwalId || !selectedDate}
              className="rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 px-6 py-2.5 text-sm font-semibold text-white shadow disabled:opacity-50 disabled:cursor-not-allowed">
              Selanjutnya →
            </button>
          </div>
        </div>
      )}

      {/* ==================== STEP 2 ==================== */}
      {step === 2 && (
        <div className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h2 className="text-lg font-semibold">Daftar Kehadiran</h2>
            {selectedJadwal && (
              <div className="mt-1 text-sm text-gray-500">
                <span className="font-medium text-gray-700">{selectedJadwal.judul_materi}</span>
                {' — '}{selectedLokasi?.nama} — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} — {new Date(selectedJadwal.jam_mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedJadwal.jam_selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>

          {loadingAnggota ? (
            <div className="py-8 text-center text-gray-500">
              <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
              Memuat daftar anggota...
            </div>
          ) : anggotaPresensi.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p className="text-lg">👥</p>
              <p>Belum ada anggota yang terdaftar pada lokasi ini.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                {STATUS_OPTIONS.map(s => (
                  <span key={s} className="flex items-center gap-1">
                    <span className={`inline-block h-2 w-2 rounded-full ${STATUS_COLORS[s]}`} />
                    {STATUS_ICONS[s]} {s} (default)
                  </span>
                ))}
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 w-12">No</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Nama Anggota</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600 w-20">Hadir</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600 w-20">Sakit</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600 w-20">Alpa</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600 w-20">Terlambat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {anggotaPresensi.map((anggota, idx) => (
                      <tr key={anggota.anggota_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{anggota.nama_lengkap}</div>
                          <div className="text-xs text-gray-400">{anggota.id_anggota}</div>
                        </td>
                        {STATUS_OPTIONS.map(s => (
                          <td key={s} className="px-4 py-3 text-center">
                            <input type="radio" name={`p-${anggota.anggota_id}`} checked={anggota.status === s}
                              onChange={() => updateStatus(idx, s)} className="h-4 w-4 text-cyan-500 focus:ring-cyan-500" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400">💡 Semua anggota default "Hadir". Cukup ubah yang tidak hadir saja.</p>
            </>
          )}

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(1)} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium hover:bg-gray-50">← Kembali</button>
            <button onClick={() => setStep(3)} disabled={anggotaPresensi.length === 0}
              className="rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 px-6 py-2.5 text-sm font-semibold text-white shadow disabled:opacity-50">
              Review & Submit →
            </button>
          </div>
        </div>
      )}

      {/* ==================== STEP 3 ==================== */}
      {step === 3 && (
        <div className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold border-b pb-3">Review Presensi</h2>

          {selectedJadwal && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <p className="font-medium">{selectedJadwal.judul_materi}</p>
              <p className="text-gray-500">{selectedLokasi?.nama} — {selectedJadwal.hari} — {new Date(selectedJadwal.jam_mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedJadwal.jam_selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          )}

          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Hadir', count: stats.hadir, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Sakit', count: stats.sakit, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Alpa', count: stats.alpa, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Terlambat', count: stats.terlambat, color: 'text-orange-600', bg: 'bg-orange-50' },
            ].map(s => (
              <div key={s.label} className={`rounded-lg ${s.bg} p-3 text-center`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-gray-500">Total: <span className="font-semibold text-gray-700">{stats.total}</span> anggota</div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">No</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Nama Anggota</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {anggotaPresensi.map((anggota, idx) => (
                  <tr key={anggota.anggota_id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-2 font-medium">{anggota.nama_lengkap}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white ${STATUS_COLORS[anggota.status]}`}>
                        {STATUS_ICONS[anggota.status]} {anggota.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(2)} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium hover:bg-gray-50">← Kembali</button>
            <button onClick={handleSubmit} disabled={inputMutation.isPending || anggotaPresensi.length === 0}
              className="rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow disabled:opacity-50">
              {inputMutation.isPending ? '⏳ Menyimpan...' : '💾 Submit Presensi'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
