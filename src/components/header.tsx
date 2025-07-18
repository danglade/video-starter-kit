"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { SettingsIcon, Users } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CharacterManager } from "./character-manager";

export default function Header({
  openKeyDialog,
}: {
  openKeyDialog?: () => void;
}) {
  const [characterDialogOpen, setCharacterDialogOpen] = useState(false);
  
  return (
    <>
    <header className="px-4 py-2 flex justify-between items-center border-b border-border">
      <h1 className="text-lg font-medium">
        <Logo />
      </h1>
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
