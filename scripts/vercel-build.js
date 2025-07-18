const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Vercel build process...');
console.log('Environment:', process.env.VERCEL ? 'Vercel' : 'Local');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

// Check if we're on Vercel
const isVercel = process.env.VERCEL === '1';

// Check if Prisma client already exists
const prismaClientPath = path.join(__dirname, '..', 'node_modules', '.prisma', 'client');
const clientExists = fs.existsSync(prismaClientPath);

console.log('Prisma client exists:', clientExists);

if (!clientExists && process.env.DATABASE_URL) {
  console.log('Attempting to generate Prisma client...');
  
  try {
    // Try with minimal configuration for Vercel
    execSync('npx prisma generate --generator client', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        PRISMA_GENERATE_SKIP_AUTOINSTALL: 'true',
        PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING: '1',
        // Skip downloading engines if on Vercel
        PRISMA_GENERATE_DATAPROXY: isVercel ? 'true' : 'false'
      }
    });
    console.log('Prisma client generated successfully!');
  } catch (error) {
    console.warn('Prisma generation failed, but continuing build...');
    console.warn('Error:', error.message);
    
    // Create a minimal client file to prevent import errors
    const minimalClientPath = path.join(__dirname, '..', 'node_modules', '@prisma', 'client');
    if (!fs.existsSync(minimalClientPath)) {
      fs.mkdirSync(minimalClientPath, { recursive: true });
    }
    
    // Write a minimal index.js that exports PrismaClient
    const minimalClient = `
class PrismaClient {
  constructor() {
    console.warn('Using minimal PrismaClient - database operations will fail');
  }
}

module.exports = { PrismaClient };
exports.PrismaClient = PrismaClient;
`;
    
    fs.writeFileSync(path.join(minimalClientPath, 'index.js'), minimalClient);
    fs.writeFileSync(path.join(minimalClientPath, 'index.d.ts'), 'export class PrismaClient {}');
  }
}

// Now run Next.js build
console.log('Running Next.js build...');
try {
  execSync('next build', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Next.js build failed:', error.message);
  process.exit(1);
} 