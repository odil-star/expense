export const EXPENSE_CATS = [
  { value: 'food',          label: 'Еда',           color: '#ef4444' },
  { value: 'transport',     label: 'Транспорт',     color: '#3b82f6' },
  { value: 'business',      label: 'Бизнес',        color: '#7c3aed' },
  { value: 'health',        label: 'Здоровье',      color: '#ec4899' },
  { value: 'education',     label: 'Образование',   color: '#eab308' },
  { value: 'entertainment', label: 'Развлечения',   color: '#f97316' },
  { value: 'shopping',      label: 'Покупки',       color: '#14b8a6' },
  { value: 'utilities',     label: 'Коммунальные',  color: '#22c55e' },
  { value: 'credit',        label: 'Кредит',        color: '#6366f1' },
  { value: 'other',         label: 'Другое',        color: '#94a3b8' },
]

export const INCOME_CATS = [
  { value: 'salary',     label: 'Зарплата',   color: '#22c55e' },
  { value: 'freelance',  label: 'Фриланс',    color: '#3b82f6' },
  { value: 'business',   label: 'Бизнес',     color: '#7c3aed' },
  { value: 'investment', label: 'Инвестиции', color: '#f59e0b' },
  { value: 'gift',       label: 'Подарок',    color: '#ec4899' },
  { value: 'other',      label: 'Другое',     color: '#94a3b8' },
]

export const CAT_LABELS = Object.fromEntries(
  [...EXPENSE_CATS, ...INCOME_CATS, { value: '', label: 'Все категории' }]
    .map(c => [c.value, c.label])
)

export const CAT_COLORS = Object.fromEntries(
  [...EXPENSE_CATS, ...INCOME_CATS, { value: '', color: '#7c3aed' }]
    .map(c => [c.value, c.color])
)

export const BUDGET_CATS = [
  'food','transport','business','health',
  'education','entertainment','shopping','utilities','credit','other',
]

export const CAL_MONTHS = [
  'Январь','Февраль','Март','Апрель','Май','Июнь',
  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь',
]
