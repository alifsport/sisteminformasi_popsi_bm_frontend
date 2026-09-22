import { useState, useEffect } from 'react';
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

const ROLE_LABELS: Record<string, string> = { admin: 'Admin', pelatih: 'Pelatih', anggota: 'Anggota' };
const STATUS_LABELS: Record<string, string> = { active: 'Aktif', inactive: 'Nonaktif', locked: 'Terkunci' };
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  locked: 'bg-red-100 text-red-700',
};

type PengaturanTab = 'user' | 'tema' | 'lainnya';

export function PengaturanPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PengaturanTab>('user');
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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
    { key: 'user', label: 'Pengaturan User', icon: '👤' },
    { key: 'tema', label: 'Pengaturan Tema', icon: '🎨' },
    { key: 'lainnya', label: 'Pengaturan Lainnya', icon: '⚙️' },
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
