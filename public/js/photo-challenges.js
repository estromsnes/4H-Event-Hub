// Photo Challenges Page - Participant Interface
(function() {
    'use strict';

    // State
    let currentParticipant = null;
    let currentTeam = null;
    let challenges = [];
    let submissions = [];
    let html5QrCode = null;
    let cameraStream = null;
    let currentChallenge = null;

    // DOM Elements
    const scannerView = document.getElementById('scannerView');
    const challengesView = document.getElementById('challengesView');
    const barcodeInput = document.getElementById('barcodeInput');
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
        barcodeInput.focus();
    }

    // Event Listeners
    function setupEventListeners() {
        // Barcode scanner input
        barcodeInput.addEventListener('keypress', handleBarcodeInput);

        // QR Code scanner
        startScanBtn.addEventListener('click', startQRScanner);
        qrFileInput.addEventListener('change', handleQRFileUpload);

        // Camera modal
        closeCameraBtn.addEventListener('click', closeCameraModal);
        captureBtn.addEventListener('click', capturePhoto);
        retakeBtn.addEventListener('click', retakePhoto);
        uploadBtn.addEventListener('click', uploadPhoto);
    }

    // Barcode Input Handler
    function handleBarcodeInput(e) {
        if (e.key === 'Enter') {
            const code = barcodeInput.value.trim();
            if (code) {
                lookupParticipant(code);
            }
        }
    }

    // QR Scanner
    function startQRScanner() {
        const qrReader = document.getElementById('qr-reader');
        qrReader.innerHTML = '';

        if (!html5QrCode) {
            html5QrCode = new Html5Qrcode("qr-reader");
        }

        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 }
        };

        html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
                html5QrCode.stop();
                lookupParticipant(decodedText);
            },
            (errorMessage) => {
                // Ignore errors (scanning in progress)
            }
        ).catch(err => {
            showStatus('error', 'Kunne ikke starte kamera. Prøv å laste opp et bilde i stedet.');
            console.error('QR Scanner error:', err);
        });

        startScanBtn.textContent = '⏹️ Stopp Skanning';
        startScanBtn.onclick = stopQRScanner;
    }

    function stopQRScanner() {
        if (html5QrCode) {
            html5QrCode.stop();
            startScanBtn.textContent = '📷 Start Kamera-Skanning';
            startScanBtn.onclick = startQRScanner;
        }
    }

    function handleQRFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!html5QrCode) {
            html5QrCode = new Html5Qrcode("qr-reader");
        }

        html5QrCode.scanFile(file, true)
            .then(decodedText => {
                lookupParticipant(decodedText);
            })
            .catch(err => {
                showStatus('error', 'Kunne ikke lese QR-kode fra bildet. Prøv igjen.');
                console.error('QR File scan error:', err);
            });
    }

    // Lookup Participant
    async function lookupParticipant(code) {
        showStatus('info', 'Søker etter deltaker...');

        try {
            const response = await fetch(`/api/participants/code/${code}`);

            if (!response.ok) {
                if (response.status === 404) {
                    showStatus('error', 'Ukjent deltakerkode. Prøv igjen.');
                } else {
                    showStatus('error', 'Feil ved oppslag. Prøv igjen.');
                }
                barcodeInput.value = '';
                return;
            }

            const participant = await response.json();
            currentParticipant = participant;

            // Check if participant has a team
            if (!participant.team_name) {
                showStatus('error', 'Du må være tildelt et lag for å delta i bildeoppgaver.');
                barcodeInput.value = '';
                return;
            }

            currentTeam = participant.team_name;
            showStatus('success', `Velkommen, ${participant.first_name}!`);

            setTimeout(() => {
                loadChallenges();
            }, 1000);

        } catch (error) {
            console.error('Error looking up participant:', error);
            showStatus('error', 'Nettverksfeil. Sjekk tilkoblingen og prøv igjen.');
            barcodeInput.value = '';
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

            if (isCompleted) {
                if (status === 'pending' || status === 'reviewed') {
                    cardClass = 'in-review';
                    statusBadge = `<div class="challenge-status-badge in-review">⏳ Sendt inn</div>`;
                    actionButton = '<button class="secondary" disabled>Allerede sendt inn</button>';
                } else {
                    cardClass = 'completed';
                    statusBadge = `<div class="challenge-status-badge completed">✓ Fullført</div>`;
                    actionButton = '<button class="secondary" disabled>Fullført</button>';
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

    // Export functions for global access
    window.photoChallengesApp = {
        openCamera
    };

    // Initialize on load
    document.addEventListener('DOMContentLoaded', init);
})();
