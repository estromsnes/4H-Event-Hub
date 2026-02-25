// Global Barcode Scanner Module
// Handles barcode scanner input independently of input field focus

class GlobalBarcodeScanner {
    constructor() {
        this.buffer = '';
        this.timeout = null;
        this.isActive = false;
        this.onScan = null;
        this.scanTimeout = 100; // milliseconds - typical barcode scanners type very fast

        // Bind keyboard listener
        this.keydownHandler = this.handleKeyDown.bind(this);
    }

    /**
     * Activate the global barcode scanner
     * @param {function} onScanCallback - Callback function when scan is complete
     */
    activate(onScanCallback) {
        if (this.isActive) {
            console.warn('GlobalBarcodeScanner already active');
            return;
        }

        this.isActive = true;
        this.onScan = onScanCallback;
        document.addEventListener('keydown', this.keydownHandler);
        this.buffer = '';

        console.log('GlobalBarcodeScanner activated');
    }

    /**
     * Deactivate the global barcode scanner
     */
    deactivate() {
        if (!this.isActive) return;

        this.isActive = false;
        this.onScan = null;
        document.removeEventListener('keydown', this.keydownHandler);
        this.buffer = '';

        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }

        console.log('GlobalBarcodeScanner deactivated');
    }

    /**
     * Handle keyboard input
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyDown(e) {
        // Ignore if typing in a legitimate text input/textarea
        // This allows admin forms and other inputs to work normally
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        // Enter key signals end of barcode scan
        if (e.key === 'Enter') {
            e.preventDefault();
            // Clear any pending timeout before processing
            if (this.timeout) {
                clearTimeout(this.timeout);
                this.timeout = null;
            }
            // Add small delay to ensure all characters are in buffer
            setTimeout(() => this.processScan(), 10);
            return;
        }

        // Collect printable characters (including Norwegian characters)
        if (this.isPrintableChar(e.key)) {
            e.preventDefault();
            this.buffer += e.key;
            this.resetTimeout();
        }
    }

    /**
     * Check if key is a printable character
     * @param {string} key - Key from keyboard event
     * @returns {boolean}
     */
    isPrintableChar(key) {
        // Single character keys (letters, numbers, symbols)
        // Also include Norwegian special characters
        return key.length === 1 || ['å', 'Å', 'æ', 'Æ', 'ø', 'Ø'].includes(key);
    }

    /**
     * Reset the timeout for scan completion detection
     */
    resetTimeout() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        // If no more characters come within scanTimeout ms, process the scan
        this.timeout = setTimeout(() => this.processScan(), this.scanTimeout);
    }

    /**
     * Process the completed scan
     */
    processScan() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }

        const scannedData = this.buffer.trim();
        this.buffer = '';

        if (scannedData && this.onScan) {
            console.log('Barcode scanned (raw):', scannedData);
            console.log('Buffer length:', scannedData.length, 'First 50 chars:', scannedData.substring(0, 50));
            this.onScan(scannedData);
        }
    }

    /**
     * Decode Norwegian keyboard layout issues
     * Barcode scanners may send JSON special characters mapped through Norwegian keyboard
     * @param {string} input - Raw scanned input
     * @returns {string} Decoded input
     */
    static decodeBarcodeInput(input) {
        const charMap = {
            'Å': '{',
            'Æ': '"',
            'Ø': ':',
            '^': '}',
            '¨': '[',
            '\'': ']',
            '§': ','
        };

        let decoded = input;

        // Detect if this looks like garbled JSON
        if (input.includes('Å') || input.includes('Æ') || input.includes('Ø')) {
            for (const [garbled, correct] of Object.entries(charMap)) {
                decoded = decoded.split(garbled).join(correct);
            }

            console.log('Decoded from:', input);
            console.log('Decoded to:', decoded);

            // If JSON is missing closing brace, try to add it
            if (decoded.startsWith('{') && !decoded.endsWith('}')) {
                console.warn('JSON missing closing brace, adding it');
                decoded += '}';
            }
        }

        // Always replace + with - for participant codes (SK+2026+004 → SK-2026-004)
        // This happens regardless of whether Norwegian keyboard decoding occurred
        decoded = decoded.replace(/\+/g, '-');

        return decoded;
    }

    /**
     * Check if scanner is currently active
     * @returns {boolean}
     */
    isScanning() {
        return this.isActive;
    }
}

// Create and export global instance
window.globalBarcodeScanner = new GlobalBarcodeScanner();

console.log('GlobalBarcodeScanner module loaded');
