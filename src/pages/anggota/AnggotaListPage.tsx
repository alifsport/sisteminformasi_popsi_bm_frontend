import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import { SABUK_LABELS, SABUK_OPTIONS, STATUS_COLORS } from '../../lib/constants';
import { PageHeader } from '../../components/shared/PageHeader';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AnggotaItem {
  id: string;
  id_anggota: string;
  nama_lengkap: string;
  sabuk: string;
  status_keanggotaan: string;
  no_telepon: string;
  tempat_latihan_saat_ini?: { id: string; nama: string } | null;
  pelatih_saat_ini?: { id: string; nama_lengkap: string } | null;
}

interface PaginatedResponse {
  data: AnggotaItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="animate-pulse border-b last:border-b-0">
          {Array.from({ length: 8 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 rounded bg-gray-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={8} className="px-4 py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-5xl opacity-30">👥</span>
          <p className="text-base font-medium text-gray-500">Tidak ada data anggota</p>
          <p className="text-sm text-gray-400">Silakan tambahkan anggota baru atau ubah filter pencarian.</p>
        </div>
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function AnggotaListPage() {
  const navigate = useNavigate();

  // --- state ---
  const [search, setSearch] = useState('');
  const [sabuk, setSabuk] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // --- bulk delete ---
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const debouncedSearch = useDebounce(search, 300);

  // reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sabuk, status, limit]);

  // --- fetch ---
  const fetchAnggota = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (sabuk) params.sabuk = sabuk;
      if (status) params.status = status;

      const res = await apiClient.get('/anggota', { params });
      setData(res.data);
    } catch {
      toast.error('Gagal memuat data anggota');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, sabuk, status]);

  useEffect(() => {
    fetchAnggota();
  }, [fetchAnggota]);

  // --- single delete ---
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/anggota/${deleteId}`);
      toast.success('Anggota berhasil dihapus');
      setDeleteId(null);
      fetchAnggota();
    } catch {
      toast.error('Gagal menghapus anggota');
    } finally {
      setDeleting(false);
    }
  };

  // --- bulk delete ---
  const anggotaList = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  const allSelected = anggotaList.length > 0 && anggotaList.every(a => selectedIds.has(a.id));
  const someSelected = anggotaList.some(a => selectedIds.has(a.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(anggotaList.map(a => a.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      await apiClient.post('/anggota/bulk-delete', { ids: Array.from(selectedIds) });
      toast.success(`${selectedIds.size} anggota berhasil diarsipkan`);
      setSelectedIds(new Set());
      setShowBulkDelete(false);
      fetchAnggota();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus anggota');
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <PageHeader
        title="Manajemen Anggota"
        description="Kelola data anggota pencak silat"
        actions={
          <div className="flex gap-2">
            <Link
              to="/anggota/import"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              📥 Import
            </Link>
            <Link
              to="/anggota/tambah"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary/90"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Anggota Baru
            </Link>
          </div>
        }
      />

      {/* ---- Card ---- */}
      <div className="rounded-xl border bg-white shadow-sm">
        {/* Search & Filters */}
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Cari nama, ID anggota, atau no. telepon..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <select value={sabuk} onChange={(e) => setSabuk(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none">
            <option value="">Semua Sabuk</option>
            {SABUK_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none">
            <option value="">Semua Status</option>
            {Object.keys(STATUS_COLORS).map((s) => (<option key={s} value={s}>{s.replace('_', ' ')}</option>))}
          </select>
        </div>

        {/* Bulk Delete Bar */}
        {someSelected && (
          <div className="flex items-center justify-between border-b bg-red-50 px-4 py-2.5">
            <span className="text-sm font-medium text-red-700">
              {selectedIds.size} anggota dipilih
            </span>
            <button onClick={() => setShowBulkDelete(true)}
              className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors">
              🗑️ Hapus Terpilih
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead>
              <tr className="border-b bg-gray-50/80 text-xs uppercase tracking-wider text-gray-500">
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" />
                </th>
                <th className="px-4 py-3">ID Anggota</th>
                <th className="px-4 py-3">Nama Lengkap</th>
                <th className="px-4 py-3">Sabuk</th>
                <th className="px-4 py-3">Tempat Latihan</th>
                <th className="px-4 py-3">Pelatih</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <TableSkeleton />
              ) : anggotaList.length === 0 ? (
                <EmptyState />
              ) : (
                anggotaList.map((a) => (
                  <tr key={a.id} className={`transition hover:bg-gray-50 ${selectedIds.has(a.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.has(a.id)} onChange={() => toggleSelect(a.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium text-gray-700">{a.id_anggota}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{a.nama_lengkap}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                        style={{ backgroundColor: SABUK_OPTIONS.find((s) => s.value === a.sabuk)?.color ?? '#9CA3AF' }}>
                        {SABUK_LABELS[a.sabuk] ?? a.sabuk}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {a.tempat_latihan_saat_ini?.nama ?? <span className="italic text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {a.pelatih_saat_ini?.nama_lengkap ?? <span className="italic text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[a.status_keanggotaan] ?? 'bg-gray-100 text-gray-700'}`}>
                        {(a.status_keanggotaan ?? '').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/anggota/${a.id}`)} className="rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50">Lihat</button>
                        <button onClick={() => navigate(`/anggota/${a.id}/edit`)} className="rounded-md px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-100">Edit</button>
                        <button onClick={() => setDeleteId(a.id)} className="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>Total: <span className="font-medium text-gray-700">{pagination.total}</span> anggota</span>
              <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-primary focus:outline-none">
                <option value={10}>10 / halaman</option>
                <option value={25}>25 / halaman</option>
                <option value={50}>50 / halaman</option>
              </select>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-md border px-3 py-1 text-sm font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('ellipsis');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, i) => item === 'ellipsis' ? (
                    <span key={`e-${i}`} className="px-1 text-gray-400">...</span>
                  ) : (
                    <button key={item} onClick={() => setPage(item)}
                      className={`min-w-[2rem] rounded-md px-2 py-1 text-sm font-medium transition ${page === item ? 'bg-primary text-white shadow-sm' : 'border hover:bg-gray-50'}`}>{item}</button>
                  ))}
                <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-md border px-3 py-1 text-sm font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---- Single Delete Confirmation ---- */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => !deleting && setDeleteId(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">🗑️ Hapus Anggota?</h3>
            <p className="mt-2 text-sm text-gray-500">Anggota akan diarsipkan. Tindakan ini dapat dibatalkan melalui menu arsip.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button disabled={deleting} onClick={() => setDeleteId(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-50 disabled:opacity-50">Batal</button>
              <button disabled={deleting} onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50">
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Bulk Delete Confirmation ---- */}
      {showBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => !bulkDeleting && setShowBulkDelete(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">🗑️ Hapus {selectedIds.size} Anggota?</h3>
            <p className="mt-2 text-sm text-gray-500">
              {selectedIds.size} anggota akan diarsipkan sekaligus. Tindakan ini dapat dibatalkan melalui menu arsip.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button disabled={bulkDeleting} onClick={() => setShowBulkDelete(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-50 disabled:opacity-50">Batal</button>
              <button disabled={bulkDeleting} onClick={handleBulkDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50">
                {bulkDeleting ? 'Menghapus...' : `Ya, Hapus ${selectedIds.size} Anggota`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
