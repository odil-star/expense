import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [access,  setAccess]  = useState(() => localStorage.getItem('access'))
  const [refresh, setRefresh] = useState(() => localStorage.getItem('refresh'))
  const [username, setUsernameState] = useState(() => localStorage.getItem('username') || '')

  const isAuthenticated = !!access

  function saveTokens(newAccess, newRefresh) {
    localStorage.setItem('access',  newAccess)
    localStorage.setItem('refresh', newRefresh)
    setAccess(newAccess)
    setRefresh(newRefresh)
  }

  function clearTokens() {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('username')
    setAccess(null)
    setRefresh(null)
    setUsernameState('')
  }

  function setUsername(name) {
    localStorage.setItem('username', name)
    setUsernameState(name)
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      access,
      refresh,
      username,
      saveTokens,
      clearTokens,
      setUsername,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
