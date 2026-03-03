// Profile Page Main Logic
// Coordinates scanner and camera modules

// State
let currentParticipant = null;
let scanner = null;
let camera = null;
let isScanning = false;

// DOM Elements
const scannerView = document.getElementById('scannerView');
const profileView = document.getElementById('profileView');
const startScanBtn = document.getElementById('startScanBtn');
const qrFileInput = document.getElementById('qrFileInput');
const scanStatus = document.getElementById('scanStatus');
const scanAgainBtn = document.getElementById('scanAgainBtn');

const profilePhoto = document.getElementById('profilePhoto');
const photoPlaceholder = document.getElementById('photoPlaceholder');
const profileName = document.getElementById('profileName');
const profileAge = document.getElementById('profileAge');
const profileClub = document.getElementById('profileClub');
const profileRole = document.getElementById('profileRole');
const profileTeam = document.getElementById('profileTeam');
const profileTeamRow = document.getElementById('profileTeamRow');
const profileRoom = document.getElementById('profileRoom');
const profileRoomRow = document.getElementById('profileRoomRow');
const changeRoomBtn = document.getElementById('changeRoomBtn');
const roomSelectionSection = document.getElementById('roomSelectionSection');
const roomSelectionList = document.getElementById('roomSelectionList');
const roomSelectionStatus = document.getElementById('roomSelectionStatus');

let availableRooms = [];
let selectedRoomId = null;

const takeSelfieBtn = document.getElementById('takeSelfieBtn');
const cameraModal = document.getElementById('cameraModal');
const closeCameraBtn = document.getElementById('closeCameraBtn');
const cameraVideo = document.getElementById('cameraVideo');
const cameraCanvas = document.getElementById('cameraCanvas');
const captureBtn = document.getElementById('captureBtn');
const retakeBtn = document.getElementById('retakeBtn');
const uploadBtn = document.getElementById('uploadBtn');
const cameraStatus = document.getElementById('cameraStatus');

const confirmBtn = document.getElementById('confirmBtn');
const confirmationSection = document.getElementById('confirmationSection');
const confirmedStatus = document.getElementById('confirmedStatus');

const welcomeModal = document.getElementById('welcomeModal');
const welcomeCloseBtn = document.getElementById('welcomeCloseBtn');
const welcomeTitle = document.getElementById('welcomeTitle');
const statsActivities = document.getElementById('statsActivities');
const statsPoints = document.getElementById('statsPoints');

// Store event name for welcome modal
let currentEventName = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');

    // Check if Html5Qrcode is loaded
    if (typeof Html5Qrcode === 'undefined') {
        console.error('Html5Qrcode library not loaded!');
        showStatus('Kunne ikke laste QR-skanner bibliotek. Last siden på nytt.', 'error');
        return;
    }

    initApp();
});

function initApp() {
    console.log('Initializing app...');

    // Load event info first
    loadEventInfo();

    // Check if coming from welcome page with participant code
    const welcomeCode = sessionStorage.getItem('welcomeParticipantCode');
    const fromWelcome = sessionStorage.getItem('fromWelcome');

    if (welcomeCode && fromWelcome === 'true') {
        console.log('Loading participant from welcome page:', welcomeCode);
        // Clear the session storage
        sessionStorage.removeItem('welcomeParticipantCode');
        sessionStorage.removeItem('fromWelcome');
        // Load participant directly
        loadParticipantByCode(welcomeCode);
        return; // Skip scanner initialization
    }

    // Check browser support
    if (!QRScanner.isSupported()) {
        console.warn('Browser does not support camera access');
        showStatus('Din nettleser støtter ikke kamera-tilgang.', 'error');
        // Don't return - still set up event listeners for barcode scanner
    }

    // Initialize scanner only if supported
    if (QRScanner.isSupported()) {
        scanner = new QRScanner();
        scanner.init('qr-reader', onScanSuccess, onScanError);
        console.log('QR Scanner initialized');
    }

    // Initialize camera
    if (Camera.isSupported()) {
        camera = new Camera(cameraVideo, cameraCanvas);
        console.log('Camera initialized');
    }

    // Setup event listeners - always set these up
    startScanBtn.addEventListener('click', () => {
        console.log('Scan button clicked, isScanning:', isScanning);
        if (isScanning) {
            stopScanning();
        } else {
            startScanning();
        }
    });
    qrFileInput.addEventListener('change', handleQrFileUpload);
    scanAgainBtn.addEventListener('click', showScannerView);
    takeSelfieBtn.addEventListener('click', openCameraModal);
    closeCameraBtn.addEventListener('click', closeCameraModal);
    captureBtn.addEventListener('click', capturePhoto);
    retakeBtn.addEventListener('click', retakePhoto);
    uploadBtn.addEventListener('click', uploadPhoto);
    confirmBtn.addEventListener('click', confirmParticipant);
    welcomeCloseBtn.addEventListener('click', closeWelcomeModal);
    changeRoomBtn.addEventListener('click', toggleRoomSelection);

    // Activate global barcode scanner
    globalBarcodeScanner.activate((qrData) => onScanSuccess(qrData));

    console.log('App initialized successfully');
}

