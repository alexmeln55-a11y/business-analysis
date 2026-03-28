import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import path from 'path'

const STEPS: Record<string, string> = {
  ingest:        'pipeline:ingest-megatrends',
  extract:       'pipeline:extract-megatrends',
  dedup:         'pipeline:dedup-megatrends',
  confirm:       'pipeline:confirm-megatrends',
  'generate-ideas': 'pipeline:generate-ideas',
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-pipeline-secret')
  if (secret !== process.env.PIPELINE_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { step } = await req.json()

  if (!step || !STEPS[step]) {
    return NextResponse.json(
      { error: 'unknown step', available: Object.keys(STEPS) },
      { status: 400 }
    )
  }

  const script = STEPS[step]
  const cwd = path.join(process.cwd())

  try {
    const output = execSync(`npm run ${script}`, {
      cwd,
      timeout: 120_000,
      encoding: 'utf-8',
    })
    return NextResponse.json({ ok: true, step, output })
  } catch (err: unknown) {
    const e = err as { message?: string; stdout?: string; stderr?: string }
    return NextResponse.json(
      { ok: false, step, error: e.message, stdout: e.stdout, stderr: e.stderr },
      { status: 500 }
    )
  }
}
