import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bubmwnklzmutsocdyjwf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1Ym13bmtsem11dHNvY2R5andmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTIwNjE1MSwiZXhwIjoyMDU2NzgyMTUxfQ.rqgilhFLsgloNmIdr_Xg0i1e369eWZ8Cdnkg7YhhgKI';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkStorage() {
  try {
    console.log('Checking flashcards bucket contents...');
    
    // Check front folder
    const { data: frontFiles, error: frontError } = await supabase.storage
      .from('flashcards')
      .list('front');

    if (frontError) {
      console.error('Error listing front folder:', frontError);
      return;
    }

    console.log('\nFront folder contents:');
    console.log(`Total files: ${frontFiles.length}`);
    frontFiles.forEach(file => console.log(`- ${file.name}`));

    // Check back folder
    const { data: backFiles, error: backError } = await supabase.storage
      .from('flashcards')
      .list('back');

    if (backError) {
      console.error('Error listing back folder:', backError);
      return;
    }

    console.log('\nBack folder contents:');
    console.log(`Total files: ${backFiles.length}`);
    backFiles.forEach(file => console.log(`- ${file.name}`));

    // Get public URLs for a sample file
    if (frontFiles.length > 0) {
      const sampleFile = frontFiles[0];
      const { data: { publicUrl } } = supabase.storage
        .from('flashcards')
        .getPublicUrl(`front/${sampleFile.name}`);
      
      console.log('\nSample public URL:');
      console.log(publicUrl);
    }

  } catch (error) {
    console.error('Error checking storage:', error);
  }
}

// Run the check
checkStorage(); 