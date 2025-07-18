"use client";

import { useState } from "react";
import { useProjectCharacters } from "@/data/queries";
import { useProjectId } from "@/data/store";
import { Character } from "@/data/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, User, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { CharacterDialog } from "./character-dialog";
import { cn } from "@/lib/utils";
import { useCharacterStatusPolling } from "@/hooks/use-character-status";

interface CharacterCardProps {
  character: Character;
  isSelected: boolean;
  onSelect: () => void;
}

function CharacterCard({ character, isSelected, onSelect }: CharacterCardProps) {
  const getStatusIcon = () => {
    switch (character.trainingStatus) {
      case 'pending':
      case 'uploading':
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'training':
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getStatusColor = () => {
    switch (character.trainingStatus) {
      case 'pending':
      case 'uploading':
        return 'secondary';
      case 'training':
        return 'default';
      case 'completed':
        return 'success';
      case 'failed':
        return 'destructive';
    }
  };

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative aspect-square rounded-lg border-2 transition-all",
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-primary/50"
      )}
      disabled={character.trainingStatus !== 'completed'}
    >
      {character.thumbnailUrl ? (
        <img
          src={character.thumbnailUrl}
          alt={character.name}
          className="w-full h-full object-cover rounded-md"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted rounded-md">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 rounded-b-md">
        <h3 className="text-sm font-medium text-white truncate">
          {character.name}
        </h3>
        <Badge
          variant={getStatusColor() as any}
          className="mt-1 h-5 text-xs gap-1"
        >
          {getStatusIcon()}
          {character.trainingStatus}
        </Badge>
      </div>
      
      {character.trainingError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
          <p className="text-xs text-white px-2 text-center">
            {character.trainingError}
          </p>
        </div>
      )}
    </button>
  );
}

interface CharacterGalleryProps {
  selectedCharacterId?: string | null;
  onSelectCharacter: (characterId: string) => void;
}

export function CharacterGallery({
  selectedCharacterId,
  onSelectCharacter,
}: CharacterGalleryProps) {
  const projectId = useProjectId();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { data: characters, isLoading, error } = useProjectCharacters(projectId || '');
  
  // Poll for status updates when characters are training (only if no error)
  useCharacterStatusPolling(error ? null : projectId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Characters</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Characters</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Unable to load characters. You can still create new ones.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Characters</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {characters && characters.length === 0 ? (
        <div className="text-center py-8">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            No characters yet. Create your first character to start generating images.
          </p>
          <Button
            size="sm"
            variant="default"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Character
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {/* Character cards */}
          {characters?.map((character: Character) => (
            <CharacterCard
              key={character.id}
              character={character}
              isSelected={selectedCharacterId === character.id}
              onSelect={() => onSelectCharacter(character.id)}
            />
          ))}
          
          {/* Create new character */}
          <button
            onClick={() => setDialogOpen(true)}
            className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-all flex flex-col items-center justify-center gap-1"
          >
            <Plus className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Create</span>
          </button>
        </div>
      )}
      
      <CharacterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
      />
    </div>
  );
} 