import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const API_KEY = process.env.HEYGEN_API_KEY;
const BASE_URL = 'https://api.heygen.com';
const TEMPLATE_ID = '2e4bee055dd84386b10d93b1bb5b7dba';

async function inspectTemplate() {
    if (!API_KEY) {
        console.error('HEYGEN_API_KEY not found');
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/v2/template/${TEMPLATE_ID}`, {
            method: 'GET',
            headers: {
                'X-Api-Key': API_KEY,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        console.log('Template Details:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

inspectTemplate();
