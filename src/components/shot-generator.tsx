"use client";

import { useState } from "react";
import { fal } from "@/lib/fal";
import type { Shot, Scene, Character } from "@/data/schema";
import { useProject, useScene, useProjectCharacters } from "@/data/queries";
import { useShotUpdater } from "@/data/mutations";
import { Button } from "./ui/button";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "@/hooks/use-toast";
import { useProjectId } from "@/data/store";
import { Badge } from "./ui/badge";

interface ShotGeneratorProps {
  shot: Shot;
  scene: Scene;
  onGenerated?: () => void;
}

// Visual style prompt modifiers
const visualStylePrompts = {
  shonen_tv: "anime style, vibrant colors, dynamic action, shounen anime aesthetic, high contrast, energetic composition",
  ghibli_soft: "Studio Ghibli style, soft watercolor aesthetic, gentle lighting, dreamy atmosphere, hand-painted feel",
  modern_manhwa: "modern manhwa art style, clean lines, soft shading, webtoon aesthetic, pastel colors",
  classic_ova: "90s anime OVA style, detailed animation, retro anime aesthetic, traditional cel animation look",
};

// Camera type descriptions for prompts
const cameraTypePrompts = {
  wide: "wide shot, full body visible, environment visible",
  medium: "medium shot, waist up view",
  close_up: "close-up shot, face and shoulders",
  extreme_close_up: "extreme close-up, facial details, eyes focus",
  establishing: "establishing shot, wide landscape, location overview",
  pov: "first person POV shot, from character's perspective",
  over_shoulder: "over the shoulder shot, back of head visible",
};

// Camera movement descriptions
const cameraMovementPrompts = {
  static: "",
  pan: "camera panning motion",
  tilt: "camera tilting motion",
  zoom_in: "zooming in motion",
  zoom_out: "zooming out motion", 
  tracking: "tracking shot following subject",
  dolly: "dolly camera movement",
};

export function ShotGenerator({ shot, scene, onGenerated }: ShotGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("fal-ai/kling-video/v1.6/pro/image-to-video");
  
  const projectId = useProjectId();
  const { data: project } = useProject(projectId);
  const { data: characters = [] } = useProjectCharacters(projectId);
  const updateShot = useShotUpdater(shot.id, scene.id);

  const generatePrompt = () => {
    if (!project) return "";
    
    const parts = [];
    
    // Add visual style
    if (project.visualStyle) {
      parts.push(visualStylePrompts[project.visualStyle]);
    }
    
    // Add camera type
    parts.push(cameraTypePrompts[shot.cameraType]);
    
    // Add camera movement
    if (shot.cameraMovement && shot.cameraMovement !== 'static') {
      parts.push(cameraMovementPrompts[shot.cameraMovement]);
    }
    
    // Add scene context
    if (scene.setting) {
      parts.push(`setting: ${scene.setting}`);
    }
    
    if (scene.mood) {
      parts.push(`mood: ${scene.mood}`);
    }
    
    // Add shot description
    if (shot.description) {
      parts.push(shot.description);
    }
    
    // Add character descriptions
    const selectedChars = characters.filter((c: any) => selectedCharacterIds.includes(c.id));
    if (selectedChars.length > 0) {
      const charDescriptions = selectedChars.map((c: any) => 
        `${c.name}: ${c.description || 'no description'}`
      ).join(", ");
      parts.push(`Characters: ${charDescriptions}`);
    }
    
    return parts.join(", ");
  };

  const handleOpenDialog = () => {
    setOpen(true);
    setEnhancedPrompt(generatePrompt());
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      
      // For now, we'll use text-to-video generation
      // In the future, we can use character images as references
      const result = await fal.subscribe(selectedModel, {
        input: {
          prompt: enhancedPrompt,
          duration: Math.min(shot.duration, 5), // Most models have max 5s
          aspect_ratio: "16:9",
          negative_prompt: "blur, distorted, low quality, watermark, text",
        },
      });
      
      if (result.data?.video?.url) {
                 // Update shot with generated media
         await updateShot.mutateAsync({
           mediaId: result.data.video.url,
           status: "generated",
         });
        
        toast({
          title: "Shot generated successfully",
          description: `Shot ${shot.shotNumber} has been generated.`,
        });
        
        setOpen(false);
        onGenerated?.();
      } else {
        throw new Error("No video URL in response");
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate shot",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <Button onClick={handleOpenDialog} disabled={shot.status === "generating"}>
        {shot.status === "generating" ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            {shot.status === "generated" ? "Regenerate Shot" : "Generate Shot"}
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Generate Shot {shot.shotNumber}</DialogTitle>
            <DialogDescription>
              Configure AI generation settings for this shot
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Model Selection */}
            <div className="space-y-2">
              <Label>Generation Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fal-ai/kling-video/v1.6/pro/image-to-video">
                    Kling 1.6 Pro (High Quality)
                  </SelectItem>
                  <SelectItem value="fal-ai/minimax-video">
                    MiniMax Video (Fast)
                  </SelectItem>
                  <SelectItem value="fal-ai/seedance-1.0-lite">
                    Seedance 1.0 Lite (Character Focus)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Character Selection */}
            {characters.length > 0 && (
              <div className="space-y-2">
                <Label>Characters in Shot</Label>
                <div className="flex flex-wrap gap-2">
                  {characters.map((character: Character) => {
                    const isSelected = selectedCharacterIds.includes(character.id);
                    return (
                      <Badge
                        key={character.id}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCharacterIds(prev => 
                              prev.filter(id => id !== character.id)
                            );
                          } else {
                            setSelectedCharacterIds(prev => [...prev, character.id]);
                          }
                          // Regenerate prompt when characters change
                          setTimeout(() => {
                            setEnhancedPrompt(generatePrompt());
                          }, 0);
                        }}
                      >
                        {character.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Shot Details */}
            <div className="space-y-2">
              <Label>Shot Details</Label>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p>Camera: {shot.cameraType.replace('_', ' ')}</p>
                {shot.cameraMovement && shot.cameraMovement !== 'static' && (
                  <p>Movement: {shot.cameraMovement.replace('_', ' ')}</p>
                )}
                <p>Duration: {shot.duration} seconds</p>
                {project?.visualStyle && (
                  <p>Style: {project.visualStyle.replace('_', ' ')}</p>
                )}
              </div>
            </div>

            {/* Enhanced Prompt */}
            <div className="space-y-2">
              <Label htmlFor="enhanced-prompt">Generation Prompt</Label>
              <Textarea
                id="enhanced-prompt"
                value={enhancedPrompt}
                onChange={(e) => setEnhancedPrompt(e.target.value)}
                rows={6}
                placeholder="Describe the shot in detail..."
              />
              <p className="text-xs text-muted-foreground">
                This prompt has been enhanced with your project's visual style, camera settings, and scene context.
              </p>
            </div>

            {/* Warning for long shots */}
            {shot.duration > 5 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-500">Duration Notice</p>
                  <p className="text-muted-foreground">
                    Most models support up to 5 seconds. The shot will be generated at 5 seconds.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Shot
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 