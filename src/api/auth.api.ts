import apiClient from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: string;
  };
  accessToken: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<{ data: LoginResponse }>('/auth/login', data),

  logout: () =>
    apiClient.post('/auth/logout'),

  refresh: () =>
    apiClient.post<{ data: { accessToken: string } }>('/auth/refresh'),

  changePassword: (data: { current_password: string; new_password: string; confirm_password: string }) =>
    apiClient.put('/auth/change-password', data),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (data: { token: string; new_password: string; confirm_password: string }) =>
    apiClient.post('/auth/reset-password', data),
};
