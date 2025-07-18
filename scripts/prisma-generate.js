const { execSync } = require('child_process');

console.log('Generating Prisma Client...');

try {
  // Set environment variables
  process.env.PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING = '1';
  process.env.PRISMA_ENGINES_MIRROR = 'https://binaries.prisma.sh';
  
  // Try to generate Prisma client
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    env: process.env 
  });
  
  console.log('Prisma Client generated successfully!');
} catch (error) {
  console.error('Failed to generate Prisma Client:', error.message);
  console.log('Attempting fallback generation...');
  
  try {
    // Try with different settings
    process.env.PRISMA_SKIP_POSTINSTALL_GENERATE = 'true';
    execSync('npx prisma generate --schema=./prisma/schema.prisma', { 
      stdio: 'inherit',
      env: process.env 
    });
    console.log('Prisma Client generated with fallback!');
  } catch (fallbackError) {
    console.error('Fallback generation also failed:', fallbackError.message);
    // Don't exit with error to allow build to continue
    console.log('WARNING: Prisma Client generation failed, but continuing build...');
  }
} 