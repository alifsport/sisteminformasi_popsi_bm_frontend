import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import { SABUK_OPTIONS } from '../../lib/constants';

// ==================== NORMALIZE SABUK ====================
function normalizeSabuk(value: string): string {
  if (!value) return 'Belum_Sabuk';
  const trimmed = value.trim();
  const direct = SABUK_OPTIONS.find(s => s.value === trimmed);
  if (direct) return direct.value;
  const lower = trimmed.toLowerCase();
  const match = SABUK_OPTIONS.find(s => s.value.toLowerCase() === lower);
  if (match) return match.value;
  const withUnderscore = trimmed.replace(/\s+/g, '_');
  const match2 = SABUK_OPTIONS.find(s => s.value.toLowerCase() === withUnderscore.toLowerCase());
  if (match2) return match2.value;
  return trimmed;
}

// ==================== LEVENSHTEIN DISTANCE ====================
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

// ==================== FUZZY MATCH ====================
interface FuzzyResult {
  found: boolean;
  id: string;
  name: string;
  distance: number;
}

function fuzzyMatch(input: string, items: { id: string; name: string }[]): FuzzyResult | null {
  if (!input || !input.trim()) return null;
  const q = input.trim().toLowerCase();

  // 1. Exact match
  const exact = items.find(i => i.name.toLowerCase() === q);
  if (exact) return { found: true, id: exact.id, name: exact.name, distance: 0 };

  // 2. Contains match
  const contains = items.filter(i => i.name.toLowerCase().includes(q) || q.includes(i.name.toLowerCase()));
  if (contains.length === 1) return { found: true, id: contains[0].id, name: contains[0].name, distance: 1 };
  if (contains.length > 1) {
    // Pick closest
    contains.sort((a, b) => levenshtein(a.name.toLowerCase(), q) - levenshtein(b.name.toLowerCase(), q));
    return { found: true, id: contains[0].id, name: contains[0].name, distance: 1 };
  }

  // 3. Levenshtein distance <= 3 (typo tolerance)
  let best: FuzzyResult | null = null;
  for (const item of items) {
    const d = levenshtein(item.name.toLowerCase(), q);
    if (d <= 3 && (!best || d < best.distance)) {
      best = { found: true, id: item.id, name: item.name, distance: d };
    }
  }
  if (best) return best;

  // 4. Not found
  const closest = items.reduce((best, item) => {
    const d = levenshtein(item.name.toLowerCase(), q);
    return d < best.distance ? { ...best, name: item.name, distance: d } : best;
  }, { name: '', distance: Infinity });

  return { found: false, id: '', name: closest.name, distance: closest.distance };
}

// ==================== TYPES ====================
interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; message: string; data: string; suggestions?: string[] }[];
}

interface ParsedRow {
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  no_telepon: string;
  email_pribadi: string;
  sabuk: string;
  tanggal_gabung: string;
  status_keanggotaan: string;
  tempat_latihan_pertama: string;
  tempat_latihan_saat_ini: string;
  pelatih_pertama: string;
  pelatih_saat_ini: string;
}

interface LokasiItem { id: string; nama: string; }
interface PelatihItem { id: string; nama_lengkap: string; }

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length < 3) continue;

    const row: any = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row as ParsedRow);
  }

  return rows;
}

