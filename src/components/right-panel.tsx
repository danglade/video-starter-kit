"use client";

import { useJobCreator } from "@/data/mutations";
import { queryKeys, useProject, useProjectMediaItems } from "@/data/queries";
import type { MediaItem } from "@/data/schema";
import {
  type GenerateData,
  type MediaType,
  useProjectId,
  useVideoProjectStore,
} from "@/data/store";
import { AVAILABLE_ENDPOINTS, type InputAsset } from "@/lib/fal";
import {
  ImageIcon,
  MicIcon,
  MusicIcon,
  LoaderCircleIcon,
  VideoIcon,
  ArrowLeft,
  TrashIcon,
  WandSparklesIcon,
  CrossIcon,
  XIcon,
} from "lucide-react";
import { MediaItemRow } from "./media-panel";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

import { useEffect, useMemo, useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import type { ClientUploadedFileData } from "uploadthing/types";
import { db } from "@/data/db";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  assetKeyMap,
  cn,
  getAssetKey,
  getAssetType,
  mapInputKey,
  resolveMediaUrl,
} from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Slider } from "./ui/slider";
import { enhancePrompt } from "@/lib/prompt";
import { WithTooltip } from "./ui/tooltip";
import { Label } from "./ui/label";
import { VoiceSelector } from "./playht/voice-selector";
import { LoadingIcon } from "./ui/icons";
import { getMediaMetadata } from "@/lib/ffmpeg";
import CameraMovement from "./camera-control";
import VideoFrameSelector from "./video-frame-selector";
import { CharacterGallery } from "./character-gallery";
import { useCharacter } from "@/data/queries";
import { TRAINING_CONFIG } from "@/config/training";

type ModelEndpointPickerProps = {
  mediaType: string;
  onValueChange: (value: MediaType) => void;
} & Parameters<typeof Select>[0];

