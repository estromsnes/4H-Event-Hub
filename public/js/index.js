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
                    const timeDisplay = item.end_time ? `${item.start_time} - ${item.end_time}` : item.start_time;
                    html += `
                        <div class="program-item">
                            <div class="program-time">${timeDisplay}</div>
                            <div class="program-title">${item.title}</div>
                            ${item.location ? `<div class="program-location">📍 ${item.location}</div>` : ''}
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

        // Store participant code in modal for MessageSender to access
        this.detailModal.dataset.participantCode = code;

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

// ============================================
// MESSAGE SENDING FUNCTIONALITY
// ============================================

class MessageSender {
    constructor() {
        this.currentRecipient = null;  // { code, name }
        this.isAnonymous = null;       // true/false
        this.currentSender = null;      // participant object
        this.currentStep = 1;

        // DOM elements
        this.modal = document.getElementById('sendMessageModal');
        this.sendMessageBtn = document.getElementById('sendMessageBtn');
        this.closeBtn = document.getElementById('closeMessageModalBtn');

        // Steps
        this.step1 = document.getElementById('messageStep1');
        this.step2 = document.getElementById('messageStep2');
        this.step3 = document.getElementById('messageStep3');
        this.successStep = document.getElementById('messageSuccessStep');

        // Step 1
        this.recipientName = document.getElementById('messageRecipientName');
        this.anonymousBtn = document.getElementById('messageAnonymousBtn');
        this.identifyBtn = document.getElementById('messageIdentifyBtn');

        // Step 2
        this.senderCodeInput = document.getElementById('messageSenderCodeInput');
        this.codeLoginBtn = document.getElementById('messageCodeLoginBtn');
        this.senderInfo = document.getElementById('messageSenderInfo');
        this.senderName = document.getElementById('messageSenderName');
        this.senderDetails = document.getElementById('messageSenderDetails');
        this.cancelScanBtn = document.getElementById('messageCancelScanBtn');
        this.continueScanBtn = document.getElementById('messageContinueScanBtn');
        this.scanStatus = document.getElementById('messageScanStatus');

        // Step 3
        this.identityBadge = document.getElementById('messageIdentityBadge');
        this.identityText = document.getElementById('messageIdentityText');
        this.titleInput = document.getElementById('messageTitle');
        this.textInput = document.getElementById('messageText');
        this.titleCount = document.getElementById('messageTitleCount');
        this.textCount = document.getElementById('messageTextCount');
        this.backBtn = document.getElementById('messageBackBtn');
        this.submitBtn = document.getElementById('messageSubmitBtn');
        this.submitStatus = document.getElementById('messageSubmitStatus');

        // Success
        this.newBtn = document.getElementById('messageNewBtn');
        this.closeSuccessBtn = document.getElementById('messageCloseBtn');

        this.init();
    }

    init() {
        // Open modal when "Send melding" is clicked
        this.sendMessageBtn.addEventListener('click', () => this.openModal());

        // Close modal
        this.closeBtn.addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        // Step 1
        this.anonymousBtn.addEventListener('click', () => this.chooseAnonymous());
        this.identifyBtn.addEventListener('click', () => this.chooseIdentify());

        // Step 2
        this.codeLoginBtn.addEventListener('click', () => this.handleLoginWithCode());
        this.senderCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLoginWithCode();
        });
        this.cancelScanBtn.addEventListener('click', () => this.goToStep(1));
        this.continueScanBtn.addEventListener('click', () => this.goToStep(3));

        // Step 3
        this.titleInput.addEventListener('input', () => this.updateCharCounts());
        this.textInput.addEventListener('input', () => this.updateCharCounts());
        this.backBtn.addEventListener('click', () => this.goToStep(1));
        this.submitBtn.addEventListener('click', () => this.submitMessage());

        // Success
        this.newBtn.addEventListener('click', () => this.reset());
        this.closeSuccessBtn.addEventListener('click', () => this.closeModal());
    }

    openModal() {
        // Get current recipient from detail modal
        const detailModal = document.getElementById('detailModal');
        const detailName = document.getElementById('detailName')?.textContent;
        const detailCode = detailModal?.dataset.participantCode;

        if (!detailName || !detailCode) {
            alert('Kunne ikke finne mottaker');
            return;
        }

        this.currentRecipient = {
            code: detailCode,
            name: detailName
        };

        this.recipientName.textContent = detailName;
        this.reset();
        this.modal.classList.remove('hidden');
    }

    closeModal() {
        this.modal.classList.add('hidden');
        this.reset();
    }

    goToStep(step) {
        this.currentStep = step;

        // Hide all steps
        this.step1.classList.add('hidden');
        this.step2.classList.add('hidden');
        this.step3.classList.add('hidden');
        this.successStep.classList.add('hidden');

        // Show current step
        if (step === 1) this.step1.classList.remove('hidden');
        else if (step === 2) this.step2.classList.remove('hidden');
        else if (step === 3) {
            this.step3.classList.remove('hidden');
            this.updateIdentityBadge();
        }
        else if (step === 'success') this.successStep.classList.remove('hidden');
    }

    chooseAnonymous() {
        this.isAnonymous = true;
        this.currentSender = null;
        this.goToStep(3);
    }

    chooseIdentify() {
        this.isAnonymous = false;
        this.goToStep(2);
    }

    async handleLoginWithCode() {
        const code = this.senderCodeInput.value.trim().toUpperCase();

        if (!code) {
            this.showScanStatus('Vennligst skriv inn ditt login-ord', 'error');
            return;
        }

        this.codeLoginBtn.disabled = true;
        this.codeLoginBtn.textContent = '⏳ Logger inn...';
        this.showScanStatus('Logger inn...', 'info');

        try {
            // Direct API call
            const response = await fetch(`/api/participants/${code}`);

            if (!response.ok) {
                throw new Error('Deltaker ikke funnet');
            }

            this.currentSender = await response.json();
            this.displaySenderInfo();
            this.showScanStatus('✅ Innlogget!', 'success');
            this.continueScanBtn.classList.remove('hidden');

        } catch (error) {
            console.error('Login error:', error);
            this.showScanStatus('❌ Ugyldig login-ord. Prøv igjen.', 'error');
        } finally {
            this.codeLoginBtn.disabled = false;
            this.codeLoginBtn.textContent = '➡️ Logg inn';
        }
    }

    displaySenderInfo() {
        this.senderName.textContent = `${this.currentSender.first_name} ${this.currentSender.last_name}`;
        const details = [];
        if (this.currentSender.age) details.push(`${this.currentSender.age} år`);
        if (this.currentSender.club) details.push(this.currentSender.club);
        this.senderDetails.textContent = details.join(' • ');
        this.senderInfo.classList.remove('hidden');
    }

    showScanStatus(message, type) {
        this.scanStatus.textContent = message;
        this.scanStatus.className = `scan-status ${type}`;
        this.scanStatus.style.padding = '10px';
        this.scanStatus.style.borderRadius = '8px';
        this.scanStatus.style.textAlign = 'center';
        this.scanStatus.style.fontWeight = '600';

        if (type === 'error') {
            this.scanStatus.style.background = '#ffebee';
            this.scanStatus.style.color = '#c62828';
        } else if (type === 'success') {
            this.scanStatus.style.background = '#e8f5e9';
            this.scanStatus.style.color = '#2e7d32';
        } else {
            this.scanStatus.style.background = '#e3f2fd';
            this.scanStatus.style.color = '#1565c0';
        }

        this.scanStatus.classList.remove('hidden');
    }

    updateIdentityBadge() {
        if (this.isAnonymous) {
            this.identityText.innerHTML = '🕵️ Du sender anonymt';
            this.identityBadge.style.background = '#f3e5f5';
            this.identityBadge.style.border = '2px solid #9c27b0';
        } else if (this.currentSender) {
            this.identityText.innerHTML = `👤 Du sender som: ${this.currentSender.first_name} ${this.currentSender.last_name}`;
            this.identityBadge.style.background = '#e3f2fd';
            this.identityBadge.style.border = '2px solid #2196F3';
        }
    }

    updateCharCounts() {
        this.titleCount.textContent = this.titleInput.value.length;
        this.textCount.textContent = this.textInput.value.length;

        // Enable/disable submit button
        const hasMessage = this.textInput.value.trim().length > 0;
        this.submitBtn.disabled = !hasMessage;
    }

    async submitMessage() {
        if (!this.textInput.value.trim()) {
            this.showSubmitStatus('❌ Melding er påkrevd', 'error');
            return;
        }

        this.submitBtn.disabled = true;
        this.submitBtn.textContent = '⏳ Sender...';
        this.showSubmitStatus('Sender melding...', 'info');

        try {
            const payload = {
                recipient_code: this.currentRecipient.code,
                sender_code: this.isAnonymous ? null : this.currentSender?.participant_code,
                title: this.titleInput.value.trim() || null,
                message: this.textInput.value.trim(),
                is_anonymous: this.isAnonymous ? 1 : 0
            };

            const response = await fetch('/api/participant-messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Kunne ikke sende melding');
            }

            // Success!
            console.log('Message sent successfully');
            this.goToStep('success');

        } catch (error) {
            console.error('Submit error:', error);
            this.showSubmitStatus(error.message || '❌ Kunne ikke sende melding', 'error');
            this.submitBtn.disabled = false;
            this.submitBtn.textContent = 'Send inn';
        }
    }

    showSubmitStatus(message, type) {
        this.submitStatus.textContent = message;
        this.submitStatus.style.padding = '10px';
        this.submitStatus.style.borderRadius = '8px';
        this.submitStatus.style.textAlign = 'center';
        this.submitStatus.style.fontWeight = '600';

        if (type === 'error') {
            this.submitStatus.style.background = '#ffebee';
            this.submitStatus.style.color = '#c62828';
        } else if (type === 'success') {
            this.submitStatus.style.background = '#e8f5e9';
            this.submitStatus.style.color = '#2e7d32';
        } else {
            this.submitStatus.style.background = '#e3f2fd';
            this.submitStatus.style.color = '#1565c0';
        }

        this.submitStatus.classList.remove('hidden');
    }

    reset() {
        this.isAnonymous = null;
        this.currentSender = null;
        this.currentStep = 1;

        // Reset inputs
        this.senderCodeInput.value = '';
        this.titleInput.value = '';
        this.textInput.value = '';

        // Reset UI
        this.senderInfo.classList.add('hidden');
        this.continueScanBtn.classList.add('hidden');
        this.scanStatus.classList.add('hidden');
        this.submitStatus.classList.add('hidden');

        // Reset counts
        this.updateCharCounts();

        // Go to step 1
        this.goToStep(1);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new EventHub();

    // Initialize message sender if modal exists
    if (document.getElementById('sendMessageModal')) {
        new MessageSender();
    }
});
