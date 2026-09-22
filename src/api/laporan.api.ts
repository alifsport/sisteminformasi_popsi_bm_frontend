import apiClient from './client';

export const laporanApi = {
  getDashboard: () =>
    apiClient.get<{ data: any }>('/laporan/dashboard'),
};
