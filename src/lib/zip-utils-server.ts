import { falServer } from './fal-server';
import JSZip from 'jszip';

/**
 * Creates a zip file from multiple image URLs and uploads it to fal.ai storage (server-side)
 * @param imageUrls Array of image URLs (already uploaded to fal.ai)
 * @param characterName Name of the character for the zip file
 * @returns URL of the uploaded zip file
 */
export async function createImageZipServer(imageUrls: string[], characterName: string): Promise<string> {
  if (imageUrls.length === 0) {
    throw new Error('No images provided');
  }

  try {
    // Create a new zip file
    const zip = new JSZip();
    
    // Download each image and add to zip
    for (let i = 0; i < imageUrls.length; i++) {
      const response = await fetch(imageUrls[i]);
      if (!response.ok) {
        throw new Error(`Failed to fetch image ${i}: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const extension = response.headers.get('content-type')?.split('/')[1] || 'jpg';
      zip.file(`image_${i + 1}.${extension}`, buffer);
    }
    
    // Generate the zip file
    const zipBuffer = await zip.generateAsync({ 
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    
    // Create a File-like object for the server
    const blob = new Blob([zipBuffer], { type: 'application/zip' });
    const fileName = `${characterName.toLowerCase().replace(/\s+/g, '_')}_training.zip`;
    
    // Convert Blob to File for fal.ai upload
    const file = new File([blob], fileName, { type: 'application/zip' });
    
    // Upload to fal.ai storage using server client
    const zipUrl = await falServer.storage.upload(file);
    
    return zipUrl;
  } catch (error) {
    console.error('Error creating zip file:', error);
    throw new Error('Failed to create training zip file');
  }
} 