import { NextResponse } from 'next/server'
import { db } from '@/data/db'

export async function GET() {
  try {
    // This endpoint is not used directly - use /projects/[id]/episodes instead
    return NextResponse.json({ error: 'Use /api/db/projects/[id]/episodes instead' }, { status: 400 })
  } catch (error) {
    console.error('Failed to fetch episodes:', error)
    return NextResponse.json({ error: 'Failed to fetch episodes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const id = await db.episodes.create(body)
    return NextResponse.json({ id })
  } catch (error) {
    console.error('Failed to create episode:', error)
    return NextResponse.json({ error: 'Failed to create episode' }, { status: 500 })
  }
} 