import { useState, useEffect, useRef } from 'react'
import './CategorySelect.css'

export default function CategorySelect({ value, onChange, options, height }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  const selected = options.find(o => o.value === value) || options[0]

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  return (
    <div className={`custom-select${open ? ' open' : ''}`} ref={wrapRef}>
      <button
        type="button"
        className="custom-select-btn"
        style={height ? { height } : undefined}
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
      >
        <span className="custom-select-icon">
          <svg width="18" height="18">
            <use href={`#icon-${selected?.value || 'other'}`} />
          </svg>
        </span>
        <span className="custom-select-label">{selected?.label || 'Выберите...'}</span>
        <svg className="custom-select-arrow" width="14" height="14" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="custom-select-dropdown">
          {options.map(opt => (
            <div
              key={opt.value}
              className={`custom-select-option${opt.value === value ? ' selected' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false) }}
            >
              <span className={`opt-icon ${opt.value}-icon`}>
                <svg><use href={`#icon-${opt.value || 'all'}`} /></svg>
              </span>
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
