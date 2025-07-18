export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { serverDb } from '@/data/db-server'
import type { VideoKeyFrame } from '@/data/schema'

export async function GET(
  request: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    const keyFrames = await serverDb.keyFrames.keyFramesByTrack(params.trackId)
    return NextResponse.json(keyFrames)
  } catch (error) {
    console.error('Failed to list keyframes:', error)
    return NextResponse.json(
      { error: 'Failed to list keyframes' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    const keyFrame: Omit<VideoKeyFrame, 'id'> = await request.json()
    const id = await serverDb.keyFrames.create({
      ...keyFrame,
      trackId: params.trackId
    })
    return NextResponse.json({ id })
  } catch (error) {
    console.error('Failed to create keyframe:', error)
    return NextResponse.json(
      { error: 'Failed to create keyframe' },
      { status: 500 }
    )
  }
} 