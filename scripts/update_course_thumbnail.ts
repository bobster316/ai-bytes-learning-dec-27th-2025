import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateCourseThumbnail() {
    // High-quality AI/neural network themed image from Unsplash
    const thumbnailUrl = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop&q=80';

    const { data, error } = await supabase
        .from('courses')
        .update({ thumbnail_url: thumbnailUrl })
        .eq('title', 'AI Model Training Essentials')
        .select();

    if (error) {
        console.error('Error updating thumbnail:', error);
    } else {
        console.log('✅ Thumbnail updated successfully!');
        console.log('Course:', data[0]?.title);
        console.log('Thumbnail URL:', data[0]?.thumbnail_url);
    }
}

updateCourseThumbnail();
