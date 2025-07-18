export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { seedDatabase } from '@/data/seed'

export async function POST() {
  try {
    const projectId = await seedDatabase()
    return NextResponse.json({ success: true, projectId })
  } catch (error) {
    console.error('Failed to seed database:', error)
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    )
  }
} 