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
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
  isDualRole: () => boolean;
}

// Token storage — always use localStorage for persistence
function getAccessToken(): string | null {
  return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
}
function setAccessToken(token: string) {
  localStorage.setItem('accessToken', token);
}
function removeAccessToken() {
  localStorage.removeItem('accessToken');
  sessionStorage.removeItem('accessToken');
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

  login: async (email: string, password: string, remember: boolean = false) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { user, accessToken } = response.data.data;
    setAccessToken(accessToken);

    let activeRole: 'pelatih' | 'anggota' | null = null;
    if (user.hasPelatihProfile && user.hasAnggotaProfile) {
      activeRole = 'pelatih';
    }

    set({ user, isAuthenticated: true, activeRole });
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore logout errors
    } finally {
      removeAccessToken();
      set({ user: null, isAuthenticated: false, activeRole: null });
    }
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },

  checkAuth: async () => {
    const token = getAccessToken();
    if (!token) {
      set({ isLoading: false });
      return;
    }

    const { isAuthenticated } = get();
    if (isAuthenticated) {
      set({ isLoading: false });
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();

      if (isExpired) {
        try {
          const response = await apiClient.post('/auth/refresh');
          const { accessToken } = response.data.data;
          setAccessToken(accessToken);

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
          removeAccessToken();
          set({ user: null, isAuthenticated: false, isLoading: false, activeRole: null });
        }
      } else {
        // Token valid — auth immediately, fetch profile in background
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

        apiClient.get('/auth/sessions').then(res => {
          const d = res.data.data;
          set({
            user: {
              id: payload.id,
              email: payload.email,
              role: payload.role,
              hasAnggotaProfile: !!d?.anggota_profile,
              hasPelatihProfile: !!d?.pelatih_profile,
              anggotaProfile: d?.anggota_profile || null,
              pelatihProfile: d?.pelatih_profile || null,
            },
          });
        }).catch(() => {});

        apiClient.post('/auth/refresh').then(res => {
          setAccessToken(res.data.data.accessToken);
        }).catch(() => {});
      }
    } catch {
      removeAccessToken();
      set({ user: null, isAuthenticated: false, isLoading: false, activeRole: null });
    }
  },
}));