async function handleQrFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    showStatus('Leser QR-kode fra bilde...', 'info');

    try {
        await scanner.scanFile(file);
    } catch (err) {
        console.error('Error scanning file:', err);

        // Provide helpful error message
        const errorMsg = err.message || err.toString();
        if (errorMsg.includes('No MultiFormat Readers') || errorMsg.includes('not detect')) {
            showStatus('❌ Kunne ikke lese QR-kode. Tips: Sørg for at bildet er skarpt, QR-koden er godt belyst, og ta bildet rett forfra. Prøv kamera-skanning i stedet.', 'error');
        } else {
            showStatus('Kunne ikke lese QR-kode fra bilde. Prøv igjen eller bruk kamera-skanning.', 'error');
        }
    }

    // Reset file input so same file can be selected again
    event.target.value = '';
}

// Load event information
async function loadEventInfo() {
    try {
        const response = await fetch('/api/event');
        if (response.ok) {
            const event = await response.json();

            // Store event name for welcome modal
            if (event.event_name) {
                currentEventName = event.event_name;
            }

            // Update navbar title
            const navTitle = document.getElementById('navEventName');
            if (navTitle && event.event_name) {
                navTitle.textContent = event.event_name;
            }

            // Update browser tab title
            if (event.event_name) {
                document.title = `${event.event_name} - Min Profil`;
            }

            // Show event banner with dates/location (if banner elements exist)
            if (event.start_date || event.location) {
                const banner = document.getElementById('eventBanner');
                const bannerInfo = document.getElementById('bannerEventInfo');

                // Only update banner if elements exist
                if (banner && bannerInfo) {
                    let info = [];
                    if (event.start_date && event.end_date) {
                        info.push(formatDate(event.start_date) + ' - ' + formatDate(event.end_date));
                    } else if (event.start_date) {
                        info.push(formatDate(event.start_date));
                    }
                    if (event.location) {
                        info.push('📍 ' + event.location);
                    }

                    if (info.length > 0) {
                        bannerInfo.textContent = info.join(' • ');
                        banner.classList.remove('hidden');
                    }
                }
            }
        }
    } catch (err) {
        console.error('Error loading event info:', err);
    }
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'long' });
}


// Scanner functions
async function startScanning() {
    console.log('startScanning called');

    if (!scanner) {
        console.error('Scanner not initialized');
        showStatus('QR-skanner er ikke initialisert. Last siden på nytt.', 'error');
        return;
    }

    startScanBtn.textContent = '📷 Starter...';

    try {
        console.log('Starting scanner...');
        await scanner.start();
        isScanning = true;
        startScanBtn.textContent = '⏸️ Stopp Kamera';
        showStatus('Skanner etter QR-kode... (Klikk "Stopp Kamera" for å avslutte)', 'info');
        console.log('Scanner started successfully');
    } catch (err) {
        console.error('Scanner start error:', err);
        showStatus(err.message || 'Kunne ikke starte skanning', 'error');
        isScanning = false;
        startScanBtn.textContent = '📷 Start Kamera-Skanning';
    }
}

