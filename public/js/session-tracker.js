// Session Tracker - Manages session ID for concurrent user tracking

(function() {
    // Get or create session ID
    let sessionId = localStorage.getItem('sessionId');

    if (!sessionId) {
        // Generate new session ID
        sessionId = generateSessionId();
        localStorage.setItem('sessionId', sessionId);
    }

    // Add session ID to all fetch requests
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const [url, options = {}] = args;

        // Add session ID header
        options.headers = options.headers || {};
        options.headers['X-Session-ID'] = sessionId;

        return originalFetch(url, options).then(response => {
            // Update session ID if server provides a new one
            const newSessionId = response.headers.get('X-Session-ID');
            if (newSessionId && newSessionId !== sessionId) {
                sessionId = newSessionId;
                localStorage.setItem('sessionId', sessionId);
            }
            return response;
        });
    };

    // Send heartbeat every 2 minutes to keep session alive
    setInterval(() => {
        fetch('/api/heartbeat', {
            method: 'GET',
            headers: {
                'X-Session-ID': sessionId
            }
        }).catch(() => {
            // Ignore errors - this is just a heartbeat
        });
    }, 2 * 60 * 1000);

    // Generate random session ID
    function generateSessionId() {
        return Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
})();
