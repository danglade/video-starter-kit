export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fal } from "@fal-ai/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("FAL webhook received:", body);

    // Extract event type from the body
    // FAL webhooks include the model in the body
    const model = body.model || "";
    const logs = body.logs || [];
    
    // Check logs for model information if not in model field
    const logModel = logs.find((log: any) => log.message?.includes("model"))?.message || "";
    
    console.log("Webhook model:", model, "Log model:", logModel);

    // Route based on event type
    if (model.includes("flux-lora-fast-training") || model.includes("lora") || logModel.includes("lora")) {
      // LoRA training completion
      return handleLoraTraining(body);
    } else if (model.includes("runway") || model.includes("video")) {
      // Video generation completion
      return handleVideoGeneration(body);
    } else if (model.includes("image") || model.includes("flux")) {
      // Image generation completion
      return handleImageGeneration(body);
    } else {
      console.warn("Unknown webhook event type:", model);
      return NextResponse.json({ received: true, model });
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
  const { request_id, status, output } = body;

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
      // Generate a thumbnail for the character using the trained LoRA
      const thumbnailResult = await fal.subscribe("fal-ai/flux-lora", {
        input: {
          prompt: `Professional portrait photo of a person, high quality, studio lighting`,
          loras: [
            {
              path: output.diffusers_lora_file.url,
              scale: 1.0,
            },
          ],
          image_size: "square",
          num_images: 1,
        },
      });

      const thumbnailUrl = thumbnailResult.data?.images?.[0]?.url || null;

      // Update character with completion status
      await prisma.character.update({
        where: { id: character.id },
        data: {
          trainingStatus: "completed",
          loraModelUrl: output.diffusers_lora_file.url,
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
          loraModelUrl: output.diffusers_lora_file.url,
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