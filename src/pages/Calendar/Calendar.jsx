import { useState, useEffect } from 'react'
import { useApiFetch } from '../../hooks/useApiFetch'
import { safeJson } from '../../utils/safeJson'
import { CAL_MONTHS, CAT_LABELS } from '../../constants/categories'
import { dateKey, formatDate } from '../../utils/format'
import './Calendar.css'

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export default function Calendar() {
  const apiFetch = useApiFetch()
  const [year,     setYear]     = useState(new Date().getFullYear())
  const [month,    setMonth]    = useState(new Date().getMonth())
  const [calData,  setCalData]  = useState({})
  const [selected, setSelected] = useState(null)
  const [error,    setError]    = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setError(null)
    try {
      const res = await apiFetch('/expenses/')
      if (!res || !res.ok) { setError('Не удалось загрузить данные'); return }
      const data = await safeJson(res)
      if (!data) { setError('Сервер вернул пустой ответ'); return }
      const map = {}
      ;(data.expenses || []).forEach(e => {
        const key = e.created_at.split('T')[0]
        if (!map[key]) map[key] = []
        map[key].push(e)
      })
      setCalData(map)
    } catch {
      setError('Ошибка загрузки данных')
    }
  }

  function prevMonth() {
    setSelected(null)
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    setSelected(null)
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const firstDay  = new Date(year, month, 1)
  const lastDate  = new Date(year, month + 1, 0).getDate()
  let startDow    = firstDay.getDay()
  startDow = startDow === 0 ? 6 : startDow - 1

  let maxAmt = 0
  for (let d = 1; d <= lastDate; d++) {
    const key   = dateKey(year, month + 1, d)
    const total = (calData[key] || []).reduce((s, e) => s + parseFloat(e.amount), 0)
    if (total > maxAmt) maxAmt = total
  }

  const today   = new Date()
  const cells   = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= lastDate; d++) cells.push(d)

  const selectedKey  = selected
  const selectedExps = selectedKey ? (calData[selectedKey] || []) : []
  const selectedDate = selectedKey ? new Date(selectedKey + 'T00:00:00') : null
  const selectedTotal = selectedExps.reduce((s, e) => s + parseFloat(e.amount), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {error && (
        <div className="card" style={{ padding: '14px 20px', color: 'var(--danger, #ef4444)', fontSize: '.875rem' }}>
          {error}
        </div>
      )}
      <div className="two-col cal-layout">
        <div className="card">
          <div className="cal-nav">
            <button className="btn-ghost" onClick={prevMonth}>← Пред.</button>
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>
              {CAL_MONTHS[month]} {year}
            </span>
            <button className="btn-ghost" onClick={nextMonth}>След. →</button>
          </div>
          <div className="cal-week-header">
            {WEEK_DAYS.map((d, i) => (
              <span key={d} className={i >= 5 ? 'cal-weekend' : ''}>{d}</span>
            ))}
          </div>
          <div className="cal-grid">
            {cells.map((d, i) => {
              if (d === null) return <div key={`e-${i}`} className="cal-cell cal-cell--empty" />
              const key      = dateKey(year, month + 1, d)
              const exps     = calData[key] || []
              const dayTotal = exps.reduce((s, e) => s + parseFloat(e.amount), 0)
              const heat     = maxAmt > 0 ? dayTotal / maxAmt : 0
              const isToday  = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d
              const isSel    = selected === key

              const amtLabel = dayTotal >= 1000000
                ? (dayTotal / 1000000).toFixed(1) + 'M'
                : dayTotal >= 1000
                  ? (dayTotal / 1000).toFixed(0) + 'k'
                  : dayTotal > 0 ? String(Math.round(dayTotal)) : ''

              let cls = 'cal-cell'
              if (isToday) cls += ' cal-cell--today'
              if (isSel)   cls += ' cal-cell--selected'
              if (exps.length) cls += ' cal-cell--has-expenses'

              return (
                <div
                  key={key}
                  className={cls}
                  style={exps.length ? { '--heat': heat.toFixed(3) } : undefined}
                  onClick={exps.length ? () => setSelected(isSel ? null : key) : undefined}
                >
                  <span className="cal-day-num">{d}</span>
                  {amtLabel && <span className="cal-day-amt">{amtLabel}</span>}
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">
              {selectedDate
                ? selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'Расходы за день'}
            </span>
            {selectedDate && (
              <span className="cal-day-total">{selectedTotal.toLocaleString('ru')} сум</span>
            )}
          </div>
          {!selectedDate ? (
            <p className="empty-text" style={{ padding: '20px 0' }}>Выберите день с расходами</p>
          ) : selectedExps.length === 0 ? (
            <p className="empty-text">Нет расходов</p>
          ) : (
            selectedExps.map(e => (
              <div key={e.id} className="expense-item">
                <div className="expense-icon">
                  <svg width="18" height="18"><use href={`#icon-${e.category || 'other'}`} /></svg>
                </div>
                <div className="expense-info">
                  <p className="expense-title">{e.title}</p>
                  <p className="expense-meta">
                    {CAT_LABELS[e.category] || e.category}
                    {e.note ? ` · ${e.note}` : ''}
                  </p>
                </div>
                <p className="expense-amount">{Number(e.amount).toLocaleString('ru')} сум</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
