import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loginApi, registerApi, getMeApi } from '@/api/auth';
import type { User } from '@/types';

interface AuthState {
    token: string | null;
    currentUser: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
    register: (data: any) => Promise<{ success: boolean; message: string }>;
    logout: () => void;
    loadCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            currentUser: null,
            isAuthenticated: false,

            login: async (email, password) => {
                try {
                    const data = await loginApi(email, password);
                    localStorage.setItem('access_token', data.access_token);
                    set({
                        token: data.access_token,
                        currentUser: data.user,
                        isAuthenticated: true,
                    });
                    return { success: true, message: 'Login successful' };
                } catch (error: any) {
                    return {
                        success: false,
                        message: error.response?.data?.detail || 'Login failed',
                    };
                }
            },

            register: async (payload) => {
                try {
                    await registerApi(payload);
                    return { success: true, message: 'Registration successful. Please login.' };
                } catch (error: any) {
                    return {
                        success: false,
                        message: error.response?.data?.detail || 'Registration failed',
                    };
                }
            },

            logout: () => {
                localStorage.removeItem('access_token');
                set({ token: null, currentUser: null, isAuthenticated: false });
            },

            loadCurrentUser: async () => {
                try {
                    const user = await getMeApi();
                    set({ currentUser: user, isAuthenticated: true });
                } catch {
                    set({ token: null, currentUser: null, isAuthenticated: false });
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token, currentUser: state.currentUser }),
        }
    )
);
