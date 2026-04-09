import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function getUrl() {
  const { data } = await supabase.from('courses').select('thumbnail_url').order('created_at', { ascending: false }).limit(1);
  if (data) process.stdout.write(data[0].thumbnail_url);
}
getUrl();
