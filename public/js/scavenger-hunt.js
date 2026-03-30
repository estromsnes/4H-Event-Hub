// Scavenger Hunt Client Logic

class ScavengerHunt {
    constructor() {
        this.participantScanner = new QRScanner();
        this.checkpointScanner = new QRScanner();
        this.session = null;
        this.teams = [];
        this.checkpoints = [];
        this.scans = [];
        this.currentTeam = null;
        this.isParticipantScannerActive = false;

        this.initElements();
        this.initScanners();
        this.init();
    }

    initElements() {
        // Views
        this.loadingView = document.getElementById('loadingView');
        this.participantScanView = document.getElementById('participantScanView');
        this.huntView = document.getElementById('huntView');
        this.completionView = document.getElementById('completionView');

        // Participant scan
        this.participantBarcodeInput = document.getElementById('participantBarcodeInput');
        this.participantQrReader = document.getElementById('participantQrReader');
        this.startParticipantScanBtn = document.getElementById('startParticipantScanBtn');
        this.participantQrFileInput = document.getElementById('participantQrFileInput');
        this.participantScanFeedback = document.getElementById('participantScanFeedback');

        // Hunt view
        this.huntTeamName = document.getElementById('huntTeamName');
        this.huntProgress = document.getElementById('huntProgress');
        this.progressFill = document.getElementById('progressFill');
        this.currentClue = document.getElementById('currentClue');
        this.barcodeInput = document.getElementById('barcodeInput');
        this.checkpointQrReader = document.getElementById('checkpointQrReader');
        this.startCheckpointScanBtn = document.getElementById('startCheckpointScanBtn');
        this.checkpointQrFileInput = document.getElementById('checkpointQrFileInput');
        this.scanFeedback = document.getElementById('scanFeedback');
        this.foundCheckpoints = document.getElementById('foundCheckpoints');
        this.foundList = document.getElementById('foundList');
        this.quitBtn = document.getElementById('quitBtn');
        this.isCheckpointScannerActive = false;

        // Completion view
        this.completionTeamName = document.getElementById('completionTeamName');
        this.completionTime = document.getElementById('completionTime');
        this.newHuntBtn = document.getElementById('newHuntBtn');

        // Event listeners
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

        this.startParticipantScanBtn.addEventListener('click', () => this.toggleParticipantScanner());
        this.participantQrFileInput.addEventListener('change', (e) => this.handleParticipantFileUpload(e));

        this.startCheckpointScanBtn.addEventListener('click', () => this.toggleCheckpointScanner());
        this.checkpointQrFileInput.addEventListener('change', (e) => this.handleCheckpointFileUpload(e));

        this.quitBtn.addEventListener('click', () => this.quitHunt());
        this.newHuntBtn.addEventListener('click', () => this.reset());
    }

    async handleParticipantFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.showParticipantScanFeedback('Leser QR-kode fra bilde...', 'info');

        try {
            await this.participantScanner.scanFile(file);
            // Clear the qr-reader div to remove displayed image
            document.getElementById('participantQrReader').innerHTML = '';
        } catch (err) {
            console.error('Error scanning file:', err);
            this.showParticipantScanFeedback('Kunne ikke lese QR-kode fra bilde', 'error');
            // Clear the qr-reader div
            document.getElementById('participantQrReader').innerHTML = '';
        }

        // Reset file input so same file can be selected again
        event.target.value = '';
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

    initScanners() {
        // Participant scanner
        this.participantScanner.init('participantQrReader',
            (data) => this.handleParticipantScan(data),
            (error) => {
                console.error('Participant scan error:', error);
                this.showParticipantScanFeedback(error, 'error');
            }
        );

        // Checkpoint scanner
        this.checkpointScanner.init('checkpointQrReader',
            (data) => this.handleScan(data),
            (error) => {
                console.error('Checkpoint scan error:', error);
                this.showScanFeedback(error, 'error');
            }
        );
    }

    async handleCheckpointFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.showScanFeedback('Leser QR-kode fra bilde...', 'info');

        try {
            await this.checkpointScanner.scanFile(file);
            // Clear the qr-reader div to remove displayed image
            document.getElementById('checkpointQrReader').innerHTML = '';
        } catch (err) {
            console.error('Error scanning file:', err);
            this.showScanFeedback('Kunne ikke lese QR-kode fra bilde', 'error');
            // Clear the qr-reader div
            document.getElementById('checkpointQrReader').innerHTML = '';
        }

