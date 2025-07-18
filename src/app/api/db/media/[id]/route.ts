export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { serverDb } from '@/data/db-server'
import type { MediaItem } from '@/data/schema'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const media = await serverDb.media.find(params.id)
    if (!media) {
      return NextResponse.json(
        { error: 'Media item not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(media)
  } catch (error) {
    console.error('Failed to get media item:', error)
    return NextResponse.json(
      { error: 'Failed to get media item' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates: Partial<MediaItem> = await request.json()
    await serverDb.media.update(params.id, updates)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update media item:', error)
    return NextResponse.json(
      { error: 'Failed to update media item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await serverDb.media.delete(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete media item:', error)
    return NextResponse.json(
      { error: 'Failed to delete media item' },
      { status: 500 }
    )
  }
} 