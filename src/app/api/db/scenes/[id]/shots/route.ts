import { NextResponse } from 'next/server'
import { serverDb as db } from '@/data/db-server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const shots = await db.shots.listByScene(params.id)
    return NextResponse.json(shots)
  } catch (error) {
    console.error('Failed to fetch scene shots:', error)
    return NextResponse.json({ error: 'Failed to fetch scene shots' }, { status: 500 })
  }
} 