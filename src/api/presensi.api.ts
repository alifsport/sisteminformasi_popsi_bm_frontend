import apiClient from './client';

export interface Presensi {
  id: string;
  jadwal_id: string;
  anggota_id: string;
  status: string;
  keterangan?: string;
  catatan_umum?: string;
  input_oleh: string;
  waktu_input: string;
  created_at: string;
  updated_at: string;
  // Relations
  anggota?: any;
  jadwal?: any;
}

export interface PresensiInput {
  anggota_id: string;
  status: string;
  keterangan?: string;
}

export interface AnggotaForPresensi {
  id: string;
  id_anggota: string;
  nama_lengkap: string;
  sabuk: string;
  no_telepon: string;
}

export const presensiApi = {
  getAnggotaByLokasi: (lokasiId: string) =>
    apiClient.get<{ data: AnggotaForPresensi[] }>(`/presensi/anggota-by-lokasi/${lokasiId}`),

  inputPresensi: (jadwalId: string, tanggal: string, data: PresensiInput[]) =>
    apiClient.post('/presensi', { jadwal_id: jadwalId, tanggal, presensi: data }),

  getByJadwal: (jadwalId: string, tanggal?: string) =>
    apiClient.get<{ data: Presensi[] }>(`/presensi/jadwal/${jadwalId}`, { params: tanggal ? { tanggal } : {} }),

  update: (id: string, data: Partial<Presensi>) =>
    apiClient.put(`/presensi/${id}`, data),

  getByAnggota: (anggotaId: string) =>
    apiClient.get<{ data: Presensi[] }>(`/presensi/anggota/${anggotaId}`),

  getRekap: (query?: { lokasi_id?: string; bulan?: number; tahun?: number }) =>
    apiClient.get<{ data: any }>('/presensi/rekap', { params: query }),

  getStats: () =>
    apiClient.get<{ data: any }>('/presensi/stats'),
};
