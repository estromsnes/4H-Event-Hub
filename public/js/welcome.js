// Welcome page logic
let currentParticipant = null;
let scanner = null;
let cameraStream = null;
let capturedPhotoBlob = null;
let isScanning = false;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadEventInfo();
    initializeScanner();
    initializeFileUpload();
    initializeCameraButton();
    initializeLoginWordInput();
    focusBarcodeInput();

    // Initialize login component (alternative login methods)
    initLoginComponent({
        onLoginSuccess: (participant) => {
            // Same behavior as main login - redirect to profile
            sessionStorage.setItem('welcomeParticipantCode', participant.participant_code);
            sessionStorage.setItem('fromWelcome', 'true');
            window.location.href = '/profile.html';
        }
    });
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
    // Don't auto-start scanner - user must click button
}

// Initialize camera button
function initializeCameraButton() {
    const startScanBtn = document.getElementById('start-scan-btn');

    if (startScanBtn) {
        startScanBtn.addEventListener('click', () => {
            console.log('Scan button clicked, isScanning:', isScanning);
            if (isScanning) {
                stopQRScanner();
            } else {
                startQRScanner();
            }
        });
    }
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

                // Only restart camera if it was already scanning
                if (isScanning) {
                    setTimeout(() => {
                        startQRScanner();
                        hideScanStatus();
                    }, 3000);
                }
            } finally {
                // Clear file input
                fileInput.value = '';
            }
        });
    }
}

// Start QR code camera scanner
async function startQRScanner() {
    const startScanBtn = document.getElementById('start-scan-btn');

    if (startScanBtn) {
        startScanBtn.textContent = '📷 Starter...';
    }

    try {
        await scanner.start();
        isScanning = true;

        if (startScanBtn) {
            startScanBtn.textContent = '⏸️ Stopp Kamera';
        }

        showScanStatus('Skanner etter QR-kode... (Klikk "Stopp Kamera" for å avslutte)', 'info');
        console.log('Scanner started successfully');
    } catch (err) {
        console.error("QR Scanner error:", err);
        showScanStatus('Kunne ikke starte QR-skanner', 'error');
        isScanning = false;

        if (startScanBtn) {
            startScanBtn.textContent = '📷 Start Kamera-Skanning';
        }
    }
}

// Stop QR code camera scanner
async function stopQRScanner() {
    const startScanBtn = document.getElementById('start-scan-btn');

    try {
        if (scanner && scanner.isScanning) {
            await scanner.stop();
        }

        isScanning = false;

        if (startScanBtn) {
            startScanBtn.textContent = '📷 Start Kamera-Skanning';
        }

        showScanStatus('Skanning stoppet', 'info');
        setTimeout(() => {
            hideScanStatus();
        }, 2000);

        console.log('Scanner stopped successfully');
    } catch (err) {
        console.error('Scanner stop error:', err);
        showScanStatus('Kunne ikke stoppe skanning', 'error');
    }
}

// Keep focus on barcode input
function focusBarcodeInput() {
    const barcodeInput = document.getElementById('barcode-input');
    barcodeInput.focus();

    // Refocus if focus is lost - but not if user is typing in login word input
    document.addEventListener('click', (e) => {
        if (document.getElementById('scanner-view').classList.contains('active')) {
            // Don't refocus if user clicked on login word input or button
            const clickedElement = e.target;
            if (clickedElement.id === 'participantCodeInput' ||
                clickedElement.id === 'codeLoginBtn' ||
                clickedElement.closest('#codeInputSection')) {
                return;
            }
            setTimeout(() => barcodeInput.focus(), 100);
        }
    });

    setInterval(() => {
        if (document.getElementById('scanner-view').classList.contains('active')) {
            // Don't refocus if user is actively typing in login word input
            const activeElement = document.activeElement;
            if (activeElement && activeElement.id === 'participantCodeInput') {
                return;
            }
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
            // Only restart camera if it was already scanning
            if (isScanning) {
                setTimeout(() => {
                    startQRScanner();
                    hideScanStatus();
                }, 2000);
            }
            return;
        }
        // Not JSON, use as-is
        participantCode = decodedData;
    }

    // Stop QR scanner
    if (scanner && scanner.isScanning) {
        await scanner.stop();
    }

    isScanning = false;

    const startScanBtn = document.getElementById('start-scan-btn');
    if (startScanBtn) {
        startScanBtn.textContent = '📷 Start Kamera-Skanning';
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

        // Only restart camera if it was already scanning
        if (isScanning) {
            setTimeout(() => {
                startQRScanner();
                hideScanStatus();
            }, 2000);
        }
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

// Initialize login word input
function initializeLoginWordInput() {
    const participantCodeInput = document.getElementById('participantCodeInput');
    const codeLoginBtn = document.getElementById('codeLoginBtn');
    const codeStatus = document.getElementById('codeStatus');

    if (codeLoginBtn) {
        codeLoginBtn.addEventListener('click', handleLoginWithCode);
    }

    if (participantCodeInput) {
        participantCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLoginWithCode();
            }
        });
    }
}

// Handle login with code/login word
async function handleLoginWithCode() {
    const participantCodeInput = document.getElementById('participantCodeInput');
    const codeLoginBtn = document.getElementById('codeLoginBtn');
    const codeStatus = document.getElementById('codeStatus');

    if (typeof participantAuth === 'undefined') {
        console.error('participantAuth not available');
        showCodeStatus('Autentiseringssystem ikke tilgjengelig', 'error');
        return;
    }

    const code = participantCodeInput.value.trim();

    if (!code) {
        showCodeStatus('Vennligst skriv inn ditt login-ord', 'error');
        participantCodeInput.focus();
        return;
    }

    // Disable button and show loading
    codeLoginBtn.disabled = true;
    codeLoginBtn.textContent = '⏳';
    showCodeStatus('Logger inn...', 'info');

    try {
        const participant = await participantAuth.loginWithCode(code);

        if (participant) {
            console.log('Login successful:', participant.first_name);

            // Show welcome message
            const fullName = `${participant.first_name} ${participant.last_name}`.trim();
            showCodeStatus(`Velkommen ${fullName}! 🎉`, 'success');

            // Store participant code and redirect to profile page
            sessionStorage.setItem('welcomeParticipantCode', participant.participant_code);
            sessionStorage.setItem('fromWelcome', 'true');

            // Clear input
            participantCodeInput.value = '';

            // Redirect after short delay
            setTimeout(() => {
                window.location.href = '/profile.html';
            }, 1500);
        }
    } catch (error) {
        console.error('Login error:', error);
        showCodeStatus(error.message || 'Feil ved innlogging', 'error');
        codeLoginBtn.disabled = false;
        codeLoginBtn.textContent = '➡️';
    }
}

// Show status message for code input
function showCodeStatus(message, type) {
    const codeStatus = document.getElementById('codeStatus');
    if (!codeStatus) return;

    codeStatus.textContent = message;
    codeStatus.className = `scan-status ${type}`;
    codeStatus.classList.remove('hidden');

    // Auto-hide after 5 seconds for non-error messages
    if (type !== 'error') {
        setTimeout(() => {
            codeStatus.classList.add('hidden');
        }, 5000);
    }
}
