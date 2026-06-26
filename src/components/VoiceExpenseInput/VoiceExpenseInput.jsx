import { useState, useRef, useCallback } from 'react'
import { CAT_LABELS, EXPENSE_CATS } from '../../constants/categories'
import './VoiceExpenseInput.css'

const CATEGORY_KEYWORDS = {
  food:          ['еда', 'продукты', 'ресторан', 'кафе', 'обед', 'завтрак', 'ужин', 'кофе', 'пицца', 'суши', 'перекус', 'фрукт', 'овощ', 'хлеб', 'мясо', 'молоко'],
  transport:     ['такси', 'транспорт', 'автобус', 'метро', 'бензин', 'парковка', 'машина', 'uber', 'яндекс', 'заправка', 'дорога', 'билет', 'поезд', 'самолёт'],
  shopping:      ['покупка', 'одежда', 'обувь', 'маркет', 'торговый', 'магазин', 'шоппинг'],
  entertainment: ['кино', 'развлечения', 'игры', 'концерт', 'театр', 'клуб', 'бар', 'netflix', 'spotify', 'гулять', 'отдых'],
  health:        ['аптека', 'врач', 'лекарство', 'медицина', 'больница', 'здоровье', 'витамин', 'таблетка', 'анализ'],
  education:     ['книга', 'курс', 'обучение', 'учёба', 'школа', 'университет', 'урок', 'учебник'],
  utilities:     ['свет', 'вода', 'газ', 'интернет', 'телефон', 'коммунальные', 'счёт', 'квитанция'],
  business:      ['бизнес', 'офис', 'реклама', 'работа', 'канцелярия', 'принтер', 'оборудование'],
}

const STOP_WORDS = new Set([
  'потратил', 'потратила', 'купил', 'купила', 'заплатил', 'заплатила',
  'оплатил', 'оплатила', 'истратил', 'потрачено', 'на', 'за', 'в', 'по',
  'сум', 'рублей', 'руб', 'тысяч', 'тысячи', 'тыс', 'долларов', 'и',
])

function parseVoiceText(text) {
  const lower = text.toLowerCase().trim()

  // Extract all numbers (may have spaces inside: "50 000")
  const numMatches = lower.match(/\d[\d\s]*/g) || []
  const numbers    = numMatches.map(n => parseFloat(n.replace(/\s/g, ''))).filter(Boolean)
  const amount     = numbers.length > 0 ? Math.max(...numbers) : 0

  // Detect category by keyword match
  let category = 'other'
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      category = cat
      break
    }
  }

  // Build title: words that aren't numbers or stop words
  const words = text
    .split(/\s+/)
    .filter(w => !w.match(/^\d/) && !STOP_WORDS.has(w.toLowerCase()))
  const title = words.join(' ').trim() || CAT_LABELS[category]

  return { amount, category, title: title.charAt(0).toUpperCase() + title.slice(1) }
}

const SUPPORTED = typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

export default function VoiceExpenseInput({ onResult }) {
  const [status,   setStatus]   = useState('idle')   // idle | listening | preview | error
  const [transcript, setTranscript] = useState('')
  const [parsed,   setParsed]   = useState(null)
  const recognRef  = useRef(null)

  const startListening = useCallback(() => {
    if (!SUPPORTED) { setStatus('error'); return }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'ru-RU'
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onstart  = () => setStatus('listening')
    rec.onerror  = () => { setStatus('error'); recognRef.current = null }
    rec.onend    = () => {
      if (status !== 'preview') setStatus('idle')
      recognRef.current = null
    }

    rec.onresult = (e) => {
      const text = Array.from(e.results)
        .map(r => r[0].transcript)
        .join(' ')
      setTranscript(text)
      if (e.results[e.results.length - 1].isFinal) {
        const result = parseVoiceText(text)
        setParsed(result)
        setStatus('preview')
        recognRef.current = null
      }
    }

    recognRef.current = rec
    rec.start()
  }, [status])

  const stopListening = () => {
    recognRef.current?.stop()
    setStatus('idle')
  }

  const handleConfirm = () => {
    if (!parsed) return
    onResult(parsed)
    setStatus('idle')
    setTranscript('')
    setParsed(null)
  }

  const handleCancel = () => {
    setStatus('idle')
    setTranscript('')
    setParsed(null)
  }

  if (!SUPPORTED) return (
    <div className="voice-unsupported" title="Браузер не поддерживает голосовой ввод">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="1" y1="1" x2="23" y2="23"/>
        <path d="M9 9v3a3 3 0 0 0 5.12 2.12"/>
        <path d="M15 9.34V4a3 3 0 0 0-5.94-.6"/>
        <path d="M17 16.95A7 7 0 0 1 5 12v-2"/>
        <path d="M19 12v2a7 7 0 0 1-.11 1.23"/>
        <line x1="12" y1="19" x2="12" y2="22"/>
      </svg>
    </div>
  )

  return (
    <div className="voice-wrap">
      {/* Trigger button */}
      <button
        type="button"
        className={`voice-btn${status === 'listening' ? ' voice-btn--active' : ''}`}
        onClick={status === 'listening' ? stopListening : startListening}
        title={status === 'listening' ? 'Остановить запись' : 'Голосовой ввод расхода'}
      >
        {status === 'listening' ? (
          <span className="voice-pulse" />
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="22"/>
            <line x1="8" y1="22" x2="16" y2="22"/>
          </svg>
        )}
        {status === 'listening' ? 'Слушаю…' : 'Голос'}
      </button>

      {/* Live transcript */}
      {status === 'listening' && transcript && (
        <div className="voice-transcript">
          <span className="voice-transcript-dot" />
          {transcript}
        </div>
      )}

      {/* Preview parsed result */}
      {status === 'preview' && parsed && (
        <div className="voice-preview">
          <div className="voice-preview-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Распознано
          </div>
          <div className="voice-preview-body">
            <div className="voice-preview-row">
              <span className="voice-preview-key">Название</span>
              <span className="voice-preview-val">{parsed.title}</span>
            </div>
            <div className="voice-preview-row">
              <span className="voice-preview-key">Сумма</span>
              <span className="voice-preview-val voice-preview-amt">
                {parsed.amount ? parsed.amount.toLocaleString('ru') + ' сум' : '—'}
              </span>
            </div>
            <div className="voice-preview-row">
              <span className="voice-preview-key">Категория</span>
              <span className="voice-preview-val">{CAT_LABELS[parsed.category]}</span>
            </div>
          </div>
          <div className="voice-preview-actions">
            <button type="button" className="voice-confirm-btn" onClick={handleConfirm}>
              Заполнить форму
            </button>
            <button type="button" className="voice-cancel-btn" onClick={handleCancel}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <span className="voice-error-text">Ошибка микрофона</span>
      )}
    </div>
  )
}
