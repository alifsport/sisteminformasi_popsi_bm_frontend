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

    // If already authenticated from login, just finish loading
    const { isAuthenticated } = get();
    if (isAuthenticated) {
      set({ isLoading: false });
      return;
    }

    // First: decode existing token to check expiry
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();

      if (isExpired) {
        // Token expired, try refresh
        try {
          const response = await apiClient.post('/auth/refresh');
          const { accessToken } = response.data.data;
          sessionStorage.setItem('accessToken', accessToken);

          const newPayload = JSON.parse(atob(accessToken.split('.')[1]));
          const profileResponse = await apiClient.get('/auth/sessions');
          const profileData = profileResponse.data.data;

          set({
            user: {
              id: newPayload.id,
              email: newPayload.email,
              role: newPayload.role,
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
      } else {
        // Token still valid, use it directly (don't wait for backend refresh)
        // Try to refresh in background for profile data, but don't block auth
        set({
          user: {
            id: payload.id,
            email: payload.email,
            role: payload.role,
            hasAnggotaProfile: false,
            hasPelatihProfile: false,
            anggotaProfile: null,
            pelatihProfile: null,
          },
          isAuthenticated: true,
          isLoading: false,
        });

        // Background: fetch profile data (non-blocking)
        apiClient.get('/auth/sessions').then(profileResponse => {
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
          });
        }).catch(() => {});

        // Background: refresh token for next time
        apiClient.post('/auth/refresh').then(res => {
          sessionStorage.setItem('accessToken', res.data.data.accessToken);
        }).catch(() => {});
      }
    } catch {
      sessionStorage.removeItem('accessToken');
      set({ user: null, isAuthenticated: false, isLoading: false, activeRole: null });
    }
  },
}));
