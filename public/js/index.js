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
        await this.loadEventInfo();
        await this.loadProgram();
        await this.loadParticipants();
        this.renderParticipants();
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

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.detailModal.classList.contains('hidden')) {
                this.closeModal();
            }
        });

        // Start with participant section collapsed
        this.participantContent.classList.add('collapsed');
        this.sectionToggle.classList.add('collapsed');
    }

    toggleParticipantSection() {
        this.participantContent.classList.toggle('collapsed');
        this.sectionToggle.classList.toggle('collapsed');
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

    async loadProgram() {
        try {
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

            // Render program in columns
            let html = '';
            const dayNames = ['', 'Fredag', 'Lørdag', 'Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag'];

            Object.keys(days).sort((a, b) => a - b).forEach(dayNum => {
                const dayName = dayNames[dayNum] || `Dag ${dayNum}`;

                html += `
                    <div class="program-day">
                        <div class="program-day-header">${dayName}</div>
                        <div class="program-items">`;

                days[dayNum].forEach(item => {
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
                    ${p.age} år
                    ${p.team ? `<br>🏆 ${p.team}` : ''}
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
        document.getElementById('detailAge').textContent = participant.age;
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
                const response = await fetch(`/api/teams/name/${encodeURIComponent(participant.team)}`);
                if (response.ok) {
                    const team = await response.json();
                    const members = team.members.filter(m => m.participant_code !== code);

                    if (members.length > 0) {
                        const membersList = document.getElementById('detailTeamMembersList');
                        membersList.innerHTML = members.map(m => `
                            <div class="team-member-card">
                                <div class="team-member-name">${m.first_name} ${m.last_name}</div>
                            </div>
                        `).join('');
                        teamMembersSection.classList.remove('hidden');
                    } else {
                        teamMembersSection.classList.add('hidden');
                    }
                }
            } catch (err) {
                console.error('Error loading team members:', err);
                teamMembersSection.classList.add('hidden');
            }
        } else {
            teamMembersSection.classList.add('hidden');
        }

        // Show modal
        this.detailModal.classList.remove('hidden');
    }

    closeModal() {
        this.detailModal.classList.add('hidden');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new EventHub();
});
