import { NextResponse } from 'next/server'
import { db } from '@/data/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const episodes = await db.episodes.listByProject(params.id)
    return NextResponse.json(episodes)
  } catch (error) {
    console.error('Failed to fetch project episodes:', error)
    return NextResponse.json({ error: 'Failed to fetch project episodes' }, { status: 500 })
  }
} 