// Test script to verify video generation works
import { videoGenerationService } from '../lib/services/video-generation';

async function testVideoGeneration() {
    console.log('🧪 Testing Video Generation Service...\n');

    const testScript = {
        hook: { duration: 10, script: "Welcome to this test course.", visualCues: [] },
        context: { duration: 10, script: "Let's test the video generation.", visualCues: [] },
        coreContent: {
            duration: 30,
            segments: [{
                title: "Test Segment",
                duration: 30,
                script: "This is a test of the video generation system.",
                visualCues: [],
                codeSegments: []
            }]
        },
        demonstration: { duration: 0, script: "", codeToShow: "", visualCues: [] },
        recap: { duration: 10, script: "That's the end of our test!", keyPoints: [] },
        transition: { duration: 0, script: "" },
        totalDuration: 60,
        pronunciationGuide: {}
    };

    try {
        console.log('📝 Test Script:', JSON.stringify(testScript, null, 2).substring(0, 200) + '...\n');

        console.log('🎬 Calling generateVideo...');
        const result = await videoGenerationService.generateVideo(
            testScript,
            'course_introduction',
            {
                useElevenLabs: true,
                useHeyGen: false,
                checkQuota: true
            }
        );

        console.log('\n✅ SUCCESS!');
        console.log('Job ID:', result.jobId);
        console.log('Status:', result.status);

    } catch (error) {
        console.error('\n❌ FAILED!');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
    }
}

testVideoGeneration();
