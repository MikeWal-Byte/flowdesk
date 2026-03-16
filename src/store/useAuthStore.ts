import { create } from 'zustand'
import bcrypt from 'bcryptjs'
import { supabase } from '../lib/supabase'
import type { AuthUser } from '../types'

const SESSION_KEY = 'flowdesk_session'

export interface UserRow {
  id: string
  first_name: string
  last_name: string
  username: string
  is_admin: boolean
  created_at: string
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  error: string | null
  initialize: () => void
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  fetchAllUsers: () => Promise<UserRow[]>
  addUser: (firstName: string, lastName: string, username: string, password: string) => Promise<void>
  changePassword: (userId: string, newPassword: string) => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  initialize: () => {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return
    try { set({ user: JSON.parse(raw) }) } catch { localStorage.removeItem(SESSION_KEY) }
  },

  login: async (username, password) => {
    set({ isLoading: true, error: null })
    const { data, error } = await supabase.from('users').select('*').eq('username', username).single()
    if (error || !data) { set({ isLoading: false, error: 'Invalid username or password' }); return false }
    const match = await bcrypt.compare(password, data.password_hash)
    if (!match) { set({ isLoading: false, error: 'Invalid username or password' }); return false }
    const user: AuthUser = {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      username: data.username,
      isAdmin: data.is_admin,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    set({ user, isLoading: false, error: null })
    return true
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY)
    // Import lazily to avoid circular reference at module init time
    import('./useAppStore').then(({ useAppStore }) => {
      useAppStore.getState().clearData()
    })
    set({ user: null })
  },

  fetchAllUsers: async () => {
    const { data } = await supabase
      .from('users')
      .select('id, first_name, last_name, username, is_admin, created_at')
      .order('created_at')
    return (data ?? []) as UserRow[]
  },

  addUser: async (firstName, lastName, username, password) => {
    const password_hash = await bcrypt.hash(password, 10)
    await supabase.from('users').insert({ first_name: firstName, last_name: lastName, username, password_hash, is_admin: false })
  },

  changePassword: async (userId, newPassword) => {
    const password_hash = await bcrypt.hash(newPassword, 10)
    await supabase.from('users').update({ password_hash }).eq('id', userId)
  },
}))
