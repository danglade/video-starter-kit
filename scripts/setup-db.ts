#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * This script helps set up your Neon database for the video starter kit.
 * 
 * Prerequisites:
 * 1. Create a Neon account at https://console.neon.tech/
 * 2. Create a new database
 * 3. Copy your connection string
 * 4. Set DATABASE_URL in your .env.local file
 * 
 * Usage:
 * npm run setup-db
 */

console.log('🚀 Video Starter Kit - Database Setup\n');

console.log('📋 Setup Instructions:\n');
console.log('1. Create a Neon account at https://console.neon.tech/');
console.log('2. Create a new database in your Neon dashboard');
console.log('3. Copy your connection string (it looks like: postgresql://user:pass@host/db)');
console.log('4. Create a .env.local file in your project root with:');
console.log('   DATABASE_URL="your-connection-string"');
console.log('   TEMP_USER_ID="dev-user-001"\n');

console.log('5. Run the following commands:');
console.log('   npx prisma generate');
console.log('   npx prisma db push\n');

console.log('📝 Notes:');
console.log('- The TEMP_USER_ID is temporary until authentication is implemented');
console.log('- Each user will have their own isolated projects and media');
console.log('- Make sure to add ?sslmode=require to your connection string\n');

console.log('✅ Once complete, your database will be ready to use!');
console.log('🎬 Start the development server with: npm run dev\n'); 