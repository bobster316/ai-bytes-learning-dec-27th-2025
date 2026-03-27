import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const API_KEY = process.env.HEYGEN_API_KEY;
const BASE_URL = 'https://api.heygen.com';
const TEMPLATE_ID = '411231c2870e4df98f24351f3ab616d6';

async function inspect() {
    try {
        const response = await fetch(`${BASE_URL}/v1/template.get?template_id=${TEMPLATE_ID}`, {
            method: 'GET',
            headers: {
                'X-Api-Key': API_KEY || '',
            }
        });

        const data = await response.json();
        console.log('Template Details:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

inspect();
