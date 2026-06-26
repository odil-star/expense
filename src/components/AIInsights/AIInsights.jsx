import { Link } from 'react-router'
import './AIInsights.css'

const TYPE_STYLES = {
  info:    { border: 'rgba(59,130,246,.3)',  bg: 'rgba(59,130,246,.06)',  tag: '#3b82f6',  label: 'Инфо' },
  success: { border: 'rgba(34,197,94,.3)',   bg: 'rgba(34,197,94,.06)',   tag: '#22c55e',  label: 'Хорошо' },
  warning: { border: 'rgba(245,158,11,.3)',  bg: 'rgba(245,158,11,.06)',  tag: '#f59e0b',  label: 'Внимание' },
  danger:  { border: 'rgba(239,68,68,.3)',   bg: 'rgba(239,68,68,.06)',   tag: '#ef4444',  label: 'Риск' },
}

const PRIORITY_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }
const PRIORITY_LABEL = { high: 'Важно', medium: 'Средний', low: 'Рекомендация' }

function InsightCard({ insight, index }) {
  const s = TYPE_STYLES[insight.type] || TYPE_STYLES.info
  return (
    <div
      className="ai-insight-card"
      style={{
        borderColor: s.border,
        background: s.bg,
        animationDelay: `${index * 0.08}s`,
      }}
    >
      <div className="ai-insight-icon">{insight.icon}</div>
      <div className="ai-insight-body">
        <div className="ai-insight-meta">
          <span className="ai-insight-title">{insight.title}</span>
          <span className="ai-insight-tag" style={{ color: s.tag, background: `${s.tag}20` }}>
            {s.label}
          </span>
        </div>
        <p className="ai-insight-text">{insight.text}</p>
      </div>
    </div>
  )
}

function RecommendationCard({ rec, index }) {
  const color = PRIORITY_COLOR[rec.priority] || '#3b82f6'
  return (
    <div className="ai-rec-card" style={{ animationDelay: `${index * 0.09}s` }}>
      <div className="ai-rec-left">
        <div className="ai-rec-icon">{rec.icon}</div>
        <div
          className="ai-rec-priority"
          style={{ color, background: `${color}20` }}
        >
          {PRIORITY_LABEL[rec.priority]}
        </div>
      </div>
      <div className="ai-rec-body">
        <p className="ai-rec-title">{rec.title}</p>
        <p className="ai-rec-text">{rec.text}</p>
        {rec.link && (
          <Link to={rec.link} className="ai-rec-link">
            {rec.action} →
          </Link>
        )}
      </div>
    </div>
  )
}

function ForecastSection({ forecast }) {
  if (!forecast) return null
  return (
    <div className="ai-forecast-grid">
      <div className="ai-forecast-item">
        <p className="ai-forecast-label">Средний расход/день</p>
        <p className="ai-forecast-val">{forecast.avgDailySpend.toLocaleString('ru')} сум</p>
      </div>
      <div className="ai-forecast-item">
        <p className="ai-forecast-label">Прогноз этого месяца</p>
        <p className={`ai-forecast-val${forecast.atRisk ? ' ai-forecast-val--danger' : ''}`}>
          {forecast.forecastedTotal.toLocaleString('ru')} сум
        </p>
      </div>
      <div className="ai-forecast-item">
        <p className="ai-forecast-label">Прогноз след. месяца</p>
        <p className="ai-forecast-val ai-forecast-val--dim">
          {forecast.nextMonthTotal.toLocaleString('ru')} сум
        </p>
      </div>
      {forecast.savingsEstimate !== null && (
        <div className="ai-forecast-item">
          <p className="ai-forecast-label">Ожидаемая экономия</p>
          <p className={`ai-forecast-val${forecast.savingsEstimate < 0 ? ' ai-forecast-val--danger' : ' ai-forecast-val--success'}`}>
            {forecast.savingsEstimate < 0 ? '−' : '+'}{Math.abs(forecast.savingsEstimate).toLocaleString('ru')} сум
          </p>
        </div>
      )}
    </div>
  )
}

function TopCatsSection({ cats, total }) {
  if (!cats || cats.length === 0) return null
  return (
    <div className="ai-topcats">
      {cats.map((c, i) => {
        const pct = total > 0 ? Math.round((c.amount / total) * 100) : 0
        return (
          <div key={c.cat} className="ai-topcat-row" style={{ animationDelay: `${i * 0.07}s` }}>
            <span className="ai-topcat-rank">{i + 1}</span>
            <div className="ai-topcat-body">
              <div className="ai-topcat-header">
                <span className="ai-topcat-name">{c.label}</span>
                <span className="ai-topcat-pct">{pct}%</span>
              </div>
              <div className="ai-topcat-track">
                <div
                  className="ai-topcat-fill"
                  style={{
                    width: `${pct}%`,
                    background: `hsl(${260 - i * 30}, 70%, 60%)`,
                    animationDelay: `${i * 0.1 + 0.3}s`,
                  }}
                />
              </div>
            </div>
            <span className="ai-topcat-amt">{c.amount.toLocaleString('ru')} сум</span>
          </div>
        )
      })}
    </div>
  )
}

export default function AIInsights({ insights = [], recommendations = [], forecast = null, summary = null, loading = false }) {
  if (loading) {
    return (
      <div className="ai-loading">
        <div className="ai-loading-brain">
          <span className="ai-brain-pulse" />
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
          </svg>
        </div>
        <p className="ai-loading-text">Анализируем ваши данные…</p>
        <p className="ai-loading-sub">Это займёт несколько секунд</p>
      </div>
    )
  }

  if (insights.length === 0 && recommendations.length === 0) {
    return (
      <div className="ai-empty">
        <div className="ai-empty-icon">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
          </svg>
        </div>
        <p className="ai-empty-title">Недостаточно данных</p>
        <p className="ai-empty-sub">Добавьте расходы, чтобы получить персональный анализ</p>
        <Link to="/add" className="btn-primary" style={{ display: 'inline-flex', marginTop: 16 }}>
          Добавить расход
        </Link>
      </div>
    )
  }

  return (
    <div className="ai-insights-wrap">
      {/* Insights */}
      {insights.length > 0 && (
        <section className="ai-section">
          <div className="ai-section-header">
            <div className="ai-section-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h2 className="ai-section-title">Инсайты</h2>
            <span className="ai-section-badge">{insights.length}</span>
          </div>
          <div className="ai-insights-list">
            {insights.map((ins, i) => (
              <InsightCard key={i} insight={ins} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="ai-section">
          <div className="ai-section-header">
            <div className="ai-section-icon ai-section-icon--green">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <h2 className="ai-section-title">Рекомендации</h2>
            <span className="ai-section-badge ai-section-badge--green">{recommendations.length}</span>
          </div>
          <div className="ai-recs-list">
            {recommendations.map((rec, i) => (
              <RecommendationCard key={i} rec={rec} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Top categories */}
      {summary?.topCats?.length > 0 && (
        <section className="ai-section">
          <div className="ai-section-header">
            <div className="ai-section-icon ai-section-icon--orange">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <h2 className="ai-section-title">Топ категорий этого месяца</h2>
          </div>
          <TopCatsSection cats={summary.topCats} total={summary.thisTotal} />
        </section>
      )}

      {/* Forecast */}
      {forecast && (
        <section className="ai-section">
          <div className="ai-section-header">
            <div className="ai-section-icon ai-section-icon--purple">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <h2 className="ai-section-title">Финансовый прогноз</h2>
          </div>
          <ForecastSection forecast={forecast} />
        </section>
      )}
    </div>
  )
}
