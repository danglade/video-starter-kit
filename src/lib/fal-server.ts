import { createFalClient } from "@fal-ai/client";

// Server-side fal client that uses environment variables
export const falServer = createFalClient({
  credentials: process.env.FAL_KEY,
}); 