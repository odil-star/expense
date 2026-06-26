import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useApiFetch } from '../../hooks/useApiFetch'
import { safeJson } from '../../utils/safeJson'
import { useToast } from '../../context/ToastContext'
import { EXPENSE_CATS } from '../../constants/categories'
import AmountInput from '../../components/AmountInput/AmountInput'
import CategorySelect from '../../components/CategorySelect/CategorySelect'
import VoiceExpenseInput from '../../components/VoiceExpenseInput/VoiceExpenseInput'
import { parseAmount, formatAmount } from '../../utils/format'
import './AddExpense.css'

export default function AddExpense() {
  const apiFetch      = useApiFetch()
  const { showToast } = useToast()
  const navigate      = useNavigate()

  const [title,    setTitle]    = useState('')
  const [amount,   setAmount]   = useState('')
  const [category, setCategory] = useState('food')
  const [note,     setNote]     = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  function handleVoiceResult({ title: t, amount: a, category: c }) {
    if (t) setTitle(t)
    if (a) setAmount(formatAmount(a))
    if (c) setCategory(c)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const amt = parseAmount(amount)
    if (!title || !amt) { setError('Введите название и сумму'); return }
    setLoading(true)
    const res = await apiFetch('/expenses/', {
      method: 'POST',
      body: JSON.stringify({ title, amount: amt, category, note }),
    })
    setLoading(false)
    if (!res) return
    if (!res.ok) {
      const d = await safeJson(res)
      setError(d ? Object.values(d).flat().join(' ') : `Ошибка сервера (${res.status})`)
      return
    }
    showToast('Расход добавлен')
    navigate('/expenses')
  }

  return (
    <div className="section-add">
      <div className="card" style={{ maxWidth: 540 }}>
        <div className="card-header">
          <span className="card-title">Новый расход</span>
          <VoiceExpenseInput onResult={handleVoiceResult} />
        </div>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Название</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Кофе, такси, продукты…"
              autoFocus
            />
          </div>
          <div className="field">
            <label>Сумма</label>
            <AmountInput value={amount} onChange={setAmount} placeholder="0" />
          </div>
          <div className="field">
            <label>Категория</label>
            <CategorySelect
              value={category}
              onChange={setCategory}
              options={EXPENSE_CATS}
              height={46}
            />
          </div>
          <div className="field">
            <label>Заметка</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Необязательно"
            />
          </div>
          {error && <p className="form-error" style={{ marginTop: 8 }}>{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {loading ? 'Сохранение…' : 'Добавить расход'}
          </button>
        </form>
      </div>
    </div>
  )
}
