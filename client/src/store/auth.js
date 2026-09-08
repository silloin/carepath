import { create } from 'zustand'
import { getMe, login, registerPatient } from '../api'

export const useAuth = create((set) => ({
  user: null,
  hydrated: false,
  loading: false,
  error: null,
  hydrate: async () => {
    try { set({ user: await getMe(), hydrated: true }) } catch { set({ user: null, hydrated: true }) }
  },
  signIn: async (payload) => { set({ loading: true, error: null }); try { const user = await login(payload); set({ user, loading: false }); return user } catch (error) { set({ loading: false, error: error.response?.data?.message || 'Unable to sign in' }); throw error } },
  signUp: async (payload) => { set({ loading: true, error: null }); try { const user = await registerPatient(payload); set({ user, loading: false }); return user } catch (error) { set({ loading: false, error: error.response?.data?.message || 'Unable to create account' }); throw error } },
  signOut: async () => { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); set({ user: null }) },
}))
