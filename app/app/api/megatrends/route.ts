import { NextRequest, NextResponse } from 'next/server'
import { createMegatrendDbAdapter } from '@/lib/pain-registry-db'

export async function GET(req: NextRequest) {
  try {
    const statusFilter = req.nextUrl.searchParams.get('status') ?? undefined
    const adapter = createMegatrendDbAdapter()
    const [allItems, matches] = await Promise.all([
      adapter.listPains(),
      adapter.getPersonalMatches(),
    ])
    const items = statusFilter
      ? allItems.filter(i => i.status === statusFilter)
      : allItems
    return NextResponse.json({ items, matches })
  } catch {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 500 })
  }
}
