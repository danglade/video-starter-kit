"use client";

import { AVAILABLE_ENDPOINTS } from "@/lib/fal";
import type { PlayerRef } from "@remotion/player";
import { createContext, useContext } from "react";
import { createStore } from "zustand";
import { useStore } from "zustand/react";

export const LAST_PROJECT_ID_KEY = "__aivs_lastProjectId";

export type MediaType = "image" | "video" | "voiceover" | "music";

export type GenerateData = {
  prompt: string;
  image?: File | string | null;
  video_url?: File | string | null;
  audio_url?: File | string | null;
  duration: number;
  voice: string;
  [key: string]: any;
};

interface VideoProjectProps {
  projectId: string;
  projectDialogOpen: boolean;
  player: PlayerRef | null;
  playerCurrentTimestamp: number;
  playerState: "playing" | "paused";
  generateDialogOpen: boolean;
  generateMediaType: MediaType;
  selectedMediaId: string | null;
  selectedKeyframes: string[];
  generateData: GenerateData;
  exportDialogOpen: boolean;
  endpointId: string;
  // Image comparison state
  compareMode: boolean;
  selectedForComparison: string[];
  comparisonDialogOpen: boolean;
  // Anime production state
  selectedEpisodeId: string | null;
  selectedSceneId: string | null;
}

interface VideoProjectState extends VideoProjectProps {
  setProjectId: (projectId: string) => void;
  setProjectDialogOpen: (open: boolean) => void;
  resetGenerateData: () => void;
  setPlayer: (player: PlayerRef) => void;
  setPlayerCurrentTimestamp: (timestamp: number) => void;
  setPlayerState: (state: "playing" | "paused") => void;
  setGenerateMediaType: (mediaType: MediaType) => void;
  openGenerateDialog: (mediaType?: MediaType) => void;
  closeGenerateDialog: () => void;
  setSelectedMediaId: (mediaId: string | null) => void;
  selectKeyframe: (frameId: string) => void;
  setGenerateData: (generateData: Partial<GenerateData>) => void;
  setExportDialogOpen: (open: boolean) => void;
  setEndpointId: (endpointId: string) => void;
  onGenerate: () => void;
  // Image comparison actions
  setCompareMode: (enabled: boolean) => void;
  toggleImageForComparison: (mediaId: string) => void;
  clearComparisonSelection: () => void;
  setComparisonDialogOpen: (open: boolean) => void;
  // Anime production actions
  setSelectedEpisodeId: (episodeId: string | null) => void;
  setSelectedSceneId: (sceneId: string | null) => void;
}

const DEFAULT_PROPS: VideoProjectProps = {
  projectId: "",
  endpointId: AVAILABLE_ENDPOINTS[0].endpointId,
  projectDialogOpen: false,
  player: null,
  playerCurrentTimestamp: 0,
  playerState: "paused",
  generateDialogOpen: false,
  generateMediaType: "image",
  selectedMediaId: null,
  selectedKeyframes: [],
  generateData: {
    prompt: "",
    image: null,
    duration: 30,
    voice: "",
    video_url: null,
    audio_url: null,
  },
  exportDialogOpen: false,
  // Image comparison defaults
  compareMode: false,
  selectedForComparison: [],
  comparisonDialogOpen: false,
  // Anime production defaults
  selectedEpisodeId: null,
  selectedSceneId: null,
};

type VideoProjectStore = ReturnType<typeof createVideoProjectStore>;

export const createVideoProjectStore = (
  initProps?: Partial<VideoProjectProps>,
) => {
  return createStore<VideoProjectState>()((set, state) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    projectDialogOpen: initProps?.projectId ? false : true,
    setEndpointId: (endpointId: string) => set({ endpointId }),
    setProjectId: (projectId: string) => set({ projectId }),
    setProjectDialogOpen: (projectDialogOpen: boolean) =>
      set({ projectDialogOpen }),
    setGenerateData: (generateData: Partial<GenerateData>) =>
      set({
        generateData: Object.assign({}, state().generateData, generateData),
      }),
    resetGenerateData: () =>
      set({
        generateData: {
          ...state().generateData,
          prompt: "",
          duration: 30,
          image: null,
          video_url: null,
          audio_url: null,
          voice: "",
        },
      }),
    // [NOTE]: This is a placeholder function
    onGenerate: () => {},
    setPlayer: (player: PlayerRef) => set({ player }),
    setPlayerCurrentTimestamp: (playerCurrentTimestamp: number) =>
      set({ playerCurrentTimestamp }),
    setPlayerState: (playerState: "playing" | "paused") => set({ playerState }),
    setGenerateMediaType: (generateMediaType: MediaType) =>
      set({ generateMediaType }),
    openGenerateDialog: (mediaType) =>
      set({
        generateDialogOpen: true,
        generateMediaType: mediaType ?? state().generateMediaType,
      }),
    closeGenerateDialog: () => set({ generateDialogOpen: false }),
    setSelectedMediaId: (selectedMediaId: string | null) =>
      set({ selectedMediaId }),
    selectKeyframe: (frameId: string) => {
      const selected = state().selectedKeyframes;
      if (selected.includes(frameId)) {
        set({
          selectedKeyframes: selected.filter((id) => id !== frameId),
        });
      } else {
        set({ selectedKeyframes: [...selected, frameId] });
      }
    },
    setExportDialogOpen: (exportDialogOpen: boolean) =>
      set({ exportDialogOpen }),
    // Image comparison actions
    setCompareMode: (compareMode: boolean) => 
      set({ compareMode, selectedForComparison: compareMode ? [] : state().selectedForComparison }),
    toggleImageForComparison: (mediaId: string) => {
      const selected = state().selectedForComparison;
      if (selected.includes(mediaId)) {
        set({ selectedForComparison: selected.filter(id => id !== mediaId) });
      } else if (selected.length < 2) {
        set({ selectedForComparison: [...selected, mediaId] });
      }
    },
    clearComparisonSelection: () => set({ selectedForComparison: [] }),
    setComparisonDialogOpen: (comparisonDialogOpen: boolean) => 
      set({ comparisonDialogOpen }),
    // Anime production actions
    setSelectedEpisodeId: (selectedEpisodeId: string | null) => set({ selectedEpisodeId }),
    setSelectedSceneId: (selectedSceneId: string | null) => set({ selectedSceneId }),
  }));
};

export const VideoProjectStoreContext = createContext<VideoProjectStore>(
  createVideoProjectStore(),
);

export function useVideoProjectStore<T>(
  selector: (state: VideoProjectState) => T,
): T {
  const store = useContext(VideoProjectStoreContext);
  return useStore(store, selector);
}

export function useProjectId() {
  return useVideoProjectStore((s) => s.projectId);
}
