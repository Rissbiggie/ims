import { create } from 'zustand';
import { authApi } from '../api';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.login(email, password);
      localStorage.setItem('token', data.token);
      set({ token: data.token, user: data.user, isLoading: false });
      return data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Login failed',
        isLoading: false 
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      set({ user: null, token: null });
    }
  },

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.getProfile();
      set({ user: data.user, isLoading: false });
      return data.user;
    } catch (error) {
      set({ isLoading: false, error: 'Failed to fetch profile' });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
