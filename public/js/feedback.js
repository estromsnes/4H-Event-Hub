// Feedback Submission Logic
class FeedbackForm {
    constructor() {
        // State
        this.currentStep = 1;
        this.isAnonymous = null;
        this.currentParticipant = null;
        this.title = '';
        this.message = '';
        this.activeInput = null; // 'title' or 'message'
        this.scanner = null;
        this.isScannerActive = false;
        this.isScanning = false;

        // DOM elements
        this.eventSubtitle = document.getElementById('eventSubtitle');
        this.eventLogo = document.getElementById('eventLogo');

        this.step1 = document.getElementById('step1');
        this.scannerSection = document.getElementById('scannerSection');
        this.step2 = document.getElementById('step2');
        this.successSection = document.getElementById('successSection');

        this.anonymousBtn = document.getElementById('anonymousBtn');
        this.identifyBtn = document.getElementById('identifyBtn');

        this.startCameraScanBtn = document.getElementById('startCameraScanBtn');
        this.participantInfo = document.getElementById('participantInfo');
        this.participantName = document.getElementById('participantName');
        this.participantDetails = document.getElementById('participantDetails');
        this.cancelScanBtn = document.getElementById('cancelScanBtn');
        this.continueScanBtn = document.getElementById('continueScanBtn');

        this.identityBadge = document.getElementById('identityBadge');
        this.identityText = document.getElementById('identityText');
        this.titleDisplay = document.getElementById('titleDisplay');
        this.messageDisplay = document.getElementById('messageDisplay');
        this.titleKeyboard = document.getElementById('titleKeyboard');
        this.messageKeyboard = document.getElementById('messageKeyboard');
        this.messageCount = document.getElementById('messageCount');
        this.backBtn = document.getElementById('backBtn');
        this.submitBtn = document.getElementById('submitBtn');

        this.newFeedbackBtn = document.getElementById('newFeedbackBtn');
        this.statusMessage = document.getElementById('statusMessage');
        this.scanStatus = document.getElementById('scan-status');

        this.init();
    }

    init() {
        this.loadEventInfo();
        this.setupEventListeners();
        this.buildKeyboards();
    }

    async loadEventInfo() {
        try {
            const response = await fetch('/api/event');
            if (response.ok) {
                const event = await response.json();

                // Update subtitle
                if (event.event_name) {
                    this.eventSubtitle.textContent = event.event_name;
                    document.title = `${event.event_name} - Tilbakemelding`;
                } else {
                    this.eventSubtitle.textContent = 'Din tilbakemelding er viktig for oss';
                }

                // Update logo if exists
                if (event.logo_path) {
                    this.eventLogo.src = event.logo_path + '?t=' + Date.now();
                    this.eventLogo.classList.remove('hidden');
                }
            }
        } catch (err) {
            console.error('Error loading event info:', err);
            this.eventSubtitle.textContent = 'Din tilbakemelding er viktig for oss';
        }
    }

