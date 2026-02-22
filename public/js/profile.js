// Profile Page Main Logic
// Coordinates scanner and camera modules

// State
let currentParticipant = null;
let scanner = null;
let camera = null;

// DOM Elements
const scannerView = document.getElementById('scannerView');
const profileView = document.getElementById('profileView');
const barcodeInput = document.getElementById('barcodeInput');
const startScanBtn = document.getElementById('startScanBtn');
const qrFileInput = document.getElementById('qrFileInput');
const scanStatus = document.getElementById('scanStatus');
const scanAgainBtn = document.getElementById('scanAgainBtn');

const profilePhoto = document.getElementById('profilePhoto');
const photoPlaceholder = document.getElementById('photoPlaceholder');
const profileName = document.getElementById('profileName');
const profileAge = document.getElementById('profileAge');
const profileLocation = document.getElementById('profileLocation');
const profileClub = document.getElementById('profileClub');
const profileClubRow = document.getElementById('profileClubRow');
const profileRole = document.getElementById('profileRole');
const profileRoleRow = document.getElementById('profileRoleRow');
const profileTeam = document.getElementById('profileTeam');
const profileTeamRow = document.getElementById('profileTeamRow');
const profileCode = document.getElementById('profileCode');

const takeSelfieBtn = document.getElementById('takeSelfieBtn');
const cameraModal = document.getElementById('cameraModal');
const closeCameraBtn = document.getElementById('closeCameraBtn');
const cameraVideo = document.getElementById('cameraVideo');
const cameraCanvas = document.getElementById('cameraCanvas');
const captureBtn = document.getElementById('captureBtn');
const retakeBtn = document.getElementById('retakeBtn');
const uploadBtn = document.getElementById('uploadBtn');
const cameraStatus = document.getElementById('cameraStatus');

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
        console.log('Start scan button clicked');
        startScanning();
    });
    qrFileInput.addEventListener('change', handleQrFileUpload);
    scanAgainBtn.addEventListener('click', showScannerView);
    takeSelfieBtn.addEventListener('click', openCameraModal);
    closeCameraBtn.addEventListener('click', closeCameraModal);
    captureBtn.addEventListener('click', capturePhoto);
    retakeBtn.addEventListener('click', retakePhoto);
    uploadBtn.addEventListener('click', uploadPhoto);

    // Keyboard/barcode scanner input handling
    setupBarcodeScanner();

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
        showStatus('Kunne ikke lese QR-kode fra bilde', 'error');
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

// Barcode scanner (keyboard emulation) handling
function setupBarcodeScanner() {
    let scanBuffer = '';
    let scanTimeout = null;

    // Listen for keyboard input
    barcodeInput.addEventListener('input', (e) => {
        const value = e.target.value;
        scanBuffer += value;
        barcodeInput.value = ''; // Clear input immediately

        // Clear existing timeout
        if (scanTimeout) {
            clearTimeout(scanTimeout);
        }

        // Set timeout to process scan (barcode scanners are fast, < 100ms between chars)
        scanTimeout = setTimeout(() => {
            processBarcodeInput(scanBuffer.trim());
            scanBuffer = '';
        }, 100);
    });

    // Also listen for Enter key (most barcode scanners send Enter after scan)
    barcodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (scanTimeout) {
                clearTimeout(scanTimeout);
            }
            processBarcodeInput(scanBuffer.trim());
            scanBuffer = '';
        }
    });

    // Keep focus on input when clicking anywhere in scanner view
    scannerView.addEventListener('click', (e) => {
        // Don't steal focus if clicking the camera button
        if (e.target !== startScanBtn && !startScanBtn.contains(e.target)) {
            barcodeInput.focus();
        }
    });

    // Ensure input stays focused
    barcodeInput.addEventListener('blur', () => {
        // Re-focus after short delay if we're still in scanner view
        setTimeout(() => {
            if (!profileView.classList.contains('hidden') && !scannerView.classList.contains('hidden')) {
                return; // Don't refocus if we've navigated away
            }
            if (scannerView.classList.contains('hidden')) {
                return; // Don't refocus if scanner view is hidden
            }
            barcodeInput.focus();
        }, 100);
    });

    console.log('Barcode scanner keyboard handler initialized');
}

/**
 * Decode barcode scanner keyboard layout issues
 * Some barcode scanners send JSON with wrong keyboard mapping
 */
