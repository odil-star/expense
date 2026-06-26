import './SmartForecast.css'

const METHOD_LABEL = {
  linear_regression: 'Линейная регрессия',
  avg_daily:         'Среднедневной расчёт',
  no_data:           'Нет данных',
}

function AccuracyMeter({ value }) {
  const pct   = Math.min(100, Math.max(0, value))
  const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444'
  const dashes = 2 * Math.PI * 36   // circumference r=36
  const filled = (pct / 100) * dashes

  return (
    <div className="sf-accuracy-meter">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r="36" fill="none" stroke="var(--surface-3)" strokeWidth="7" />
        <circle
          cx="44" cy="44" r="36" fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={`${filled} ${dashes - filled}`}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
          style={{ transition: 'stroke-dasharray .8s cubic-bezier(.4,0,.2,1)' }}
        />
        <text x="44" y="44" textAnchor="middle" dy=".36em"
              fontSize="15" fontWeight="800" fill={color} fontFamily="Manrope,sans-serif">
          {Math.round(pct)}%
        </text>
      </svg>
      <p className="sf-accuracy-label">Точность</p>
    </div>
  )
}

export default function SmartForecast({ data, loading }) {
  if (loading) return (
    <div className="smart-forecast card sf-skeleton">
      <div className="sf-skeleton-line" style={{ width: '60%' }} />
      <div className="sf-skeleton-line" style={{ width: '40%', height: 12 }} />
      <div className="sf-skeleton-block" />
    </div>
  )

  if (!data) return null

  const {
    current_total, forecast_total, days_elapsed, days_remaining,
    days_in_month, accuracy_percent, avg_daily, method,
  } = data

  const progressPct  = days_in_month > 0 ? (days_elapsed / days_in_month) * 100 : 0
  const spendPct     = forecast_total > 0 ? (current_total / forecast_total) * 100 : 0
  const spendColor   = spendPct >= 90 ? '#ef4444' : spendPct >= 70 ? '#f59e0b' : '#22c55e'

  return (
    <div className="smart-forecast card">
      <div className="sf-header">
        <div className="sf-title-col">
          <div className="sf-icon-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div>
            <p className="sf-label">Прогноз до конца месяца</p>
            <p className="sf-sub">
              {METHOD_LABEL[method] || method} · {days_remaining} дн. осталось
            </p>
          </div>
        </div>
        <AccuracyMeter value={accuracy_percent} />
      </div>

      <div className="sf-stats">
        <div className="sf-stat">
          <p className="sf-stat-label">Потрачено сейчас</p>
          <p className="sf-stat-val">{Number(current_total).toLocaleString('ru')} <span>сум</span></p>
        </div>
        <div className="sf-stat">
          <p className="sf-stat-label">Прогноз на месяц</p>
          <p className="sf-stat-val sf-forecast-val">{Number(forecast_total).toLocaleString('ru')} <span>сум</span></p>
        </div>
        <div className="sf-stat">
          <p className="sf-stat-label">Средний в день</p>
          <p className="sf-stat-val">{Number(avg_daily).toLocaleString('ru')} <span>сум</span></p>
        </div>
      </div>

      {/* Time progress */}
      <div className="sf-progress-block">
        <div className="sf-progress-row">
          <span className="sf-progress-name">Месяц прошёл</span>
          <span className="sf-progress-val">{Math.round(progressPct)}%</span>
        </div>
        <div className="sf-track">
          <div className="sf-fill sf-fill--time" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Spend vs forecast */}
      <div className="sf-progress-block">
        <div className="sf-progress-row">
          <span className="sf-progress-name">Потрачено от прогноза</span>
          <span className="sf-progress-val" style={{ color: spendColor }}>
            {Math.round(spendPct)}%
          </span>
        </div>
        <div className="sf-track">
          <div className="sf-fill" style={{ width: `${Math.min(spendPct, 100)}%`, background: spendColor }} />
        </div>
      </div>

      <p className="sf-method-note">
        Алгоритм: {METHOD_LABEL[method]}
      </p>
    </div>
  )
}
