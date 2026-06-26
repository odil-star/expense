import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import './SavingsTimeline.css'

Chart.register(...registerables)

const CHART_COLORS = {
  income:   'rgba(34,197,94,.8)',
  expenses: 'rgba(239,68,68,.8)',
  savings:  'rgba(124,58,237,.9)',
  incomeBg: 'rgba(34,197,94,.08)',
  expBg:    'rgba(239,68,68,.08)',
  savingsBg:'rgba(124,58,237,.08)',
}

export default function SavingsTimeline({ timeline = [], loading }) {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !timeline.length) return

    chartRef.current?.destroy()

    const labels   = timeline.map(t => t.period_label)
    const incomes  = timeline.map(t => t.income)
    const expenses = timeline.map(t => t.expenses)
    const savings  = timeline.map(t => t.savings)

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type:            'line',
            label:           'Экономия',
            data:            savings,
            borderColor:     CHART_COLORS.savings,
            backgroundColor: CHART_COLORS.savingsBg,
            borderWidth:     2.5,
            pointRadius:     5,
            pointBackgroundColor: CHART_COLORS.savings,
            fill:            true,
            tension:         0.35,
            yAxisID:         'y',
            order:           1,
          },
          {
            label:           'Доходы',
            data:            incomes,
            backgroundColor: CHART_COLORS.incomeBg,
            borderColor:     CHART_COLORS.income,
            borderWidth:     1.5,
            borderRadius:    6,
            yAxisID:         'y',
            order:           2,
          },
          {
            label:           'Расходы',
            data:            expenses,
            backgroundColor: CHART_COLORS.expBg,
            borderColor:     CHART_COLORS.expenses,
            borderWidth:     1.5,
            borderRadius:    6,
            yAxisID:         'y',
            order:           3,
          },
        ],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color:   '#8888aa',
              font:    { size: 11, family: 'Inter' },
              padding: 16,
              usePointStyle: true,
              pointStyleWidth: 8,
            },
          },
          tooltip: {
            backgroundColor: '#1a1a24',
            borderColor:     '#2a2a38',
            borderWidth:     1,
            titleColor:      '#f0f0f8',
            bodyColor:       '#8888aa',
            padding:         12,
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${Number(ctx.parsed.y).toLocaleString('ru')} сум`,
            },
          },
        },
        scales: {
          x: {
            grid:   { color: 'rgba(255,255,255,.04)' },
            ticks:  { color: '#4a4a66', font: { size: 11 } },
          },
          y: {
            grid:   { color: 'rgba(255,255,255,.04)' },
            ticks:  {
              color: '#4a4a66',
              font:  { size: 10 },
              callback: v => `${Number(v).toLocaleString('ru')}`,
            },
          },
        },
        animation: { duration: 700, easing: 'easeInOutQuart' },
      },
    })

    return () => chartRef.current?.destroy()
  }, [timeline])

  if (loading) return (
    <div className="savings-tl card savings-tl-skeleton">
      <div className="stl-skel-bar" />
      <div className="stl-skel-chart" />
    </div>
  )

  const hasSavings = timeline.some(t => t.income > 0 || t.expenses > 0)

  return (
    <div className="savings-tl card">
      <div className="card-header" style={{ marginBottom: 8 }}>
        <span className="card-title">Динамика сбережений</span>
        <span style={{ fontSize: '.72rem', color: 'var(--text-3)' }}>
          Последние {timeline.length} мес.
        </span>
      </div>

      {/* Summary strip */}
      {timeline.length > 0 && (
        <div className="stl-summary">
          {timeline.slice(-3).map(t => (
            <div key={t.period} className={`stl-sum-item${t.is_current ? ' stl-sum-item--current' : ''}`}>
              <p className="stl-sum-period">{t.period_label}</p>
              <p className={`stl-sum-savings ${t.savings >= 0 ? 'stl-pos' : 'stl-neg'}`}>
                {t.savings >= 0 ? '+' : ''}{Number(t.savings).toLocaleString('ru')} сум
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="stl-chart-wrap">
        {!hasSavings ? (
          <p className="empty-text">Добавьте доходы для отображения динамики</p>
        ) : (
          <canvas ref={canvasRef} />
        )}
      </div>
    </div>
  )
}
