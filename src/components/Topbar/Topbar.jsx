import { useLocation } from 'react-router'
import './Topbar.css'

const PAGE_META = {
  '/':          { title: 'Дашборд',        sub: 'Учёт личных расходов' },
  '/analytics': { title: 'Аналитика',       sub: 'Графики и топ категорий' },
  '/income':    { title: 'Доходы',          sub: 'Учёт входящих средств' },
  '/budget':    { title: 'Бюджеты',         sub: 'Лимиты расходов по категориям' },
  '/calendar':  { title: 'Календарь',       sub: 'Расходы по дням' },
  '/add':       { title: 'Добавить расход', sub: 'Заполните форму ниже' },
  '/expenses':  { title: 'Мои расходы',     sub: 'История всех записей' },
}

export default function Topbar({ onBurgerClick, burgerOpen }) {
  const { pathname } = useLocation()
  const meta = PAGE_META[pathname] || { title: 'Страница', sub: '' }

  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button
          className={`burger-btn${burgerOpen ? ' open' : ''}`}
          onClick={onBurgerClick}
          aria-label="Меню"
        >
          <span /><span /><span />
        </button>
        <div>
          <h1 className="topbar-title">{meta.title}</h1>
          <p className="topbar-sub">{meta.sub}</p>
        </div>
      </div>
      <div className="topbar-date">{today}</div>
    </div>
  )
}
