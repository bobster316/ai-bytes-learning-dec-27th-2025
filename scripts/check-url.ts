
import fetch from 'node-fetch';

const url = 'https://aysqedgkpdbcbubadrrr.supabase.co/storage/v1/object/public/course-audio/backgrounds/debug-bg-1769885815773.png';

async function check() {
    console.log(`Checking: ${url}`);
    try {
        const res = await fetch(url, { method: 'HEAD' });
        console.log(`Status: ${res.status} ${res.statusText}`);
        console.log(`Content-Type: ${res.headers.get('content-type')}`);
        console.log(`Content-Length: ${res.headers.get('content-length')}`);
    } catch (e) {
        console.error(e);
    }
}

check();
