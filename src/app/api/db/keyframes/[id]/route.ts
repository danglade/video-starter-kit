import { NextRequest, NextResponse } from 'next/server'
import { serverDb } from '@/data/db-server'
import type { VideoKeyFrame } from '@/data/schema'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates: Partial<VideoKeyFrame> = await request.json()
    await serverDb.keyFrames.update(params.id, updates)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update keyframe:', error)
    return NextResponse.json(
      { error: 'Failed to update keyframe' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await serverDb.keyFrames.delete(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete keyframe:', error)
    return NextResponse.json(
      { error: 'Failed to delete keyframe' },
      { status: 500 }
    )
  }
} 