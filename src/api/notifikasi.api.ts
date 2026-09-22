import apiClient from './client';

export interface Notifikasi {
  id: string;
  user_id: string;
  judul: string;
  pesan: string;
  tipe: string;
  link?: string;
  dibaca: boolean;
  created_at: string;
}

export const notifikasiApi = {
  getAll: (query?: { dibaca?: boolean }) =>
    apiClient.get<{ data: Notifikasi[] }>('/notifikasi', { params: query }),

  getUnreadCount: () =>
    apiClient.get<{ data: { count: number } }>('/notifikasi/unread-count'),

  markAsRead: (id: string) =>
    apiClient.put(`/notifikasi/${id}/baca`),

  markAllAsRead: () =>
    apiClient.put('/notifikasi/baca-semua'),

  delete: (id: string) =>
    apiClient.delete(`/notifikasi/${id}`),
};
