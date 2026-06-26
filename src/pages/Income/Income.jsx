import { useState, useEffect } from 'react'
import { useApiFetch } from '../../hooks/useApiFetch'
import { safeJson } from '../../utils/safeJson'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'
import { INCOME_CATS } from '../../constants/categories'
import AmountInput from '../../components/AmountInput/AmountInput'
import CategorySelect from '../../components/CategorySelect/CategorySelect'
import ExpenseItem from '../../components/ExpenseItem/ExpenseItem'
import { parseAmount } from '../../utils/format'
import './Income.css'

export default function Income() {
  const apiFetch = useApiFetch()
  const { showToast }   = useToast()
  const { showConfirm } = useConfirm()

  const [incomes,  setIncomes]  = useState([])
  const [total,    setTotal]    = useState(0)
  const [count,    setCount]    = useState(0)
  const [title,    setTitle]    = useState('')
  const [amount,   setAmount]   = useState('')
  const [category, setCategory] = useState('salary')
  const [note,     setNote]     = useState('')
  const [error,    setError]    = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const res = await apiFetch('/incomes/')
      if (!res || !res.ok) return
      const data = await safeJson(res)
      if (!data) return
      setIncomes(data.incomes || [])
      setTotal(data.total || 0)
      setCount(data.count  || 0)
      localStorage.setItem('totalIncome', data.total || 0)
    } catch {
      // silently keep previous state on transient errors
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    const amt = parseAmount(amount)
    if (!title || !amt) { setError('Введите название и сумму'); return }
    const res = await apiFetch('/incomes/', {
      method: 'POST',
      body: JSON.stringify({ title, amount: amt, category, note }),
    })
    if (!res) return
    if (!res.ok) {
      const d = await safeJson(res)
      setError(d ? Object.values(d).flat().join(' ') : `Ошибка сервера (${res.status})`)
      return
    }
    setTitle(''); setAmount(''); setNote('')
    showToast('Доход добавлен')
    load()
  }

  function handleDelete(id) {
    showConfirm('Доход будет удалён безвозвратно', async () => {
      await apiFetch(`/incomes/${id}/`, { method: 'DELETE' })
      showToast('Доход удалён', 'info')
      load()
    })
  }

  const spent = parseFloat(localStorage.getItem('totalSpent')) || 0
  const net   = total - spent

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Добавить доход</span>
          </div>
          <form onSubmit={handleAdd}>
            <div className="field">
              <label>Название</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Зарплата за март" />
            </div>
            <div className="field">
              <label>Сумма</label>
              <AmountInput value={amount} onChange={setAmount} placeholder="0" />
            </div>
            <div className="field">
              <label>Категория</label>
              <CategorySelect value={category} onChange={setCategory} options={INCOME_CATS} />
            </div>
            <div className="field">
              <label>Заметка</label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Необязательно" />
            </div>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn-income w-full">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Добавить доход
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Доходы</span>
            <span className="badge badge--green">{count}</span>
          </div>
          <div className="income-summary">
            <div className="income-sum-item">
              <p className="income-sum-label">Всего доходов</p>
              <p className="income-sum-val income-sum-val--pos">{Number(total).toLocaleString('ru')} сум</p>
            </div>
            <div className="income-sum-item">
              <p className="income-sum-label">Чистый доход</p>
              <p className={`income-sum-val ${net >= 0 ? 'income-sum-val--pos' : 'income-sum-val--neg'}`}>
                {net.toLocaleString('ru')} сум
              </p>
            </div>
          </div>
          {incomes.length === 0 ? (
            <p className="empty-text">Доходов пока нет</p>
          ) : (
            incomes.map(inc => (
              <ExpenseItem key={inc.id} expense={inc} onDelete={handleDelete} isIncome />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
