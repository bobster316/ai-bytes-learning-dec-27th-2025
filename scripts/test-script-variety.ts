
import { config } from 'dotenv';
import { resolve } from 'path';
import { NarratorAgent } from '../lib/ai/agent-system';

config({ path: resolve(process.cwd(), '.env.local') });

async function verifyVariety() {
    const agent = new NarratorAgent();
    const styles: ('PRACTICAL' | 'PROBLEM' | 'VISIONARY' | 'DIRECT' | 'ANALYTICAL')[] =
        ['VISIONARY', 'PROBLEM', 'PRACTICAL', 'ANALYTICAL', 'DIRECT'];

    const context = "Introduction to the Constellation Automotive Group, covering BCA (auctions), Cinch (online sales), and Marshall (dealerships). Target audience: new employees.";
    const title = "Constellation Automotive Group: Who We Are";

    console.log(`🧪 Testing script variety for: "${title}"\n`);

    for (const style of styles) {
        console.log(`\n--- STYLE: ${style} ---`);
        try {
            const result = await agent.generate({
                title,
                duration: 60,
                type: 'topic',
                context,
                style
            });
            console.log(`Hook Script: "${result.hook.script}"`);
        } catch (e) {
            console.error(`Error generating ${style} script:`, e);
        }
    }
}

verifyVariety();
