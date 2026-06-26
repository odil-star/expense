import { useState } from 'react'
import { CAT_LABELS } from '../../constants/categories'
import { formatDate } from '../../utils/format'
import './ExportPDFButton.css'

function buildPDFTemplate({ expenses, totalIncome, totalExpenses, dateLabel }) {
  const balance  = totalIncome - totalExpenses
  const balColor = balance >= 0 ? '#16a34a' : '#ef4444'

  const rows = expenses.map((e, i) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#f8f8fc'}">
      <td style="padding:9px 12px;font-size:12px;color:#444;border-bottom:1px solid #eee;">
        ${formatDate(e.created_at)}
      </td>
      <td style="padding:9px 12px;font-size:12px;color:#444;border-bottom:1px solid #eee;">
        ${CAT_LABELS[e.category] || e.category}
      </td>
      <td style="padding:9px 12px;font-size:12px;color:#222;border-bottom:1px solid #eee;">
        ${e.title || '—'}${e.note ? `<br><span style="font-size:10px;color:#888">${e.note}</span>` : ''}
      </td>
      <td style="padding:9px 12px;font-size:12px;font-weight:700;text-align:right;color:#1a1a2e;border-bottom:1px solid #eee;">
        ${Number(e.amount).toLocaleString('ru')} сум
      </td>
    </tr>
  `).join('')

  return `
    <div style="width:780px;font-family:Arial,Helvetica,sans-serif;background:#fff;color:#1a1a2e;padding:40px;box-sizing:border-box;">
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #7c3aed;">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <div style="width:28px;height:28px;background:#7c3aed;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;">
              <span style="color:#fff;font-size:14px;font-weight:900;">₽</span>
            </div>
            <span style="font-size:20px;font-weight:900;color:#7c3aed;">Финансовый отчёт</span>
          </div>
          <p style="font-size:12px;color:#888;margin:0;">Отчёт о расходах и доходах</p>
        </div>
        <div style="text-align:right;">
          <p style="font-size:11px;color:#888;margin:0 0 2px;">Дата формирования</p>
          <p style="font-size:13px;font-weight:700;color:#1a1a2e;margin:0;">${new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})}</p>
          ${dateLabel ? `<p style="font-size:11px;color:#888;margin:4px 0 0;">Период: ${dateLabel}</p>` : ''}
        </div>
      </div>

      <!-- Summary -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:32px;">
        <div style="background:#f5f0ff;border-radius:12px;padding:16px;">
          <p style="font-size:10px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:.05em;margin:0 0 6px;">Расходы</p>
          <p style="font-size:18px;font-weight:900;color:#1a1a2e;margin:0;">${Number(totalExpenses).toLocaleString('ru')} сум</p>
          <p style="font-size:10px;color:#888;margin:4px 0 0;">${expenses.length} транзакций</p>
        </div>
        <div style="background:#f0fdf4;border-radius:12px;padding:16px;">
          <p style="font-size:10px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:.05em;margin:0 0 6px;">Доходы</p>
          <p style="font-size:18px;font-weight:900;color:#1a1a2e;margin:0;">${Number(totalIncome).toLocaleString('ru')} сум</p>
        </div>
        <div style="background:${balance>=0?'#f0fdf4':'#fff5f5'};border-radius:12px;padding:16px;">
          <p style="font-size:10px;font-weight:700;color:${balColor};text-transform:uppercase;letter-spacing:.05em;margin:0 0 6px;">Остаток</p>
          <p style="font-size:18px;font-weight:900;color:${balColor};margin:0;">${Number(balance).toLocaleString('ru')} сум</p>
        </div>
      </div>

      <!-- Table -->
      <h3 style="font-size:14px;font-weight:700;color:#1a1a2e;margin:0 0 14px;">Список расходов</h3>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#7c3aed;">
            <th style="padding:11px 12px;text-align:left;font-size:11px;font-weight:700;color:#fff;letter-spacing:.04em;">ДАТА</th>
            <th style="padding:11px 12px;text-align:left;font-size:11px;font-weight:700;color:#fff;letter-spacing:.04em;">КАТЕГОРИЯ</th>
            <th style="padding:11px 12px;text-align:left;font-size:11px;font-weight:700;color:#fff;letter-spacing:.04em;">ОПИСАНИЕ</th>
            <th style="padding:11px 12px;text-align:right;font-size:11px;font-weight:700;color:#fff;letter-spacing:.04em;">СУММА</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr style="background:#f5f0ff;">
            <td colspan="3" style="padding:12px;font-size:13px;font-weight:700;color:#7c3aed;">Итого расходов</td>
            <td style="padding:12px;text-align:right;font-size:14px;font-weight:900;color:#7c3aed;">
              ${Number(totalExpenses).toLocaleString('ru')} сум
            </td>
          </tr>
        </tfoot>
      </table>

      <!-- Footer -->
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
        <p style="font-size:10px;color:#aaa;margin:0;">Сформировано приложением «Расходы»</p>
        <p style="font-size:10px;color:#aaa;margin:0;">${new Date().toLocaleTimeString('ru-RU')}</p>
      </div>
    </div>
  `
}

export default function ExportPDFButton({ expenses = [], totalIncome = 0, totalExpenses = 0, dateLabel = '' }) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    if (loading || expenses.length === 0) return
    setLoading(true)

    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])

      const container = document.createElement('div')
      container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;'
      container.innerHTML = buildPDFTemplate({ expenses, totalIncome, totalExpenses, dateLabel })
      document.body.appendChild(container)

      const canvas = await html2canvas(container.firstElementChild, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      })
      document.body.removeChild(container)

      const imgData   = canvas.toDataURL('image/png')
      const doc       = new jsPDF('p', 'mm', 'a4')
      const pageW     = doc.internal.pageSize.getWidth()
      const pageH     = doc.internal.pageSize.getHeight()
      const imgH      = (canvas.height * pageW) / canvas.width

      let y = 0
      let remaining = imgH

      doc.addImage(imgData, 'PNG', 0, y, pageW, imgH)
      remaining -= pageH

      while (remaining > 0) {
        y -= pageH
        doc.addPage()
        doc.addImage(imgData, 'PNG', 0, y, pageW, imgH)
        remaining -= pageH
      }

      const filename = `expenses_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(filename)
    } catch (err) {
      console.error('PDF export failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      className={`export-pdf-btn${loading ? ' export-pdf-btn--loading' : ''}`}
      onClick={handleExport}
      disabled={loading || expenses.length === 0}
      title="Экспорт в PDF"
    >
      {loading ? (
        <span className="export-pdf-spinner" />
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
      )}
      {loading ? 'Генерация…' : '↓ PDF'}
    </button>
  )
}
