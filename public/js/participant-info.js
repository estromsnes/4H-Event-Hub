// Participant Info Page Logic
class ParticipantInfo {
    constructor() {
        this.participants = [];
        this.searchString = '';
        this.filteredParticipants = [];

        // DOM elements
        this.searchText = document.getElementById('searchText');
        this.resetBtn = document.getElementById('resetBtn');
        this.keyboard = document.getElementById('keyboard');
        this.participantsGrid = document.getElementById('participantsGrid');
        this.participantCount = document.getElementById('participantCount');
        this.loadingState = document.getElementById('loadingState');
        this.emptyState = document.getElementById('emptyState');
        this.detailModal = document.getElementById('detailModal');
        this.closeModalBtn = document.getElementById('closeModalBtn');

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadParticipants();
        this.buildKeyboard();
        this.updateKeyboardState();
        this.renderParticipants();
    }

    setupEventListeners() {
        this.resetBtn.addEventListener('click', () => this.reset());
        this.closeModalBtn.addEventListener('click', () => this.closeModal());

        // Close modal on backdrop click
        this.detailModal.addEventListener('click', (e) => {
            if (e.target === this.detailModal) {
                this.closeModal();
            }
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.detailModal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }

    async loadParticipants() {
        try {
            this.loadingState.classList.remove('hidden');
            this.participantsGrid.classList.add('hidden');
            this.emptyState.classList.add('hidden');

            const response = await fetch('/api/participants');
            if (!response.ok) {
                throw new Error('Failed to load participants');
            }

            const data = await response.json();
            // API returns array directly, not wrapped in object
            this.participants = Array.isArray(data) ? data : [];

            // Add full name to each participant
            this.participants = this.participants.map(p => ({
                ...p,
                name: `${p.first_name} ${p.last_name}`.trim(),
                photo_path: p.profile_photo_path
            }));

            this.filteredParticipants = [...this.participants];

            this.loadingState.classList.add('hidden');
            this.participantsGrid.classList.remove('hidden');

        } catch (error) {
            console.error('Error loading participants:', error);
            this.loadingState.classList.add('hidden');
            this.emptyState.classList.remove('hidden');
            alert('Kunne ikke laste deltakere. Vennligst prøv igjen.');
        }
    }

    buildKeyboard() {
        // Norwegian alphabet + special characters
        const norwegianAlphabet = [
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Å'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ø', 'Æ'],
            ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
        ];

        this.keyboard.innerHTML = '';

        norwegianAlphabet.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';

            row.forEach(letter => {
                const button = document.createElement('button');
                button.className = 'key-button';
                button.textContent = letter;
                button.dataset.letter = letter;
                button.addEventListener('click', () => this.handleKeyPress(letter));
                rowDiv.appendChild(button);
            });

            this.keyboard.appendChild(rowDiv);
        });
    }

    handleKeyPress(letter) {
        this.searchString += letter;
        this.updateSearchDisplay();
        this.filterParticipants();
        this.updateKeyboardState();
        this.renderParticipants();
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
        const buttons = this.keyboard.querySelectorAll('.key-button');
        buttons.forEach(button => {
            const letter = button.dataset.letter;
            if (nextChars.has(letter)) {
                button.disabled = false;
            } else {
                button.disabled = true;
            }
        });
    }

    renderParticipants() {
        this.participantCount.textContent = this.filteredParticipants.length;

        if (this.filteredParticipants.length === 0) {
            this.participantsGrid.classList.add('hidden');
            this.emptyState.classList.remove('hidden');
            return;
        }

        this.participantsGrid.classList.remove('hidden');
        this.emptyState.classList.add('hidden');

        // Sort by name
        const sorted = [...this.filteredParticipants].sort((a, b) =>
            a.name.localeCompare(b.name, 'no')
        );

        this.participantsGrid.innerHTML = sorted.map(participant => {
            const photoHtml = participant.photo_path
                ? `<img src="${participant.photo_path}" alt="${participant.name}" class="participant-photo">`
                : `<div class="participant-photo-placeholder">👤</div>`;

            const details = [];
            if (participant.age) details.push(`${participant.age} år`);
            if (participant.club) details.push(participant.club);

            return `
                <div class="participant-card" data-id="${participant.id}">
                    ${photoHtml}
                    <div class="participant-info">
                        <div class="participant-name">${participant.name}</div>
                        <div class="participant-details">${details.join(' • ')}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers to cards
        this.participantsGrid.querySelectorAll('.participant-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = parseInt(card.dataset.id);
                this.showParticipantDetail(id);
            });
        });
    }

    showParticipantDetail(participantId) {
        const participant = this.participants.find(p => p.id === participantId);
        if (!participant) return;

        // Update modal content
        const detailPhoto = document.getElementById('detailPhoto');
        const detailPhotoPlaceholder = document.getElementById('detailPhotoPlaceholder');
        const detailName = document.getElementById('detailName');
        const detailAge = document.getElementById('detailAge');
        const detailClub = document.getElementById('detailClub');
        const detailRole = document.getElementById('detailRole');
        const detailTeam = document.getElementById('detailTeam');
        const detailClubRow = document.getElementById('detailClubRow');
        const detailRoleRow = document.getElementById('detailRoleRow');
        const detailTeamRow = document.getElementById('detailTeamRow');

        // Photo
        if (participant.photo_path) {
            detailPhoto.src = participant.photo_path;
            detailPhoto.classList.remove('hidden');
            detailPhotoPlaceholder.classList.add('hidden');
        } else {
            detailPhoto.classList.add('hidden');
            detailPhotoPlaceholder.classList.remove('hidden');
        }

        // Basic info
        detailName.textContent = participant.name;
        detailAge.textContent = participant.age || '-';

        // Optional fields
        if (participant.club) {
            detailClub.textContent = participant.club;
            detailClubRow.classList.remove('hidden');
        } else {
            detailClubRow.classList.add('hidden');
        }

        if (participant.role) {
            detailRole.textContent = participant.role;
            detailRoleRow.classList.remove('hidden');
        } else {
            detailRoleRow.classList.add('hidden');
        }

        if (participant.team) {
            detailTeam.textContent = participant.team;
            detailTeamRow.classList.remove('hidden');
        } else {
            detailTeamRow.classList.add('hidden');
        }

        // Show team members
        this.showTeamMembers(participant);

        // Show modal
        this.detailModal.classList.remove('hidden');
    }

    showTeamMembers(participant) {
        const teamMembersSection = document.getElementById('detailTeamMembersSection');
        const teamMembersList = document.getElementById('detailTeamMembersList');

        // Check if participant has a team
        if (!participant.team || participant.team.trim() === '') {
            teamMembersSection.classList.add('hidden');
            return;
        }

        // Find all team members (including current participant)
        const teamMembers = this.participants.filter(p =>
            p.team && p.team.trim() !== '' && p.team === participant.team
        );

        // If only one person on team (just the current participant), hide section
        if (teamMembers.length <= 1) {
            teamMembersSection.classList.add('hidden');
            return;
        }

        // Sort team members by name
        teamMembers.sort((a, b) => a.name.localeCompare(b.name, 'no'));

        // Render team members
        teamMembersList.innerHTML = teamMembers.map(member => {
            const photoHtml = member.photo_path
                ? `<img src="${member.photo_path}" alt="${member.name}" class="detail-team-member-photo">`
                : `<div class="detail-team-member-photo-placeholder">👤</div>`;

            const details = [];
            if (member.age) details.push(`${member.age} år`);
            if (member.club) details.push(member.club);

            const isCurrentUser = member.id === participant.id;
            const currentUserClass = isCurrentUser ? ' current-user' : '';

            return `
                <div class="detail-team-member-card${currentUserClass}" data-member-id="${member.id}">
                    ${photoHtml}
                    <div class="detail-team-member-info">
                        <div class="detail-team-member-name">${member.name}${isCurrentUser ? ' (deg)' : ''}</div>
                        <div class="detail-team-member-details">${details.join(' • ')}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers to team member cards
        teamMembersList.querySelectorAll('.detail-team-member-card').forEach(card => {
            card.addEventListener('click', () => {
                const memberId = parseInt(card.dataset.memberId);
                // Switch to viewing this team member
                this.showParticipantDetail(memberId);
            });
        });

        teamMembersSection.classList.remove('hidden');
    }

    closeModal() {
        this.detailModal.classList.add('hidden');
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ParticipantInfo();
});
