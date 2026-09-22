import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { presensiApi, PresensiInput } from '../api/presensi.api';
import toast from 'react-hot-toast';

export function useAnggotaByLokasi(lokasiId: string) {
  return useQuery({
    queryKey: ['presensi', 'anggota-by-lokasi', lokasiId],
    queryFn: () => presensiApi.getAnggotaByLokasi(lokasiId),
    select: (data) => data.data,
    enabled: !!lokasiId,
  });
}

export function usePresensiByJadwal(jadwalId: string, tanggal?: string) {
  return useQuery({
    queryKey: ['presensi', 'jadwal', jadwalId, tanggal],
    queryFn: () => presensiApi.getByJadwal(jadwalId, tanggal),
    select: (data) => data.data,
    enabled: !!jadwalId,
  });
}

export function usePresensiByAnggota(anggotaId: string) {
  return useQuery({
    queryKey: ['presensi', 'anggota', anggotaId],
    queryFn: () => presensiApi.getByAnggota(anggotaId),
    select: (data) => data.data,
    enabled: !!anggotaId,
  });
}

export function usePresensiRekap(query?: { lokasi_id?: string; bulan?: number; tahun?: number }) {
  return useQuery({
    queryKey: ['presensi-rekap', query],
    queryFn: () => presensiApi.getRekap(query),
    select: (data) => data.data,
  });
}

export function useInputPresensi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jadwalId, tanggal, data }: { jadwalId: string; tanggal: string; data: PresensiInput[] }) =>
      presensiApi.inputPresensi(jadwalId, tanggal, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presensi'] });
      toast.success('Presensi berhasil disimpan');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menyimpan presensi');
    },
  });
}

export function useUpdatePresensi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => presensiApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presensi'] });
      toast.success('Presensi berhasil dikoreksi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal mengoreksi presensi');
    },
  });
}
