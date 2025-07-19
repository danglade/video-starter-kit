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
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { EpisodeList } from "./episode-list";

export default function LeftPanel() {
  const projectId = useProjectId();
  const { data: project = PROJECT_PLACEHOLDER } = useProject(projectId);
  const projectUpdate = useProjectUpdater(projectId);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | undefined>();
  
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
      <div className="flex-1 overflow-hidden">
        <EpisodeList
          projectId={projectId}
          onEpisodeSelect={(episode) => {
            setSelectedEpisodeId(episode.id);
            // TODO: Update main view to show episode details
          }}
          selectedEpisodeId={selectedEpisodeId}
        />
      </div>
    </div>
  );
}
