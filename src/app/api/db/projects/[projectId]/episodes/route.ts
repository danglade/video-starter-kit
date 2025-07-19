import { NextResponse } from 'next/server'
import { serverDb } from '@/data/db-server'

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const episodes = await serverDb.episodes.listByProject(params.projectId)
    return NextResponse.json(episodes)
  } catch (error) {
    console.error('Failed to fetch project episodes:', error)
    return NextResponse.json({ error: 'Failed to fetch project episodes' }, { status: 500 })
  }
} 