async function stopScanning() {
    console.log('stopScanning called');

    if (!scanner) {
        return;
    }

    try {
        await scanner.stop();
        isScanning = false;
        startScanBtn.textContent = '📷 Start Kamera-Skanning';
        showStatus('Skanning stoppet', 'info');
        setTimeout(() => {
            scanStatus.classList.add('hidden');
        }, 2000);
        console.log('Scanner stopped successfully');
    } catch (err) {
        console.error('Scanner stop error:', err);
        showStatus('Kunne ikke stoppe skanning', 'error');
    }
}

async function onScanSuccess(qrData) {
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
            showStatus(e.message, 'error');
            // Don't stop scanner, let user try again
            return;
        }
        // Not JSON, use as-is
        participantCode = decodedData;
    }

    // Stop scanner
    await scanner.stop();
    isScanning = false;
    startScanBtn.textContent = '📷 Start Kamera-Skanning';

    // Show loading status
    showStatus('Laster profil...', 'info');

    try {
        // Fetch participant data
        const response = await fetch(`/api/participants/${participantCode}`);

        if (!response.ok) {
            throw new Error('Deltaker ikke funnet');
        }

        currentParticipant = await response.json();
        showProfileView();
        showStatus('Profil lastet!', 'success');

        // Hide status after 2 seconds
        setTimeout(() => {
            scanStatus.classList.add('hidden');
        }, 2000);
    } catch (err) {
        console.error('Error loading participant:', err);
        showStatus(err.message || 'Kunne ikke laste profil', 'error');
        isScanning = false;
        startScanBtn.textContent = '📷 Prøv Igjen';
    }
}

function onScanError(errorMessage) {
    showStatus(errorMessage, 'error');
    isScanning = false;
    startScanBtn.textContent = '📷 Prøv Igjen';
}

// Load participant directly by code (used when coming from welcome page)
async function loadParticipantByCode(participantCode) {
    console.log('Loading participant by code:', participantCode);

    try {
        const response = await fetch(`/api/participants/${participantCode}`);

        if (!response.ok) {
            throw new Error('Deltaker ikke funnet');
        }

        currentParticipant = await response.json();

        // Change back button to go to welcome page
        const backBtn = document.querySelector('.back-btn');
        if (backBtn) {
            backBtn.href = '/welcome.html';
        }

        // Initialize camera after loading participant
        if (Camera.isSupported()) {
            camera = new Camera(cameraVideo, cameraCanvas);
            console.log('Camera initialized');
        }

        // Setup event listeners
        scanAgainBtn.addEventListener('click', () => {
            window.location.href = '/welcome.html';
        });
        takeSelfieBtn.addEventListener('click', openCameraModal);
        closeCameraBtn.addEventListener('click', closeCameraModal);
        captureBtn.addEventListener('click', capturePhoto);
        retakeBtn.addEventListener('click', retakePhoto);
        uploadBtn.addEventListener('click', uploadPhoto);
        confirmBtn.addEventListener('click', confirmParticipant);
        welcomeCloseBtn.addEventListener('click', closeWelcomeModal);
        changeRoomBtn.addEventListener('click', toggleRoomSelection);

        showProfileView();
        console.log('Participant loaded from welcome page');

    } catch (err) {
        console.error('Error loading participant:', err);
        alert('Kunne ikke laste deltakerprofil. Vennligst prøv igjen.');
        // Redirect back to welcome or show scanner
        window.location.href = '/welcome.html';
    }
}

function showStatus(message, type) {
    scanStatus.textContent = message;
    scanStatus.className = `scan-status ${type}`;
    scanStatus.classList.remove('hidden');
}

