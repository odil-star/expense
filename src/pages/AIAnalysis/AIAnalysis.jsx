import { useState, useEffect, useCallback } from 'react'
import { useApiFetch } from '../../hooks/useApiFetch'
import { analyticsApi } from '../../services/analyticsApi'
import SmartForecast from '../../components/SmartForecast/SmartForecast'
import CategoryAnalysisCard from '../../components/CategoryAnalysisCard/CategoryAnalysisCard'
import AnomalyAlert from '../../components/AnomalyAlert/AnomalyAlert'
import SavingsTimeline from '../../components/SavingsTimeline/SavingsTimeline'
import SmartRecommendations from '../../components/SmartRecommendations/SmartRecommendations'
import './AIAnalysis.css'

export default function AIAnalysis() {
  const apiFetch = useApiFetch()

  const [forecast,    setForecast]    = useState(null)
  const [categories,  setCategories]  = useState([])
  const [anomalies,   setAnomalies]   = useState([])
  const [timeline,    setTimeline]    = useState([])
  const [recs,        setRecs]        = useState([])

  const [loadingF,  setLoadingF]  = useState(true)
  const [loadingC,  setLoadingC]  = useState(true)
  const [loadingA,  setLoadingA]  = useState(true)
  const [loadingT,  setLoadingT]  = useState(true)
  const [loadingR,  setLoadingR]  = useState(true)

  const [lastRun, setLastRun] = useState(null)
  const [error,   setError]   = useState(null)

  const load = useCallback(async () => {
    setLoadingF(true); setLoadingC(true); setLoadingA(true)
    setLoadingT(true); setLoadingR(true)
    setError(null)

    try {
      const [f, c, a, t, r] = await Promise.all([
        analyticsApi.getForecast(apiFetch),
        analyticsApi.getCategories(apiFetch),
        analyticsApi.getAnomalies(apiFetch),
        analyticsApi.getSavingsTimeline(apiFetch, 6),
        analyticsApi.getRecommendations(apiFetch),
      ])

      setForecast(f);   setLoadingF(false)
      setCategories(c); setLoadingC(false)
      setAnomalies(a);  setLoadingA(false)
      setTimeline(t);   setLoadingT(false)
      setRecs(r);       setLoadingR(false)
      setLastRun(new Date())
    } catch {
      setError('Не удалось загрузить аналитику. Попробуйте обновить страницу.')
    } finally {
      setLoadingF(false); setLoadingC(false); setLoadingA(false)
      setLoadingT(false); setLoadingR(false)
    }
  }, [apiFetch])

  useEffect(() => { load() }, [load])

  const anyLoading = loadingF || loadingC || loadingA || loadingT || loadingR

  function handleDismiss(id) {
    setAnomalies(prev => prev.filter(a => (a.id ?? a.expense_id) !== id))
  }

  return (
    <div className="ai-page">
      {/* Page header */}
      <div className="ai-page-header">
        <div className="ai-page-title-wrap">
          <div className="ai-page-brain-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
            </svg>
          </div>
          <div>
            <h1 className="ai-page-title">Умная аналитика</h1>
            <p className="ai-page-sub">
              {lastRun
                ? `Обновлено: ${lastRun.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
                : 'Персонализированный анализ · самообучение по вашим оценкам'
              }
            </p>
          </div>
        </div>

        <button
          className={`ai-refresh-btn${anyLoading ? ' ai-refresh-btn--spinning' : ''}`}
          onClick={load}
          disabled={anyLoading}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round"
               className="ai-refresh-icon">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          {anyLoading ? 'Анализ…' : 'Обновить'}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="card" style={{ marginBottom: 16, color: 'var(--danger, #ef4444)', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* Forecast + Anomalies — top row */}
      <div className="ai-two-col">
        <SmartForecast data={forecast} loading={loadingF} />
        <AnomalyAlert anomalies={anomalies} loading={loadingA} onDismiss={handleDismiss} />
      </div>

      {/* Category analysis */}
      <CategoryAnalysisCard categories={categories} loading={loadingC} />

      {/* Savings timeline */}
      <SavingsTimeline timeline={timeline} loading={loadingT} />

      {/* Recommendations */}
      <SmartRecommendations recommendations={recs} loading={loadingR} />
    </div>
  )
}
