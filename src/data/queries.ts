import {
  keepPreviousData,
  type QueryClient,
  useQuery,
} from "@tanstack/react-query";
import { db } from "./db";
import {
  MediaItem,
  PROJECT_PLACEHOLDER,
  VideoKeyFrame,
  VideoTrack,
} from "./schema";

export const queryKeys = {
  projects: ["projects"],
  project: (projectId: string) => ["project", projectId],
  projectMediaItems: (projectId: string) => ["mediaItems", projectId],
  projectMedia: (projectId: string, jobId: string) => [
    "media",
    projectId,
    jobId,
  ],
  projectTracks: (projectId: string) => ["tracks", projectId],
  projectPreview: (projectId: string) => ["preview", projectId],
  characters: ["characters"],
  character: (characterId: string) => ["character", characterId],
  projectCharacters: (projectId: string) => ["characters", projectId],
  // Anime production keys
  projectEpisodes: (projectId: string) => ["episodes", projectId],
  episode: (episodeId: string) => ["episode", episodeId],
  episodeScenes: (episodeId: string) => ["scenes", episodeId],
  scene: (sceneId: string) => ["scene", sceneId],
  sceneShots: (sceneId: string) => ["shots", sceneId],
  shot: (shotId: string) => ["shot", shotId],
};

export const refreshVideoCache = async (
  queryClient: QueryClient,
  projectId: string,
) =>
  Promise.all([
    queryClient.invalidateQueries({
      queryKey: queryKeys.projectTracks(projectId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.projectPreview(projectId),
    }),
    queryClient.invalidateQueries({
      queryKey: ["frames"],
      exact: false, // This will invalidate all queries starting with ["frames"]
    }),
  ]);

export const useProject = (projectId: string) => {
  return useQuery({
    queryKey: queryKeys.project(projectId),
    enabled: !!projectId,
    queryFn: async () =>
      (await db.projects.find(projectId)) ?? PROJECT_PLACEHOLDER,
  });
};

export const useProjects = () => {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: db.projects.list,
  });
};

export const useProjectMediaItems = (projectId: string) => {
  return useQuery({
    queryKey: queryKeys.projectMediaItems(projectId),
    queryFn: () => db.media.mediaByProject(projectId),
    enabled: !!projectId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
};

export type VideoCompositionData = {
  tracks: VideoTrack[];
  frames: Record<string, VideoKeyFrame[]>;
  mediaItems: Record<string, MediaItem>;
};

export const EMPTY_VIDEO_COMPOSITION: VideoCompositionData = {
  tracks: [],
  frames: {},
  mediaItems: {},
};

export const useVideoComposition = (projectId: string) =>
  useQuery({
    queryKey: queryKeys.projectPreview(projectId),
    enabled: !!projectId,
    queryFn: async () => {
      if (!projectId) return EMPTY_VIDEO_COMPOSITION;
      const tracks = await db.tracks.tracksByProject(projectId);
      const frames = (
        await Promise.all(
          tracks.map((track) => db.keyFrames.keyFramesByTrack(track.id)),
        )
      ).flatMap((f) => f);
      const mediaItems = await db.media.mediaByProject(projectId);
      return {
        tracks,
        frames: Object.fromEntries(
          tracks.map((track) => [
            track.id,
            frames.filter((f) => f.trackId === track.id),
          ]),
        ),
        mediaItems: Object.fromEntries(
          mediaItems.map((item) => [item.id, item]),
        ),
      } satisfies VideoCompositionData;
    },
  });

export const useCharacters = () => {
  return useQuery({
    queryKey: queryKeys.characters,
    queryFn: async () => db.characters.all(),
  });
};

export const useProjectCharacters = (projectId: string) => {
  return useQuery({
    queryKey: queryKeys.projectCharacters(projectId),
    enabled: !!projectId,
    queryFn: async () => db.characters.byProject(projectId),
  });
};

export const useCharacter = (characterId: string) => {
  return useQuery({
    queryKey: queryKeys.character(characterId),
    enabled: !!characterId,
    queryFn: async () => db.characters.find(characterId),
  });
};

// Anime production queries
export const useProjectEpisodes = (projectId: string) => {
  return useQuery({
    queryKey: queryKeys.projectEpisodes(projectId),
    enabled: !!projectId,
    queryFn: async () => db.episodes.listByProject(projectId),
  });
};

export const useEpisode = (episodeId: string) => {
  return useQuery({
    queryKey: queryKeys.episode(episodeId),
    enabled: !!episodeId,
    queryFn: async () => db.episodes.find(episodeId),
  });
};

export const useEpisodeScenes = (episodeId: string) => {
  return useQuery({
    queryKey: queryKeys.episodeScenes(episodeId),
    enabled: !!episodeId,
    queryFn: async () => db.scenes.listByEpisode(episodeId),
  });
};

export const useScene = (sceneId: string) => {
  return useQuery({
    queryKey: queryKeys.scene(sceneId),
    enabled: !!sceneId,
    queryFn: async () => db.scenes.find(sceneId),
  });
};

export const useSceneShots = (sceneId: string) => {
  return useQuery({
    queryKey: queryKeys.sceneShots(sceneId),
    enabled: !!sceneId,
    queryFn: async () => db.shots.listByScene(sceneId),
  });
};

export const useShot = (shotId: string) => {
  return useQuery({
    queryKey: queryKeys.shot(shotId),
    enabled: !!shotId,
    queryFn: async () => db.shots.find(shotId),
  });
};
