/**
 * QR Upload Visibility Controller
 * Automatically hides/shows QR upload buttons based on event settings
 */

(async function() {
    try {
        // Fetch event info
        const response = await fetch('/api/event');
        if (!response.ok) {
            console.warn('Could not fetch event info for QR upload visibility');
            return;
        }

        const event = await response.json();
        const allowQrUpload = event.allow_qr_upload === 1;

        if (!allowQrUpload) {
            // Hide all QR upload buttons
            // Find all labels and buttons that contain "Last opp bilde av QR"
            const allElements = document.querySelectorAll('label, button');

            allElements.forEach(element => {
                const text = element.textContent || element.innerText;
                if (text.includes('Last opp bilde av QR') || text.includes('🖼️')) {
                    // Check if it's specifically a QR upload button by checking nearby text
                    if (text.includes('Last opp bilde')) {
                        element.style.display = 'none';

                        // Also hide the associated file input if it's a label
                        if (element.tagName === 'LABEL' && element.htmlFor) {
                            const fileInput = document.getElementById(element.htmlFor);
                            if (fileInput) {
                                fileInput.style.display = 'none';
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error checking QR upload visibility:', error);
    }
})();
