import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lokasiApi, LokasiQuery } from '../api/lokasi.api';
import toast from 'react-hot-toast';

export function useLokasiList(query?: LokasiQuery) {
  return useQuery({
    queryKey: ['lokasi', query],
    queryFn: () => lokasiApi.getAll(query),
    select: (data) => data.data,
  });
}

export function useLokasiDetail(id: string) {
  return useQuery({
    queryKey: ['lokasi', id],
    queryFn: () => lokasiApi.getById(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useLokasiStats() {
  return useQuery({
    queryKey: ['lokasi-stats'],
    queryFn: () => lokasiApi.getStats(),
    select: (data) => data.data,
  });
}

export function useCreateLokasi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: lokasiApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lokasi'] });
      toast.success('Lokasi berhasil ditambahkan');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menambahkan lokasi');
    },
  });
}

export function useUpdateLokasi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => lokasiApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lokasi'] });
      toast.success('Lokasi berhasil diperbarui');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal memperbarui lokasi');
    },
  });
}

export function useDeleteLokasi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: lokasiApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lokasi'] });
      toast.success('Lokasi berhasil dihapus');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menghapus lokasi');
    },
  });
}
