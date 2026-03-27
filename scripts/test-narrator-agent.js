// Test script to directly call NarratorAgent and see the actual error
import { NarratorAgent } from '../lib/ai/agent-system.ts';

async function testNarrator() {
    console.log('🧪 Testing NarratorAgent directly...\n');

    const agent = new NarratorAgent();

    try {
        console.log('📝 Generating course intro script...');
        const result = await agent.generate({
            title: 'Test Course',
            duration: 60,
            type: 'course',
            context: 'This is a test course about AI fundamentals. Topics: Neural Networks, Deep Learning, Transformers'
        });

        console.log('\n✅ SUCCESS! Script generated:');
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('\n❌ FAILED! Error details:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
    }
}

testNarrator();
