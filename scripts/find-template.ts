import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const API_KEY = process.env.HEYGEN_API_KEY;
const BASE_URL = 'https://api.heygen.com';

async function findCorrectTemplate() {
    if (!API_KEY) {
        console.error('HEYGEN_API_KEY not found');
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/v2/templates`, {
            method: 'GET',
            headers: {
                'X-Api-Key': API_KEY,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        const templates = data.data.templates;

        console.log('--- All Templates ---');
        templates.forEach((t: any) => {
            console.log(`ID: ${t.template_id}, Name: ${t.name}, Aspect Ratio: ${t.aspect_ratio}`);
        });

        // Filter for likely candidates
        const candidate = templates.find((t: any) =>
            t.aspect_ratio === 'landscape' &&
            (t.name.toLowerCase().includes('sarah') || t.name.toLowerCase().includes('landscape'))
        );

        if (candidate) {
            console.log('\n--- FOUND CANDIDATE ---');
            console.log(`ID: ${candidate.template_id}`);
            console.log(`Name: ${candidate.name}`);
        } else {
            console.log('\nNo matching candidate found.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

findCorrectTemplate();
