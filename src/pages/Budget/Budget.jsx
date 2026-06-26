import { useState, useEffect } from 'react'
import { useApiFetch } from '../../hooks/useApiFetch'
import { safeJson } from '../../utils/safeJson'
import { useToast } from '../../context/ToastContext'
import { BUDGET_CATS, CAT_LABELS } from '../../constants/categories'
import AmountInput from '../../components/AmountInput/AmountInput'
import { parseAmount, formatAmount } from '../../utils/format'
import './Budget.css'

function getBudgets() {
  try { return JSON.parse(localStorage.getItem('budgets') || '{}') }
  catch { return {} }
}

export default function Budget() {
  const apiFetch = useApiFetch()
  const { showToast } = useToast()

  const [budgetInputs, setBudgetInputs] = useState(() => {
    const saved = getBudgets()
    return Object.fromEntries(BUDGET_CATS.map(c => [c, saved[c] ? formatAmount(saved[c]) : '']))
  })
  const [spentByCat, setSpentByCat] = useState({})
  const [error, setError] = useState(null)

  useEffect(() => { loadSpent() }, [])

  async function loadSpent() {
    setError(null)
    try {
      const res = await apiFetch('/expenses/')
      if (!res || !res.ok) { setError('Не удалось загрузить расходы'); return }
      const data = await safeJson(res)
      if (!data) { setError('Сервер вернул пустой ответ'); return }
      const now  = new Date()
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const map = {}
      ;(data.expenses || []).forEach(e => {
        if (e.created_at.startsWith(month)) {
          map[e.category] = (map[e.category] || 0) + parseFloat(e.amount)
        }
      })
      setSpentByCat(map)
    } catch {
      setError('Ошибка загрузки данных')
    }
  }

  function handleSave() {
    const budgets = {}
    BUDGET_CATS.forEach(cat => {
      const v = parseAmount(budgetInputs[cat])
      if (v) budgets[cat] = String(v)
    })
    localStorage.setItem('budgets', JSON.stringify(budgets))
    showToast('Бюджеты сохранены')
  }

  const savedBudgets = getBudgets()
  const hasBudget = BUDGET_CATS.some(c => savedBudgets[c] && parseFloat(savedBudgets[c]) > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {error && (
        <div className="card" style={{ padding: '14px 20px', color: 'var(--danger, #ef4444)', fontSize: '.875rem' }}>
          {error}
        </div>
      )}
      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Установить лимиты</span>
          </div>
          <p className="budget-hint">Ежемесячные лимиты расходов по категориям</p>
          {BUDGET_CATS.map(cat => (
            <div key={cat} className="budget-setup-row">
              <div className="budget-setup-label">
                <span className={`opt-icon ${cat}-icon`} style={{ width: 28, height: 28, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14"><use href={`#icon-${cat}`} /></svg>
                </span>
                <span>{CAT_LABELS[cat]}</span>
              </div>
              <AmountInput
                value={budgetInputs[cat]}
                onChange={val => setBudgetInputs(prev => ({ ...prev, [cat]: val }))}
                placeholder="0"
                style={{ width: 'clamp(100px, 38%, 180px)', flexShrink: 0 }}
              />
            </div>
          ))}
          <button className="btn-primary w-full" style={{ marginTop: 16 }} onClick={handleSave}>
            Сохранить лимиты
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Прогресс за месяц</span>
          </div>
          {!hasBudget ? (
            <p className="empty-text">Установите лимиты слева</p>
          ) : (
            BUDGET_CATS.map(cat => {
              const limit = parseFloat(savedBudgets[cat] || '0') || 0
              if (!limit) return null
              const spent = spentByCat[cat] || 0
              const pct   = Math.min(Math.round((spent / limit) * 100), 100)
              const color = pct >= 90 ? '#ef4444' : pct >= 60 ? '#f59e0b' : '#22c55e'
              const over  = spent > limit
              return (
                <div key={cat} className="budget-progress-row">
                  <div className="budget-progress-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`opt-icon ${cat}-icon`} style={{ width: 28, height: 28, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="14" height="14"><use href={`#icon-${cat}`} /></svg>
                      </span>
                      <span className="budget-cat-name">{CAT_LABELS[cat]}</span>
                    </div>
                    <span className="budget-pct" style={{ color }}>{pct}%</span>
                  </div>
                  <div className="budget-bar-wrap">
                    <div className="budget-bar-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <div className="budget-amounts">
                    <span>{spent.toLocaleString('ru')} сум</span>
                    <span className={over ? 'budget-limit--over' : ''}>из {limit.toLocaleString('ru')} сум</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
