let PrismaClient: any;
let prisma: any;

if (process.env.NODE_ENV === 'production' && !process.env.BUILDING) {
  // Only import Prisma in production runtime, not during build
  PrismaClient = require('@prisma/client').PrismaClient;
  
  const globalForPrisma = globalThis as unknown as {
    prisma: any | undefined
  }
  
  prisma = globalForPrisma.prisma ?? new PrismaClient();
  
  globalForPrisma.prisma = prisma;
} else if (process.env.NODE_ENV !== 'production') {
  // Development mode
  try {
    PrismaClient = require('@prisma/client').PrismaClient;
    
    const globalForPrisma = globalThis as unknown as {
      prisma: any | undefined
    }
    
    prisma = globalForPrisma.prisma ?? new PrismaClient();
    globalForPrisma.prisma = prisma;
  } catch (e) {
    console.warn('Prisma Client not generated. Run "prisma generate" to fix this.');
    // Create a mock for build time
    prisma = new Proxy({}, {
      get() {
        throw new Error('Prisma Client not available during build');
      }
    });
  }
} else {
  // Build time - create a mock
  prisma = new Proxy({}, {
    get() {
      return () => {
        throw new Error('Database operations not available during build');
      };
    }
  });
}

export { prisma }

// Helper to get current user ID (temporary solution before auth)
export function getCurrentUserId(): string {
  // This is imported dynamically in the server-side code
  // to avoid issues with Next.js server/client separation
  throw new Error('getCurrentUserId should not be called directly. Use getOrCreateUserId from auth.ts in server components.')
} 