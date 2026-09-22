import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pelatihApi, PelatihQuery } from '../api/pelatih.api';
import toast from 'react-hot-toast';

export function usePelatihList(query?: PelatihQuery) {
  return useQuery({
    queryKey: ['pelatih', query],
    queryFn: async () => {
      const res = await pelatihApi.getAll(query);
      return res.data.data;
    },
  });
}

export function usePelatihDetail(id: string) {
  return useQuery({
    queryKey: ['pelatih', id],
    queryFn: async () => {
      const res = await pelatihApi.getById(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useLokasiDropdown() {
  return useQuery({
    queryKey: ['lokasi-dropdown'],
    queryFn: async () => {
      const res = await import('../api/client').then(m =>
        m.default.get('/lokasi', { params: { limit: 100 } })
      );
      return res.data?.data || [];
    },
  });
}

export function useCreatePelatih() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pelatihApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pelatih'] });
      toast.success('Pelatih berhasil ditambahkan');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menambahkan pelatih');
    },
  });
}

export function useUpdatePelatih() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => pelatihApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pelatih'] });
      toast.success('Pelatih berhasil diperbarui');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal memperbarui pelatih');
    },
  });
}

export function useDeletePelatih() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pelatihApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pelatih'] });
      toast.success('Pelatih berhasil dinonaktifkan');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menonaktifkan pelatih');
    },
  });
}
