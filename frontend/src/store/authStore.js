import { create } from 'zustand'

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('kg_user') || 'null')
  } catch {
    localStorage.removeItem('kg_user')
    localStorage.removeItem('kg_token')
    return null
  }
}

const useAuthStore = create((set) => ({
  user:  readStoredUser(),
  token: localStorage.getItem('kg_token') || (readStoredUser() ? 'authenticated' : null),

  setAuth: (user, token) => {
    localStorage.setItem('kg_user',  JSON.stringify(user))
    if (token) localStorage.setItem('kg_token', token)
    set({ user, token: token || 'authenticated' })
  },

  logout: async () => {
    try {
      const { authAPI } = await import('../services/api');
      await authAPI.logout();
    } catch (e) {
      console.error('Logout API failed:', e);
    }
    localStorage.removeItem('kg_user')
    localStorage.removeItem('kg_token')
    set({ user: null, token: null })
  },

  updateUser: (updates) => set(state => {
    const updated = { ...state.user, ...updates }
    localStorage.setItem('kg_user', JSON.stringify(updated))
    return { user: updated }
  }),
}))

export default useAuthStore
