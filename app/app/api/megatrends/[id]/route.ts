import { NextResponse } from 'next/server'
import { createMegatrendDbAdapter } from '@/lib/pain-registry-db'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const adapter = createMegatrendDbAdapter()
    const item = await adapter.getPainDetail(id)
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ item })
  } catch {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 500 })
  }
}
