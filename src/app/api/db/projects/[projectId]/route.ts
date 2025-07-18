export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { serverDb } from '@/data/db-server'
import type { VideoProject } from '@/data/schema'

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const project = await serverDb.projects.find(params.projectId)
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(project)
  } catch (error) {
    console.error('Failed to get project:', error)
    return NextResponse.json(
      { error: 'Failed to get project' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const updates: Partial<VideoProject> = await request.json()
    await serverDb.projects.update(params.projectId, updates)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
} 