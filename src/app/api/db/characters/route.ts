export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { serverDb } from '@/data/db-server'

export async function GET() {
  try {
    const characters = await serverDb.characters.all()
    return NextResponse.json(characters)
  } catch (error) {
    console.error('Failed to fetch characters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch characters' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const character = await request.json()
    const id = await serverDb.characters.create(character)
    return NextResponse.json({ id })
  } catch (error) {
    console.error('Failed to create character:', error)
    return NextResponse.json(
      { error: 'Failed to create character' },
      { status: 500 }
    )
  }
} 