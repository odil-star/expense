import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import { safeJson } from '../../utils/safeJson'
import { BASE_URL } from '../../config'
import './Auth.css'

export default function Auth() {
  const { isAuthenticated, saveTokens, setUsername } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab]           = useState('login')
  const [loginUser, setLU]      = useState('')
  const [loginPass, setLP]      = useState('')
  const [loginErr,  setLE]      = useState('')
  const [regUser,   setRU]      = useState('')
  const [regEmail,  setRE]      = useState('')
  const [regPass,   setRP]      = useState('')
  const [regPass2,  setRP2]     = useState('')
  const [regErr,    setRegE]    = useState('')

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true })
  }, [isAuthenticated])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLE('')
    if (!loginUser || !loginPass) { setLE('Введите логин и пароль'); return }
    try {
      const res  = await fetch(`${BASE_URL}/api/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      })
      if (!res.ok) { setLE('Неверный логин или пароль'); return }
      const data = await safeJson(res)
      if (!data?.access) { setLE('Ошибка сервера, попробуйте позже'); return }
      saveTokens(data.access, data.refresh)
      setUsername(loginUser)
      navigate('/', { replace: true })
    } catch {
      setLE('Ошибка соединения с сервером')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setRegE('')
    if (!regUser || !regPass) { setRegE('Заполните все поля'); return }
    if (regPass !== regPass2)  { setRegE('Пароли не совпадают'); return }
    try {
      const res  = await fetch(`${BASE_URL}/api/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: regUser, email: regEmail, password: regPass, password2: regPass2 }),
      })
      const data = await safeJson(res)
      if (!res.ok) {
        setRegE(data ? Object.values(data).flat().join(' ') : `Ошибка сервера (${res.status})`)
        return
      }
      if (!data?.access) { setRegE('Ошибка сервера, попробуйте позже'); return }
      saveTokens(data.access, data.refresh)
      setUsername(regUser)
      navigate('/', { replace: true })
    } catch {
      setRegE('Ошибка соединения с сервером')
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          Учёт расходов
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>Войти</button>
          <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>Регистрация</button>
        </div>

        {tab === 'login' && (
          <form onSubmit={handleLogin}>
            <p className="auth-error">{loginErr}</p>
            <div className="field">
              <label>Логин</label>
              <input type="text" value={loginUser} onChange={e => setLU(e.target.value)} placeholder="username" autoComplete="username" />
            </div>
            <div className="field">
              <label>Пароль</label>
              <input type="password" value={loginPass} onChange={e => setLP(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
            </div>
            <button type="submit" className="btn-primary w-full">Войти</button>
          </form>
        )}

        {tab === 'register' && (
          <form onSubmit={handleRegister}>
            <p className="auth-error">{regErr}</p>
            <div className="field">
              <label>Логин</label>
              <input type="text" value={regUser} onChange={e => setRU(e.target.value)} placeholder="username" autoComplete="username" />
            </div>
            <div className="field">
              <label>Email (необязательно)</label>
              <input type="email" value={regEmail} onChange={e => setRE(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </div>
            <div className="field">
              <label>Пароль</label>
              <input type="password" value={regPass} onChange={e => setRP(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
            </div>
            <div className="field">
              <label>Повторите пароль</label>
              <input type="password" value={regPass2} onChange={e => setRP2(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
            </div>
            <button type="submit" className="btn-primary w-full">Создать аккаунт</button>
          </form>
        )}
      </div>
    </div>
  )
}
