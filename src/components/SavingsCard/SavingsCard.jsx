import './SavingsCard.css'

function getBudgets() {
  try { return JSON.parse(localStorage.getItem('budgets') || '{}') }
  catch { return {} }
}

export default function SavingsCard({ expenses = [] }) {
  const now      = new Date()
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthExp = expenses.filter(e => e.created_at.startsWith(monthStr))
  const actual   = monthExp.reduce((s, e) => s + parseFloat(e.amount), 0)

  const budgets     = getBudgets()
  const totalBudget = Object.values(budgets).reduce((s, v) => s + parseFloat(v || 0), 0)

  const hasBudget = totalBudget > 0
  const savings   = totalBudget - actual
  const isOver    = savings < 0
  const pct       = totalBudget > 0 ? Math.min(Math.abs(savings / totalBudget) * 100, 100) : 0

  const color = isOver
    ? '#ef4444'
    : savings / totalBudget > 0.2 ? '#22c55e' : '#f59e0b'

  return (
    <div className={`savings-card${isOver ? ' savings-card--over' : ' savings-card--saved'}`}>
      <div className="savings-header">
        <div className="savings-icon-wrap" style={{ background: isOver ? 'rgba(239,68,68,.1)' : 'rgba(34,197,94,.1)', color }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {isOver
              ? <><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></>
              : <><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></>
            }
          </svg>
        </div>
        <div>
          <p className="savings-label">{isOver ? 'Перерасход' : 'Экономия'} за месяц</p>
          <p className="savings-sub">
            {hasBudget
              ? `Бюджет: ${totalBudget.toLocaleString('ru')} сум`
              : 'Установите бюджет для расчёта'
            }
          </p>
        </div>
      </div>

      {hasBudget ? (
        <>
          <div className="savings-amount" style={{ color }}>
            {isOver ? '−' : '+'}{Math.abs(Math.round(savings)).toLocaleString('ru')}
            <span className="savings-currency">сум</span>
          </div>

          <div className="savings-breakdown">
            <div className="savings-row">
              <span className="savings-row-dot" style={{ background: '#3b82f6' }} />
              <span className="savings-row-label">Потрачено</span>
              <span className="savings-row-val">{Math.round(actual).toLocaleString('ru')} сум</span>
            </div>
            <div className="savings-row">
              <span className="savings-row-dot" style={{ background: color }} />
              <span className="savings-row-label">{isOver ? 'Превышение' : 'Сэкономлено'}</span>
              <span className="savings-row-val" style={{ color }}>
                {Math.abs(Math.round(savings)).toLocaleString('ru')} сум
              </span>
            </div>
          </div>

          <div className="savings-bar-track">
            <div
              className="savings-bar-fill"
              style={{ width: `${pct}%`, background: color }}
            />
          </div>
          <p className="savings-bar-hint">
            {isOver
              ? `Превышение бюджета на ${Math.round(pct)}%`
              : `Сэкономлено ${Math.round(pct)}% от бюджета`
            }
          </p>
        </>
      ) : (
        <div className="savings-empty">
          <p>Установите месячные лимиты, чтобы видеть экономию</p>
          <a href="/budget" className="savings-setup-link">Настроить бюджеты →</a>
        </div>
      )}
    </div>
  )
}
