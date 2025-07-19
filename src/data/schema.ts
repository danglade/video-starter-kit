export type AspectRatio = "16:9" | "9:16" | "1:1";

// Visual styles for anime projects
export type VisualStyle = "shonen_tv" | "ghibli_soft" | "modern_manhwa" | "classic_ova";

export type ProjectCategory = "action" | "romance" | "fantasy" | "scifi" | "slice_of_life" | "comedy" | "drama" | "thriller";

export type VideoProject = {
  id: string;
  title: string;
  description: string;
  aspectRatio: AspectRatio;
  // New anime-specific fields
  visualStyle?: VisualStyle;
  categories?: ProjectCategory[];
  episodeCount?: number;
  synopsis?: string;
};

export const PROJECT_PLACEHOLDER: VideoProject = {
  id: "",
  title: "",
  description: "",
  aspectRatio: "16:9",
};

export type VideoTrackType = "video" | "music" | "voiceover";

export const TRACK_TYPE_ORDER: Record<VideoTrackType, number> = {
  video: 1,
  music: 2,
  voiceover: 3,
};

export type VideoTrack = {
  id: string;
  locked: boolean;
  label: string;
  type: VideoTrackType;
  projectId: string;
};

export const MAIN_VIDEO_TRACK: VideoTrack = {
  id: "main",
  locked: true,
  label: "Main",
  type: "video",
  projectId: PROJECT_PLACEHOLDER.id,
};

export type VideoKeyFrame = {
  id: string;
  timestamp: number;
  duration: number;
  trackId: string;
  data: KeyFrameData;
};

export type KeyFrameData = {
  type: "prompt" | "image" | "video" | "voiceover" | "music";
  mediaId: string;
} & (
  | {
      type: "prompt";
      prompt: string;
    }
  | {
      type: "image";
      prompt: string;
      url: string;
    }
  | {
      type: "video";
      prompt: string;
      url: string;
    }
);

export type MediaItem = {
  id: string;
  projectId: string;
  createdAt: number;
  mediaType: "image" | "video" | "music" | "voiceover";
  kind: "generated" | "uploaded";
  endpointId?: string;
  requestId?: string;
  status: "pending" | "running" | "completed" | "failed";
  input?: any;
  output?: any;
  url?: string;
  metadata?: any;
};

export type Character = {
  id: string;
  userId: string;
  projectId?: string | null;
  name: string;
  description?: string | null;
  loraUrl?: string | null;
  thumbnailUrl?: string | null;
  trainingStatus: 'pending' | 'uploading' | 'training' | 'completed' | 'failed';
  trainingJobId?: string | null;
  trainingImages?: string[] | null;
  trainingError?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// New types for anime production
export type Episode = {
  id: string;
  projectId: string;
  episodeNumber: number;
  title: string;
  synopsis?: string;
  duration?: number; // in seconds
  status: 'planning' | 'storyboard' | 'production' | 'post_production' | 'completed';
  createdAt: Date;
  updatedAt: Date;
};

export type Scene = {
  id: string;
  episodeId: string;
  sceneNumber: number;
  title: string;
  description?: string;
  duration?: number; // in seconds
  sceneType: 'action' | 'dialogue' | 'establishing' | 'transition' | 'montage';
  mood?: 'tense' | 'happy' | 'sad' | 'exciting' | 'calm' | 'mysterious';
  setting?: string;
  status: 'planned' | 'generating' | 'generated' | 'approved';
  createdAt: Date;
  updatedAt: Date;
};

export type Shot = {
  id: string;
  sceneId: string;
  shotNumber: number;
  duration: number; // in seconds
  cameraType: 'wide' | 'medium' | 'close_up' | 'extreme_close_up' | 'establishing' | 'pov' | 'over_shoulder';
  cameraMovement?: 'static' | 'pan' | 'tilt' | 'zoom_in' | 'zoom_out' | 'tracking' | 'dolly';
  description?: string;
  mediaId?: string; // Reference to generated video in MediaItem
  dialogueText?: string;
  characterIds?: string[]; // Characters appearing in this shot
  status: 'planned' | 'generating' | 'generated' | 'approved';
  createdAt: Date;
  updatedAt: Date;
};
