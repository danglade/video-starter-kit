export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { serverDb } from '@/data/db-server'
import { falServer } from '@/lib/fal-server'
import { createImageZipServer } from '@/lib/zip-utils-server'
import { TRAINING_CONFIG, generateTriggerWord } from '@/config/training'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Parse optional request body
    let customSteps = TRAINING_CONFIG.DEFAULT_STEPS;
    try {
      const body = await request.json();
      if (body.steps && typeof body.steps === 'number') {
        customSteps = Math.max(
          TRAINING_CONFIG.MIN_STEPS,
          Math.min(TRAINING_CONFIG.MAX_STEPS, body.steps)
        );
      }
    } catch {
      // No body or invalid JSON, use default steps
    }
    
    const character = await serverDb.characters.find(params.id);
    
    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }
    
    if (!character.trainingImages || character.trainingImages.length === 0) {
      return NextResponse.json(
        { error: 'No training images found' },
        { status: 400 }
      );
    }
    
    if (character.trainingStatus === 'training' || character.trainingStatus === 'completed') {
      return NextResponse.json(
        { error: 'Training already in progress or completed' },
        { status: 400 }
      );
    }
    
    // Update status to training
    await serverDb.characters.update(params.id, {
      trainingStatus: 'training',
      trainingError: null,
    });
    
    try {
      // Create a zip file from the images
      console.log('Creating zip file from', character.trainingImages.length, 'images');
      const imagesZipUrl = await createImageZipServer(character.trainingImages, character.name);
      console.log('Zip file created:', imagesZipUrl);
      
      // Prepare training data according to fal.ai flux-lora-fast-training format
      const trainingData = {
        images_data_url: imagesZipUrl,
        trigger_word: generateTriggerWord(character.name),
        steps: customSteps,
        create_masks: true, // For portrait training
        is_style: false, // We're training a subject, not a style
      };
      
      // Get the webhook URL from environment or construct it
      const webhookUrl = process.env.NEXT_PUBLIC_APP_URL 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/fal?character_id=${params.id}`
        : undefined;
      
      console.log('Submitting training job with webhook:', webhookUrl);
      
      // Submit training job to fal.ai
      const result = await falServer.queue.submit(TRAINING_CONFIG.TRAINING_MODEL, {
        input: trainingData,
        webhookUrl,
      });
      
      console.log('Training job submitted:', result.request_id);
      
      // Update character with job ID
      await serverDb.characters.update(params.id, {
        trainingJobId: result.request_id,
      });
      
      return NextResponse.json({ 
        success: true, 
        jobId: result.request_id 
      });
      
    } catch (error) {
      // If submission fails, update status back to failed
      await serverDb.characters.update(params.id, {
        trainingStatus: 'failed',
        trainingError: error instanceof Error ? error.message : 'Failed to start training',
      });
      
      throw error;
    }
    
  } catch (error) {
    console.error('Failed to start training:', error);
    return NextResponse.json(
      { error: 'Failed to start training' },
      { status: 500 }
    );
  }
} 