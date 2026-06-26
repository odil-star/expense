import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'

export function useApiFetch() {
  const { access, clearTokens } = useAuth()
  const navigate = useNavigate()

  return useCallback(async (path, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
      ...options.headers,
    }
    try {
      const res = await fetch(`/api${path}`, { ...options, headers })
      if (res.status === 401) {
        clearTokens()
        navigate('/login', { replace: true })
        return null
      }
      return res
    } catch {
      return null
    }
  }, [access, clearTokens, navigate])
}
