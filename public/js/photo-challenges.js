// Photo Challenges Page - Participant Interface
(function() {
    'use strict';

    // State
    let currentParticipant = null;
    let currentTeam = null;
    let challenges = [];
    let submissions = [];
    let scanner = null;
    let cameraStream = null;
    let currentChallenge = null;

    // DOM Elements
    const scannerView = document.getElementById('scannerView');
    const challengesView = document.getElementById('challengesView');
    const qrFileInput = document.getElementById('qrFileInput');
    const startScanBtn = document.getElementById('startScanBtn');
    const scanStatus = document.getElementById('scanStatus');

    const teamNameDisplay = document.getElementById('teamNameDisplay');
    const participantNameDisplay = document.getElementById('participantNameDisplay');
    const challengesGrid = document.getElementById('challengesGrid');
    const completedCount = document.getElementById('completedCount');
    const totalCount = document.getElementById('totalCount');
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');

    const cameraModal = document.getElementById('cameraModal');
    const cameraModalTitle = document.getElementById('cameraModalTitle');
    const closeCameraBtn = document.getElementById('closeCameraBtn');
    const cameraVideo = document.getElementById('cameraVideo');
    const cameraCanvas = document.getElementById('cameraCanvas');
    const captureBtn = document.getElementById('captureBtn');
    const retakeBtn = document.getElementById('retakeBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const cameraStatus = document.getElementById('cameraStatus');

    // Initialize
    function init() {
        setupEventListeners();

        // Initialize QR scanner
        scanner = new QRScanner();
        scanner.init('qr-reader',
            (code) => lookupParticipant(code),
            (error) => showStatus('error', error)
        );

        // Activate global barcode scanner
        globalBarcodeScanner.activate((qrData) => lookupParticipant(qrData));

        // Initialize login component (alternative login methods)
        initLoginComponent({
            onLoginSuccess: (participant) => {
                lookupParticipant(participant.participant_code, true);
            },
            altInputId: 'participantCodeInputAlt',
            altButtonId: 'codeLoginBtnAlt'
        });
    }

    // Event Listeners
    function setupEventListeners() {
        // Login word input
        const participantCodeInput = document.getElementById('participantCodeInput');
        const codeLoginBtn = document.getElementById('codeLoginBtn');
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

        // QR Code scanner
        startScanBtn.addEventListener('click', startQRScanner);
        qrFileInput.addEventListener('change', handleQRFileUpload);

        // Camera modal
        closeCameraBtn.addEventListener('click', closeCameraModal);
        captureBtn.addEventListener('click', capturePhoto);
        retakeBtn.addEventListener('click', retakePhoto);
        uploadBtn.addEventListener('click', uploadPhoto);
    }

    // QR Scanner
    async function startQRScanner() {
        await scanner.start();
        startScanBtn.textContent = '⏹️ Stopp Skanning';
        startScanBtn.onclick = stopQRScanner;
    }

    async function stopQRScanner() {
        await scanner.stop();
        startScanBtn.textContent = '📷 Start Kamera-Skanning';
        startScanBtn.onclick = startQRScanner;
    }

    async function handleQRFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            // Use the QRScanner's scanFile method (handles jsQR + fallback internally)
            await scanner.scanFile(file);
            // Clear file input so same file can be selected again
            e.target.value = '';
            // Clear the qr-reader div to remove displayed image
            document.getElementById('qr-reader').innerHTML = '';
        } catch (err) {
            showStatus('error', 'Kunne ikke lese QR-kode fra bildet. Prøv igjen.');
            console.error('QR File scan error:', err);
            // Clear file input
            e.target.value = '';
            // Clear the qr-reader div
            document.getElementById('qr-reader').innerHTML = '';
        }
    }

    // Handle login with code/login word
    async function handleLoginWithCode() {
        const participantCodeInput = document.getElementById('participantCodeInput');
        const codeLoginBtn = document.getElementById('codeLoginBtn');

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

        codeLoginBtn.disabled = true;
        codeLoginBtn.textContent = '⏳';
        showCodeStatus('Logger inn...', 'info');

        try {
            const participant = await participantAuth.loginWithCode(code);

            if (participant) {
                console.log('Login successful:', participant.first_name);
                await lookupParticipant(participant.participant_code, true); // true = skip decode (already clean)
                participantCodeInput.value = '';
                codeLoginBtn.disabled = false;
                codeLoginBtn.textContent = '➡️';
            }
        } catch (error) {
            console.error('Login error:', error);
            showCodeStatus(error.message || 'Feil ved innlogging', 'error');
            codeLoginBtn.disabled = false;
            codeLoginBtn.textContent = '➡️';
        }
    }

    function showCodeStatus(message, type) {
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

    // Lookup Participant
    async function lookupParticipant(qrData, skipDecode = false) {
        showStatus('info', 'Søker etter deltaker...');

        // Decode barcode input (fixes Norwegian keyboard layout issues) - skip if already decoded (from login)
        const decodedData = skipDecode ? qrData : GlobalBarcodeScanner.decodeBarcodeInput(qrData);

        // Parse QR code - try JSON first
        let participantCode;
        try {
            const parsed = JSON.parse(decodedData);
            if (parsed.type === 'participant' && parsed.code) {
                participantCode = parsed.code;
            } else {
                throw new Error('Invalid QR format');
            }
        } catch (e) {
            // Not JSON, use as-is
            participantCode = decodedData;
        }

        try {
            const response = await fetch(`/api/participants/${participantCode}`);

            if (!response.ok) {
                if (response.status === 404) {
                    showStatus('error', 'Ukjent deltakerkode. Prøv igjen.');
                } else {
                    showStatus('error', 'Feil ved oppslag. Prøv igjen.');
                }
                return;
            }

            const participant = await response.json();
            currentParticipant = participant;

            // Check if participant has a team
            if (!participant.team) {
                showStatus('error', 'Du må være tildelt et lag for å delta i bildeoppgaver.');
                return;
            }

            currentTeam = participant.team;
            showStatus('success', `Velkommen, ${participant.first_name}!`);

            setTimeout(() => {
                loadChallenges();
            }, 1000);

        } catch (error) {
            console.error('Error looking up participant:', error);
            showStatus('error', 'Nettverksfeil. Sjekk tilkoblingen og prøv igjen.');
        }
    }

    // Load Challenges
    async function loadChallenges() {
        try {
            // Load active challenges
            const challengesResponse = await fetch('/api/photo-challenges');
            challenges = await challengesResponse.json();

            // Load team submissions
            const submissionsResponse = await fetch(`/api/photo-challenges/submissions/team/${currentTeam}`);
            submissions = await submissionsResponse.json();

            // Show challenges view
            showChallengesView();
            renderChallenges();

        } catch (error) {
            console.error('Error loading challenges:', error);
            showStatus('error', 'Kunne ikke laste oppgaver. Prøv igjen.');
        }
    }

    // Show Challenges View
    function showChallengesView() {
        // Deactivate global barcode scanner (moving to challenges view)
        globalBarcodeScanner.deactivate();

        scannerView.classList.add('hidden');
        challengesView.classList.remove('hidden');

        teamNameDisplay.textContent = currentTeam;
        participantNameDisplay.textContent = `${currentParticipant.first_name} ${currentParticipant.last_name}`;
    }

    // Render Challenges
    function renderChallenges() {
        if (challenges.length === 0) {
            challengesGrid.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--text-light);">
                    <h2 style="font-size: 48px; margin-bottom: 15px;">📸</h2>
                    <p style="font-size: 20px;">Ingen aktive bildeoppgaver for øyeblikket.</p>
                </div>
            `;
            return;
        }

        const completedChallenges = submissions.length;
        const totalChallenges = challenges.length;
        const percentage = totalChallenges > 0 ? Math.round((completedChallenges / totalChallenges) * 100) : 0;

        completedCount.textContent = completedChallenges;
        totalCount.textContent = totalChallenges;
        progressFill.style.width = percentage + '%';
        progressPercent.textContent = percentage + '%';

        challengesGrid.innerHTML = challenges.map(challenge => {
            const submission = submissions.find(s => s.challenge_id === challenge.id);
            const isCompleted = !!submission;
            const status = submission ? submission.status : null;

            let statusBadge = '';
            let cardClass = '';
            let actionButton = '';
            let thumbnailHTML = '';

            if (isCompleted) {
                // Show thumbnail of submitted image
                if (submission.image_path) {
                    thumbnailHTML = `
                        <div class="submission-thumbnail">
                            <img src="${submission.image_path}" alt="Innsendt bilde"
                                 onclick="window.photoChallengesApp.viewImage('${submission.image_path}')">
                        </div>
                    `;
                }

                // Check if submission has been reviewed (by checking if reviewed_at exists or points_awarded is set)
                const hasBeenReviewed = submission.reviewed_at !== null || submission.points_awarded !== null;

                if (hasBeenReviewed) {
                    // Image has been reviewed - show evaluation
                    const pointsAwarded = submission.points_awarded !== null ? submission.points_awarded : 0;
                    // Consider rejected if status is 'rejected' OR points are 0
                    const isApproved = submission.status !== 'rejected' && pointsAwarded > 0;

                    cardClass = isApproved ? 'completed' : 'rejected';
                    statusBadge = isApproved
                        ? `<div class="challenge-status-badge completed">✓ Godkjent</div>`
                        : `<div class="challenge-status-badge rejected">✗ Avvist</div>`;

                    // Show review details
                    thumbnailHTML += `
                        <div class="review-details">
                            <div class="review-points ${isApproved ? 'positive' : 'zero'}">
                                <span class="points-icon">${isApproved ? '🏆' : '⭕'}</span>
                                <span class="points-value">${pointsAwarded} poeng</span>
                            </div>
                            ${submission.admin_comment ? `
                                <div class="review-comment">
                                    <div class="comment-label">Tilbakemelding:</div>
                                    <div class="comment-text">${submission.admin_comment}</div>
                                </div>
                            ` : ''}
                        </div>
                    `;

                    // If not approved, allow resubmission
                    if (isApproved) {
                        actionButton = '<button class="secondary" disabled>Fullført</button>';
                    } else {
                        actionButton = `<button class="primary" onclick="window.photoChallengesApp.openCamera(${challenge.id})">🔄 Send inn på nytt</button>`;
                    }
                } else {
                    // Image submitted but not reviewed yet - allow replacement
                    cardClass = 'in-review';
                    statusBadge = `<div class="challenge-status-badge in-review">⏳ Sendt inn</div>`;
                    actionButton = `<button class="secondary" onclick="window.photoChallengesApp.openCamera(${challenge.id})">🔄 Bytt bilde</button>`;
                }
            } else {
                actionButton = `<button class="primary" onclick="window.photoChallengesApp.openCamera(${challenge.id})">📸 Ta bilde</button>`;
            }

            return `
                <div class="challenge-card ${cardClass}">
                    <div class="challenge-header">
                        <div class="challenge-icon">${challenge.icon || '📸'}</div>
                        <div class="challenge-title-section">
                            <h3 class="challenge-title">${challenge.title}</h3>
                            <div class="challenge-points">🏆 ${challenge.points} poeng</div>
                        </div>
                        ${statusBadge}
                    </div>
                    ${challenge.description ? `<div class="challenge-description">${challenge.description}</div>` : ''}
                    ${thumbnailHTML}
                    <div class="challenge-action">
                        ${actionButton}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Camera Modal
    function openCamera(challengeId) {
        currentChallenge = challenges.find(c => c.id === challengeId);
        if (!currentChallenge) return;

        cameraModalTitle.textContent = currentChallenge.title;
        cameraModal.classList.remove('hidden');

        // Start camera
        startCamera();
    }

    async function startCamera() {
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            cameraVideo.srcObject = cameraStream;
            cameraVideo.classList.remove('hidden');
            cameraCanvas.classList.add('hidden');
            captureBtn.classList.remove('hidden');
            retakeBtn.classList.add('hidden');
            uploadBtn.classList.add('hidden');
            cameraStatus.classList.add('hidden');
        } catch (error) {
            console.error('Camera error:', error);
            showCameraStatus('error', 'Kunne ikke starte kamera. Sjekk tillatelser.');
        }
    }

    function capturePhoto() {
        const video = cameraVideo;
        const canvas = cameraCanvas;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        // Stop video stream
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }

        // Show canvas, hide video
        cameraVideo.classList.add('hidden');
        cameraCanvas.classList.remove('hidden');
        captureBtn.classList.add('hidden');
        retakeBtn.classList.remove('hidden');
        uploadBtn.classList.remove('hidden');
    }

    function retakePhoto() {
        cameraCanvas.classList.add('hidden');
        startCamera();
    }

    async function uploadPhoto() {
        const canvas = cameraCanvas;

        uploadBtn.disabled = true;
        uploadBtn.textContent = '⏳ Laster opp...';
        showCameraStatus('info', 'Laster opp bilde...');

        try {
            // Convert canvas to blob
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));

            // Create form data
            const formData = new FormData();
            formData.append('photo', blob, 'photo.jpg');
            formData.append('challengeId', currentChallenge.id);
            formData.append('teamName', currentTeam);
            formData.append('participantCode', currentParticipant.participant_code);

            // Upload
            const response = await fetch('/api/photo-challenges/submit', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }

            showCameraStatus('success', 'Bilde lastet opp!');

            setTimeout(() => {
                closeCameraModal();
                loadChallenges(); // Refresh challenges
            }, 1500);

        } catch (error) {
            console.error('Upload error:', error);
            showCameraStatus('error', error.message || 'Kunne ikke laste opp bilde. Prøv igjen.');
            uploadBtn.disabled = false;
            uploadBtn.textContent = '✅ Last Opp Bilde';
        }
    }

    function closeCameraModal() {
        // Stop camera if running
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }

        cameraModal.classList.add('hidden');
        cameraVideo.classList.remove('hidden');
        cameraCanvas.classList.add('hidden');
        captureBtn.classList.remove('hidden');
        retakeBtn.classList.add('hidden');
        uploadBtn.classList.add('hidden');
        uploadBtn.disabled = false;
        uploadBtn.textContent = '✅ Last Opp Bilde';
        cameraStatus.classList.add('hidden');
        currentChallenge = null;
    }

    // Status Messages
    function showStatus(type, message) {
        scanStatus.className = 'scan-status ' + type;
        scanStatus.textContent = message;
        scanStatus.classList.remove('hidden');
    }

    function showCameraStatus(type, message) {
        cameraStatus.className = 'camera-status ' + type;
        cameraStatus.textContent = message;
        cameraStatus.classList.remove('hidden');
    }

    // View Image in modal/new tab
    function viewImage(imagePath) {
        window.open(imagePath, '_blank');
    }

    // Export functions for global access
    window.photoChallengesApp = {
        openCamera,
        viewImage
    };

    // Initialize on load
    document.addEventListener('DOMContentLoaded', init);
})();
