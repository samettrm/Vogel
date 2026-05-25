import { create } from 'zustand';
import type { User } from 'firebase/auth';

// ════════════════════════════════════════════════════════════════
// AUTH STORE — Firebase kullanıcı oturumu
// Persist edilmez — her açılışta onAuthStateChanged'dan dolar.
// ════════════════════════════════════════════════════════════════

interface AuthState {
  user: User | null;
  /** İlk kontrol bitmeden true — spinner göstermek için */
  isAuthLoading: boolean;
  setUser: (user: User | null) => void;
  setAuthLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthLoading: true,
  setUser: (user) => set({ user, isAuthLoading: false }),
  setAuthLoading: (isAuthLoading) => set({ isAuthLoading }),
}));
