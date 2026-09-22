import apiClient from './client';

export interface Pelatih {
  id: string;
  user_id: string;
  id_pelatih: string;
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  alamat: string;
  no_telepon: string;
  email_pribadi?: string;
  foto_url?: string;
  sabuk?: string;
  tempat_melatih_id?: string;
  tanggal_gabung: string;
  created_at: string;
  updated_at: string;
  // Relations
  tempat_melatih?: { id: string; nama: string; kota?: string; id_lokasi?: string } | null;
  user?: { id: string; email: string; status: string };
}

export interface PelatihQuery {
  page?: number;
  limit?: number;
  search?: string;
  lokasi?: string;
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

export const pelatihApi = {
  getAll: (query?: PelatihQuery) =>
    apiClient.get<{ data: PaginatedResponse<Pelatih> }>('/pelatih', { params: query }),

  getById: (id: string) =>
    apiClient.get<{ data: Pelatih }>(`/pelatih/${id}`),

  create: (data: Partial<Pelatih>) =>
    apiClient.post<{ data: Pelatih }>('/pelatih', data),

  update: (id: string, data: Partial<Pelatih>) =>
    apiClient.put<{ data: Pelatih }>(`/pelatih/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/pelatih/${id}`),

  toggleStatus: (id: string) =>
    apiClient.put(`/pelatih/${id}/status`),

  getAnggota: (id: string) =>
    apiClient.get<{ data: any[] }>(`/pelatih/${id}/anggota`),
};
