import { db } from "@/data/db";
import {
  TRACK_TYPE_ORDER,
  type MediaItem,
  type VideoTrack,
  type VideoKeyFrame,
} from "@/data/schema";
import { useProjectId, useVideoProjectStore } from "@/data/store";
import { cn, resolveDuration } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type DragEventHandler, useMemo, useState, useEffect } from "react";
import { VideoControls } from "./video-controls";
import { TimelineRuler } from "./video/timeline";
import { VideoTrackRow } from "./video/track";
import { queryKeys, refreshVideoCache } from "@/data/queries";

export default function BottomBar() {
  const queryClient = useQueryClient();
  const projectId = useProjectId();
  const playerCurrentTimestamp = useVideoProjectStore(
    (s) => s.playerCurrentTimestamp,
  );
  const formattedTimestamp =
    (playerCurrentTimestamp < 10 ? "0" : "") +
    playerCurrentTimestamp.toFixed(2);
  const minTrackWidth = `${((2 / 30) * 100).toFixed(2)}%`;
  const [dragOverTracks, setDragOverTracks] = useState(false);

  const limitAllKeyframesToThirtySeconds = useMutation({
    mutationFn: async () => {
      if (!projectId) return 0;
      
      const tracks = await db.tracks.tracksByProject(projectId);

      let updatedCount = 0;

      for (const track of tracks) {
        const keyframes = await db.keyFrames.keyFramesByTrack(track.id);

        for (const frame of keyframes) {
          if (frame.duration > 30000) {
            try {
              await db.keyFrames.update(frame.id, {
                duration: 30000,
              });
              updatedCount++;
            } catch (error) {
              console.warn(`Failed to update keyframe ${frame.id}:`, error);
              // Continue with other keyframes even if one fails
            }
          }
        }
      }

      return updatedCount;
    },
    onSuccess: (updatedCount) => {
      if (updatedCount > 0 && projectId) {
        refreshVideoCache(queryClient, projectId);
      }
    },
    onError: (error) => {
      console.error('Error limiting keyframes:', error);
    },
  });

  const { data: tracks = [] } = useQuery({
    queryKey: projectId ? queryKeys.projectTracks(projectId) : ['no-project'],
    queryFn: async () => {
      if (!projectId) return [];
      const result = await db.tracks.tracksByProject(projectId);
      return result.toSorted(
        (a, b) => TRACK_TYPE_ORDER[a.type] - TRACK_TYPE_ORDER[b.type],
      );
    },
    enabled: !!projectId,
  });

  const handleOnDragOver: DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    setDragOverTracks(true);
    const jobPayload = event.dataTransfer.getData("job");
    if (!jobPayload) return false;
    const job: MediaItem = JSON.parse(jobPayload);
    return job.status === "completed";
  };

  const addToTrack = useMutation({
    mutationFn: async (media: MediaItem) => {
      if (!projectId) return null;
      
      // Use current projectId instead of media.projectId
      const currentProjectId = projectId || media.projectId;
      const tracks = await db.tracks.tracksByProject(currentProjectId);
      const trackType = media.mediaType === "image" ? "video" : media.mediaType;
      let track = tracks.find((t) => t.type === trackType);
      if (!track) {
        const id = await db.tracks.create({
          projectId: currentProjectId,
          type: trackType,
          label: media.mediaType,
          locked: true,
        });
        const newTrack = await db.tracks.find(id.toString());
        if (!newTrack) return null;
        track = newTrack;
      }
      const keyframes = await db.keyFrames.keyFramesByTrack(track.id);

      const lastKeyframe = [...keyframes]
        .sort((a, b) => a.timestamp - b.timestamp)
        .reduce(
          (acc, frame) => {
            if (frame.timestamp + frame.duration > acc.timestamp + acc.duration)
              return frame;
            return acc;
          },
          { timestamp: 0, duration: 0 },
        );

      const mediaDuration = resolveDuration(media) ?? 5000;
      const duration = Math.min(mediaDuration, 30000);

      const newId = await db.keyFrames.create({
        trackId: track.id,
        data: {
          mediaId: media.id,
          type: media.input?.image_url ? "image" : "prompt",
          prompt: media.input?.prompt || "",
          url: media.input?.image_url?.url,
        },
        timestamp: lastKeyframe
          ? lastKeyframe.timestamp + 1 + lastKeyframe.duration
          : 0,
        duration,
      });
      return { keyframeId: newId, trackId: track.id };
    },
    onMutate: async (media: MediaItem) => {
      if (!projectId) return;
      
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ["frames"] });
      
      // Determine which track this will go to
      const tracks = await db.tracks.tracksByProject(projectId);
      const trackType = media.mediaType === "image" ? "video" : media.mediaType;
      let track = tracks.find((t) => t.type === trackType);
      
      // If no track exists yet, we'll create one optimistically
      if (!track) {
        track = {
          id: `temp-track-${Date.now()}`,
          projectId,
          type: trackType,
          label: media.mediaType,
          locked: true,
        } as VideoTrack;
        
        // Optimistically add the track
        queryClient.setQueryData(
          queryKeys.projectTracks(projectId),
          (old: VideoTrack[] = []) => [...old, track!]
        );
      }
      
      // Get current keyframes for the track
      const previousKeyframes = queryClient.getQueryData<VideoKeyFrame[]>(
        ["frames", track.id]
      ) || [];
      
      // Calculate position for new keyframe
      const lastKeyframe = [...previousKeyframes]
        .sort((a, b) => a.timestamp - b.timestamp)
        .reduce(
          (acc, frame) => {
            if (frame.timestamp + frame.duration > acc.timestamp + acc.duration)
              return frame;
            return acc;
          },
          { timestamp: 0, duration: 0 },
        );
      
      const mediaDuration = resolveDuration(media) ?? 5000;
      const duration = Math.min(mediaDuration, 30000);
      
      // Create optimistic keyframe
      const optimisticKeyframe: VideoKeyFrame = {
        id: `temp-keyframe-${Date.now()}`,
        trackId: track.id,
        data: {
          mediaId: media.id,
          type: media.input?.image_url ? "image" : "prompt",
          prompt: media.input?.prompt || "",
          url: media.input?.image_url?.url,
        },
        timestamp: lastKeyframe
          ? lastKeyframe.timestamp + 1 + lastKeyframe.duration
          : 0,
        duration,
      };
      
      // Optimistically add the keyframe
      queryClient.setQueryData(
        ["frames", track.id],
        [...previousKeyframes, optimisticKeyframe]
      );
      
      // Return context for potential rollback
      return {
        previousKeyframes,
        trackId: track.id,
        previousTracks: tracks,
        optimisticKeyframe,
      };
    },
    onError: (err, media, context) => {
      // Roll back on error
      if (context) {
        // Restore previous keyframes
        queryClient.setQueryData(
          ["frames", context.trackId],
          context.previousKeyframes
        );
        
        // If we created a temporary track, remove it
        if (context.trackId.startsWith('temp-track-')) {
          queryClient.setQueryData(
            queryKeys.projectTracks(projectId),
            context.previousTracks
          );
        }
      }
      
      console.error('Failed to add media to track:', err);
    },
    onSuccess: (data, media, context) => {
      if (!data || !projectId || !context) return;
      
      // Replace temporary keyframe with real one
      if (context.optimisticKeyframe.id.startsWith('temp-keyframe-')) {
        queryClient.setQueryData(
          ["frames", data.trackId],
          (old: VideoKeyFrame[] = []) => 
            old.map(kf => 
              kf.id === context.optimisticKeyframe.id 
                ? { ...kf, id: data.keyframeId }
                : kf
            )
        );
      }
      
      // Refresh to ensure consistency
      refreshVideoCache(queryClient, projectId);
    },
    onSettled: () => {
      // Always refetch after mutation to ensure consistency
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["frames"] });
        queryClient.invalidateQueries({ queryKey: queryKeys.projectTracks(projectId) });
      }
    },
  });

  const trackObj: Record<string, VideoTrack> = useMemo(() => {
    return {
      video:
        tracks.find((t) => t.type === "video") ||
        ({
          id: "video",
          type: "video",
          label: "Video",
          locked: true,
          keyframes: [],
          projectId: projectId,
        } as VideoTrack),
      music:
        tracks.find((t) => t.type === "music") ||
        ({
          id: "music",
          type: "music",
          label: "Music",
          locked: true,
          keyframes: [],
          projectId: projectId,
        } as VideoTrack),
      voiceover:
        tracks.find((t) => t.type === "voiceover") ||
        ({
          id: "voiceover",
          type: "voiceover",
          label: "Voiceover",
          locked: true,
          keyframes: [],
          projectId: projectId,
        } as VideoTrack),
    };
  }, [tracks, projectId]);

  const handleOnDrop: DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    setDragOverTracks(false);
    const jobPayload = event.dataTransfer.getData("job");
    if (!jobPayload) {
      console.error('No job payload in drag data');
      return false;
    }
    const job: MediaItem = JSON.parse(jobPayload);
    console.log('Dropping media:', job, 'Current projectId:', projectId);
    
    if (!projectId) {
      console.error('Cannot drop media: No project ID available');
      return false;
    }
    
    addToTrack.mutate(job);
    return true;
  };

  // Don't render if no project ID
  if (!projectId) {
    return null;
  }

  return (
    <div className="border-t pb-2 border-border flex flex-col bg-background-light ">
      <div className="border-b border-border bg-background-dark px-2 flex flex-row gap-8 py-2 justify-between items-center flex-1">
        <div className="h-full flex flex-col justify-center px-4 bg-muted/50 rounded-md font-mono cursor-default select-none shadow-inner">
          <div className="flex flex-row items-baseline font-thin tabular-nums">
            <span className="text-muted-foreground">00:</span>
            <span>{formattedTimestamp}</span>
            <span className="text-muted-foreground/50 mx-2">/</span>
            <span className="text-sm opacity-50">
              <span className="text-muted-foreground">00:</span>30.00
            </span>
          </div>
        </div>
        <VideoControls />
      </div>
      <div
        className={cn(
          "min-h-64  max-h-72 h-full flex flex-row overflow-y-scroll transition-colors",
          {
            "bg-white/5": dragOverTracks,
          },
        )}
        onDragOver={handleOnDragOver}
        onDragLeave={() => setDragOverTracks(false)}
        onDrop={handleOnDrop}
      >
        <div className="flex flex-col justify-start w-full h-full relative">
          <div
            className="absolute z-[32] top-6 bottom-0 w-[2px] bg-white/30 ms-4"
            style={{
              left: `${((playerCurrentTimestamp / 30) * 100).toFixed(2)}%`,
            }}
          />
          <TimelineRuler className="z-30 pointer-events-none" />
          <div className="flex timeline-container flex-col h-full mx-4 mt-10 gap-2 z-[31] pb-2">
            {Object.values(trackObj).map((track, index) =>
              track ? (
                <VideoTrackRow
                  key={track.id}
                  data={track}
                  style={{
                    minWidth: minTrackWidth,
                  }}
                />
              ) : (
                <div
                  key={`empty-track-${index}`}
                  className="flex flex-row relative w-full h-full timeline-container"
                />
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
