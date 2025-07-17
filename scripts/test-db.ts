#!/usr/bin/env node
import { prisma } from '../src/lib/prisma'

async function testDatabase() {
  console.log('Testing database connection...')
  
  try {
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Try to create a test user
    const testUserId = 'temp_test_' + Date.now()
    const user = await prisma.user.create({
      data: {
        tempId: testUserId
      }
    })
    console.log('✅ Test user created:', user)
    
    // Try to create a test project
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        title: 'Test Project',
        description: 'Test Description',
        aspectRatio: '16:9'
      }
    })
    console.log('✅ Test project created:', project)
    
    // Clean up
    await prisma.project.delete({ where: { id: project.id } })
    await prisma.user.delete({ where: { id: user.id } })
    console.log('✅ Test data cleaned up')
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
    console.error('\nMake sure you have:')
    console.error('1. Set DATABASE_URL in .env.local')
    console.error('2. Run: npm run db:generate')
    console.error('3. Run: npm run db:push')
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase() 