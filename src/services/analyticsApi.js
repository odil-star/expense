/**
 * analyticsApi.js — typed wrappers over analytics API endpoints.
 * All functions accept an `apiFetch` from useApiFetch() hook.
 */

async function json(res) {
  if (!res || !res.ok) return null
  const text = await res.text()
  if (!text || !text.trim()) return null
  try { return JSON.parse(text) }
  catch { return null }
}

export const analyticsApi = {
  /** GET /api/analytics/forecast/ */
  async getForecast(apiFetch) {
    return json(await apiFetch('/analytics/forecast/'))
  },

  /** GET /api/analytics/categories/ */
  async getCategories(apiFetch) {
    const data = await json(await apiFetch('/analytics/categories/'))
    return data?.categories ?? []
  },

  /** GET /api/analytics/anomalies/ */
  async getAnomalies(apiFetch) {
    const data = await json(await apiFetch('/analytics/anomalies/'))
    return data?.anomalies ?? []
  },

  /** POST /api/analytics/anomalies/:id/dismiss/ */
  async dismissAnomaly(apiFetch, id) {
    return json(await apiFetch(`/analytics/anomalies/${id}/dismiss/`, { method: 'POST' }))
  },

  /** GET /api/analytics/savings/?months=6 */
  async getSavingsTimeline(apiFetch, months = 6) {
    const data = await json(await apiFetch(`/analytics/savings/?months=${months}`))
    return data?.timeline ?? []
  },

  /** GET /api/analytics/recommendations/ */
  async getRecommendations(apiFetch) {
    const data = await json(await apiFetch('/analytics/recommendations/'))
    return data?.recommendations ?? []
  },

  /** POST /api/analytics/feedback/ — rating: 1 | -1 */
  async submitFeedback(apiFetch, { recommendation_type, recommendation_text, rating, context_data = {} }) {
    return json(await apiFetch('/analytics/feedback/', {
      method: 'POST',
      body: JSON.stringify({ recommendation_type, recommendation_text, rating, context_data }),
    }))
  },

  /** POST /api/analytics/corrections/ — category correction for self-learning */
  async submitCorrection(apiFetch, { expense_id, corrected_category }) {
    return json(await apiFetch('/analytics/corrections/', {
      method: 'POST',
      body: JSON.stringify({ expense_id, corrected_category }),
    }))
  },

  /** GET /api/analytics/snapshots/ */
  async getSnapshots(apiFetch) {
    return json(await apiFetch('/analytics/snapshots/'))
  },

  /** GET /api/analytics/suggest-category/?title=... */
  async suggestCategory(apiFetch, title) {
    const data = await json(await apiFetch(`/analytics/suggest-category/?title=${encodeURIComponent(title)}`))
    return data?.suggestion ?? null
  },
}
