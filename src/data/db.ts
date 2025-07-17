import { clientDb } from './db-client'

// Export the client database adapter as the main db interface
// This will now use API routes instead of IndexedDB
export const db = clientDb
