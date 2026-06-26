import { CAT_LABELS } from '../constants/categories'

function getMonthExpenses(expenses, monthsAgo = 0) {
  const now = new Date()
  const target = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1)
  const monthStr = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`
  return expenses.filter(e => e.created_at.startsWith(monthStr))
}

function groupByCategory(expenses) {
  const map = {}
  expenses.forEach(e => {
    map[e.category] = (map[e.category] || 0) + parseFloat(e.amount)
  })
  return map
}

function topCategories(expenses) {
  return Object.entries(groupByCategory(expenses))
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amount]) => ({ cat, amount, label: CAT_LABELS[cat] || cat }))
}

export function analyzeExpenses(expenses) {
  if (!expenses || expenses.length === 0) {
    return { insights: [], recommendations: [], forecast: null, summary: null }
  }

  const now = new Date()
  const dayOfMonth = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysRemaining = daysInMonth - dayOfMonth

  const thisMonth    = getMonthExpenses(expenses, 0)
  const lastMonth    = getMonthExpenses(expenses, 1)
  const twoMonthsAgo = getMonthExpenses(expenses, 2)

  const thisTotal  = thisMonth.reduce((s, e) => s + parseFloat(e.amount), 0)
  const lastTotal  = lastMonth.reduce((s, e) => s + parseFloat(e.amount), 0)
  const twoTotal   = twoMonthsAgo.reduce((s, e) => s + parseFloat(e.amount), 0)

  const thisCats = topCategories(thisMonth)
  const lastCats = topCategories(lastMonth)

  const lastMap = Object.fromEntries(lastCats.map(c => [c.cat, c.amount]))
  const twoMap  = Object.fromEntries(topCategories(twoMonthsAgo).map(c => [c.cat, c.amount]))

  // Categories growing month-over-month
  const growingCats = thisCats
    .filter(c => lastMap[c.cat] && c.amount > lastMap[c.cat])
    .map(c => ({
      ...c,
      growthPct: Math.round(((c.amount - lastMap[c.cat]) / lastMap[c.cat]) * 100),
      prevAmount: lastMap[c.cat],
    }))
    .sort((a, b) => b.growthPct - a.growthPct)

  const avgDaily = dayOfMonth > 0 ? thisTotal / dayOfMonth : 0
  const forecastedTotal = Math.round(avgDaily * daysInMonth)

  const totalIncome    = parseFloat(localStorage.getItem('totalIncome'))  || 0
  const manualBalance  = parseFloat(localStorage.getItem('userBalance'))  || 0
  const effectiveIncome = totalIncome > 0 ? totalIncome : manualBalance

  const budgets = (() => {
    try { return JSON.parse(localStorage.getItem('budgets') || '{}') }
    catch { return {} }
  })()
  const totalBudget = Object.values(budgets).reduce((s, v) => s + parseFloat(v || 0), 0)

  // ── Insights ─────────────────────────────────────────────
  const insights = []

  if (thisCats.length > 0) {
    const top = thisCats[0]
    const pct = thisTotal > 0 ? Math.round((top.amount / thisTotal) * 100) : 0
    insights.push({
      type: 'info',
      icon: '📊',
      title: 'Основная статья расходов',
      text: `«${top.label}» занимает ${pct}% расходов этого месяца — ${top.amount.toLocaleString('ru')} сум`,
    })
  }

  if (lastTotal > 0 && thisTotal > 0) {
    const delta = Math.round(((thisTotal - lastTotal) / lastTotal) * 100)
    const up = delta > 0
    insights.push({
      type: up ? 'warning' : 'success',
      icon: up ? '📈' : '📉',
      title: 'Динамика расходов',
      text: up
        ? `Расходы выросли на ${delta}% по сравнению с прошлым месяцем`
        : `Расходы снизились на ${Math.abs(delta)}% — отличный результат!`,
    })
  }

  if (growingCats.length > 0) {
    const top = growingCats[0]
    insights.push({
      type: top.growthPct > 50 ? 'danger' : 'warning',
      icon: '⚡',
      title: 'Быстрый рост категории',
      text: `«${top.label}» выросла на ${top.growthPct}% — с ${top.prevAmount.toLocaleString('ru')} до ${top.amount.toLocaleString('ru')} сум`,
    })
  }

  if (effectiveIncome > 0) {
    const savingsRate = Math.round(((effectiveIncome - forecastedTotal) / effectiveIncome) * 100)
    const atRisk = forecastedTotal > effectiveIncome
    insights.push({
      type: atRisk ? 'danger' : savingsRate > 20 ? 'success' : 'info',
      icon: atRisk ? '⚠️' : '💡',
      title: 'Прогноз на конец месяца',
      text: atRisk
        ? `Риск перерасхода: прогноз ${forecastedTotal.toLocaleString('ru')} сум при доходе ${effectiveIncome.toLocaleString('ru')} сум`
        : `Прогнозируемая экономия: ${(effectiveIncome - forecastedTotal).toLocaleString('ru')} сум (${savingsRate}%)`,
    })
  }

  if (totalBudget > 0) {
    const budgetUsage = Math.round((thisTotal / totalBudget) * 100)
    insights.push({
      type: budgetUsage > 90 ? 'danger' : budgetUsage > 70 ? 'warning' : 'success',
      icon: '🎯',
      title: 'Использование бюджета',
      text: `Использовано ${budgetUsage}% месячного бюджета (${thisTotal.toLocaleString('ru')} из ${totalBudget.toLocaleString('ru')} сум)`,
    })
  }

  const txPerDay = dayOfMonth > 0 ? (thisMonth.length / dayOfMonth).toFixed(1) : 0
  if (txPerDay > 0) {
    insights.push({
      type: 'info',
      icon: '🔢',
      title: 'Частота транзакций',
      text: `В среднем ${txPerDay} транзакции в день. Средний чек: ${dayOfMonth > 0 ? Math.round(thisTotal / thisMonth.length).toLocaleString('ru') : 0} сум`,
    })
  }

  // ── Recommendations ───────────────────────────────────────
  const recommendations = []

  if (thisCats.length > 0) {
    const top = thisCats[0]
    const cutAmt = Math.round(top.amount * 0.15)
    recommendations.push({
      priority: 'high',
      icon: '✂️',
      title: `Сократите расходы на «${top.label}»`,
      text: `Это крупнейшая категория. Снижение на 15% сэкономит ~${cutAmt.toLocaleString('ru')} сум`,
      action: 'Установить лимит бюджета',
      link: '/budget',
    })
  }

  if (growingCats.length > 0) {
    const g = growingCats[0]
    recommendations.push({
      priority: 'high',
      icon: '📌',
      title: `Контролируйте «${g.label}»`,
      text: `Категория растёт быстрее всего (+${g.growthPct}%). Установите месячный лимит.`,
      action: 'Настроить бюджет',
      link: '/budget',
    })
  }

  if (effectiveIncome > 0 && forecastedTotal < effectiveIncome * 0.75) {
    const savable = Math.round(effectiveIncome - forecastedTotal)
    recommendations.push({
      priority: 'low',
      icon: '💰',
      title: 'Направьте экономию в инвестиции',
      text: `Прогноз экономии — ${savable.toLocaleString('ru')} сум. Хорошее время для инвестиций.`,
      action: 'Добавить доход',
      link: '/income',
    })
  }

  if (thisCats.length >= 3) {
    const top3total = thisCats.slice(0, 3).reduce((s, c) => s + c.amount, 0)
    const top3pct   = thisTotal > 0 ? Math.round((top3total / thisTotal) * 100) : 0
    if (top3pct > 75) {
      recommendations.push({
        priority: 'medium',
        icon: '🔍',
        title: 'Диверсифицируйте структуру расходов',
        text: `${top3pct}% бюджета уходит в 3 категории. Детальная аналитика поможет найти точки оптимизации.`,
        action: 'Смотреть аналитику',
        link: '/analytics',
      })
    }
  }

  if (thisMonth.length === 0) {
    recommendations.push({
      priority: 'medium',
      icon: '➕',
      title: 'Начните вести учёт расходов',
      text: 'Добавьте первые расходы этого месяца, чтобы получить персональные рекомендации.',
      action: 'Добавить расход',
      link: '/add',
    })
  }

  // ── Next month forecast ───────────────────────────────────
  const trendMultiplier = lastTotal > 0
    ? (lastTotal > 0 && twoTotal > 0 ? (lastTotal / twoTotal) : 1)
    : 1
  const nextMonthForecast = Math.round(forecastedTotal * trendMultiplier)

  const forecast = {
    avgDailySpend:   Math.round(avgDaily),
    forecastedTotal,
    nextMonthTotal:  nextMonthForecast,
    daysRemaining,
    topCategories:   thisCats.slice(0, 5),
    savingsEstimate: effectiveIncome > 0 ? Math.round(effectiveIncome - forecastedTotal) : null,
    atRisk:          effectiveIncome > 0 && forecastedTotal > effectiveIncome,
  }

  const summary = {
    thisTotal:   Math.round(thisTotal),
    lastTotal:   Math.round(lastTotal),
    twoTotal:    Math.round(twoTotal),
    txCount:     thisMonth.length,
    growingCats: growingCats.slice(0, 3),
    topCats:     thisCats.slice(0, 5),
  }

  return { insights, recommendations, forecast, summary }
}
