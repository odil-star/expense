import { useState } from 'react'
import { Link } from 'react-router'
import { useApiFetch } from '../../hooks/useApiFetch'
import { analyticsApi } from '../../services/analyticsApi'
import { useToast } from '../../context/ToastContext'
import './SmartRecommendations.css'

const PRIORITY_MAP = {
  high:   { label: 'Важно',   color: '#ef4444' },
  medium: { label: 'Средний', color: '#f59e0b' },
  low:    { label: 'Совет',   color: '#22c55e' },
}

function RecIcon({ type }) {
  if (type === 'reduce_top_category') {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
      </svg>
    )
  }
  if (type?.startsWith('control_growth')) {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    )
  }
  if (type === 'anomaly_review') {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    )
  }
  if (type === 'diversify_spending') {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>
      </svg>
    )
  }
  if (type === 'increase_savings') {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    )
  }
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/>
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
    </svg>
  )
}

function RecommendationCard({ rec, index }) {
  const apiFetch      = useApiFetch()
  const { showToast } = useToast()
  const [vote, setVote] = useState(null)
  const [voting, setVoting] = useState(false)

  const prio  = PRIORITY_MAP[rec.priority] || PRIORITY_MAP.low
  const w     = rec.weight ?? 1.0
  const wNorm = Math.min(w, 2.0) / 2.0

  async function handleFeedback(rating) {
    if (vote !== null || voting) return
    setVoting(true)
    await analyticsApi.submitFeedback(apiFetch, {
      recommendation_type: rec.type,
      recommendation_text: rec.text,
      rating,
      context_data: { priority: rec.priority, category: rec.category },
    })
    setVote(rating)
    setVoting(false)
    showToast(rating === 1 ? 'Спасибо! Учтём совет' : 'Понятно, скорректируем', 'info')
  }

  return (
    <div
      className="sr-card"
      style={{
        animationDelay: `${index * 0.07}s`,
        borderLeftColor: prio.color,
      }}
    >
      <div className="sr-card-header">
        <span className="sr-icon" style={{ color: prio.color }}>
          <RecIcon type={rec.type} />
        </span>
        <div className="sr-meta">
          <span className="sr-priority" style={{ color: prio.color, background: `${prio.color}18` }}>
            {prio.label}
          </span>
          {w !== 1.0 && (
            <div className="sr-weight-bar" title={`Вес: ${w.toFixed(2)} (учёт вашей обратной связи)`}>
              <div className="sr-weight-fill" style={{ width: `${wNorm * 100}%`, background: prio.color }} />
            </div>
          )}
        </div>
      </div>

      <p className="sr-title">{rec.title}</p>
      <p className="sr-text">{rec.text}</p>

      {rec.potential_saving > 0 && (
        <div className="sr-saving-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          Экономия до {Number(rec.potential_saving).toLocaleString('ru')} сум/мес
        </div>
      )}

      <div className="sr-footer">
        {rec.link && (
          <Link to={rec.link} className="sr-action-link">
            {rec.action} →
          </Link>
        )}

        <div className="sr-vote-wrap">
          <span className="sr-vote-label">Полезно?</span>
          <button
            className={`sr-vote-btn${vote === 1 ? ' sr-vote-btn--active-up' : ''}`}
            onClick={() => handleFeedback(1)}
            disabled={vote !== null || voting}
            aria-label="Да, полезно"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
              <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
            </svg>
          </button>
          <button
            className={`sr-vote-btn${vote === -1 ? ' sr-vote-btn--active-down' : ''}`}
            onClick={() => handleFeedback(-1)}
            disabled={vote !== null || voting}
            aria-label="Нет, не полезно"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
              <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SmartRecommendations({ recommendations = [], loading }) {
  if (loading) return (
    <div className="sr-wrap card">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="sr-skel" style={{ animationDelay: `${i * .1}s` }} />
      ))}
    </div>
  )

  if (!recommendations.length) return (
    <div className="sr-wrap card sr-empty">
      <div className="sr-empty-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <p className="sr-empty-title">Всё под контролем!</p>
      <p className="sr-empty-sub">Новые рекомендации появятся с ростом истории расходов</p>
    </div>
  )

  return (
    <div className="sr-wrap card">
      <div className="card-header" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="card-title">Рекомендации</span>
          <span className="badge">{recommendations.length}</span>
        </div>
        <span style={{ fontSize: '.72rem', color: 'var(--text-3)' }}>
          Учитывает вашу обратную связь
        </span>
      </div>
      <div className="sr-list">
        {recommendations.map((rec, i) => (
          <RecommendationCard key={rec.type + i} rec={rec} index={i} />
        ))}
      </div>
    </div>
  )
}
