import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jadwalApi, JadwalQuery } from '../api/jadwal.api';
import toast from 'react-hot-toast';

export function useJadwalList(query?: JadwalQuery) {
  return useQuery({
    queryKey: ['jadwal', query],
    queryFn: () => jadwalApi.getAll(query),
    select: (data) => data.data,
  });
}

export function useJadwalDetail(id: string) {
  return useQuery({
    queryKey: ['jadwal', id],
    queryFn: () => jadwalApi.getById(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useJadwalKalender(start: string, end: string) {
  return useQuery({
    queryKey: ['jadwal-kalender', start, end],
    queryFn: () => jadwalApi.getKalender(start, end),
    select: (data) => data.data,
    enabled: !!start && !!end,
  });
}

export function useJadwalSaya() {
  return useQuery({
    queryKey: ['jadwal-saya'],
    queryFn: () => jadwalApi.getSaya(),
    select: (data) => data.data,
  });
}

export function useCreateJadwal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: jadwalApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jadwal'] });
      toast.success('Jadwal berhasil dibuat');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal membuat jadwal');
    },
  });
}

export function useUpdateJadwal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => jadwalApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jadwal'] });
      toast.success('Jadwal berhasil diperbarui');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal memperbarui jadwal');
    },
  });
}

export function useBatalkanJadwal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, alasan }: { id: string; alasan: string }) => jadwalApi.batalkan(id, alasan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jadwal'] });
      toast.success('Jadwal berhasil dibatalkan');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal membatalkan jadwal');
    },
  });
}
