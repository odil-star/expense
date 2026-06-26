import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const ToastContext = createContext(null)

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)
const IconWarning = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

const ICONS = { success: <IconCheck />, error: <IconX />, info: <IconInfo />, warning: <IconWarning /> }

function ToastItem({ toast, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const show = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true))
    })
    const hide = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onClose(toast.id), 280)
    }, 3600)
    return () => { cancelAnimationFrame(show); clearTimeout(hide) }
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(() => onClose(toast.id), 280)
  }

  return (
    <div className={`toast toast--${toast.type}${visible ? ' show' : ''}`}>
      <span className="toast-icon">{ICONS[toast.type] || ICONS.success}</span>
      <span className="toast-msg">{toast.msg}</span>
      <button className="toast-close" onClick={handleClose} aria-label="Закрыть">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, msg, type }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
