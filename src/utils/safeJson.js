/**
 * Safely parses a fetch Response to JSON.
 * Returns null instead of throwing on:
 *  - null / undefined response
 *  - 204 No Content / empty body
 *  - HTML error pages (non-JSON body)
 *  - malformed JSON
 */
export async function safeJson(res) {
  if (!res) return null
  const text = await res.text()
  if (!text || !text.trim()) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
