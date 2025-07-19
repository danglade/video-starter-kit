import { prisma } from '@/lib/prisma'
import { getOrCreateUserId } from '@/lib/auth'
import type {
  MediaItem,
  VideoKeyFrame,
  VideoProject,
  VideoTrack,
  Character,
  Episode,
  Scene,
  Shot,
} from "./schema"

// Helper to get the actual database user ID from the temp ID
async function getUserId(): Promise<string> {
  const tempUserId = await getOrCreateUserId()
  const user = await prisma.user.findUnique({
    where: { tempId: tempUserId }
  })
  
  if (!user) {
    throw new Error(`User not found for tempId: ${tempUserId}`)
  }
  
  return user.id
}

// Server-side database operations
export const serverDb = {
  projects: {
    async find(id: string): Promise<VideoProject | null> {
      const userId = await getUserId()
      const project = await prisma.project.findFirst({
        where: { id, userId }
      })
      
      if (!project) return null
      
      return {
        id: project.id,
        title: project.title,
        description: project.description,
        aspectRatio: project.aspectRatio as VideoProject['aspectRatio'],
        visualStyle: project.visualStyle as VideoProject['visualStyle'],
        categories: project.categories as VideoProject['categories'],
        episodeCount: project.episodeCount,
        synopsis: project.synopsis
      }
    },
    
    async list(): Promise<VideoProject[]> {
      const userId = await getUserId()
      const projects = await prisma.project.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
      
      return projects.map((p: any) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        aspectRatio: p.aspectRatio as VideoProject['aspectRatio'],
        visualStyle: p.visualStyle as VideoProject['visualStyle'],
        categories: p.categories as VideoProject['categories'],
        episodeCount: p.episodeCount,
        synopsis: p.synopsis
      }))
    },
    
    async create(project: Omit<VideoProject, "id">) {
      const userId = await getUserId()
      
      const created = await prisma.project.create({
        data: {
          userId,
          title: project.title,
          description: project.description,
          aspectRatio: project.aspectRatio,
          visualStyle: project.visualStyle,
          categories: project.categories,
          episodeCount: project.episodeCount,
          synopsis: project.synopsis
        }
      })
      
      return created.id
    },
    
    async update(id: string, project: Partial<VideoProject>) {
      const userId = await getUserId()
      await prisma.project.updateMany({
        where: { id, userId },
        data: {
          title: project.title,
          description: project.description,
          aspectRatio: project.aspectRatio
        }
      })
      
      return id
    },
  },

  tracks: {
    async find(id: string): Promise<VideoTrack | null> {
      const track = await prisma.track.findUnique({
        where: { id },
        include: { project: true }
      })
      
      if (!track || track.project.userId !== await getUserId()) return null
      
      return {
        id: track.id,
        locked: track.locked,
        label: track.label,
        type: track.type as VideoTrack['type'],
        projectId: track.projectId
      }
    },
    
    async tracksByProject(projectId: string): Promise<VideoTrack[]> {
      const userId = await getUserId()
      const tracks = await prisma.track.findMany({
        where: { 
          projectId,
          project: { userId }
        },
        orderBy: { order: 'asc' }
      })
      
      return tracks.map((t: any) => ({
        id: t.id,
        locked: t.locked,
        label: t.label,
        type: t.type as VideoTrack['type'],
        projectId: t.projectId
      }))
    },
    
    async create(track: Omit<VideoTrack, "id">) {
      const userId = await getUserId()
      
      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: { id: track.projectId, userId }
      })
      
      if (!project) throw new Error('Project not found or unauthorized')
      
      // Get the next order value
      const maxOrder = await prisma.track.aggregate({
        where: { projectId: track.projectId },
        _max: { order: true }
      })
      
      const created = await prisma.track.create({
        data: {
          projectId: track.projectId,
          locked: track.locked,
          label: track.label,
          type: track.type,
          order: (maxOrder._max.order ?? -1) + 1
        }
      })
      
      return created.id
    },
  },

  keyFrames: {
    async find(id: string): Promise<VideoKeyFrame | null> {
      const keyFrame = await prisma.keyFrame.findUnique({
        where: { id },
        include: { track: { include: { project: true } } }
      })
      
      if (!keyFrame || keyFrame.track.project.userId !== await getUserId()) return null
      
      return {
        id: keyFrame.id,
        timestamp: keyFrame.timestamp,
        duration: keyFrame.duration,
        trackId: keyFrame.trackId,
        data: keyFrame.data as VideoKeyFrame['data']
      }
    },
    
    async keyFramesByTrack(trackId: string): Promise<VideoKeyFrame[]> {
      const userId = await getUserId()
      const keyFrames = await prisma.keyFrame.findMany({
        where: { 
          trackId,
          track: { project: { userId } }
        },
        orderBy: { timestamp: 'asc' }
      })
      
      return keyFrames.map((kf: any) => ({
        id: kf.id,
        timestamp: kf.timestamp,
        duration: kf.duration,
        trackId: kf.trackId,
        data: kf.data as VideoKeyFrame['data']
      }))
    },
    
    async create(keyFrame: Omit<VideoKeyFrame, "id">) {
      const userId = await getUserId()
      
      // Verify track ownership
      const track = await prisma.track.findUnique({
        where: { id: keyFrame.trackId },
        include: { project: true }
      })
      
      if (!track || track.project.userId !== userId) {
        throw new Error('Track not found or unauthorized')
      }
      
      const created = await prisma.keyFrame.create({
        data: {
          trackId: keyFrame.trackId,
          timestamp: keyFrame.timestamp,
          duration: keyFrame.duration,
          data: keyFrame.data as any
        }
      })
      
      return created.id
    },
    
    async update(id: string, keyFrame: Partial<VideoKeyFrame>) {
      const userId = await getUserId()
      
      // Verify ownership
      const existing = await prisma.keyFrame.findUnique({
        where: { id },
        include: { track: { include: { project: true } } }
      })
      
      if (!existing || existing.track.project.userId !== userId) {
        throw new Error('KeyFrame not found or unauthorized')
      }
      
      await prisma.keyFrame.update({
        where: { id },
        data: {
          timestamp: keyFrame.timestamp,
          duration: keyFrame.duration,
          data: keyFrame.data as any
        }
      })
      
      return id
    },
    
    async delete(id: string) {
      const userId = await getUserId()
      
      // Verify ownership
      const keyFrame = await prisma.keyFrame.findUnique({
        where: { id },
        include: { track: { include: { project: true } } }
      })
      
      if (!keyFrame || keyFrame.track.project.userId !== userId) {
        throw new Error('KeyFrame not found or unauthorized')
      }
      
      await prisma.keyFrame.delete({ where: { id } })
      return id
    },
  },

  media: {
    async find(id: string): Promise<MediaItem | null> {
      const userId = await getUserId()
      const media = await prisma.mediaItem.findFirst({
        where: { id, userId }
      })
      
      if (!media) return null
      
      if (media.kind === 'generated') {
        return {
          id: media.id,
          kind: 'generated',
          endpointId: media.endpointId!,
          requestId: media.requestId!,
          projectId: media.projectId,
          mediaType: media.mediaType as MediaItem['mediaType'],
          status: media.status as MediaItem['status'],
          createdAt: media.createdAt.getTime(),
          input: media.input as any,
          output: media.output as any,
          url: media.url,
          metadata: media.metadata as any
        }
      } else {
        return {
          id: media.id,
          kind: 'uploaded',
          projectId: media.projectId,
          mediaType: media.mediaType as MediaItem['mediaType'],
          status: media.status as MediaItem['status'],
          createdAt: media.createdAt.getTime(),
          url: media.url!,
          metadata: media.metadata as any
        }
      }
    },
    
    async mediaByProject(projectId: string): Promise<MediaItem[]> {
      const userId = await getUserId()
      const mediaItems = await prisma.mediaItem.findMany({
        where: { projectId, userId },
        orderBy: { createdAt: 'desc' }
      })
      
      return mediaItems.map((media: any) => {
        if (media.kind === 'generated') {
          return {
            id: media.id,
            kind: 'generated' as const,
            endpointId: media.endpointId!,
            requestId: media.requestId!,
            projectId: media.projectId,
            mediaType: media.mediaType as MediaItem['mediaType'],
            status: media.status as MediaItem['status'],
            createdAt: media.createdAt.getTime(),
            input: media.input as any,
            output: media.output as any,
            url: media.url,
            metadata: media.metadata as any
          }
        } else {
          return {
            id: media.id,
            kind: 'uploaded' as const,
            projectId: media.projectId,
            mediaType: media.mediaType as MediaItem['mediaType'],
            status: media.status as MediaItem['status'],
            createdAt: media.createdAt.getTime(),
            url: media.url!,
            metadata: media.metadata as any
          }
        }
      })
    },
    
    async create(media: Omit<MediaItem, "id">) {
      const userId = await getUserId()
      console.log('Creating media for user:', userId, 'project:', media.projectId)
      
      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: { id: media.projectId, userId }
      })
      
      if (!project) {
        console.error('Project not found:', media.projectId, 'for user:', userId)
        const allProjects = await prisma.project.findMany({ where: { userId } })
        console.error('User projects:', allProjects)
        throw new Error(`Project ${media.projectId} not found or unauthorized for user ${userId}`)
      }
      
      const created = await prisma.mediaItem.create({
        data: {
          userId,
          projectId: media.projectId,
          kind: media.kind,
          endpointId: media.kind === 'generated' ? media.endpointId : null,
          requestId: media.kind === 'generated' ? media.requestId : null,
          mediaType: media.mediaType,
          status: media.status,
          input: media.kind === 'generated' ? media.input : null,
          output: media.kind === 'generated' ? media.output : null,
          url: media.url,
          metadata: media.metadata,
          createdAt: new Date(media.createdAt)
        }
      })
      
      return created.id
    },
    
    async update(id: string, media: Partial<MediaItem>) {
      const userId = await getUserId()
      
      await prisma.mediaItem.updateMany({
        where: { id, userId },
        data: {
          status: media.status,
          output: media.output as any,
          url: media.url,
          metadata: media.metadata as any
        }
      })
      
      return id
    },
    
    async delete(id: string) {
      const userId = await getUserId()
      
      // Verify ownership
      const media = await prisma.mediaItem.findUnique({
        where: { id },
        include: { project: true }
      })
      
      if (!media || media.project.userId !== userId) {
        throw new Error('Media item not found or unauthorized')
      }
      
      await prisma.mediaItem.delete({ where: { id } })
      return id
    }
  },
  
  characters: {
    async all() {
      const userId = await getUserId()
      return prisma.character.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
    },
    
    async byProject(projectId: string) {
      const userId = await getUserId()
      
      // Verify project ownership
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      })
      
      if (!project || project.userId !== userId) {
        throw new Error('Project not found or unauthorized')
      }
      
      // Get both project-specific and user-global characters
      return prisma.character.findMany({
        where: {
          userId,
          OR: [
            { projectId },
            { projectId: null }
          ]
        },
        orderBy: { createdAt: 'desc' }
      })
    },
    
    async find(id: string): Promise<Character | null> {
      const userId = await getUserId()
      
      const character = await prisma.character.findUnique({
        where: { id }
      })
      
      if (!character || character.userId !== userId) {
        return null
      }
      
      return character as Character
    },
    
    async create(character: Omit<Character, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
      const userId = await getUserId()
      
      // If projectId is provided, verify ownership
      if (character.projectId) {
        const project = await prisma.project.findUnique({
          where: { id: character.projectId }
        })
        
        if (!project || project.userId !== userId) {
          throw new Error('Project not found or unauthorized')
        }
      }
      
      const created = await prisma.character.create({
        data: {
          ...character,
          userId,
          trainingImages: character.trainingImages as any
        }
      })
      
      return created.id
    },
    
    async update(id: string, character: Partial<Character>) {
      const userId = await getUserId()
      
      // Verify ownership
      const existing = await prisma.character.findUnique({
        where: { id }
      })
      
      if (!existing || existing.userId !== userId) {
        throw new Error('Character not found or unauthorized')
      }
      
      await prisma.character.update({
        where: { id },
        data: {
          ...character,
          trainingImages: character.trainingImages as any
        }
      })
      
      return id
    },
    
    async delete(id: string) {
      const userId = await getUserId()
      
      // Verify ownership
      const character = await prisma.character.findUnique({
        where: { id }
      })
      
      if (!character || character.userId !== userId) {
        throw new Error('Character not found or unauthorized')
      }
      
      await prisma.character.delete({ where: { id } })
      return id
    }
  },
  
  episodes: {
    async find(id: string): Promise<Episode | null> {
      const userId = await getUserId()
      const episode = await prisma.episode.findFirst({
        where: { 
          id,
          project: { userId }
        }
      })
      
      if (!episode) return null
      
      return {
        id: episode.id,
        projectId: episode.projectId,
        episodeNumber: episode.episodeNumber,
        title: episode.title,
        synopsis: episode.synopsis,
        duration: episode.duration,
        status: episode.status as Episode['status'],
        createdAt: episode.createdAt,
        updatedAt: episode.updatedAt
      }
    },
    
    async listByProject(projectId: string): Promise<Episode[]> {
      const userId = await getUserId()
      
      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId }
      })
      
      if (!project) return []
      
      const episodes = await prisma.episode.findMany({
        where: { projectId },
        orderBy: { episodeNumber: 'asc' }
      })
      
      return episodes.map((e: any) => ({
        id: e.id,
        projectId: e.projectId,
        episodeNumber: e.episodeNumber,
        title: e.title,
        synopsis: e.synopsis,
        duration: e.duration,
        status: e.status as Episode['status'],
        createdAt: e.createdAt,
        updatedAt: e.updatedAt
      }))
    },
    
    async create(episode: Omit<Episode, "id" | "createdAt" | "updatedAt">) {
      const userId = await getUserId()
      
      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: { id: episode.projectId, userId }
      })
      
      if (!project) {
        throw new Error('Project not found or unauthorized')
      }
      
      const created = await prisma.episode.create({
        data: episode
      })
      
      return created.id
    },
    
    async update(id: string, episode: Partial<Episode>) {
      const userId = await getUserId()
      
      // Verify ownership through project
      const existing = await prisma.episode.findFirst({
        where: { 
          id,
          project: { userId }
        }
      })
      
      if (!existing) {
        throw new Error('Episode not found or unauthorized')
      }
      
      await prisma.episode.update({
        where: { id },
        data: episode
      })
      
      return id
    },
    
    async delete(id: string) {
      const userId = await getUserId()
      
      // Verify ownership through project
      const episode = await prisma.episode.findFirst({
        where: { 
          id,
          project: { userId }
        }
      })
      
      if (!episode) {
        throw new Error('Episode not found or unauthorized')
      }
      
      await prisma.episode.delete({ where: { id } })
      return id
    }
  },
  
  scenes: {
    async find(id: string): Promise<Scene | null> {
      const userId = await getUserId()
      const scene = await prisma.scene.findFirst({
        where: { 
          id,
          episode: {
            project: { userId }
          }
        }
      })
      
      if (!scene) return null
      
      return {
        id: scene.id,
        episodeId: scene.episodeId,
        sceneNumber: scene.sceneNumber,
        title: scene.title,
        description: scene.description,
        duration: scene.duration,
        sceneType: scene.sceneType as Scene['sceneType'],
        mood: scene.mood as Scene['mood'],
        setting: scene.setting,
        status: scene.status as Scene['status'],
        createdAt: scene.createdAt,
        updatedAt: scene.updatedAt
      }
    },
    
    async listByEpisode(episodeId: string): Promise<Scene[]> {
      const userId = await getUserId()
      
      // Verify episode ownership through project
      const episode = await prisma.episode.findFirst({
        where: { 
          id: episodeId,
          project: { userId }
        }
      })
      
      if (!episode) return []
      
      const scenes = await prisma.scene.findMany({
        where: { episodeId },
        orderBy: { sceneNumber: 'asc' }
      })
      
      return scenes.map((s: any) => ({
        id: s.id,
        episodeId: s.episodeId,
        sceneNumber: s.sceneNumber,
        title: s.title,
        description: s.description,
        duration: s.duration,
        sceneType: s.sceneType as Scene['sceneType'],
        mood: s.mood as Scene['mood'],
        setting: s.setting,
        status: s.status as Scene['status'],
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      }))
    },
    
    async create(scene: Omit<Scene, "id" | "createdAt" | "updatedAt">) {
      const userId = await getUserId()
      
      // Verify episode ownership through project
      const episode = await prisma.episode.findFirst({
        where: { 
          id: scene.episodeId,
          project: { userId }
        }
      })
      
      if (!episode) {
        throw new Error('Episode not found or unauthorized')
      }
      
      const created = await prisma.scene.create({
        data: scene
      })
      
      return created.id
    },
    
    async update(id: string, scene: Partial<Scene>) {
      const userId = await getUserId()
      
      // Verify ownership through episode and project
      const existing = await prisma.scene.findFirst({
        where: { 
          id,
          episode: {
            project: { userId }
          }
        }
      })
      
      if (!existing) {
        throw new Error('Scene not found or unauthorized')
      }
      
      await prisma.scene.update({
        where: { id },
        data: scene
      })
      
      return id
    },
    
    async delete(id: string) {
      const userId = await getUserId()
      
      // Verify ownership through episode and project
      const scene = await prisma.scene.findFirst({
        where: { 
          id,
          episode: {
            project: { userId }
          }
        }
      })
      
      if (!scene) {
        throw new Error('Scene not found or unauthorized')
      }
      
      await prisma.scene.delete({ where: { id } })
      return id
    }
  },
  
  shots: {
    async find(id: string): Promise<Shot | null> {
      const userId = await getUserId()
      const shot = await prisma.shot.findFirst({
        where: { 
          id,
          scene: {
            episode: {
              project: { userId }
            }
          }
        }
      })
      
      if (!shot) return null
      
      return {
        id: shot.id,
        sceneId: shot.sceneId,
        shotNumber: shot.shotNumber,
        duration: shot.duration,
        cameraType: shot.cameraType as Shot['cameraType'],
        cameraMovement: shot.cameraMovement as Shot['cameraMovement'],
        description: shot.description,
        mediaId: shot.mediaId,
        dialogueText: shot.dialogueText,
        characterIds: shot.characterIds,
        status: shot.status as Shot['status'],
        createdAt: shot.createdAt,
        updatedAt: shot.updatedAt
      }
    },
    
    async listByScene(sceneId: string): Promise<Shot[]> {
      const userId = await getUserId()
      
      // Verify scene ownership through episode and project
      const scene = await prisma.scene.findFirst({
        where: { 
          id: sceneId,
          episode: {
            project: { userId }
          }
        }
      })
      
      if (!scene) return []
      
      const shots = await prisma.shot.findMany({
        where: { sceneId },
        orderBy: { shotNumber: 'asc' }
      })
      
      return shots.map((s: any) => ({
        id: s.id,
        sceneId: s.sceneId,
        shotNumber: s.shotNumber,
        duration: s.duration,
        cameraType: s.cameraType as Shot['cameraType'],
        cameraMovement: s.cameraMovement as Shot['cameraMovement'],
        description: s.description,
        mediaId: s.mediaId,
        dialogueText: s.dialogueText,
        characterIds: s.characterIds,
        status: s.status as Shot['status'],
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      }))
    },
    
    async create(shot: Omit<Shot, "id" | "createdAt" | "updatedAt">) {
      const userId = await getUserId()
      
      // Verify scene ownership through episode and project
      const scene = await prisma.scene.findFirst({
        where: { 
          id: shot.sceneId,
          episode: {
            project: { userId }
          }
        }
      })
      
      if (!scene) {
        throw new Error('Scene not found or unauthorized')
      }
      
      const created = await prisma.shot.create({
        data: {
          ...shot,
          characterIds: shot.characterIds || []
        }
      })
      
      return created.id
    },
    
    async update(id: string, shot: Partial<Shot>) {
      const userId = await getUserId()
      
      // Verify ownership through scene, episode and project
      const existing = await prisma.shot.findFirst({
        where: { 
          id,
          scene: {
            episode: {
              project: { userId }
            }
          }
        }
      })
      
      if (!existing) {
        throw new Error('Shot not found or unauthorized')
      }
      
      await prisma.shot.update({
        where: { id },
        data: shot
      })
      
      return id
    },
    
    async delete(id: string) {
      const userId = await getUserId()
      
      // Verify ownership through scene, episode and project
      const shot = await prisma.shot.findFirst({
        where: { 
          id,
          scene: {
            episode: {
              project: { userId }
            }
          }
        }
      })
      
      if (!shot) {
        throw new Error('Shot not found or unauthorized')
      }
      
      await prisma.shot.delete({ where: { id } })
      return id
    }
  }
} as const 