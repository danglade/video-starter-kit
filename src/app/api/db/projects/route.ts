export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { serverDb } from '@/data/db-server'
import { getOrCreateUserId } from '@/lib/auth'
import type { VideoProject } from '@/data/schema'

export async function GET() {
  try {
    // Log environment info for debugging
    console.log('GET /api/db/projects - Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      HAS_DATABASE_URL: !!process.env.DATABASE_URL,
      BUILDING: process.env.BUILDING,
    })
    
    // Ensure user exists
    await getOrCreateUserId()
    
    const projects = await serverDb.projects.list()
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Failed to list projects:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to list projects',
        details: errorMessage,
        env: {
          NODE_ENV: process.env.NODE_ENV,
          HAS_DATABASE_URL: !!process.env.DATABASE_URL,
        }
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Log environment info for debugging
    console.log('POST /api/db/projects - Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      HAS_DATABASE_URL: !!process.env.DATABASE_URL,
      BUILDING: process.env.BUILDING,
    })
    
    const project: Omit<VideoProject, 'id'> = await request.json()
    const id = await serverDb.projects.create(project)
    return NextResponse.json({ id })
  } catch (error) {
    console.error('Failed to create project:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to create project',
        details: errorMessage,
        env: {
          NODE_ENV: process.env.NODE_ENV,
          HAS_DATABASE_URL: !!process.env.DATABASE_URL,
        }
      },
      { status: 500 }
    )
  }
} 