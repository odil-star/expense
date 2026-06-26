import { useState, useEffect } from 'react'
import AmountInput from '../AmountInput/AmountInput'
import { parseAmount, formatAmount } from '../../utils/format'
import './BalanceCard.css'

export default function BalanceCard({ totalSpent }) {
  const [inputVal, setInputVal] = useState('')
  const [saved, setSaved]       = useState(false)

  const manualBalance = parseFloat(localStorage.getItem('userBalance')) || 0
  const totalIncome   = parseFloat(localStorage.getItem('totalIncome'))  || 0
  const balance = totalIncome > 0 ? totalIncome : manualBalance
  const left    = balance - (totalSpent || 0)
  const pct     = balance > 0 ? Math.round(((totalSpent || 0) / balance) * 100) : 0

  const handleSave = () => {
    const val = parseAmount(inputVal)
    if (!val) return
    localStorage.setItem('userBalance', val)
    setInputVal('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="balance-card">
      <div>
        <p className="balance-label">Баланс</p>
        <div className="balance-amount-row">
          <p className="balance-amount">{balance.toLocaleString('ru')} сум</p>
          {balance > 0 && (
            <span className={`balance-trend${pct <= 80 ? ' positive' : ''}`}>
              −{pct}%
            </span>
          )}
        </div>
        <p className="balance-sub">Текущий остаток</p>
      </div>
      <div>
        <AmountInput
          value={inputVal}
          onChange={setInputVal}
          placeholder="Введите баланс"
          className="balance-input-wrap"
        />
        <button
          className={`btn-set-balance${saved ? ' saved' : ''}`}
          onClick={handleSave}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {saved ? 'Сохранено' : 'Сохранить баланс'}
        </button>
        <div className="balance-stats">
          <div className="balance-stat">
            <span className="bs-dot bs-dot--red" />
            <span className="bs-label">Расходы</span>
            <span className="bs-val">{(totalSpent || 0).toLocaleString('ru')} сум</span>
          </div>
          <div className="balance-stat">
            <span className="bs-dot bs-dot--green" />
            <span className="bs-label">Остаток</span>
            <span className={`bs-val${left >= 0 ? ' bs-val--green' : ''}`}>
              {left.toLocaleString('ru')} сум
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
