"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { SettingsIcon, Users, Sparkles } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CharacterManager } from "./character-manager";
import { useProject } from "@/data/queries";
import { useProjectId } from "@/data/store";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

const visualStyleLabels = {
  shonen_tv: "Shonen TV",
  ghibli_soft: "Ghibli Soft",
  modern_manhwa: "Modern Manhwa",
  classic_ova: "Classic OVA",
};

const visualStyleColors = {
  shonen_tv: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  ghibli_soft: "bg-green-500/10 text-green-500 border-green-500/20",
  modern_manhwa: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  classic_ova: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

export default function Header({
  openKeyDialog,
}: {
  openKeyDialog?: () => void;
}) {
  const [characterDialogOpen, setCharacterDialogOpen] = useState(false);
  const projectId = useProjectId();
  const { data: project } = useProject(projectId);
  
  return (
    <>
    <header className="px-4 py-2 flex justify-between items-center border-b border-border">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-medium">
          <Logo />
        </h1>
        {project && project.visualStyle && (
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <Badge 
              variant="outline" 
              className={cn("text-xs", visualStyleColors[project.visualStyle])}
            >
              {visualStyleLabels[project.visualStyle]}
            </Badge>
            {project.episodeCount && (
              <span className="text-xs text-muted-foreground">
                {project.episodeCount} Episodes
              </span>
            )}
          </div>
        )}
      </div>
      <nav className="flex flex-row items-center justify-end gap-1">
        <Button variant="ghost" size="sm" asChild>
          <a href="https://fal.ai" target="_blank" rel="noopener noreferrer">
            fal.ai
          </a>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <a
            href="https://github.com/fal-ai-community/video-starter-kit"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCharacterDialogOpen(true)}
          title="Characters"
        >
          <Users className="w-5 h-5" />
        </Button>
        {process.env.NEXT_PUBLIC_CUSTOM_KEY && openKeyDialog && (
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={openKeyDialog}
          >
            {typeof localStorage !== "undefined" &&
              !localStorage?.getItem("falKey") && (
                <span className="dark:bg-orange-400 bg-orange-600 w-2 h-2 rounded-full absolute top-1 right-1"></span>
              )}
            <SettingsIcon className="w-6 h-6" />
          </Button>
        )}
      </nav>
    </header>
    
    <Dialog open={characterDialogOpen} onOpenChange={setCharacterDialogOpen}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <CharacterManager />
      </DialogContent>
    </Dialog>
    </>
  );
}
