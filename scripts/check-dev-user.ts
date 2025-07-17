#!/usr/bin/env node
import { prisma } from '../src/lib/prisma'

async function checkDevUser() {
  try {
    const devUser = await prisma.user.findUnique({
      where: { tempId: 'dev-user-001' }
    })
    
    if (devUser) {
      console.log('✅ Development user exists:', devUser)
    } else {
      console.log('❌ Development user not found')
      console.log('Creating development user...')
      
      const newUser = await prisma.user.create({
        data: { tempId: 'dev-user-001' }
      })
      
      console.log('✅ Development user created:', newUser)
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDevUser() 