// View switching
function showScannerView() {
    profileView.classList.add('hidden');
    scannerView.classList.remove('hidden');
    currentParticipant = null;
    isScanning = false;
    startScanBtn.textContent = '📷 Start Kamera-Skanning';
    scanStatus.classList.add('hidden');

    // Stop scanner if running
    if (scanner) {
        scanner.stop().catch(err => console.error('Error stopping scanner:', err));
    }

    // Activate global barcode scanner
    globalBarcodeScanner.activate((qrData) => onScanSuccess(qrData));
}

function showProfileView() {
    if (!currentParticipant) return;

    // Update profile information
    profileName.textContent = `${currentParticipant.first_name} ${currentParticipant.last_name}`;
    profileAge.textContent = currentParticipant.age || '-';
    profileClub.textContent = currentParticipant.club || '-';
    profileRole.textContent = currentParticipant.role || '-';

    if (currentParticipant.team) {
        profileTeam.textContent = currentParticipant.team;
        profileTeamRow.classList.remove('hidden');
    } else {
        profileTeamRow.classList.add('hidden');
    }

    // Show room row
    profileRoomRow.classList.remove('hidden');

    // Load available rooms and update display
    loadAvailableRooms().then(() => {
        updateRoomDisplay();
    });

    // Update profile photo
    if (currentParticipant.profile_photo_path) {
        profilePhoto.src = currentParticipant.profile_photo_path + '?t=' + Date.now(); // Cache bust
        profilePhoto.classList.remove('hidden');
        photoPlaceholder.classList.add('hidden');
    } else {
        profilePhoto.classList.add('hidden');
        photoPlaceholder.classList.remove('hidden');
    }

    // Load and show team members if participant has a team
    if (currentParticipant.team) {
        loadTeamMembers(currentParticipant.team, currentParticipant.participant_code);
    } else {
        document.getElementById('teamMembersSection').classList.add('hidden');
    }

    // Load and show courses
    loadCourses(currentParticipant.participant_code);

    // Load participant stats
    loadParticipantStats();

    // Show confirmation section or confirmed status
    updateConfirmationUI();

    // Check and show welcome modal if first visit
    checkAndShowWelcomeModal();

    // Deactivate global barcode scanner
    globalBarcodeScanner.deactivate();

    // Switch views
    scannerView.classList.add('hidden');
    profileView.classList.remove('hidden');
}

// Update confirmation UI based on participant status
function updateConfirmationUI() {
    if (!currentParticipant) return;

    if (currentParticipant.confirmed === 1) {
        // Already confirmed - show status
        confirmationSection.classList.add('hidden');
        confirmedStatus.classList.remove('hidden');
    } else {
        // Not confirmed - show confirmation section
        confirmationSection.classList.remove('hidden');
        confirmedStatus.classList.add('hidden');
    }
}

