
import dotenv from 'dotenv';
import Stripe from 'stripe';
import path from 'path';

// Load environment variables manually
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const key = process.env.STRIPE_SECRET_KEY;

console.log('--- STRIPE KEY DEBUG ---');
console.log('Key loaded from:', envPath);
console.log('Key exists:', !!key);
if (key) {
    console.log('Key length:', key.length);
    console.log('Key start:', key.substring(0, 10));
    console.log('Key end:', key.substring(key.length - 10));
    console.log('Key content (safe):', key.replace(/[a-zA-Z0-9]/g, '*'));
} else {
    console.log('KEY IS EMPTY!');
}

const stripe = new Stripe(key || '', {
    apiVersion: '2025-10-29.clover',
});

async function testConnection() {
    try {
        console.log('Attempting to list customers...');
        const customers = await stripe.customers.list({ limit: 1 });
        console.log('SUCCESS! Connected to Stripe.');
    } catch (error: any) {
        console.error('FAILED to connect to Stripe.');
        console.error('Error type:', error.type);
        console.error('Error message:', error.message);
    }
}

testConnection();
