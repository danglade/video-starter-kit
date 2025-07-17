# Migration Guide: IndexedDB to Neon Database

This guide explains how to migrate your Video Starter Kit from local IndexedDB storage to Neon PostgreSQL database for multi-user support.

## Overview

The migration replaces browser-based IndexedDB storage with a cloud PostgreSQL database (Neon), enabling:
- Multi-user support with data isolation
- Server-side data persistence
- Scalability for production use
- Future authentication integration

## Architecture Changes

### Before (IndexedDB)
- Data stored locally in browser
- No user separation
- Data lost on browser clear
- No server persistence

### After (Neon + PostgreSQL)
- Data stored in cloud database
- User isolation via temporary IDs
- Persistent storage
- Ready for authentication

## Setup Instructions

### 1. Create Neon Database

1. Sign up at [https://console.neon.tech/](https://console.neon.tech/)
2. Create a new project
3. Copy your connection string (looks like: `postgresql://user:pass@host/database`)

### 2. Configure Environment

Create `.env.local` file in project root:

```bash
# Neon Database URL
DATABASE_URL="postgresql://user:pass@host/database?sslmode=require"

# Temporary user ID (optional, will auto-generate if not set)
TEMP_USER_ID="dev-user-001"
```

### 3. Install Dependencies

The required dependencies are already installed:
- `@prisma/client` - Database ORM
- `prisma` - CLI tool

### 4. Initialize Database

Run these commands to set up your database:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Open Prisma Studio to view data
npm run db:studio
```

## How It Works

### Temporary User System

Until proper authentication is implemented, the system uses temporary user IDs:

1. **Server-side**: Uses cookies to maintain consistent user ID
2. **Client-side**: Uses localStorage + cookies for persistence
3. **Auto-creation**: Users are created automatically on first use

Each user has isolated:
- Projects
- Media items
- Tracks and keyframes

### API Routes

All database operations now go through API routes:

- `/api/db/projects` - Project CRUD operations
- `/api/db/tracks` - Track management
- `/api/db/keyframes` - Keyframe operations
- `/api/db/media` - Media item management

### Data Flow

1. Client components use the same `db` interface
2. `db` now calls API routes instead of IndexedDB
3. API routes use Prisma to query PostgreSQL
4. User isolation happens automatically server-side

## Migration Checklist

- [x] Prisma schema created
- [x] API routes implemented
- [x] Client adapter created
- [x] Temporary user system
- [x] Seed data updated
- [ ] Set up Neon database
- [ ] Configure environment
- [ ] Run migrations
- [ ] Test functionality

## Testing

After setup, test the following:

1. **Project Creation**: Create a new project
2. **Media Upload**: Upload images/videos
3. **AI Generation**: Generate content with AI
4. **Timeline Editing**: Add/edit keyframes
5. **Export**: Export final video
6. **Persistence**: Refresh page, data should persist
7. **Multi-user**: Open incognito window, should have separate data

## Next Steps

### Adding Authentication

When ready to add proper authentication:

1. Install NextAuth.js or similar
2. Update `getOrCreateUserId()` to use real user IDs
3. Add login/signup pages
4. Update the User model with email, etc.

### Production Considerations

1. **Connection Pooling**: Neon supports connection pooling
2. **Caching**: Consider adding Redis for performance
3. **Rate Limiting**: Add API rate limits
4. **Monitoring**: Set up database monitoring
5. **Backups**: Configure automated backups

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check DATABASE_URL format
   - Ensure `?sslmode=require` is included
   - Verify Neon service is running

2. **Permission Errors**
   - User might not own the resource
   - Check user ID consistency

3. **Migration Errors**
   - Run `npx prisma generate` first
   - Ensure database is empty before first push

### Debug Mode

To debug user isolation:
```javascript
// In browser console
localStorage.getItem('__vsk_temp_user_id')
```

## Support

For issues or questions:
- Check the [GitHub repository](https://github.com/fal-ai-community/video-starter-kit)
- Review Neon documentation
- Check Prisma documentation 