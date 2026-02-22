// Team Challenge Module

class TeamChallengeManager {
    constructor() {
        // Always start fresh - no session state
        this.scanner = null;
        this.sessionId = null;
        this.teamName = null;
        this.timerInterval = null;
        this.timerStartTime = null;
        this.timeLimit = 120; // seconds (will be updated from server)
        this.isScanning = false;
        this.cameraStream = null;
        this.lastScannedCode = null;
        this.lastScanTime = 0;
        this.scanCooldown = 2000; // 2 seconds cooldown between scans

        this.initViews();
        this.initScanner();
        this.initEventListeners();
    }

    initViews() {
        this.views = {
            instructions: document.getElementById('instructionsView'),
            scanner: document.getElementById('scannerView'),
            success: document.getElementById('successView'),
            failure: document.getElementById('failureView')
        };
    }

    showView(viewName) {
        Object.values(this.views).forEach(v => v.classList.add('hidden'));
        this.views[viewName].classList.remove('hidden');
    }

    initScanner() {
        // Barcode scanner (keyboard emulation)
        const barcodeInput = document.getElementById('barcodeInput');
        let scanBuffer = '';
        let scanTimeout;

        barcodeInput.addEventListener('input', (e) => {
            clearTimeout(scanTimeout);
            scanBuffer += e.target.value;
            e.target.value = '';

            scanTimeout = setTimeout(() => {
                if (scanBuffer.trim()) {
                    this.handleScan(scanBuffer.trim());
                }
                scanBuffer = '';
            }, 100);
        });

        // Camera scanner
        this.scanner = new QRScanner();
        this.scanner.init(
            'qr-reader',
            (code) => this.handleScan(code),
            (error) => this.showScanError(error)
        );
    }

    initEventListeners() {
        document.getElementById('startChallengeBtn')
            .addEventListener('click', () => this.startChallenge());

        document.getElementById('startCameraBtn')
            .addEventListener('click', () => this.scanner.start());

        document.getElementById('qrFileInput')
            .addEventListener('change', (e) => this.handleQrFileUpload(e));

        document.getElementById('takeTeamPhotoBtn')
            .addEventListener('click', () => this.openCameraModal());

        document.getElementById('viewLeaderboardBtn')
            .addEventListener('click', () => this.showLeaderboard());

        document.getElementById('viewLeaderboardBtn2')
            .addEventListener('click', () => this.showLeaderboard());

        document.getElementById('newChallengeBtn')
            .addEventListener('click', () => this.resetChallenge());

        document.getElementById('tryAgainBtn')
            .addEventListener('click', () => this.resetChallenge());

        document.getElementById('backToHomeBtn')
            .addEventListener('click', () => {
                window.location.href = '/index.html';
            });

        document.getElementById('cancelChallengeBtn')
            .addEventListener('click', () => this.resetChallenge());

        // Camera modal buttons
        this.initCameraModal();

        // Leaderboard modal
        document.getElementById('closeLeaderboardBtn')
            .addEventListener('click', () => this.closeLeaderboard());

        // Leaderboard tabs
        document.getElementById('tabFastest')
            .addEventListener('click', () => this.showLeaderboard('fastest'));
        document.getElementById('tabFirst')
            .addEventListener('click', () => this.showLeaderboard('first'));
    }

    async startChallenge() {
        // Reset any previous session state
        this.sessionId = null;
        this.teamName = null;
        this.stopTimer();

        this.showView('scanner');
        this.isScanning = true;
        document.getElementById('barcodeInput').focus();
    }

    /**
     * Decode barcode scanner keyboard layout issues
     * Some barcode scanners send JSON with wrong keyboard mapping
     */
    decodeBarcodeInput(input) {
        // Map Norwegian keyboard chars back to JSON chars
        const charMap = {
            'Å': '{',
            'Æ': '"',
            'Ø': ':',
            '^': '}',
            '¨': '[',
            '\'': ']',
            '§': ','
        };

        // Try to detect if this is garbled JSON
        if (input.includes('Å') || input.includes('Æ') || input.includes('Ø')) {
            let decoded = input;
            for (const [garbled, correct] of Object.entries(charMap)) {
                decoded = decoded.split(garbled).join(correct);
            }
            return decoded;
        }

        // Also replace + with - for participant codes (SK+2026+004 → SK-2026-004)
        return input.replace(/\+/g, '-');
    }

