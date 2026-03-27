
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local properly
const envPath = path.resolve(process.cwd(), '.env.local');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.warn("⚠️  .env.local not found or failed to load. Trying .env or system vars.");
    dotenv.config();
}

import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
    console.error("❌ STRIPE_SECRET_KEY is missing from environment variables.");
    console.error("Please add it to .env.local");
    process.exit(1);
}

// Hardcoded key from your paste
const stripe = new Stripe(secretKey, {
    apiVersion: '2024-06-20' as any,
});

async function setupProducts() {
    // console.log('Using Stripe Key:', stripe.getApiField('key')?.slice(0, 15) + '...');

    try {
        console.log('\n--- SETUP STARTED ---');

        // Fetch all active products
        const allProducts = await stripe.products.list({ active: true, limit: 100 });
        console.log(`Found ${allProducts.data.length} active products.`);

        // Helper to find or create product
        const getOrCreateProduct = async (name: string, description: string) => {
            let product = allProducts.data.find(p => p.name === name);
            if (!product) {
                console.log(`Creating ${name} Product...`);
                product = await stripe.products.create({ name, description });
            } else {
                console.log(`Found ${name} Product: ${product.id}`);
            }
            return product;
        };

        // ==========================================
        // 1. STANDARD PLAN (£15/mo)
        // ==========================================
        const standardProduct = await getOrCreateProduct('Standard', 'Core knowledge for enthusiasts.');

        // Standard Prices
        const standardPrices = await stripe.prices.list({ product: standardProduct.id, active: true });
        let standardMonthly = standardPrices.data.find(p => p.recurring?.interval === 'month' && p.unit_amount === 1500);
        if (!standardMonthly) {
            console.log('Creating Standard Monthly Price...');
            standardMonthly = await stripe.prices.create({
                product: standardProduct.id, unit_amount: 1500, currency: 'gbp', recurring: { interval: 'month' }, nickname: 'Standard Monthly'
            });
        }
        let standardAnnual = standardPrices.data.find(p => p.recurring?.interval === 'year' && p.unit_amount === 14400);
        if (!standardAnnual) {
            console.log('Creating Standard Annual Price...');
            standardAnnual = await stripe.prices.create({
                product: standardProduct.id, unit_amount: 14400, currency: 'gbp', recurring: { interval: 'year' }, nickname: 'Standard Annual'
            });
        }

        // ==========================================
        // 2. PROFESSIONAL PLAN (£25/mo)
        // ==========================================
        const professionalProduct = await getOrCreateProduct('Professional', 'Advanced tools for career growth.');

        // Professional Prices
        const proPrices = await stripe.prices.list({ product: professionalProduct.id, active: true });
        let proMonthly = proPrices.data.find(p => p.recurring?.interval === 'month' && p.unit_amount === 2500);
        if (!proMonthly) {
            console.log('Creating Professional Monthly Price...');
            proMonthly = await stripe.prices.create({
                product: professionalProduct.id, unit_amount: 2500, currency: 'gbp', recurring: { interval: 'month' }, nickname: 'Professional Monthly'
            });
        }
        let proAnnual = proPrices.data.find(p => p.recurring?.interval === 'year' && p.unit_amount === 24000);
        if (!proAnnual) {
            console.log('Creating Professional Annual Price...');
            proAnnual = await stripe.prices.create({
                product: professionalProduct.id, unit_amount: 24000, currency: 'gbp', recurring: { interval: 'year' }, nickname: 'Professional Annual'
            });
        }

        // ==========================================
        // 3. UNLIMITED PLAN (£35/mo)
        // ==========================================
        const unlimitedProduct = await getOrCreateProduct('Unlimited Learning', 'Total freedom to learn and create.');

        // Unlimited Prices
        const ulPrices = await stripe.prices.list({ product: unlimitedProduct.id, active: true });
        let ulMonthly = ulPrices.data.find(p => p.recurring?.interval === 'month' && p.unit_amount === 3500);
        if (!ulMonthly) {
            console.log('Creating Unlimited Monthly Price...');
            ulMonthly = await stripe.prices.create({
                product: unlimitedProduct.id, unit_amount: 3500, currency: 'gbp', recurring: { interval: 'month' }, nickname: 'Unlimited Monthly'
            });
        }
        let ulAnnual = ulPrices.data.find(p => p.recurring?.interval === 'year' && p.unit_amount === 33600);
        if (!ulAnnual) {
            console.log('Creating Unlimited Annual Price...');
            ulAnnual = await stripe.prices.create({
                product: unlimitedProduct.id, unit_amount: 33600, currency: 'gbp', recurring: { interval: 'year' }, nickname: 'Unlimited Annual'
            });
        }


        // ==========================================
        // OUTPUT
        // ==========================================
        const output = `
STRIPE_PRICE_STANDARD_MONTHLY=${standardMonthly.id}
STRIPE_PRICE_STANDARD_ANNUAL=${standardAnnual.id}
STRIPE_PRICE_PROFESSIONAL_MONTHLY=${proMonthly.id}
STRIPE_PRICE_PROFESSIONAL_ANNUAL=${proAnnual.id}
STRIPE_PRICE_UNLIMITED_MONTHLY=${ulMonthly.id}
STRIPE_PRICE_UNLIMITED_ANNUAL=${ulAnnual.id}
`;
        const fs = await import('fs');
        fs.writeFileSync('stripe_ids.txt', output.trim());
        console.log('IDs written to stripe_ids.txt');

    } catch (error: any) {
        console.error('Error setting up Stripe products:', error.message);
        if (error.raw) {
            console.error('Raw Error:', error.raw);
        }
    }
}

setupProducts();
