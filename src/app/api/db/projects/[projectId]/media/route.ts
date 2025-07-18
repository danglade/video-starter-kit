export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { serverDb } from '@/data/db-server'
import type { MediaItem } from '@/data/schema'

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const mediaItems = await serverDb.media.mediaByProject(params.projectId)
    return NextResponse.json(mediaItems)
  } catch (error) {
    console.error('Failed to list media items:', error)
    return NextResponse.json(
      { error: 'Failed to list media items' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const media: Omit<MediaItem, 'id'> = await request.json()
    console.log('Creating media item for project:', params.projectId)
    console.log('Media data:', media)
    
    const id = await serverDb.media.create({
      ...media,
      projectId: params.projectId
    })
    return NextResponse.json({ id })
  } catch (error) {
    console.error('Failed to create media item:', error)
    console.error('ProjectId:', params.projectId)
    console.error('Media data:', await request.json().catch(() => 'Failed to parse body'))
    return NextResponse.json(
      { error: 'Failed to create media item', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 