import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProjectCharacters } from '@/data/queries';
import { queryKeys } from '@/data/queries';
import { Character } from '@/data/schema';

export function useCharacterStatusPolling(projectId: string | null) {
  const queryClient = useQueryClient();
  const { data: characters } = useProjectCharacters(projectId || '');
  
  useEffect(() => {
    if (!characters || characters.length === 0) return;
    
    // Check if any characters are in training status
    const hasTrainingCharacters = characters.some(
      (char: Character) => char.trainingStatus === 'training' || char.trainingStatus === 'uploading'
    );
    
    if (!hasTrainingCharacters) return;
    
    // Poll every 5 seconds
    const interval = setInterval(() => {
      // Invalidate character queries to refetch status
      queryClient.invalidateQueries({ queryKey: queryKeys.characters });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectCharacters(projectId) });
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [characters, projectId, queryClient]);
} 