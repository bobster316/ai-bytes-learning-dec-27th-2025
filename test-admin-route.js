// Quick test to check if admin edit route is accessible
const courseId = '375';
const testUrl = `http://localhost:3000/admin/courses/${courseId}`;

console.log(`Testing admin edit route: ${testUrl}`);

fetch(testUrl)
    .then(response => {
        console.log('\n=== RESPONSE STATUS ===');
        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`URL: ${response.url}`);

        if (response.status === 200) {
            console.log('\n✅ SUCCESS: Route is accessible!');
            return response.text();
        } else if (response.status === 404) {
            console.log('\n❌ ERROR: 404 Not Found');
            return response.text();
        } else {
            console.log(`\n⚠️ Unexpected status: ${response.status}`);
            return response.text();
        }
    })
    .then(html => {
        console.log('\n=== CONTENT PREVIEW ===');
        console.log(html.substring(0, 500));

        if (html.includes('Course Editor')) {
            console.log('\n✅ Page contains "Course Editor" - Route working!');
        } else if (html.includes('404')) {
            console.log('\n❌ Page shows 404 error');
        }
    })
    .catch(error => {
        console.error('\n❌ Request failed:', error.message);
    });
