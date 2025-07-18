import { fal } from './fal';
import JSZip from 'jszip';

/**
 * Creates a zip file from multiple image URLs and uploads it to fal.ai storage
 * @param imageUrls Array of image URLs (already uploaded to fal.ai)
 * @param characterName Name of the character for the zip file
 * @returns URL of the uploaded zip file
 */
export async function createImageZip(imageUrls: string[], characterName: string): Promise<string> {
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
      
      const blob = await response.blob();
      const extension = blob.type.split('/')[1] || 'jpg';
      zip.file(`image_${i + 1}.${extension}`, blob);
    }
    
    // Generate the zip file
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    
    // Create a File object from the blob
    const zipFile = new File(
      [zipBlob], 
      `${characterName.toLowerCase().replace(/\s+/g, '_')}_training.zip`,
      { type: 'application/zip' }
    );
    
    // Upload to fal.ai storage
    const zipUrl = await fal.storage.upload(zipFile);
    
    return zipUrl;
  } catch (error) {
    console.error('Error creating zip file:', error);
    throw new Error('Failed to create training zip file');
  }
} 