import { fal } from "@/lib/fal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "./db";
import { queryKeys } from "./queries";
import type { VideoProject, Episode, Scene, Shot } from "./schema";

export const useProjectUpdater = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (project: Partial<VideoProject>) =>
      db.projects.update(projectId, project),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
    },
  });
};

export const useProjectCreator = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (project: Omit<VideoProject, "id">) =>
      db.projects.create(project),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
};

type JobCreatorParams = {
  projectId: string;
  endpointId: string;
  mediaType: "video" | "image" | "voiceover" | "music";
  input: Record<string, any>;
};

export const useJobCreator = ({
  projectId,
  endpointId,
  mediaType,
  input,
}: JobCreatorParams) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fal.queue.submit(endpointId, {
        input,
      }),
    onSuccess: async (data) => {
      await db.media.create({
        projectId,
        createdAt: Date.now(),
        mediaType,
        kind: "generated",
        endpointId,
        requestId: data.request_id,
        status: "pending",
        input,
      });

      await queryClient.invalidateQueries({
        queryKey: queryKeys.projectMediaItems(projectId),
      });
    },
  });
};

// Anime production mutations
export const useEpisodeCreator = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (episode: Omit<Episode, "id" | "createdAt" | "updatedAt">) =>
      db.episodes.create(episode),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectEpisodes(projectId) });
    },
  });
};

export const useEpisodeUpdater = (episodeId: string, projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (episode: Partial<Episode>) =>
      db.episodes.update(episodeId, episode),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.episode(episodeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projectEpisodes(projectId) });
    },
  });
};

export const useSceneCreator = (episodeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scene: Omit<Scene, "id" | "createdAt" | "updatedAt">) =>
      db.scenes.create(scene),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.episodeScenes(episodeId) });
    },
  });
};

export const useSceneUpdater = (sceneId: string, episodeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scene: Partial<Scene>) =>
      db.scenes.update(sceneId, scene),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scene(sceneId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.episodeScenes(episodeId) });
    },
  });
};

export const useShotCreator = (sceneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shot: Omit<Shot, "id" | "createdAt" | "updatedAt">) =>
      db.shots.create(shot),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sceneShots(sceneId) });
    },
  });
};

export const useShotUpdater = (shotId: string, sceneId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shot: Partial<Shot>) =>
      db.shots.update(shotId, shot),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shot(shotId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sceneShots(sceneId) });
    },
  });
};
