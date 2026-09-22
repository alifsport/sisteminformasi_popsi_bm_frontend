import apiClient from './client';

export interface Jadwal {
  id: string;
  judul_materi: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  tempat_id: string;
  pelatih_id: string;
  tipe_latihan: string;
  target_peserta: string;
  catatan?: string;
  seri_id?: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Relations
  tempat?: any;
  pelatih?: any;
}

export interface JadwalQuery {
  page?: number;
  limit?: number;
  tanggal_from?: string;
  tanggal_to?: string;
  lokasi_id?: string;
  pelatih_id?: string;
  tipe?: string;
  status?: string;
}

export const jadwalApi = {
  getAll: (query?: JadwalQuery) =>
    apiClient.get<{ data: { data: Jadwal[]; pagination: any } }>('/jadwal', { params: query }),

  getById: (id: string) =>
    apiClient.get<{ data: Jadwal }>(`/jadwal/${id}`),

  create: (data: Partial<Jadwal> & { pengulangan?: string }) =>
    apiClient.post<{ data: Jadwal }>('/jadwal', data),

  update: (id: string, data: Partial<Jadwal>) =>
    apiClient.put<{ data: Jadwal }>(`/jadwal/${id}`, data),

  batalkan: (id: string, alasan: string) =>
    apiClient.put(`/jadwal/${id}/batalkan`, { alasan }),

  delete: (id: string) =>
    apiClient.delete(`/jadwal/${id}`),

  getKalender: (start: string, end: string) =>
    apiClient.get<{ data: Jadwal[] }>('/jadwal/kalender', { params: { start, end } }),

  getSaya: () =>
    apiClient.get<{ data: Jadwal[] }>('/jadwal/saya'),
};
