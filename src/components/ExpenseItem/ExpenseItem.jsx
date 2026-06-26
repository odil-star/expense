import { CAT_LABELS } from '../../constants/categories'
import { formatDate } from '../../utils/format'
import './ExpenseItem.css'

export default function ExpenseItem({ expense, onDelete, isIncome = false }) {
  const { id, title, amount, category, note, created_at } = expense
  const labels = CAT_LABELS
  const catLabel = labels[category] || category

  return (
    <div className="expense-item">
      <div className={`expense-icon${isIncome ? ' income-icon-wrap' : ''}`}>
        <svg width="18" height="18">
          <use href={`#icon-${category || 'other'}`} />
        </svg>
      </div>
      <div className="expense-info">
        <p className="expense-title">{title}</p>
        <p className="expense-meta">
          {catLabel} · {formatDate(created_at)}
          {note ? ` · ${note}` : ''}
        </p>
      </div>
      <p className={`expense-amount${isIncome ? ' income-amount' : ''}`}>
        {isIncome ? '+' : ''}{Number(amount).toLocaleString('ru')} сум
      </p>
      {onDelete && (
        <button className="btn-delete" onClick={() => onDelete(id)} title="Удалить">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  )
}
