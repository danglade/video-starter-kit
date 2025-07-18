export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { serverDb } from '@/data/db-server'
import { falServer } from '@/lib/fal-server'
import { TRAINING_CONFIG, generateTriggerWord } from '@/config/training'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const character = await serverDb.characters.find(params.id);
    
    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }
    
    if (!character.loraUrl) {
      return NextResponse.json(
        { error: 'Character has no LoRA URL' },
        { status: 400 }
      );
    }
    
    if (character.thumbnailUrl) {
      return NextResponse.json(
        { message: 'Thumbnail already exists', thumbnailUrl: character.thumbnailUrl },
        { status: 200 }
      );
    }
    
    console.log('Generating thumbnail for character:', character.name);
    
    try {
      // Generate the same trigger word used during training
      const triggerWord = generateTriggerWord(character.name);
      
      // Submit thumbnail generation job
      const result = await falServer.queue.submit(TRAINING_CONFIG.THUMBNAIL.MODEL, {
        input: {
          prompt: `Professional portrait photo of ${triggerWord}, high quality, detailed face, natural lighting, photorealistic`,
          image_size: TRAINING_CONFIG.THUMBNAIL.IMAGE_SIZE,
          num_inference_steps: TRAINING_CONFIG.THUMBNAIL.NUM_INFERENCE_STEPS,
          guidance_scale: TRAINING_CONFIG.THUMBNAIL.GUIDANCE_SCALE,
          num_images: 1,
          enable_safety_checker: true,
          output_format: TRAINING_CONFIG.THUMBNAIL.OUTPUT_FORMAT,
          loras: [
            {
              path: character.loraUrl
            }
          ]
        },
        webhookUrl: process.env.NEXT_PUBLIC_APP_URL 
          ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/thumbnail?character_id=${params.id}`
          : undefined,
      });
      
      console.log('Thumbnail generation job submitted:', result.request_id);
      
      return NextResponse.json({ 
        success: true, 
        jobId: result.request_id,
        message: 'Thumbnail generation started'
      });
      
    } catch (error) {
      console.error('Failed to start thumbnail generation:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('Failed to generate thumbnail:', error);
    return NextResponse.json(
      { error: 'Failed to generate thumbnail' },
      { status: 500 }
    );
  }
} 