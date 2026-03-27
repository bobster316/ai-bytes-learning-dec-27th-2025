
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { magicHourClient } from '../lib/magichour/client';

dotenv.config({ path: '.env.local' });

const ID = 'cmkk5qg8m095z3h0zvb2mjnjls';
const OUT = 'course_video_status.json';

async function inspect() {
    console.log(`Inspecting ID: ${ID}`);
    try {
        const status = await magicHourClient.getVideoStatus(ID);
        fs.writeFileSync(OUT, JSON.stringify(status, null, 2));
        console.log("Done.");
    } catch (e) {
        fs.writeFileSync(OUT, JSON.stringify({ error: (e as any).message }, null, 2));
    }
}
inspect();
