
import { imageService } from './lib/ai/image-service';

async function testImages() {
    console.log("Testing Image Fetch...");
    const prompts = [
        "A futuristic quantum computer in a dark server room, neon blue lights, cinematic 8k",
        "Abstract neural network visualization, glowing nodes, data flow, purple and cyan"
    ];

    const images = await imageService.fetchImages(prompts);
    console.log("Fetched Images:", JSON.stringify(images, null, 2));

    if (images.length === 2 && images.every(img => img.url && img.url.length > 10)) {
        console.log("✅ Success: Images fetched with valid URLs.");
    } else {
        console.error("❌ Failed: Valid images not returned.");
    }
}

testImages().catch(console.error);
