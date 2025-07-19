import { NextResponse } from 'next/server'
import { serverDb as db } from '@/data/db-server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const scene = await db.scenes.find(params.id)
    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 })
    }
    return NextResponse.json(scene)
  } catch (error) {
    console.error('Failed to fetch scene:', error)
    return NextResponse.json({ error: 'Failed to fetch scene' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    await db.scenes.update(params.id, body)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update scene:', error)
    return NextResponse.json({ error: 'Failed to update scene' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.scenes.delete(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete scene:', error)
    return NextResponse.json({ error: 'Failed to delete scene' }, { status: 500 })
  }
} 