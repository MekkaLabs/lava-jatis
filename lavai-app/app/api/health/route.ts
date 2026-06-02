import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Public health-check endpoint — no auth required.
// Used by Vercel, uptime monitors, and load balancers.
export async function GET(_req: NextRequest) {
  const startMs = Date.now()

  let dbStatus = 'unknown'
  let dbLatencyMs: number | null = null

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const t0 = Date.now()
    // Minimal query — just ping the DB; no data returned
    const { error } = await supabase
      .from('lava_jatos')
      .select('id', { count: 'exact', head: true })
      .limit(1)

    dbLatencyMs = Date.now() - t0
    dbStatus = error ? 'error' : 'connected'
  } catch {
    dbStatus = 'error'
  }

  const allOk = dbStatus === 'connected'

  // Payload mínimo pra público (evita fingerprinting CVE + timing side channel).
  // Detalhes só pra Vercel internal monitoring (user-agent vercel/* ou header interno).
  const ua = _req.headers.get('user-agent') ?? ''
  const isInternal = ua.includes('vercel') || _req.headers.get('x-vercel-internal-deployment-id')

  const publicPayload = {
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
  }
  const detailedPayload = {
    ...publicPayload,
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0',
    db: dbStatus,
    dbLatencyMs,
    uptimeMs: Date.now() - startMs,
  }

  return Response.json(
    isInternal ? detailedPayload : publicPayload,
    {
      status: allOk ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    }
  )
}
