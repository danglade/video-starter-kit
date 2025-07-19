"use client";

import { useProjectUpdater } from "@/data/mutations";
import { useProject } from "@/data/queries";
import { PROJECT_PLACEHOLDER } from "@/data/schema";
import {
  useProjectId,
  useVideoProjectStore,
} from "@/data/store";
import {
  FolderOpenIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { EpisodeList } from "./episode-list";
import { useProjectCharacters } from "@/data/queries";
import { Users, Plus } from "lucide-react";
import { Badge } from "./ui/badge";
import { useState } from "react";
import { CharacterDialog } from "./character-dialog";

export default function LeftPanel() {
  const projectId = useProjectId();
  const { data: project = PROJECT_PLACEHOLDER } = useProject(projectId);
  const { data: characters = [] } = useProjectCharacters(projectId);
  const projectUpdate = useProjectUpdater(projectId);
  const selectedEpisodeId = useVideoProjectStore((s) => s.selectedEpisodeId);
  const setSelectedEpisodeId = useVideoProjectStore((s) => s.setSelectedEpisodeId);
  const [characterDialogOpen, setCharacterDialogOpen] = useState(false);
  
  const setProjectDialogOpen = useVideoProjectStore(
    (s) => s.setProjectDialogOpen,
  );

  return (
    <div className="flex flex-col border-r border-border w-96">
      <div className="p-4 flex items-center gap-4 border-b border-border">
        <div className="flex w-full">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-b-0">
              <AccordionTrigger className="py-4 h-10">
                <div className="flex flex-row items-center">
                  <h2 className="text-sm text-muted-foreground font-semibold flex-1">
                    {project?.title || "Project Settings"}
                  </h2>
                </div>
              </AccordionTrigger>
              <AccordionContent className="border-b-0">
                <div className="flex flex-col gap-4">
                  <Input
                    id="projectName"
                    name="name"
                    placeholder="untitled"
                    value={project.title}
                    onChange={(e) =>
                      projectUpdate.mutate({ title: e.target.value })
                    }
                    onBlur={(e) =>
                      projectUpdate.mutate({ title: e.target.value.trim() })
                    }
                  />

                  <Textarea
                    id="projectDescription"
                    name="description"
                    placeholder="Describe your video"
                    className="resize-none"
                    value={project.description}
                    rows={6}
                    onChange={(e) =>
                      projectUpdate.mutate({ description: e.target.value })
                    }
                    onBlur={(e) =>
                      projectUpdate.mutate({
                        description: e.target.value.trim(),
                      })
                    }
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <div className="self-start">
          <Button
            className="mt-2"
            variant="secondary"
            size="sm"
            onClick={() => setProjectDialogOpen(true)}
          >
            <FolderOpenIcon className="w-4 h-4 opacity-50" />
          </Button>
        </div>
      </div>
      
      {/* Episode List */}
      <div className="flex-1 overflow-y-auto">
        {/* Characters Section */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Characters
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCharacterDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {characters.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground mb-2">
                Create characters first for consistent shot generation
              </p>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setCharacterDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Character
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {characters.map((character: any) => (
                <div
                  key={character.id}
                  className="flex flex-col items-center p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setCharacterDialogOpen(true)}
                >
                  {character.thumbnailUrl ? (
                    <img
                      src={character.thumbnailUrl}
                      alt={character.name}
                      className="w-12 h-12 rounded-full object-cover mb-1"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-1">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-xs truncate w-full text-center">{character.name}</span>
                  <Badge 
                    variant={character.trainingStatus === 'completed' ? 'default' : 'secondary'}
                    className="text-xs mt-1"
                  >
                    {character.trainingStatus}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Episodes Section */}
        <div className="p-4">
          <h3 className="text-sm font-semibold mb-3">Episodes</h3>
          <EpisodeList
            projectId={projectId}
            onEpisodeSelect={(episode) => setSelectedEpisodeId(episode.id)}
            selectedEpisodeId={selectedEpisodeId || undefined}
          />
        </div>
      </div>
      
      <CharacterDialog
        open={characterDialogOpen}
        onOpenChange={setCharacterDialogOpen}
        projectId={projectId}
      />
    </div>
  );
}
