import { useState } from 'react'
import { useApiFetch } from '../../hooks/useApiFetch'
import { analyticsApi } from '../../services/analyticsApi'
import './AnomalyAlert.css'

function AnomalyCard({ anomaly, onDismiss }) {
  const [dismissing, setDismissing] = useState(false)
  const [hidden,     setHidden]     = useState(false)

  const apiFetch = useApiFetch()

  async function handleDismiss() {
    setDismissing(true)
    await analyticsApi.dismissAnomaly(apiFetch, anomaly.id ?? anomaly.expense_id)
    setHidden(true)
    onDismiss?.(anomaly.expense_id)
  }

  if (hidden) return null

  const factor = anomaly.deviation_factor ?? 0
  const severity = factor > 4 ? 'critical' : factor > 2.5 ? 'high' : 'medium'
  const severityLabel = { critical: 'Критично', high: 'Высокий', medium: 'Средний' }
  const severityColor = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6' }
  const color = severityColor[severity]

  return (
    <div
      className="anomaly-card"
      style={{ '--anomaly-color': color, borderColor: `${color}33` }}
    >
      <div className="anomaly-severity" style={{ background: `${color}18`, color }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        {severityLabel[severity]}
      </div>

      <div className="anomaly-body">
        <div className="anomaly-title-row">
          <span className={`opt-icon ${anomaly.category}-icon anomaly-cat-icon`}>
            <svg width="13" height="13"><use href={`#icon-${anomaly.category}`} /></svg>
          </span>
          <p className="anomaly-title">{anomaly.title}</p>
          <p className="anomaly-date">{anomaly.date}</p>
        </div>

        <div className="anomaly-amounts">
          <div className="anomaly-amt-item anomaly-amt-item--actual">
            <span className="anomaly-amt-label">Сумма траты</span>
            <span className="anomaly-amt-val" style={{ color }}>
              {Number(anomaly.amount).toLocaleString('ru')} сум
            </span>
          </div>
          <div className="anomaly-sep">vs</div>
          <div className="anomaly-amt-item">
            <span className="anomaly-amt-label">Средняя трата</span>
            <span className="anomaly-amt-val">
              {Number(anomaly.avg_amount).toLocaleString('ru')} сум
            </span>
          </div>
          <div className="anomaly-factor-badge" style={{ background: `${color}18`, color }}>
            ×{factor.toFixed(1)} от нормы
          </div>
        </div>
      </div>

      <button
        className="anomaly-dismiss-btn"
        onClick={handleDismiss}
        disabled={dismissing}
        title="Отметить как нормальную"
      >
        {dismissing ? (
          <span className="anomaly-spinner" />
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Это нормально
          </>
        )}
      </button>
    </div>
  )
}

export default function AnomalyAlert({ anomalies = [], loading, onDismiss }) {
  if (loading) return (
    <div className="anomaly-wrap card">
      <div className="anomaly-skel-header" />
      <div className="anomaly-skel-row" />
      <div className="anomaly-skel-row" style={{ width: '80%' }} />
    </div>
  )

  if (!anomalies.length) return (
    <div className="anomaly-wrap card anomaly-all-clear">
      <div className="anomaly-clear-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <p className="anomaly-clear-title">Аномалий не обнаружено</p>
      <p className="anomaly-clear-sub">Все расходы в пределах нормы</p>
    </div>
  )

  return (
    <div className="anomaly-wrap card">
      <div className="card-header" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="card-title">Необычные траты</span>
          <span className="badge" style={{ background: 'rgba(239,68,68,.12)', color: '#ef4444' }}>
            {anomalies.length}
          </span>
        </div>
        <span style={{ fontSize: '.72rem', color: 'var(--text-3)' }}>Z-score ≥ 2σ</span>
      </div>
      <div className="anomaly-list">
        {anomalies.map((a, i) => (
          <AnomalyCard
            key={a.expense_id}
            anomaly={a}
            onDismiss={onDismiss}
            style={{ animationDelay: `${i * 0.07}s` }}
          />
        ))}
      </div>
    </div>
  )
}
