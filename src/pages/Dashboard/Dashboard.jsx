import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router'
import { useApiFetch } from '../../hooks/useApiFetch'
import { safeJson } from '../../utils/safeJson'
import BalanceCard from '../../components/BalanceCard/BalanceCard'
import ExpenseItem from '../../components/ExpenseItem/ExpenseItem'
import ForecastCard from '../../components/ForecastCard/ForecastCard'
import SavingsCard from '../../components/SavingsCard/SavingsCard'
import './Dashboard.css'

// ── Credit helper (next payment date from schedule) ───────────────────────────
function calcMonthly(amount, annualRate, termMonths) {
  const P = parseFloat(amount), n = parseInt(termMonths)
  const r = parseFloat(annualRate) / 12 / 100
  if (!P || !n) return 0
  if (r === 0) return P / n
  return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

function getNextPayment(credit) {
  if (!credit.is_active || (credit.remaining_balance ?? parseFloat(credit.amount)) <= 0) return null
  const today = new Date(), base = new Date(credit.start_date)
  const M = Math.round(calcMonthly(credit.amount, credit.annual_rate, credit.term_months))
  const paid = (credit.payments || []).length
  for (let i = paid + 1; i <= credit.term_months; i++) {
    const pd = new Date(base); pd.setMonth(pd.getMonth() + i)
    if (pd > today) return { date: pd, amount: M }
  }
  return null
}
// ─────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const apiFetch = useApiFetch()
  const [stats,    setStats]    = useState({ count: 0, total: 0, cats: 0 })
  const [expenses, setExpenses] = useState([])
  const [preview,  setPreview]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [credits,  setCredits]  = useState([])

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [expRes, credRes] = await Promise.all([
        apiFetch('/expenses/'),
        apiFetch('/credits/'),
      ])

      if (expRes?.ok) {
        const data = await safeJson(expRes)
        if (data) {
          const exps = data.expenses || []
          setStats({ count: data.count, total: data.total, cats: new Set(exps.map(e => e.category)).size })
          setExpenses(exps)
          setPreview(exps.slice(0, 5))
          localStorage.setItem('totalSpent', data.total || 0)
        }
      } else {
        setError('Не удалось загрузить данные')
      }

      if (credRes?.ok) {
        const credData = await safeJson(credRes)
        if (credData) setCredits(credData.credits || [])
      }
    } catch {
      setError('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const creditSummary = useMemo(() => {
    const active    = credits.filter(c => c.is_active)
    const totalDebt = active.reduce((s, c) => s + (c.remaining_balance ?? parseFloat(c.amount)), 0)
    let nextPay = null
    for (const c of active) {
      const np = getNextPayment(c)
      if (np && (!nextPay || np.date < nextPay.date)) nextPay = np
    }
    return { totalDebt, activeCount: active.length, nextPay }
  }, [credits])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <BalanceCard totalSpent={stats.total} />

      {/* ── Stats row ── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon--purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </div>
          <div>
            <p className="stat-label">Записей</p>
            <p className="stat-value">{stats.count}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon--blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div>
            <p className="stat-label">Всего потрачено</p>
            <p className="stat-value">{Number(stats.total).toLocaleString('ru')} сум</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon--green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
          </div>
          <div>
            <p className="stat-label">Категорий</p>
            <p className="stat-value">{stats.cats}</p>
          </div>
        </div>
      </div>

      {/* ── Forecast + Savings ── */}
      <div className="two-col">
        <ForecastCard expenses={expenses} />
        <SavingsCard  expenses={expenses} />
      </div>

      {/* ── Credits widget ── */}
      {credits.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              <span className="card-title">Мои кредиты</span>
              <span className="badge">{creditSummary.activeCount}</span>
            </div>
            <Link to="/credits" className="btn-ghost">Все кредиты →</Link>
          </div>
          <div className="stats-grid" style={{ marginTop: 12 }}>
            <div className="stat-card">
              <div className="stat-icon stat-icon--purple">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              </div>
              <div>
                <p className="stat-label">Общий долг</p>
                <p className="stat-value" style={{ color: '#ef4444' }}>
                  {creditSummary.totalDebt.toLocaleString('ru')} сум
                </p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon--blue">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div>
                <p className="stat-label">Ближайший платёж</p>
                <p className="stat-value">
                  {creditSummary.nextPay
                    ? `${creditSummary.nextPay.amount.toLocaleString('ru')} сум`
                    : '—'}
                </p>
                {creditSummary.nextPay && (
                  <p style={{ fontSize: '.72rem', color: 'var(--text-3)', marginTop: 2 }}>
                    {creditSummary.nextPay.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                  </p>
                )}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon--green">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                </svg>
              </div>
              <div>
                <p className="stat-label">Активных</p>
                <p className="stat-value">{creditSummary.activeCount}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Recent expenses ── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Последние расходы</span>
          <Link to="/expenses" className="btn-ghost">Все расходы →</Link>
        </div>
        {loading ? (
          <p className="empty-text">Загрузка...</p>
        ) : error ? (
          <p className="empty-text" style={{ color: 'var(--danger, #ef4444)' }}>{error}</p>
        ) : preview.length === 0 ? (
          <p className="empty-text">Расходов пока нет</p>
        ) : (
          preview.map(e => <ExpenseItem key={e.id} expense={e} />)
        )}
      </div>
    </div>
  )
}
