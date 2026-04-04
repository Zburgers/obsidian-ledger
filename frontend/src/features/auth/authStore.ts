import { create } from "zustand";
import { api, setTokenGetter } from "../../lib/api";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  email: string | null;
  role: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  setError: (error: string | null) => void;
}

setTokenGetter(() => useAuthStore.getState().accessToken);

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  email: null,
  role: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.login({ email, password });
      set({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        email,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
      throw e;
    }
  },

  register: async (email: string, password: string, name?: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.register({ email, password, name });
      const data = await api.login({ email, password });
      set({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        email,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
      throw e;
    }
  },

  logout: () =>
    set({
      accessToken: null,
      refreshToken: null,
      email: null,
      role: null,
      isAuthenticated: false,
      error: null,
    }),

  setError: (error) => set({ error }),
}));
