// 4H Event Hub - Homepage Logic
class EventHub {
    constructor() {
        this.participants = [];
        this.searchString = '';
        this.filteredParticipants = [];
        this.programData = [];

        // DOM elements
        this.eventTitle = document.getElementById('eventTitle');
        this.eventSubtitle = document.getElementById('eventSubtitle');
        this.eventLogo = document.getElementById('eventLogo');
        this.programContainer = document.getElementById('programContainer');
        this.searchText = document.getElementById('searchText');
        this.resetBtn = document.getElementById('resetBtn');
        this.keyboard = document.getElementById('keyboard');
        this.participantsGrid = document.getElementById('participantsGrid');
        this.participantCount = document.getElementById('participantCount');
        this.emptyState = document.getElementById('emptyState');
        this.detailModal = document.getElementById('detailModal');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.sectionToggle = document.getElementById('sectionToggle');
        this.participantContent = document.getElementById('participantContent');

        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupBarcodeScanning();
        await this.loadEventInfo();
        await this.loadMobileAccessQR();
        await this.loadProgram();
        await this.loadParticipants();
        this.renderParticipants();
        this.updateKeyboardState(); // Initialize keyboard with correct active/inactive keys
    }

    setupEventListeners() {
        // Reset button
        this.resetBtn.addEventListener('click', () => this.reset());

        // Modal close
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.detailModal.addEventListener('click', (e) => {
            if (e.target === this.detailModal) {
                this.closeModal();
            }
        });

        // Mobile Access Modal
        const mobileAccessBtn = document.getElementById('mobileAccessBtn');
        const mobileAccessModal = document.getElementById('mobileAccessModal');
        const closeMobileModalBtn = document.getElementById('closeMobileModalBtn');

        if (mobileAccessBtn) {
            mobileAccessBtn.addEventListener('click', () => {
                mobileAccessModal.classList.remove('hidden');
            });
        }

        if (closeMobileModalBtn) {
            closeMobileModalBtn.addEventListener('click', () => {
                mobileAccessModal.classList.add('hidden');
            });
        }

        if (mobileAccessModal) {
            mobileAccessModal.addEventListener('click', (e) => {
                if (e.target === mobileAccessModal) {
                    mobileAccessModal.classList.add('hidden');
                }
            });
        }

        // Keyboard
        const keys = document.querySelectorAll('.key');
        keys.forEach(key => {
            key.addEventListener('click', () => {
                const keyValue = key.dataset.key;
                if (keyValue === 'Backspace') {
                    this.handleBackspace();
                } else {
                    this.handleKeyPress(keyValue);
                }
            });
        });

        // Section toggle
        this.sectionToggle.addEventListener('click', () => this.toggleParticipantSection());

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (!this.detailModal.classList.contains('hidden')) {
                    this.closeModal();
                }
                if (mobileAccessModal && !mobileAccessModal.classList.contains('hidden')) {
                    mobileAccessModal.classList.add('hidden');
                }
            }
        });

        // Start with participant section collapsed
        this.participantContent.classList.add('collapsed');
        this.sectionToggle.classList.add('collapsed');
    }

    setupBarcodeScanning() {
        const barcodeInput = document.getElementById('barcode-input');
        if (!barcodeInput) return;

        let scanBuffer = '';
        let scanTimeout = null;

        // Barcode scanner input handler
        barcodeInput.addEventListener('input', (e) => {
            clearTimeout(scanTimeout);
            scanBuffer += e.target.value;
            e.target.value = '';

            scanTimeout = setTimeout(() => {
                if (scanBuffer.length > 0) {
                    this.handleQRScan(scanBuffer.trim());
                    scanBuffer = '';
                }
            }, 100);
        });

        // Keep focus on barcode input for background scanning
        barcodeInput.focus();

        // Refocus if focus is lost (unless modal is open)
        document.addEventListener('click', (e) => {
            if (this.detailModal.classList.contains('hidden')) {
                setTimeout(() => barcodeInput.focus(), 100);
            }
        });

        setInterval(() => {
            if (this.detailModal.classList.contains('hidden')) {
                barcodeInput.focus();
            }
        }, 1000);
    }

    async handleQRScan(qrData) {
        console.log('QR Code scanned on homepage:', qrData);

        // Decode potential keyboard layout issues
        const decodedData = GlobalBarcodeScanner.decodeBarcodeInput(qrData);
        let participantCode;

        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(decodedData);
            if (parsed.type === 'participant' && parsed.code) {
                participantCode = parsed.code;
            } else {
                console.error('Invalid QR code format');
                return;
            }
        } catch (e) {
            // Not JSON, use as-is
            participantCode = decodedData;
        }

        try {
            // Verify participant exists
            const response = await fetch(`/api/participants/${participantCode}`);

            if (!response.ok) {
                console.error('Participant not found');
                return;
            }

            const participant = await response.json();

            // Store participant code and redirect to profile page
            sessionStorage.setItem('profileParticipantCode', participantCode);
            sessionStorage.setItem('fromHomepage', 'true');

            // Redirect to profile page
            window.location.href = '/profile.html';

        } catch (error) {
            console.error('QR scan error:', error);
        }
    }

    toggleParticipantSection() {
        const isCurrentlyCollapsed = this.participantContent.classList.contains('collapsed');

        this.participantContent.classList.toggle('collapsed');
        this.sectionToggle.classList.toggle('collapsed');

        // Smart autoscrolling
        if (isCurrentlyCollapsed) {
            // Section is being opened - scroll so toggle button is at top
            // Wait for CSS transition to complete, then scroll
            setTimeout(() => {
                // Calculate the position to scroll to
                const elementTop = this.sectionToggle.offsetTop;

                window.scrollTo({
                    top: elementTop,
                    behavior: 'smooth'
                });
            }, 400);
        } else {
            // Section is being closed - scroll to top of page
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }

    async loadEventInfo() {
        try {
            const response = await fetch('/api/event');
            if (response.ok) {
                const event = await response.json();
                this.eventTitle.textContent = event.event_name || '4H Event Hub';
                this.eventSubtitle.textContent = event.event_description || 'Velkommen!';

                if (event.event_name) {
                    document.title = event.event_name;
                }

                if (event.logo_path) {
                    this.eventLogo.src = event.logo_path + '?t=' + Date.now();
                    this.eventLogo.classList.remove('hidden');
                }
            }
        } catch (err) {
            console.error('Error loading event info:', err);
        }
    }

    async loadMobileAccessQR() {
        try {
            // Fetch event info to check for WiFi settings
            const eventResponse = await fetch('/api/event');
            let wifiSsid = null;
            let wifiPassword = null;

            if (eventResponse.ok) {
                const eventData = await eventResponse.json();
                wifiSsid = eventData.wifi_ssid;
                wifiPassword = eventData.wifi_password;
            }

            // Check if WiFi settings are configured
            const hasWifi = wifiSsid && wifiPassword;
            const wifiQrSection = document.getElementById('wifiQrSection');
            const urlQrTitle = document.getElementById('urlQrTitle');
            const wifiHint = document.getElementById('wifiHint');

            if (hasWifi && wifiQrSection) {
                // Show WiFi section
                wifiQrSection.classList.remove('hidden');

                // Update title for URL section
                if (urlQrTitle) {
                    urlQrTitle.textContent = '2️⃣ Åpne siden';
                }

                // Update hint
                if (wifiHint) {
                    wifiHint.textContent = '💡 Koble til WiFi først (steg 1), deretter skann steg 2';
                }

                // Generate WiFi QR code
                // Format: WIFI:T:WPA;S:ssid;P:password;;
                const wifiString = `WIFI:T:WPA;S:${wifiSsid};P:${wifiPassword};;`;
                const wifiQrContainer = document.getElementById('wifiQrCodeContainer');
                const wifiSsidText = document.getElementById('wifiSsidText');

                if (wifiQrContainer) {
                    const qrSize = 300;
                    const wifiQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(wifiString)}&margin=10`;
                    wifiQrContainer.innerHTML = `<img src="${wifiQrCodeUrl}" alt="WiFi QR Code" />`;
                }

                if (wifiSsidText) {
                    wifiSsidText.textContent = wifiSsid;
                }
            } else {
                // Hide WiFi section if no settings
                if (wifiQrSection) {
                    wifiQrSection.classList.add('hidden');
                }

                // Update title to remove step number
                if (urlQrTitle) {
                    urlQrTitle.textContent = 'Skann for å åpne';
                }

                // Keep original hint
                if (wifiHint) {
                    wifiHint.textContent = '💡 Husk å koble til samme WiFi-nettverk først';
                }
            }

            // Load page URL
            const response = await fetch('/api/local-url');
            if (!response.ok) throw new Error('Failed to get local URL');

            const data = await response.json();
            const url = data.url;

            // Update URL display
            const urlText = document.getElementById('urlText');
            if (urlText) {
                urlText.textContent = url;
            }

            // Generate small QR code for button icon
            const qrBtnIcon = document.getElementById('qrBtnIcon');
            if (qrBtnIcon) {
                const btnQrSize = 100;
                const btnQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${btnQrSize}x${btnQrSize}&data=${encodeURIComponent(url)}&margin=5`;
                qrBtnIcon.innerHTML = `<img src="${btnQrCodeUrl}" alt="QR Code" />`;
            }

            // Generate large QR code for modal
            const qrContainer = document.getElementById('qrCodeContainer');
            if (qrContainer) {
                const qrSize = 300;
                const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(url)}&margin=10`;

                qrContainer.innerHTML = `<img src="${qrCodeUrl}" alt="QR Code til ${url}" />`;
            }

            console.log('Mobile access QR codes loaded. WiFi:', hasWifi ? 'Yes' : 'No');
        } catch (err) {
            console.error('Error loading mobile access QR:', err);
            const qrContainer = document.getElementById('qrCodeContainer');
            if (qrContainer) {
                qrContainer.innerHTML = '<div class="qr-loading">Kunne ikke generere QR-kode</div>';
            }
        }
    }

    async loadProgram() {
        try {
            // Fetch event info to get start date
            const eventResponse = await fetch('/api/event');
            let eventStartDate = null;
            if (eventResponse.ok) {
                const eventData = await eventResponse.json();
                // Try both start_date and start_datetime fields
                eventStartDate = eventData.start_date || eventData.start_datetime;
            }

            const response = await fetch('/api/program');
            if (!response.ok) throw new Error('Failed to load program');

            const programItems = await response.json();

            if (programItems.length === 0) {
                this.programContainer.innerHTML = '<div class="loading">Ingen program tilgjengelig</div>';
                return;
            }

            // Group by day
            const days = {};
            programItems.forEach(item => {
                if (!days[item.day_number]) days[item.day_number] = [];
                days[item.day_number].push(item);
            });

            // Helper function to get day name from date
            const getDayName = (dayNumber) => {
                if (!eventStartDate) {
                    return `Dag ${dayNumber}`;
                }

                try {
                    // Parse start date and add (dayNumber - 1) days
                    const startDate = new Date(eventStartDate);
                    const targetDate = new Date(startDate);
                    targetDate.setDate(startDate.getDate() + (dayNumber - 1));

                    // Get Norwegian day name
                    const dayNames = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
                    return dayNames[targetDate.getDay()];
                } catch (e) {
                    console.error('Error parsing date:', e);
                    return `Dag ${dayNumber}`;
                }
            };

            // Render program in columns
            let html = '';

            Object.keys(days).sort((a, b) => a - b).forEach(dayNum => {
                const dayName = getDayName(parseInt(dayNum));

                html += `
                    <div class="program-day">
                        <div class="program-day-header">${dayName}</div>
                        <div class="program-items">`;

                // Sort items by start time before rendering
                const sortedItems = days[dayNum].sort((a, b) => {
                    return a.start_time.localeCompare(b.start_time);
                });

                sortedItems.forEach(item => {
                    html += `
                        <div class="program-item">
                            <div class="program-time">${item.start_time} - ${item.end_time}</div>
                            <div class="program-title">${item.title}</div>
                        </div>`;
                });

                html += `
                        </div>
                    </div>`;
            });

            this.programContainer.innerHTML = html;
        } catch (error) {
            console.error('Error loading program:', error);
            this.programContainer.innerHTML = '<div class="loading">Kunne ikke laste program</div>';
        }
    }

    async loadParticipants() {
        try {
            const response = await fetch('/api/participants');
            if (!response.ok) {
                throw new Error('Failed to load participants');
            }

            const data = await response.json();
            this.participants = Array.isArray(data) ? data : [];

            // Add full name to each participant
            this.participants = this.participants.map(p => ({
                ...p,
                name: `${p.first_name} ${p.last_name}`.trim(),
                photo_path: p.profile_photo_path
            }));

            this.filteredParticipants = [...this.participants];
            this.updateParticipantCount();

        } catch (error) {
            console.error('Error loading participants:', error);
        }
    }

    handleKeyPress(letter) {
        this.searchString += letter;
        this.updateSearchDisplay();
        this.filterParticipants();
        this.updateKeyboardState();
        this.renderParticipants();
    }

    handleBackspace() {
        if (this.searchString.length > 0) {
            this.searchString = this.searchString.slice(0, -1);
            this.updateSearchDisplay();
            this.filterParticipants();
            this.updateKeyboardState();
            this.renderParticipants();
        }
    }

    reset() {
        this.searchString = '';
        this.updateSearchDisplay();
        this.filteredParticipants = [...this.participants];
        this.updateKeyboardState();
        this.renderParticipants();
    }

    updateSearchDisplay() {
        this.searchText.textContent = this.searchString || '_';
    }

    filterParticipants() {
        const searchUpper = this.searchString.toUpperCase();
        this.filteredParticipants = this.participants.filter(p => {
            const nameUpper = p.name.toUpperCase();
            return nameUpper.startsWith(searchUpper);
        });
    }

    updateKeyboardState() {
        // Get all possible next characters
        const nextChars = new Set();
        const position = this.searchString.length;

        this.filteredParticipants.forEach(participant => {
            const nameUpper = participant.name.toUpperCase();
            if (nameUpper.length > position) {
                const nextChar = nameUpper[position];
                // Only add letters, skip spaces and special characters
                if (/^[A-ZÆØÅ]$/.test(nextChar)) {
                    nextChars.add(nextChar);
                }
            }
        });

        // Update keyboard buttons
        const keys = document.querySelectorAll('.key[data-key]');
        keys.forEach(key => {
            const letter = key.dataset.key;
            if (letter === 'Backspace') {
                key.disabled = this.searchString.length === 0;
            } else {
                key.disabled = !nextChars.has(letter);
            }
        });
    }

    updateParticipantCount() {
        this.participantCount.textContent = this.filteredParticipants.length;
    }

    renderParticipants() {
        this.updateParticipantCount();

        if (this.filteredParticipants.length === 0) {
            this.participantsGrid.style.display = 'none';
            this.emptyState.classList.remove('hidden');
            return;
        }

        this.participantsGrid.style.display = 'grid';
        this.emptyState.classList.add('hidden');

        this.participantsGrid.innerHTML = this.filteredParticipants.map(p => `
            <div class="participant-card" data-code="${p.participant_code}">
                <div class="participant-photo-container">
                    ${p.photo_path
                        ? `<img src="${p.photo_path}?t=${Date.now()}" alt="${p.name}" class="participant-photo">`
                        : `<div class="participant-photo-placeholder">👤</div>`
                    }
                </div>
                <div class="participant-name">${p.name}</div>
                <div class="participant-info">
                    ${p.age ? `${p.age} år` : ''}
                    ${p.team ? `${p.age ? '<br>' : ''}🏆 ${p.team}` : ''}
                </div>
            </div>
        `).join('');

        // Add click listeners
        document.querySelectorAll('.participant-card').forEach(card => {
            card.addEventListener('click', () => {
                const code = card.dataset.code;
                this.showParticipantDetail(code);
            });
        });
    }

    async showParticipantDetail(code) {
        const participant = this.participants.find(p => p.participant_code === code);
        if (!participant) return;

        // Set participant details
        document.getElementById('detailName').textContent = participant.name;
        document.getElementById('detailAge').textContent = participant.age || '-';
        document.getElementById('detailClub').textContent = participant.club || '-';
        document.getElementById('detailRole').textContent = participant.role || '-';
        document.getElementById('detailTeam').textContent = participant.team || 'Ikke tildelt';

        // Set photo
        const photoEl = document.getElementById('detailPhoto');
        const placeholderEl = document.getElementById('detailPhotoPlaceholder');

        if (participant.photo_path) {
            photoEl.src = participant.photo_path + '?t=' + Date.now();
            photoEl.classList.remove('hidden');
            placeholderEl.classList.add('hidden');
        } else {
            photoEl.classList.add('hidden');
            placeholderEl.classList.remove('hidden');
        }

        // Load team members if has team
        const teamMembersSection = document.getElementById('detailTeamMembersSection');
        if (participant.team) {
            try {
                // Fetch all participants and filter by team name
                const response = await fetch('/api/participants');
                if (!response.ok) {
                    throw new Error('Failed to fetch participants');
                }

                const allParticipants = await response.json();

                // Filter to get team members (excluding current participant)
                const teamMembers = allParticipants.filter(p =>
                    p.team === participant.team && p.participant_code !== code
                );

                if (teamMembers.length > 0) {
                    const membersList = document.getElementById('detailTeamMembersList');
                    membersList.innerHTML = teamMembers.map(m => {
                        // Build photo HTML
                        let photoHtml = '';
                        if (m.profile_photo_path) {
                            photoHtml = `
                                <div class="team-member-photo-container">
                                    <img src="${m.profile_photo_path}?t=${Date.now()}"
                                         alt="${m.first_name}"
                                         class="team-member-photo">
                                </div>`;
                        } else {
                            photoHtml = `
                                <div class="team-member-photo-container">
                                    <div class="team-member-photo-placeholder">👤</div>
                                </div>`;
                        }

                        // Build details
                        const details = [];
                        if (m.age) details.push(`${m.age} år`);
                        if (m.club) details.push(m.club);

                        return `
                            <div class="team-member-card">
                                ${photoHtml}
                                <div class="team-member-info">
                                    <div class="team-member-name">${m.first_name} ${m.last_name}</div>
                                    ${details.length > 0 ? `<div class="team-member-details">${details.join(' • ')}</div>` : ''}
                                </div>
                            </div>
                        `;
                    }).join('');
                    teamMembersSection.classList.remove('hidden');
                } else {
                    teamMembersSection.classList.add('hidden');
                }
            } catch (err) {
                console.error('Error loading team members:', err);
                teamMembersSection.classList.add('hidden');
            }
        } else {
            teamMembersSection.classList.add('hidden');
        }

        // Load and show courses
        await this.loadCourses(participant.participant_code);

        // Show modal
        this.detailModal.classList.remove('hidden');
    }

    async loadCourses(participantCode) {
        const coursesSection = document.getElementById('detailCoursesSection');
        const coursesList = document.getElementById('detailCoursesList');

        try {
            // Fetch participant's courses
            const response = await fetch(`/api/courses/participant/${participantCode}`);
            if (!response.ok) {
                throw new Error('Failed to fetch courses');
            }

            const courses = await response.json();

            if (courses.length === 0) {
                coursesList.innerHTML = '<div class="no-courses">Ikke påmeldt noen kurs</div>';
                coursesSection.classList.remove('hidden');
                return;
            }

            // Render courses
            coursesList.innerHTML = courses.map(course => {
                return `
                    <div class="course-card">
                        <div class="course-icon">${course.icon || '📚'}</div>
                        <div class="course-info">
                            <div class="course-name">${course.name}</div>
                            ${course.description ? `<div class="course-description">${course.description}</div>` : ''}
                            ${course.instructor ? `<div class="course-instructor">👨‍🏫 ${course.instructor}</div>` : ''}
                            ${course.location ? `<div class="course-location">📍 ${course.location}</div>` : ''}
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

    closeModal() {
        this.detailModal.classList.add('hidden');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new EventHub();
});
