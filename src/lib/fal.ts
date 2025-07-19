"use client";

import { createFalClient } from "@fal-ai/client";

export const fal = createFalClient({
  credentials: () => typeof window !== 'undefined' ? localStorage?.getItem("falKey") as string : undefined,
  proxyUrl: "/api/fal",
});

export type InputAsset =
  | "video"
  | "image"
  | "audio"
  | {
      type: "video" | "image" | "audio";
      key: string;
    };

export type ApiInfo = {
  endpointId: string;
  label: string;
  description: string;
  cost: string;
  inferenceTime?: string;
  inputMap?: Record<string, string>;
  inputAsset?: InputAsset[];
  initialInput?: Record<string, unknown>;
  cameraControl?: boolean;
  imageForFrame?: boolean;
  category: "image" | "video" | "music" | "voiceover";
  prompt?: boolean;
};

export const AVAILABLE_ENDPOINTS: ApiInfo[] = [
  // Image generation endpoints removed - images are now generated using characters only
  {
    endpointId: "fal-ai/kling-video/v1.6/pro/image-to-video",
    label: "Kling 1.6 Pro",
    description: "Generate video clips from your images using Kling 1.6 (pro)",
    cost: "",
    category: "video",
    inputAsset: ["image"],
    initialInput: {
      duration: "5",
      aspect_ratio: "16:9",
      negative_prompt: "blur, distort, and low quality",
      cfg_scale: 0.5,
    },
  },
  {
    endpointId: "fal-ai/minimax-music",
    label: "Minimax Music",
    description:
      "Advanced AI techniques to create high-quality, diverse musical compositions",
    cost: "",
    category: "music",
    inputAsset: [
      {
        type: "audio",
        key: "reference_audio_url",
      },
    ],
  },
  {
    endpointId: "fal-ai/stable-audio",
    label: "Stable Audio",
    description: "Stable Diffusion music creation with high-quality tracks",
    cost: "",
    category: "music",
  },
  {
    endpointId: "fal-ai/playht/tts/v3",
    label: "PlayHT TTS v3",
    description: "Fluent and faithful speech with flow matching",
    cost: "",
    category: "voiceover",
    initialInput: {
      voice: "Dexter (English (US)/American)",
    },
  },
  {
    endpointId: "fal-ai/playai/tts/dialog",
    label: "PlayAI Text-to-Speech Dialog",
    description:
      "Generate natural-sounding multi-speaker dialogues. Perfect for expressive outputs, storytelling, games, animations, and interactive media.",
    cost: "",
    category: "voiceover",
    inputMap: {
      prompt: "input",
    },
    initialInput: {
      voices: [
        {
          voice: "Jennifer (English (US)/American)",
          turn_prefix: "Speaker 1: ",
        },
        {
          voice: "Furio (English (IT)/Italian)",
          turn_prefix: "Speaker 2: ",
        },
      ],
    },
  },
  {
    endpointId: "fal-ai/f5-tts",
    label: "F5 TTS",
    description: "Fluent and faithful speech with flow matching",
    cost: "",
    category: "voiceover",
    initialInput: {
      ref_audio_url:
        "https://github.com/SWivid/F5-TTS/raw/21900ba97d5020a5a70bcc9a0575dc7dec5021cb/tests/ref_audio/test_en_1_ref_short.wav",
      ref_text: "Some call me nature, others call me mother nature.",
      model_type: "F5-TTS",
      remove_silence: true,
    },
  },
  {
    endpointId: "fal-ai/topaz/upscale/video",
    label: "Topaz Video Upscale",
    description:
      "Professional-grade video upscaling using Topaz technology. Enhance your videos with high-quality upscaling.",
    cost: "",
    category: "video",
    prompt: false,
    inputAsset: ["video"],
  },
  {
    endpointId: "fal-ai/creative-upscaler",
    label: "Creative Upscaler",
    description:
      "Upscale images with creative enhancement. Adds details and improves quality while preserving the original style.",
    cost: "",
    category: "image",
    prompt: true, // Optional prompt for creative guidance
    inputAsset: ["image"],
    initialInput: {
      scale: 2, // 2x upscaling by default
      creativity: 0.3, // Balance between preservation and enhancement
    },
  },
  {
    endpointId: "fal-ai/clarity-upscaler",
    label: "Clarity Upscaler",
    description:
      "Fast and efficient image upscaling focused on clarity and sharpness. Best for photos and realistic images.",
    cost: "",
    category: "image",
    prompt: false,
    inputAsset: ["image"],
    initialInput: {
      scale: 2, // 2x upscaling
    },
  },
  {
    endpointId: "fal-ai/aura-sr",
    label: "Aura SR",
    description:
      "State-of-the-art GAN-based single image super-resolution. Excellent for 4x upscaling with natural results.",
    cost: "",
    category: "image",
    prompt: false,
    inputAsset: ["image"],
    initialInput: {
      upscaling_factor: 4, // 4x upscaling
    },
  },
];
