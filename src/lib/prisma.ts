import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper to get current user ID (temporary solution before auth)
export function getCurrentUserId(): string {
  // This is imported dynamically in the server-side code
  // to avoid issues with Next.js server/client separation
  throw new Error('getCurrentUserId should not be called directly. Use getOrCreateUserId from auth.ts in server components.')
} 