// Confirm participant information
async function confirmParticipant() {
    if (!currentParticipant) return;

    confirmBtn.disabled = true;
    confirmBtn.textContent = '⏳ Bekrefter...';

    try {
        const response = await fetch(`/api/participants/${currentParticipant.participant_code}/confirm`, {
            method: 'POST'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Kunne ikke bekrefte deltaker');
        }

        const updatedParticipant = await response.json();
        currentParticipant = updatedParticipant;

        // Update UI
        confirmBtn.textContent = '✅ Bekreftet!';

        setTimeout(() => {
            updateConfirmationUI();
        }, 1000);

    } catch (err) {
        console.error('Error confirming participant:', err);
        alert('Kunne ikke bekrefte informasjon: ' + err.message);
        confirmBtn.disabled = false;
        confirmBtn.textContent = '✅ Bekreft informasjon';
    }
}

// Load and display team members
async function loadTeamMembers(teamName, currentParticipantCode) {
    const teamMembersSection = document.getElementById('teamMembersSection');
    const teamMembersList = document.getElementById('teamMembersList');
    const teamSectionTitle = document.getElementById('teamSectionTitle');

    try {
        // Fetch all participants
        const response = await fetch('/api/participants');
        if (!response.ok) {
            throw new Error('Failed to fetch participants');
        }

        const allParticipants = await response.json();

        // Filter to get team members
        const teamMembers = allParticipants.filter(p => p.team === teamName);

        if (teamMembers.length === 0) {
            teamMembersSection.classList.add('hidden');
            return;
        }

        // Sort: current user first, then alphabetically
        teamMembers.sort((a, b) => {
            if (a.participant_code === currentParticipantCode) return -1;
            if (b.participant_code === currentParticipantCode) return 1;
            return a.first_name.localeCompare(b.first_name);
        });

        // Render team members
        teamMembersList.innerHTML = teamMembers.map(member => {
            const isCurrentUser = member.participant_code === currentParticipantCode;
            const isNoShow = member.no_show === 1;
            const photoHtml = member.profile_photo_path
                ? `<img src="${member.profile_photo_path}" class="team-member-photo ${isNoShow ? 'no-show-photo' : ''}" alt="${member.first_name}">`
                : `<div class="team-member-photo-placeholder ${isNoShow ? 'no-show-photo' : ''}">👤</div>`;

            const details = [];
            if (member.age) details.push(`${member.age} år`);
            if (member.club) details.push(member.club);
            if (isNoShow) details.push('<span style="color: #dc3545; font-weight: 600;">Ikke møtt opp</span>');

            return `
                <div class="team-member-card ${isCurrentUser ? 'current-user' : ''} ${isNoShow ? 'no-show-member' : ''}">
                    ${photoHtml}
                    <div class="team-member-info">
                        <div class="team-member-name">
                            ${member.first_name} ${member.last_name}
                            ${isNoShow ? '<span style="color: #dc3545; margin-left: 6px;" title="Ikke møtt opp">❌</span>' : ''}
                        </div>
                        <div class="team-member-details">
                            ${details.join(' • ')}
                        </div>
                        ${isCurrentUser ? '<span class="team-member-badge">Det er deg!</span>' : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Update title with team name
        teamSectionTitle.textContent = `🏆 Ditt Lag: ${teamName}`;

        teamMembersSection.classList.remove('hidden');

    } catch (err) {
        console.error('Error loading team members:', err);
        teamMembersSection.classList.add('hidden');
    }
}

// Load and display courses for participant
async function loadCourses(participantCode) {
    const coursesSection = document.getElementById('coursesSection');
    const coursesList = document.getElementById('coursesList');

    try {
        // Fetch participant's courses
        const response = await fetch(`/api/courses/participant/${participantCode}`);
        if (!response.ok) {
            throw new Error('Failed to fetch courses');
        }

        const courses = await response.json();

        if (courses.length === 0) {
            coursesList.innerHTML = '<div class="no-courses">Du er ikke påmeldt noen kurs ennå</div>';
            coursesSection.classList.remove('hidden');
            return;
        }

        // Render courses
        coursesList.innerHTML = courses.map(course => {
            return `
                <div class="course-card">
                    <div class="course-icon">${course.icon || '📚'}</div>
                    <div class="course-name">${course.name}</div>
                    <div class="course-description">${course.description || ''}</div>
                    <div class="course-details">
                        ${course.instructor ? `
                            <div class="course-instructor">
                                <span>👨‍🏫</span>
                                <span><strong>Instruktør:</strong> ${course.instructor}</span>
                            </div>
                        ` : ''}
                        ${course.location ? `
                            <div class="course-location">
                                <span>📍</span>
                                <span><strong>Sted:</strong> ${course.location}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        coursesSection.classList.remove('hidden');

    } catch (err) {
        console.error('Error loading courses:', err);
        coursesSection.classList.add('hidden');
    }
}

// Camera modal functions
async function openCameraModal() {
    cameraModal.classList.remove('hidden');
    cameraStatus.textContent = 'Starter kamera...';
    cameraStatus.className = 'camera-status info';

    try {
        await camera.start();
        cameraStatus.textContent = '';
        captureBtn.classList.remove('hidden');
        cameraVideo.classList.remove('hidden');
        cameraCanvas.classList.add('hidden');
        retakeBtn.classList.add('hidden');
        uploadBtn.classList.add('hidden');
    } catch (err) {
        cameraStatus.textContent = err.message;
        cameraStatus.className = 'camera-status error';
    }
}

function closeCameraModal() {
    camera.stop();
    cameraModal.classList.add('hidden');
    cameraStatus.textContent = '';
}

function capturePhoto() {
    try {
        camera.capture();

        // Show canvas, hide video
        cameraVideo.classList.add('hidden');
        cameraCanvas.classList.remove('hidden');

        // Show retake and upload buttons
        captureBtn.classList.add('hidden');
        retakeBtn.classList.remove('hidden');
        uploadBtn.classList.remove('hidden');

        cameraStatus.textContent = 'Bilde tatt! Lagre eller ta på nytt.';
        cameraStatus.className = 'camera-status success';
    } catch (err) {
        cameraStatus.textContent = 'Kunne ikke ta bilde: ' + err.message;
        cameraStatus.className = 'camera-status error';
    }
}

function retakePhoto() {
    // Reset to camera view
    cameraVideo.classList.remove('hidden');
    cameraCanvas.classList.add('hidden');
    captureBtn.classList.remove('hidden');
    retakeBtn.classList.add('hidden');
    uploadBtn.classList.add('hidden');
    cameraStatus.textContent = '';
}

async function uploadPhoto() {
    if (!currentParticipant) {
        cameraStatus.textContent = 'Ingen deltaker valgt';
        cameraStatus.className = 'camera-status error';
        return;
    }

    uploadBtn.disabled = true;
    uploadBtn.textContent = '⏳ Lagrer...';
    cameraStatus.textContent = 'Laster opp bilde...';
    cameraStatus.className = 'camera-status info';

    try {
        // Convert canvas to blob
        const blob = await camera.getBlob();

        // Upload photo
        await camera.uploadPhoto(currentParticipant.participant_code);

        cameraStatus.textContent = 'Selfie lagret!';
        cameraStatus.className = 'camera-status success';

        // Close modal and refresh profile after short delay
        setTimeout(() => {
            closeCameraModal();
            // Refresh participant data to get new photo path
            refreshProfile();
        }, 1500);
    } catch (err) {
        console.error('Error uploading photo:', err);
        cameraStatus.textContent = 'Kunne ikke lagre bilde: ' + err.message;
        cameraStatus.className = 'camera-status error';
        uploadBtn.disabled = false;
        uploadBtn.textContent = '✅ Lagre Selfie';
    }
}

async function refreshProfile() {
    if (!currentParticipant) return;

    try {
        const response = await fetch(`/api/participants/${currentParticipant.participant_code}`);
        if (response.ok) {
            currentParticipant = await response.json();
            showProfileView();
        }
    } catch (err) {
        console.error('Error refreshing profile:', err);
    }
}

// Load participant statistics
async function loadParticipantStats() {
    if (!currentParticipant) return;

    try {
        // Fetch participant stats from various endpoints
        const [quizResponse, photoResponse, scavengerResponse, selfieResponse, ticTacToeResponse] = await Promise.all([
            fetch(`/api/quiz/participant/${currentParticipant.participant_code}/stats`).catch(() => null),
            fetch(`/api/photo-challenges/participant/${currentParticipant.participant_code}/stats`).catch(() => null),
            fetch(`/api/scavenger-hunt/participant/${currentParticipant.participant_code}/stats`).catch(() => null),
            fetch(`/api/selfie-chain/participant/${currentParticipant.participant_code}/stats`).catch(() => null),
            fetch(`/api/tic-tac-toe/participant/${currentParticipant.participant_code}/stats`).catch(() => null)
        ]);

        let totalActivities = 0;
        let totalPoints = 0;

        // Quiz stats
        if (quizResponse && quizResponse.ok) {
            const quizData = await quizResponse.json();
            if (quizData.totalAttempts > 0) {
                totalActivities++;
                totalPoints += quizData.highestScore || 0;
            }
        }

        // Photo challenges stats
        if (photoResponse && photoResponse.ok) {
            const photoData = await photoResponse.json();
            if (photoData.completedChallenges > 0) {
                totalActivities += photoData.completedChallenges;
                totalPoints += photoData.totalPoints || 0;
            }
        }

        // Scavenger hunt stats
        if (scavengerResponse && scavengerResponse.ok) {
            const scavengerData = await scavengerResponse.json();
            if (scavengerData.checkpointsFound > 0) {
                totalActivities++;
                totalPoints += scavengerData.checkpointsFound * 10; // 10 points per checkpoint
            }
        }

        // Selfie chain stats
        if (selfieResponse && selfieResponse.ok) {
            const selfieData = await selfieResponse.json();
            if (selfieData.chainLength > 0) {
                totalActivities++;
                totalPoints += selfieData.points || 0;
            }
        }

        // Tic-tac-toe stats
        if (ticTacToeResponse && ticTacToeResponse.ok) {
            const ticTacToeData = await ticTacToeResponse.json();
            if (ticTacToeData.totalGames > 0) {
                totalActivities += ticTacToeData.totalGames;
                totalPoints += (ticTacToeData.wins * 10) + (ticTacToeData.draws * 5); // 10 points per win, 5 per draw
            }
        }

        // Update stats display
        statsActivities.textContent = totalActivities;
        statsPoints.textContent = totalPoints;

    } catch (err) {
        console.error('Error loading participant stats:', err);
        statsActivities.textContent = '0';
        statsPoints.textContent = '0';
    }
}

// Check and show welcome modal if first visit
function checkAndShowWelcomeModal() {
    if (!currentParticipant) return;

    const welcomeKey = `welcomeShown_${currentParticipant.participant_code}`;
    const hasSeenWelcome = localStorage.getItem(welcomeKey);

    // Show welcome modal if:
    // 1. User hasn't seen it before
    // 2. User is NOT yet confirmed (first time visiting profile)
    if (!hasSeenWelcome && currentParticipant.confirmed !== 1) {
        // Update welcome title with event name
        if (currentEventName && welcomeTitle) {
            welcomeTitle.textContent = `Velkommen til ${currentEventName}!`;
        }

        // Show modal after a short delay for better UX
        setTimeout(() => {
            welcomeModal.classList.remove('hidden');
        }, 500);
    }
}

// Close welcome modal and mark as shown
function closeWelcomeModal() {
    if (!currentParticipant) return;

    welcomeModal.classList.add('hidden');

    // Mark welcome as shown for this participant
    const welcomeKey = `welcomeShown_${currentParticipant.participant_code}`;
    localStorage.setItem(welcomeKey, 'true');
}

// ============================================================================
// SLEEPING ROOMS FUNCTIONALITY
// ============================================================================

/**
 * Load available sleeping rooms
 */
async function loadAvailableRooms() {
    try {
        const response = await fetch('/api/sleeping-rooms');
        if (!response.ok) {
            throw new Error('Failed to load rooms');
        }

        availableRooms = await response.json();

        // Get room occupancy data
        const reportResponse = await fetch('/api/sleeping-rooms/report/all');
        if (reportResponse.ok) {
            const roomsWithOccupancy = await reportResponse.json();
            // Merge occupancy data with available rooms
            availableRooms = availableRooms.map(room => {
                const roomData = roomsWithOccupancy.find(r => r.id === room.id);
                return {
                    ...room,
                    occupancy: roomData ? roomData.occupancy : 0
                };
            });
        }

    } catch (err) {
        console.error('Error loading rooms:', err);
    }
}

/**
 * Update room display in profile
 */
function updateRoomDisplay() {
    if (!currentParticipant) return;

    if (currentParticipant.sleeping_room_id) {
        // Find the room name
        const room = availableRooms.find(r => r.id === currentParticipant.sleeping_room_id);
        profileRoom.textContent = room ? room.name : 'Ukjent rom';
        selectedRoomId = currentParticipant.sleeping_room_id;
    } else {
        profileRoom.textContent = 'Ikke valgt';
        selectedRoomId = null;
    }
}

/**
 * Toggle room selection section
 */
function toggleRoomSelection() {
    if (roomSelectionSection.classList.contains('hidden')) {
        showRoomSelection();
    } else {
        hideRoomSelection();
    }
}

/**
 * Show room selection
 */
function showRoomSelection() {
    renderRoomSelection();
    roomSelectionSection.classList.remove('hidden');
    roomSelectionSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Hide room selection
 */
function hideRoomSelection() {
    roomSelectionSection.classList.add('hidden');
}

/**
 * Render room selection cards
 */
function renderRoomSelection() {
    if (availableRooms.length === 0) {
        roomSelectionList.innerHTML = `
            <p style="text-align: center; color: var(--text-light); grid-column: 1 / -1;">
                Ingen soverom tilgjengelige.
            </p>
        `;
        return;
    }

    roomSelectionList.innerHTML = availableRooms.map(room => {
        const occupancy = room.occupancy || 0;
        const capacity = room.capacity || 10;
        const progressPercent = capacity > 0 ? (occupancy / capacity * 100) : 0;
        const isFull = occupancy >= capacity;
        const isSelected = room.id === selectedRoomId;

        let capacityClass = 'low';
        if (progressPercent >= 100) capacityClass = 'high';
        else if (progressPercent >= 80) capacityClass = 'medium';

        return `
            <div class="room-card ${isSelected ? 'selected' : ''} ${isFull && !isSelected ? 'room-card-full' : ''}"
                 onclick="${isFull && !isSelected ? '' : `selectRoom(${room.id})`}">
                <div class="room-card-header">
                    <div class="room-card-name">
                        🛏️ ${room.name}
                    </div>
                    <div class="room-card-occupancy">
                        ${occupancy} / ${capacity}
                    </div>
                </div>
                ${room.floor ? `<div class="room-card-floor">📍 ${room.floor}</div>` : ''}
                ${room.description ? `<div style="font-size: 14px; color: #666; margin-top: 5px;">${room.description}</div>` : ''}
                <div class="room-card-capacity">
                    <div class="capacity-bar">
                        <div class="capacity-fill ${capacityClass}" style="width: ${Math.min(progressPercent, 100)}%"></div>
                    </div>
                </div>
                ${isFull && !isSelected ? '<div class="room-full-badge">Fullt</div>' : ''}
                ${isSelected ? '<div class="room-selected-badge">✓ Valgt</div>' : ''}
            </div>
        `;
    }).join('');
}

/**
 * Select a room
 */
async function selectRoom(roomId) {
    if (!currentParticipant) return;

    try {
        roomSelectionStatus.textContent = 'Lagrer...';
        roomSelectionStatus.className = '';
        roomSelectionStatus.classList.remove('hidden');

        const response = await fetch(`/api/participants/${currentParticipant.participant_code}/sleeping-room`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sleepingRoomId: roomId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Kunne ikke velge rom');
        }

        const result = await response.json();

        // Update current participant
        currentParticipant.sleeping_room_id = roomId;
        selectedRoomId = roomId;

        // Update display
        updateRoomDisplay();
        await loadAvailableRooms(); // Reload to get updated occupancy
        renderRoomSelection();

        roomSelectionStatus.textContent = `✅ ${result.roomName} valgt!`;
        roomSelectionStatus.className = 'alert success';

        if (result.warning) {
            roomSelectionStatus.textContent += ` (${result.warning})`;
        }

        setTimeout(() => {
            roomSelectionStatus.classList.add('hidden');
        }, 3000);

    } catch (err) {
        console.error('Error selecting room:', err);
        roomSelectionStatus.textContent = `❌ ${err.message}`;
        roomSelectionStatus.className = 'alert error';

        setTimeout(() => {
            roomSelectionStatus.classList.add('hidden');
        }, 5000);
    }
}

// Make selectRoom globally available for onclick
window.selectRoom = selectRoom;
