/**
 * Retrieve template details to see what variables it expects
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function getTemplateDetails() {
    const apiKey = process.env.HEYGEN_API_KEY;
    const templateId = process.env.HEYGEN_TEMPLATE_COURSE_INTRO;

    console.log('Retrieving template details...\n');
    console.log('Template ID:', templateId);
    console.log('');

    try {
        const response = await fetch(`https://api.heygen.com/v3/template/${templateId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Api-Key': apiKey!
            }
        });

        const responseText = await response.text();

        console.log('Response status:', response.status);
        console.log('');

        if (!response.ok) {
            console.error('❌ Failed to retrieve template');
            console.error('Response:', responseText);
            process.exit(1);
        }

        const data = JSON.parse(responseText);

        console.log('✅ Template retrieved successfully!');
        console.log('');
        console.log('Full response:');
        console.log(JSON.stringify(data, null, 2));
        console.log('');

        if (data.data?.variables) {
            console.log('📋 Variables in template:');
            console.log(JSON.stringify(data.data.variables, null, 2));
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

getTemplateDetails();
