import { NextResponse } from 'next/server'
import { createMegatrendDbAdapter } from '@/lib/pain-registry-db'

export async function GET() {
  try {
    const adapter = createMegatrendDbAdapter()
    const [items, matches] = await Promise.all([
      adapter.listPains(),
      adapter.getPersonalMatches(),
    ])
    return NextResponse.json({ items, matches })
  } catch {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 500 })
  }
}
