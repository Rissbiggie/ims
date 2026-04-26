import { create } from 'zustand';
import { authApi } from '../api';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,  // Load user from localStorage
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,
  dashboardRoute: localStorage.getItem('dashboard_route') || null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.login(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('dashboard_route', data.dashboard_route);
      localStorage.setItem('user', JSON.stringify(data.user));  // Save user to localStorage
      set({
        token: data.token,
        user: data.user,
        dashboardRoute: data.dashboard_route,
        isLoading: false,
      });
      return data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Login failed',
        isLoading: false,
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
      localStorage.removeItem('dashboard_route');
      localStorage.removeItem('user');  // Clear user from localStorage
      set({ user: null, token: null, dashboardRoute: null });
    }
  },

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.getProfile();
      localStorage.setItem('user', JSON.stringify(data.user));  // Save user to localStorage
      set({ user: data.user, isLoading: false });
      return data.user;
    } catch (error) {
      set({ isLoading: false, error: 'Failed to fetch profile' });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));