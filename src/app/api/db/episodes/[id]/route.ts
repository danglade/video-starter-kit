import { NextResponse } from 'next/server'
import { serverDb as db } from '@/data/db-server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const episode = await db.episodes.find(params.id)
    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 })
    }
    return NextResponse.json(episode)
  } catch (error) {
    console.error('Failed to fetch episode:', error)
    return NextResponse.json({ error: 'Failed to fetch episode' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    await db.episodes.update(params.id, body)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update episode:', error)
    return NextResponse.json({ error: 'Failed to update episode' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.episodes.delete(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete episode:', error)
    return NextResponse.json({ error: 'Failed to delete episode' }, { status: 500 })
  }
} 