// ==================== COMPONENT ====================
export function AnggotaImportPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  // Reference data for fuzzy matching
  const [lokasiList, setLokasiList] = useState<LokasiItem[]>([]);
  const [pelatihList, setPelatihList] = useState<PelatihItem[]>([]);

  useEffect(() => {
    apiClient.get('/lokasi', { params: { limit: 200 } })
      .then(res => setLokasiList(res.data?.data || []))
      .catch(() => {});
    apiClient.get('/pelatih', { params: { limit: 200 } })
      .then(res => setPelatihList(res.data?.data || []))
      .catch(() => {});
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length === 0) {
        toast.error('CSV kosong atau format tidak sesuai');
        return;
      }
      setParsedData(rows);
      toast.success(`${rows.length} data ditemukan`);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    setIsImporting(true);
    setResult(null);

    let success = 0;
    let failed = 0;
    const errors: { row: number; message: string; data: string; suggestions?: string[] }[] = [];

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      try {
        if (!row.nama_lengkap || !row.no_telepon || !row.sabuk) {
          failed++;
          errors.push({ row: i + 2, message: 'Data tidak lengkap (nama, no_telepon, sabuk wajib)', data: row.nama_lengkap || `Baris ${i + 2}` });
          continue;
        }

        // Fuzzy match lokasi
        let lokasiPertamaId: string | null = null;
        let lokasiSaatIniId: string | null = null;

        if (row.tempat_latihan_pertama) {
          const lokItems = lokasiList.map(l => ({ id: l.id, name: l.nama }));
          const match = fuzzyMatch(row.tempat_latihan_pertama, lokItems);
          if (match?.found) {
            lokasiPertamaId = match.id;
          } else {
            const suggestions = lokasiList.slice(0, 5).map(l => l.nama);
            failed++;
            errors.push({
              row: i + 2,
              message: `Lokasi "${row.tempat_latihan_pertama}" tidak ditemukan. Maksud: ${match?.name || '?'}?`,
              data: row.nama_lengkap,
              suggestions,
            });
            continue;
          }
        }

        if (row.tempat_latihan_saat_ini) {
          const lokItems = lokasiList.map(l => ({ id: l.id, name: l.nama }));
          const match = fuzzyMatch(row.tempat_latihan_saat_ini, lokItems);
          if (match?.found) {
            lokasiSaatIniId = match.id;
          } else {
            const suggestions = lokasiList.slice(0, 5).map(l => l.nama);
            failed++;
            errors.push({
              row: i + 2,
              message: `Lokasi "${row.tempat_latihan_saat_ini}" tidak ditemukan`,
              data: row.nama_lengkap,
              suggestions,
            });
            continue;
          }
        }

        // Fuzzy match pelatih
        let pelatihPertamaId: string | null = null;
        let pelatihSaatIniId: string | null = null;

        if (row.pelatih_pertama) {
          const pltItems = pelatihList.map(p => ({ id: p.id, name: p.nama_lengkap }));
          const match = fuzzyMatch(row.pelatih_pertama, pltItems);
          if (match?.found) {
            pelatihPertamaId = match.id;
          } else {
            const suggestions = pelatihList.slice(0, 5).map(p => p.nama_lengkap);
            failed++;
            errors.push({
              row: i + 2,
              message: `Pelatih "${row.pelatih_pertama}" tidak ditemukan`,
              data: row.nama_lengkap,
              suggestions,
            });
            continue;
          }
        }

        if (row.pelatih_saat_ini) {
          const pltItems = pelatihList.map(p => ({ id: p.id, name: p.nama_lengkap }));
          const match = fuzzyMatch(row.pelatih_saat_ini, pltItems);
          if (match?.found) {
            pelatihSaatIniId = match.id;
          } else {
            const suggestions = pelatihList.slice(0, 5).map(p => p.nama_lengkap);
            failed++;
            errors.push({
              row: i + 2,
              message: `Pelatih "${row.pelatih_saat_ini}" tidak ditemukan`,
              data: row.nama_lengkap,
              suggestions,
            });
            continue;
          }
        }

        await apiClient.post('/anggota', {
          nama_lengkap: row.nama_lengkap,
          tempat_lahir: row.tempat_lahir || '-',
          tanggal_lahir: row.tanggal_lahir || '2000-01-01',
          jenis_kelamin: row.jenis_kelamin || 'Laki_laki',
          no_telepon: row.no_telepon,
          email_pribadi: row.email_pribadi || null,
          sabuk: normalizeSabuk(row.sabuk),
          tanggal_gabung: row.tanggal_gabung || new Date().toISOString().split('T')[0],
          status_keanggotaan: row.status_keanggotaan || 'Aktif',
          tempat_latihan_pertama_id: lokasiPertamaId,
          tempat_latihan_saat_ini_id: lokasiSaatIniId,
          pelatih_pertama_id: pelatihPertamaId,
          pelatih_saat_ini_id: pelatihSaatIniId,
        });
        success++;
      } catch (err: any) {
        failed++;
        const msg = err?.response?.data?.message || err?.response?.data?.errors?.[0]?.message || err?.message || 'Unknown error';
        errors.push({ row: i + 2, message: msg, data: row.nama_lengkap || `Baris ${i + 2}` });
      }
    }

    setResult({ success, failed, errors });
    setIsImporting(false);

    if (success > 0) toast.success(`${success} anggota berhasil diimport`);
    if (failed > 0) toast.error(`${failed} anggota gagal diimport`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Anggota Massal</h1>
        <p className="text-muted-foreground">Import data anggota dari file CSV</p>
      </div>

      {/* Upload Section */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold border-b pb-3">Upload File CSV</h2>

        <div className="mb-4 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-primary transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="mb-4 text-4xl">📄</div>
          <p className="mb-2 text-sm text-gray-600">
            {fileName ? `File: ${fileName}` : 'Klik untuk memilih file CSV'}
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
          >
            Pilih File CSV
          </button>
        </div>

        {/* Template Download */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Belum punya template?</span>
          <a href="/template-import-anggota.csv" download className="text-primary hover:underline font-medium">
            Download Template CSV
          </a>
        </div>

        {/* Format Info */}
        <div className="mt-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
          <p className="font-semibold mb-1">Format CSV yang diperlukan:</p>
          <p className="break-all">nama_lengkap, tempat_lahir, tanggal_lahir, jenis_kelamin, no_telepon, email_pribadi, sabuk, tanggal_gabung, status_keanggotaan, <b>tempat_latihan_pertama</b>, <b>tempat_latihan_saat_ini</b>, <b>pelatih_pertama</b>, <b>pelatih_saat_ini</b></p>
          <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
            <p>• jenis_kelamin: Laki_laki / Perempuan</p>
            <p>• sabuk: Belum_Sabuk, Merah_Strip_1..3, Biru_Polos, Biru_Strip_1..3, Hijau_Polos, Hijau_Strip_1..2</p>
            <p>• status_keanggotaan: Aktif / Tidak_Aktif / Pengurus / Pelatih</p>
            <p>• tempat_latihan: <b>nama lokasi</b> (bukan ID) — typo otomatis dicocokkan</p>
            <p>• pelatih: <b>nama pelatih</b> (bukan ID) — typo otomatis dicocokkan</p>
            <p>• Kolom lokasi & pelatih boleh dikosongkan jika tidak perlu</p>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {parsedData.length > 0 && !result && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b pb-3">
            <h2 className="text-lg font-semibold">Preview Data ({parsedData.length} baris)</h2>
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="rounded-lg bg-gradient-to-r from-primary to-primary-dark px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-50"
            >
              {isImporting ? 'Mengimport...' : `Import ${parsedData.length} Anggota`}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">#</th>
                  <th className="px-3 py-2 text-left font-medium">Nama</th>
                  <th className="px-3 py-2 text-left font-medium">No. HP</th>
                  <th className="px-3 py-2 text-left font-medium">Sabuk</th>
                  <th className="px-3 py-2 text-left font-medium">Lokasi Awal</th>
                  <th className="px-3 py-2 text-left font-medium">Lokasi Saat Ini</th>
                  <th className="px-3 py-2 text-left font-medium">Pelatih Awal</th>
                  <th className="px-3 py-2 text-left font-medium">Pelatih Saat Ini</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {parsedData.slice(0, 10).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">{row.nama_lengkap}</td>
                    <td className="px-3 py-2">{row.no_telepon}</td>
                    <td className="px-3 py-2">{row.sabuk}</td>
                    <td className="px-3 py-2 text-xs">{row.tempat_latihan_pertama || '-'}</td>
                    <td className="px-3 py-2 text-xs">{row.tempat_latihan_saat_ini || '-'}</td>
                    <td className="px-3 py-2 text-xs">{row.pelatih_pertama || '-'}</td>
                    <td className="px-3 py-2 text-xs">{row.pelatih_saat_ini || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.length > 10 && (
              <p className="mt-2 text-center text-sm text-gray-500">... dan {parsedData.length - 10} baris lagi</p>
            )}
          </div>
        </div>
      )}

      {/* Result Section */}
      {result && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold border-b pb-3">Hasil Import</h2>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{result.success}</p>
              <p className="text-sm text-green-700">Berhasil</p>
            </div>
            <div className="rounded-lg bg-red-50 p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{result.failed}</p>
              <p className="text-sm text-red-700">Gagal</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-semibold text-red-700">Detail Error:</h3>
              <div className="max-h-64 overflow-y-auto rounded-lg border bg-red-50 p-3 space-y-2">
                {result.errors.map((err, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium">Baris {err.row}</span> ({err.data}): <span className="text-red-600">{err.message}</span>
                    {err.suggestions && err.suggestions.length > 0 && (
                      <div className="mt-1 ml-4 text-xs text-gray-600">
                        Saran: {err.suggestions.map((s, j) => (
                          <span key={j} className="mr-2 rounded bg-green-100 px-1.5 py-0.5 text-green-700 font-medium">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <button onClick={() => navigate('/anggota')} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
              Lihat Daftar Anggota
            </button>
            <button onClick={() => { setParsedData([]); setResult(null); setFileName(''); }} className="rounded-lg border px-4 py-2 text-sm font-medium">
              Import Lagi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
