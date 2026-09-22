import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifikasiApi } from '../api/notifikasi.api';

export function useNotifikasiList(query?: { dibaca?: boolean }) {
  return useQuery({
    queryKey: ['notifikasi', query],
    queryFn: () => notifikasiApi.getAll(query),
    select: (data) => data.data,
    refetchInterval: 30000, // Poll every 30 seconds
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifikasi-unread'],
    queryFn: () => notifikasiApi.getUnreadCount(),
    select: (data) => data.data?.count || 0,
    refetchInterval: 30000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notifikasiApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifikasi'] });
      queryClient.invalidateQueries({ queryKey: ['notifikasi-unread'] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notifikasiApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifikasi'] });
      queryClient.invalidateQueries({ queryKey: ['notifikasi-unread'] });
    },
  });
}
