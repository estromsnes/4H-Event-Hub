// QR Scanner Module
// Uses html5-qrcode library for scanning QR codes

class QRScanner {
    constructor() {
        this.html5QrCode = null;
        this.isScanning = false;
        this.onScanSuccess = null;
        this.onScanError = null;
        this.lastScannedCode = null;
        this.lastScanTime = 0;
        this.scanCooldown = 2000; // 2 seconds cooldown
    }

    /**
     * Initialize the QR scanner
     * @param {string} elementId - ID of the HTML element to render scanner
     * @param {function} onSuccess - Callback when QR code is successfully scanned
     * @param {function} onError - Callback when scanning fails
     */
    async init(elementId, onSuccess, onError) {
        this.onScanSuccess = onSuccess;
        this.onScanError = onError;

        // Check if Html5Qrcode is available
        if (typeof Html5Qrcode === 'undefined') {
            const errorMsg = 'QR-skanneren kunne ikke lastes. Sjekk internett-tilkoblingen din og last inn siden på nytt.';
            console.error(errorMsg);
            if (onError) onError(errorMsg);
            return;
        }

        // If there's an existing instance, clear it first
        if (this.html5QrCode) {
            try {
                await this.clear();
            } catch (err) {
                console.warn('Error clearing existing scanner:', err);
            }
        }

        // Create new scanner instance
        this.html5QrCode = new Html5Qrcode(elementId);
        console.log('QR Scanner initialized for element:', elementId);
    }

    /**
     * Start scanning for QR codes
     */
    async start() {
        if (this.isScanning) {
            console.log('Scanner already running');
            return;
        }

        try {
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };

            // Try to use back camera if available (better for scanning)
            const cameras = await Html5Qrcode.getCameras();
            let cameraId = cameras.length > 0 ? cameras[0].id : undefined;

            // Prefer back camera if available
            const backCamera = cameras.find(camera =>
                camera.label.toLowerCase().includes('back') ||
                camera.label.toLowerCase().includes('rear')
            );
            if (backCamera) {
                cameraId = backCamera.id;
            }

            await this.html5QrCode.start(
                cameraId || { facingMode: "environment" },
                config,
                (decodedText, decodedResult) => {
                    this.handleScanSuccess(decodedText);
                },
                (errorMessage) => {
                    // Silent error handling - scanning errors are common and expected
                    // Only log actual problems
                    if (!errorMessage.includes('No MultiFormat Readers')) {
                        // console.log('Scan error:', errorMessage);
                    }
                }
            );

            this.isScanning = true;
            console.log('QR Scanner started');
        } catch (err) {
            console.error('Failed to start scanner:', err);
            if (this.onScanError) {
                this.onScanError('Kunne ikke starte kameraet. Sørg for at du har gitt nettleseren tillatelse til å bruke kameraet. Du kan også prøve å laste opp et bilde i stedet.');
            }
        }
    }

    /**
     * Stop scanning
     */
    async stop() {
        if (!this.isScanning || !this.html5QrCode) {
            return;
        }

        try {
            await this.html5QrCode.stop();
            this.isScanning = false;
            console.log('QR Scanner stopped');
        } catch (err) {
            console.error('Error stopping scanner:', err);
        }
    }

    /**
     * Clear the scanner completely (stops and removes all UI)
     */
    async clear() {
        try {
            if (this.isScanning && this.html5QrCode) {
                await this.html5QrCode.stop();
            }
            if (this.html5QrCode) {
                await this.html5QrCode.clear();
            }
            this.isScanning = false;
            this.html5QrCode = null;
            console.log('QR Scanner cleared');
        } catch (err) {
            console.error('Error clearing scanner:', err);
        }
    }

    /**
     * Scan QR code from an image file
     * @param {File} file - The image file to scan
     */
    async scanFile(file) {
        console.log('Scanning file:', file.name, 'Size:', file.size, 'Type:', file.type);

        try {
            // Load image
            const imageUrl = URL.createObjectURL(file);
            const img = new Image();

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = imageUrl;
            });

            // Create a canvas and draw the image
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            // Get image data for jsQR
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Use jsQR to scan the QR code (better for static images)
            if (typeof jsQR !== 'undefined') {
                console.log('Using jsQR to scan image...');
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });

                if (code) {
                    console.log('✅ Successfully scanned with jsQR:', code.data);
                    URL.revokeObjectURL(imageUrl);
                    this.handleScanSuccess(code.data);
                    return;
                } else {
                    console.warn('jsQR could not find QR code, trying html5-qrcode...');
                }
            }

            // Fallback to html5-qrcode scanFile method
            if (this.html5QrCode) {
                try {
                    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                    const processedFile = new File([blob], file.name, { type: 'image/png' });
                    const decodedText = await this.html5QrCode.scanFile(processedFile, false);
                    console.log('✅ Successfully scanned with html5-qrcode:', decodedText);
                    URL.revokeObjectURL(imageUrl);
                    this.handleScanSuccess(decodedText);
                    return;
                } catch (html5Err) {
                    console.warn('html5-qrcode also failed:', html5Err.message);
                }
            }

            // Both methods failed
            URL.revokeObjectURL(imageUrl);
            throw new Error('Fant ingen QR-kode i bildet. Sørg for at QR-koden er tydelig og godt opplyst, og prøv igjen.');

        } catch (err) {
            console.error('❌ QR scan failed:', err);
            if (this.onScanError) {
                this.onScanError('Kunne ikke lese QR-koden fra bildet. Tips: Ta et nytt bilde der QR-koden er godt opplyst og fyller mesteparten av bildet. Du kan også prøve kamera-skanning i stedet.');
            }
            throw err;
        }
    }

    /**
     * Handle successful QR code scan
     * @param {string} decodedText - The decoded QR code data
     */
    handleScanSuccess(decodedText) {
        // Debounce: prevent logging/processing same code multiple times rapidly
        const now = Date.now();
        if (decodedText === this.lastScannedCode && (now - this.lastScanTime) < this.scanCooldown) {
            // Silently ignore during cooldown period
            return;
        }

        this.lastScannedCode = decodedText;
        this.lastScanTime = now;

        console.log('QR Code scanned:', decodedText);

        // Pass the raw scanned data to the callback
        // Let the calling code decide how to handle it
        if (this.onScanSuccess) {
            this.onScanSuccess(decodedText);
        }
    }

    /**
     * Check if browser supports QR scanning
     * @returns {boolean}
     */
    static isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }
}

// Export for use in other modules
window.QRScanner = QRScanner;
