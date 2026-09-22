import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import { PROVINSI_LIST, KOTA_BY_PROVINSI, KECAMATAN_BY_KOTA, KODE_POS_BY_KECAMATAN, KODE_POS_BY_KOTA, KELURAHAN_BY_KECAMATAN } from '../../lib/locations';

interface Pelatih { id: string; nama_lengkap: string; id_pelatih?: string; }

interface JadwalEntry {
  tipe_jadwal: 'Rutin' | 'Tambahan';
  hari: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  tipe_latihan: string;
  target_peserta: string;
  keterangan: string;
}

function getDayName(dateStr: string): string {
  if (!dateStr) return '';
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[new Date(dateStr).getDay()];
}

function getNextDayDate(dayName: string): string {
  const days: Record<string, number> = { 'Minggu': 0, 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6 };
  const targetDay = days[dayName];
  if (targetDay === undefined) return new Date().toISOString().split('T')[0];
  const today = new Date();
  const diff = (targetDay - today.getDay() + 7) % 7 || 7;
  const next = new Date(today);
  next.setDate(today.getDate() + diff);
  return next.toISOString().split('T')[0];
}

export function LokasiCreatePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pelatihList, setPelatihList] = useState<Pelatih[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedPelatih, setSelectedPelatih] = useState<{ id: string; nama: string } | null>(null);

  // Form Lokasi
  const [lokasi, setLokasi] = useState({
    nama: '', kota: '', provinsi: '', kecamatan: '', kelurahan: '', desa: '', kode_pos: '',
    kapasitas: '', pelatih_pj_id: '', status: 'Aktif',
  });

  // Autocomplete states
  const [provinsiSearch, setProvinsiSearch] = useState('');
  const [showProvinsiDropdown, setShowProvinsiDropdown] = useState(false);
  const [kotaSearch, setKotaSearch] = useState('');
  const [showKotaDropdown, setShowKotaDropdown] = useState(false);
  const [kecamatanSearch, setKecamatanSearch] = useState('');
  const [showKecamatanDropdown, setShowKecamatanDropdown] = useState(false);
  const [kelurahanSearch, setKelurahanSearch] = useState('');
  const [showKelurahanDropdown, setShowKelurahanDropdown] = useState(false);
  const [desaSearch, setDesaSearch] = useState('');
  const [showDesaDropdown, setShowDesaDropdown] = useState(false);
  const provinsiRef = useRef<HTMLDivElement>(null);
  const kotaRef = useRef<HTMLDivElement>(null);
  const kecamatanRef = useRef<HTMLDivElement>(null);
  const kelurahanRef = useRef<HTMLDivElement>(null);
  const desaRef = useRef<HTMLDivElement>(null);

  // Filtered lists
  const filteredProvinsi = PROVINSI_LIST.filter(p =>
    p.toLowerCase().includes(provinsiSearch.toLowerCase())
  );
  const kotaList = lokasi.provinsi ? (KOTA_BY_PROVINSI[lokasi.provinsi] || []) : [];
  const filteredKota = kotaList.filter(k =>
    k.toLowerCase().includes(kotaSearch.toLowerCase())
  );
  const kecamatanList = lokasi.kota ? (KECAMATAN_BY_KOTA[lokasi.kota] || []) : [];
  const filteredKecamatan = kecamatanList.filter(k =>
    k.toLowerCase().includes(kecamatanSearch.toLowerCase())
  );
  const kelurahanList = lokasi.kecamatan ? (KELURAHAN_BY_KECAMATAN[lokasi.kecamatan] || []) : [];
  const filteredKelurahan = kelurahanList.filter(k =>
    k.toLowerCase().includes(kelurahanSearch.toLowerCase())
  );
  const filteredDesa = kelurahanList.filter(k =>
    k.toLowerCase().includes(desaSearch.toLowerCase())
  );

  // Auto-fill kode pos when kecamatan changes
  useEffect(() => {
    if (lokasi.kecamatan && KODE_POS_BY_KECAMATAN[lokasi.kecamatan]) {
      setLokasi(prev => ({ ...prev, kode_pos: KODE_POS_BY_KECAMATAN[lokasi.kecamatan] }));
    } else if (lokasi.kota && KODE_POS_BY_KOTA[lokasi.kota]) {
      setLokasi(prev => ({ ...prev, kode_pos: KODE_POS_BY_KOTA[lokasi.kota] }));
    }
  }, [lokasi.kecamatan, lokasi.kota]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (provinsiRef.current && !provinsiRef.current.contains(e.target as Node)) setShowProvinsiDropdown(false);
      if (kotaRef.current && !kotaRef.current.contains(e.target as Node)) setShowKotaDropdown(false);
      if (kecamatanRef.current && !kecamatanRef.current.contains(e.target as Node)) setShowKecamatanDropdown(false);
      if (kelurahanRef.current && !kelurahanRef.current.contains(e.target as Node)) setShowKelurahanDropdown(false);
      if (desaRef.current && !desaRef.current.contains(e.target as Node)) setShowDesaDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Form Jadwal entries
  const [jadwalList, setJadwalList] = useState<JadwalEntry[]>([
    { tipe_jadwal: 'Rutin', hari: '', tanggal: '', jam_mulai: '', jam_selesai: '', tipe_latihan: 'Rutin', target_peserta: 'Semua_Anggota', keterangan: '' },
  ]);

  useEffect(() => {
    apiClient.get('/pelatih', { params: { limit: 100 } })
      .then(res => setPelatihList(res.data?.data || []))
      .catch(() => toast.error('Gagal memuat data pelatih'))
      .finally(() => setIsLoadingData(false));
  }, []);

  // Auto-select pelatih from PJ
  useEffect(() => {
    if (lokasi.pelatih_pj_id) {
      const selected = pelatihList.find(p => p.id === lokasi.pelatih_pj_id);
      if (selected) setSelectedPelatih({ id: selected.id, nama: selected.nama_lengkap });
      else setSelectedPelatih(null);
    } else {
      setSelectedPelatih(null);
    }
  }, [lokasi.pelatih_pj_id, pelatihList]);

  const handleLokasiChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setLokasi(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleJadwalChange = (index: number, field: keyof JadwalEntry, value: string) => {
    setJadwalList(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      if (field === 'tanggal') updated.hari = getDayName(value);
      return updated;
    }));
  };

  const addJadwal = () => {
    setJadwalList(prev => [...prev, {
      tipe_jadwal: 'Rutin', hari: '', tanggal: '', jam_mulai: '', jam_selesai: '',
      tipe_latihan: 'Rutin', target_peserta: 'Semua_Anggota', keterangan: '',
    }]);
  };

  const removeJadwal = (index: number) => {
    setJadwalList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 0. VALIDATE all jadwal entries BEFORE creating anything
      for (let i = 0; i < jadwalList.length; i++) {
        const jadwal = jadwalList[i];
        if (!jadwal.jam_mulai || !jadwal.jam_selesai) {
          toast.error(`Jadwal ke-${i + 1}: Jam mulai dan jam selesai wajib diisi`);
          setIsSubmitting(false);
          return;
        }
        if (jadwal.tipe_jadwal === 'Rutin' && !jadwal.hari) {
          toast.error(`Jadwal ke-${i + 1}: Hari wajib dipilih untuk latihan rutin`);
          setIsSubmitting(false);
          return;
        }
        if (jadwal.tipe_jadwal === 'Tambahan') {
          if (!jadwal.tanggal) {
            toast.error(`Jadwal ke-${i + 1}: Tanggal wajib diisi untuk latihan tambahan`);
            setIsSubmitting(false);
            return;
          }
          if (!jadwal.keterangan) {
            toast.error(`Jadwal ke-${i + 1}: Keterangan wajib diisi untuk latihan tambahan`);
            setIsSubmitting(false);
            return;
          }
        }
      }

      // 1. Create lokasi
      const lokasiPayload: any = {
        nama: lokasi.nama, kota: lokasi.kota,
        provinsi: lokasi.provinsi, kecamatan: lokasi.kecamatan,
        kelurahan: lokasi.kelurahan || undefined,
        desa: lokasi.desa || undefined,
        jam_operasional: '-',
        kapasitas: parseInt(lokasi.kapasitas) || 0, status: lokasi.status,
      };
      if (lokasi.kode_pos) lokasiPayload.kode_pos = lokasi.kode_pos;
      if (lokasi.pelatih_pj_id) lokasiPayload.pelatih_pj_id = lokasi.pelatih_pj_id;

      const lokasiRes = await apiClient.post('/lokasi', lokasiPayload);
      const newLokasiId = lokasiRes.data.data.id;

      // 2. Create all jadwal entries
      const pelatihId = selectedPelatih?.id;
      if (!pelatihId) {
        toast.error('Lokasi belum memiliki Pelatih PJ');
        return;
      }

      let jadwalCount = 0;
      for (const jadwal of jadwalList) {
        let tanggal: string;
        let judulMateri: string;
        let catatan: string | undefined;

        if (jadwal.tipe_jadwal === 'Rutin') {
          const nextDate = getNextDayDate(jadwal.hari);
          tanggal = nextDate;
          judulMateri = `Latihan Rutin ${jadwal.hari}`;
          catatan = undefined;
        } else {
          tanggal = jadwal.tanggal;
          judulMateri = `Latihan Tambahan — ${jadwal.keterangan}`;
          catatan = jadwal.keterangan;
        }

        await apiClient.post('/jadwal', {
          judul_materi: judulMateri,
          tanggal,
          jam_mulai: `${tanggal}T${jadwal.jam_mulai}:00`,
          jam_selesai: `${tanggal}T${jadwal.jam_selesai}:00`,
          tempat_id: newLokasiId,
          pelatih_id: pelatihId,
          tipe_latihan: jadwal.tipe_latihan,
          target_peserta: jadwal.target_peserta,
          hari: jadwal.tipe_jadwal === 'Rutin' ? jadwal.hari : undefined,
          catatan,
        });
        jadwalCount++;
      }

      toast.success(`Lokasi berhasil dibuat${jadwalCount > 0 ? ` dengan ${jadwalCount} jadwal latihan` : ''}!`);
      navigate('/lokasi');
    } catch (err: any) {
      const res = err?.response?.data;
      if (res?.errors?.length) {
        const msgs = res.errors.map((e: any) => `${e.field?.split('.').pop()}: ${e.message}`).join('\n');
        toast.error(msgs, { duration: 5000 });
      } else {
        toast.error(res?.message || 'Gagal menyimpan data');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tambah Tempat Latihan</h1>
        <p className="text-muted-foreground">Isi data lokasi sekaligus jadwal latihan</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Info Lokasi */}
        <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold border-b pb-3">Informasi Tempat Latihan</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Nama Tempat <span className="text-red-500">*</span></label>
              <input name="nama" value={lokasi.nama} onChange={handleLokasiChange} className={inputClass} placeholder="Contoh: Padepokan Bhayu Manunggal" required />
            </div>
            {/* Provinsi Autocomplete */}
            <div ref={provinsiRef} className="relative">
              <label className="mb-1 block text-sm font-medium">Provinsi <span className="text-red-500">*</span></label>
              <input
                value={lokasi.provinsi || provinsiSearch}
                onChange={e => {
                  setProvinsiSearch(e.target.value);
                  setLokasi(prev => ({ ...prev, provinsi: '', kota: '', kode_pos: '' }));
                  setShowProvinsiDropdown(true);
                }}
                onFocus={() => { setProvinsiSearch(lokasi.provinsi || ''); setShowProvinsiDropdown(true); }}
                className={inputClass}
                placeholder="Ketik atau pilih provinsi"
                required
              />
              {showProvinsiDropdown && filteredProvinsi.length > 0 && (
                <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
                  {filteredProvinsi.slice(0, 15).map(p => (
                    <button key={p} type="button"
                      onClick={() => {
                        setLokasi(prev => ({ ...prev, provinsi: p, kota: '', kode_pos: '' }));
                        setProvinsiSearch('');
                        setKotaSearch('');
                        setShowProvinsiDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-primary/10 transition-colors">
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Kota/Kabupaten Autocomplete */}
            <div ref={kotaRef} className="relative">
              <label className="mb-1 block text-sm font-medium">Kota/Kabupaten <span className="text-red-500">*</span></label>
              <input
                value={lokasi.kota || kotaSearch}
                onChange={e => {
                  setKotaSearch(e.target.value);
                  setLokasi(prev => ({ ...prev, kota: '', kode_pos: '' }));
                  setShowKotaDropdown(true);
                }}
                onFocus={() => {
                  setKotaSearch(lokasi.kota || '');
                  if (lokasi.provinsi) setShowKotaDropdown(true);
                }}
                className={inputClass}
                placeholder={lokasi.provinsi ? 'Ketik atau pilih kota' : 'Pilih provinsi terlebih dahulu'}
                disabled={!lokasi.provinsi}
                required
              />
              {showKotaDropdown && filteredKota.length > 0 && (
                <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
                  {filteredKota.slice(0, 15).map(k => (
                    <button key={k} type="button"
                      onClick={() => {
                        setLokasi(prev => ({ ...prev, kota: k }));
                        setKotaSearch('');
                        setShowKotaDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-primary/10 transition-colors">
                      {k}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Kecamatan Autocomplete */}
            <div ref={kecamatanRef} className="relative">
              <label className="mb-1 block text-sm font-medium">Kecamatan <span className="text-red-500">*</span></label>
              <input
                value={lokasi.kecamatan || kecamatanSearch}
                onChange={e => {
                  setKecamatanSearch(e.target.value);
                  setLokasi(prev => ({ ...prev, kecamatan: '', kode_pos: '' }));
                  setShowKecamatanDropdown(true);
                }}
                onFocus={() => {
                  setKecamatanSearch(lokasi.kecamatan || '');
                  if (lokasi.kota) setShowKecamatanDropdown(true);
                }}
                className={inputClass}
                placeholder={lokasi.kota ? 'Ketik atau pilih kecamatan' : 'Pilih kota terlebih dahulu'}
                disabled={!lokasi.kota}
                required
              />
              {showKecamatanDropdown && filteredKecamatan.length > 0 && (
                <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
                  {filteredKecamatan.slice(0, 15).map(k => (
                    <button key={k} type="button"
                      onClick={() => {
                        setLokasi(prev => ({ ...prev, kecamatan: k }));
                        setKecamatanSearch('');
                        setShowKecamatanDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-primary/10 transition-colors">
                      {k}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Kelurahan Autocomplete */}
            <div ref={kelurahanRef} className="relative">
              <label className="mb-1 block text-sm font-medium">Kelurahan</label>
              <input
                value={lokasi.kelurahan || kelurahanSearch}
                onChange={e => {
                  setKelurahanSearch(e.target.value);
                  setLokasi(prev => ({ ...prev, kelurahan: '' }));
                  setShowKelurahanDropdown(true);
                }}
                onFocus={() => { setKelurahanSearch(lokasi.kelurahan || ''); if (lokasi.kecamatan) setShowKelurahanDropdown(true); }}
                className={inputClass}
                placeholder={lokasi.kecamatan ? 'Ketik atau pilih kelurahan' : 'Pilih kecamatan terlebih dahulu'}
                disabled={!lokasi.kecamatan}
              />
              {showKelurahanDropdown && filteredKelurahan.length > 0 && (
                <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
                  {filteredKelurahan.slice(0, 15).map(k => (
                    <button key={k} type="button"
                      onClick={() => { setLokasi(prev => ({ ...prev, kelurahan: k })); setKelurahanSearch(''); setShowKelurahanDropdown(false); }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-primary/10 transition-colors">
                      {k}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Desa Autocomplete */}
            <div ref={desaRef} className="relative">
              <label className="mb-1 block text-sm font-medium">Desa</label>
              <input
                value={lokasi.desa || desaSearch}
                onChange={e => {
                  setDesaSearch(e.target.value);
                  setLokasi(prev => ({ ...prev, desa: '' }));
                  setShowDesaDropdown(true);
                }}
                onFocus={() => { setDesaSearch(lokasi.desa || ''); if (lokasi.kecamatan) setShowDesaDropdown(true); }}
                className={inputClass}
                placeholder={lokasi.kecamatan ? 'Ketik atau pilih desa' : 'Pilih kecamatan terlebih dahulu'}
                disabled={!lokasi.kecamatan}
              />
              {showDesaDropdown && filteredDesa.length > 0 && (
                <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
                  {filteredDesa.slice(0, 15).map(k => (
                    <button key={k} type="button"
                      onClick={() => { setLokasi(prev => ({ ...prev, desa: k })); setDesaSearch(''); setShowDesaDropdown(false); }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-primary/10 transition-colors">
                      {k}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Kode Pos */}
            <div>
              <label className="mb-1 block text-sm font-medium">Kode Pos</label>
              <input name="kode_pos" value={lokasi.kode_pos} onChange={handleLokasiChange} className={inputClass} placeholder="Otomatis dari kecamatan" readOnly={!!(KODE_POS_BY_KECAMATAN[lokasi.kecamatan] || KODE_POS_BY_KOTA[lokasi.kota])} />
              {(KODE_POS_BY_KECAMATAN[lokasi.kecamatan] || KODE_POS_BY_KOTA[lokasi.kota]) && (
                <p className="mt-1 text-xs text-green-600">✓ Terisi otomatis</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Kapasitas (orang) <span className="text-red-500">*</span></label>
              <input name="kapasitas" type="number" min="1" value={lokasi.kapasitas} onChange={handleLokasiChange} className={inputClass} placeholder="50" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Pelatih PJ <span className="text-red-500">*</span></label>
              <select name="pelatih_pj_id" value={lokasi.pelatih_pj_id} onChange={handleLokasiChange} className={inputClass} disabled={isLoadingData} required>
                <option value="">{isLoadingData ? 'Memuat...' : 'Pilih Pelatih PJ'}</option>
                {pelatihList.map(p => <option key={p.id} value={p.id}>{p.nama_lengkap}{p.id_pelatih ? ` (${p.id_pelatih})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Status <span className="text-red-500">*</span></label>
              <select name="status" value={lokasi.status} onChange={handleLokasiChange} className={inputClass} required>
                <option value="Aktif">Aktif</option>
                <option value="Tidak_Aktif">Tidak Aktif</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>
        </div>

        {/* Jadwal Waktu Latihan */}
        <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b pb-3">
            <h2 className="text-lg font-semibold">Jadwal Waktu Latihan</h2>
            <button type="button" onClick={addJadwal} className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors">
              + Tambah Jadwal
            </button>
          </div>

          {jadwalList.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">Belum ada jadwal. Klik "Tambah Jadwal" untuk menambahkan.</p>
          ) : (
            <div className="space-y-4">
              {jadwalList.map((jadwal, index) => (
                <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  {/* Pilih Tipe Jadwal */}
                  <div className="mb-3 flex gap-2">
                    <button type="button" onClick={() => handleJadwalChange(index, 'tipe_jadwal', 'Rutin')}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        jadwal.tipe_jadwal === 'Rutin'
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}>
                      🔄 Latihan Rutin
                    </button>
                    <button type="button" onClick={() => handleJadwalChange(index, 'tipe_jadwal', 'Tambahan')}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        jadwal.tipe_jadwal === 'Tambahan'
                          ? 'bg-secondary text-white shadow-sm'
                          : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}>
                      📅 Latihan Tambahan
                    </button>
                  </div>

                  {jadwal.tipe_jadwal === 'Rutin' ? (
                    /* === LATIHAN RUTIN: Hari + Jam === */
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="w-40">
                        <label className="mb-1 block text-xs font-medium text-gray-600">Hari <span className="text-red-500">*</span></label>
                        <select value={jadwal.hari} onChange={e => handleJadwalChange(index, 'hari', e.target.value)} className={inputClass} required>
                          <option value="">Pilih Hari</option>
                          <option value="Senin">Senin</option>
                          <option value="Selasa">Selasa</option>
                          <option value="Rabu">Rabu</option>
                          <option value="Kamis">Kamis</option>
                          <option value="Jumat">Jumat</option>
                          <option value="Sabtu">Sabtu</option>
                          <option value="Minggu">Minggu</option>
                        </select>
                      </div>
                      <div className="w-28">
                        <label className="mb-1 block text-xs font-medium text-gray-600">Jam Mulai <span className="text-red-500">*</span></label>
                        <input type="time" value={jadwal.jam_mulai} onChange={e => handleJadwalChange(index, 'jam_mulai', e.target.value)} className={inputClass} required />
                      </div>
                      <div className="w-28">
                        <label className="mb-1 block text-xs font-medium text-gray-600">Jam Selesai <span className="text-red-500">*</span></label>
                        <input type="time" value={jadwal.jam_selesai} onChange={e => handleJadwalChange(index, 'jam_selesai', e.target.value)} className={inputClass} required />
                      </div>
                      <button type="button" onClick={() => removeJadwal(index)} className="rounded-lg bg-red-50 p-2.5 text-red-600 hover:bg-red-100 transition-colors" title="Hapus">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ) : (
                    /* === LATIHAN TAMBAHAN: Tanggal + Jam + Keterangan === */
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="flex-1 min-w-[160px]">
                          <label className="mb-1 block text-xs font-medium text-gray-600">Tanggal <span className="text-red-500">*</span></label>
                          <input type="date" value={jadwal.tanggal} onChange={e => handleJadwalChange(index, 'tanggal', e.target.value)} className={inputClass} required />
                        </div>
                        <div className="w-28">
                          <label className="mb-1 block text-xs font-medium text-gray-600">Jam Mulai <span className="text-red-500">*</span></label>
                          <input type="time" value={jadwal.jam_mulai} onChange={e => handleJadwalChange(index, 'jam_mulai', e.target.value)} className={inputClass} required />
                        </div>
                        <div className="w-28">
                          <label className="mb-1 block text-xs font-medium text-gray-600">Jam Selesai <span className="text-red-500">*</span></label>
                          <input type="time" value={jadwal.jam_selesai} onChange={e => handleJadwalChange(index, 'jam_selesai', e.target.value)} className={inputClass} required />
                        </div>
                        <button type="button" onClick={() => removeJadwal(index)} className="rounded-lg bg-red-50 p-2.5 text-red-600 hover:bg-red-100 transition-colors" title="Hapus">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Keterangan <span className="text-red-500">*</span></label>
                        <input type="text" value={jadwal.keterangan} onChange={e => handleJadwalChange(index, 'keterangan', e.target.value)} className={inputClass} placeholder="Contoh: Latihan persiapan kejuaraan" required />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting || !selectedPelatih} className="rounded-lg bg-gradient-to-r from-primary to-primary-dark px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 hover:shadow-xl disabled:opacity-50">
            {isSubmitting ? 'Menyimpan...' : 'Simpan Tempat Latihan'}
          </button>
          <button type="button" onClick={() => navigate('/lokasi')} className="rounded-lg border px-6 py-2.5 text-sm font-medium hover:bg-gray-50">Batal</button>
        </div>
      </form>
    </div>
  );
}
