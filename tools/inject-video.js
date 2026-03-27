require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function injectVideo() {
    // get latest lesson with blocks
    const { data: lessons } = await supabase
        .from('course_lessons')
        .select('*')
        .not('content_blocks', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

    if (!lessons || lessons.length === 0) {
        console.log("No lessons found");
        return;
    }

    const lesson = lessons[0];
    let blocks = lesson.content_blocks;

    // Filter out previous video block if we injected it
    blocks = blocks.filter(b => b.id !== "video_snippet" && !b.id.startsWith("video_"));

    let injected = false;

    // insert a new full_image video block explicitly
    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        if (b.type === 'full_image' || b.type === 'text') {
            blocks.splice(i + 1, 0, {
                id: "video_" + Date.now(),
                order: b.order + 0.1,
                type: "full_image",
                imageUrl: "/videos/intro.mp4",
                imagePrompt: "Interactive Video Resource",
                imageAlt: "Video explainer",
                caption: "Watch this 8-second breakdown illustrating the concept.",
                captionHighlight: "Video Explanation"
            });
            injected = true;
            break;
        }
    }

    if (injected) {
        // fix ordering
        blocks.forEach((b, idx) => b.order = idx);

        await supabase.from('course_lessons').update({
            content_blocks: blocks
        }).eq('id', lesson.id);

        console.log("Successfully injected 8-second video block into lesson:", lesson.title);
    } else {
        console.log("Could not find a place to inject video.");
    }
}

injectVideo();
