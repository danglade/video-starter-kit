# Neon Database Setup Guide

Follow these steps to set up your Neon PostgreSQL database for the Video Starter Kit.

## Step 1: Create Neon Account

1. Go to [https://console.neon.tech/](https://console.neon.tech/)
2. Sign up for a free account
3. Create a new project

## Step 2: Get Connection String

1. In your Neon dashboard, click on your project
2. Go to the "Connection Details" section
3. Copy the connection string (it looks like: `postgresql://user:password@host/database`)
4. **Important**: Make sure to append `?sslmode=require` to the end of the connection string

## Step 3: Configure Environment

1. Create a `.env.local` file in your project root:

```bash
# Neon Database URL
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
```

2. Replace the connection string with your actual Neon connection string

## Step 4: Generate Prisma Client

```bash
npm run db:generate
```

This generates the Prisma client based on your schema.

## Step 5: Push Schema to Database

```bash
npm run db:push
```

This creates all the necessary tables in your Neon database.

## Step 6: Test Database Connection

```bash
npm run db:test
```

This will:
- Test the database connection
- Create a test user and project
- Clean up the test data

If successful, you should see:
```
✅ Database connected successfully
✅ Test user created
✅ Test project created
✅ Test data cleaned up
```

## Step 7: Start the Application

```bash
npm run dev
```

## Troubleshooting

### Foreign Key Constraint Error

If you see `Foreign key constraint violated on the constraint: Project_userId_fkey`, it means:
- The database schema is not properly initialized
- Run `npm run db:push` again

### Connection Failed

If the connection fails:
- Check your DATABASE_URL format
- Ensure `?sslmode=require` is included
- Verify your Neon project is active

### Multiple Users Being Created

This is normal during development. Each browser session gets its own temporary user ID.

## Next Steps

Once everything is working:
1. Open the app at http://localhost:3000
2. The first time you open it, a template project will be created
3. Each browser/session will have its own isolated data
4. Use Prisma Studio to view your data: `npm run db:studio` 