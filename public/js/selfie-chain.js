// Selfie Chain - Game Logic
// Manages the selfie chain activity

class SelfieChainApp {
    constructor() {
        this.participantCode = null;
        this.currentTarget = null;
        this.currentStatus = null;
        this.config = null;
        this.cameraStream = null;
        this.capturedPhotoBlob = null;
        this.timerInterval = null;
        this.participantScanner = new QRScanner();
        this.targetScanner = new QRScanner();
        this.targetVerified = false; // Track if QR was scanned
        this.isParticipantScannerActive = false;
        this.isTargetScannerActive = false;
    }

    async init() {
        console.log('[Selfie Chain] Initializing...');

        // Always show participant scan view (shared PC - each user must scan)
        this.showView('participantScanView');
        this.setupParticipantScanning();
    }

    setupParticipantScanning() {
        const startBtn = document.getElementById('startParticipantScanBtn');
        const fileInput = document.getElementById('participantQrFileInput');
        const statusDiv = document.getElementById('participantScanStatus');

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

        // Initialize the QR scanner with callbacks
        this.participantScanner.init(
            'participantQrReader',
            (decodedText) => {
                console.log('[Selfie Chain] QR Scanned:', decodedText);
                this.handleParticipantScan(decodedText);
            },
            (error) => {
                console.error('[Selfie Chain] Scan error:', error);
                statusDiv.textContent = error;
                statusDiv.className = 'alert error';
                statusDiv.classList.remove('hidden');
            }
        );

        // Activate global barcode scanner for physical scanners
        if (window.globalBarcodeScanner) {
            globalBarcodeScanner.activate((qrData) => {
                console.log('[Selfie Chain] Physical scanner data:', qrData);
                this.handleParticipantScan(qrData);
            });
        }

        // Camera scanning toggle
        startBtn.addEventListener('click', async () => {
            if (this.isParticipantScannerActive) {
                // Stop scanning
                await this.participantScanner.stop();
                this.isParticipantScannerActive = false;
                startBtn.textContent = '📷 Start Kamera-Skanning';
            } else {
                // Start scanning
                try {
                    await this.participantScanner.start();
                    this.isParticipantScannerActive = true;
                    startBtn.textContent = '⏹️ Stopp Skanning';
                } catch (err) {
                    console.error('[Selfie Chain] Camera error:', err);
                    statusDiv.textContent = 'Kunne ikke starte kamera. Prøv å laste opp et bilde i stedet.';
                    statusDiv.className = 'alert error';
                    statusDiv.classList.remove('hidden');
                }
            }
        });

        // File upload scanning
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            statusDiv.textContent = 'Skanner bilde...';
            statusDiv.className = 'alert';
            statusDiv.classList.remove('hidden');

            try {
                await this.participantScanner.scanFile(file);
                // Clear the qr-reader div to remove displayed image
                document.getElementById('participantQrReader').innerHTML = '';
            } catch (err) {
                console.error('[Selfie Chain] File scan error:', err);
                const errorMsg = err.message || err.toString();
                if (errorMsg.includes('No MultiFormat Readers') || errorMsg.includes('not detect')) {
                    statusDiv.textContent = '❌ Kunne ikke lese QR-kode. Tips: Bruk et skarpt bilde med god belysning tatt rett forfra. Prøv kamera-skanning.';
                } else {
                    statusDiv.textContent = 'Kunne ikke lese QR-kode fra bildet. Prøv et annet bilde eller kamera-skanning.';
                }
                statusDiv.className = 'alert error';
            }

            // Reset file input
            fileInput.value = '';
        });
    }

    async handleParticipantScan(qrData, skipDecode = false) {
        const statusDiv = document.getElementById('participantScanStatus');
        const startBtn = document.getElementById('startParticipantScanBtn');

        // Stop scanner if active
        if (this.isParticipantScannerActive) {
            await this.participantScanner.stop();
            this.isParticipantScannerActive = false;
            startBtn.textContent = '📷 Start Kamera-Skanning';
        }

        console.log('[Selfie Chain] Raw QR data:', qrData);

        // Decode potential keyboard layout issues - skip if already decoded (from login)
        const decodedData = skipDecode ? qrData : GlobalBarcodeScanner.decodeBarcodeInput(qrData);
        console.log('[Selfie Chain] Decoded data:', decodedData);

        let participantCode;

        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(decodedData);
            console.log('[Selfie Chain] Parsed JSON:', parsed);

            if (parsed.type === 'participant' && parsed.code) {
                participantCode = parsed.code;
            } else {
                // If not the expected format, use as-is
                participantCode = decodedData;
            }
        } catch (e) {
            // Not JSON, use as-is
            console.log('[Selfie Chain] Not JSON, using raw:', decodedData);
            participantCode = decodedData;
        }

        console.log('[Selfie Chain] Final participant code:', participantCode);

        // Trim whitespace
        participantCode = participantCode.trim();

        if (!participantCode) {
            statusDiv.textContent = '❌ Ugyldig QR-kode. Skann din deltaker-QR.';
            statusDiv.className = 'alert error';
            statusDiv.classList.remove('hidden');
            return;
        }

        statusDiv.textContent = '✓ QR-kode skannet! Laster...';
        statusDiv.className = 'alert success';
        statusDiv.classList.remove('hidden');

        // Deactivate global barcode scanner (will be reactivated for target scanning)
        if (window.globalBarcodeScanner) {
            globalBarcodeScanner.deactivate();
        }

        // Save participant code (only in memory, not sessionStorage)
        this.participantCode = participantCode;

        // Wait a moment for feedback
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Load configuration and status
        await this.loadConfig();
        await this.loadStatus();

        // Start timer if activity is running
        if (this.currentStatus && this.currentStatus.has_started && !this.currentStatus.all_met) {
            this.startTimer();
        }
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

        codeLoginBtn.disabled = true;
        codeLoginBtn.textContent = '⏳';
        this.showCodeStatus('Logger inn...', 'info');

        try {
            const participant = await participantAuth.loginWithCode(code);

            if (participant) {
                console.log('Login successful:', participant.first_name);
                await this.handleParticipantScan(participant.participant_code, true);
                participantCodeInput.value = '';
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

        if (type !== 'error') {
            setTimeout(() => {
                codeStatus.classList.add('hidden');
            }, 3000);
        }
    }

    async loadConfig() {
        try {
            const response = await fetch('/api/selfie-chain/config');
            if (!response.ok) throw new Error('Failed to load config');

            this.config = await response.json();
            console.log('[Selfie Chain] Config loaded:', this.config);

            if (!this.config.active) {
                this.showError('Selfie-kjedet er ikke aktivt for øyeblikket.');
            }
        } catch (error) {
            console.error('[Selfie Chain] Error loading config:', error);
            this.showError('Kunne ikke laste konfigurasjon.');
        }
    }

    async loadStatus() {
        try {
            const response = await fetch(`/api/selfie-chain/status/${this.participantCode}`);
            if (!response.ok) throw new Error('Failed to load status');

            this.currentStatus = await response.json();
            console.log('[Selfie Chain] Status loaded:', this.currentStatus);

            // Store participant name and info
            this.participantName = this.currentStatus.participant ?
                `${this.currentStatus.participant.first_name} ${this.currentStatus.participant.last_name}` :
                'Deltaker';
            this.participantPhoto = this.currentStatus.participant?.profile_photo_path || null;

            // Update participant header
            this.updateParticipantHeader();

            // Update UI based on status
            const meetingsCompleted = this.currentStatus.stats?.meetings_completed || 0;

            // Calculate time remaining in real-time (don't use stale server data)
            let timeRemaining = null;
            console.log('[Selfie Chain] Config:', {
                start_time: this.config?.start_time,
                time_limit_minutes: this.config?.time_limit_minutes,
                active: this.config?.active
            });

            if (this.config && this.config.time_limit_minutes && this.config.start_time) {
                const startTimeStr = this.config.start_time.endsWith('Z') ? this.config.start_time : this.config.start_time + 'Z';
                const startTime = new Date(startTimeStr).getTime();
                const now = Date.now();
                const elapsedMinutes = (now - startTime) / 60000;
                timeRemaining = this.config.time_limit_minutes - elapsedMinutes;

                console.log('[Selfie Chain] Time calculation:', {
                    startTime: new Date(startTime).toISOString(),
                    now: new Date(now).toISOString(),
                    elapsedMinutes: elapsedMinutes.toFixed(2),
                    timeLimit: this.config.time_limit_minutes,
                    timeRemaining: timeRemaining.toFixed(2)
                });
            } else {
                console.log('[Selfie Chain] No time limit active or start_time not set');
            }

            if (meetingsCompleted === 0 && !this.currentStatus.has_started) {
                // First time - show instructions view
                this.showInstructionsView();
            } else if (this.currentStatus.all_met) {
                // Show complete view
                this.showCompleteView();
            } else if (this.currentStatus.has_started && timeRemaining !== null && timeRemaining <= 0) {
                // Time has expired - show time up view
                this.showTimeUpView();
            } else {
                // Returning user or has started - show mission view with current target
                this.currentTarget = this.currentStatus.current_target;
                this.showMissionView();
            }

            // Update status bar
            this.updateStatusBar();
        } catch (error) {
            console.error('[Selfie Chain] Error loading status:', error);
            this.showError('Kunne ikke laste status.');
        }
    }

    async startSelfieChain() {
        const startBtn = document.getElementById('startBtn');
        const startStatus = document.getElementById('startStatus');

        startBtn.disabled = true;
        startStatus.textContent = 'Starter...';
        startStatus.className = 'alert';
        startStatus.classList.remove('hidden');

        try {
            const response = await fetch('/api/selfie-chain/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ participant_code: this.participantCode })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to start');
            }

            const result = await response.json();
            console.log('[Selfie Chain] Started:', result);

            this.currentTarget = result.target;
            this.currentStatus = {
                has_started: true,
                stats: {
                    meetings_completed: 0,
                    total_points: 0
                },
                all_met: false,
                current_target: result.target
            };

            startStatus.textContent = '✓ Startet!';
            startStatus.className = 'alert success';

            // Start timer
            this.startTimer();

            // Show mission view
            setTimeout(() => {
                this.showMissionView();
            }, 1000);

        } catch (error) {
            console.error('[Selfie Chain] Error starting:', error);
            startStatus.textContent = `Feil: ${error.message}`;
            startStatus.className = 'alert error';
            startBtn.disabled = false;
        }
    }

    showInstructionsView() {
        this.showView('instructionsView');

        // Update participant name
        if (this.participantName) {
            const firstName = this.participantName.split(' ')[0];
            document.getElementById('welcomeParticipantName').textContent = firstName;
        }

        // Update stats
        const meetings = this.currentStatus?.stats?.meetings_completed || 0;
        const points = this.currentStatus?.stats?.total_points || 0;
        document.getElementById('welcomeMeetings').textContent = meetings;
        document.getElementById('welcomePoints').textContent = points;

        // Update button text based on whether they've started before
        const startBtn = document.getElementById('startBtn');
        if (meetings > 0) {
            startBtn.innerHTML = '🚀 Fortsett kjeden!';
        } else {
            startBtn.innerHTML = '🎯 Finn første person!';
        }
    }

    showMissionView() {
        this.showView('missionView');
        document.getElementById('statusBar').classList.remove('hidden');
        this.targetVerified = false; // Reset verification

        // Reset sections - show scanner, hide selfie button
        document.getElementById('qrScanSection').classList.remove('hidden');
        document.getElementById('selfieButtonSection').classList.add('hidden');

        if (this.currentTarget) {
            // Update target info
            const firstName = this.currentTarget.first_name;
            const lastName = this.currentTarget.last_name;

            document.getElementById('targetName').textContent = `${firstName} ${lastName}`;

            // Update scanner title with target's first name
            const possessiveName = firstName.endsWith('s') ? `${firstName}'` : `${firstName}s`;
            document.getElementById('targetNameInScanner').textContent = possessiveName;

            // Create hint
            const hints = [];
            if (this.currentTarget.age) hints.push(`Alder: ${this.currentTarget.age}`);
            if (this.currentTarget.club) hints.push(`Klubb: ${this.currentTarget.club}`);
            if (this.currentTarget.home_location) hints.push(`Fra: ${this.currentTarget.home_location}`);

            document.getElementById('targetHint').textContent = hints.join(' • ');

            // Update photo
            const photoDiv = document.getElementById('targetPhoto');
            if (this.currentTarget.profile_photo_path) {
                photoDiv.innerHTML = `<img src="${this.currentTarget.profile_photo_path}" alt="Target photo">`;
            } else {
                photoDiv.innerHTML = `<div class="photo-placeholder">👤</div>`;
            }

            // Initialize scanner automatically
            this.scanTarget();
        } else {
            // Chain is complete - all people have been met
            document.getElementById('qrScanSection').classList.add('hidden');
            document.getElementById('selfieButtonSection').classList.add('hidden');

            // Show completion message
            const statusDiv = document.getElementById('missionStatus');
            statusDiv.innerHTML = `
                <div style="text-align: center; padding: 30px;">
                    <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
                    <h2 style="color: var(--success); margin-bottom: 15px;">Gratulerer!</h2>
                    <p style="font-size: 18px; margin-bottom: 10px;">Du har møtt alle personene i kjeden!</p>
                    <p style="color: var(--text-light);">Kjeden er fullført og alle selfies er tatt.</p>
                </div>
            `;
            statusDiv.className = 'alert success';
            statusDiv.classList.remove('hidden');

            // Also update the target info section to show completion
            document.getElementById('targetName').textContent = 'Kjeden er fullført! 🎊';
            document.getElementById('targetHint').textContent = '';
            document.getElementById('targetPhoto').innerHTML = '<div class="photo-placeholder">✅</div>';
        }
    }

    openCamera() {
        console.log('[Selfie Chain] openCamera called, targetVerified:', this.targetVerified);
        // Verify that target has been scanned first
        if (!this.targetVerified) {
            console.warn('[Selfie Chain] Target not verified!');
            this.showMessage('missionStatus', '❌ Du må skanne personens QR-kode først!', 'error');
            return;
        }

        // Deactivate barcode scanner while taking selfie
        if (window.globalBarcodeScanner) {
            console.log('[Selfie Chain] Deactivating global barcode scanner');
            globalBarcodeScanner.deactivate();
        }

        console.log('[Selfie Chain] Showing camera view');
        this.showView('cameraView');
        this.startCamera();
    }

    async startCamera() {
        console.log('[Selfie Chain] startCamera called');
        try {
            const video = document.getElementById('cameraVideo');

            // Request camera with front-facing preference (for selfies)
            console.log('[Selfie Chain] Requesting camera access...');
            this.cameraStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user', // Front camera
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            console.log('[Selfie Chain] Camera access granted');
            video.srcObject = this.cameraStream;
            video.classList.remove('hidden');

            // Hide captured photo if showing
            document.getElementById('capturedPhoto').classList.add('hidden');
            document.getElementById('photoCanvas').classList.add('hidden');

            // Show capture button, hide others
            document.getElementById('captureBtn').classList.remove('hidden');
            document.getElementById('retakeBtn').classList.add('hidden');
            document.getElementById('confirmBtn').classList.add('hidden');

            console.log('[Selfie Chain] Camera UI setup complete');

        } catch (error) {
            console.error('[Selfie Chain] Camera error:', error);
            this.showCameraError('Kunne ikke starte kamera. Sjekk tillatelser.');
        }
    }

    capturePhoto() {
        console.log('[Selfie Chain] capturePhoto called');
        const video = document.getElementById('cameraVideo');
        const canvas = document.getElementById('photoCanvas');
        const capturedImg = document.getElementById('capturedPhoto');
        const ctx = canvas.getContext('2d');

        console.log('[Selfie Chain] Video dimensions:', {
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            readyState: video.readyState
        });

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        console.log('[Selfie Chain] Canvas size set to:', canvas.width, 'x', canvas.height);

        // Check if video has valid dimensions
        if (canvas.width === 0 || canvas.height === 0) {
            console.error('[Selfie Chain] Video dimensions are 0! Video not ready.');
            this.showCameraError('Video ikke klar. Vent litt og prøv igjen.');
            return;
        }

        // Draw video frame to canvas
        console.log('[Selfie Chain] Drawing video to canvas...');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to blob
        console.log('[Selfie Chain] Converting to blob...');
        canvas.toBlob((blob) => {
            console.log('[Selfie Chain] Blob created:', blob ? blob.size : 'NULL');

            if (!blob) {
                console.error('[Selfie Chain] Failed to create blob!');
                this.showCameraError('Kunne ikke ta bilde. Prøv igjen.');
                return;
            }

            this.capturedPhotoBlob = blob;

            // Show captured photo
            const url = URL.createObjectURL(blob);
            capturedImg.src = url;
            capturedImg.classList.remove('hidden');

            // Hide video
            video.classList.add('hidden');

            // Update buttons
            document.getElementById('captureBtn').classList.add('hidden');
            document.getElementById('retakeBtn').classList.remove('hidden');
            const confirmBtn = document.getElementById('confirmBtn');
            confirmBtn.classList.remove('hidden');
            confirmBtn.disabled = false; // Re-enable the button for new photo

            console.log('[Selfie Chain] Photo captured and UI updated');

        }, 'image/jpeg', 0.85);
    }

    retakePhoto() {
        // Reset to camera view
        const video = document.getElementById('cameraVideo');
        const capturedImg = document.getElementById('capturedPhoto');

        video.classList.remove('hidden');
        capturedImg.classList.add('hidden');

        document.getElementById('captureBtn').classList.remove('hidden');
        document.getElementById('retakeBtn').classList.add('hidden');
        document.getElementById('confirmBtn').classList.add('hidden');

        this.capturedPhotoBlob = null;
    }

    async confirmSelfie() {
        console.log('[Selfie Chain] confirmSelfie called');

        if (!this.capturedPhotoBlob) {
            console.error('[Selfie Chain] No photo blob!');
            this.showCameraError('Ingen bilde tatt!');
            return;
        }

        if (!this.currentTarget) {
            console.error('[Selfie Chain] No current target!');
            this.showCameraError('Ingen target!');
            return;
        }

        // Check if time has expired (calculate in real-time, don't use stale data)
        if (this.config && this.config.time_limit_minutes && this.config.start_time) {
            const startTimeStr = this.config.start_time.endsWith('Z') ? this.config.start_time : this.config.start_time + 'Z';
            const startTime = new Date(startTimeStr).getTime();
            const now = Date.now();
            const elapsedMinutes = (now - startTime) / 60000;
            const timeRemaining = this.config.time_limit_minutes - elapsedMinutes;

            console.log('[Selfie Chain] confirmSelfie time check:', {
                startTime: new Date(startTime).toISOString(),
                now: new Date(now).toISOString(),
                elapsedMinutes: elapsedMinutes.toFixed(2),
                timeLimit: this.config.time_limit_minutes,
                timeRemaining: timeRemaining.toFixed(2),
                isExpired: timeRemaining <= 0
            });

            if (timeRemaining <= 0) {
                console.log('[Selfie Chain] TIME EXPIRED - Showing time up view');
                this.stopCamera();
                this.showTimeUpView();
                return;
            }
        }

        const confirmBtn = document.getElementById('confirmBtn');
        const statusDiv = document.getElementById('cameraStatus');

        confirmBtn.disabled = true;
        statusDiv.textContent = 'Laster opp...';
        statusDiv.className = 'alert';
        statusDiv.classList.remove('hidden');

        try {
            // Create form data
            const formData = new FormData();
            formData.append('photo', this.capturedPhotoBlob, 'selfie.jpg');
            formData.append('participant_code', this.participantCode);
            formData.append('target_code', this.currentTarget.participant_code);
            formData.append('target_verified', this.targetVerified);

            console.log('[Selfie Chain] Starting upload...', {
                participantCode: this.participantCode,
                targetCode: this.currentTarget.participant_code,
                photoSize: this.capturedPhotoBlob.size,
                targetVerified: this.targetVerified
            });

            const response = await fetch('/api/selfie-chain/complete', {
                method: 'POST',
                body: formData
            });

            console.log('[Selfie Chain] Got response:', response.status, response.statusText);

            if (!response.ok) {
                const error = await response.json();
                console.log('[Selfie Chain] Error response:', error);
                // Check if time expired
                if (error.time_expired) {
                    this.stopCamera();
                    this.showTimeUpView();
                    return;
                }
                throw new Error(error.error || 'Failed to upload');
            }

            const result = await response.json();
            console.log('[Selfie Chain] Selfie completed:', result);

            // Stop camera
            this.stopCamera();

            // Update status
            if (!this.currentStatus.stats) this.currentStatus.stats = {};
            this.currentStatus.stats.meetings_completed = result.meetings_completed;
            this.currentStatus.stats.total_points = result.total_points;
            this.updateStatusBar();

            // Show success view
            this.showSuccessView(result);

        } catch (error) {
            console.error('[Selfie Chain] Error uploading selfie:', error);
            statusDiv.textContent = `Feil: ${error.message}`;
            statusDiv.className = 'alert error';
            confirmBtn.disabled = false;
        }
    }

    showSuccessView(result) {
        this.showView('successView');

        // Show completed photo
        if (this.capturedPhotoBlob) {
            const url = URL.createObjectURL(this.capturedPhotoBlob);
            document.getElementById('completedPhotoImg').src = url;
        }

        // Show points earned
        document.getElementById('pointsEarned').textContent = result.points_earned;
        document.getElementById('updatedPoints').textContent = result.total_points;
        document.getElementById('updatedMeetings').textContent = result.meetings_completed;

        // Show next target if available
        const nextMissionSection = document.querySelector('.next-mission');
        if (result.next_target) {
            this.currentTarget = result.next_target;
            const nextTargetInfo = document.getElementById('nextTargetInfo');
            nextTargetInfo.innerHTML = `
                <div class="next-target-name">${result.next_target.first_name} ${result.next_target.last_name}</div>
                <div class="next-target-hint">${result.next_target.age ? `Alder: ${result.next_target.age}` : ''}</div>
            `;
            nextMissionSection.style.display = 'block';
        } else {
            // No more targets - hide next mission section and show completion message
            nextMissionSection.style.display = 'none';
            this.currentStatus.all_met = true;

            // Update success message to indicate completion
            const nextTargetInfo = document.getElementById('nextTargetInfo');
            nextTargetInfo.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">🏆</div>
                    <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">Alle møter fullført!</div>
                    <div style="color: var(--text-light);">Du har møtt alle personene i kjeden</div>
                </div>
            `;

            setTimeout(() => {
                this.showCompleteView();
            }, 3000);
        }
    }

    continueToNextMission() {
        if (this.currentStatus.all_met) {
            this.showCompleteView();
        } else {
            this.showMissionView();
        }
    }

    showCompleteView() {
        this.showView('completeView');
        this.stopTimer();

        document.getElementById('finalMeetings').textContent = this.currentStatus.stats?.meetings_completed || 0;
        document.getElementById('finalPoints').textContent = this.currentStatus.stats?.total_points || 0;
    }

    showTimeUpView() {
        this.showView('timeUpView');
        this.stopTimer();

        document.getElementById('timeUpMeetings').textContent = this.currentStatus.stats?.meetings_completed || 0;
        document.getElementById('timeUpPoints').textContent = this.currentStatus.stats?.total_points || 0;
    }

    closeCameraView() {
        this.stopCamera();
        this.showMissionView();
    }

    stopCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }

        const video = document.getElementById('cameraVideo');
        video.srcObject = null;
    }

    // QR Scanner for target verification
    scanTarget() {
        const startBtn = document.getElementById('startTargetScanBtn');
        const fileInput = document.getElementById('targetQrFileInput');
        const statusDiv = document.getElementById('targetScanStatus');

        // Clear any previous status messages
        statusDiv.classList.add('hidden');
        statusDiv.textContent = '';

        // Target login word input
        const targetCodeInput = document.getElementById('targetCodeInput');
        const targetCodeLoginBtn = document.getElementById('targetCodeLoginBtn');
        if (targetCodeLoginBtn) {
            targetCodeLoginBtn.onclick = () => this.handleTargetLoginWithCode();
        }
        if (targetCodeInput) {
            targetCodeInput.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    this.handleTargetLoginWithCode();
                }
            };
        }

        // Initialize the QR scanner with callbacks
        this.targetScanner.init(
            'targetQrReader',
            (decodedText) => this.handleTargetScan(decodedText),
            (error) => {
                statusDiv.textContent = error;
                statusDiv.className = 'alert error';
                statusDiv.classList.remove('hidden');
            }
        );

        // Camera scanning toggle
        startBtn.onclick = async () => {
            if (this.isTargetScannerActive) {
                // Stop scanning
                await this.targetScanner.stop();
                this.isTargetScannerActive = false;
                startBtn.textContent = '📷 Start Kamera-Skanning';
                statusDiv.classList.add('hidden');
            } else {
                // Start scanning
                try {
                    await this.targetScanner.start();
                    this.isTargetScannerActive = true;
                    startBtn.textContent = '⏹️ Stopp Skanning';
                    statusDiv.classList.add('hidden');
                } catch (err) {
                    console.error('[Selfie Chain] Camera error:', err);
                    statusDiv.textContent = 'Kunne ikke starte kamera. Prøv å laste opp et bilde i stedet.';
                    statusDiv.className = 'alert error';
                    statusDiv.classList.remove('hidden');
                }
            }
        };

        // File upload scanning
        fileInput.onchange = async (e) => {
            const file = e.target.files?.[0];
            if (file) {
                statusDiv.textContent = 'Skanner bildet...';
                statusDiv.className = 'alert';
                statusDiv.classList.remove('hidden');

                try {
                    await this.targetScanner.scanFile(file);
                    document.getElementById('targetQrReader').innerHTML = '';
                } catch (err) {
                    console.error('[Selfie Chain] File scan error:', err);
                    const errorMsg = err.message || err.toString();
                    if (errorMsg.includes('No MultiFormat Readers') || errorMsg.includes('not detect')) {
                        statusDiv.textContent = '❌ Kunne ikke lese QR-kode. Tips: Bruk et skarpt bilde med god belysning tatt rett forfra. Prøv kamera-skanning.';
                    } else {
                        statusDiv.textContent = 'Kunne ikke skanne bildet. Prøv igjen eller bruk kamera-skanning.';
                    }
                    statusDiv.className = 'alert error';
                }
                fileInput.value = '';
            }
        };

        // Activate global barcode scanner for physical scanners (target verification)
        if (window.globalBarcodeScanner) {
            globalBarcodeScanner.activate((qrData) => {
                console.log('[Selfie Chain] Physical scanner (target):', qrData);
                this.handleTargetScan(qrData);
            });
        }
    }

    async handleTargetScan(qrData, skipDecode = false) {
        const statusDiv = document.getElementById('targetScanStatus');

        // Decode keyboard layout issues - skip if already decoded (from login)
        const decoded = skipDecode ? qrData : GlobalBarcodeScanner.decodeBarcodeInput(qrData);

        let scannedCode;
        try {
            // Try to parse as JSON
            const parsed = JSON.parse(decoded);
            if (parsed.type === 'participant' && parsed.code) {
                scannedCode = parsed.code;
            } else {
                scannedCode = decoded;
            }
        } catch (e) {
            // Not JSON, use as-is
            scannedCode = decoded;
        }

        scannedCode = scannedCode.trim();
        console.log('[Selfie Chain] Parsed target code:', scannedCode);

        // Check if it matches target
        if (this.currentTarget && scannedCode === this.currentTarget.participant_code) {
            this.targetVerified = true;

            // Stop camera scanner if active
            if (this.isTargetScannerActive) {
                await this.targetScanner.stop();
                this.isTargetScannerActive = false;
                document.getElementById('startTargetScanBtn').textContent = '📷 Start Kamera-Skanning';
            }

            // Update UI - hide scanner section, show selfie button
            document.getElementById('qrScanSection').classList.add('hidden');
            document.getElementById('selfieButtonSection').classList.remove('hidden');

            this.showMessage('missionStatus', '✓ Person verifisert! Nå kan du ta selfie.', 'success');
        } else {
            statusDiv.textContent = '❌ Feil person! Finn riktig person og skann deres QR-kode.';
            statusDiv.className = 'alert error';
            statusDiv.classList.remove('hidden');
        }
    }

    async handleTargetLoginWithCode() {
        const targetCodeInput = document.getElementById('targetCodeInput');
        const targetCodeLoginBtn = document.getElementById('targetCodeLoginBtn');

        if (typeof participantAuth === 'undefined') {
            console.error('participantAuth not available');
            this.showTargetCodeStatus('Autentiseringssystem ikke tilgjengelig', 'error');
            return;
        }

        const code = targetCodeInput.value.trim();

        if (!code) {
            this.showTargetCodeStatus('Vennligst skriv inn personens login-ord', 'error');
            targetCodeInput.focus();
            return;
        }

        targetCodeLoginBtn.disabled = true;
        targetCodeLoginBtn.textContent = '⏳';
        this.showTargetCodeStatus('Logger inn...', 'info');

        try {
            const participant = await participantAuth.loginWithCode(code);

            if (participant) {
                console.log('Target login successful:', participant.first_name);
                await this.handleTargetScan(participant.participant_code, true);
                targetCodeInput.value = '';
                targetCodeLoginBtn.disabled = false;
                targetCodeLoginBtn.textContent = '➡️';
            }
        } catch (error) {
            console.error('Target login error:', error);
            this.showTargetCodeStatus(error.message || 'Feil ved innlogging', 'error');
            targetCodeLoginBtn.disabled = false;
            targetCodeLoginBtn.textContent = '➡️';
        }
    }

    showTargetCodeStatus(message, type) {
        const targetCodeStatus = document.getElementById('targetCodeStatus');
        if (!targetCodeStatus) return;

        targetCodeStatus.textContent = message;
        targetCodeStatus.className = `scan-status ${type}`;
        targetCodeStatus.classList.remove('hidden');

        if (type !== 'error') {
            setTimeout(() => {
                targetCodeStatus.classList.add('hidden');
            }, 3000);
        }
    }

    // My Chain modal
    async showMyChain() {
        const modal = document.getElementById('myChainModal');
        const chainList = document.getElementById('chainList');

        modal.classList.remove('hidden');
        chainList.innerHTML = '<p class="loading">Laster...</p>';

        try {
            const response = await fetch(`/api/selfie-chain/my-chain/${this.participantCode}`);
            if (!response.ok) throw new Error('Failed to load chain');

            const data = await response.json();
            console.log('[Selfie Chain] My chain:', data);

            const chain = data.chain || [];
            document.getElementById('chainLength').textContent = data.chain_length || 0;

            if (chain.length === 0) {
                chainList.innerHTML = '<p class="empty">Du har ingen fullførte møter ennå.</p>';
            } else {
                chainList.innerHTML = chain.map((meeting, index) => `
                    <div class="chain-item">
                        <div class="chain-number">${index + 1}</div>
                        <div class="chain-photo">
                            <img src="${meeting.photo_path}" alt="Selfie">
                        </div>
                        <div class="chain-details">
                            <div class="chain-name">${meeting.first_name} ${meeting.last_name}</div>
                            <div class="chain-points">+${meeting.points_earned}p</div>
                            <div class="chain-time">${this.formatDate(meeting.completed_at)}</div>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('[Selfie Chain] Error loading chain:', error);
            chainList.innerHTML = '<p class="error">Kunne ikke laste kjede.</p>';
        }
    }

    closeMyChain() {
        document.getElementById('myChainModal').classList.add('hidden');
    }

    // Status bar updates
    updateStatusBar() {
        if (!this.currentStatus) return;

        document.getElementById('meetingsCount').textContent = this.currentStatus.stats?.meetings_completed || 0;
        document.getElementById('totalPoints').textContent = this.currentStatus.stats?.total_points || 0;

        // Show my chain button when started
        if (this.currentStatus.has_started) {
            document.getElementById('myChainButton').classList.remove('hidden');
        }
    }

    updateParticipantHeader() {
        if (!this.participantName) return;

        // Show participant header
        const header = document.getElementById('participantHeader');
        header.classList.remove('hidden');

        // Update name
        document.getElementById('headerParticipantName').textContent = this.participantName;

        // Update photo
        const photoImg = document.getElementById('headerParticipantPhoto');
        const placeholder = document.getElementById('headerPhotoPlaceholder');

        if (this.participantPhoto) {
            photoImg.src = this.participantPhoto;
            photoImg.classList.remove('hidden');
            placeholder.classList.add('hidden');
        } else {
            photoImg.classList.add('hidden');
            placeholder.classList.remove('hidden');
        }
    }

    startTimer() {
        if (!this.config || !this.currentStatus) return;

        // Check if time limit is enabled
        if (!this.config.time_limit_minutes || this.config.time_limit_minutes === 0) {
            document.getElementById('timeRemaining').textContent = '∞';
            return;
        }

        // Use GLOBAL start_time from config (not per-participant started_at)
        // This matches the server-side validation
        if (!this.config.start_time) {
            document.getElementById('timeRemaining').textContent = '--';
            return;
        }

        const startTimeStr = this.config.start_time.endsWith('Z') ? this.config.start_time : this.config.start_time + 'Z';
        const startTime = new Date(startTimeStr);
        const endTime = new Date(startTime.getTime() + (this.config.time_limit_minutes * 60 * 1000));

        console.log('[Selfie Chain] Timer - Global start:', startTime, 'End:', endTime);

        // Update immediately first time
        this.updateTimerDisplay(endTime);

        this.timerInterval = setInterval(() => {
            this.updateTimerDisplay(endTime);
        }, 1000);
    }

    updateTimerDisplay(endTime) {
        const now = new Date();
        const remaining = endTime - now;

        if (remaining <= 0) {
            this.stopTimer();
            document.getElementById('timeRemaining').textContent = '00:00';
            // Show time up view
            this.showTimeUpView();
            return;
        }

        // Format time
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        document.getElementById('timeRemaining').textContent =
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    // View management
    showView(viewId) {
        // Hide all views
        const views = document.querySelectorAll('.view');
        views.forEach(view => view.classList.add('hidden'));

        // Show requested view
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.remove('hidden');
        }
    }

    // Error handling
    showError(message) {
        alert(message); // Simple for now, could be improved
    }

    showCameraError(message) {
        const statusDiv = document.getElementById('cameraStatus');
        statusDiv.textContent = message;
        statusDiv.className = 'alert error';
        statusDiv.classList.remove('hidden');
    }

    showMessage(elementId, message, type) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.className = `alert ${type}`;
        element.classList.remove('hidden');

        setTimeout(() => {
            element.classList.add('hidden');
        }, 3000);
    }

    // Utilities
    formatDate(dateString) {
        // SQLite datetime('now') returns UTC without timezone indicator
        // Append 'Z' to parse as UTC if not already present
        const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
        const date = new Date(utcDateString);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Nå nettopp';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} min siden`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} timer siden`;

        return date.toLocaleDateString('no-NO', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Global instance
const selfieChainApp = new SelfieChainApp();

// Global functions for HTML onclick handlers
function startSelfieChain() {
    selfieChainApp.startSelfieChain();
}

function openCamera() {
    selfieChainApp.openCamera();
}

function capturePhoto() {
    selfieChainApp.capturePhoto();
}

function retakePhoto() {
    selfieChainApp.retakePhoto();
}

function confirmSelfie() {
    console.log('[Selfie Chain] Global confirmSelfie function called');
    console.log('[Selfie Chain] selfieChainApp exists:', !!selfieChainApp);
    console.log('[Selfie Chain] selfieChainApp.confirmSelfie exists:', !!selfieChainApp?.confirmSelfie);
    selfieChainApp.confirmSelfie();
}

function closeCameraView() {
    selfieChainApp.closeCameraView();
}

function continueToNextMission() {
    selfieChainApp.continueToNextMission();
}

function showMyChain() {
    selfieChainApp.showMyChain();
}

function closeMyChain() {
    selfieChainApp.closeMyChain();
}

function showLeaderboard() {
    window.location.href = '/live-scoreboard.html#selfie-chain';
}

// Expose app globally for inline onclick handlers
window.app = selfieChainApp;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    selfieChainApp.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    selfieChainApp.stopCamera();
    selfieChainApp.stopTimer();
    if (selfieChainApp.qrScanner) {
        selfieChainApp.qrScanner.stop().catch(() => {});
    }
    // Deactivate global barcode scanner
    if (window.globalBarcodeScanner) {
        globalBarcodeScanner.deactivate();
    }
});
