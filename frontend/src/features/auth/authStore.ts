import { create } from "zustand";
import { persist } from "zustand/middleware";
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
  ensureProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
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
            isAuthenticated: true,
          });
          const user = await api.me();
          set({
            email: user.email,
            role: user.role,
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
            isAuthenticated: true,
          });
          const user = await api.me();
          set({
            email: user.email,
            role: user.role,
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

      ensureProfile: async () => {
        const state = useAuthStore.getState();
        if (!state.accessToken || state.role) return;
        try {
          const user = await api.me();
          set({ email: user.email, role: user.role, isAuthenticated: true });
        } catch {
          set({
            accessToken: null,
            refreshToken: null,
            email: null,
            role: null,
            isAuthenticated: false,
            error: "Session expired",
          });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        email: state.email,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

setTokenGetter(() => useAuthStore.getState().accessToken);
