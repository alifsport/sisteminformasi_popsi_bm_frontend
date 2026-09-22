import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

export function PelatihListPage() {
  const navigate = useNavigate();
  const [pelatihList, setPelatihList] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [lokasiFilter, setLokasiFilter] = useState('');
  const [lokasiList, setLokasiList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedList, setArchivedList] = useState<any[]>([]);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [permanentDeleteId, setPermanentDeleteId] = useState<string | null>(null);
  const [deletePreview, setDeletePreview] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page: pagination.page, limit: pagination.limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (lokasiFilter) params.lokasi = lokasiFilter;
      const res = await apiClient.get('/pelatih', { params });
      setPelatihList(res.data?.data || []);
      setPagination(res.data?.pagination || pagination);
    } catch { toast.error('Gagal memuat data pelatih'); }
    finally { setLoading(false); }
  }, [pagination.page, pagination.limit, debouncedSearch, lokasiFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    apiClient.get('/lokasi', { params: { limit: 100 } })
      .then(res => setLokasiList(res.data?.data || []))
      .catch(() => {});
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await apiClient.delete(`/pelatih/${deleteId}`);
      toast.success('Pelatih berhasil diarsipkan');
      setDeleteId(null);
      fetchData();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Gagal menghapus pelatih'); }
  };

  const fetchArchived = async () => {
    setLoadingArchived(true);
    try {
      const res = await apiClient.get('/pelatih/archived');
      setArchivedList(res.data?.data || []);
    } catch { toast.error('Gagal memuat arsip pelatih'); }
    finally { setLoadingArchived(false); }
  };

  const handleRestore = async () => {
    if (!restoreId) return;
    try {
      await apiClient.put(`/pelatih/${restoreId}/restore`);
      toast.success('Pelatih berhasil dipulihkan');
      setRestoreId(null);
      fetchArchived();
      fetchData();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Gagal memulihkan pelatih'); }
  };

  const handlePermanentDelete = async () => {
    if (!permanentDeleteId) return;
    try {
      await apiClient.delete(`/pelatih/${permanentDeleteId}/permanent`);
      toast.success('Pelatih berhasil dihapus permanen');
      setPermanentDeleteId(null);
      setDeletePreview(null);
      fetchArchived();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Gagal menghapus pelatih'); }
  };

  const fetchDeletePreview = async (id: string) => {
    setLoadingPreview(true);
    setDeletePreview(null);
    try {
      const res = await apiClient.get(`/pelatih/${id}/delete-preview`);
      setDeletePreview(res.data?.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memuat data');
      setPermanentDeleteId(null);
    } finally { setLoadingPreview(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold">Manajemen Pelatih</h1><p className="text-muted-foreground">Kelola data pelatih</p></div>
        <div className="flex gap-2">
          <button onClick={() => { setShowArchived(true); fetchArchived(); }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            📦 Arsip
          </button>
          <button onClick={() => navigate('/pelatih/import')} className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5">📥 Import</button>
          <button onClick={() => navigate('/pelatih/tambah')} className="rounded-lg bg-gradient-to-r from-primary to-primary-dark px-4 py-2 text-sm font-semibold text-white shadow">+ Tambah Pelatih</button>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input placeholder="Cari nama, ID, email..." value={search} onChange={e => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }} className="flex-1 rounded-lg border px-3 py-2 text-sm" />
          <select value={lokasiFilter} onChange={e => { setLokasiFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }} className="rounded-lg border px-3 py-2 text-sm">
            <option value="">Semua Lokasi</option>
            {lokasiList.map((l: any) => <option key={l.id} value={l.id}>{l.nama}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="px-4 py-3 text-left font-medium">ID Pelatih</th>
            <th className="px-4 py-3 text-left font-medium">Nama</th>
            <th className="px-4 py-3 text-left font-medium">Tempat Melatih</th>
            <th className="px-4 py-3 text-left font-medium">Email</th>
            <th className="px-4 py-3 text-left font-medium">No. Telepon</th>
            <th className="px-4 py-3 text-left font-medium">Aksi</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
            ) : pelatihList.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Belum ada data pelatih</td></tr>
            ) : pelatihList.map((p: any) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.id_pelatih}</td>
                <td className="px-4 py-3">{p.nama_lengkap}</td>
                <td className="px-4 py-3">{p.tempat_melatih?.nama || '-'}</td>
                <td className="px-4 py-3">{p.user?.email || p.email_pribadi || '-'}</td>
                <td className="px-4 py-3">{p.no_telepon}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => navigate(`/pelatih/${p.id}`)} className="rounded px-2 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100">Lihat</button>
                    <button onClick={() => navigate(`/pelatih/${p.id}/edit`)} className="rounded px-2 py-1 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100">Edit</button>
                    <button onClick={() => setDeleteId(p.id)} className="rounded px-2 py-1 text-xs bg-red-50 text-red-700 hover:bg-red-100">Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Total: {pagination.total} pelatih</span>
          <div className="flex gap-1">
            <button disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} className="rounded border px-3 py-1 disabled:opacity-50">Sebelumnya</button>
            <span className="rounded border px-3 py-1">{pagination.page} / {pagination.totalPages}</span>
            <button disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} className="rounded border px-3 py-1 disabled:opacity-50">Selanjutnya</button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Hapus Pelatih?</h3>
            <p className="text-sm text-gray-600 mb-1">Pelatih akan diarsipkan dan tidak muncul di daftar.</p>
            <p className="text-xs text-gray-400 mb-4">Data historis (jadwal, presensi) tetap tersimpan.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteId(null)} className="rounded-lg border px-4 py-2 text-sm">Tidak</button>
              <button onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {showArchived && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-white shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b p-5">
              <h3 className="text-lg font-semibold">📦 Arsip Pelatih</h3>
              <button onClick={() => setShowArchived(false)} className="rounded-lg p-1 hover:bg-gray-100 transition-colors">
                <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto p-5 flex-1">
              {loadingArchived ? (
                <div className="py-8 text-center text-gray-500">Memuat arsip...</div>
              ) : archivedList.length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                  <div className="text-3xl mb-2">📭</div>
                  Tidak ada pelatih dalam arsip
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Nama</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">ID Pelatih</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Diarsipkan</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {archivedList.map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium">{p.nama_lengkap}</td>
                        <td className="px-3 py-2 text-gray-500">{p.id_pelatih}</td>
                        <td className="px-3 py-2 text-xs text-gray-400">
                          {p.deleted_at ? new Date(p.deleted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-center gap-1">
                            <button onClick={() => setRestoreId(p.id)}
                              className="rounded px-2 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                              ↩️ Pulihkan
                            </button>
                            <button onClick={() => { setPermanentDeleteId(p.id); fetchDeletePreview(p.id); }}
                              className="rounded px-2 py-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
                              🗑️ Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation */}
      {restoreId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Pulihkan Pelatih?</h3>
            <p className="text-sm text-gray-600 mb-4">Pelatih akan dikembalikan ke daftar aktif.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setRestoreId(null)} className="rounded-lg border px-4 py-2 text-sm">Batal</button>
              <button onClick={handleRestore} className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700">Pulihkan</button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation - Detail */}
      {permanentDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-white shadow-2xl max-w-lg w-full mx-4 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="border-b border-red-100 bg-red-50 p-5 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-800">Hapus Permanen Pelatih</h3>
                  <p className="text-sm text-red-600">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-5 flex-1">
              {loadingPreview ? (
                <div className="py-8 text-center">
                  <div className="inline-flex items-center gap-2 text-gray-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                    Memuat data terkait...
                  </div>
                </div>
              ) : deletePreview ? (
                <div className="space-y-4">
                  {/* Pelatih info */}
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-sm font-medium text-gray-800">{deletePreview.pelatih.nama_lengkap}</p>
                    <p className="text-xs text-gray-500">{deletePreview.pelatih.id_pelatih}</p>
                  </div>

                  {/* Summary badges */}
                  <div>
                    <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Data yang akan dihapus:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {deletePreview.summary.jadwal > 0 && (
                        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
                          <span className="text-lg">📅</span>
                          <div>
                            <p className="text-sm font-bold text-orange-700">{deletePreview.summary.jadwal}</p>
                            <p className="text-[11px] text-orange-600">Jadwal Latihan</p>
                          </div>
                        </div>
                      )}
                      {deletePreview.summary.presensi > 0 && (
                        <div className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2">
                          <span className="text-lg">📋</span>
                          <div>
                            <p className="text-sm font-bold text-purple-700">{deletePreview.summary.presensi}</p>
                            <p className="text-[11px] text-purple-600">Data Presensi</p>
                          </div>
                        </div>
                      )}
                      {deletePreview.summary.anggotaPertama > 0 && (
                        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                          <span className="text-lg">👤</span>
                          <div>
                            <p className="text-sm font-bold text-blue-700">{deletePreview.summary.anggotaPertama}</p>
                            <p className="text-[11px] text-blue-600">Anggota (Pelatih Pertama)</p>
                          </div>
                        </div>
                      )}
                      {deletePreview.summary.anggotaSaatIni > 0 && (
                        <div className="flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2">
                          <span className="text-lg">👥</span>
                          <div>
                            <p className="text-sm font-bold text-cyan-700">{deletePreview.summary.anggotaSaatIni}</p>
                            <p className="text-[11px] text-cyan-600">Anggota (Pelatih Saat Ini)</p>
                          </div>
                        </div>
                      )}
                      {deletePreview.summary.lokasiPJ > 0 && (
                        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                          <span className="text-lg">📍</span>
                          <div>
                            <p className="text-sm font-bold text-green-700">{deletePreview.summary.lokasiPJ}</p>
                            <p className="text-[11px] text-green-600">Lokasi (sebagai PJ)</p>
                          </div>
                        </div>
                      )}
                      {deletePreview.summary.auditLog > 0 && (
                        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                          <span className="text-lg">📝</span>
                          <div>
                            <p className="text-sm font-bold text-gray-700">{deletePreview.summary.auditLog}</p>
                            <p className="text-[11px] text-gray-600">Log Aktivitas</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detail lists */}
                  {deletePreview.details.jadwal.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-semibold text-gray-500">Jadwal Latihan:</p>
                      <div className="max-h-32 overflow-y-auto rounded-lg border bg-gray-50 text-xs">
                        {deletePreview.details.jadwal.map((j: any) => (
                          <div key={j.id} className="flex items-center justify-between border-b px-3 py-1.5 last:border-0">
                            <span className="text-gray-700">{j.judul_materi}</span>
                            <span className="text-gray-400">{new Date(j.tanggal).toLocaleDateString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {deletePreview.details.anggotaPertama.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-semibold text-gray-500">Anggota (Pelatih Pertama):</p>
                      <div className="max-h-24 overflow-y-auto rounded-lg border bg-gray-50 text-xs">
                        {deletePreview.details.anggotaPertama.map((a: any) => (
                          <div key={a.id} className="flex items-center justify-between border-b px-3 py-1.5 last:border-0">
                            <span className="text-gray-700">{a.nama_lengkap}</span>
                            <span className="text-gray-400">{a.id_anggota}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {deletePreview.details.anggotaSaatIni.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-semibold text-gray-500">Anggota (Pelatih Saat Ini):</p>
                      <div className="max-h-24 overflow-y-auto rounded-lg border bg-gray-50 text-xs">
                        {deletePreview.details.anggotaSaatIni.map((a: any) => (
                          <div key={a.id} className="flex items-center justify-between border-b px-3 py-1.5 last:border-0">
                            <span className="text-gray-700">{a.nama_lengkap}</span>
                            <span className="text-gray-400">{a.id_anggota}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {deletePreview.details.lokasiPJ.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-semibold text-gray-500">Lokasi (PJ):</p>
                      <div className="rounded-lg border bg-gray-50 text-xs">
                        {deletePreview.details.lokasiPJ.map((l: any) => (
                          <div key={l.id} className="flex items-center justify-between border-b px-3 py-1.5 last:border-0">
                            <span className="text-gray-700">{l.nama}</span>
                            <span className="text-gray-400">{l.kota}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warning */}
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                    <p className="text-xs text-red-700 font-medium">
                      ⚠️ Semua data di atas akan dihapus permanen. Jadwal dan presensi akan dihapus, data anggota akan dilepas dari pelatih ini.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-red-500 text-sm">Gagal memuat data</div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t bg-gray-50 p-4 rounded-b-xl">
              <p className="text-xs text-gray-400">
                {deletePreview?.summary?.total > 0
                  ? `${deletePreview.summary.total} data terkait`
                  : 'Tidak ada data terkait'}
              </p>
              <div className="flex gap-2">
                <button onClick={() => { setPermanentDeleteId(null); setDeletePreview(null); }}
                  className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-white transition-colors">
                  Batal
                </button>
                <button onClick={handlePermanentDelete} disabled={loadingPreview || !deletePreview}
                  className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50 transition-colors">
                  Ya, Hapus Semua
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
