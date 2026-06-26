import './ForecastCard.css'

export default function ForecastCard({ expenses = [] }) {
  const now          = new Date()
  const dayOfMonth   = now.getDate()
  const daysInMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysRemaining = daysInMonth - dayOfMonth

  const totalIncome   = parseFloat(localStorage.getItem('totalIncome'))  || 0
  const manualBalance = parseFloat(localStorage.getItem('userBalance'))  || 0
  const balance       = totalIncome > 0 ? totalIncome : manualBalance

  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthExp = expenses.filter(e => e.created_at.startsWith(monthStr))
  const spent    = monthExp.reduce((s, e) => s + parseFloat(e.amount), 0)

  const avgDaily       = dayOfMonth > 0 ? spent / dayOfMonth : 0
  const forecastedExtra = avgDaily * daysRemaining
  const forecastedTotal = spent + forecastedExtra
  const forecastedLeft  = balance - forecastedTotal
  const isAtRisk        = balance > 0 && forecastedLeft < 0
  const progress        = balance > 0 ? Math.min((forecastedTotal / balance) * 100, 100) : 0
  const progressColor   = progress >= 90 ? '#ef4444' : progress >= 70 ? '#f59e0b' : '#22c55e'

  return (
    <div className={`forecast-card${isAtRisk ? ' forecast-card--danger' : ''}`}>
      <div className="forecast-header">
        <div className="forecast-title-row">
          <div className="forecast-icon-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <line x1="8" y1="14" x2="8" y2="14"/>
              <line x1="12" y1="14" x2="12" y2="14"/>
            </svg>
          </div>
          <div>
            <p className="forecast-label">Прогноз до конца месяца</p>
            <p className="forecast-sub">Осталось {daysRemaining} дн. из {daysInMonth}</p>
          </div>
        </div>
        {isAtRisk && (
          <span className="forecast-risk-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Риск перерасхода
          </span>
        )}
      </div>

      <div className="forecast-stats">
        <div className="forecast-stat">
          <span className="forecast-stat-label">Средний/день</span>
          <span className="forecast-stat-val">
            {Math.round(avgDaily).toLocaleString('ru')} <span className="forecast-currency">сум</span>
          </span>
        </div>
        <div className="forecast-stat">
          <span className="forecast-stat-label">Прогноз трат</span>
          <span className="forecast-stat-val">
            {Math.round(forecastedTotal).toLocaleString('ru')} <span className="forecast-currency">сум</span>
          </span>
        </div>
        <div className="forecast-stat">
          <span className="forecast-stat-label">Прогноз остатка</span>
          <span className={`forecast-stat-val ${forecastedLeft < 0 ? 'fc-danger' : 'fc-success'}`}>
            {Math.round(forecastedLeft).toLocaleString('ru')} <span className="forecast-currency">сум</span>
          </span>
        </div>
      </div>

      {balance > 0 && (
        <div className="forecast-progress-section">
          <div className="forecast-progress-track">
            <div
              className="forecast-progress-bar"
              style={{ width: `${progress}%`, background: progressColor }}
            />
            <div
              className="forecast-progress-marker"
              style={{ left: `${Math.min((spent / balance) * 100, 100)}%` }}
              title={`Текущий расход: ${Math.round(spent).toLocaleString('ru')} сум`}
            />
          </div>
          <div className="forecast-progress-labels">
            <span className="forecast-pct-label" style={{ color: progressColor }}>
              {Math.round(progress)}% бюджета
            </span>
            <span className="forecast-balance-label">
              из {balance.toLocaleString('ru')} сум
            </span>
          </div>
        </div>
      )}

      {balance === 0 && (
        <p className="forecast-no-balance">
          Укажите доход или баланс на Дашборде для расчёта прогноза
        </p>
      )}
    </div>
  )
}
