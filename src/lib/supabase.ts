import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = 'https://bubmwnklzmutsocdyjwf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1Ym13bmtsem11dHNvY2R5andmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMDYxNTEsImV4cCI6MjA1Njc4MjE1MX0.0IyT-dcGdNmgmve8um9M0m-Uw1W5gNwA4Sd_SB0HOVs';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are missing. Please check your .env file.');
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);