    async handleScan(participantCode) {
        if (!this.isScanning) return;

        try {
            // Decode potential keyboard layout issues
            const decodedInput = this.decodeBarcodeInput(participantCode);

            // Parse QR code if JSON format
            let code = decodedInput;
            try {
                const data = JSON.parse(decodedInput);
                if (data.type === 'participant' && data.code) {
                    code = data.code;
                }
            } catch (parseErr) {
                // If JSON parsing fails, try using the raw input as code
                console.log('Could not parse as JSON, using raw code:', decodedInput);
            }

            // Debounce: Prevent scanning same code multiple times in quick succession
            const now = Date.now();
            if (code === this.lastScannedCode && (now - this.lastScanTime) < this.scanCooldown) {
                console.log('Scan ignored (cooldown period)');
                return;
            }

            this.lastScannedCode = code;
            this.lastScanTime = now;

            if (!this.sessionId) {
                // First scan - start session
                await this.startSession(code);
            } else {
                // Subsequent scan
                await this.recordScan(code);
            }
        } catch (err) {
            console.error('Scan error:', err);
            this.showScanError(err.message || 'Ukjent feil ved skanning');
        }
    }

    async handleQrFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        this.showScanFeedback('Leser QR-kode fra bilde...', 'info');

        try {
            // Create a temporary Html5Qrcode instance for file scanning
            const html5QrCode = new Html5Qrcode("qr-reader");

            const decodedText = await html5QrCode.scanFile(file, true);
            this.handleScan(decodedText);

            // Clear the file input so same file can be selected again
            e.target.value = '';
            // Clear the qr-reader div to remove displayed image
            document.getElementById('qr-reader').innerHTML = '';
        } catch (err) {
            console.error('QR File scan error:', err);
            this.showScanFeedback('Kunne ikke lese QR-kode fra bildet. Prøv igjen.', 'error');
            e.target.value = '';
            // Clear the qr-reader div
            document.getElementById('qr-reader').innerHTML = '';
        }
    }

    async startSession(participantCode) {
        const response = await fetch('/api/team-challenge/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participant_code: participantCode })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Kunne ikke starte utfordring');
        }

        const data = await response.json();
        this.sessionId = data.session_id;
        this.teamName = data.team_name;
        this.timeLimit = data.time_limit_seconds;

        // Update UI
        document.getElementById('teamName').textContent = this.teamName;
        document.getElementById('teamHeader').classList.remove('hidden');
        document.getElementById('progressSection').classList.remove('hidden');

        // Start timer immediately after first scan
        this.startTimer();

        this.updateTeamMemberList(data.team_members);
        this.showScanFeedback('✅ Første skanning! Tidtaker er startet - dere har 2 minutter!', 'success');
    }

    async recordScan(participantCode) {
        const response = await fetch('/api/team-challenge/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: this.sessionId,
                participant_code: participantCode
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Feil ved skanning');
        }

        const data = await response.json();

        // Update UI
        this.updateTeamMemberList(data.team_members);
        this.showScanFeedback(
            `✅ ${data.scans_completed} av ${data.scans_required} skannet!`,
            'success'
        );

        // Check if completed
        if (data.challenge_completed) {
            this.onChallengeComplete(data);
        } else if (data.time_expired) {
            this.onChallengeTimeout(data.scans_completed, data.scans_required);
        }
    }

    startTimer() {
        this.timerStartTime = Date.now();
        const timerDisplay = document.getElementById('timerDisplay');
        timerDisplay.classList.remove('hidden');

        this.timerInterval = setInterval(() => {
            const elapsed = (Date.now() - this.timerStartTime) / 1000;
            const remaining = Math.max(0, this.timeLimit - elapsed);

            this.updateTimerDisplay(remaining);

            if (remaining === 0) {
                // Count scanned members from DOM
                const scannedCount = document.querySelectorAll('.team-member-item.scanned').length;
                const totalCount = document.querySelectorAll('.team-member-item').length;
                this.onChallengeTimeout(scannedCount, totalCount);
            }
        }, 100);
    }

    updateTimerDisplay(remainingSeconds) {
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = Math.floor(remainingSeconds % 60);
        const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        const timerValue = document.getElementById('timerValue');
        timerValue.textContent = display;

        // Visual warnings
        timerValue.classList.remove('warning', 'danger');
        if (remainingSeconds <= 10) {
            timerValue.classList.add('danger');
        } else if (remainingSeconds <= 30) {
            timerValue.classList.add('warning');
        }
    }

    updateTeamMemberList(members) {
        const list = document.getElementById('teamMemberList');
        list.innerHTML = members.map(member => `
            <div class="team-member-item ${member.scanned ? 'scanned' : ''}">
                <div class="member-checkbox ${member.scanned ? 'checked' : ''}">
                    ${member.scanned ? '✓' : ''}
                </div>
                <div class="member-info">
                    <div class="member-name">${member.first_name} ${member.last_name}</div>
                    <div class="member-code">${member.participant_code}</div>
                </div>
            </div>
        `).join('');
    }

    onChallengeComplete(data) {
        this.stopTimer();
        this.isScanning = false;

        // Stop the scanner
        if (this.scanner && this.scanner.isScanning) {
            this.scanner.stop();
        }

        // Confetti animation
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#4CAF50', '#FFD700', '#FF9800']
            });

            // More confetti after a delay
            setTimeout(() => {
                confetti({
                    particleCount: 100,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 }
                });
                confetti({
                    particleCount: 100,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 }
                });
            }, 250);
        }

        // Show success view
        this.showView('success');
        document.getElementById('successTeamName').textContent = this.teamName;
        document.getElementById('completionTime').textContent =
            this.formatTime(data.elapsed_time_seconds);
        document.getElementById('memberCount').textContent =
            data.scans_required;
    }

    onChallengeTimeout(scannedCount = 0, requiredCount = 0) {
        this.stopTimer();
        this.isScanning = false;

        // Stop the scanner
        if (this.scanner && this.scanner.isScanning) {
            this.scanner.stop();
        }

        // Show failure view
        this.showView('failure');
        document.getElementById('failureTeamName').textContent = this.teamName;
        document.getElementById('scannedCount').textContent = scannedCount;
        document.getElementById('requiredCount').textContent = requiredCount;
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    showScanFeedback(message, type) {
        const feedback = document.getElementById('scanFeedback');
        feedback.textContent = message;
        feedback.className = `scan-feedback ${type}`;
        feedback.classList.remove('hidden');

        setTimeout(() => {
            feedback.classList.add('hidden');
        }, 3000);
    }

    showScanError(message) {
        this.showScanFeedback('❌ ' + message, 'error');
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 10);
        return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
    }

    // =========================================================================
    // Camera Modal for Team Photo
    // =========================================================================

    initCameraModal() {
        const modal = document.getElementById('cameraModal');
        const video = document.getElementById('cameraVideo');
        const canvas = document.getElementById('photoCanvas');
        const capturedPhoto = document.getElementById('capturedPhoto');
        const captureBtn = document.getElementById('captureBtn');
        const retakeBtn = document.getElementById('retakeBtn');
        const savePhotoBtn = document.getElementById('savePhotoBtn');
        const closeBtn = document.getElementById('closeCameraBtn');

        closeBtn.addEventListener('click', () => this.closeCameraModal());

        captureBtn.addEventListener('click', async () => {
            try {
                // Disable capture button during countdown
                captureBtn.disabled = true;

                // Get countdown overlay element
                const countdownOverlay = document.getElementById('countdownOverlay');

                // Create a temporary camera instance for countdown
                const camera = new Camera(video, canvas);
                camera.stream = this.cameraStream; // Use existing stream

                // Capture with countdown
                await camera.captureWithCountdown(countdownOverlay);

                // Convert to blob and display
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    capturedPhoto.src = url;
                    capturedPhoto.classList.remove('hidden');
                    video.classList.add('hidden');

                    captureBtn.classList.add('hidden');
                    retakeBtn.classList.remove('hidden');
                    savePhotoBtn.classList.remove('hidden');

                    // Store blob for upload
                    this.photoBlob = blob;
                }, 'image/jpeg', 0.85);
            } catch (err) {
                console.error('Error capturing photo:', err);
                alert('Kunne ikke ta bilde: ' + err.message);
            } finally {
                captureBtn.disabled = false;
            }
        });

        retakeBtn.addEventListener('click', () => {
            video.classList.remove('hidden');
            capturedPhoto.classList.add('hidden');
            captureBtn.classList.remove('hidden');
            retakeBtn.classList.add('hidden');
            savePhotoBtn.classList.add('hidden');
            this.photoBlob = null;
        });

        savePhotoBtn.addEventListener('click', () => {
            this.uploadTeamPhoto();
        });
    }

    async openCameraModal() {
        const modal = document.getElementById('cameraModal');
        const video = document.getElementById('cameraVideo');
        const capturedPhoto = document.getElementById('capturedPhoto');
        const captureBtn = document.getElementById('captureBtn');
        const retakeBtn = document.getElementById('retakeBtn');
        const savePhotoBtn = document.getElementById('savePhotoBtn');

        // Reset state
        video.classList.remove('hidden');
        capturedPhoto.classList.add('hidden');
        captureBtn.classList.remove('hidden');
        retakeBtn.classList.add('hidden');
        savePhotoBtn.classList.add('hidden');
        document.getElementById('photoStatus').classList.add('hidden');

        try {
            // Start camera
            this.cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            });
            video.srcObject = this.cameraStream;

            modal.classList.remove('hidden');
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Kunne ikke åpne kamera. Sjekk tillatelser.');
        }
    }

    closeCameraModal() {
        const modal = document.getElementById('cameraModal');
        modal.classList.add('hidden');

        // Stop camera stream
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }

        this.photoBlob = null;
    }

    async uploadTeamPhoto() {
        if (!this.photoBlob || !this.sessionId) return;

        const saveBtn = document.getElementById('savePhotoBtn');
        const statusDiv = document.getElementById('photoStatus');

        try {
            saveBtn.disabled = true;
            saveBtn.textContent = '⏳ Laster opp...';

            const formData = new FormData();
            formData.append('photo', this.photoBlob, 'team-photo.jpg');

            const response = await fetch(`/api/team-challenge/session/${this.sessionId}/photo`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }

            const result = await response.json();

            statusDiv.textContent = '✅ Lagbilde lagret!';
            statusDiv.className = 'alert success';
            statusDiv.classList.remove('hidden');

            setTimeout(() => {
                this.closeCameraModal();
            }, 1500);

        } catch (err) {
            console.error('Error uploading photo:', err);
            statusDiv.textContent = '❌ ' + err.message;
            statusDiv.className = 'alert error';
            statusDiv.classList.remove('hidden');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = '✓ Lagre Bilde';
        }
    }

    // =========================================================================
    // Leaderboard
    // =========================================================================

    async showLeaderboard(sortBy = 'fastest') {
        const modal = document.getElementById('leaderboardModal');
        const content = document.getElementById('leaderboardContent');

        try {
            content.innerHTML = '<p style="text-align: center;">⏳ Laster...</p>';
            modal.classList.remove('hidden');

            // Update active tab
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.sort === sortBy);
            });

            const response = await fetch(`/api/team-challenge/leaderboard?sortBy=${sortBy}`);
            if (!response.ok) throw new Error('Failed to fetch leaderboard');

            const data = await response.json();

            if (data.completed_teams.length === 0) {
                content.innerHTML = `
                    <div class="leaderboard-empty">
                        <p>Ingen lag har fullført utfordringen ennå.</p>
                        ${!data.event_started ? '<p>Arrangementet har ikke startet.</p>' : ''}
                    </div>
                `;
                return;
            }

            content.innerHTML = data.completed_teams.map(team => {
                const rankClass = team.rank <= 3 ? `rank-${team.rank}` : '';
                const photoHtml = team.team_photo_path
                    ? `<img src="${team.team_photo_path}" class="team-photo-thumb" width="80" height="80" alt="${team.team_name}">`
                    : '<div class="team-photo-thumb" style="background: #e0e0e0; display: flex; align-items: center; justify-content: center; font-size: 28px; color: #999;">📸</div>';

                let primaryMetric, secondaryMetric;

                if (sortBy === 'fastest') {
                    // Fastest scan time is primary
                    primaryMetric = `<div class="team-time">⚡ ${this.formatTime(team.elapsed_time_seconds)}</div>`;
                    secondaryMetric = team.minutes_after_start !== null
                        ? `<div style="font-size: 14px; margin-top: 5px; opacity: 0.8;">${Math.floor(team.minutes_after_start)} min etter start</div>`
                        : '';
                } else {
                    // First to complete is primary
                    primaryMetric = team.minutes_after_start !== null
                        ? `<div class="team-time">🥇 ${Math.floor(team.minutes_after_start)} min etter start</div>`
                        : '<div class="team-time">-</div>';
                    secondaryMetric = `<div style="font-size: 14px; margin-top: 5px; opacity: 0.8;">Skann-tid: ${this.formatTime(team.elapsed_time_seconds)}</div>`;
                }

                return `
                    <div class="leaderboard-item ${rankClass}">
                        <div class="rank-badge">${team.rank}</div>
                        ${photoHtml}
                        <div class="team-info">
                            <div class="team-name-display">${team.team_name}</div>
                            ${primaryMetric}
                            ${secondaryMetric}
                        </div>
                    </div>
                `;
            }).join('');

        } catch (err) {
            console.error('Error loading leaderboard:', err);
            content.innerHTML = `
                <div class="leaderboard-empty">
                    <p>❌ Kunne ikke laste resultattavle</p>
                </div>
            `;
        }
    }

    closeLeaderboard() {
        document.getElementById('leaderboardModal').classList.add('hidden');
    }

    resetChallenge() {
        this.sessionId = null;
        this.teamName = null;
        this.stopTimer();
        this.isScanning = false;

        // Stop scanner if running
        if (this.scanner && this.scanner.isScanning) {
            this.scanner.stop();
        }

        // Reset UI
        document.getElementById('teamHeader').classList.add('hidden');
        document.getElementById('progressSection').classList.add('hidden');
        document.getElementById('timerDisplay').classList.add('hidden');
        document.getElementById('scanFeedback').classList.add('hidden');

        this.showView('instructions');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.teamChallenge = new TeamChallengeManager();
});
