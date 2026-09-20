import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('crm_token'))
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('crm_user')
    return u ? JSON.parse(u) : null
  })

  function login(token, user) {
    localStorage.setItem('crm_token', token)
    localStorage.setItem('crm_user', JSON.stringify(user))
    setToken(token)
    setUser(user)
  }

  function logout() {
    localStorage.removeItem('crm_token')
    localStorage.removeItem('crm_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthed: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
