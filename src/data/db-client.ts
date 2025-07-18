import type {
  MediaItem,
  VideoKeyFrame,
  VideoProject,
  VideoTrack,
  Character,
} from "./schema";

// Helper to get the base URL for API calls
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Client-side: use relative URLs
    return ''
  }
  // Server-side: need absolute URLs
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return `http://localhost:${process.env.PORT ?? 3000}`
}

// Client-side database operations that call API routes
export const clientDb = {
  projects: {
    async find(id: string): Promise<VideoProject | null> {
      const response = await fetch(`${getBaseUrl()}/api/db/projects/${id}`)
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch project')
      }
      return response.json()
    },
    
    async list(): Promise<VideoProject[]> {
      const response = await fetch(`${getBaseUrl()}/api/db/projects`)
      if (!response.ok) throw new Error('Failed to fetch projects')
      return response.json()
    },
    
    async create(project: Omit<VideoProject, "id">) {
      const response = await fetch(`${getBaseUrl()}/api/db/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      })
      if (!response.ok) throw new Error('Failed to create project')
      const { id } = await response.json()
      return id
    },
    
    async update(id: string, project: Partial<VideoProject>) {
      const response = await fetch(`${getBaseUrl()}/api/db/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      })
      if (!response.ok) throw new Error('Failed to update project')
      return id
    },
  },

  tracks: {
    async find(id: string): Promise<VideoTrack | null> {
      // For now, we'll need to fetch from the project
      // This is a limitation we can optimize later
      throw new Error('Not implemented - use tracksByProject instead')
    },
    
    async tracksByProject(projectId: string): Promise<VideoTrack[]> {
      const response = await fetch(`${getBaseUrl()}/api/db/projects/${projectId}/tracks`)
      if (!response.ok) throw new Error('Failed to fetch tracks')
      return response.json()
    },
    
    async create(track: Omit<VideoTrack, "id">) {
      const response = await fetch(`${getBaseUrl()}/api/db/projects/${track.projectId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(track)
      })
      if (!response.ok) throw new Error('Failed to create track')
      const { id } = await response.json()
      return id
    },
  },

  keyFrames: {
    async find(id: string): Promise<VideoKeyFrame | null> {
      // For now, we'll need to fetch from the track
      // This is a limitation we can optimize later
      throw new Error('Not implemented - use keyFramesByTrack instead')
    },
    
    async keyFramesByTrack(trackId: string): Promise<VideoKeyFrame[]> {
      const response = await fetch(`${getBaseUrl()}/api/db/tracks/${trackId}/keyframes`)
      if (!response.ok) throw new Error('Failed to fetch keyframes')
      return response.json()
    },
    
    async create(keyFrame: Omit<VideoKeyFrame, "id">) {
      const response = await fetch(`${getBaseUrl()}/api/db/tracks/${keyFrame.trackId}/keyframes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keyFrame)
      })
      if (!response.ok) throw new Error('Failed to create keyframe')
      const { id } = await response.json()
      return id
    },
    
    async update(id: string, keyFrame: Partial<VideoKeyFrame>) {
      const response = await fetch(`${getBaseUrl()}/api/db/keyframes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keyFrame)
      })
      if (!response.ok) throw new Error('Failed to update keyframe')
      return id
    },
    
    async delete(id: string) {
      const response = await fetch(`${getBaseUrl()}/api/db/keyframes/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete keyframe')
      return id
    },
  },

  media: {
    async find(id: string): Promise<MediaItem | null> {
      const response = await fetch(`${getBaseUrl()}/api/db/media/${id}`)
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch media item')
      }
      return response.json()
    },
    
    async mediaByProject(projectId: string): Promise<MediaItem[]> {
      const response = await fetch(`${getBaseUrl()}/api/db/projects/${projectId}/media`)
      if (!response.ok) throw new Error('Failed to fetch media items')
      return response.json()
    },
    
    async create(media: Omit<MediaItem, "id">) {
      const response = await fetch(`${getBaseUrl()}/api/db/projects/${media.projectId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(media)
      })
      if (!response.ok) throw new Error('Failed to create media item')
      const { id } = await response.json()
      return id
    },
    
    async update(id: string, media: Partial<MediaItem>) {
      const response = await fetch(`${getBaseUrl()}/api/db/media/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(media)
      })
      if (!response.ok) throw new Error('Failed to update media item')
      return id
    },
    
    async delete(id: string) {
      const response = await fetch(`${getBaseUrl()}/api/db/media/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete media item')
      return id
    }
  },
  
  characters: {
    async all() {
      const response = await fetch(`${getBaseUrl()}/api/db/characters`)
      if (!response.ok) throw new Error('Failed to fetch characters')
      return response.json()
    },
    
    async byProject(projectId: string) {
      const response = await fetch(`${getBaseUrl()}/api/db/projects/${projectId}/characters`)
      if (!response.ok) throw new Error('Failed to fetch project characters')
      return response.json()
    },
    
    async find(id: string) {
      const response = await fetch(`${getBaseUrl()}/api/db/characters/${id}`)
      if (!response.ok) return null
      return response.json()
    },
    
    async create(character: Omit<Character, "id" | "userId" | "createdAt" | "updatedAt">) {
      const response = await fetch(`${getBaseUrl()}/api/db/characters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(character)
      })
      if (!response.ok) throw new Error('Failed to create character')
      const { id } = await response.json()
      return id
    },
    
    async update(id: string, character: Partial<Character>) {
      const response = await fetch(`${getBaseUrl()}/api/db/characters/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(character)
      })
      if (!response.ok) throw new Error('Failed to update character')
      return id
    },
    
    async delete(id: string) {
      const response = await fetch(`${getBaseUrl()}/api/db/characters/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete character')
      return id
    }
  },
} as const 