// Welcome page logic
let currentParticipant = null;
let scanner = null;
let cameraStream = null;
let capturedPhotoBlob = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadEventInfo();
    initializeScanner();
    initializeFileUpload();
    focusBarcodeInput();
});

// Load event information
async function loadEventInfo() {
    try {
        const response = await fetch('/api/event/');
        if (response.ok) {
            const event = await response.json();

            // Update header
            document.getElementById('eventTitle').textContent = event.event_name || '4H Event Hub';
            document.getElementById('eventSubtitle').textContent = event.event_description || '';

            // Show event logo if exists
            if (event.logo_path) {
                const logoEl = document.getElementById('eventLogo');
                logoEl.src = event.logo_path;
                logoEl.classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error('Failed to load event:', error);
        // Set default values on error
        document.getElementById('eventTitle').textContent = '4H Event Hub';
        document.getElementById('eventSubtitle').textContent = '';
    }
}

// Initialize barcode scanner and QR code scanner
function initializeScanner() {
    const barcodeInput = document.getElementById('barcode-input');
    let scanBuffer = '';
    let scanTimeout = null;

    // Barcode scanner input handler
    barcodeInput.addEventListener('input', (e) => {
        clearTimeout(scanTimeout);
        scanBuffer += e.target.value;
        e.target.value = '';

        scanTimeout = setTimeout(() => {
            if (scanBuffer.length > 0) {
                handleQRScan(scanBuffer.trim());
                scanBuffer = '';
            }
        }, 100);
    });

    // Initialize camera QR scanner using QRScanner class
    scanner = new QRScanner();
    scanner.init('qr-reader',
        (code) => handleQRScan(code),
        (error) => {
            console.error('QR Scanner error:', error);
            showScanStatus('Kunne ikke starte QR-skanner', 'error');
        }
    );
    startQRScanner();
}

// Initialize file upload for QR scanning
function initializeFileUpload() {
    const fileInput = document.getElementById('qr-file-input');

    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            showScanStatus('Leser QR-kode fra bilde...', 'info');

            try {
                // Stop camera scanner temporarily
                if (scanner && scanner.isScanning) {
                    await scanner.stop();
                }

                // Use the QRScanner's scanFile method (handles jsQR + fallback internally)
                await scanner.scanFile(file);

            } catch (error) {
                console.error('Error scanning file:', error);
                showScanStatus('Kunne ikke lese QR-kode fra bildet. Prøv et annet bilde.', 'error');

                // Restart scanner after error
                setTimeout(() => {
                    startQRScanner();
                    hideScanStatus();
                }, 3000);
            } finally {
                // Clear file input
                fileInput.value = '';
            }
        });
    }
}

// Start QR code camera scanner
async function startQRScanner() {
    try {
        await scanner.start();
    } catch (err) {
        console.error("QR Scanner error:", err);
        showScanStatus('Kunne ikke starte QR-skanner', 'error');
    }
}

// Keep focus on barcode input
function focusBarcodeInput() {
    const barcodeInput = document.getElementById('barcode-input');
    barcodeInput.focus();

    // Refocus if focus is lost
    document.addEventListener('click', () => {
        if (document.getElementById('scanner-view').classList.contains('active')) {
            setTimeout(() => barcodeInput.focus(), 100);
        }
    });

    setInterval(() => {
        if (document.getElementById('scanner-view').classList.contains('active')) {
            barcodeInput.focus();
        }
    }, 1000);
}

// Handle QR code scan
async function handleQRScan(qrData) {
    console.log('QR Code scanned:', qrData);

    // Decode potential keyboard layout issues
    const decodedData = GlobalBarcodeScanner.decodeBarcodeInput(qrData);
    let participantCode;

    try {
        // Try to parse as JSON first
        const parsed = JSON.parse(decodedData);
        if (parsed.type === 'participant' && parsed.code) {
            participantCode = parsed.code;
        } else {
            throw new Error('Ugyldig QR-kode. Vennligst bruk et 4H deltakerkort.');
        }
    } catch (e) {
        if (e.message.includes('Ugyldig QR-kode')) {
            showScanStatus(e.message, 'error');
            setTimeout(() => {
                startQRScanner();
                hideScanStatus();
            }, 2000);
            return;
        }
        // Not JSON, use as-is
        participantCode = decodedData;
    }

    // Stop QR scanner
    if (scanner && scanner.isScanning) {
        await scanner.stop();
    }

    // Show loading status
    showScanStatus('Laster profil...', 'info');

    try {
        // Verify participant exists
        const response = await fetch(`/api/participants/${participantCode}`);

        if (!response.ok) {
            throw new Error('Deltaker ikke funnet');
        }

        const participant = await response.json();

        // Show welcome message with confetti
        const fullName = `${participant.first_name} ${participant.last_name}`.trim();
        showScanStatus(`Velkommen ${fullName}! 🎉`, 'success');

        // Store participant code and redirect to profile page
        sessionStorage.setItem('welcomeParticipantCode', participantCode);
        sessionStorage.setItem('fromWelcome', 'true');

        // Redirect after short delay to show welcome message
        setTimeout(() => {
            window.location.href = '/profile.html';
        }, 1500);

    } catch (error) {
        console.error('Scan error:', error);
        showScanStatus(error.message, 'error');

        // Restart scanner after error
        setTimeout(() => {
            startQRScanner();
            hideScanStatus();
        }, 2000);
    }
}

// Show scan status message
function showScanStatus(message, type) {
    const statusEl = document.getElementById('scan-status');
    statusEl.textContent = message;
    statusEl.className = `scan-status ${type}`;
    statusEl.style.display = 'block';
}

// Hide scan status
function hideScanStatus() {
    const statusEl = document.getElementById('scan-status');
    statusEl.style.display = 'none';
}
