export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { serverDb } from '@/data/db-server'

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Thumbnail webhook received:', JSON.stringify(body, null, 2));
    
    // Extract character ID from URL query parameters
    const url = new URL(request.url);
    const characterId = url.searchParams.get('character_id');
    console.log('Character ID from query:', characterId);
    
    if (!characterId) {
      console.error('No character ID in query parameters');
      return NextResponse.json(
        { error: 'No character ID provided' },
        { status: 400 }
      );
    }
    
    const character = await serverDb.characters.find(characterId);
    
    if (!character) {
      console.error('Character not found:', characterId);
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }
    
    // Handle the fal.ai webhook format
    if (body.status === 'OK' && body.payload) {
      const output = body.payload;
      console.log('Thumbnail generation completed');
      
      // Extract the image URL
      const thumbnailUrl = output.images?.[0]?.url;
      console.log('Thumbnail URL found:', thumbnailUrl);
      
      if (thumbnailUrl) {
        // Update character with thumbnail URL
        await serverDb.characters.update(characterId, {
          thumbnailUrl,
        });
        
        console.log('Character thumbnail updated successfully');
      } else {
        console.error('No thumbnail URL in output');
      }
      
      return NextResponse.json({ success: true });
      
    } else if (body.images && Array.isArray(body.images)) {
      // Handle direct output format (fallback)
      const thumbnailUrl = body.images[0]?.url;
      
      if (thumbnailUrl) {
        await serverDb.characters.update(characterId, {
          thumbnailUrl,
        });
        console.log('Character thumbnail updated successfully (direct format)');
      }
      
      return NextResponse.json({ success: true });
      
    } else if (body.status === 'FAILED' || body.error) {
      console.error('Thumbnail generation failed:', body.error);
      return NextResponse.json({ success: true }); // Still return success to acknowledge
    }
    
    console.log('Unknown thumbnail webhook format:', body);
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Thumbnail webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 