function decodeBarcodeInput(input) {
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

// Process barcode scanner input
function processBarcodeInput(input) {
    if (!input) return;

    console.log('Barcode scanner input:', input);

    // Decode potential keyboard layout issues
    const decodedInput = decodeBarcodeInput(input);

    try {
        // Try to parse as JSON first (QR codes generated by our app)
        const data = JSON.parse(decodedInput);
        if (data.type === 'participant' && data.code) {
            onScanSuccess(data.code);
            return;
        }
    } catch (e) {
        // Not JSON, might be direct participant code
    }

    // Check if input looks like a participant code (e.g. SK-2026-001 or sk-2026-001)
    const participantCodePattern = /^[A-Za-z]+-\d{4}-\d{3}$/i;
    if (participantCodePattern.test(decodedInput)) {
        onScanSuccess(decodedInput);
        return;
    }

    // Otherwise show error
    showStatus('Ugyldig QR-kode format: ' + decodedInput, 'error');
    console.warn('Invalid barcode format:', decodedInput);
}

// Scanner functions
async function startScanning() {
    console.log('startScanning called');

    if (!scanner) {
        console.error('Scanner not initialized');
        showStatus('QR-skanner er ikke initialisert. Last siden på nytt.', 'error');
        return;
    }

    startScanBtn.disabled = true;
    startScanBtn.textContent = '📷 Starter...';

    try {
        console.log('Starting scanner...');
        await scanner.start();
        startScanBtn.textContent = '🔍 Skanner...';
        showStatus('Skanner etter QR-kode...', 'info');
        console.log('Scanner started successfully');
    } catch (err) {
        console.error('Scanner start error:', err);
        showStatus(err.message || 'Kunne ikke starte skanning', 'error');
        startScanBtn.disabled = false;
        startScanBtn.textContent = '📷 Start Skanning';
    }
}

async function onScanSuccess(qrData) {
    console.log('QR Code scanned:', qrData);

    // Decode potential keyboard layout issues
    const decodedData = decodeBarcodeInput(qrData);
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
            startScanBtn.disabled = false;
            startScanBtn.textContent = '📷 Prøv Igjen';
            return;
        }
        // Not JSON, use as-is
        participantCode = decodedData;
    }

    // Stop scanner
    await scanner.stop();

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
        startScanBtn.disabled = false;
        startScanBtn.textContent = '📷 Prøv Igjen';
    }
}

function onScanError(errorMessage) {
    showStatus(errorMessage, 'error');
    startScanBtn.disabled = false;
    startScanBtn.textContent = '📷 Prøv Igjen';
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
    startScanBtn.disabled = false;
    startScanBtn.textContent = '📷 Start Kamera-Skanning';
    scanStatus.classList.add('hidden');

    // Re-focus on barcode input for keyboard scanner
    setTimeout(() => {
        barcodeInput.focus();
    }, 100);
}

function showProfileView() {
    if (!currentParticipant) return;

    // Update profile information
    profileName.textContent = `${currentParticipant.first_name} ${currentParticipant.last_name}`;
    profileAge.textContent = currentParticipant.age || '-';
    profileLocation.textContent = currentParticipant.home_location || '-';
    profileCode.textContent = currentParticipant.participant_code;

    // Update optional fields (club, role, team)
    if (currentParticipant.club) {
        profileClub.textContent = currentParticipant.club;
        profileClubRow.classList.remove('hidden');
    } else {
        profileClubRow.classList.add('hidden');
    }

    if (currentParticipant.role) {
        profileRole.textContent = currentParticipant.role;
        profileRoleRow.classList.remove('hidden');
    } else {
        profileRoleRow.classList.add('hidden');
    }

    if (currentParticipant.team) {
        profileTeam.textContent = currentParticipant.team;
        profileTeamRow.classList.remove('hidden');
    } else {
        profileTeamRow.classList.add('hidden');
    }

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

    // Switch views
    scannerView.classList.add('hidden');
    profileView.classList.remove('hidden');
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
            const photoHtml = member.profile_photo_path
                ? `<img src="${member.profile_photo_path}" class="team-member-photo" alt="${member.first_name}">`
                : `<div class="team-member-photo-placeholder">👤</div>`;

            const details = [];
            if (member.age) details.push(`${member.age} år`);
            if (member.club) details.push(member.club);

            return `
                <div class="team-member-card ${isCurrentUser ? 'current-user' : ''}">
                    ${photoHtml}
                    <div class="team-member-info">
                        <div class="team-member-name">
                            ${member.first_name} ${member.last_name}
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
