// Fixed-window rate limiter. Uses Upstash Redis / Vercel KV over REST when configured,
// so the limit holds across serverless instances; otherwise falls back to per-instance memory.

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

const memory = new Map<string, number[]>()

function memoryLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const recent = (memory.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= limit) return false
  memory.set(key, [...recent, now])
  return true
}

async function redisLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const bucket = `rl:${key}:${Math.floor(Date.now() / windowMs)}`
  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([['INCR', bucket], ['PEXPIRE', bucket, String(windowMs)]]),
    signal: AbortSignal.timeout(3000),
  })
  if (!res.ok) throw new Error(`Redis HTTP ${res.status}`)
  const [incr] = (await res.json()) as { result: number }[]
  return incr.result <= limit
}

/** Returns true if the request is allowed. */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  if (REDIS_URL && REDIS_TOKEN) {
    try {
      return await redisLimit(key, limit, windowMs)
    } catch (e) {
      console.error('rate-limit: shared store failed, using memory', e)
    }
  }
  return memoryLimit(key, limit, windowMs)
}
