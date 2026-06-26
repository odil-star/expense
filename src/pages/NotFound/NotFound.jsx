import { Link } from 'react-router'
import './NotFound.css'

export default function NotFound() {
  return (
    <div className="not-found-wrap">
      <div className="not-found-code">404</div>
      <h1 className="not-found-title">Страница не найдена</h1>
      <p className="not-found-sub">Запрошенная страница не существует или была удалена.</p>
      <Link to="/" className="btn-primary" style={{ marginTop: 24, textDecoration: 'none', display: 'inline-flex' }}>
        ← На главную
      </Link>
    </div>
  )
}