    setupEventListeners() {
        // Step 1: Choice buttons
        this.anonymousBtn.addEventListener('click', () => this.chooseAnonymous());
        this.identifyBtn.addEventListener('click', () => this.chooseIdentify());

        // Login word input
        const participantCodeInput = document.getElementById('participantCodeInput');
        const codeLoginBtn = document.getElementById('codeLoginBtn');
        if (codeLoginBtn) {
            codeLoginBtn.addEventListener('click', () => this.handleLoginWithCode());
        }
        if (participantCodeInput) {
            participantCodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleLoginWithCode();
                }
            });
        }

        // Scanner controls
        this.startCameraScanBtn.addEventListener('click', () => this.toggleScanning());
        this.cancelScanBtn.addEventListener('click', () => this.cancelScan());
        this.continueScanBtn.addEventListener('click', () => this.proceedToStep2());

        // File upload
        const qrFileInput = document.getElementById('qr-file-input');
        if (qrFileInput) {
            qrFileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }

        // Step 2: Input displays
        this.titleDisplay.addEventListener('click', () => this.activateInput('title'));
        this.messageDisplay.addEventListener('click', () => this.activateInput('message'));

        // Step 2: Physical keyboard input
        this.titleDisplay.addEventListener('input', (e) => this.handlePhysicalInput('title', e.target.textContent));
        this.messageDisplay.addEventListener('input', (e) => this.handlePhysicalInput('message', e.target.textContent));

        // Focus handling - clear placeholder on focus
        this.titleDisplay.addEventListener('focus', () => this.handleFocus('title'));
        this.messageDisplay.addEventListener('focus', () => this.handleFocus('message'));

        // Blur handling - restore placeholder if empty
        this.titleDisplay.addEventListener('blur', () => this.handleBlur('title'));
        this.messageDisplay.addEventListener('blur', () => this.handleBlur('message'));

        // Step 2: Navigation
        this.backBtn.addEventListener('click', () => this.goBackToStep1());
        this.submitBtn.addEventListener('click', () => this.submitFeedback());

        // Success: New feedback
        this.newFeedbackBtn.addEventListener('click', () => this.reset());
    }

    buildKeyboards() {
        // Norwegian alphabet including special characters
        const norwegianAlphabet = [
            ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Å'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ø', 'Æ'],
            ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '!', '?'],
            ['SPACE', 'BACKSPACE']
        ];

        // Build keyboard for title
        this.buildKeyboard(this.titleKeyboard, norwegianAlphabet, 'title');

        // Build keyboard for message
        this.buildKeyboard(this.messageKeyboard, norwegianAlphabet, 'message');
    }

    buildKeyboard(container, layout, inputType) {
        container.innerHTML = '';

        layout.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';

            row.forEach(key => {
                const button = document.createElement('button');
                button.className = 'key-button';

                if (key === 'SPACE') {
                    button.textContent = 'Mellomrom';
                    button.classList.add('key-space');
                } else if (key === 'BACKSPACE') {
                    button.textContent = '⌫ Slett';
                    button.classList.add('key-backspace');
                } else {
                    button.textContent = key;
                }

                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleKeyPress(key, inputType);
                });

                rowDiv.appendChild(button);
            });

            container.appendChild(rowDiv);
        });
    }

    handleKeyPress(key, inputType) {
        const maxTitleLength = 200;
        const maxMessageLength = 5000;

        if (key === 'BACKSPACE') {
            if (inputType === 'title') {
                this.title = this.title.slice(0, -1);
            } else {
                this.message = this.message.slice(0, -1);
            }
        } else if (key === 'SPACE') {
            if (inputType === 'title' && this.title.length < maxTitleLength) {
                this.title += ' ';
            } else if (inputType === 'message' && this.message.length < maxMessageLength) {
                this.message += ' ';
            }
        } else {
            if (inputType === 'title' && this.title.length < maxTitleLength) {
                this.title += key;
            } else if (inputType === 'message' && this.message.length < maxMessageLength) {
                this.message += key;
            }
        }

        this.updateDisplays();
    }

    handlePhysicalInput(inputType, value) {
        const maxTitleLength = 200;
        const maxMessageLength = 5000;

        // Ignore placeholder text
        if ((inputType === 'title' && value === 'Klikk for å skrive tittel') ||
            (inputType === 'message' && value === 'Klikk for å skrive melding')) {
            return;
        }

        if (inputType === 'title') {
            // Enforce max length
            if (value.length > maxTitleLength) {
                value = value.substring(0, maxTitleLength);
                this.titleDisplay.textContent = value;
            }
            this.title = value;
        } else if (inputType === 'message') {
            // Enforce max length
            if (value.length > maxMessageLength) {
                value = value.substring(0, maxMessageLength);
                this.messageDisplay.textContent = value;
            }
            this.message = value;
        }

        // Update displays and character count
        this.updateDisplaysFromState();
    }

    handleFocus(inputType) {
        if (inputType === 'title') {
            if (this.titleDisplay.textContent === 'Klikk for å skrive tittel') {
                this.titleDisplay.textContent = '';
            }
        } else if (inputType === 'message') {
            if (this.messageDisplay.textContent === 'Klikk for å skrive melding') {
                this.messageDisplay.textContent = '';
            }
        }
    }

    handleBlur(inputType) {
        if (inputType === 'title') {
            if (!this.title) {
                this.titleDisplay.textContent = 'Klikk for å skrive tittel';
                this.titleDisplay.classList.remove('has-content');
            }
        } else if (inputType === 'message') {
            if (!this.message) {
                this.messageDisplay.textContent = 'Klikk for å skrive melding';
                this.messageDisplay.classList.remove('has-content');
            }
        }
    }

    updateDisplays() {
        // Update title display
        if (this.title) {
            this.titleDisplay.textContent = this.title;
            this.titleDisplay.classList.add('has-content');
        } else {
            this.titleDisplay.textContent = 'Klikk for å skrive tittel';
            this.titleDisplay.classList.remove('has-content');
        }

        // Update message display
        if (this.message) {
            this.messageDisplay.textContent = this.message;
            this.messageDisplay.classList.add('has-content');
        } else {
            this.messageDisplay.textContent = 'Klikk for å skrive melding';
            this.messageDisplay.classList.remove('has-content');
        }

        // Update character count
        this.messageCount.textContent = this.message.length;

        // Update submit button state
        this.submitBtn.disabled = !this.message.trim();
    }

    updateDisplaysFromState() {
        // Update character count
        this.messageCount.textContent = this.message.length;

        // Update submit button state
        this.submitBtn.disabled = !this.message.trim();

        // Update has-content classes
        if (this.title) {
            this.titleDisplay.classList.add('has-content');
        } else {
            this.titleDisplay.classList.remove('has-content');
        }

        if (this.message) {
            this.messageDisplay.classList.add('has-content');
        } else {
            this.messageDisplay.classList.remove('has-content');
        }
    }

    activateInput(inputType) {
        this.activeInput = inputType;

        // Hide all keyboards first
        this.titleKeyboard.classList.add('hidden');
        this.messageKeyboard.classList.add('hidden');

        // Remove active class from all displays
        this.titleDisplay.classList.remove('active');
        this.messageDisplay.classList.remove('active');

        // Show appropriate keyboard and mark display as active
        if (inputType === 'title') {
            this.titleKeyboard.classList.remove('hidden');
            this.titleDisplay.classList.add('active');
            this.titleDisplay.focus();
        } else if (inputType === 'message') {
            this.messageKeyboard.classList.remove('hidden');
            this.messageDisplay.classList.add('active');
            this.messageDisplay.focus();
        }
    }

    chooseAnonymous() {
        this.isAnonymous = true;
        this.currentParticipant = null;
        this.proceedToStep2();
    }

    chooseIdentify() {
        this.isAnonymous = false;
        this.showSection(this.scannerSection);

        // Setup barcode scanner input handler
        this.setupBarcodeScanning();

        // Activate global barcode scanner
        if (typeof globalBarcodeScanner !== 'undefined') {
            this.isScannerActive = true;
            globalBarcodeScanner.activate((qrData) => {
                if (this.isScannerActive) {
                    this.handleScan(qrData);
                }
            });
        }
    }

    setupBarcodeScanning() {
        const barcodeInput = document.getElementById('barcode-input');
        if (!barcodeInput) {
            console.warn('Barcode input element not found');
            return;
        }

        let scanBuffer = '';
        let scanTimeout = null;

        // Barcode scanner input handler
        barcodeInput.addEventListener('input', (e) => {
            clearTimeout(scanTimeout);
            scanBuffer += e.target.value;
            e.target.value = '';

            scanTimeout = setTimeout(() => {
                if (scanBuffer.length > 0 && this.isScannerActive) {
                    console.log('Barcode scanned via input field:', scanBuffer);
                    this.handleScan(scanBuffer.trim());
                    scanBuffer = '';
                }
            }, 100);
        });

        // Keep focus on barcode input for background scanning
        barcodeInput.focus();

        console.log('Barcode scanning initialized');
    }

    async toggleScanning() {
        if (this.isScanning) {
            await this.stopScanning();
        } else {
            await this.startScanning();
        }
    }

    async startScanning() {
        console.log('Starting camera scan...');
        this.startCameraScanBtn.textContent = '📷 Starter...';

        try {
            // Only start camera scanner if QRScanner is supported
            if (typeof QRScanner !== 'undefined' && QRScanner.isSupported && QRScanner.isSupported()) {
                this.scanner = new QRScanner();
                await this.scanner.init(
                    'qr-reader',
                    (decodedText) => this.handleScan(decodedText),
                    (error) => console.error('Scanner error:', error)
                );
                await this.scanner.start();
                this.isScanning = true;
                this.startCameraScanBtn.textContent = '⏸️ Stopp Kamera';
                this.showScanStatus('Skanner etter QR-kode... (Klikk "Stopp Kamera" for å avslutte)', 'info');
                console.log('Camera scanner started successfully');
            } else {
                throw new Error('QR Scanner er ikke støttet i denne nettleseren');
            }
        } catch (err) {
            console.error('Scanner error:', err);
            this.showScanStatus(err.message || 'Kunne ikke starte kamera', 'error');
            this.isScanning = false;
            this.startCameraScanBtn.textContent = '📷 Start Kamera-Skanning';
        }
    }

    async stopScanning() {
        console.log('Stopping camera scan...');

        try {
            if (this.scanner) {
                await this.scanner.stop();
            }
            this.isScanning = false;
            this.startCameraScanBtn.textContent = '📷 Start Kamera-Skanning';
            this.showScanStatus('Skanning stoppet', 'info');
            setTimeout(() => {
                this.hideScanStatus();
            }, 2000);
            console.log('Camera scanner stopped successfully');
        } catch (err) {
            console.error('Scanner stop error:', err);
            this.showScanStatus('Kunne ikke stoppe skanning', 'error');
        }
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.showScanStatus('Leser QR-kode fra bilde...', 'info');

        try {
            // Stop camera scanner temporarily
            if (this.scanner && this.isScanning) {
                await this.stopScanning();
            }

            // Initialize scanner if not already initialized
            if (!this.scanner) {
                this.scanner = new QRScanner();
                await this.scanner.init(
                    'qr-reader',
                    (decodedText) => this.handleScan(decodedText),
                    (error) => console.error('Scanner error:', error)
                );
            }

            // Use the QRScanner's scanFile method
            await this.scanner.scanFile(file);

        } catch (error) {
            console.error('Error scanning file:', error);
            this.showScanStatus('Kunne ikke lese QR-kode fra bildet. Prøv et annet bilde.', 'error');
        } finally {
            // Clear file input
            event.target.value = '';
        }
    }

    async handleScan(qrData) {
        console.log('handleScan called with:', qrData);

        try {
            // Decode QR data using global barcode scanner
            const decoded = GlobalBarcodeScanner.decodeBarcodeInput(qrData);
            console.log('Decoded data:', decoded);

            // Try to parse as JSON, otherwise use as plain participant code
            let participantCode;
            try {
                const parsed = JSON.parse(decoded);
                console.log('Parsed JSON:', parsed);

                if (parsed && parsed.type === 'participant' && parsed.code) {
                    participantCode = parsed.code;
                } else {
                    console.warn('Invalid QR code structure:', parsed);
                    this.showScanStatus('Ugyldig QR-kode. Skann din deltaker-QR-kode.', 'error');
                    return;
                }
            } catch (e) {
                // Not JSON, treat as plain participant code
                console.log('Not JSON format, using as participant code:', decoded);
                participantCode = decoded;
            }

            console.log('Looking up participant:', participantCode);

            // Fetch participant info
            const response = await fetch(`/api/participants/${participantCode}`);
            console.log('API response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API error:', errorText);
                throw new Error(`Deltaker ikke funnet (kode: ${participantCode})`);
            }

            const participant = await response.json();
            console.log('Found participant:', participant);
            this.currentParticipant = participant;

            // Display participant info
            this.participantName.textContent = `${participant.first_name} ${participant.last_name}`;
            const details = [];
            if (participant.age) details.push(`${participant.age} år`);
            if (participant.club) details.push(participant.club);
            this.participantDetails.textContent = details.join(' • ');

            this.participantInfo.classList.remove('hidden');
            this.continueScanBtn.classList.remove('hidden');

            // Hide camera scan button and reset it
            this.startCameraScanBtn.style.display = 'none';

            // Stop camera scanner
            if (this.scanner) {
                await this.scanner.stop();
            }
            this.isScanning = false;
            this.startCameraScanBtn.textContent = '📷 Start Kamera-Skanning';

            // Deactivate global barcode scanner
            this.isScannerActive = false;
            if (typeof globalBarcodeScanner !== 'undefined') {
                globalBarcodeScanner.deactivate();
            }

            this.showScanStatus('Deltaker identifisert! ✓', 'success');
        } catch (err) {
            console.error('Scan error:', err);
            this.showScanStatus(err.message || 'Kunne ikke identifisere deltaker', 'error');
        }
    }

    async cancelScan() {
        // Deactivate global barcode scanner
        this.isScannerActive = false;
        if (typeof globalBarcodeScanner !== 'undefined') {
            globalBarcodeScanner.deactivate();
        }

        // Stop camera scanner
        if (this.scanner) {
            await this.scanner.stop();
            this.scanner = null;
        }
        this.isScanning = false;

        // Reset camera scan button
        this.startCameraScanBtn.style.display = 'block';
        this.startCameraScanBtn.textContent = '📷 Start Kamera-Skanning';

        // Hide scan status
        this.hideScanStatus();

        this.showSection(this.step1);
        this.participantInfo.classList.add('hidden');
        this.continueScanBtn.classList.add('hidden');
    }

    async handleLoginWithCode() {
        const participantCodeInput = document.getElementById('participantCodeInput');
        const codeLoginBtn = document.getElementById('codeLoginBtn');

        if (typeof participantAuth === 'undefined') {
            console.error('participantAuth not available');
            this.showCodeStatus('Autentiseringssystem ikke tilgjengelig', 'error');
            return;
        }

        const code = participantCodeInput.value.trim();

        if (!code) {
            this.showCodeStatus('Vennligst skriv inn ditt login-ord', 'error');
            participantCodeInput.focus();
            return;
        }

        // Disable button and show loading
        codeLoginBtn.disabled = true;
        codeLoginBtn.textContent = '⏳';
        this.showCodeStatus('Logger inn...', 'info');

        try {
            const participant = await participantAuth.loginWithCode(code);

            if (participant) {
                console.log('Login successful:', participant.first_name);
                this.currentParticipant = participant;

                // Display participant info
                this.participantName.textContent = `${participant.first_name} ${participant.last_name}`;
                const details = [];
                if (participant.age) details.push(`${participant.age} år`);
                if (participant.club) details.push(participant.club);
                this.participantDetails.textContent = details.join(' • ');

                this.participantInfo.classList.remove('hidden');
                this.continueScanBtn.classList.remove('hidden');

                // Hide camera scan button
                this.startCameraScanBtn.style.display = 'none';

                // Clear input
                participantCodeInput.value = '';

                this.showCodeStatus('✅ Innlogget!', 'success');

                // Reset button
                codeLoginBtn.disabled = false;
                codeLoginBtn.textContent = '➡️';
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showCodeStatus(error.message || 'Feil ved innlogging', 'error');
            codeLoginBtn.disabled = false;
            codeLoginBtn.textContent = '➡️';
        }
    }

    showCodeStatus(message, type) {
        const codeStatus = document.getElementById('codeStatus');
        if (!codeStatus) return;

        codeStatus.textContent = message;
        codeStatus.className = `scan-status ${type}`;
        codeStatus.classList.remove('hidden');

        // Auto-hide after 3 seconds for non-error messages
        if (type !== 'error') {
            setTimeout(() => {
                codeStatus.classList.add('hidden');
            }, 3000);
        }
    }

    proceedToStep2() {
        // Deactivate global barcode scanner when moving to step 2
        this.isScannerActive = false;
        if (typeof globalBarcodeScanner !== 'undefined') {
            globalBarcodeScanner.deactivate();
        }

        // Update identity badge
        if (this.isAnonymous) {
            this.identityText.innerHTML = '🕵️ Anonym tilbakemelding';
            this.identityBadge.classList.add('anonymous');
            this.identityBadge.classList.remove('identified');
        } else if (this.currentParticipant) {
            this.identityText.innerHTML = `👤 ${this.currentParticipant.first_name} ${this.currentParticipant.last_name}`;
            this.identityBadge.classList.add('identified');
            this.identityBadge.classList.remove('anonymous');
        }

        this.showSection(this.step2);
        this.updateDisplays();
    }

    goBackToStep1() {
        // Deactivate global barcode scanner
        this.isScannerActive = false;
        if (typeof globalBarcodeScanner !== 'undefined') {
            globalBarcodeScanner.deactivate();
        }

        this.showSection(this.step1);
        // Keep data in case user wants to continue
    }

    async submitFeedback() {
        if (!this.message.trim()) {
            this.showStatus('Melding er påkrevd', 'error');
            return;
        }

        this.submitBtn.disabled = true;
        this.submitBtn.textContent = 'Sender inn...';

        try {
            const payload = {
                title: this.title.trim() || null,
                message: this.message.trim(),
                participant_code: this.isAnonymous ? null : this.currentParticipant?.participant_code,
                is_anonymous: this.isAnonymous ? 1 : 0
            };

            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Kunne ikke sende inn');
            }

            // Success!
            this.showSection(this.successSection);
            this.showStatus('Tilbakemelding sendt inn!', 'success');
        } catch (err) {
            console.error('Submit error:', err);
            this.showStatus(err.message || 'Kunne ikke sende inn tilbakemelding', 'error');
            this.submitBtn.disabled = false;
            this.submitBtn.textContent = 'Send inn';
        }
    }

    showSection(section) {
        // Hide all sections
        this.step1.classList.add('hidden');
        this.scannerSection.classList.add('hidden');
        this.step2.classList.add('hidden');
        this.successSection.classList.add('hidden');

        // Show target section
        section.classList.remove('hidden');
    }

    showStatus(message, type = 'info') {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
        this.statusMessage.classList.remove('hidden');

        setTimeout(() => {
            this.statusMessage.classList.add('hidden');
        }, 4000);
    }

    showScanStatus(message, type = 'info') {
        if (this.scanStatus) {
            this.scanStatus.textContent = message;
            this.scanStatus.className = `scan-status ${type}`;
            this.scanStatus.style.display = 'block';
        }
    }

    hideScanStatus() {
        if (this.scanStatus) {
            this.scanStatus.style.display = 'none';
        }
    }

    reset() {
        // Deactivate global barcode scanner
        this.isScannerActive = false;
        if (typeof globalBarcodeScanner !== 'undefined') {
            globalBarcodeScanner.deactivate();
        }

        // Clear scanner if active
        if (this.scanner) {
            this.scanner.stop();
            this.scanner = null;
        }
        this.isScanning = false;

        // Reset camera scan button
        this.startCameraScanBtn.style.display = 'block';
        this.startCameraScanBtn.textContent = '📷 Start Kamera-Skanning';

        // Hide scan status
        this.hideScanStatus();

        // Reset state
        this.currentStep = 1;
        this.isAnonymous = null;
        this.currentParticipant = null;
        this.title = '';
        this.message = '';
        this.activeInput = null;

        // Reset UI
        this.participantInfo.classList.add('hidden');
        this.continueScanBtn.classList.add('hidden');
        this.titleKeyboard.classList.add('hidden');
        this.messageKeyboard.classList.add('hidden');
        this.submitBtn.disabled = false;
        this.submitBtn.textContent = 'Send inn';

        // Show step 1
        this.showSection(this.step1);
        this.updateDisplays();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new FeedbackForm();
});
