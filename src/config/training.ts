/**
 * Configuration for LoRA training
 */

export const TRAINING_CONFIG = {
  // Default number of training steps
  DEFAULT_STEPS: 1000,
  
  // Minimum and maximum steps allowed
  MIN_STEPS: 500,
  MAX_STEPS: 4000,
  
  // Default trigger word prefix (not used anymore - keeping for backwards compatibility)
  TRIGGER_WORD_PREFIX: '',
  
  // Whether to use underscores in trigger words (not used anymore - keeping for backwards compatibility)
  USE_UNDERSCORES_IN_TRIGGER: true,
  
  // Training model endpoint
  TRAINING_MODEL: 'fal-ai/flux-lora-fast-training',
  
  // Image generation model endpoint (for using trained LoRAs)
  GENERATION_MODEL: 'fal-ai/flux-lora',
  
  // Image generation settings for thumbnails
  THUMBNAIL: {
    MODEL: 'fal-ai/flux-lora',
    IMAGE_SIZE: 'landscape_4_3' as const,
    NUM_INFERENCE_STEPS: 28,
    GUIDANCE_SCALE: 3.5,
    OUTPUT_FORMAT: 'jpeg' as const,
    PROMPT_TEMPLATE: 'character_name, portrait photo, high quality, studio lighting, headshot',
  }
};

/**
 * Generate a trigger word from a character name
 */
export function generateTriggerWord(characterName: string): string {
  // Always return the literal string "character_name" as the trigger word
  return "character_name";
} 