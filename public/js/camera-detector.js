// Camera Availability Detector
// Checks if camera access is available and hides camera buttons if not

(function() {
    let cameraAvailable = false;

    /**
     * Check if camera/media devices are available
     * @returns {Promise<boolean>}
     */
    async function checkCameraAvailability() {
        try {
            // Check if mediaDevices API exists
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.log('Camera API not available (mediaDevices not supported)');
                return false;
            }

            // Try to enumerate devices to see if camera exists
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasCamera = devices.some(device => device.kind === 'videoinput');

            if (!hasCamera) {
                console.log('No camera device found');
                return false;
            }

            // Check if we're in a secure context (required for camera access)
            if (!window.isSecureContext && window.location.hostname !== 'localhost') {
                console.log('Camera not available: Not in secure context (requires HTTPS or localhost)');
                return false;
            }

            console.log('Camera is available');
            return true;

        } catch (error) {
            console.error('Error checking camera availability:', error);
            return false;
        }
    }

    /**
     * Hide all camera-related buttons on the page
     */
    function hideCameraButtons() {
        // Common button IDs and selectors for camera buttons
        const cameraButtonSelectors = [
            '#startCameraScanBtn',
            '#startCameraBtn',
            '#start-scan-btn',
            '#startScanBtn',
            '#takeSelfieBtn',
            '#captureBtn',
            'button[data-action="camera"]',
            '.camera-button',
            '.start-camera-btn'
        ];

        let hiddenCount = 0;

        cameraButtonSelectors.forEach(selector => {
            const buttons = document.querySelectorAll(selector);
            buttons.forEach(button => {
                if (button && button.textContent.includes('Kamera')) {
                    button.style.display = 'none';
                    hiddenCount++;
                    console.log('Hid camera button:', selector);
                }
            });
        });

        // Also hide any button containing camera-related text
        const allButtons = document.querySelectorAll('button');
        allButtons.forEach(button => {
            const text = button.textContent.toLowerCase();
            if (text.includes('kamera') || text.includes('start kamera') || text.includes('ta selfie')) {
                button.style.display = 'none';
                hiddenCount++;
                console.log('Hid camera button by text:', button.textContent.trim());
            }
        });

        if (hiddenCount > 0) {
            console.log(`Hidden ${hiddenCount} camera buttons (camera not available)`);
        }
    }

    /**
     * Show a message that camera is not available
     */
    function showCameraNotAvailableMessage() {
        // Look for common status/message containers
        const messageContainers = [
            document.getElementById('scan-status'),
            document.getElementById('cameraStatus'),
            document.getElementById('statusMessage')
        ];

        messageContainers.forEach(container => {
            if (container) {
                const message = document.createElement('div');
                message.className = 'camera-not-available-message';
                message.style.cssText = `
                    background: linear-gradient(135deg, #fff3cd, #ffe69c);
                    border: 2px solid #ffc107;
                    border-radius: 12px;
                    padding: 15px;
                    margin: 15px 0;
                    text-align: center;
                    color: #856404;
                    font-size: 14px;
                    line-height: 1.5;
                `;
                message.innerHTML = `
                    <strong>📱 Kamera ikke tilgjengelig</strong><br>
                    <span style="font-size: 13px;">
                        Du kan fortsatt bruke QR-skanneren eller laste opp bilder fra din enhet.
                    </span>
                `;
                container.insertAdjacentElement('afterbegin', message);
            }
        });
    }

    /**
     * Initialize camera detection on page load
     */
    async function initCameraDetection() {
        cameraAvailable = await checkCameraAvailability();

        if (!cameraAvailable) {
            hideCameraButtons();

            // Small delay to ensure DOM is fully loaded
            setTimeout(() => {
                showCameraNotAvailableMessage();
            }, 500);
        }

        // Make the result available globally
        window.cameraAvailable = cameraAvailable;
    }

    // Run detection when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCameraDetection);
    } else {
        initCameraDetection();
    }

    // Export functions for external use
    window.CameraDetector = {
        isAvailable: () => cameraAvailable,
        check: checkCameraAvailability,
        hideButtons: hideCameraButtons
    };

    console.log('Camera Detector initialized');
})();
