import { NextResponse } from 'next/server'
import { db } from '@/data/db'

export async function GET() {
  try {
    // This endpoint is not used directly - use /episodes/[id]/scenes instead
    return NextResponse.json({ error: 'Use /api/db/episodes/[id]/scenes instead' }, { status: 400 })
  } catch (error) {
    console.error('Failed to fetch scenes:', error)
    return NextResponse.json({ error: 'Failed to fetch scenes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const id = await db.scenes.create(body)
    return NextResponse.json({ id })
  } catch (error) {
    console.error('Failed to create scene:', error)
    return NextResponse.json({ error: 'Failed to create scene' }, { status: 500 })
  }
} 