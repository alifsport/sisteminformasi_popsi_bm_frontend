import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { anggotaApi, AnggotaQuery } from '../api/anggota.api';
import toast from 'react-hot-toast';

export function useAnggotaList(query?: AnggotaQuery) {
  return useQuery({
    queryKey: ['anggota', query],
    queryFn: () => anggotaApi.getAll(query),
    select: (data) => data.data,
  });
}

export function useAnggotaDetail(id: string) {
  return useQuery({
    queryKey: ['anggota', id],
    queryFn: () => anggotaApi.getById(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useAnggotaStats() {
  return useQuery({
    queryKey: ['anggota-stats'],
    queryFn: () => anggotaApi.getStats(),
    select: (data) => data.data,
  });
}

export function useLokasiList() {
  return useQuery({
    queryKey: ['lokasi-list'],
    queryFn: () => anggotaApi.getLokasiList(),
    select: (data) => data.data?.data || [],
  });
}

export function usePelatihList() {
  return useQuery({
    queryKey: ['pelatih-list'],
    queryFn: () => anggotaApi.getPelatihList(),
    select: (data) => data.data?.data || [],
  });
}

export function useCreateAnggota() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: anggotaApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anggota'] });
      toast.success('Anggota berhasil ditambahkan');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menambahkan anggota');
    },
  });
}

export function useUpdateAnggota() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => anggotaApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anggota'] });
      toast.success('Anggota berhasil diperbarui');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal memperbarui anggota');
    },
  });
}

export function useDeleteAnggota() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: anggotaApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anggota'] });
      toast.success('Anggota berhasil dihapus');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menghapus anggota');
    },
  });
}
