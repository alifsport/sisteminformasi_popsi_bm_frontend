import apiClient from './client';

export interface Anggota {
  id: string;
  user_id: string;
  id_anggota: string;
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  no_telepon: string;
  email_pribadi?: string;
  foto_url?: string;
  sabuk: string;
  tanggal_gabung: string;
  status_keanggotaan: string;
  tempat_latihan_pertama_id?: string;
  tempat_latihan_saat_ini_id?: string;
  pelatih_pertama_id?: string;
  pelatih_saat_ini_id?: string;
  created_at: string;
  updated_at: string;
  // Relations
  tempat_latihan_pertama?: { id: string; nama: string; kota?: string } | null;
  tempat_latihan_saat_ini?: { id: string; nama: string; kota?: string } | null;
  pelatih_pertama?: { id: string; nama_lengkap: string } | null;
  pelatih_saat_ini?: { id: string; nama_lengkap: string } | null;
  penugasan?: any[];
  prestasi?: any[];
}

export interface AnggotaQuery {
  page?: number;
  limit?: number;
  search?: string;
  sabuk?: string;
  status?: string;
  lokasi?: string;
  tanggal_gabung_from?: string;
  tanggal_gabung_to?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Lokasi {
  id: string;
  id_lokasi: string;
  nama: string;
  kota: string;
}

export interface Pelatih {
  id: string;
  id_pelatih: string;
  nama_lengkap: string;
}

export const anggotaApi = {
  getAll: (query?: AnggotaQuery) =>
    apiClient.get<{ data: PaginatedResponse<Anggota> }>('/anggota', { params: query }),

  getById: (id: string) =>
    apiClient.get<{ data: Anggota }>(`/anggota/${id}`),

  create: (data: Partial<Anggota>) =>
    apiClient.post<{ data: Anggota }>('/anggota', data),

  update: (id: string, data: Partial<Anggota>) =>
    apiClient.put<{ data: Anggota }>(`/anggota/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/anggota/${id}`),

  restore: (id: string) =>
    apiClient.post(`/anggota/${id}/restore`),

  getArchived: (query?: AnggotaQuery) =>
    apiClient.get<{ data: PaginatedResponse<Anggota> }>('/anggota/archived', { params: query }),

  getStats: () =>
    apiClient.get<{ data: any }>('/anggota/stats'),

  // Master data for dropdowns
  getLokasiList: () =>
    apiClient.get<{ data: { data: Lokasi[] } }>('/lokasi', { params: { limit: 100 } }),

  getPelatihList: () =>
    apiClient.get<{ data: { data: Pelatih[] } }>('/pelatih', { params: { limit: 100 } }),
};
