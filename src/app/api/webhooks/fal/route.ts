export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fal } from "@fal-ai/client";
import { TRAINING_CONFIG, generateTriggerWord } from "@/config/training";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("FAL webhook received:", body);

    // Extract event type from the body
    // Check various fields to determine the webhook type
    const model = body.model || "";
    const hasLoraFile = body.payload?.diffusers_lora_file || body.output?.diffusers_lora_file;
    const requestId = body.request_id || body.requestId;
    
    console.log("Webhook detection:", {
      model,
      hasLoraFile: !!hasLoraFile,
      requestId,
      status: body.status,
      hasPayload: !!body.payload
    });

    // Route based on webhook content
    if (hasLoraFile || model.includes("lora") || model.includes("flux-lora-fast-training")) {
      // LoRA training completion - detected by presence of diffusers_lora_file
      console.log("Routing to LoRA training handler");
      return handleLoraTraining(body);
    } else if (model.includes("runway") || model.includes("video")) {
      // Video generation completion
      return handleVideoGeneration(body);
    } else if (model.includes("image") || model.includes("flux")) {
      // Image generation completion
      return handleImageGeneration(body);
    } else {
      console.warn("Unknown webhook event type:", { model, body: JSON.stringify(body) });
      return NextResponse.json({ received: true, model, body });
    }
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleLoraTraining(body: any) {
  // Handle different webhook payload structures
  const request_id = body.request_id || body.requestId;
  const status = body.status === 'OK' ? 'completed' : (body.status || 'unknown');
  const output = body.payload || body.output || {};

  console.log("LoRA training handler:", { request_id, status, hasOutput: !!output });

  if (!request_id) {
    return NextResponse.json(
      { error: "Missing request_id" },
      { status: 400 }
    );
  }

  // Find the character by trainingJobId (this is what we store when submitting the job)
  const character = await prisma.character.findFirst({
    where: { trainingJobId: request_id },
  });

  if (!character) {
    console.error("Character not found for trainingJobId:", request_id);
    // Log all characters with training jobs for debugging
    const charactersWithJobs = await prisma.character.findMany({
      where: { trainingJobId: { not: null } },
      select: { id: true, name: true, trainingJobId: true }
    });
    console.log("Characters with training jobs:", charactersWithJobs);
    
    return NextResponse.json(
      { error: "Character not found", request_id },
      { status: 404 }
    );
  }

  if (status === "completed" && output?.diffusers_lora_file?.url) {
    console.log("Training completed, generating thumbnail for character:", character.id);
    
    try {
      // Get the trigger word for this character
      const triggerWord = generateTriggerWord(character.name);
      
      // Generate a thumbnail for the character using the trained LoRA
      const thumbnailResult = await fal.subscribe(TRAINING_CONFIG.THUMBNAIL.MODEL, {
        input: {
          prompt: `${triggerWord}, professional portrait photo, high quality, studio lighting, headshot`,
          loras: [
            {
              path: output.diffusers_lora_file.url,
              scale: 1.0,
            },
          ],
          image_size: TRAINING_CONFIG.THUMBNAIL.IMAGE_SIZE,
          num_images: 1,
          num_inference_steps: TRAINING_CONFIG.THUMBNAIL.NUM_INFERENCE_STEPS,
          guidance_scale: TRAINING_CONFIG.THUMBNAIL.GUIDANCE_SCALE,
          output_format: TRAINING_CONFIG.THUMBNAIL.OUTPUT_FORMAT,
        },
      });

      const thumbnailUrl = thumbnailResult.data?.images?.[0]?.url || null;

      // Update character with completion status
      await prisma.character.update({
        where: { id: character.id },
        data: {
          trainingStatus: "completed",
          loraUrl: output.diffusers_lora_file.url,
          thumbnailUrl,
          trainingError: null,
        },
      });

      console.log("Character training completed and updated:", character.id);
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      // Still mark as completed even if thumbnail fails
              await prisma.character.update({
          where: { id: character.id },
          data: {
            trainingStatus: "completed",
            loraUrl: output.diffusers_lora_file.url,
            trainingError: null,
          },
        });
    }
  } else if (status === "failed") {
    // Update character with error status
    await prisma.character.update({
      where: { id: character.id },
      data: {
        trainingStatus: "failed",
        trainingError: body.error || "Training failed",
      },
    });

    console.error("Character training failed:", character.id, body.error);
  }

  return NextResponse.json({ received: true, characterId: character.id });
}

async function handleVideoGeneration(body: any) {
  // TODO: Implement video generation webhook handling
  // This would update video generation status in the database
  console.log("Video generation webhook:", body);
  return NextResponse.json({ received: true, type: "video" });
}

async function handleImageGeneration(body: any) {
  // TODO: Implement image generation webhook handling
  // This could track image generation history or update UI state
  console.log("Image generation webhook:", body);
  return NextResponse.json({ received: true, type: "image" });
} 