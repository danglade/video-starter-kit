import { NextResponse } from 'next/server'
import { serverDb as db } from '@/data/db-server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const scenes = await db.scenes.listByEpisode(params.id)
    return NextResponse.json(scenes)
  } catch (error) {
    console.error('Failed to fetch episode scenes:', error)
    return NextResponse.json({ error: 'Failed to fetch episode scenes' }, { status: 500 })
  }
} 