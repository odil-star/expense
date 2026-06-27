import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://ras-pti3.onrender.com'

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
      const res = await fetch(`${BASE_URL}/api${path}`, { ...options, headers })
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