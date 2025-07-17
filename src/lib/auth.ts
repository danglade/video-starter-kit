/**
 * Temporary Authentication System
 * 
 * This is a placeholder auth system that will be replaced with proper authentication.
 * For development, it uses a single consistent user ID.
 */

import { cookies } from 'next/headers'
import { prisma } from './prisma'

// For development: use a single consistent user ID
const DEVELOPMENT_USER_ID = 'dev-user-001'
const USER_ID_COOKIE = '__vsk_temp_user_id'

/**
 * Get or create the development user ID for server-side operations
 * In development, this always returns the same user ID
 */
export async function getOrCreateUserId(): Promise<string> {
  // For now, always use the development user ID
  // This prevents creating multiple users during development
  const userId = DEVELOPMENT_USER_ID
  
  // Ensure this user exists in the database
  await ensureUserExists(userId)
  
  // Set cookie for consistency (optional for development)
  const cookieStore = cookies()
  cookieStore.set(USER_ID_COOKIE, userId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })
  
  return userId
}

/**
 * Ensure user exists in database
 */
async function ensureUserExists(userId: string): Promise<void> {
  try {
    await prisma.user.upsert({
      where: { tempId: userId },
      update: {},
      create: { tempId: userId }
    })
  } catch (error) {
    console.error('Failed to ensure user exists:', error)
    throw error
  }
}

/**
 * Client-side function to get the current user ID
 * For development, this returns the same ID as server-side
 */
export function getClientUserId(): string {
  // For development, always return the same user ID
  return DEVELOPMENT_USER_ID
}

/**
 * Clear the temporary user session (for testing purposes)
 */
export function clearUserSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_ID_COOKIE)
    document.cookie = `${USER_ID_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  }
}

/**
 * When you're ready to implement real authentication:
 * 
 * 1. Install NextAuth.js or your preferred auth solution
 * 2. Replace getOrCreateUserId() to get the user from the session:
 *    
 *    export async function getOrCreateUserId(): Promise<string> {
 *      const session = await getServerSession()
 *      if (!session?.user?.id) {
 *        throw new Error('Unauthorized')
 *      }
 *      return session.user.id
 *    }
 * 
 * 3. Update the User model in schema.prisma to include email, name, etc.
 * 4. Add login/signup pages
 * 5. Remove the DEVELOPMENT_USER_ID constant
 */ 