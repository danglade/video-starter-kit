"use client";

import { useEpisode, useEpisodeScenes } from "@/data/queries";
import { useSceneCreator, useSceneUpdater } from "@/data/mutations";
import type { Episode, Scene } from "@/data/schema";
import { Button } from "./ui/button";
import { Plus, Film, Clock, Sparkles, CheckCircle, PlayCircle, Settings, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface EpisodeTimelineProps {
  episodeId: string;
  onSceneSelect?: (scene: Scene) => void;
}

const sceneTypeColors = {
  action: "bg-red-500/10 text-red-500",
  dialogue: "bg-blue-500/10 text-blue-500",
  establishing: "bg-green-500/10 text-green-500",
  transition: "bg-purple-500/10 text-purple-500",
  montage: "bg-orange-500/10 text-orange-500",
};

const statusIcons = {
  planned: Clock,
  generating: Sparkles,
  generated: Film,
  approved: CheckCircle,
};

export function EpisodeTimeline({ episodeId, onSceneSelect }: EpisodeTimelineProps) {
  const { data: episode } = useEpisode(episodeId);
  const { data: scenes = [], isLoading } = useEpisodeScenes(episodeId);
  const createScene = useSceneCreator(episodeId);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  
  // Form state
  const [sceneTitle, setSceneTitle] = useState("");
  const [sceneDescription, setSceneDescription] = useState("");
  const [sceneType, setSceneType] = useState<Scene['sceneType']>("dialogue");
  const [sceneMood, setSceneMood] = useState<Scene['mood']>("calm");
  const [sceneSetting, setSceneSetting] = useState("");
  const [sceneDuration, setSceneDuration] = useState(30);

  const updateScene = useSceneUpdater(editingScene?.id || "", episodeId);

  const handleCreateScene = () => {
    const sceneNumber = scenes.length + 1;
    createScene.mutate(
      {
        episodeId,
        sceneNumber,
        title: sceneTitle || `Scene ${sceneNumber}`,
        description: sceneDescription,
        sceneType,
        mood: sceneMood,
        setting: sceneSetting,
        duration: sceneDuration,
        status: "planned",
      },
      {
        onSuccess: () => {
          setCreateDialogOpen(false);
          resetForm();
        },
      }
    );
  };

  const handleUpdateScene = () => {
    if (!editingScene) return;
    
    updateScene.mutate(
      {
        title: sceneTitle,
        description: sceneDescription,
        sceneType,
        mood: sceneMood,
        setting: sceneSetting,
        duration: sceneDuration,
      },
      {
        onSuccess: () => {
          setEditingScene(null);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setSceneTitle("");
    setSceneDescription("");
    setSceneType("dialogue");
    setSceneMood("calm");
    setSceneSetting("");
    setSceneDuration(30);
  };

  const openEditDialog = (scene: Scene) => {
    setEditingScene(scene);
    setSceneTitle(scene.title);
    setSceneDescription(scene.description || "");
    setSceneType(scene.sceneType);
    setSceneMood(scene.mood || "calm");
    setSceneSetting(scene.setting || "");
    setSceneDuration(scene.duration || 30);
  };

  if (!episode) {
    return <div className="flex-1 flex items-center justify-center">Episode not found</div>;
  }

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading scenes...</div>;
  }

  const totalDuration = scenes.reduce((acc, scene) => acc + (scene.duration || 0), 0);

  return (
    <>
      <div className="flex-1 flex flex-col h-full">
        {/* Episode Header */}
        <div className="border-b p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Episode {episode.episodeNumber}: {episode.title}
              </h1>
              {episode.synopsis && (
                <p className="text-muted-foreground mt-2 max-w-2xl">{episode.synopsis}</p>
              )}
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <Badge variant="outline" className="capitalize">
                  {episode.status.replace('_', ' ')}
                </Badge>
                <span>
                  {scenes.length} scenes • {Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')} total
                </span>
              </div>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Scene
            </Button>
          </div>
        </div>

        {/* Scenes Timeline */}
        <div className="flex-1 overflow-y-auto p-6">
          {scenes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Film className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No scenes yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Start building your episode by adding scenes. Each scene can contain multiple shots.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Scene
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {scenes.map((scene, index) => {
                const StatusIcon = statusIcons[scene.status];
                const progress = scene.status === 'approved' ? 100 : 
                               scene.status === 'generated' ? 75 :
                               scene.status === 'generating' ? 50 : 0;
                
                return (
                  <div
                    key={scene.id}
                    className="border rounded-lg p-4 hover:border-foreground/20 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <StatusIcon className="h-5 w-5 text-muted-foreground" />
                          <h3 className="font-semibold">
                            Scene {scene.sceneNumber}: {scene.title}
                          </h3>
                          <Badge className={cn("text-xs", sceneTypeColors[scene.sceneType])}>
                            {scene.sceneType}
                          </Badge>
                          {scene.mood && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {scene.mood}
                            </Badge>
                          )}
                        </div>
                        
                        {scene.description && (
                          <p className="text-sm text-muted-foreground mb-2">{scene.description}</p>
                        )}
                        
                        {scene.setting && (
                          <p className="text-sm text-muted-foreground mb-2">
                            📍 {scene.setting}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            Duration: {Math.floor((scene.duration || 0) / 60)}:{String((scene.duration || 0) % 60).padStart(2, '0')}
                          </span>
                          <span>•</span>
                          <span>0 shots</span>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSceneSelect?.(scene)}
                        >
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Open
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(scene)}>
                              Edit Scene
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Scene
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Scene Dialog */}
      <Dialog open={createDialogOpen || !!editingScene} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false);
          setEditingScene(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingScene ? 'Edit Scene' : 'Create New Scene'}</DialogTitle>
            <DialogDescription>
              {editingScene ? 'Update the scene details' : 'Add a new scene to your episode'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scene-title">Scene Title</Label>
                <Input
                  id="scene-title"
                  placeholder="Enter scene title"
                  value={sceneTitle}
                  onChange={(e) => setSceneTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="scene-duration">Duration (seconds)</Label>
                <Input
                  id="scene-duration"
                  type="number"
                  min={1}
                  value={sceneDuration}
                  onChange={(e) => setSceneDuration(parseInt(e.target.value) || 30)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="scene-description">Description</Label>
              <Textarea
                id="scene-description"
                placeholder="Describe what happens in this scene..."
                value={sceneDescription}
                onChange={(e) => setSceneDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scene-type">Scene Type</Label>
                <Select value={sceneType} onValueChange={(value) => setSceneType(value as Scene['sceneType'])}>
                  <SelectTrigger id="scene-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="action">Action</SelectItem>
                    <SelectItem value="dialogue">Dialogue</SelectItem>
                    <SelectItem value="establishing">Establishing</SelectItem>
                    <SelectItem value="transition">Transition</SelectItem>
                    <SelectItem value="montage">Montage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="scene-mood">Mood</Label>
                <Select value={sceneMood} onValueChange={(value) => setSceneMood(value as Scene['mood'])}>
                  <SelectTrigger id="scene-mood">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tense">Tense</SelectItem>
                    <SelectItem value="happy">Happy</SelectItem>
                    <SelectItem value="sad">Sad</SelectItem>
                    <SelectItem value="exciting">Exciting</SelectItem>
                    <SelectItem value="calm">Calm</SelectItem>
                    <SelectItem value="mysterious">Mysterious</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="scene-setting">Setting/Location</Label>
              <Input
                id="scene-setting"
                placeholder="e.g., School rooftop at sunset"
                value={sceneSetting}
                onChange={(e) => setSceneSetting(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setEditingScene(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingScene ? handleUpdateScene : handleCreateScene}
              disabled={createScene.isPending || updateScene.isPending}
            >
              {editingScene ? (updateScene.isPending ? "Updating..." : "Update Scene") : (createScene.isPending ? "Creating..." : "Create Scene")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 