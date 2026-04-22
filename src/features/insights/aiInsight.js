const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-6'
const CACHE_KEY_PREFIX = 'rc_insight_'

const SYSTEM_PROMPT = `You are a personal recovery coach for someone tracking their daily health and wellbeing. They log daily symptoms (pain, energy, sleep quality, brain fog, fatigue) on a 1–10 scale and wear an Oura ring that measures readiness, sleep quality, and HRV. Be warm, direct, and human — not clinical. Write exactly 2 sentences: the first reflects what their body likely feels like right now based on the numbers, the second suggests one concrete thing to support their day. Total under 55 words. Do not start with "I" or "Your".`

function buildPrompt(context) {
  const { week, phase, patchCycleDay, yesterday, today } = context

  const lines = [
    `Week ${week} of the program, ${phase}, patch day ${patchCycleDay}/7.`,
  ]

  if (yesterday) {
    const parts = []
    if (yesterday.readiness != null) parts.push(`Oura readiness ${yesterday.readiness}`)
    if (yesterday.sleepScore != null) parts.push(`sleep score ${yesterday.sleepScore}`)
    if (yesterday.hrv != null) parts.push(`HRV ${yesterday.hrv}ms`)
    if (yesterday.restingHr != null) parts.push(`resting HR ${yesterday.restingHr}bpm`)
    if (yesterday.energy != null) parts.push(`energy ${yesterday.energy}/10`)
    if (yesterday.painAvg != null) parts.push(`pain avg ${yesterday.painAvg}/10`)
    if (yesterday.sleepQuality != null) parts.push(`sleep quality ${yesterday.sleepQuality}/10`)
    if (yesterday.alcoholUsed) parts.push(`alcohol consumed`)
    if (parts.length) lines.push(`Yesterday: ${parts.join(', ')}.`)
    if (yesterday.notes) lines.push(`User note: "${yesterday.notes}"`)
  } else {
    lines.push('No data from yesterday.')
  }

  if (today) {
    const parts = []
    if (today.energy != null) parts.push(`energy ${today.energy}/10`)
    if (today.painAvg != null) parts.push(`pain avg ${today.painAvg}/10`)
    if (parts.length) lines.push(`Today so far: ${parts.join(', ')}.`)
  }

  return lines.join(' ')
}

export async function generateDailyInsight(context) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) {
    return null
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 120,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildPrompt(context) }],
    }),
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text ?? null
}

export function getCachedInsight(dateString) {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}${dateString}`)
    return raw ? JSON.parse(raw).message : null
  } catch {
    return null
  }
}

export function setCachedInsight(dateString, message) {
  try {
    localStorage.setItem(`${CACHE_KEY_PREFIX}${dateString}`, JSON.stringify({ message }))
  } catch {
    // localStorage unavailable — ignore
  }
}

export function clearCachedInsight(dateString) {
  try {
    localStorage.removeItem(`${CACHE_KEY_PREFIX}${dateString}`)
  } catch {
    // ignore
  }
}
