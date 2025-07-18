export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { serverDb } from '@/data/db-server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const character = await serverDb.characters.find(params.id)
    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(character)
  } catch (error) {
    console.error('Failed to fetch character:', error)
    return NextResponse.json(
      { error: 'Failed to fetch character' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json()
    await serverDb.characters.update(params.id, updates)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update character:', error)
    return NextResponse.json(
      { error: 'Failed to update character' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await serverDb.characters.delete(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete character:', error)
    return NextResponse.json(
      { error: 'Failed to delete character' },
      { status: 500 }
    )
  }
} 