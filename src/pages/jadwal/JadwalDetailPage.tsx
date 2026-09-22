import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  XCircle,
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { useJadwalDetail, useBatalkanJadwal } from '../../hooks/useJadwal';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { formatDate } from '../../lib/utils';
import { TIPE_LATIHAN_COLORS } from '../../lib/constants';

export function JadwalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [alasan, setAlasan] = useState('');

  const { data: jadwal, isLoading, isError, error } = useJadwalDetail(id || '');
  const batalkanMutation = useBatalkanJadwal();

  const handleBatalkan = () => {
    if (!id || !alasan.trim()) return;
    batalkanMutation.mutate(
      { id, alasan },
      {
        onSuccess: () => {
          setShowCancelDialog(false);
          setAlasan('');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (isError || !jadwal) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/jadwal')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Detail Jadwal</h1>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-800">
          <p className="font-medium">Gagal memuat data jadwal</p>
          <p className="text-sm">
            {(error as any)?.response?.data?.message || 'Data tidak ditemukan'}
          </p>
        </div>
      </div>
    );
  }

  const tipeColor = TIPE_LATIHAN_COLORS[jadwal.tipe_latihan] || '#6B7280';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/jadwal')}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Detail Jadwal</h1>
            <p className="text-muted-foreground">Informasi jadwal latihan</p>
          </div>
        </div>
        {jadwal.status === 'Dijadwalkan' && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/jadwal/${id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowCancelDialog(true)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Batalkan
            </Button>
          </div>
        )}
      </div>

      {/* Main Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Title & Status */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">{jadwal.judul_materi}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  ID: {jadwal.id}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: `${tipeColor}20`,
                    color: tipeColor,
                  }}
                >
                  <Tag className="mr-1 h-3 w-3" />
                  {jadwal.tipe_latihan}
                </Badge>
                <StatusBadge status={jadwal.status} type="jadwal" />
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <div className="rounded-md bg-blue-50 p-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal</p>
                  <p className="font-medium">{formatDate(jadwal.tanggal)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border p-3">
                <div className="rounded-md bg-green-50 p-2">
                  <Clock className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Waktu</p>
                  <p className="font-medium">
                    {jadwal.jam_mulai} - {jadwal.jam_selesai}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border p-3">
                <div className="rounded-md bg-purple-50 p-2">
                  <MapPin className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lokasi</p>
                  <p className="font-medium">
                    {jadwal.tempat?.nama || '-'}
                  </p>
                  {jadwal.tempat?.alamat && (
                    <p className="text-xs text-muted-foreground">
                      {jadwal.tempat.alamat}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border p-3">
                <div className="rounded-md bg-orange-50 p-2">
                  <User className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pelatih</p>
                  <p className="font-medium">
                    {jadwal.pelatih?.nama_lengkap || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Target Peserta */}
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <div className="rounded-md bg-cyan-50 p-2">
                <User className="h-4 w-4 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Target Peserta</p>
                <p className="font-medium">{jadwal.target_peserta || 'Semua Anggota'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Catatan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Catatan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jadwal.catatan ? (
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="whitespace-pre-wrap text-sm">{jadwal.catatan}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Tidak ada catatan</p>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informasi Sistem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Dibuat oleh: </span>
              <span className="font-medium">{jadwal.created_by}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Terakhir diperbarui: </span>
              <span className="font-medium">
                {jadwal.updated_at ? formatDate(jadwal.updated_at) : '-'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <DialogTitle>Batalkan Jadwal</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              Masukkan alasan pembatalan jadwal <strong>{jadwal.judul_materi}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Alasan Pembatalan <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Masukkan alasan pembatalan..."
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setAlasan('');
              }}
              disabled={batalkanMutation.isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleBatalkan}
              disabled={!alasan.trim() || batalkanMutation.isPending}
            >
              {batalkanMutation.isPending ? 'Membatalkan...' : 'Batalkan Jadwal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
