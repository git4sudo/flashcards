import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://bubmwnklzmutsocdyjwf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1Ym13bmtsem11dHNvY2R5andmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTIwNjE1MSwiZXhwIjoyMDU2NzgyMTUxfQ.rqgilhFLsgloNmIdr_Xg0i1e369eWZ8Cdnkg7YhhgKI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function ensureBucketExists() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const flashcardsBucket = buckets?.find(b => b.name === 'flashcards');

  if (!flashcardsBucket) {
    console.log('Creating flashcards bucket...');
    await supabase.storage.createBucket('flashcards', { public: true });
  }
}

async function uploadImages() {
  try {
    // Ensure the bucket exists
    await ensureBucketExists();

    // Create arrays for front and back images
    const frontImages = [];
    const backImages = [];

    // Generate filenames from 1 to 252
    for (let i = 1; i <= 252; i++) {
      const filename = `card${i}.png`;
      const frontPath = path.join('front-images', filename);
      const backPath = path.join('back-images', filename);

      if (fs.existsSync(frontPath) && fs.existsSync(backPath)) {
        frontImages.push({ filename, path: frontPath });
        backImages.push({ filename, path: backPath });
      }
    }

    console.log(`Found ${frontImages.length} front images and ${backImages.length} back images`);

    // Upload front images
    console.log('Uploading front images...');
    for (const image of frontImages) {
      const fileContent = fs.readFileSync(image.path);
      const { error } = await supabase.storage
        .from('flashcards')
        .upload(`front/${image.filename}`, fileContent, {
          contentType: 'image/png',
          upsert: true
        });

      if (error) {
        console.error(`Error uploading front/${image.filename}:`, error);
      } else {
        console.log(`Uploaded front/${image.filename}`);
      }
    }

    // Upload back images
    console.log('Uploading back images...');
    for (const image of backImages) {
      const fileContent = fs.readFileSync(image.path);
      const { error } = await supabase.storage
        .from('flashcards')
        .upload(`back/${image.filename}`, fileContent, {
          contentType: 'image/png',
          upsert: true
        });

      if (error) {
        console.error(`Error uploading back/${image.filename}:`, error);
      } else {
        console.log(`Uploaded back/${image.filename}`);
      }
    }

    console.log('Upload completed!');
  } catch (error) {
    console.error('Error during upload:', error);
  }
}

uploadImages(); 