        // Reset file input so same file can be selected again
        event.target.value = '';
    }

    async toggleCheckpointScanner() {
        if (this.isCheckpointScannerActive) {
            // Stop scanner
            await this.checkpointScanner.stop();
            this.isCheckpointScannerActive = false;
            this.startCheckpointScanBtn.textContent = '📷 Start Kamera-Skanning';
            this.startCheckpointScanBtn.classList.remove('secondary');
            this.startCheckpointScanBtn.classList.add('primary');
        } else {
            // Start scanner
            await this.checkpointScanner.start();
            this.isCheckpointScannerActive = true;
            this.startCheckpointScanBtn.textContent = '⏹️ Stopp Kamera';
            this.startCheckpointScanBtn.classList.remove('primary');
            this.startCheckpointScanBtn.classList.add('secondary');
        }
    }

    async toggleParticipantScanner() {
        if (this.isParticipantScannerActive) {
            // Stop scanner
            await this.participantScanner.stop();
            this.isParticipantScannerActive = false;
            this.startParticipantScanBtn.textContent = '📷 Start Kamera-Skanning';
            this.startParticipantScanBtn.classList.remove('secondary');
            this.startParticipantScanBtn.classList.add('primary');
        } else {
            // Start scanner
            await this.participantScanner.start();
            this.isParticipantScannerActive = true;
            this.startParticipantScanBtn.textContent = '⏹️ Stopp Kamera';
            this.startParticipantScanBtn.classList.remove('primary');
            this.startParticipantScanBtn.classList.add('secondary');
        }
    }

    async init() {
        try {
            await this.loadCheckpoints();

            this.hideView(this.loadingView);
            this.showView(this.participantScanView);

            // Activate global barcode scanner for participant scanning
            globalBarcodeScanner.activate((qrData) => this.handleParticipantScan(qrData));
        } catch (err) {
            console.error('Initialization error:', err);
            alert('Kunne ikke laste data. Prøv igjen.');
        }
    }

    async loadCheckpoints() {
        const response = await fetch('/api/scavenger/checkpoints');
        if (!response.ok) {
            throw new Error('Failed to load checkpoints');
        }

        this.checkpoints = await response.json();
    }


    async handleParticipantScan(qrData, skipDecode = false) {
        // Decode potential keyboard layout issues - skip if already decoded (from login)
        const decodedData = skipDecode ? qrData : GlobalBarcodeScanner.decodeBarcodeInput(qrData);
        let participantCode;

        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(decodedData);
            if (parsed.type === 'participant' && parsed.code) {
                participantCode = parsed.code;
            } else {
                participantCode = decodedData;
            }
        } catch (e) {
            // Not JSON, use as-is
            participantCode = decodedData;
        }

        // Trim whitespace
        participantCode = participantCode?.trim();

        // Basic validation - just check if we have something
        if (!participantCode) {
            this.showParticipantScanFeedback('Ugyldig deltaker-QR. Skann din deltaker-QR kode.', 'error');
            return;
        }

        try {
            // Look up participant to get their team
            const response = await fetch(`/api/participants/${participantCode}`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Deltaker ikke funnet');
                }
                throw new Error('Kunne ikke hente deltaker-info');
            }

            const participant = await response.json();

            // Check if participant has a team
            if (!participant.team || participant.team === '') {
                this.showParticipantScanFeedback('Du må være tildelt et lag for å delta i skattejakt.', 'error');
                return;
            }

            // Success! Set team and start hunt
            this.currentTeam = participant.team;
            this.currentParticipant = participant;

            this.showParticipantScanFeedback(`Velkommen ${participant.first_name}! Starter skattejakt for ${participant.team}...`, 'success');

            setTimeout(() => {
                this.startHunt();
            }, 1500);

        } catch (err) {
            console.error('Error looking up participant:', err);
            this.showParticipantScanFeedback(err.message, 'error');
        }
    }

    showParticipantScanFeedback(message, type) {
        this.participantScanFeedback.textContent = message;
        this.participantScanFeedback.className = `scan-status ${type}`;
        this.participantScanFeedback.classList.remove('hidden');

        setTimeout(() => {
            if (type === 'error') {
                this.participantScanFeedback.classList.add('hidden');
            }
        }, 3000);
    }

    async startHunt() {
        try {
            // Stop participant scanner if active
            if (this.isParticipantScannerActive) {
                await this.participantScanner.stop();
                this.isParticipantScannerActive = false;
            }

            // Deactivate participant scanner and activate checkpoint scanner
            globalBarcodeScanner.deactivate();

            const response = await fetch('/api/scavenger/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ team_name: this.currentTeam })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to start hunt');
            }

            const data = await response.json();
            this.session = data.session;
            this.scans = data.scans || [];

            // Check if already completed
            if (this.session.status === 'completed') {
                this.showCompletion();
                return;
            }

            this.hideView(this.participantScanView);
            this.showView(this.huntView);
            this.updateHuntView();

            // Activate global barcode scanner for checkpoint scanning
            globalBarcodeScanner.activate((qrData) => this.handleScan(qrData));

        } catch (err) {
            console.error('Error starting hunt:', err);
            alert('Kunne ikke starte skattejakt: ' + err.message);
        }
    }

    updateHuntView() {
        const totalCheckpoints = this.checkpoints.length;
        const foundCount = this.scans.length;
        const progress = totalCheckpoints > 0 ? (foundCount / totalCheckpoints) * 100 : 0;

        this.huntTeamName.textContent = this.currentTeam;
        this.huntProgress.textContent = `${foundCount} / ${totalCheckpoints} sjekkpunkter funnet`;
        this.progressFill.style.width = `${progress}%`;

        // Show next clue
        const nextCheckpoint = this.getNextCheckpoint();
        if (nextCheckpoint) {
            this.currentClue.textContent = nextCheckpoint.clue;
        } else {
            this.currentClue.textContent = 'Alle sjekkpunkter funnet!';
        }

        // Show found checkpoints
        if (this.scans.length > 0) {
            this.foundCheckpoints.classList.remove('hidden');
            this.foundList.innerHTML = this.scans.map(scan => `
                <div class="checkpoint-item">
                    <span class="checkpoint-check">✅</span>
                    <div>
                        <strong>${scan.name}</strong>
                        <div style="font-size: 14px; color: var(--text-light);">
                            Funnet ${new Date(scan.scanned_at).toLocaleTimeString('nb-NO')}
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    getNextCheckpoint() {
        const scannedIds = new Set(this.scans.map(s => s.checkpoint_id));
        return this.checkpoints.find(c => !scannedIds.has(c.id) && c.active);
    }

    async handleScan(qrData) {
        // Decode potential keyboard layout issues
        const decodedData = GlobalBarcodeScanner.decodeBarcodeInput(qrData);
        let qrCode;

        try {
            // Try to parse as JSON first (from scanner.js format)
            const parsed = JSON.parse(decodedData);
            if (parsed.type === 'checkpoint' || parsed.code) {
                qrCode = parsed.code;
            }
        } catch (e) {
            // Not JSON, use as-is
            qrCode = decodedData;
        }

        // Check if this is a checkpoint QR code
        if (!qrCode || !qrCode.startsWith('CHECKPOINT-')) {
            this.showScanFeedback('Dette er ikke en sjekkpunkt QR-kode!', 'error');
            return;
        }

        try {
            const response = await fetch('/api/scavenger/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: this.session.id,
                    qr_code: qrCode
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to scan');
            }

            // Update scans
            this.scans = data.scans;

            // Update session with elapsed_seconds if completed
            if (data.completed && data.elapsed_seconds) {
                this.session.elapsed_seconds = data.elapsed_seconds;
                this.session.status = 'completed';
            }

            // Show success feedback
            this.showScanFeedback(`✅ ${data.checkpoint.name} funnet!`, 'success');

            // Check if completed
            if (data.completed) {
                setTimeout(() => {
                    this.showCompletion();
                }, 1500);
            } else {
                // Update view with new progress
                setTimeout(() => {
                    this.updateHuntView();
                }, 1000);
            }

        } catch (err) {
            console.error('Scan error:', err);
            this.showScanFeedback(err.message, 'error');
        }
    }

    showScanFeedback(message, type) {
        this.scanFeedback.textContent = message;
        this.scanFeedback.className = `scan-status ${type}`;
        this.scanFeedback.classList.remove('hidden');

        setTimeout(() => {
            this.scanFeedback.classList.add('hidden');
        }, 3000);
    }

    async showCompletion() {
        // Deactivate global barcode scanner
        globalBarcodeScanner.deactivate();

        // Stop checkpoint scanner if active
        if (this.isCheckpointScannerActive) {
            await this.checkpointScanner.stop();
            this.isCheckpointScannerActive = false;
        }

        // Stop participant scanner if active
        if (this.isParticipantScannerActive) {
            await this.participantScanner.stop();
            this.isParticipantScannerActive = false;
        }

        this.hideView(this.huntView);
        this.hideView(this.participantScanView);
        this.showView(this.completionView);

        this.completionTeamName.textContent = this.currentTeam;

        if (this.session.elapsed_seconds) {
            const mins = Math.floor(this.session.elapsed_seconds / 60);
            const secs = Math.floor(this.session.elapsed_seconds % 60);
            this.completionTime.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        // Confetti effect
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }

    async showLeaderboard() {
        try {
            const response = await fetch('/api/scavenger/leaderboard');
            if (!response.ok) {
                throw new Error('Failed to load leaderboard');
            }

            const data = await response.json();
            this.renderLeaderboard(data);
            this.leaderboardModal.classList.remove('hidden');

        } catch (err) {
            console.error('Error loading leaderboard:', err);
            alert('Kunne ikke laste resultattavle');
        }
    }

    renderLeaderboard(data) {
        if (!data.leaderboard || data.leaderboard.length === 0) {
            this.leaderboardContent.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-light);">Ingen resultater ennå</p>';
            return;
        }

        this.leaderboardContent.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${data.leaderboard.map((entry) => {
                    const rankEmoji = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;
                    const isCurrentTeam = entry.team_name === this.currentTeam;

                    return `
                        <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: ${isCurrentTeam ? '#e8f5e9' : 'white'}; border-radius: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); ${isCurrentTeam ? 'border: 2px solid #4CAF50;' : ''}">
                            <div style="font-size: 32px; min-width: 50px; text-align: center;">
                                ${rankEmoji}
                            </div>
                            <div style="flex: 1;">
                                <div style="font-size: 20px; font-weight: bold; ${isCurrentTeam ? 'color: #2c5f2d;' : ''}">${entry.team_name}</div>
                                <div style="font-size: 16px; color: var(--text-light);">
                                    ⏱️ ${this.formatTime(entry.elapsed_seconds)}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    closeLeaderboard() {
        this.leaderboardModal.classList.add('hidden');
    }

    quitHunt() {
        if (confirm('Er du sikker på at du vil avbryte skattejakt?')) {
            this.reset();
        }
    }

    async reset() {
        // Stop participant scanner if active
        if (this.isParticipantScannerActive) {
            await this.participantScanner.stop();
            this.isParticipantScannerActive = false;
        }
        // Always reset participant scanner button state
        this.startParticipantScanBtn.textContent = '📷 Start Kamera-Skanning';
        this.startParticipantScanBtn.classList.remove('secondary');
        this.startParticipantScanBtn.classList.add('primary');

        // Stop checkpoint scanner if active
        if (this.isCheckpointScannerActive) {
            await this.checkpointScanner.stop();
            this.isCheckpointScannerActive = false;
        }
        // Always reset checkpoint scanner button state
        this.startCheckpointScanBtn.textContent = '📷 Start Kamera-Skanning';
        this.startCheckpointScanBtn.classList.remove('secondary');
        this.startCheckpointScanBtn.classList.add('primary');

        this.session = null;
        this.scans = [];
        this.currentTeam = null;
        this.currentParticipant = null;

        this.hideView(this.huntView);
        this.hideView(this.completionView);
        this.showView(this.participantScanView);

        this.participantScanFeedback.classList.add('hidden');
        this.scanFeedback.classList.add('hidden');
        this.foundCheckpoints.classList.add('hidden');

        // Activate global barcode scanner for participant scanning
        globalBarcodeScanner.activate((qrData) => this.handleParticipantScan(qrData));
    }

    showView(element) {
        element.classList.remove('hidden');
    }

    hideView(element) {
        element.classList.add('hidden');
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// Initialize when DOM is loaded
let scavengerHunt;
document.addEventListener('DOMContentLoaded', () => {
    scavengerHunt = new ScavengerHunt();

    // Initialize login component (alternative login methods)
    initLoginComponent({
        onLoginSuccess: (participant) => {
            scavengerHunt.handleParticipantScan(participant.participant_code, true);
        },
        altInputId: 'participantCodeInputAlt',
        altButtonId: 'codeLoginBtnAlt'
    });
});
