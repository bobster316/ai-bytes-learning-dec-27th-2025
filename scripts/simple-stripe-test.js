
const Stripe = require('stripe');

// Hardcoded key from your paste
const key = 'sk_test_51Rk15SFLt9F8uyTYEc8OWmW2tZsqsBnYWT70yHabPTVl20I9y4ccd5xlXWbFxCQAZTUSdgzOMXyyEbiLBFPZo0mZ00KptSibwL';

console.log("Testing Key:", key);
console.log("Length:", key.length);

const stripe = Stripe(key);

async function run() {
    try {
        console.log("Connecting to Stripe...");
        const customers = await stripe.customers.list({ limit: 1 });
        console.log("SUCCESS! Connection established.");
    } catch (e) {
        console.error("FAILED.");
        console.error(e.message);
    }
}

run();
