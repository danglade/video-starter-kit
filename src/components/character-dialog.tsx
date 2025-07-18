"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { fal } from "@/lib/fal";
import { db } from "@/data/db";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { TRAINING_CONFIG } from "@/config/training";

interface CharacterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
}

export function CharacterDialog({ open, onOpenChange, projectId }: CharacterDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [trainingSteps, setTrainingSteps] = useState(TRAINING_CONFIG.DEFAULT_STEPS);

  const createCharacter = useMutation({
    mutationFn: async () => {
      if (!name.trim()) {
        throw new Error("Character name is required");
      }
      
      if (files.length < 5) {
        throw new Error("Please upload at least 5 images for training");
      }

      setIsUploading(true);
      
      try {
        // Upload images to fal.ai storage
        const uploadPromises = files.map(async (file) => {
          const url = await fal.storage.upload(file);
          return url;
        });
        
        const imageUrls = await Promise.all(uploadPromises);

        // Create character with pending status
        const characterId = await db.characters.create({
          name: name.trim(),
          description: description.trim() || null,
          projectId: projectId || null,
          trainingStatus: "uploading",
          trainingImages: imageUrls,
          loraUrl: null,
          thumbnailUrl: null,
          trainingJobId: null,
          trainingError: null,
        });

        // Start training immediately
        const trainResponse = await fetch(`/api/db/characters/${characterId}/train`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ steps: trainingSteps }),
        });

        if (!trainResponse.ok) {
          throw new Error("Failed to start training");
        }

        return characterId;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: (characterId) => {
      toast({
        title: "Character created",
        description: "Training has started. This may take a few minutes.",
      });
      
      // Reset form
      setName("");
      setDescription("");
      setFiles([]);
      setPreviews([]);
      setTrainingSteps(TRAINING_CONFIG.DEFAULT_STEPS);
      onOpenChange(false);
      
      // Refresh the page to show the new character
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: "Failed to create character",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (files.length + selectedFiles.length > 20) {
      toast({
        title: "Too many images",
        description: "You can upload a maximum of 20 images",
        variant: "destructive",
      });
      return;
    }

    // Add new files
    setFiles(prev => [...prev, ...selectedFiles]);

    // Create previews
    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Character</DialogTitle>
          <DialogDescription>
            Upload 5-20 images of your character to train a custom AI model.
            The images should show the same person from different angles and in different settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Character Name</Label>
            <Input
              id="name"
              placeholder="e.g., John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the character..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Training Images ({files.length}/20)</Label>
            <div className="grid grid-cols-4 gap-2">
              {previews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md"
                  />
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              
              {files.length < 20 && (
                <label className="border-2 border-dashed border-gray-300 rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors h-24">
                  <ImagePlus className="h-6 w-6 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-1">Add Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Upload at least 5 images. More images (10-20) will produce better results.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="steps">Training Steps: {trainingSteps}</Label>
            <Slider
              id="steps"
              min={TRAINING_CONFIG.MIN_STEPS}
              max={TRAINING_CONFIG.MAX_STEPS}
              step={100}
              value={[trainingSteps]}
              onValueChange={(value) => setTrainingSteps(value[0])}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              More steps = better quality but longer training time. Default: {TRAINING_CONFIG.DEFAULT_STEPS}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createCharacter.isPending || isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createCharacter.mutate()}
              disabled={createCharacter.isPending || files.length < 5 || !name.trim() || isUploading}
            >
              {createCharacter.isPending || isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? "Uploading..." : "Creating..."}
                </>
              ) : (
                "Create & Start Training"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 