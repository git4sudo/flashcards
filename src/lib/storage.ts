import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

interface StorageLog {
  timestamp: string;
  action: string;
  status: 'success' | 'error';
  details: string;
}

const BUCKET_NAME = 'ror-cards';
const logs: StorageLog[] = [];

const logAction = (action: string, status: 'success' | 'error', details: string) => {
  const log: StorageLog = {
    timestamp: new Date().toISOString(),
    action,
    status,
    details,
  };
  logs.push(log);
  console.log(`[${log.timestamp}] ${action}: ${status} - ${details}`);
};

export const getLogs = () => [...logs];

const ensureBucketExists = async (): Promise<boolean> => {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);

    if (!bucketExists) {
      // Create the bucket if it doesn't exist
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true, // Make bucket public
        fileSizeLimit: 5242880, // 5MB limit
      });

      if (error) {
        logAction('Bucket Creation', 'error', `Failed to create bucket: ${error.message}`);
        return false;
      }

      logAction('Bucket Creation', 'success', `Created bucket: ${BUCKET_NAME}`);
    }

    return true;
  } catch (error) {
    logAction('Bucket Check', 'error', `Failed to check/create bucket: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

export const uploadRoRImage = async (
  file: File,
  type: 'fronts' | 'backs'
): Promise<UploadResult> => {
  try {
    // Validate file type
    if (file.type !== 'image/png') {
      throw new Error('Invalid file type. Only PNG images are allowed.');
    }

    // Ensure bucket exists before upload
    const bucketReady = await ensureBucketExists();
    if (!bucketReady) {
      throw new Error('Storage bucket is not available');
    }

    // Generate unique filename
    const fileName = `${uuidv4()}.png`;
    const filePath = `${type}/${fileName}`;

    // Upload file
    const { error: uploadError, data } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    logAction(
      'RoR Image Upload',
      'success',
      `Successfully uploaded ${file.name} to ${type} (${publicUrl})`
    );

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logAction('RoR Image Upload', 'error', `Failed to upload ${file.name}: ${errorMessage}`);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
};

export const deleteRoRImage = async (url: string): Promise<boolean> => {
  try {
    // Extract path from URL
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const type = urlParts[urlParts.length - 2];
    const path = `${type}/${fileName}`;
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      throw error;
    }

    logAction('RoR Image Delete', 'success', `Successfully deleted ${path}`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logAction('RoR Image Delete', 'error', `Failed to delete image: ${errorMessage}`);
    return false;
  }
};