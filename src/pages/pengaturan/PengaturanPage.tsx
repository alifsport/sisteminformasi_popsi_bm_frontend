import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  last_login_at?: string;
  created_at: string;
}

interface BackupStats {
  users: number;
  anggota: number;
  pelatih: number;
  lokasi: number;
  jadwal: number;
  presensi: number;
  penugasan: number;
  prestasi: number;
}

const ROLE_LABELS: Record<string, string> = { admin: 'Admin', pelatih: 'Pelatih', anggota: 'Anggota' };
const STATUS_LABELS: Record<string, string> = { active: 'Aktif', inactive: 'Nonaktif', locked: 'Terkunci' };
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  locked: 'bg-red-100 text-red-700',
};

type PengaturanTab = 'user' | 'backup' | 'tema' | 'lainnya';

export function PengaturanPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PengaturanTab>('user');
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Backup state
  const [backupStats, setBackupStats] = useState<BackupStats | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<any>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset password
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState('');

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/users', { params: { limit: 100 } });
      setUserList(res.data?.data || []);
    } catch { toast.error('Gagal memuat data user'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // Fetch backup stats when backup tab is active
  useEffect(() => {
    if (activeTab === 'backup') {
      apiClient.get('/backup/stats')
        .then(res => setBackupStats(res.data?.data || null))
        .catch(() => {});
    }
  }, [activeTab]);

  // Handle backup download
  const handleBackup = async () => {
    setIsDownloading(true);
    try {
      const res = await apiClient.get('/backup/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sipbm-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Backup berhasil di-download');
    } catch {
      toast.error('Gagal membuat backup');
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle restore file select
  const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      toast.error('File harus berformat .json');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB');
      return;
    }
    setRestoreFile(file);
    setRestoreResult(null);
  };

  // Handle restore
  const handleRestore = async () => {
    if (!restoreFile) return;
    setIsRestoring(true);
    setRestoreResult(null);
    try {
      const text = await restoreFile.text();
      const json = JSON.parse(text);
      const res = await apiClient.post('/backup/restore', json, { timeout: 120000 });
      setRestoreResult(res.data);
      toast.success('Database berhasil di-restore!');
      setRestoreFile(null);
      if (restoreInputRef.current) restoreInputRef.current.value = '';
      setShowRestoreConfirm(false);
      fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal restore database';
      toast.error(msg);
    } finally {
      setIsRestoring(false);
    }
  };

  // Create / Update user
  const handleSubmit = async () => {
    if (!formEmail) { toast.error('Email wajib diisi'); return; }
    if (!editUser && !formPassword) { toast.error('Password wajib diisi'); return; }
    setIsSubmitting(true);
    try {
      if (editUser) {
        await apiClient.put(`/users/${editUser.id}`, { email: formEmail, role: formRole });
        toast.success('User berhasil diupdate');
      } else {
        await apiClient.post('/users', { email: formEmail, password: formPassword, role: 'admin' });
        toast.success('Admin berhasil ditambahkan');
      }
      setShowForm(false);
      setEditUser(null);
      setFormEmail('');
      setFormPassword('');
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan user');
    } finally { setIsSubmitting(false); }
  };

  // Reset password
  const handleResetPassword = async () => {
    if (!resetId) return;
    try {
      const res = await apiClient.post(`/users/${resetId}/reset-password`);
      setResetEmail(res.data?.data?.newPassword || '');
      toast.success('Password berhasil direset');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal reset password');
    }
  };

  // Delete user
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await apiClient.delete(`/users/${deleteId}`);
      toast.success('User berhasil dihapus');
      setDeleteId(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus user');
    }
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setFormEmail(user.email);
    setFormPassword('');
    setFormRole(user.role);
    setShowForm(true);
  };

  const openCreate = () => {
    setEditUser(null);
    setFormEmail('');
    setFormPassword('');
    setFormRole('admin');
    setShowForm(true);
  };

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors';

  const tabs: { key: PengaturanTab; label: string; icon: string }[] = [
    { key: 'user', label: 'User', icon: '👤' },
    { key: 'backup', label: 'Backup & Restore', icon: '📦' },
    { key: 'tema', label: 'Tema', icon: '🎨' },
    { key: 'lainnya', label: 'Lainnya', icon: '⚙️' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-gray-500">Kelola konfigurasi sistem</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-cyan-500 text-cyan-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}>
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Pengaturan User */}
      {activeTab === 'user' && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Manajemen User</h2>
            <p className="text-sm text-gray-500">Kelola akun admin dan user sistem</p>
          </div>
          <button onClick={openCreate}
            className="rounded-lg bg-gradient-to-r from-primary to-primary-dark px-4 py-2 text-sm font-semibold text-white shadow">
            + Tambah Admin
          </button>
        </div>
      )}

      {/* Tab: Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {/* Stats */}
          {backupStats && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Users', value: backupStats.users, icon: '👤' },
                { label: 'Anggota', value: backupStats.anggota, icon: '👥' },
                { label: 'Pelatih', value: backupStats.pelatih, icon: '🏋️' },
                { label: 'Lokasi', value: backupStats.lokasi, icon: '📍' },
                { label: 'Jadwal', value: backupStats.jadwal, icon: '📅' },
                { label: 'Presensi', value: backupStats.presensi, icon: '✅' },
                { label: 'Penugasan', value: backupStats.penugasan, icon: '📋' },
                { label: 'Prestasi', value: backupStats.prestasi, icon: '🏆' },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{s.icon}</span>
                    <div>
                      <p className="text-lg font-bold text-gray-800">{s.value}</p>
                      <p className="text-xs text-gray-400">{s.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Backup */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-xl">⬇️</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Backup Database</h3>
                <p className="text-sm text-gray-500">Download seluruh data aplikasi sebagai file JSON</p>
              </div>
            </div>
            <p className="mb-4 text-sm text-gray-500">
              Backup mencakup: users, anggota, pelatih, lokasi, jadwal, presensi, penugasan, prestasi, dan notifikasi.
            </p>
            <button onClick={handleBackup} disabled={isDownloading}
              className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all">
              {isDownloading ? 'Membuat backup...' : '⬇️ Download Backup (.json)'}
            </button>
          </div>

          {/* Restore */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-xl">⬆️</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Restore Database</h3>
                <p className="text-sm text-gray-500">Upload file backup untuk mengembalikan data</p>
              </div>
            </div>

            <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-4">
              <p className="text-sm text-red-700 font-medium">⚠️ Peringatan</p>
              <p className="text-xs text-red-600 mt-1">Restore akan MENGHAPUS seluruh data saat ini dan menggantinya dengan data dari file backup. Tindakan ini TIDAK BISA DIBATALKAN.</p>
            </div>

            <input ref={restoreInputRef} type="file" accept=".json" onChange={handleRestoreFileChange} className="hidden" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button onClick={() => restoreInputRef.current?.click()}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                📂 Pilih File Backup (.json)
              </button>
              {restoreFile && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    📄 {restoreFile.name} ({(restoreFile.size / 1024).toFixed(1)} KB)
                  </span>
                  <button onClick={() => setShowRestoreConfirm(true)}
                    className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors">
                    ⚠️ Restore Sekarang
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Restore Result */}
          {restoreResult && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Restore Berhasil</h3>
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                {Object.entries(restoreResult?.data || {}).map(([key, val]) => (
                  <div key={key} className="rounded-lg bg-white p-2 text-center border border-green-200">
                    <p className="font-bold text-green-700">{String(val)}</p>
                    <p className="text-xs text-gray-500 capitalize">{key}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Pengaturan Tema */}
      {activeTab === 'tema' && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="text-4xl mb-3">🎨</div>
          <h2 className="text-lg font-semibold text-gray-700 mb-1">Pengaturan Tema</h2>
          <p className="text-sm text-gray-400">Fitur ini akan segera tersedia.</p>
        </div>
      )}

      {/* Tab: Pengaturan Lainnya */}
      {activeTab === 'lainnya' && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="text-4xl mb-3">⚙️</div>
          <h2 className="text-lg font-semibold text-gray-700 mb-1">Pengaturan Lainnya</h2>
          <p className="text-sm text-gray-400">Fitur ini akan segera tersedia.</p>
        </div>
      )}

      {/* Table */}
      {activeTab === 'user' && (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/80">
            <tr>
              <th className="px-4 py-3 text-left text-[13px] font-semibold text-gray-500">No</th>
              <th className="px-4 py-3 text-left text-[13px] font-semibold text-gray-500">Email</th>
              <th className="px-4 py-3 text-left text-[13px] font-semibold text-gray-500">Role</th>
              <th className="px-4 py-3 text-left text-[13px] font-semibold text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-[13px] font-semibold text-gray-500">Login Terakhir</th>
              <th className="px-4 py-3 text-center text-[13px] font-semibold text-gray-500">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                <div className="inline-flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                  Memuat data...
                </div>
              </td></tr>
            ) : userList.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Belum ada data user</td></tr>
            ) : userList.map((u, idx) => (
              <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-4 py-3 text-gray-400 text-[13px]">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-[12px] font-medium text-blue-700">
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[12px] font-medium ${STATUS_COLORS[u.status] || 'bg-gray-100'}`}>
                    {STATUS_LABELS[u.status] || u.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[13px] text-gray-500">
                  {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => openEdit(u)} className="rounded px-2 py-1 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">Edit</button>
                    <button onClick={() => { setResetId(u.id); setResetEmail(''); }} className="rounded px-2 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">🔑 Reset</button>
                    <button onClick={() => setDeleteId(u.id)} className="rounded px-2 py-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 transition-colors">Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-white p-6 shadow-2xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">{editUser ? 'Edit User' : 'Tambah Admin Baru'}</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Email <span className="text-red-500">*</span></label>
                <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)}
                  className={inputClass} placeholder="admin@sipbm.com" disabled={!!editUser} required />
                {editUser && <p className="mt-1 text-xs text-gray-400">Email tidak dapat diubah</p>}
              </div>
              {!editUser && (
                <div>
                  <label className="mb-1 block text-sm font-medium">Password <span className="text-red-500">*</span></label>
                  <input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)}
                    className={inputClass} placeholder="Masukkan password" required />
                </div>
              )}
              <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
                Role: <span className="font-semibold text-gray-700">Admin</span> — Akun ini memiliki akses penuh ke seluruh fitur.
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => { setShowForm(false); setEditUser(null); }} className="rounded-lg border px-4 py-2 text-sm">Batal</button>
              <button onClick={handleSubmit} disabled={isSubmitting}
                className="rounded-lg bg-gradient-to-r from-primary to-primary-dark px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-50">
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-white p-6 shadow-2xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">🔑 Reset Password</h3>
            {resetEmail ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Password baru telah direset:</p>
                <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                  <p className="font-mono text-lg font-bold text-green-700 text-center">{resetEmail}</p>
                </div>
                <p className="text-xs text-gray-400">Berikan password ini kepada user. User bisa mengubahnya setelah login.</p>
              </div>
            ) : (
              <p className="text-sm text-gray-600 mb-4">Password akan direset ke default. User harus login dengan password baru.</p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setResetId(null); setResetEmail(''); }} className="rounded-lg border px-4 py-2 text-sm">Tutup</button>
              {!resetEmail && (
                <button onClick={handleResetPassword} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">Reset Sekarang</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => !isRestoring && setShowRestoreConfirm(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-xl">⚠️</div>
              <h3 className="text-lg font-bold text-gray-900">Restore Database?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Ini akan <span className="font-semibold text-red-600">MENGHAPUS</span> seluruh data saat ini:
            </p>
            {backupStats && (
              <ul className="mb-3 text-sm text-gray-600 space-y-0.5">
                <li>• {backupStats.users} users</li>
                <li>• {backupStats.anggota} anggota</li>
                <li>• {backupStats.pelatih} pelatih</li>
                <li>• {backupStats.lokasi} lokasi</li>
                <li>• {backupStats.jadwal} jadwal</li>
                <li>• {backupStats.presensi} presensi</li>
              </ul>
            )}
            <p className="text-sm text-gray-600 mb-2">Dan menggantinya dengan data dari file:</p>
            <p className="mb-4 rounded-lg bg-gray-50 p-2 text-sm font-mono text-gray-700">
              📄 {restoreFile?.name}
            </p>
            <p className="mb-4 text-xs text-red-500 font-medium">Tindakan ini TIDAK BISA DIBATALKAN.</p>
            <div className="flex justify-end gap-2">
              <button disabled={isRestoring} onClick={() => setShowRestoreConfirm(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
                Batal
              </button>
              <button disabled={isRestoring} onClick={handleRestore}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {isRestoring ? 'Meng-restore...' : 'Ya, Restore Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-white p-6 shadow-2xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">🗑️ Hapus User?</h3>
            <p className="text-sm text-gray-600 mb-4">User akan dihapus permanen dan tidak bisa dipulihkan.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteId(null)} className="rounded-lg border px-4 py-2 text-sm">Batal</button>
              <button onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
