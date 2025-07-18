/**
 * Configuration for LoRA training
 */

export const TRAINING_CONFIG = {
  // Default number of training steps
  DEFAULT_STEPS: 1000,
  
  // Minimum and maximum steps allowed
  MIN_STEPS: 500,
  MAX_STEPS: 4000,
  
  // Default trigger word prefix (will be combined with character name)
  TRIGGER_WORD_PREFIX: '', // Empty by default, could be 'a photo of' or similar
  
  // Whether to use underscores in trigger words (john_doe vs john doe)
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
  }
};

/**
 * Generate a trigger word from a character name
 */
export function generateTriggerWord(characterName: string): string {
  const normalized = characterName.toLowerCase().trim();
  const withPrefix = TRAINING_CONFIG.TRIGGER_WORD_PREFIX 
    ? `${TRAINING_CONFIG.TRIGGER_WORD_PREFIX} ${normalized}`
    : normalized;
  
  return TRAINING_CONFIG.USE_UNDERSCORES_IN_TRIGGER 
    ? withPrefix.replace(/\s+/g, '_')
    : withPrefix;
} 