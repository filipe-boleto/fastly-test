// Fastly Compute@Edge globals not available in Node.js test environment
if (typeof addEventListener === 'undefined') {
    global.addEventListener = () => {}
}
