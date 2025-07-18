export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { serverDb } from '@/data/db-server'
import type { VideoTrack } from '@/data/schema'

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const tracks = await serverDb.tracks.tracksByProject(params.projectId)
    return NextResponse.json(tracks)
  } catch (error) {
    console.error('Failed to list tracks:', error)
    return NextResponse.json(
      { error: 'Failed to list tracks' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const track: Omit<VideoTrack, 'id'> = await request.json()
    const id = await serverDb.tracks.create({
      ...track,
      projectId: params.projectId
    })
    return NextResponse.json({ id })
  } catch (error) {
    console.error('Failed to create track:', error)
    return NextResponse.json(
      { error: 'Failed to create track' },
      { status: 500 }
    )
  }
} 