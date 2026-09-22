import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';

export function LokasiDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [lokasi, setLokasi] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiClient.get(`/lokasi/${id}`)
      .then(res => setLokasi(res.data.data))
      .catch(() => { toast.error('Lokasi tidak ditemukan'); navigate('/lokasi'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (!lokasi) return null;

  const fields = [
    { label: 'ID Lokasi', value: lokasi.id_lokasi },
    { label: 'Nama Lokasi', value: lokasi.nama },
    { label: 'Alamat', value: lokasi.alamat },
    { label: 'Kota/Kabupaten', value: lokasi.kota },
    { label: 'Provinsi', value: lokasi.provinsi },
    { label: 'Kecamatan', value: lokasi.kecamatan || '-' },
    { label: 'Kelurahan', value: lokasi.kelurahan || '-' },
    { label: 'Desa', value: lokasi.desa || '-' },
    { label: 'Kode Pos', value: lokasi.kode_pos || '-' },
    { label: 'Kapasitas', value: `${lokasi.kapasitas} orang` },
    { label: 'Pelatih PJ', value: lokasi.pelatih_pj?.nama_lengkap || '-' },
    { label: 'Status', value: lokasi.status },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/lokasi" className="text-sm text-primary hover:underline">← Kembali ke Daftar</Link>
          <h1 className="mt-1 text-2xl font-bold">{lokasi.nama}</h1>
          <span className="inline-block mt-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{lokasi.id_lokasi}</span>
        </div>
        {isAdmin && (
          <Link to={`/lokasi/${id}/edit`} className="rounded-lg bg-gradient-to-r from-primary to-primary-dark px-4 py-2 text-sm font-semibold text-white shadow">Edit</Link>
        )}
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map(f => (
            <div key={f.label}>
              <p className="text-xs font-medium text-gray-500 uppercase">{f.label}</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{f.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
