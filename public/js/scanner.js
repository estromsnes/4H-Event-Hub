// QR Scanner Module
// Uses html5-qrcode library for scanning QR codes

class QRScanner {
    constructor() {
        this.html5QrCode = null;
        this.isScanning = false;
        this.onScanSuccess = null;
        this.onScanError = null;
    }

    /**
     * Initialize the QR scanner
     * @param {string} elementId - ID of the HTML element to render scanner
     * @param {function} onSuccess - Callback when QR code is successfully scanned
     * @param {function} onError - Callback when scanning fails
     */
    init(elementId, onSuccess, onError) {
        this.onScanSuccess = onSuccess;
        this.onScanError = onError;
        this.html5QrCode = new Html5Qrcode(elementId);
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
                this.onScanError('Kunne ikke starte kamera. Sjekk tillatelser.');
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
     * Handle successful QR code scan
     * @param {string} decodedText - The decoded QR code data
     */
    handleScanSuccess(decodedText) {
        console.log('QR Code scanned:', decodedText);

        try {
            // Parse JSON data from QR code
            const data = JSON.parse(decodedText);

            // Validate that this is a participant QR code
            if (data.type === 'participant' && data.code) {
                if (this.onScanSuccess) {
                    this.onScanSuccess(data.code);
                }
            } else {
                console.warn('Invalid QR code format:', data);
                if (this.onScanError) {
                    this.onScanError('Ugyldig QR-kode. Vennligst bruk et 4H deltakerkort.');
                }
            }
        } catch (err) {
            console.error('Error parsing QR code:', err);
            if (this.onScanError) {
                this.onScanError('Kunne ikke lese QR-koden. Prøv igjen.');
            }
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
