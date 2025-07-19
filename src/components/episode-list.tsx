"use client";

import { useProjectEpisodes } from "@/data/queries";
import { useEpisodeCreator } from "@/data/mutations";
import type { Episode } from "@/data/schema";
import { Button } from "./ui/button";
import { Plus, Film, Clock, CheckCircle, Edit2, Sparkles } from "lucide-react";
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

interface EpisodeListProps {
  projectId: string;
  onEpisodeSelect: (episode: Episode) => void;
  selectedEpisodeId?: string;
}

const statusIcons = {
  planning: Edit2,
  storyboard: Sparkles,
  production: Film,
  post_production: Clock,
  completed: CheckCircle,
};

const statusColors = {
  planning: "text-muted-foreground",
  storyboard: "text-blue-500",
  production: "text-yellow-500",
  post_production: "text-purple-500",
  completed: "text-green-500",
};

export function EpisodeList({ projectId, onEpisodeSelect, selectedEpisodeId }: EpisodeListProps) {
  const { data: episodes = [], isLoading, error } = useProjectEpisodes(projectId);
  const createEpisode = useEpisodeCreator(projectId);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newEpisodeTitle, setNewEpisodeTitle] = useState("");
  const [newEpisodeSynopsis, setNewEpisodeSynopsis] = useState("");

  const handleCreateEpisode = () => {
    const episodeNumber = episodes.length + 1;
    createEpisode.mutate(
      {
        projectId,
        episodeNumber,
        title: newEpisodeTitle || `Episode ${episodeNumber}`,
        synopsis: newEpisodeSynopsis,
        status: "planning",
      },
      {
        onSuccess: () => {
          setCreateDialogOpen(false);
          setNewEpisodeTitle("");
          setNewEpisodeSynopsis("");
        },
      }
    );
  };

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Loading episodes...</div>;
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Episodes</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {episodes.length === 0 ? (
            <div className="p-8 text-center">
              <Film className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                No episodes yet. Start creating your anime series!
              </p>
              <Button
                size="sm"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Episode
              </Button>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {episodes.map((episode) => {
                const StatusIcon = statusIcons[episode.status];
                const statusColor = statusColors[episode.status];
                
                return (
                  <button
                    key={episode.id}
                    onClick={() => onEpisodeSelect(episode)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      selectedEpisodeId === episode.id && "bg-accent"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <StatusIcon className={cn("h-5 w-5 mt-0.5", statusColor)} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">
                          EP{episode.episodeNumber}: {episode.title}
                        </div>
                        {episode.synopsis && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {episode.synopsis}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span className="capitalize">{episode.status.replace('_', ' ')}</span>
                          {episode.duration && (
                            <>
                              <span>•</span>
                              <span>{Math.floor(episode.duration / 60)}:{String(episode.duration % 60).padStart(2, '0')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Episode</DialogTitle>
            <DialogDescription>
              Add a new episode to your anime series
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="episode-title">Episode Title</Label>
              <Input
                id="episode-title"
                placeholder={`Episode ${episodes.length + 1}: `}
                value={newEpisodeTitle}
                onChange={(e) => setNewEpisodeTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="episode-synopsis">Synopsis</Label>
              <Textarea
                id="episode-synopsis"
                placeholder="Brief description of what happens in this episode..."
                value={newEpisodeSynopsis}
                onChange={(e) => setNewEpisodeSynopsis(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateEpisode}
              disabled={createEpisode.isPending}
            >
              {createEpisode.isPending ? "Creating..." : "Create Episode"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 