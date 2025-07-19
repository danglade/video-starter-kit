import { NextResponse } from 'next/server'
import { db } from '@/data/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const shot = await db.shots.find(params.id)
    if (!shot) {
      return NextResponse.json({ error: 'Shot not found' }, { status: 404 })
    }
    return NextResponse.json(shot)
  } catch (error) {
    console.error('Failed to fetch shot:', error)
    return NextResponse.json({ error: 'Failed to fetch shot' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    await db.shots.update(params.id, body)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update shot:', error)
    return NextResponse.json({ error: 'Failed to update shot' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.shots.delete(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete shot:', error)
    return NextResponse.json({ error: 'Failed to delete shot' }, { status: 500 })
  }
} 