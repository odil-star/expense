import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const ConfirmContext = createContext(null)

function ConfirmModal({ msg, onOk, onCancel }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true))
    })
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className={`confirm-overlay${visible ? ' show' : ''}`} onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="confirm-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </div>
        <p className="confirm-title">Подтверждение</p>
        <p className="confirm-sub">{msg}</p>
        <div className="confirm-actions">
          <button className="btn-ghost" onClick={onCancel}>Отмена</button>
          <button className="confirm-btn-ok" onClick={onOk}>Удалить</button>
        </div>
      </div>
    </div>
  )
}

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)

  const showConfirm = useCallback((msg, onOk) => {
    setState({ msg, onOk })
  }, [])

  const handleOk = () => {
    if (state?.onOk) state.onOk()
    setState(null)
  }

  const handleCancel = () => setState(null)

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}
      {state && (
        <ConfirmModal msg={state.msg} onOk={handleOk} onCancel={handleCancel} />
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  return useContext(ConfirmContext)
}