function ModelEndpointPicker({
  mediaType,
  ...props
}: ModelEndpointPickerProps) {
  const endpoints = useMemo(
    () =>
      AVAILABLE_ENDPOINTS.filter((endpoint) => endpoint.category === mediaType),
    [mediaType],
  );
  return (
    <Select {...props}>
      <SelectTrigger className="text-base w-full minw-56 font-semibold">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {endpoints.map((endpoint) => (
          <SelectItem key={endpoint.endpointId} value={endpoint.endpointId}>
            <div className="flex flex-row gap-2 items-center">
              <span>{endpoint.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Helper function to check if current endpoint is an upscaling endpoint
function isUpscalingEndpoint(endpointId: string): boolean {
  return endpointId.includes('upscale') || 
         endpointId.includes('clarity') || 
         endpointId.includes('aura-sr');
}

// Helper function to check if current endpoint is a Kling model
function isKlingModel(endpointId: string): boolean {
  return endpointId.startsWith('fal-ai/kling-video/');
}

export default function RightPanel({
  onOpenChange,
}: {
  onOpenChange?: (open: boolean) => void;
}) {
  const videoProjectStore = useVideoProjectStore((s) => s);
  const {
    generateData,
    setGenerateData,
    resetGenerateData,
    endpointId,
    setEndpointId,
  } = videoProjectStore;

  const [tab, setTab] = useState<string>("generation");
  const [assetMediaType, setAssetMediaType] = useState("all");
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const projectId = useProjectId();
  const openGenerateDialog = useVideoProjectStore((s) => s.openGenerateDialog);
  const generateDialogOpen = useVideoProjectStore((s) => s.generateDialogOpen);
  const closeGenerateDialog = useVideoProjectStore(
    (s) => s.closeGenerateDialog,
  );
  const queryClient = useQueryClient();

  const handleOnOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      closeGenerateDialog();
      resetGenerateData();
      return;
    }
    onOpenChange?.(isOpen);
    openGenerateDialog();
  };

  const { data: project } = useProject(projectId);

  const { toast } = useToast();
  const enhance = useMutation({
    mutationFn: async () => {
      return enhancePrompt(generateData.prompt, {
        type: mediaType,
        project,
      });
    },
    onSuccess: (enhancedPrompt) => {
      setGenerateData({ prompt: enhancedPrompt });
    },
    onError: (error) => {
      console.warn("Failed to create suggestion", error);
      toast({
        title: "Failed to enhance prompt",
        description: "There was an unexpected error. Try again.",
      });
    },
  });

  const { data: mediaItems = [] } = useProjectMediaItems(projectId);
  const mediaType = useVideoProjectStore((s) => s.generateMediaType);
  const setMediaType = useVideoProjectStore((s) => s.setGenerateMediaType);
  const { data: selectedCharacter } = useCharacter(selectedCharacterId || '');

  const endpoint = useMemo(
    () =>
      AVAILABLE_ENDPOINTS.find(
        (endpoint) => endpoint.endpointId === endpointId,
      ),
    [endpointId],
  );

  // Fix endpoint when dialog opens with image media type
  useEffect(() => {
    if (generateDialogOpen && mediaType === "image" && !isUpscalingEndpoint(endpointId)) {
      // If we're in image mode but not upscaling, set to flux-lora
      setEndpointId(TRAINING_CONFIG.GENERATION_MODEL);
      setGenerateData({ image: null });
    }
  }, [generateDialogOpen, mediaType, endpointId]);
  const handleMediaTypeChange = (mediaType: string) => {
    setMediaType(mediaType as MediaType);
    
    if (mediaType === "image") {
      // Check if we're already on an upscaling endpoint
      if (!isUpscalingEndpoint(endpointId)) {
        // Only set to flux-lora if we're not doing upscaling
        setGenerateData({ image: null });
        setEndpointId(TRAINING_CONFIG.GENERATION_MODEL);
      }
    } else {
      const endpoint = AVAILABLE_ENDPOINTS.find(
        (endpoint) => endpoint.category === mediaType,
      );

      const initialInput = endpoint?.initialInput || {};

      if (
        (mediaType === "video" &&
          endpoint?.endpointId === "fal-ai/hunyuan-video") ||
        mediaType !== "video"
      ) {
        setGenerateData({ image: null, ...initialInput });
      } else {
        setGenerateData({ ...initialInput });
      }

      setEndpointId(endpoint?.endpointId ?? AVAILABLE_ENDPOINTS[0].endpointId);
    }
  };
  // TODO improve model-specific parameters
  type InputType = {
    prompt: string;
    image_url?: File | string | null;
    video_url?: File | string | null;
    audio_url?: File | string | null;
    image_size?: { width: number; height: number } | string;
    aspect_ratio?: string;
    seconds_total?: number;
    duration?: string; // For Kling and Seedance models
    voice?: string;
    input?: string;
    reference_audio_url?: File | string | null;
    images?: {
      start_frame_num: number;
      image_url: string | File;
    }[];
    advanced_camera_control?: {
      movement_value: number;
      movement_type: string;
    };
    loras?: Array<{ path: string; scale?: number }>;
    // Seedance specific
    resolution?: string;
    camera_fixed?: boolean;
    seed?: number;
    end_image_url?: File | string | null;
  };

  const aspectRatioMap = {
    "16:9": { image: "landscape_16_9", video: "16:9" },
    "9:16": { image: "portrait_16_9", video: "9:16" },
    "1:1": { image: "square_1_1", video: "1:1" },
  };

  let imageAspectRatio: string | { width: number; height: number } | undefined;
  let videoAspectRatio: string | undefined;

  if (project?.aspectRatio) {
    imageAspectRatio = aspectRatioMap[project.aspectRatio].image;
    videoAspectRatio = aspectRatioMap[project.aspectRatio].video;
  }

  const input: InputType = {
    prompt: generateData.prompt,
    image_url: undefined,
    image_size: imageAspectRatio,
    aspect_ratio: videoAspectRatio,
    seconds_total: generateData.duration ?? undefined,
    // Kling and Seedance models use "duration" as string ("5" or "10")
    duration: (isKlingModel(endpointId) || endpointId === "fal-ai/bytedance/seedance/v1/lite/image-to-video")
      ? String(generateData.duration || 5) 
      : undefined,
    voice:
      endpointId === "fal-ai/playht/tts/v3" ? generateData.voice : undefined,
    input:
      endpointId === "fal-ai/playht/tts/v3" ? generateData.prompt : undefined,
  };

  if (generateData.image) {
    input.image_url = generateData.image;
  }
  if (generateData.video_url) {
    input.video_url = generateData.video_url;
  }
  if (generateData.audio_url) {
    input.audio_url = generateData.audio_url;
  }
  if (generateData.reference_audio_url) {
    input.reference_audio_url = generateData.reference_audio_url;
  }

  if (generateData.advanced_camera_control) {
    input.advanced_camera_control = generateData.advanced_camera_control;
  }

  if (generateData.images) {
    input.images = generateData.images;
  }

  // Add character LoRA if selected and available
  if (selectedCharacter?.loraUrl && mediaType === "image") {
    input.loras = [{ path: selectedCharacter.loraUrl, scale: 1.0 }];
  }

  // Add Seedance-specific parameters
  if (endpointId === "fal-ai/bytedance/seedance/v1/lite/image-to-video") {
    if (generateData.resolution) input.resolution = generateData.resolution;
    if (generateData.camera_fixed !== undefined) input.camera_fixed = generateData.camera_fixed;
    if (generateData.seed) input.seed = generateData.seed;
    if (generateData.end_image_url) input.end_image_url = generateData.end_image_url;
  }

  const extraInput =
    endpointId === "fal-ai/f5-tts"
      ? {
          gen_text: generateData.prompt,
          ref_audio_url:
            "https://github.com/SWivid/F5-TTS/raw/21900ba97d5020a5a70bcc9a0575dc7dec5021cb/tests/ref_audio/test_en_1_ref_short.wav",
          ref_text: "Some call me nature, others call me mother nature.",
          model_type: "F5-TTS",
          remove_silence: true,
        }
      : {};

  // Determine the actual endpoint to use
  let actualEndpointId = endpointId;
  if (mediaType === "image") {
    // Check if this is an upscaling endpoint
    if (!isUpscalingEndpoint(endpointId)) {
      // Only force flux-lora for regular image generation, not upscaling
      actualEndpointId = TRAINING_CONFIG.GENERATION_MODEL;
    }
  }

  const jobInput = {
    ...(endpoint?.initialInput || {}),
    ...mapInputKey(input, endpoint?.inputMap || {}),
    ...extraInput,
    // Include upscaling-specific parameters
    ...(generateData.scale && { scale: generateData.scale }),
    ...(generateData.upscaling_factor && { upscaling_factor: generateData.upscaling_factor }),
    ...(generateData.creativity && { creativity: generateData.creativity }),
  };

  const createJob = useJobCreator({
    projectId,
    endpointId: actualEndpointId,
    mediaType,
    input: jobInput,
  });

  const handleOnGenerate = async () => {
    // Validate character selection for image generation (but not for upscaling)
    if (mediaType === "image" && !selectedCharacterId && !isUpscalingEndpoint(endpointId)) {
      toast({
        title: "Character Required",
        description: "Please select a character to generate images.",
        variant: "destructive",
      });
      return;
    }

    await createJob.mutateAsync({} as any, {
      onSuccess: async () => {
        if (!createJob.isError) {
          handleOnOpenChange(false);
        }
      },
      onError: (error) => {
        console.warn("Failed to create job", error);
        toast({
          title: "Failed to generate media",
          description: "Please ensure you've set your FAL KEY in the settings.",
        });
      },
    });
  };

  useEffect(() => {
    videoProjectStore.onGenerate = handleOnGenerate;
  }, [handleOnGenerate]);

  const handleSelectMedia = (media: MediaItem) => {
    const asset = endpoint?.inputAsset?.find((item) => {
      const assetType = getAssetType(item);

      if (
        assetType === "audio" &&
        (media.mediaType === "voiceover" || media.mediaType === "music")
      ) {
        return true;
      }
      return assetType === media.mediaType;
    });

    if (!asset) {
      setTab("generation");
      return;
    }

    setGenerateData({ [getAssetKey(asset)]: resolveMediaUrl(media) });
    setTab("generation");
  };

  const { startUpload, isUploading } = useUploadThing("fileUploader");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      const uploadedFiles = await startUpload(Array.from(files));
      if (uploadedFiles) {
        await handleUploadComplete(uploadedFiles);
      }
    } catch (err) {
      console.warn(`ERROR! ${err}`);
      toast({
        title: "Failed to upload file",
        description: "Please try again",
      });
    }
  };

  const handleUploadComplete = async (
    files: ClientUploadedFileData<{
      uploadedBy: string;
    }>[],
  ) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const mediaType = file.type.split("/")[0];
      const outputType = mediaType === "audio" ? "music" : mediaType;

      const data: Omit<MediaItem, "id"> = {
        projectId,
        kind: "uploaded",
        createdAt: Date.now(),
        mediaType: outputType as MediaType,
        status: "completed",
        url: file.url,
      };

      setGenerateData({
        ...generateData,
        [assetKeyMap[outputType as keyof typeof assetKeyMap]]: file.url,
      });

      const mediaId = await db.media.create(data);
      const media = await db.media.find(mediaId as string);

      if (media && media.mediaType !== "image") {
        const mediaMetadata = await getMediaMetadata(media as MediaItem);

        await db.media
          .update(media.id, {
            ...media,
            metadata: mediaMetadata?.media || {},
          })
          .finally(() => {
            queryClient.invalidateQueries({
              queryKey: queryKeys.projectMediaItems(projectId),
            });
          });
      }
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col border-l border-border w-[450px] z-50 transition-all duration-300 absolute top-0 h-full bg-background",
        generateDialogOpen ? "right-0" : "-right-[450px]",
      )}
    >
      <div className="flex-1 p-4 flex flex-col gap-4 border-b border-border h-full overflow-hidden relative">
        <div className="flex flex-row items-center justify-between">
          <h2 className="text-sm text-muted-foreground font-semibold flex-1">
            Generate Media
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOnOpenChange(false)}
            className="flex items-center gap-2"
          >
            <XIcon className="w-6 h-6" />
          </Button>
        </div>
        <div className="w-full flex flex-col">
          <div className="flex w-full gap-2">
            <Button
              variant="ghost"
              onClick={() => handleMediaTypeChange("image")}
              className={cn(
                mediaType === "image" && "bg-white/10",
                "h-14 flex flex-col justify-center w-1/4 rounded-md gap-2 items-center",
              )}
            >
              <ImageIcon className="w-4 h-4 opacity-50" />
              <span className="text-[10px]">Image</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleMediaTypeChange("video")}
              className={cn(
                mediaType === "video" && "bg-white/10",
                "h-14 flex flex-col justify-center w-1/4 rounded-md gap-2 items-center",
              )}
            >
              <VideoIcon className="w-4 h-4 opacity-50" />
              <span className="text-[10px]">Video</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleMediaTypeChange("voiceover")}
              className={cn(
                mediaType === "voiceover" && "bg-white/10",
                "h-14 flex flex-col justify-center w-1/4 rounded-md gap-2 items-center",
              )}
            >
              <MicIcon className="w-4 h-4 opacity-50" />
              <span className="text-[10px]">Voiceover</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleMediaTypeChange("music")}
              className={cn(
                mediaType === "music" && "bg-white/10",
                "h-14 flex flex-col justify-center w-1/4 rounded-md gap-2 items-center",
              )}
            >
              <MusicIcon className="w-4 h-4 opacity-50" />
              <span className="text-[10px]">Music</span>
            </Button>
          </div>
          {(mediaType !== "image" || isUpscalingEndpoint(endpointId)) && (
            <div className="flex flex-col gap-2 mt-2 justify-start font-medium text-base">
              <div className="text-muted-foreground">Using</div>
              <ModelEndpointPicker
                mediaType={mediaType}
                value={endpointId}
                onValueChange={(newEndpointId) => {
                  const oldEndpoint = AVAILABLE_ENDPOINTS.find(
                    (ep) => ep.endpointId === endpointId,
                  );
                  const newEndpoint = AVAILABLE_ENDPOINTS.find(
                    (ep) => ep.endpointId === newEndpointId,
                  );

                  // Check if both old and new endpoints are upscaling endpoints
                  const bothAreUpscaling = isUpscalingEndpoint(endpointId) && isUpscalingEndpoint(newEndpointId);
                  
                  if (bothAreUpscaling) {
                    // Preserve the image when switching between upscaling models
                    const currentImage = generateData.image;
                    const initialInput = newEndpoint?.initialInput || {};
                    setGenerateData({ ...initialInput, image: currentImage });
                  } else {
                    // Reset data when switching to/from non-upscaling endpoints
                    resetGenerateData();
                    const initialInput = newEndpoint?.initialInput || {};
                    setGenerateData({ ...initialInput });
                  }
                  
                  setEndpointId(newEndpointId);
                }}
              />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 relative">
          {endpoint?.inputAsset?.map((asset, index) => (
            <div key={getAssetType(asset)} className="flex w-full">
              <div className="flex flex-col w-full" key={getAssetType(asset)}>
                <div className="flex justify-between">
                  <h4 className="capitalize text-muted-foreground mb-2">
                    {getAssetType(asset)} Reference
                  </h4>
                  {tab === `asset-${getAssetType(asset)}` && (
                    <Button
                      variant="ghost"
                      onClick={() => setTab("generation")}
                      size="sm"
                    >
                      <ArrowLeft /> Back
                    </Button>
                  )}
                </div>
                {(tab === "generation" ||
                  tab !== `asset-${getAssetType(asset)}`) && (
                  <>
                    {!generateData[getAssetKey(asset)] && (
                      <div className="flex flex-col gap-2 justify-between">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setTab(`asset-${getAssetType(asset)}`);
                            setAssetMediaType(getAssetType(asset) ?? "all");
                          }}
                          className="cursor-pointer min-h-[30px] flex flex-col items-center justify-center border border-dashed border-border rounded-md px-4"
                        >
                          <span className="text-muted-foreground text-xs text-center text-nowrap">
                            Select
                          </span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isUploading}
                          className="cursor-pointer min-h-[30px] flex flex-col items-center justify-center border border-dashed border-border rounded-md px-4"
                          asChild
                        >
                          <label htmlFor="assetUploadButton">
                            <Input
                              id="assetUploadButton"
                              type="file"
                              className="hidden"
                              onChange={handleFileUpload}
                              multiple={false}
                              disabled={isUploading}
                              accept="image/*,audio/*,video/*"
                            />
                            {isUploading ? (
                              <LoaderCircleIcon className="w-4 h-4 opacity-50 animate-spin" />
                            ) : (
                              <span className="text-muted-foreground text-xs text-center text-nowrap">
                                Upload
                              </span>
                            )}
                          </label>
                        </Button>
                      </div>
                    )}
                    {generateData[getAssetKey(asset)] && (
                      <div className="cursor-pointer overflow-hidden relative w-full flex flex-col items-center justify-center border border-dashed border-border rounded-md">
                        <WithTooltip tooltip="Remove media">
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-black/50 absolute top-1 z-50 bg-black/80 right-1 group-hover:text-white"
                            onClick={() =>
                              setGenerateData({
                                [getAssetKey(asset)]: undefined,
                              })
                            }
                          >
                            <TrashIcon className="w-3 h-3 stroke-2" />
                          </button>
                        </WithTooltip>
                        {generateData[getAssetKey(asset)] && (
                          <SelectedAssetPreview
                            asset={asset}
                            data={generateData}
                          />
                        )}
                      </div>
                    )}
                  </>
                )}
                {tab === `asset-${getAssetType(asset)}` && (
                  <div className="flex items-center gap-2 flex-wrap overflow-y-auto max-h-80 divide-y divide-border">
                    {mediaItems
                      .filter((media) => {
                        if (assetMediaType === "all") return true;
                        if (
                          assetMediaType === "audio" &&
                          (media.mediaType === "voiceover" ||
                            media.mediaType === "music")
                        )
                          return true;
                        return media.mediaType === assetMediaType;
                      })
                      .map((job) => (
                        <MediaItemRow
                          draggable={false}
                          key={job.id}
                          data={job}
                          onOpen={handleSelectMedia}
                          className="cursor-pointer"
                        />
                      ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {endpoint?.prompt !== false && (
            <div className="relative bg-border rounded-lg pb-10 placeholder:text-base w-full  resize-none">
              <Textarea
                className="text-base shadow-none focus:!ring-0 placeholder:text-base w-full h-32 resize-none"
                placeholder="Imagine..."
                value={generateData.prompt}
                rows={3}
                onChange={(e) => setGenerateData({ prompt: e.target.value })}
              />
              <WithTooltip tooltip="Enhance your prompt with AI-powered suggestions.">
                <div className="absolute bottom-2 right-2">
                  <Button
                    variant="secondary"
                    disabled={enhance.isPending}
                    className="bg-purple-400/10 text-purple-400 text-xs rounded-full h-6 px-3"
                    onClick={() => enhance.mutate()}
                  >
                    {enhance.isPending ? (
                      <LoadingIcon />
                    ) : (
                      <WandSparklesIcon className="opacity-50" />
                    )}
                    Enhance Prompt
                  </Button>
                </div>
              </WithTooltip>
            </div>
          )}
        </div>
        {tab === "generation" && (
          <div className="flex flex-col gap-2 mb-2">
            {mediaType === "image" && !isUpscalingEndpoint(endpointId) && (
              <>
                <CharacterGallery
                  selectedCharacterId={selectedCharacterId}
                  onSelectCharacter={setSelectedCharacterId}
                />
                {!selectedCharacterId && (
                  <div className="text-sm text-muted-foreground text-center p-4 border border-dashed rounded-md">
                    Please select a character to generate images
                  </div>
                )}
              </>
            )}
            {endpoint?.imageForFrame && (
              <VideoFrameSelector
                mediaItems={mediaItems}
                onChange={(
                  images: {
                    start_frame_num: number;
                    image_url: string | File;
                  }[],
                ) => setGenerateData({ images })}
              />
            )}
            {endpoint?.cameraControl && (
              <CameraMovement
                value={generateData.advanced_camera_control}
                onChange={(val) =>
                  setGenerateData({
                    advanced_camera_control: val
                      ? {
                          movement_value: val.value,
                          movement_type: val.movement,
                        }
                      : undefined,
                  })
                }
              />
            )}
            {/* Seedance-specific controls */}
            {endpointId === "fal-ai/bytedance/seedance/v1/lite/image-to-video" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resolution">Resolution</Label>
                  <Select
                    value={generateData.resolution || "720p"}
                    onValueChange={(value) => setGenerateData({ resolution: value })}
                  >
                    <SelectTrigger id="resolution">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="480p">480p (Faster)</SelectItem>
                      <SelectItem value="720p">720p (Default)</SelectItem>
                      <SelectItem value="1080p">1080p (Higher Quality)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="camera-fixed">Fixed Camera</Label>
                    <Button
                      variant={generateData.camera_fixed ? "default" : "outline"}
                      size="sm"
                      onClick={() => setGenerateData({ camera_fixed: !generateData.camera_fixed })}
                    >
                      {generateData.camera_fixed ? "Fixed" : "Moving"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Keep camera position fixed throughout the video
                  </p>
                </div>
              </div>
            )}
            {/* Upscaling-specific controls */}
            {isUpscalingEndpoint(endpointId) && (
              <div className="space-y-4">
                {endpointId === 'fal-ai/creative-upscaler' && (
                  <div className="space-y-2">
                    <Label htmlFor="creativity">Creativity Level</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        id="creativity"
                        min={0}
                        max={1}
                        step={0.1}
                        value={[generateData.creativity || 0.3]}
                        onValueChange={([value]) => setGenerateData({ creativity: value })}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground w-10">
                        {(generateData.creativity || 0.3).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Higher values add more creative enhancement
                    </p>
                  </div>
                )}
                {(endpointId === 'fal-ai/creative-upscaler' || endpointId === 'fal-ai/clarity-upscaler') && (
                  <div className="space-y-2">
                    <Label htmlFor="scale">Upscaling Factor</Label>
                    <Select
                      value={String(generateData.scale || 2)}
                      onValueChange={(value) => setGenerateData({ scale: parseInt(value) })}
                    >
                      <SelectTrigger id="scale">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2x</SelectItem>
                        <SelectItem value="4">4x</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
            {mediaType === "music" && endpointId === "fal-ai/playht/tts/v3" && (
              <div className="flex-1 flex flex-row gap-2">
                {mediaType === "music" && (
                  <div className="flex flex-row items-center gap-1">
                    <Label>Duration</Label>
                    <Input
                      className="w-12 text-center tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      min={5}
                      max={30}
                      step={1}
                      type="number"
                      value={generateData.duration}
                      onChange={(e) =>
                        setGenerateData({
                          duration: Number.parseInt(e.target.value),
                        })
                      }
                    />
                    <span>s</span>
                  </div>
                )}
                {endpointId === "fal-ai/playht/tts/v3" && (
                  <VoiceSelector
                    value={generateData.voice}
                    onValueChange={(voice) => {
                      setGenerateData({ voice });
                    }}
                  />
                )}
              </div>
            )}
            <div className="flex flex-row gap-2">
              <Button
                className="w-full"
                disabled={enhance.isPending || createJob.isPending || (mediaType === "image" && !selectedCharacterId && !isUpscalingEndpoint(endpointId))}
                onClick={handleOnGenerate}
              >
                {isUpscalingEndpoint(endpointId) ? 'Upscale' : 'Generate'}
              </Button>
            </div>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent via-background via-60% h-8 pointer-events-none" />
      </div>
    </div>
  );
}

const SelectedAssetPreview = ({
  data,
  asset,
}: {
  data: GenerateData;
  asset: InputAsset;
}) => {
  const assetType = getAssetType(asset);
  const assetKey = getAssetKey(asset);

  if (!data[assetKey]) return null;

  return (
    <>
      {assetType === "audio" && (
        <audio
          src={
            data[assetKey] && typeof data[assetKey] !== "string"
              ? URL.createObjectURL(data[assetKey])
              : data[assetKey] || ""
          }
          controls={true}
        />
      )}
      {assetType === "video" && (
        <video
          src={
            data[assetKey] && typeof data[assetKey] !== "string"
              ? URL.createObjectURL(data[assetKey])
              : data[assetKey] || ""
          }
          controls={false}
          style={{ pointerEvents: "none" }}
        />
      )}
      {assetType === "image" && (
        <img
          id="image-preview"
          src={
            data[assetKey] && typeof data[assetKey] !== "string"
              ? URL.createObjectURL(data[assetKey])
              : data[assetKey] || ""
          }
          alt="Media Preview"
        />
      )}
    </>
  );
};

