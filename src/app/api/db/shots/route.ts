import { NextResponse } from 'next/server'
import { serverDb as db } from '@/data/db-server'

export async function GET() {
  try {
    // This endpoint is not used directly - use /scenes/[id]/shots instead
    return NextResponse.json({ error: 'Use /api/db/scenes/[id]/shots instead' }, { status: 400 })
  } catch (error) {
    console.error('Failed to fetch shots:', error)
    return NextResponse.json({ error: 'Failed to fetch shots' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const id = await db.shots.create(body)
    return NextResponse.json({ id })
  } catch (error) {
    console.error('Failed to create shot:', error)
    return NextResponse.json({ error: 'Failed to create shot' }, { status: 500 })
  }
} 