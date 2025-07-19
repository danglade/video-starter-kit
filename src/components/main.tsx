"use client";

import BottomBar from "@/components/bottom-bar";
import Header from "@/components/header";
import RightPanel from "@/components/right-panel";
import VideoPreview from "@/components/video-preview";
import {
  VideoProjectStoreContext,
  createVideoProjectStore,
} from "@/data/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRef, useState, useEffect } from "react";
import { useStore } from "zustand";
import { ProjectDialog } from "./project-dialog";
import { MediaGallerySheet } from "./media-gallery";
import { ToastProvider } from "./ui/toast";
import { Toaster } from "./ui/toaster";
import { ExportDialog } from "./export-dialog";
import LeftPanel from "./left-panel";
import { KeyDialog } from "./key-dialog";
import { db } from "@/data/db";
import { ImageComparer } from "./image-comparer";
import { useProjectMediaItems } from "@/data/queries";

type AppProps = {
  projectId: string;
};

export function App({ projectId: initialProjectId }: AppProps) {
  const [keyDialog, setKeyDialog] = useState(false);
  const [validatedProjectId, setValidatedProjectId] = useState<string>("");
  const [isValidating, setIsValidating] = useState(true);

  // Validate the project ID exists
  useEffect(() => {
    async function validateProject() {
      if (!initialProjectId) {
        setIsValidating(false);
        return;
      }

      try {
        const project = await db.projects.find(initialProjectId);
        if (project) {
          setValidatedProjectId(initialProjectId);
        } else {
          // Clear invalid project ID from cookies
          document.cookie = "__aivs_lastProjectId=; max-age=0; path=/";
        }
      } catch (error) {
        console.error("Failed to validate project:", error);
        // Clear on error too
        document.cookie = "__aivs_lastProjectId=; max-age=0; path=/";
      } finally {
        setIsValidating(false);
      }
    }

    validateProject();
  }, [initialProjectId]);

  const queryClient = useRef(new QueryClient()).current;
  const projectStore = useRef(
    createVideoProjectStore({
      projectId: validatedProjectId,
    }),
  ).current;

  // Update store when validated project ID changes
  useEffect(() => {
    projectStore.setState({ 
      projectId: validatedProjectId,
      projectDialogOpen: !validatedProjectId
    });
  }, [validatedProjectId, projectStore]);

  const projectDialogOpen = useStore(projectStore, (s) => s.projectDialogOpen);
  const selectedMediaId = useStore(projectStore, (s) => s.selectedMediaId);
  const setSelectedMediaId = useStore(
    projectStore,
    (s) => s.setSelectedMediaId,
  );
  const handleOnSheetOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedMediaId(null);
    }
  };
  const isExportDialogOpen = useStore(projectStore, (s) => s.exportDialogOpen);
  const setExportDialogOpen = useStore(
    projectStore,
    (s) => s.setExportDialogOpen,
  );
  const comparisonDialogOpen = useStore(
    projectStore,
    (s) => s.comparisonDialogOpen,
  );
  const setComparisonDialogOpen = useStore(
    projectStore,
    (s) => s.setComparisonDialogOpen,
  );
  const selectedForComparison = useStore(
    projectStore,
    (s) => s.selectedForComparison,
  );
  const clearComparisonSelection = useStore(
    projectStore,
    (s) => s.clearComparisonSelection,
  );
  const setCompareMode = useStore(
    projectStore,
    (s) => s.setCompareMode,
  );

  if (isValidating) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <VideoProjectStoreContext.Provider value={projectStore}>
          <div className="flex flex-col relative overflow-x-hidden h-screen bg-background">
            <Header openKeyDialog={() => setKeyDialog(true)} />
            <main className="flex overflow-hidden h-full w-screen">
              <LeftPanel />
              <div className="flex flex-col flex-1">
                <VideoPreview />
                <BottomBar />
              </div>
            </main>
            <RightPanel />
          </div>
          <Toaster />
          <ProjectDialog open={projectDialogOpen} />
          <ExportDialog
            open={isExportDialogOpen}
            onOpenChange={setExportDialogOpen}
          />
          <KeyDialog
            open={keyDialog}
            onOpenChange={(open) => setKeyDialog(open)}
          />
          <MediaGallerySheet
            open={selectedMediaId !== null}
            onOpenChange={handleOnSheetOpenChange}
            selectedMediaId={selectedMediaId ?? ""}
          />
          <ImageComparerWrapper
            projectStore={projectStore}
            projectId={validatedProjectId}
          />
        </VideoProjectStoreContext.Provider>
      </QueryClientProvider>
    </ToastProvider>
  );
}

// Wrapper component to handle media items query
function ImageComparerWrapper({ projectStore, projectId }: { 
  projectStore: ReturnType<typeof createVideoProjectStore>; 
  projectId: string;
}) {
  const { data: mediaItems = [] } = useProjectMediaItems(projectId);
  const comparisonDialogOpen = useStore(
    projectStore,
    (s) => s.comparisonDialogOpen,
  );
  const setComparisonDialogOpen = useStore(
    projectStore,
    (s) => s.setComparisonDialogOpen,
  );
  const selectedForComparison = useStore(
    projectStore,
    (s) => s.selectedForComparison,
  );
  const clearComparisonSelection = useStore(
    projectStore,
    (s) => s.clearComparisonSelection,
  );
  const setCompareMode = useStore(
    projectStore,
    (s) => s.setCompareMode,
  );

  const leftImage = mediaItems.find(item => item.id === selectedForComparison[0]);
  const rightImage = mediaItems.find(item => item.id === selectedForComparison[1]);

  if (!leftImage || !rightImage || !comparisonDialogOpen) return null;

  return (
    <ImageComparer
      leftImage={leftImage}
      rightImage={rightImage}
      open={comparisonDialogOpen}
      onOpenChange={(open) => {
        setComparisonDialogOpen(open);
        if (!open) {
          clearComparisonSelection();
          setCompareMode(false);
        }
      }}
    />
  );
}
