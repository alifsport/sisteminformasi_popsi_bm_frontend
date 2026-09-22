import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import { SABUK_OPTIONS } from '../../lib/constants';

// Normalize sabuk value from CSV (case-insensitive matching)
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

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; message: string; data: string }[];
}

interface ParsedRow {
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  alamat: string;
  no_telepon: string;
  email: string;
  sabuk: string;
  tanggal_gabung: string;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length < headers.length) continue;

    const row: any = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row as ParsedRow);
  }

  return rows;
}

export function PelatihImportPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

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
    const errors: { row: number; message: string; data: string }[] = [];

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      try {
        // Validate required fields
        if (!row.nama_lengkap || !row.email || !row.sabuk) {
          failed++;
          errors.push({ row: i + 2, message: 'Data tidak lengkap (nama, email, sabuk wajib)', data: row.nama_lengkap || `Baris ${i + 2}` });
          continue;
        }

        await apiClient.post('/pelatih', {
          nama_lengkap: row.nama_lengkap,
          tempat_lahir: row.tempat_lahir || '-',
          tanggal_lahir: row.tanggal_lahir || '2000-01-01',
          jenis_kelamin: row.jenis_kelamin || 'Laki_laki',
          alamat: row.alamat || '-',
          no_telepon: row.no_telepon || '08000000000',
          email: row.email,
          sabuk: normalizeSabuk(row.sabuk),
          tanggal_gabung: row.tanggal_gabung || new Date().toISOString().split('T')[0],
        });
        success++;
      } catch (err: any) {
        failed++;
        const msg = err?.response?.data?.message || err?.message || 'Unknown error';
        errors.push({ row: i + 2, message: msg, data: row.nama_lengkap });
      }
    }

    setResult({ success, failed, errors });
    setIsImporting(false);

    if (success > 0) toast.success(`${success} pelatih berhasil diimport`);
    if (failed > 0) toast.error(`${failed} pelatih gagal diimport`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Pelatih Massal</h1>
        <p className="text-muted-foreground">Import data pelatih dari file CSV</p>
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
          <a href="/template-import-pelatih.csv" download className="text-primary hover:underline font-medium">
            Download Template CSV
          </a>
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
              {isImporting ? 'Mengimport...' : `Import ${parsedData.length} Pelatih`}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">#</th>
                  <th className="px-3 py-2 text-left font-medium">Nama</th>
                  <th className="px-3 py-2 text-left font-medium">Email</th>
                  <th className="px-3 py-2 text-left font-medium">Sabuk</th>
                  <th className="px-3 py-2 text-left font-medium">Tempat Lahir</th>
                  <th className="px-3 py-2 text-left font-medium">No. Telepon</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {parsedData.slice(0, 10).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">{row.nama_lengkap}</td>
                    <td className="px-3 py-2">{row.email}</td>
                    <td className="px-3 py-2">{row.sabuk}</td>
                    <td className="px-3 py-2">{row.tempat_lahir}</td>
                    <td className="px-3 py-2">{row.no_telepon}</td>
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
              <div className="max-h-48 overflow-y-auto rounded-lg border bg-red-50 p-3">
                {result.errors.map((err, i) => (
                  <div key={i} className="mb-1 text-sm">
                    <span className="font-medium">Baris {err.row}</span> ({err.data}): <span className="text-red-600">{err.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <button onClick={() => navigate('/pelatih')} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
              Lihat Daftar Pelatih
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
