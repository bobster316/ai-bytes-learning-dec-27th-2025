
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient(true); // Service Role

    try {
        const { data, error } = await supabase
            .from('courses')
            .insert({
                title: 'Test DB Insert',
                description: 'Testing insert capability',
                difficulty: 'Intermediate',
                estimated_duration_hours: 1,
                published: false
            })
            .select().single();

        if (error) {
            return NextResponse.json({ success: false, error }, { status: 500 });
        }

        // Clean up
        await supabase.from('courses').delete().eq('id', data.id);

        return NextResponse.json({ success: true, max_id: data.id });
    } catch (err) {
        return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
    }
}
