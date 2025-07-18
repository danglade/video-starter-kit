export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { serverDb } from '@/data/db-server'
import { getOrCreateUserId } from '@/lib/auth'
import type { VideoProject } from '@/data/schema'

export async function GET() {
  try {
    // Ensure user exists
    await getOrCreateUserId()
    
    const projects = await serverDb.projects.list()
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Failed to list projects:', error)
    return NextResponse.json(
      { error: 'Failed to list projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const project: Omit<VideoProject, 'id'> = await request.json()
    const id = await serverDb.projects.create(project)
    return NextResponse.json({ id })
  } catch (error) {
    console.error('Failed to create project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
} 