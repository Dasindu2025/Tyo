import { create } from 'zustand';
import apiClient from '../lib/api-client';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'employee';
  companyId?: string;
  employeeCode?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('auth-user') || 'null'),
  token: null,
  isAuthenticated: !!localStorage.getItem('auth-user'),
  isLoading: false,

  login: async (email: string, password: string, role: string) => {
    set({ isLoading: true });
    try {
      const endpoint = `/auth/${role}/login`;
      const response = await apiClient.post(endpoint, { email, password });

      const { accessToken, refreshToken, user } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('auth-user', JSON.stringify(user));

      set({
        user,
        token: accessToken,
        isAuthenticated: true,
        isLoading: false,
      });

      toast.success('Login successful');
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('auth-user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
    toast.success('Logged out successfully');
  },

  setUser: (user: User) => set({ user }),
}));

