"use client";

import { useScene, useSceneShots } from "@/data/queries";
import { useShotCreator, useShotUpdater } from "@/data/mutations";
import type { Scene, Shot } from "@/data/schema";
import { Button } from "./ui/button";
import { 
  Plus, 
  Camera, 
  Film, 
  Clock, 
  Sparkles, 
  CheckCircle, 
  Settings,
  Trash2,
  ArrowLeft,
  Play,
  Maximize2,
  Move,
  ZoomIn
} from "lucide-react";
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
import { Slider } from "./ui/slider";
import { ShotGenerator } from "./shot-generator";
import { useProjectCharacters } from "@/data/queries";
import { useProjectId } from "@/data/store";

interface SceneDetailProps {
  sceneId: string;
  onBack: () => void;
}

const cameraTypeIcons = {
  wide: Maximize2,
  medium: Camera,
  close_up: ZoomIn,
  extreme_close_up: ZoomIn,
  establishing: Maximize2,
  pov: Camera,
  over_shoulder: Camera,
};

const cameraTypeLabels = {
  wide: "Wide",
  medium: "Medium",
  close_up: "Close-up",
  extreme_close_up: "Extreme Close-up",
  establishing: "Establishing",
  pov: "POV",
  over_shoulder: "Over Shoulder",
};

const statusColors = {
  planned: "text-muted-foreground",
  generating: "text-yellow-500",
  generated: "text-blue-500",
  approved: "text-green-500",
};

