
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.MAGIC_HOUR_API_KEY;
const JOB_ID = 'cmkk659rq099j3h0zve2senpa';
const LOG_FILE = 'debug_output_3.txt';

async function probe() {
    fs.appendFileSync(LOG_FILE, `\n=== Probing ID: ${JOB_ID} ===\n`);

    const endpoints = [
        `https://api.magichour.ai/v1/video-projects/${JOB_ID}`,
        `https://api.magichour.ai/v1/renders/${JOB_ID}`,
        `https://api.magichour.ai/v1/assets/${JOB_ID}`
    ];

    for (const url of endpoints) {
        try {
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${API_KEY}` } });
            fs.appendFileSync(LOG_FILE, `[${res.status}] ${url}\n`);

            if (res.ok) {
                const json = await res.json();
                fs.appendFileSync(LOG_FILE, "MATCH FOUND! Body:\n");
                fs.appendFileSync(LOG_FILE, JSON.stringify(json, null, 2) + "\n");
                break;
            } else {
                const txt = await res.text();
                fs.appendFileSync(LOG_FILE, `   Error Body: ${txt.substring(0, 100)}\n`);
            }
        } catch (e: any) {
            fs.appendFileSync(LOG_FILE, `Error details for ${url}: ${e.message}\n`);
        }
    }
}
probe();
