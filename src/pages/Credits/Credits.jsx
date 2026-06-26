import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import { useApiFetch } from '../../hooks/useApiFetch'
import { safeJson } from '../../utils/safeJson'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'
import './Credits.css'

Chart.register(...registerables)

// ── Annuity Engine ────────────────────────────────────────────────────────────

function calcMonthly(amount, annualRate, termMonths) {
  const P = parseFloat(amount)
  const n = parseInt(termMonths)
  const r = parseFloat(annualRate) / 12 / 100
  if (!P || !n || P <= 0 || n <= 0) return 0
  if (r === 0) return P / n
  return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

function buildSchedule(amount, annualRate, termMonths, startDate) {
  const P   = parseFloat(amount)
  const n   = parseInt(termMonths)
  const r   = parseFloat(annualRate) / 12 / 100
  const M   = calcMonthly(P, annualRate, n)
  const base = startDate ? new Date(startDate) : new Date()
  let balance = P
  const rows = []

  for (let i = 1; i <= n; i++) {
    const interest  = balance * r
    const principal = Math.min(M - interest, balance)
    balance         = Math.max(0, balance - principal)

    const pd = new Date(base)
    pd.setMonth(pd.getMonth() + i)

    rows.push({
      month:     i,
      dateObj:   pd,
      dateLabel: pd.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' }),
      payment:   Math.round(M),
      interest:  Math.round(interest),
      principal: Math.round(principal),
      balance:   Math.round(balance),
    })
  }
  return rows
}

function getNextPayment(credit) {
  if (!credit.is_active || getRemaining(credit) <= 0) return null
  const today = new Date()
  const base  = new Date(credit.start_date)
  const M     = Math.round(calcMonthly(credit.amount, credit.annual_rate, credit.term_months))
  const paid  = (credit.payments || []).length

  for (let i = paid + 1; i <= credit.term_months; i++) {
    const pd = new Date(base)
    pd.setMonth(pd.getMonth() + i)
    if (pd > today) return { date: pd, amount: M, monthNum: i }
  }
  return null
}

// Use server-provided remaining balance, fall back to original amount
function getRemaining(credit) {
  return credit.remaining_balance ?? parseFloat(credit.amount)
}

// ── Chart ─────────────────────────────────────────────────────────────────────

function CreditChart({ schedule, payments, originalAmount }) {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !schedule.length) return

    chartRef.current?.destroy()

    const step = schedule.length > 36 ? 3 : 1
    const labels   = schedule.filter((_, i) => i % step === 0).map(r => r.dateLabel)
    const balances = schedule.filter((_, i) => i % step === 0).map(r => r.balance)
    const interests = schedule.filter((_, i) => i % step === 0).map((_, i) => {
      const slice = schedule.slice(0, (i + 1) * step)
      return slice.reduce((s, r) => s + r.interest, 0)
    })

    // Overlay actual payments as vertical markers
    const actualDataset = payments && payments.length > 0 ? [{
      label:       'Фактические платежи',
      data:        payments.map(p => {
        const idx = schedule.findIndex(r =>
          r.dateObj.getFullYear() === new Date(p.payment_date).getFullYear() &&
          r.dateObj.getMonth()    === new Date(p.payment_date).getMonth()
        )
        return idx >= 0 ? { x: schedule[Math.floor(idx / step)].dateLabel, y: parseFloat(p.amount) } : null
      }).filter(Boolean),
      type:        'scatter',
      pointStyle:  'circle',
      pointRadius: 6,
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34,197,94,.5)',
      showLine:    false,
    }] : []

    const ctx = canvasRef.current.getContext('2d')
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label:           'Остаток долга',
            data:            balances,
            borderColor:     '#7c3aed',
            backgroundColor: 'rgba(124,58,237,.12)',
            fill:            true,
            tension:         0.4,
            pointRadius:     schedule.length > 24 ? 0 : 3,
            borderWidth:     2,
          },
          {
            label:           'Выплачено процентов',
            data:            interests,
            borderColor:     '#ef4444',
            backgroundColor: 'rgba(239,68,68,.06)',
            fill:            true,
            tension:         0.4,
            pointRadius:     0,
            borderWidth:     1.5,
            borderDash:      [5, 5],
          },
          ...actualDataset,
        ],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            labels: { color: '#8888aa', font: { size: 11 }, boxWidth: 12 },
          },
          tooltip: {
            backgroundColor: '#1a1a24',
            borderColor:     '#2a2a38',
            borderWidth:     1,
            titleColor:      '#f0f0f8',
            bodyColor:       '#8888aa',
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('ru')} сум`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#4a4a66', font: { size: 10 }, maxRotation: 0 },
            grid:  { color: '#1e1e2a' },
          },
          y: {
            ticks: {
              color: '#4a4a66',
              font:  { size: 10 },
              callback: v => (v / 1000).toLocaleString('ru') + 'к',
            },
            grid: { color: '#1e1e2a' },
          },
        },
      },
    })

    return () => chartRef.current?.destroy()
  }, [schedule, payments])

  return <canvas ref={canvasRef} />
}

// ── Payment Form (inline inside card) ────────────────────────────────────────

function PayForm({ credit, onPay, onCancel, loading }) {
  const [amount, setAmount]   = useState('')
  const [date,   setDate]     = useState(new Date().toISOString().split('T')[0])
  const [note,   setNote]     = useState('')
  const [err,    setErr]      = useState('')
  const amountRef = useRef(null)

  const monthly = Math.round(calcMonthly(credit.amount, credit.annual_rate, credit.term_months))
  const remaining = getRemaining(credit)

  function handleAmountChange(e) {
    const pos    = e.target.selectionStart
    const before = e.target.value.length
    const raw    = e.target.value.replace(/\D/g, '')
    const fmt    = raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ''
    const diff   = fmt.length - before
    setAmount(raw)
    setErr('')
    requestAnimationFrame(() => {
      if (amountRef.current) {
        const np = Math.max(0, pos + diff)
        amountRef.current.setSelectionRange(np, np)
      }
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!num || num <= 0) return setErr('Укажите корректную сумму')
    onPay({ amount: num, payment_date: date, note })
  }

  return (
    <form className="credit-pay-form" onSubmit={handleSubmit} onClick={e => e.stopPropagation()}>
      <div className="credit-pay-form-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
        Внести платёж
      </div>

      <div className="credit-pay-hints">
        <button type="button" className="credit-pay-hint-btn"
          onClick={() => setAmount(String(monthly))}>
          Платёж {monthly.toLocaleString('ru')} сум
        </button>
        <button type="button" className="credit-pay-hint-btn"
          onClick={() => setAmount(String(Math.round(remaining)))}>
          Закрыть {Math.round(remaining).toLocaleString('ru')} сум
        </button>
      </div>

      <div className="credit-pay-fields">
        <div className="field" style={{ margin: 0 }}>
          <label>Сумма платежа (сум)</label>
          <input
            ref={amountRef}
            type="text"
            inputMode="numeric"
            value={amount ? amount.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ''}
            onChange={handleAmountChange}
            placeholder="0"
            autoFocus
          />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Дата</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="field" style={{ margin: 0, gridColumn: '1 / -1' }}>
          <label>Примечание (необязательно)</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Плановый платёж, досрочный..."
          />
        </div>
      </div>

      {err && <p className="credits-form-error">{err}</p>}

      <div className="credit-pay-actions">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Обработка...' : 'Оплатить'}
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </form>
  )
}

// ── Credit Card ───────────────────────────────────────────────────────────────

function CreditCard({ credit, selected, onSelect, onDelete, onToggle, payingId, onPayOpen, onPaySubmit, payLoading }) {
  const remaining = getRemaining(credit)
  const monthly   = Math.round(calcMonthly(credit.amount, credit.annual_rate, credit.term_months))
  const total     = Math.round(monthly * credit.term_months)
  const overpay   = Math.round(total - parseFloat(credit.amount))
  const paidPrin  = credit.paid_principal || 0
  const pct       = parseFloat(credit.amount) > 0
    ? Math.min(100, Math.round((paidPrin / parseFloat(credit.amount)) * 100))
    : 100
  const nextPay   = getNextPayment(credit)
  const isPaying  = payingId === credit.id
  const isSelected = selected?.id === credit.id
  const isPaidOff  = credit.status === 'paid_off'

  return (
    <div
      className={`credit-card${isSelected ? ' credit-card--selected' : ''}${!credit.is_active ? ' credit-card--closed' : ''}`}
      onClick={() => !isPaying && onSelect(isSelected ? null : credit)}
    >
      <div className="credit-card-top">
        <div className="credit-card-title-row">
          <div>
            <p className="credit-card-title">{credit.title}</p>
            {credit.bank && <p className="credit-card-bank">{credit.bank}</p>}
          </div>
          <div className="credit-card-actions" onClick={e => e.stopPropagation()}>
            {isPaidOff ? (
              <span className="credit-status-badge credit-status-badge--paid">Погашен</span>
            ) : (
              <>
                {credit.is_active && remaining > 0 && (
                  <button
                    className="credit-pay-btn"
                    onClick={() => onPayOpen(isPaying ? null : credit.id)}
                    title="Внести платёж"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Платёж
                  </button>
                )}
                <button
                  className={`credit-status-btn${credit.is_active ? ' active' : ''}`}
                  onClick={() => onToggle(credit)}
                  title={credit.is_active ? 'Закрыть кредит' : 'Открыть кредит'}
                >
                  {credit.is_active ? 'Активный' : 'Закрыт'}
                </button>
              </>
            )}
            <button
              className="credit-delete-btn"
              onClick={() => onDelete(credit.id)}
              title="Удалить"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="credit-progress-wrap">
          <div className="credit-progress-bar">
            <div className="credit-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="credit-progress-label">{pct}% выплачено</span>
        </div>
      </div>

      <div className="credit-card-metrics">
        <div className="credit-metric">
          <span className="credit-metric-label">Остаток долга</span>
          <span className={`credit-metric-val${remaining > 0 ? ' credit-metric-val--danger' : ''}`}>
            {remaining > 0 ? `${Math.round(remaining).toLocaleString('ru')} сум` : 'Погашен'}
          </span>
        </div>
        <div className="credit-metric">
          <span className="credit-metric-label">Ставка</span>
          <span className="credit-metric-val">{credit.annual_rate}%</span>
        </div>
        <div className="credit-metric">
          <span className="credit-metric-label">Платёж / мес.</span>
          <span className="credit-metric-val credit-metric-val--brand">
            {monthly.toLocaleString('ru')} сум
          </span>
        </div>
        <div className="credit-metric">
          <span className="credit-metric-label">Переплата</span>
          <span className="credit-metric-val credit-metric-val--warn">
            {overpay.toLocaleString('ru')} сум
          </span>
        </div>
      </div>

      {nextPay && credit.is_active && !isPaidOff && (
        <div className="credit-next-payment">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Следующий платёж: {nextPay.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
          &nbsp;·&nbsp;{nextPay.amount.toLocaleString('ru')} сум
        </div>
      )}

      {/* Inline payment form */}
      {isPaying && (
        <PayForm
          credit={credit}
          loading={payLoading}
          onPay={data => onPaySubmit(credit.id, data)}
          onCancel={() => onPayOpen(null)}
        />
      )}

      {!isPaying && (
        <div className="credit-card-expand-hint">
          {isSelected ? '▲ Свернуть' : '▼ Детали и график'}
        </div>
      )}
    </div>
  )
}

// ── Amortization Table ────────────────────────────────────────────────────────

function AmortizationTable({ schedule }) {
  const [showAll, setShowAll] = useState(false)
  const today = new Date()
  const rows  = showAll ? schedule : schedule.slice(0, 12)

  return (
    <div className="amort-wrap">
      <div className="card-header" style={{ marginBottom: 12 }}>
        <span className="card-title">График погашения</span>
        <span style={{ fontSize: '.72rem', color: 'var(--text-3)' }}>
          {schedule.length} месяцев
        </span>
      </div>
      <div className="amort-table-wrap">
        <table className="amort-table">
          <thead>
            <tr>
              <th>№</th>
              <th>Дата</th>
              <th>Платёж</th>
              <th>Проценты</th>
              <th>Основной долг</th>
              <th>Остаток</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const isPast    = r.dateObj < today
              const isCurrent = !isPast && r.dateObj <= new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
              return (
                <tr
                  key={r.month}
                  className={isPast ? 'amort-row--past' : isCurrent ? 'amort-row--current' : ''}
                >
                  <td className="amort-month">{r.month}</td>
                  <td className="amort-date">{r.dateLabel}</td>
                  <td className="amort-payment">{r.payment.toLocaleString('ru')}</td>
                  <td className="amort-interest">{r.interest.toLocaleString('ru')}</td>
                  <td className="amort-principal">{r.principal.toLocaleString('ru')}</td>
                  <td className="amort-balance">{r.balance.toLocaleString('ru')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {schedule.length > 12 && (
        <button className="btn-ghost amort-toggle" onClick={() => setShowAll(s => !s)}>
          {showAll ? '▲ Свернуть' : `▼ Показать все ${schedule.length} месяцев`}
        </button>
      )}
    </div>
  )
}

// ── Payment History ───────────────────────────────────────────────────────────

function PaymentHistory({ payments }) {
  if (!payments || payments.length === 0) return null

  const totalPaid     = payments.reduce((s, p) => s + parseFloat(p.amount), 0)
  const totalPrincipal = payments.reduce((s, p) => s + parseFloat(p.principal), 0)
  const totalInterest  = payments.reduce((s, p) => s + parseFloat(p.interest), 0)

  return (
    <div className="payment-history">
      <div className="card-header" style={{ marginBottom: 12 }}>
        <span className="card-title">История платежей</span>
        <span className="badge">{payments.length}</span>
      </div>
      <div className="payment-history-summary">
        <div className="ph-stat">
          <span className="ph-stat-label">Всего выплачено</span>
          <span className="ph-stat-val">{Math.round(totalPaid).toLocaleString('ru')} сум</span>
        </div>
        <div className="ph-stat">
          <span className="ph-stat-label">Погашено долга</span>
          <span className="ph-stat-val ph-stat-val--green">{Math.round(totalPrincipal).toLocaleString('ru')} сум</span>
        </div>
        <div className="ph-stat">
          <span className="ph-stat-label">Уплачено процентов</span>
          <span className="ph-stat-val ph-stat-val--danger">{Math.round(totalInterest).toLocaleString('ru')} сум</span>
        </div>
      </div>
      <div className="payment-history-list">
        {[...payments].reverse().map(p => (
          <div key={p.id} className="ph-item">
            <div className="ph-item-date">
              {new Date(p.payment_date + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <div className="ph-item-breakdown">
              <span className="ph-item-principal">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
                Долг: {Math.round(parseFloat(p.principal)).toLocaleString('ru')}
              </span>
              <span className="ph-item-interest">
                %: {Math.round(parseFloat(p.interest)).toLocaleString('ru')}
              </span>
            </div>
            <div className="ph-item-amount">
              {Math.round(parseFloat(p.amount)).toLocaleString('ru')} сум
            </div>
            {p.note && <div className="ph-item-note">{p.note}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: '', amount: '', annual_rate: '', term_months: '',
  start_date: new Date().toISOString().split('T')[0], bank: '',
}

export default function Credits() {
  const apiFetch        = useApiFetch()
  const { showToast }   = useToast()
  const { showConfirm } = useConfirm()
  const amountRef       = useRef(null)

  const [credits,   setCredits]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [formErr,   setFormErr]   = useState('')
  const [saving,    setSaving]    = useState(false)
  const [selected,  setSelected]  = useState(null)
  const [payingId,  setPayingId]  = useState(null)
  const [payLoading, setPayLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await apiFetch('/credits/')
      if (!res || !res.ok) { setError('Не удалось загрузить кредиты'); return }
      const data = await safeJson(res)
      if (!data)           { setError('Сервер вернул пустой ответ'); return }
      setCredits(data.credits || [])
      // Refresh selected credit with updated data
      setSelected(prev => {
        if (!prev) return null
        return (data.credits || []).find(c => c.id === prev.id) || null
      })
    } catch {
      setError('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }, [apiFetch])

  useEffect(() => { load() }, [load])

  // ── Live preview ──────────────────────────────────────────────────────────

  const preview = useMemo(() => {
    const P = parseFloat(form.amount)
    const r = parseFloat(form.annual_rate)
    const n = parseInt(form.term_months)
    if (!P || !r || !n || P <= 0 || r < 0 || n <= 0) return null
    const M     = calcMonthly(P, r, n)
    const total = M * n
    return {
      monthly: Math.round(M),
      total:   Math.round(total),
      overpay: Math.round(total - P),
    }
  }, [form.amount, form.annual_rate, form.term_months])

  // ── Summary across all active credits ─────────────────────────────────────

  const summary = useMemo(() => {
    const active     = credits.filter(c => c.is_active)
    const totalDebt  = active.reduce((s, c) => s + getRemaining(c), 0)
    const totalOverpay = active.reduce((acc, c) => {
      const M  = Math.round(calcMonthly(c.amount, c.annual_rate, c.term_months))
      const ov = Math.round(M * c.term_months - parseFloat(c.amount))
      return acc + ov
    }, 0)
    let nextPay = null
    for (const c of active) {
      const np = getNextPayment(c)
      if (np && (!nextPay || np.date < nextPay.date)) nextPay = np
    }
    return { totalDebt, activeCount: active.length, nextPay, totalOverpay }
  }, [credits])

  // ── Form handlers ──────────────────────────────────────────────────────────

  function handleFormChange(e) {
    const { name, value } = e.target
    if (name === 'amount') {
      const pos    = e.target.selectionStart
      const before = value.length
      const raw    = value.replace(/\D/g, '')
      const fmt    = raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ''
      const diff   = fmt.length - before
      setForm(f => ({ ...f, amount: raw }))
      requestAnimationFrame(() => {
        if (amountRef.current) {
          const np = Math.max(0, pos + diff)
          amountRef.current.setSelectionRange(np, np)
        }
      })
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
    setFormErr('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormErr('')
    if (!form.title.trim())                              return setFormErr('Введите название кредита')
    if (!form.amount || parseFloat(form.amount) <= 0)   return setFormErr('Введите корректную сумму')
    if (!form.annual_rate || parseFloat(form.annual_rate) < 0) return setFormErr('Введите процентную ставку')
    if (!form.term_months || parseInt(form.term_months) <= 0)  return setFormErr('Введите срок кредита')
    if (!form.start_date)                                return setFormErr('Введите дату начала')

    setSaving(true)
    try {
      const res = await apiFetch('/credits/', {
        method: 'POST',
        body: JSON.stringify({
          title:       form.title.trim(),
          amount:      parseFloat(form.amount),
          annual_rate: parseFloat(form.annual_rate),
          term_months: parseInt(form.term_months),
          start_date:  form.start_date,
          bank:        form.bank.trim(),
        }),
      })
      if (!res || !res.ok) {
        const d = await safeJson(res)
        setFormErr(d ? Object.values(d).flat().join(' ') : 'Ошибка сохранения')
        return
      }
      showToast('Кредит добавлен', 'success')
      setForm(EMPTY_FORM)
      setShowForm(false)
      load()
    } catch {
      setFormErr('Ошибка соединения с сервером')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    showConfirm('Кредит будет удалён безвозвратно', async () => {
      await apiFetch(`/credits/${id}/`, { method: 'DELETE' })
      showToast('Кредит удалён', 'info')
      if (selected?.id === id) setSelected(null)
      load()
    })
  }

  async function handleToggle(credit) {
    try {
      const res = await apiFetch(`/credits/${credit.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !credit.is_active }),
      })
      if (res?.ok) load()
    } catch {}
  }

  // ── Payment handler ────────────────────────────────────────────────────────

  async function handlePaySubmit(creditId, { amount, payment_date, note }) {
    setPayLoading(true)
    try {
      const res = await apiFetch(`/credits/${creditId}/pay/`, {
        method: 'POST',
        body: JSON.stringify({ amount, payment_date, note }),
      })
      if (!res || !res.ok) {
        const d = await safeJson(res)
        showToast(d?.error || 'Ошибка при проведении платежа', 'error')
        return
      }
      const data = await safeJson(res)
      setPayingId(null)
      if (data?.auto_closed) {
        showToast('Кредит полностью погашен!', 'success')
      } else {
        const paid = data?.payment
        if (paid) {
          const princFmt = Math.round(parseFloat(paid.principal)).toLocaleString('ru')
          const intFmt   = Math.round(parseFloat(paid.interest)).toLocaleString('ru')
          showToast(`Платёж принят · Долг −${princFmt} · % ${intFmt} сум`, 'success')
        } else {
          showToast('Платёж проведён', 'success')
        }
      }
      load()
    } catch {
      showToast('Ошибка соединения', 'error')
    } finally {
      setPayLoading(false)
    }
  }

  // ── Selected credit detail ────────────────────────────────────────────────

  const schedule = useMemo(() => {
    if (!selected) return []
    return buildSchedule(selected.amount, selected.annual_rate, selected.term_months, selected.start_date)
  }, [selected])

  const selMonthly = selected ? Math.round(calcMonthly(selected.amount, selected.annual_rate, selected.term_months)) : 0
  const selTotal   = selected ? Math.round(selMonthly * parseInt(selected.term_months)) : 0
  const selOverpay = selected ? Math.round(selTotal - parseFloat(selected.amount)) : 0
  const selRemain  = selected ? getRemaining(selected) : 0

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="credits-page">

      {/* Header */}
      <div className="credits-header">
        <div>
          <h1 className="credits-title">Кредиты</h1>
          <p className="credits-sub">Управление кредитами и аннуитетный расчёт</p>
        </div>
        <button
          className={`btn-primary credits-add-btn${showForm ? ' active' : ''}`}
          onClick={() => setShowForm(s => !s)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {showForm
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>
            }
          </svg>
          {showForm ? 'Отмена' : 'Добавить кредит'}
        </button>
      </div>

      {/* Summary stats */}
      {credits.length > 0 && (
        <div className="credits-summary">
          <div className="credits-stat">
            <div className="credits-stat-icon credits-stat-icon--danger">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="1" y="4" width="22" height="16" rx="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <div>
              <p className="credits-stat-label">Общий долг</p>
              <p className="credits-stat-value">{Math.round(summary.totalDebt).toLocaleString('ru')} сум</p>
            </div>
          </div>
          <div className="credits-stat">
            <div className="credits-stat-icon credits-stat-icon--brand">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div>
              <p className="credits-stat-label">Ближайший платёж</p>
              <p className="credits-stat-value">
                {summary.nextPay ? `${summary.nextPay.amount.toLocaleString('ru')} сум` : '—'}
              </p>
              {summary.nextPay && (
                <p className="credits-stat-date">
                  {summary.nextPay.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                </p>
              )}
            </div>
          </div>
          <div className="credits-stat">
            <div className="credits-stat-icon credits-stat-icon--green">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </div>
            <div>
              <p className="credits-stat-label">Активных кредитов</p>
              <p className="credits-stat-value">{summary.activeCount}</p>
            </div>
          </div>
          <div className="credits-stat">
            <div className="credits-stat-icon credits-stat-icon--warn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div>
              <p className="credits-stat-label">Общая переплата</p>
              <p className="credits-stat-value credits-stat-value--warn">
                {summary.totalOverpay.toLocaleString('ru')} сум
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="credits-form-wrap card">
          <p className="credits-form-title">Новый кредит</p>
          <form onSubmit={handleSubmit} className="credits-form">
            <div className="credits-form-grid">
              <div className="field">
                <label>Название кредита</label>
                <input
                  name="title" value={form.title}
                  onChange={handleFormChange}
                  placeholder="Ипотека, автокредит..."
                />
              </div>
              <div className="field">
                <label>Банк</label>
                <input
                  name="bank" value={form.bank}
                  onChange={handleFormChange}
                  placeholder="Название банка"
                />
              </div>
              <div className="field">
                <label>Сумма кредита (сум)</label>
                <input
                  ref={amountRef}
                  type="text"
                  inputMode="numeric"
                  name="amount"
                  value={form.amount ? form.amount.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ''}
                  onChange={handleFormChange}
                  placeholder="0"
                />
              </div>
              <div className="field">
                <label>Годовая ставка (%)</label>
                <input
                  type="number" name="annual_rate" value={form.annual_rate}
                  onChange={handleFormChange}
                  placeholder="0.0"
                  min="0" step="0.01"
                />
              </div>
              <div className="field">
                <label>Срок (месяцев)</label>
                <input
                  type="number" name="term_months" value={form.term_months}
                  onChange={handleFormChange}
                  placeholder="12"
                  min="1" max="600"
                />
              </div>
              <div className="field">
                <label>Дата начала</label>
                <input
                  type="date" name="start_date" value={form.start_date}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            {/* Live calculator preview */}
            {preview && (
              <div className="credits-preview">
                <div className="credits-preview-item">
                  <span className="credits-preview-label">Ежемесячный платёж</span>
                  <span className="credits-preview-val credits-preview-val--brand">
                    {preview.monthly.toLocaleString('ru')} сум
                  </span>
                </div>
                <div className="credits-preview-item">
                  <span className="credits-preview-label">Общая сумма выплат</span>
                  <span className="credits-preview-val">
                    {preview.total.toLocaleString('ru')} сум
                  </span>
                </div>
                <div className="credits-preview-item">
                  <span className="credits-preview-label">Сумма переплаты</span>
                  <span className="credits-preview-val credits-preview-val--danger">
                    +{preview.overpay.toLocaleString('ru')} сум
                  </span>
                </div>
              </div>
            )}

            {formErr && <p className="credits-form-error">{formErr}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Сохранение...' : 'Добавить кредит'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormErr('') }}>
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Credits list */}
      {loading ? (
        <div className="credits-grid">
          {[...Array(2)].map((_, i) => <div key={i} className="credit-skel" />)}
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--danger)', padding: 32 }}>
          {error}
        </div>
      ) : credits.length === 0 ? (
        <div className="card credits-empty">
          <div className="credits-empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="1" y="4" width="22" height="16" rx="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          </div>
          <p className="credits-empty-title">Кредитов нет</p>
          <p className="credits-empty-sub">Добавьте первый кредит, чтобы видеть расчёты и график</p>
          <button className="btn-primary" onClick={() => setShowForm(true)} style={{ marginTop: 16 }}>
            Добавить кредит
          </button>
        </div>
      ) : (
        <div className="credits-grid">
          {credits.map(c => (
            <CreditCard
              key={c.id}
              credit={c}
              selected={selected}
              onSelect={setSelected}
              onDelete={handleDelete}
              onToggle={handleToggle}
              payingId={payingId}
              onPayOpen={setPayingId}
              onPaySubmit={handlePaySubmit}
              payLoading={payLoading}
            />
          ))}
        </div>
      )}

      {/* Selected credit detail */}
      {selected && schedule.length > 0 && (
        <div className="credit-detail card">
          <div className="credit-detail-header">
            <div>
              <p className="card-title">{selected.title}</p>
              {selected.bank && <p style={{ fontSize: '.8rem', color: 'var(--text-3)' }}>{selected.bank}</p>}
            </div>
            <button className="btn-ghost" onClick={() => setSelected(null)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Закрыть
            </button>
          </div>

          {/* 8 summary metrics */}
          <div className="credit-detail-metrics">
            <div className="credit-detail-metric">
              <p className="credit-detail-metric-label">Сумма кредита</p>
              <p className="credit-detail-metric-val">
                {Number(selected.amount).toLocaleString('ru')} сум
              </p>
            </div>
            <div className="credit-detail-metric">
              <p className="credit-detail-metric-label">Процентная ставка</p>
              <p className="credit-detail-metric-val">{selected.annual_rate}% год.</p>
            </div>
            <div className="credit-detail-metric">
              <p className="credit-detail-metric-label">Ежемесячный платёж</p>
              <p className="credit-detail-metric-val credit-detail-metric-val--brand">
                {selMonthly.toLocaleString('ru')} сум
              </p>
            </div>
            <div className="credit-detail-metric">
              <p className="credit-detail-metric-label">Переплата</p>
              <p className="credit-detail-metric-val credit-detail-metric-val--danger">
                {selOverpay.toLocaleString('ru')} сум
              </p>
            </div>
            <div className="credit-detail-metric">
              <p className="credit-detail-metric-label">Общая сумма выплат</p>
              <p className="credit-detail-metric-val">{selTotal.toLocaleString('ru')} сум</p>
            </div>
            <div className="credit-detail-metric">
              <p className="credit-detail-metric-label">Остаток долга</p>
              <p className="credit-detail-metric-val credit-detail-metric-val--danger">
                {Math.round(selRemain).toLocaleString('ru')} сум
              </p>
            </div>
            <div className="credit-detail-metric">
              <p className="credit-detail-metric-label">Срок</p>
              <p className="credit-detail-metric-val">{selected.term_months} мес.</p>
            </div>
            <div className="credit-detail-metric">
              <p className="credit-detail-metric-label">Дата начала</p>
              <p className="credit-detail-metric-val">
                {new Date(selected.start_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="credit-chart-wrap">
            <p className="credit-chart-title">Динамика остатка долга</p>
            <div className="credit-chart-canvas">
              <CreditChart schedule={schedule} payments={selected.payments} originalAmount={selected.amount} />
            </div>
          </div>

          {/* Payment History */}
          <PaymentHistory payments={selected.payments} />

          {/* Amortization table */}
          <AmortizationTable schedule={schedule} />
        </div>
      )}
    </div>
  )
}