export function SceneDetail({ sceneId, onBack }: SceneDetailProps) {
  const { data: scene } = useScene(sceneId);
  const { data: shots = [], isLoading } = useSceneShots(sceneId);
  const createShot = useShotCreator(sceneId);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingShot, setEditingShot] = useState<Shot | null>(null);
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);
  
  const projectId = useProjectId();
  const { data: characters = [] } = useProjectCharacters(projectId);
  
  // Form state
  const [shotDuration, setShotDuration] = useState(3);
  const [cameraType, setCameraType] = useState<Shot['cameraType']>("medium");
  const [cameraMovement, setCameraMovement] = useState<Shot['cameraMovement']>("static");
  const [shotDescription, setShotDescription] = useState("");
  const [dialogueText, setDialogueText] = useState("");
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);

  const updateShot = useShotUpdater(editingShot?.id || "", sceneId);

  const handleCreateShot = () => {
    const shotNumber = shots.length + 1;
    createShot.mutate(
      {
        sceneId,
        shotNumber,
        duration: shotDuration,
        cameraType,
        cameraMovement,
        description: shotDescription,
        dialogueText: dialogueText || undefined,
        characterIds: selectedCharacterIds.length > 0 ? selectedCharacterIds : undefined,
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

  const handleUpdateShot = () => {
    if (!editingShot) return;
    
    updateShot.mutate(
      {
        duration: shotDuration,
        cameraType,
        cameraMovement,
        description: shotDescription,
        dialogueText: dialogueText || undefined,
        characterIds: selectedCharacterIds.length > 0 ? selectedCharacterIds : undefined,
      },
      {
        onSuccess: () => {
          setEditingShot(null);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setShotDuration(3);
    setCameraType("medium");
    setCameraMovement("static");
    setShotDescription("");
    setDialogueText("");
    setSelectedCharacterIds([]);
  };

  const openEditDialog = (shot: Shot) => {
    setEditingShot(shot);
    setShotDuration(shot.duration);
    setCameraType(shot.cameraType);
    setCameraMovement(shot.cameraMovement || "static");
    setShotDescription(shot.description || "");
    setDialogueText(shot.dialogueText || "");
    setSelectedCharacterIds(shot.characterIds || []);
  };

  if (!scene) {
    return <div className="flex-1 flex items-center justify-center">Scene not found</div>;
  }

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading shots...</div>;
  }

  const selectedShot = shots.find(s => s.id === selectedShotId);
  const totalDuration = shots.reduce((acc, shot) => acc + shot.duration, 0);

  return (
    <>
      <div className="flex-1 flex flex-col h-full">
        {/* Scene Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Episode
              </Button>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Shot
            </Button>
          </div>
          
          <div>
            <h2 className="text-xl font-bold">
              Scene {scene.sceneNumber}: {scene.title}
            </h2>
            {scene.description && (
              <p className="text-muted-foreground mt-1">{scene.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm">
              <Badge variant="outline" className="capitalize">
                {scene.sceneType}
              </Badge>
              {scene.mood && (
                <Badge variant="outline" className="capitalize">
                  {scene.mood}
                </Badge>
              )}
              {scene.setting && <span className="text-muted-foreground">📍 {scene.setting}</span>}
              <span className="text-muted-foreground">
                {shots.length} shots • {Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Shot List */}
          <div className="w-80 border-r overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold mb-4">Shot List</h3>
              {shots.length === 0 ? (
                <div className="text-center py-8">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No shots yet. Start building your scene.
                  </p>
                  <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Shot
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {shots.map((shot) => {
                    const CameraIcon = cameraTypeIcons[shot.cameraType];
                    const isSelected = selectedShotId === shot.id;
                    
                    return (
                      <div
                        key={shot.id}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-colors",
                          isSelected ? "bg-accent border-accent-foreground/20" : "hover:bg-accent/50"
                        )}
                        onClick={() => setSelectedShotId(shot.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            <CameraIcon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                Shot {shot.shotNumber}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {cameraTypeLabels[shot.cameraType]}
                                {shot.cameraMovement && shot.cameraMovement !== 'static' && (
                                  <span> • {shot.cameraMovement}</span>
                                )}
                              </div>
                              {shot.description && (
                                <p className="text-xs mt-1 line-clamp-2">{shot.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {shot.duration}s
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-xs", statusColors[shot.status])}
                                >
                                  {shot.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Settings className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(shot)}>
                                Edit Shot
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Shot
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Shot Preview/Details */}
          <div className="flex-1 p-6">
            {selectedShot ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Shot {selectedShot.shotNumber}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{cameraTypeLabels[selectedShot.cameraType]}</span>
                    {selectedShot.cameraMovement && selectedShot.cameraMovement !== 'static' && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{selectedShot.cameraMovement.replace('_', ' ')}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{selectedShot.duration} seconds</span>
                  </div>
                </div>

                {selectedShot.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-muted-foreground">{selectedShot.description}</p>
                  </div>
                )}

                {selectedShot.dialogueText && (
                  <div>
                    <h4 className="font-medium mb-2">Dialogue</h4>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="italic">"{selectedShot.dialogueText}"</p>
                    </div>
                  </div>
                )}

                {/* Shot Preview Area */}
                <div>
                  <h4 className="font-medium mb-2">Preview</h4>
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    {selectedShot.mediaId ? (
                      <div className="relative w-full h-full">
                        <video
                          src={selectedShot.mediaId}
                          controls
                          className="w-full h-full object-contain"
                          autoPlay
                          loop
                        />
                        <div className="absolute top-2 right-2">
                          <ShotGenerator 
                            shot={selectedShot} 
                            scene={scene}
                            onGenerated={() => {
                              // Refresh will happen automatically via React Query
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Camera className="h-16 w-16 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">Shot not generated yet</p>
                        <ShotGenerator 
                          shot={selectedShot} 
                          scene={scene}
                          onGenerated={() => {
                            // Refresh will happen automatically via React Query
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Camera className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Select a shot to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Shot Dialog */}
      <Dialog open={createDialogOpen || !!editingShot} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false);
          setEditingShot(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingShot ? 'Edit Shot' : 'Create New Shot'}</DialogTitle>
            <DialogDescription>
              {editingShot ? 'Update the shot details' : 'Add a new shot to your scene'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="camera-type">Camera Type</Label>
                <Select value={cameraType} onValueChange={(value) => setCameraType(value as Shot['cameraType'])}>
                  <SelectTrigger id="camera-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wide">Wide Shot</SelectItem>
                    <SelectItem value="medium">Medium Shot</SelectItem>
                    <SelectItem value="close_up">Close-up</SelectItem>
                    <SelectItem value="extreme_close_up">Extreme Close-up</SelectItem>
                    <SelectItem value="establishing">Establishing Shot</SelectItem>
                    <SelectItem value="pov">POV Shot</SelectItem>
                    <SelectItem value="over_shoulder">Over Shoulder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="camera-movement">Camera Movement</Label>
                <Select value={cameraMovement || "static"} onValueChange={(value) => setCameraMovement(value as Shot['cameraMovement'])}>
                  <SelectTrigger id="camera-movement">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="static">Static</SelectItem>
                    <SelectItem value="pan">Pan</SelectItem>
                    <SelectItem value="tilt">Tilt</SelectItem>
                    <SelectItem value="zoom_in">Zoom In</SelectItem>
                    <SelectItem value="zoom_out">Zoom Out</SelectItem>
                    <SelectItem value="tracking">Tracking</SelectItem>
                    <SelectItem value="dolly">Dolly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shot-duration">Duration (seconds)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  id="shot-duration"
                  min={1}
                  max={10}
                  step={0.5}
                  value={[shotDuration]}
                  onValueChange={([value]) => setShotDuration(value)}
                  className="flex-1"
                />
                <span className="w-12 text-right">{shotDuration}s</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shot-description">Shot Description</Label>
              <Textarea
                id="shot-description"
                placeholder="Describe what happens in this shot..."
                value={shotDescription}
                onChange={(e) => setShotDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dialogue-text">Dialogue (Optional)</Label>
              <Textarea
                id="dialogue-text"
                placeholder="Enter any dialogue for this shot..."
                value={dialogueText}
                onChange={(e) => setDialogueText(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="selected-characters">Characters (Optional)</Label>
              <div className="flex flex-wrap gap-2">
                {characters.map((character: any) => {
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
                      }}
                    >
                      {character.name}
                    </Badge>
                  );
                })}
              </div>
              {selectedCharacterIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedCharacterIds.length} character{selectedCharacterIds.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setEditingShot(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingShot ? handleUpdateShot : handleCreateShot}
              disabled={createShot.isPending || updateShot.isPending}
            >
              {editingShot ? (updateShot.isPending ? "Updating..." : "Update Shot") : (createShot.isPending ? "Creating..." : "Create Shot")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 