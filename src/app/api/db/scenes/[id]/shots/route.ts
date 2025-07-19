import { NextResponse } from 'next/server'
import { db } from '@/data/db'

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