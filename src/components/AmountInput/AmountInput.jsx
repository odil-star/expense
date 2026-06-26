import { useRef } from 'react'
import './AmountInput.css'

export default function AmountInput({ value, onChange, placeholder = '0', className = '', style }) {
  const inputRef = useRef(null)

  const handleChange = (e) => {
    const el     = e.target
    const pos    = el.selectionStart
    const before = el.value.length
    const raw    = el.value.replace(/\D/g, '')
    const next   = raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ''
    const diff   = next.length - before
    onChange(next)
    requestAnimationFrame(() => {
      if (inputRef.current) {
        const np = Math.max(0, pos + diff)
        inputRef.current.setSelectionRange(np, np)
      }
    })
  }

  return (
    <div className={`amount-input-wrap ${className}`} style={style}>
      <svg className="amount-input-icon" width="14" height="14" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="amount-input"
        autoComplete="off"
      />
      <span className="amount-input-suffix">сум</span>
    </div>
  )
}
