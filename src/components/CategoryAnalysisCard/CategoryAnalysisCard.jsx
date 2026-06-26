import './CategoryAnalysisCard.css'

const TREND_ICON = { up: '↑', down: '↓', stable: '→' }
const TREND_CLASS = { up: 'cac-trend--up', down: 'cac-trend--down', stable: 'cac-trend--stable' }

function TrendBadge({ trend, changePct }) {
  if (!trend || trend === 'stable') return (
    <span className="cac-badge cac-trend--stable">→ стабильно</span>
  )
  const sign = trend === 'up' ? '+' : ''
  return (
    <span className={`cac-badge ${TREND_CLASS[trend]}`}>
      {TREND_ICON[trend]} {sign}{changePct?.toFixed(1)}%
    </span>
  )
}

export default function CategoryAnalysisCard({ categories = [], loading }) {
  if (loading) return (
    <div className="cac-card card">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="cac-skeleton-row" style={{ animationDelay: `${i * .1}s` }} />
      ))}
    </div>
  )

  if (!categories.length) return (
    <div className="cac-card card cac-empty">
      <p>Нет данных по категориям за этот месяц</p>
    </div>
  )

  const maxAmt = Math.max(...categories.map(c => c.current_amount))

  return (
    <div className="cac-card card">
      <div className="card-header" style={{ marginBottom: 18 }}>
        <span className="card-title">Анализ категорий</span>
        <span className="cac-month-note">Текущий vs прошлый месяц</span>
      </div>

      <div className="cac-list">
        {categories.map((cat, i) => (
          <div
            key={cat.category}
            className="cac-row"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className="cac-row-header">
              <div className="cac-name-wrap">
                <span className="cac-rank">{i + 1}</span>
                <span className={`opt-icon ${cat.category}-icon cac-cat-icon`}>
                  <svg width="13" height="13"><use href={`#icon-${cat.category}`} /></svg>
                </span>
                <span className="cac-name">{cat.label}</span>
              </div>
              <div className="cac-right">
                <TrendBadge trend={cat.trend} changePct={cat.change_percent} />
                <span className="cac-amount">{cat.current_amount.toLocaleString('ru')} сум</span>
              </div>
            </div>

            {/* Bar */}
            <div className="cac-bar-track">
              <div
                className="cac-bar-fill"
                style={{
                  width: `${maxAmt > 0 ? (cat.current_amount / maxAmt) * 100 : 0}%`,
                  animationDelay: `${i * 0.08 + 0.15}s`,
                }}
              />
              {cat.previous_amount > 0 && (
                <div
                  className="cac-bar-prev"
                  style={{ width: `${maxAmt > 0 ? (cat.previous_amount / maxAmt) * 100 : 0}%` }}
                  title={`Прошлый месяц: ${cat.previous_amount.toLocaleString('ru')} сум`}
                />
              )}
            </div>

            <div className="cac-meta">
              <span className="cac-pct-total">{cat.percent_of_total}% от расходов</span>
              {cat.previous_amount > 0 && (
                <span className="cac-prev-amt">
                  Прошлый: {cat.previous_amount.toLocaleString('ru')} сум
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
