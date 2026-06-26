import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { useApiFetch } from '../../hooks/useApiFetch'
import { safeJson } from '../../utils/safeJson'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'
import { EXPENSE_CATS, CAT_LABELS } from '../../constants/categories'
import CategorySelect from '../../components/CategorySelect/CategorySelect'
import ExpenseItem from '../../components/ExpenseItem/ExpenseItem'
import { formatDate } from '../../utils/format'
import ExportPDFButton from '../../components/ExportPDFButton/ExportPDFButton'
import './ExpenseList.css'

const ALL_CATS = [{ value: '', label: 'Все категории' }, ...EXPENSE_CATS]

function exportCSV(expenses) {
  const bom  = '﻿'
  const hdr  = ['ID', 'Название', 'Сумма', 'Категория', 'Заметка', 'Дата']
  const rows = expenses.map(e => [
    e.id,
    `"${String(e.title).replace(/"/g, '""')}"`,
    e.amount,
    `"${CAT_LABELS[e.category] || e.category}"`,
    `"${String(e.note || '').replace(/"/g, '""')}"`,
    formatDate(e.created_at),
  ])
  const csv  = bom + [hdr, ...rows].map(r => r.join(',')).join('\n')
  const a    = Object.assign(document.createElement('a'), {
    href:     URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })),
    download: `expenses_${new Date().toISOString().split('T')[0]}.csv`,
  })
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
}

export default function ExpenseList() {
  const apiFetch = useApiFetch()
  const { showToast }   = useToast()
  const { showConfirm } = useConfirm()
  const [searchParams, setSearchParams] = useSearchParams()

  const [expenses, setExpenses] = useState([])
  const [stats,    setStats]    = useState({ count: 0, total: 0 })
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => { load() }, [category, dateFrom, dateTo])

  useEffect(() => {
    const cat = searchParams.get('category') || ''
    if (cat !== category) setCategory(cat)
  }, [searchParams])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (category) params.set('category',  category)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo)   params.set('date_to',   dateTo)
      const res = await apiFetch(`/expenses/?${params}`)
      if (!res || !res.ok) { setError('Не удалось загрузить расходы'); return }
      const data = await safeJson(res)
      if (!data) { setError('Сервер вернул пустой ответ'); return }
      setExpenses(data.expenses || [])
      setStats({ count: data.count, total: data.total })
      localStorage.setItem('totalSpent', data.total || 0)
    } catch {
      setError('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  function handleDelete(id) {
    showConfirm('Расход будет удалён безвозвратно', async () => {
      await apiFetch(`/expenses/${id}/`, { method: 'DELETE' })
      showToast('Расход удалён', 'info')
      load()
    })
  }

  function clearFilters() {
    setSearch(''); setCategory(''); setDateFrom(''); setDateTo('')
    setSearchParams({})
  }

  function handleCategoryChange(val) {
    setCategory(val)
    if (val) setSearchParams({ category: val })
    else setSearchParams({})
  }

  const filtered = search
    ? expenses.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.note && e.note.toLowerCase().includes(search.toLowerCase()))
      )
    : expenses

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="search-wrap">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по названию или заметке..."
        />
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 180px', minWidth: 160 }}>
          <CategorySelect value={category} onChange={handleCategoryChange} options={ALL_CATS} />
        </div>
        <div className={`date-field${dateFrom ? ' has-value' : ''}`} style={{ flex: '1 1 160px', minWidth: 140 }}>
          <svg className="date-field-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          {dateFrom && (
            <button className="date-field-clear" onClick={() => setDateFrom('')} aria-label="Сбросить дату от">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
        <div className={`date-field${dateTo ? ' has-value' : ''}`} style={{ flex: '1 1 160px', minWidth: 140 }}>
          <svg className="date-field-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          {dateTo && (
            <button className="date-field-clear" onClick={() => setDateTo('')} aria-label="Сбросить дату до">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
        <button className="btn-ghost" onClick={clearFilters}>Сбросить</button>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            Расходы
            <span className="badge" style={{ marginLeft: 8 }}>{filtered.length}</span>
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.83rem', color: 'var(--text-3)', alignSelf: 'center' }}>
              {Number(stats.total).toLocaleString('ru')} сум
            </span>
            <button className="btn-ghost" onClick={() => exportCSV(filtered)}>
              ↓ CSV
            </button>
            <ExportPDFButton
              expenses={filtered}
              totalExpenses={stats.total}
              totalIncome={parseFloat(localStorage.getItem('totalIncome')) || 0}
              dateLabel={
                dateFrom || dateTo
                  ? `${dateFrom || '…'} — ${dateTo || '…'}`
                  : category
                    ? CAT_LABELS[category]
                    : ''
              }
            />
          </div>
        </div>
        {loading ? (
          <p className="empty-text">Загрузка...</p>
        ) : error ? (
          <p className="empty-text" style={{ color: 'var(--danger, #ef4444)' }}>{error}</p>
        ) : filtered.length === 0 ? (
          <p className="empty-text">{search ? 'Ничего не найдено' : 'Расходов пока нет'}</p>
        ) : (
          filtered.map(e => (
            <ExpenseItem key={e.id} expense={e} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  )
}
