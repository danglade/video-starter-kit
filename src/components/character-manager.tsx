"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCharacters } from "@/data/queries";
import { queryKeys } from "@/data/queries";
import { Character } from "@/data/schema";
import { db } from "@/data/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Trash2, RefreshCw, User, Loader2, AlertCircle, CheckCircle, Image as ImageIcon } from "lucide-react";
import { CharacterDialog } from "./character-dialog";
import { useCharacterStatusPolling } from "@/hooks/use-character-status";

export function CharacterManager() {
  const queryClient = useQueryClient();
  const { data: characters, isLoading } = useCharacters();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteCharacterId, setDeleteCharacterId] = useState<string | null>(null);
  
  // Poll for status updates
  useCharacterStatusPolling(null);
  
  const deleteCharacter = useMutation({
    mutationFn: async (characterId: string) => {
      await db.characters.delete(characterId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters });
      toast({
        title: "Character deleted",
        description: "The character has been removed.",
      });
      setDeleteCharacterId(null);
    },
    onError: () => {
      toast({
        title: "Failed to delete character",
        description: "There was an error deleting the character.",
        variant: "destructive",
      });
    },
  });
  
  const retryTraining = useMutation({
    mutationFn: async (characterId: string) => {
      const response = await fetch(`/api/db/characters/${characterId}/train`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to start training');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters });
      toast({
        title: "Training restarted",
        description: "The character training has been restarted.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to restart training",
        description: "There was an error restarting the training.",
        variant: "destructive",
      });
    },
  });
  
  const getStatusIcon = (status: Character['trainingStatus']) => {
    switch (status) {
      case 'pending':
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'training':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
    }
  };
  
  const getStatusColor = (status: Character['trainingStatus']) => {
    switch (status) {
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
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Characters</h2>
          <p className="text-muted-foreground">
            Manage your custom LoRA characters for image generation
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          Create Character
        </Button>
      </div>
      
      {characters && characters.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No characters yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first character to start generating custom images
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              Create Character
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters?.map((character: Character) => (
            <Card key={character.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{character.name}</CardTitle>
                    {character.description && (
                      <CardDescription className="text-sm">
                        {character.description}
                      </CardDescription>
                    )}
                  </div>
                  {character.thumbnailUrl && (
                    <img
                      src={character.thumbnailUrl}
                      alt={character.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(character.trainingStatus) as any}>
                      {getStatusIcon(character.trainingStatus)}
                      {character.trainingStatus}
                    </Badge>
                  </div>
                  
                  {character.trainingError && (
                    <p className="text-sm text-destructive">
                      {character.trainingError}
                    </p>
                  )}
                  
                  {character.trainingImages && (
                    <p className="text-sm text-muted-foreground">
                      {character.trainingImages.length} training images
                    </p>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(character.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                {character.trainingStatus === 'completed' && !character.thumbnailUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/db/characters/${character.id}/thumbnail`, {
                          method: 'POST',
                        });
                        if (response.ok) {
                          toast({
                            title: "Thumbnail generation started",
                            description: "This may take a minute.",
                          });
                        }
                      } catch (error) {
                        toast({
                          title: "Failed to generate thumbnail",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <ImageIcon className="h-4 w-4 mr-1" />
                    Generate Thumbnail
                  </Button>
                )}
                {character.trainingStatus === 'failed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => retryTraining.mutate(character.id)}
                    disabled={retryTraining.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Retry
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteCharacterId(character.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      <CharacterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
      
      <AlertDialog open={!!deleteCharacterId} onOpenChange={() => setDeleteCharacterId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Character</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this character? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCharacterId && deleteCharacter.mutate(deleteCharacterId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 