import { create } from 'zustand';
import apiClient from '../api/client';

interface UserProfile {
  id: string;
  id_anggota?: string;
  id_pelatih?: string;
  nama_lengkap: string;
  sabuk?: string;
  status_keanggotaan?: string;
  tempat_melatih_id?: string;
  tempat_melatih?: { id: string; nama: string } | null;
}

interface User {
  id: string;
  email: string;
  role: string;
  hasAnggotaProfile: boolean;
  hasPelatihProfile: boolean;
  anggotaProfile: UserProfile | null;
  pelatihProfile: UserProfile | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Active role for dual-profile users
  activeRole: 'pelatih' | 'anggota' | null;
  setActiveRole: (role: 'pelatih' | 'anggota') => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
  isDualRole: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  activeRole: null,

  setActiveRole: (role) => set({ activeRole: role }),

  isDualRole: () => {
    const { user } = get();
    return !!(user?.hasAnggotaProfile && user?.hasPelatihProfile);
  },

  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { user, accessToken } = response.data.data;
    sessionStorage.setItem('accessToken', accessToken);

    // Auto-set active role for dual-profile users
    let activeRole: 'pelatih' | 'anggota' | null = null;
    if (user.hasPelatihProfile && user.hasAnggotaProfile) {
      activeRole = 'pelatih'; // Default to pelatih view
    }

    set({ user, isAuthenticated: true, activeRole });
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore logout errors
    } finally {
      sessionStorage.removeItem('accessToken');
      set({ user: null, isAuthenticated: false, activeRole: null });
    }
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },

  checkAuth: async () => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      const response = await apiClient.post('/auth/refresh');
      const { accessToken } = response.data.data;
      sessionStorage.setItem('accessToken', accessToken);

      const payload = JSON.parse(atob(accessToken.split('.')[1]));

      // Fetch full user data with profiles
      const profileResponse = await apiClient.get('/auth/sessions');
      const profileData = profileResponse.data.data;

      set({
        user: {
          id: payload.id,
          email: payload.email,
          role: payload.role,
          hasAnggotaProfile: profileData?.anggota_profile ? true : false,
          hasPelatihProfile: profileData?.pelatih_profile ? true : false,
          anggotaProfile: profileData?.anggota_profile || null,
          pelatihProfile: profileData?.pelatih_profile || null,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      sessionStorage.removeItem('accessToken');
      set({ user: null, isAuthenticated: false, isLoading: false, activeRole: null });
    }
  },
}));
