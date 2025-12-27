// Test the new edit route structure
const courseId = '375';
const testUrl = `http://localhost:3000/admin/courses/edit/${courseId}`;

console.log(`Testing NEW admin edit route: ${testUrl}`);

fetch(testUrl)
    .then(response => {
        console.log('\n=== RESPONSE STATUS ===');
        console.log(`Status: ${response.status} ${response.statusText}`);

        if (response.status === 200) {
            console.log('\n✅ SUCCESS: New route structure works!');
            return response.text();
        } else if (response.status === 404) {
            console.log('\n❌ ERROR: Still 404 - trying old route...');
            return null;
        } else {
            console.log(`\n⚠️ Status: ${response.status}`);
            return response.text();
        }
    })
    .then(html => {
        if (html && html.includes('Course Editor')) {
            console.log('✅ Page contains "Course Editor" - Fix successful!');
            console.log('\n🎉 You can now edit courses at: /admin/courses/edit/[id]');
        } else if (html) {
            console.log('Content preview:', html.substring(0, 200));
        }
    })
    .catch(error => {
        console.error('\n❌ Request failed:', error.message);
    });
