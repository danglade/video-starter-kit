export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { serverDb } from '@/data/db-server'

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const characters = await serverDb.characters.byProject(params.projectId)
    return NextResponse.json(characters)
  } catch (error) {
    console.error('Failed to fetch project characters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project characters' },
      { status: 500 }
    )
  }
} 