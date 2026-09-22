import apiClient from './client';

export interface Lokasi {
  id: string;
  id_lokasi: string;
  nama: string;
  alamat: string;
  kota: string;
  provinsi: string;
  kode_pos?: string;
  jam_operasional: string;
  kapasitas: number;
  pelatih_pj_id?: string;
  foto_urls?: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LokasiQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  kota?: string;
  pelatih_pj?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export const lokasiApi = {
  getAll: (query?: LokasiQuery) =>
    apiClient.get<{ data: { data: Lokasi[]; pagination: any } }>('/lokasi', { params: query }),

  getById: (id: string) =>
    apiClient.get<{ data: Lokasi }>(`/lokasi/${id}`),

  create: (data: Partial<Lokasi>) =>
    apiClient.post<{ data: Lokasi }>('/lokasi', data),

  update: (id: string, data: Partial<Lokasi>) =>
    apiClient.put<{ data: Lokasi }>(`/lokasi/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/lokasi/${id}`),

  toggleStatus: (id: string) =>
    apiClient.put(`/lokasi/${id}/status`),

  getAnggota: (id: string) =>
    apiClient.get<{ data: any[] }>(`/lokasi/${id}/anggota`),

  getJadwal: (id: string) =>
    apiClient.get<{ data: any[] }>(`/lokasi/${id}/jadwal`),

  getStats: () =>
    apiClient.get<{ data: any }>('/lokasi/stats'),
};
