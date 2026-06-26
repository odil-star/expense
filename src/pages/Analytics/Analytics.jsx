import { useState, useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'
import { useApiFetch } from '../../hooks/useApiFetch'
import { safeJson } from '../../utils/safeJson'
import { CAT_LABELS, CAT_COLORS } from '../../constants/categories'
import './Analytics.css'

export default function Analytics() {
  const apiFetch = useApiFetch()
  const [period,   setPeriod]   = useState(30)
  const [expenses, setExpenses] = useState([])
  const [error,    setError]    = useState(null)
  const dailyRef  = useRef(null)
  const catRef    = useRef(null)
  const dailyChart = useRef(null)
  const catChart   = useRef(null)

  useEffect(() => { load() }, [])

  useEffect(() => {
    renderDailyChart(expenses)
    renderCategoryChart(expenses)
  }, [expenses, period])

  useEffect(() => {
    return () => {
      dailyChart.current?.destroy()
      catChart.current?.destroy()
    }
  }, [])

  async function load() {
    setError(null)
    try {
      const res = await apiFetch('/expenses/')
      if (!res || !res.ok) { setError('Не удалось загрузить данные'); return }
      const data = await safeJson(res)
      if (!data) { setError('Сервер вернул пустой ответ'); return }
      setExpenses(data.expenses || [])
    } catch {
      setError('Ошибка загрузки данных')
    }
  }

  function renderDailyChart(all) {
    const days = {}
    const today = new Date()
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      days[d.toISOString().split('T')[0]] = 0
    }
    all.forEach(e => {
      const key = e.created_at.split('T')[0]
      if (key in days) days[key] += parseFloat(e.amount)
    })

    const labels = Object.keys(days).map(d =>
      new Date(d + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    )

    if (!dailyRef.current) return
    dailyChart.current?.destroy()
    dailyChart.current = new Chart(dailyRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: Object.values(days),
          backgroundColor: 'rgba(124,58,237,.45)',
          borderColor: '#7c3aed',
          borderWidth: 0,
          borderRadius: 5,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: c => ' ' + c.parsed.y.toLocaleString('ru') + ' сум' } },
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#4a4a66', maxTicksLimit: period <= 7 ? 7 : 10 } },
          y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#4a4a66', callback: v => v >= 1000 ? (v/1000).toFixed(0)+'k' : v } },
        },
      },
    })
  }

  function renderCategoryChart(all) {
    const totals = {}
    all.forEach(e => { totals[e.category] = (totals[e.category] || 0) + parseFloat(e.amount) })
    if (!catRef.current) return
    catChart.current?.destroy()
    if (!Object.keys(totals).length) return
    const keys   = Object.keys(totals)
    catChart.current = new Chart(catRef.current, {
      type: 'doughnut',
      data: {
        labels:   keys.map(k => CAT_LABELS[k] || k),
        datasets: [{
          data:            keys.map(k => totals[k]),
          backgroundColor: keys.map(k => (CAT_COLORS[k] || '#94a3b8') + 'bb'),
          borderColor:     '#111118',
          borderWidth:     3,
          hoverOffset:     8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'right', labels: { color: '#8888aa', padding: 14, font: { size: 12, family: 'Inter' }, usePointStyle: true, pointStyleWidth: 10 } },
          tooltip: { callbacks: { label: c => ' ' + c.parsed.toLocaleString('ru') + ' сум' } },
        },
      },
    })
  }

  const totals = {}
  let grand = 0
  expenses.forEach(e => {
    const a = parseFloat(e.amount)
    totals[e.category] = (totals[e.category] || 0) + a
    grand += a
  })
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="period-bar">
        <span className="period-label">Период:</span>
        {[7, 30, 90].map(d => (
          <button
            key={d}
            className={`period-btn${period === d ? ' active' : ''}`}
            onClick={() => setPeriod(d)}
          >
            {d} дней
          </button>
        ))}
      </div>

      {error && (
        <div className="card" style={{ padding: '16px 20px', color: 'var(--danger, #ef4444)', fontSize: '.875rem' }}>
          {error}
        </div>
      )}

      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Расходы по дням</span>
          </div>
          <div className="chart-wrap">
            <canvas ref={dailyRef} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">По категориям</span>
          </div>
          <div className="chart-wrap">
            <canvas ref={catRef} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Топ категорий</span>
        </div>
        {sorted.length === 0 ? (
          <p className="empty-text">Нет данных</p>
        ) : sorted.map(([cat, amt], i) => {
          const pct   = grand > 0 ? Math.round((amt / grand) * 100) : 0
          const color = CAT_COLORS[cat] || '#94a3b8'
          return (
            <div key={cat} className="top-cat-item">
              <span className="top-cat-rank">{i + 1}</span>
              <div className={`top-cat-icon ${cat}-icon`}>
                <svg width="15" height="15"><use href={`#icon-${cat}`} /></svg>
              </div>
              <div className="top-cat-body">
                <div className="top-cat-row">
                  <span className="top-cat-name">{CAT_LABELS[cat] || cat}</span>
                  <span className="top-cat-amt">{amt.toLocaleString('ru')} сум</span>
                </div>
                <div className="top-cat-bar-wrap">
                  <div className="top-cat-bar-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
              <span className="top-cat-pct">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
