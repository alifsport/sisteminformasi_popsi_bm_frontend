import apiClient from './client';

export interface Penugasan {
  id: string;
  anggota_id: string;
  tempat_id: string;
  tanggal_mulai: string;
  tanggal_selesai?: string;
  alasan?: string;
  status: string;
  created_by: string;
  created_at: string;
  // Relations
  anggota?: any;
  tempat?: any;
}

export const penugasanApi = {
  getAll: (query?: { lokasi_id?: string; status?: string }) =>
    apiClient.get<{ data: { data: Penugasan[]; pagination: any } }>('/penugasan', { params: query }),

  getById: (id: string) =>
    apiClient.get<{ data: Penugasan }>(`/penugasan/${id}`),

  create: (data: { anggota_id: string; tempat_id: string; tanggal_mulai: string; alasan?: string }) =>
    apiClient.post<{ data: Penugasan }>('/penugasan', data),

  transfer: (data: { anggota_id: string; tempat_id_baru: string; alasan: string }) =>
    apiClient.post<{ data: Penugasan }>('/penugasan/transfer', data),

  delete: (id: string) =>
    apiClient.delete(`/penugasan/${id}`),

  getRiwayat: (anggotaId: string) =>
    apiClient.get<{ data: Penugasan[] }>(`/penugasan/riwayat/${anggotaId}`),
};
