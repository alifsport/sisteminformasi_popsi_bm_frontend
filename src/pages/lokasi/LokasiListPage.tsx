import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuthStore } from '../../stores/authStore';

export function LokasiListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [lokasiList, setLokasiList] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page: pagination.page, limit: pagination.limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      const res = await apiClient.get('/lokasi', { params });
      setLokasiList(res.data?.data || []);
      setPagination(res.data?.pagination || pagination);
    } catch { toast.error('Gagal memuat data lokasi'); }
    finally { setLoading(false); }
  }, [pagination.page, pagination.limit, debouncedSearch, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await apiClient.delete(`/lokasi/${deleteId}`);
      toast.success('Lokasi berhasil dihapus');
      setDeleteId(null);
      fetchData();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Gagal menghapus lokasi'); }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { Aktif: 'bg-green-100 text-green-800', Tidak_Aktif: 'bg-gray-100 text-gray-800', Maintenance: 'bg-yellow-100 text-yellow-800' };
    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[s] || ''}`}>{s.replace('_', ' ')}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold">Manajemen Lokasi</h1><p className="text-muted-foreground">Kelola tempat latihan silat</p></div>
        {isAdmin && (
          <button onClick={() => navigate('/lokasi/tambah')} className="rounded-lg bg-gradient-to-r from-primary to-primary-dark px-4 py-2 text-sm font-semibold text-white shadow">+ Tambah Lokasi</button>
        )}
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input placeholder="Cari nama, alamat..." value={search} onChange={e => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }} className="flex-1 rounded-lg border px-3 py-2 text-sm" />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }} className="rounded-lg border px-3 py-2 text-sm">
            <option value="">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Tidak_Aktif">Tidak Aktif</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="px-4 py-3 text-left font-medium">ID</th>
            <th className="px-4 py-3 text-left font-medium">Nama</th>
            <th className="px-4 py-3 text-left font-medium">Kota/Kabupaten</th>
            <th className="px-4 py-3 text-left font-medium">Kapasitas</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Aksi</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
            ) : lokasiList.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Belum ada data lokasi</td></tr>
            ) : lokasiList.map((l: any) => (
              <tr key={l.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{l.id_lokasi}</td>
                <td className="px-4 py-3">{l.nama}</td>
                <td className="px-4 py-3">{l.kota}</td>
                <td className="px-4 py-3">{l.kapasitas}</td>
                <td className="px-4 py-3">{statusBadge(l.status)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => navigate(`/lokasi/${l.id}`)} className="rounded px-2 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100">Lihat</button>
                    <button onClick={() => navigate(`/lokasi/${l.id}/edit`)} className="rounded px-2 py-1 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100">Edit</button>
                    <button onClick={() => setDeleteId(l.id)} className="rounded px-2 py-1 text-xs bg-red-50 text-red-700 hover:bg-red-100">Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Total: {pagination.total} lokasi</span>
          <div className="flex gap-1">
            <button disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} className="rounded border px-3 py-1 disabled:opacity-50">Sebelumnya</button>
            <span className="rounded border px-3 py-1">{pagination.page} / {pagination.totalPages}</span>
            <button disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} className="rounded border px-3 py-1 disabled:opacity-50">Selanjutnya</button>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Hapus Lokasi?</h3>
            <p className="text-sm text-gray-600 mb-4">Lokasi akan dihapus secara permanen.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteId(null)} className="rounded-lg border px-4 py-2 text-sm">Batal</button>
              <button onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
