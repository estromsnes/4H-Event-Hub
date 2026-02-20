// Admin Panel Logic

// DOM Elements - Event Info
const eventInfoForm = document.getElementById('eventInfoForm');
const eventNameInput = document.getElementById('eventName');
const eventDescriptionInput = document.getElementById('eventDescription');
const eventLogoInput = document.getElementById('eventLogo');
const logoPreview = document.getElementById('logoPreview');
const logoPreviewImg = document.getElementById('logoPreviewImg');
const removeLogo = document.getElementById('removeLogo');
const eventLocationInput = document.getElementById('eventLocation');
const eventStartDateTimeInput = document.getElementById('eventStartDateTime');
const eventEndDateTimeInput = document.getElementById('eventEndDateTime');
const organizerNameInput = document.getElementById('organizerName');
const organizerClubInput = document.getElementById('organizerClub');
const organizerContactInput = document.getElementById('organizerContact');
const eventStatus = document.getElementById('eventStatus');

// DOM Elements - Add Form
const addParticipantForm = document.getElementById('addParticipantForm');
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const ageInput = document.getElementById('age');
const homeLocationInput = document.getElementById('homeLocation');
const clubInput = document.getElementById('club');
const roleInput = document.getElementById('role');
const teamInput = document.getElementById('team');
const notesInput = document.getElementById('notes');
const participantCodeInput = document.getElementById('participantCode');
const formStatus = document.getElementById('formStatus');

// Edit Modal
const editModal = document.getElementById('editModal');
const editParticipantForm = document.getElementById('editParticipantForm');
const editParticipantCodeInput = document.getElementById('editParticipantCode');
const editFirstNameInput = document.getElementById('editFirstName');
const editLastNameInput = document.getElementById('editLastName');
const editAgeInput = document.getElementById('editAge');
const editHomeLocationInput = document.getElementById('editHomeLocation');
const editClubInput = document.getElementById('editClub');
const editRoleInput = document.getElementById('editRole');
const editTeamInput = document.getElementById('editTeam');
const editNotesInput = document.getElementById('editNotes');
const closeEditBtn = document.getElementById('closeEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const editStatus = document.getElementById('editStatus');

// Teams elements
const teamsList = document.getElementById('teamsList');
const addTeamBtn = document.getElementById('addTeamBtn');
const teamModal = document.getElementById('teamModal');
const teamModalTitle = document.getElementById('teamModalTitle');
const teamForm = document.getElementById('teamForm');
const teamIdInput = document.getElementById('teamId');
const teamNameInput = document.getElementById('teamName');
const teamDescriptionInput = document.getElementById('teamDescription');
const teamMaxMembersInput = document.getElementById('teamMaxMembers');
const closeTeamBtn = document.getElementById('closeTeamBtn');
const cancelTeamBtn = document.getElementById('cancelTeamBtn');
const teamModalStatus = document.getElementById('teamModalStatus');
const teamStatus = document.getElementById('teamStatus');
const teamMembersSection = document.getElementById('teamMembersSection');
const teamMembersList = document.getElementById('teamMembersList');

// Photo Modal elements
const photoModal = document.getElementById('photoModal');
const photoModalTitle = document.getElementById('photoModalTitle');
const photoModalImg = document.getElementById('photoModalImg');
const closePhotoBtn = document.getElementById('closePhotoBtn');
const closePhotoModal2Btn = document.getElementById('closePhotoModal2Btn');
const deletePhotoBtn = document.getElementById('deletePhotoBtn');
const photoModalStatus = document.getElementById('photoModalStatus');

// Team Photo Modal elements
const teamPhotoModal = document.getElementById('teamPhotoModal');
const teamPhotoModalTitle = document.getElementById('teamPhotoModalTitle');
const teamPhotoModalImg = document.getElementById('teamPhotoModalImg');
const teamPhotoPlaceholder = document.getElementById('teamPhotoPlaceholder');
const closeTeamPhotoBtn = document.getElementById('closeTeamPhotoBtn');
const closeTeamPhotoModal2Btn = document.getElementById('closeTeamPhotoModal2Btn');
const uploadTeamPhotoBtn = document.getElementById('uploadTeamPhotoBtn');
const deleteTeamPhotoBtn = document.getElementById('deleteTeamPhotoBtn');
const teamPhotoInput = document.getElementById('teamPhotoInput');
const teamPhotoModalStatus = document.getElementById('teamPhotoModalStatus');

const participantsList = document.getElementById('participantsList');
const participantCount = document.getElementById('participantCount');
const teamStats = document.getElementById('teamStats');
const autoAssignTeamsBtn = document.getElementById('autoAssignTeamsBtn');
const autoAssignStatus = document.getElementById('autoAssignStatus');
const generateAllQRBtn = document.getElementById('generateAllQRBtn');
const printQRBtn = document.getElementById('printQRBtn');
const qrSection = document.getElementById('qrSection');
const qrGrid = document.getElementById('qrGrid');

// Scavenger Hunt elements
const checkpointsList = document.getElementById('checkpointsList');
const addCheckpointBtn = document.getElementById('addCheckpointBtn');
const checkpointModal = document.getElementById('checkpointModal');
const checkpointModalTitle = document.getElementById('checkpointModalTitle');
const checkpointForm = document.getElementById('checkpointForm');
const checkpointIdInput = document.getElementById('checkpointId');
const checkpointNameInput = document.getElementById('checkpointName');
const checkpointClueInput = document.getElementById('checkpointClue');
const checkpointOrderInput = document.getElementById('checkpointOrder');
const closeCheckpointBtn = document.getElementById('closeCheckpointBtn');
const cancelCheckpointBtn = document.getElementById('cancelCheckpointBtn');
const checkpointModalStatus = document.getElementById('checkpointModalStatus');
const checkpointStatus = document.getElementById('checkpointStatus');
const scavengerLeaderboard = document.getElementById('scavengerLeaderboard');

// State
let participants = [];
let teams = [];
let nextParticipantNumber = 1;
let currentEvent = null;
let currentTeam = null;
let currentPhotoParticipantCode = null;
let currentPhotoTeamName = null;
let checkpoints = [];
let currentCheckpoint = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initAdmin();
    initTabs();
});

/**
 * Initialize tabs functionality
 */
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');

            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(`${tabName}Tab`).classList.add('active');
        });
    });
}

async function initAdmin() {
    // Load event info
    await loadEventInfo();

    // Load teams
    await loadTeams();

    // Generate initial participant code
    await generateNextCode();

    // Load participants
    await loadParticipants();

    // Re-render teams now that participants are loaded
    renderTeams();

    // Load scavenger hunt data
    await loadCheckpoints();
    await loadScavengerLeaderboard();

    // Setup event listeners
    eventInfoForm.addEventListener('submit', handleSaveEventInfo);
    eventLogoInput.addEventListener('change', handleLogoPreview);
    removeLogo.addEventListener('click', handleRemoveLogo);

    // Team event listeners
    addTeamBtn.addEventListener('click', () => openTeamModal());
    teamForm.addEventListener('submit', handleSaveTeam);
    closeTeamBtn.addEventListener('click', closeTeamModal);
    cancelTeamBtn.addEventListener('click', closeTeamModal);

    // Photo modal event listeners
    closePhotoBtn.addEventListener('click', closePhotoModal);
    closePhotoModal2Btn.addEventListener('click', closePhotoModal);
    deletePhotoBtn.addEventListener('click', handleDeletePhoto);

    // Team photo modal event listeners
    closeTeamPhotoBtn.addEventListener('click', closeTeamPhotoModal);
    closeTeamPhotoModal2Btn.addEventListener('click', closeTeamPhotoModal);
    uploadTeamPhotoBtn.addEventListener('click', () => teamPhotoInput.click());
    teamPhotoInput.addEventListener('change', handleUploadTeamPhoto);
    deleteTeamPhotoBtn.addEventListener('click', handleDeleteTeamPhoto);

    addParticipantForm.addEventListener('submit', handleAddParticipant);
    editParticipantForm.addEventListener('submit', handleEditParticipant);
    closeEditBtn.addEventListener('click', closeEditModal);
    cancelEditBtn.addEventListener('click', closeEditModal);
    autoAssignTeamsBtn.addEventListener('click', autoAssignTeams);
    generateAllQRBtn.addEventListener('click', generateAllQRCodes);
    printQRBtn.addEventListener('click', showQRForPrint);

    // Scavenger hunt event listeners
    addCheckpointBtn.addEventListener('click', () => openCheckpointModal());
    checkpointForm.addEventListener('submit', handleSaveCheckpoint);
    closeCheckpointBtn.addEventListener('click', closeCheckpointModal);
    cancelCheckpointBtn.addEventListener('click', closeCheckpointModal);

    // Auto-generate new code when name changes
    firstNameInput.addEventListener('input', generateNextCode);
    lastNameInput.addEventListener('input', generateNextCode);
}

/**
 * Load event information
 */
async function loadEventInfo() {
    try {
        const response = await fetch('/api/event');
        if (!response.ok) {
            if (response.status === 404) {
                console.log('No event info found');
                return;
            }
            throw new Error('Failed to load event info');
        }

        currentEvent = await response.json();

        // Populate form
        eventNameInput.value = currentEvent.event_name || '';
        eventDescriptionInput.value = currentEvent.event_description || '';
        eventLocationInput.value = currentEvent.location || '';
        eventStartDateTimeInput.value = currentEvent.start_datetime || '';
        eventEndDateTimeInput.value = currentEvent.end_datetime || '';
        organizerNameInput.value = currentEvent.organizer_name || '';
        organizerClubInput.value = currentEvent.organizer_club || '';
        organizerContactInput.value = currentEvent.organizer_contact || '';

        // Show logo preview if exists
        if (currentEvent.logo_path) {
            logoPreviewImg.src = currentEvent.logo_path + '?t=' + Date.now();
            logoPreview.classList.remove('hidden');
        }

        // Update browser tab title
        if (currentEvent.event_name) {
            document.title = `${currentEvent.event_name} - Admin`;
        }

        console.log('Event info loaded:', currentEvent);
    } catch (err) {
        console.error('Error loading event info:', err);
    }
}

/**
 * Handle logo file preview
 */
function handleLogoPreview(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            logoPreviewImg.src = e.target.result;
            logoPreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Handle remove logo
 */
function handleRemoveLogo() {
    eventLogoInput.value = '';
    logoPreview.classList.add('hidden');
    logoPreviewImg.src = '';
}

/**
 * Handle save event info form submission
 */
async function handleSaveEventInfo(e) {
    e.preventDefault();

    const data = {
        event_name: eventNameInput.value.trim(),
        event_description: eventDescriptionInput.value.trim() || null,
        location: eventLocationInput.value.trim() || null,
        start_datetime: eventStartDateTimeInput.value || null,
        end_datetime: eventEndDateTimeInput.value || null,
        organizer_name: organizerNameInput.value.trim() || null,
        organizer_club: organizerClubInput.value.trim() || null,
        organizer_contact: organizerContactInput.value.trim() || null
    };

    // Validate
    if (!data.event_name) {
        showEventStatus('Arrangementsnavn er påkrevd', 'error');
        return;
    }

    try {
        let response;
        if (currentEvent && currentEvent.id) {
            // Update existing event
            response = await fetch(`/api/event/${currentEvent.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            // Create new event
            response = await fetch('/api/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save event info');
        }

        currentEvent = await response.json();

        // Upload logo if file is selected
        if (eventLogoInput.files.length > 0 && currentEvent.id) {
            const formData = new FormData();
            formData.append('logo', eventLogoInput.files[0]);

            const logoResponse = await fetch(`/api/event/${currentEvent.id}/logo`, {
                method: 'POST',
                body: formData
            });

            if (logoResponse.ok) {
                const logoResult = await logoResponse.json();
                currentEvent.logo_path = logoResult.logo_path;

                // Update preview with new logo path
                logoPreviewImg.src = currentEvent.logo_path + '?t=' + Date.now();
                logoPreview.classList.remove('hidden');

                // Clear file input
                eventLogoInput.value = '';
            } else {
                console.error('Failed to upload logo');
            }
        }

        showEventStatus('Arrangement-informasjon lagret!', 'success');
    } catch (err) {
        console.error('Error saving event info:', err);
        showEventStatus(err.message, 'error');
    }
}

/**
 * Show event status message
 */
function showEventStatus(message, type) {
    eventStatus.textContent = message;
    eventStatus.className = `alert ${type}`;
    eventStatus.classList.remove('hidden');

    setTimeout(() => {
        eventStatus.classList.add('hidden');
    }, 5000);
}

// ============================================================================
// TEAMS MANAGEMENT
// ============================================================================

/**
 * Load all teams from API
 */
async function loadTeams() {
    try {
        const response = await fetch('/api/teams');
        if (!response.ok) {
            throw new Error('Failed to load teams');
        }

        teams = await response.json();
        renderTeams();
        updateTeamDropdowns();
    } catch (err) {
        console.error('Error loading teams:', err);
        teamsList.innerHTML = `
            <div class="alert error">
                Kunne ikke laste lag: ${err.message}
            </div>
        `;
    }
}

/**
 * Render teams list
 */
function renderTeams() {
    if (teams.length === 0) {
        teamsList.innerHTML = `
            <p class="text-center" style="color: var(--text-light);">
                Ingen lag opprettet ennå.
            </p>
        `;
        return;
    }

    teamsList.innerHTML = teams.map(team => {
        const memberCount = participants.filter(p => p.role === 'Deltaker' && p.team === team.name).length;

        // Get team photo from any participant on this team
        const teamMember = participants.find(p => p.team === team.name && p.team_photo_path);
        const teamPhoto = teamMember?.team_photo_path;

        const photoHtml = teamPhoto
            ? `<div class="team-photo-container">
                   <img src="${teamPhoto}" alt="${team.name} lagbilde" class="team-photo">
               </div>`
            : '';

        return `
            <div class="team-card">
                <div class="team-card-header">
                    <h3>${team.name}</h3>
                    ${photoHtml}
                </div>
                ${team.description ? `<p>${team.description}</p>` : ''}
                <p><strong>Maks medlemmer:</strong> ${team.max_members}</p>
                <p><strong>Nåværende medlemmer:</strong> ${memberCount}</p>
                <div class="team-card-actions">
                    <button class="button secondary btn-small" onclick="viewTeamPhoto('${team.name.replace(/'/g, "\\'")}', ${teamPhoto ? `'${teamPhoto}'` : 'null'})">
                        📷 Bilde
                    </button>
                    <button class="button secondary btn-small" onclick="editTeam(${team.id})">
                        ✏️ Rediger
                    </button>
                    <button class="button secondary btn-small" onclick="deleteTeam(${team.id}, '${team.name}')">
                        🗑️ Slett
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Update team dropdowns with teams from database
 */
function updateTeamDropdowns() {
    const teamOptions = teams.map(team =>
        `<option value="${team.name}">${team.name}</option>`
    ).join('');

    // Update add participant team dropdown
    const addTeamSelect = document.getElementById('team');
    if (addTeamSelect) {
        const currentValue = addTeamSelect.value;
        addTeamSelect.innerHTML = `
            <option value="">Ikke tildelt</option>
            ${teamOptions}
        `;
        addTeamSelect.value = currentValue;
    }

    // Update edit participant team dropdown
    const editTeamSelect = document.getElementById('editTeam');
    if (editTeamSelect) {
        const currentValue = editTeamSelect.value;
        editTeamSelect.innerHTML = `
            <option value="">Ikke tildelt</option>
            ${teamOptions}
        `;
        editTeamSelect.value = currentValue;
    }
}

/**
 * Open team modal for adding or editing
 */
function openTeamModal(teamId = null) {
    if (teamId) {
        // Edit mode
        const team = teams.find(t => t.id === teamId);
        if (!team) return;

        teamModalTitle.textContent = 'Rediger Lag';
        teamIdInput.value = team.id;
        teamNameInput.value = team.name;
        teamDescriptionInput.value = team.description || '';
        teamMaxMembersInput.value = team.max_members;
        currentTeam = team;

        // Show team members section and populate it
        teamMembersSection.classList.remove('hidden');
        populateTeamMembers(team.name);
    } else {
        // Add mode
        teamModalTitle.textContent = 'Legg til Lag';
        teamForm.reset();
        teamIdInput.value = '';
        teamMaxMembersInput.value = 5;
        currentTeam = null;

        // Hide team members section for new teams
        teamMembersSection.classList.add('hidden');
    }

    teamModalStatus.classList.add('hidden');
    teamModal.classList.remove('hidden');
}

/**
 * Close team modal
 */
function closeTeamModal() {
    teamModal.classList.add('hidden');
    teamForm.reset();
    currentTeam = null;
}

/**
 * Populate team members list in the edit modal
 */
function populateTeamMembers(teamName) {
    // Filter participants who are on this team with role "Deltaker"
    const teamMembers = participants.filter(p =>
        p.team === teamName && p.role === 'Deltaker' && p.active
    );

    if (teamMembers.length === 0) {
        teamMembersList.innerHTML = '<p style="color: var(--text-light); text-align: center; padding: 20px;">Ingen deltakere på dette laget ennå</p>';
        return;
    }

    teamMembersList.innerHTML = teamMembers.map(member => `
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #f9f9f9; border-radius: 8px; border-left: 3px solid var(--primary-color);">
            ${member.profile_photo_path
                ? `<img src="${member.profile_photo_path}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #ddd;" alt="${member.first_name}">`
                : '<div style="width: 50px; height: 50px; border-radius: 50%; background: #ddd; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 2px solid #ccc;">👤</div>'
            }
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 600; font-size: 16px;">${member.first_name} ${member.last_name}</div>
                <div style="font-size: 14px; color: var(--text-light);">${member.participant_code}</div>
            </div>
            <button class="button secondary btn-small" onclick="removeParticipantFromTeam('${member.participant_code}', '${teamName}')" style="flex-shrink: 0;">
                🗑️ Fjern
            </button>
        </div>
    `).join('');
}

/**
 * Remove a participant from a team (global function for onclick)
 */
window.removeParticipantFromTeam = async function(participantCode, teamName) {
    const participant = participants.find(p => p.participant_code === participantCode);
    if (!participant) return;

    const confirmed = confirm(
        `Er du sikker på at du vil fjerne ${participant.first_name} ${participant.last_name} fra laget "${teamName}"?`
    );

    if (!confirmed) return;

    try {
        const response = await fetch(`/api/participants/${participantCode}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...participant,
                team: null
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to remove participant from team');
        }

        // Reload participants
        await loadParticipants();

        // Refresh the team members list
        populateTeamMembers(teamName);

        showTeamModalStatus(`${participant.first_name} fjernet fra laget`, 'success');

        // Also refresh teams to update member count
        await loadTeams();
    } catch (err) {
        console.error('Error removing participant from team:', err);
        showTeamModalStatus('Kunne ikke fjerne deltaker: ' + err.message, 'error');
    }
};

/**
 * Handle save team (create or update)
 */
async function handleSaveTeam(e) {
    e.preventDefault();

    const data = {
        name: teamNameInput.value.trim(),
        description: teamDescriptionInput.value.trim() || null,
        max_members: parseInt(teamMaxMembersInput.value) || 5
    };

    if (!data.name) {
        showTeamModalStatus('Lagnavn er påkrevd', 'error');
        return;
    }

    try {
        let response;
        if (teamIdInput.value) {
            // Update existing team
            response = await fetch(`/api/teams/${teamIdInput.value}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            // Create new team
            response = await fetch('/api/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save team');
        }

        await loadTeams();
        closeTeamModal();
        showTeamStatus(
            teamIdInput.value ? 'Laget ble oppdatert!' : 'Nytt lag opprettet!',
            'success'
        );
    } catch (err) {
        console.error('Error saving team:', err);
        showTeamModalStatus(err.message, 'error');
    }
}

/**
 * Edit team (global function for onclick)
 */
window.editTeam = function(teamId) {
    openTeamModal(teamId);
};

/**
 * Delete team (global function for onclick)
 */
window.deleteTeam = async function(teamId, teamName) {
    const confirmed = confirm(`Er du sikker på at du vil slette laget "${teamName}"?`);
    if (!confirmed) return;

    try {
        const response = await fetch(`/api/teams/${teamId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete team');
        }

        await loadTeams();
        showTeamStatus('Laget ble slettet', 'success');
    } catch (err) {
        console.error('Error deleting team:', err);
        showTeamStatus(err.message, 'error');
    }
};

/**
 * Show team modal status message
 */
function showTeamModalStatus(message, type) {
    teamModalStatus.textContent = message;
    teamModalStatus.className = `alert ${type}`;
    teamModalStatus.classList.remove('hidden');
}

/**
 * Show team status message
 */
function showTeamStatus(message, type) {
    teamStatus.textContent = message;
    teamStatus.className = `alert ${type}`;
    teamStatus.classList.remove('hidden');

    setTimeout(() => {
        teamStatus.classList.add('hidden');
    }, 5000);
}

// ============================================================================
// END TEAMS MANAGEMENT
// ============================================================================

// ============================================================================
// PHOTO MANAGEMENT
// ============================================================================

/**
 * Open photo modal to view and manage participant photo
 */
function openPhotoModal(participantCode, photoPath) {
    const participant = participants.find(p => p.participant_code === participantCode);
    if (!participant) return;

    currentPhotoParticipantCode = participantCode;
    photoModalTitle.textContent = `${participant.first_name} ${participant.last_name}`;
    photoModalImg.src = photoPath + '?t=' + Date.now(); // Cache bust
    photoModalStatus.classList.add('hidden');
    photoModal.classList.remove('hidden');
}

/**
 * Close photo modal
 */
function closePhotoModal() {
    photoModal.classList.add('hidden');
    photoModalImg.src = '';
    currentPhotoParticipantCode = null;
    photoModalStatus.classList.add('hidden');
}

/**
 * Handle delete photo
 */
async function handleDeletePhoto() {
    if (!currentPhotoParticipantCode) return;

    const participant = participants.find(p => p.participant_code === currentPhotoParticipantCode);
    if (!participant) return;

    const confirmed = confirm(
        `Er du sikker på at du vil slette bildet til ${participant.first_name} ${participant.last_name}?`
    );

    if (!confirmed) return;

    try {
        deletePhotoBtn.disabled = true;
        deletePhotoBtn.textContent = '⏳ Sletter...';

        const response = await fetch(`/api/participants/${currentPhotoParticipantCode}/photo`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete photo');
        }

        showPhotoModalStatus('Bildet ble slettet', 'success');

        // Reload participants and close modal after short delay
        setTimeout(async () => {
            await loadParticipants();
            closePhotoModal();
        }, 1000);

    } catch (err) {
        console.error('Error deleting photo:', err);
        showPhotoModalStatus('Kunne ikke slette bilde: ' + err.message, 'error');
    } finally {
        deletePhotoBtn.disabled = false;
        deletePhotoBtn.textContent = '🗑️ Slett bilde';
    }
}

/**
 * Show photo modal status message
 */
function showPhotoModalStatus(message, type) {
    photoModalStatus.textContent = message;
    photoModalStatus.className = `alert ${type}`;
    photoModalStatus.classList.remove('hidden');
}

// ============================================================================
// TEAM PHOTO MANAGEMENT
// ============================================================================

/**
 * Open team photo modal
 */
function viewTeamPhoto(teamName, photoPath) {
    currentPhotoTeamName = teamName;
    teamPhotoModalTitle.textContent = `${teamName} - Lagbilde`;
    teamPhotoModalStatus.classList.add('hidden');

    if (photoPath) {
        teamPhotoModalImg.src = photoPath + '?t=' + Date.now(); // Cache bust
        teamPhotoModalImg.classList.remove('hidden');
        teamPhotoPlaceholder.classList.add('hidden');
        deleteTeamPhotoBtn.disabled = false;
    } else {
        teamPhotoModalImg.classList.add('hidden');
        teamPhotoPlaceholder.classList.remove('hidden');
        deleteTeamPhotoBtn.disabled = true;
    }

    teamPhotoModal.classList.remove('hidden');
}

/**
 * Close team photo modal
 */
function closeTeamPhotoModal() {
    teamPhotoModal.classList.add('hidden');
    teamPhotoModalImg.src = '';
    currentPhotoTeamName = null;
    teamPhotoModalStatus.classList.add('hidden');
    teamPhotoInput.value = '';
}

/**
 * Handle upload team photo
 */
async function handleUploadTeamPhoto(e) {
    if (!e.target.files || e.target.files.length === 0) return;
    if (!currentPhotoTeamName) return;

    const file = e.target.files[0];

    try {
        uploadTeamPhotoBtn.disabled = true;
        uploadTeamPhotoBtn.textContent = '⏳ Laster opp...';

        const formData = new FormData();
        formData.append('photo', file);
        formData.append('team_name', currentPhotoTeamName);

        const response = await fetch('/api/team-challenge/teams/photo', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to upload photo');
        }

        showTeamPhotoModalStatus('Lagbilde lastet opp!', 'success');

        // Reload participants and update modal
        setTimeout(async () => {
            await loadParticipants();
            const teamMember = participants.find(p => p.team === currentPhotoTeamName && p.team_photo_path);
            if (teamMember) {
                viewTeamPhoto(currentPhotoTeamName, teamMember.team_photo_path);
            }
        }, 1000);

    } catch (err) {
        console.error('Error uploading team photo:', err);
        showTeamPhotoModalStatus('Kunne ikke laste opp bilde: ' + err.message, 'error');
    } finally {
        uploadTeamPhotoBtn.disabled = false;
        uploadTeamPhotoBtn.textContent = '📤 Last opp nytt bilde';
        teamPhotoInput.value = '';
    }
}

/**
 * Handle delete team photo
 */
async function handleDeleteTeamPhoto() {
    if (!currentPhotoTeamName) return;

    const confirmed = confirm(
        `Er du sikker på at du vil slette lagbildet for ${currentPhotoTeamName}?`
    );

    if (!confirmed) return;

    try {
        deleteTeamPhotoBtn.disabled = true;
        deleteTeamPhotoBtn.textContent = '⏳ Sletter...';

        const response = await fetch(`/api/team-challenge/teams/${encodeURIComponent(currentPhotoTeamName)}/photo`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete photo');
        }

        showTeamPhotoModalStatus('Lagbildet ble slettet', 'success');

        // Reload participants and close modal after short delay
        setTimeout(async () => {
            await loadParticipants();
            closeTeamPhotoModal();
        }, 1000);

    } catch (err) {
        console.error('Error deleting team photo:', err);
        showTeamPhotoModalStatus('Kunne ikke slette bilde: ' + err.message, 'error');
    } finally {
        deleteTeamPhotoBtn.disabled = false;
        deleteTeamPhotoBtn.textContent = '🗑️ Slett bilde';
    }
}

/**
 * Show team photo modal status message
 */
function showTeamPhotoModalStatus(message, type) {
    teamPhotoModalStatus.textContent = message;
    teamPhotoModalStatus.className = `alert ${type}`;
    teamPhotoModalStatus.classList.remove('hidden');
}

// Make viewTeamPhoto globally accessible
window.viewTeamPhoto = viewTeamPhoto;

// ============================================================================
// END TEAM PHOTO MANAGEMENT
// ============================================================================

// ============================================================================
// END PHOTO MANAGEMENT
// ============================================================================

/**
 * Generate next participant code (SK-YYYY-NNN)
 */
async function generateNextCode() {
    const year = new Date().getFullYear();

    // If we have participants, get the highest number
    if (participants.length > 0) {
        const codes = participants
            .map(p => p.participant_code)
            .filter(code => code.startsWith(`SK-${year}-`));

        if (codes.length > 0) {
            const numbers = codes.map(code => {
                const parts = code.split('-');
                return parseInt(parts[2]) || 0;
            });
            nextParticipantNumber = Math.max(...numbers) + 1;
        }
    }

    const code = `SK-${year}-${String(nextParticipantNumber).padStart(3, '0')}`;
    participantCodeInput.value = code;
}

/**
 * Load all participants from API
 */
async function loadParticipants() {
    try {
        const response = await fetch('/api/participants');
        if (!response.ok) {
            throw new Error('Failed to load participants');
        }

        participants = await response.json();
        renderParticipants();
    } catch (err) {
        console.error('Error loading participants:', err);
        participantsList.innerHTML = `
            <div class="alert error">
                Kunne ikke laste deltakere: ${err.message}
            </div>
        `;
    }
}

/**
 * Update team statistics
 */
function updateTeamStats() {
    // Count participants per team
    const teamCounts = {};
    const teamNames = teams.map(t => t.name);

    // Initialize all teams with 0
    teamNames.forEach(teamName => {
        teamCounts[teamName] = 0;
    });
    teamCounts['Ikke tildelt'] = 0;

    // Count participants (only those with role "Deltaker")
    participants.forEach(p => {
        if (p.role === 'Deltaker') {
            if (p.team && teamNames.includes(p.team)) {
                teamCounts[p.team]++;
            } else {
                teamCounts['Ikke tildelt']++;
            }
        }
    });

    // Render team stats - only show teams with participants
    const statsHTML = [
        ...teams
            .filter(team => teamCounts[team.name] > 0)
            .map(team => `
                <div class="team-stat-card">
                    <h3>${team.name}</h3>
                    <div class="count">${teamCounts[team.name]}</div>
                    <p>${teamCounts[team.name] === 1 ? 'deltaker' : 'deltakere'}</p>
                </div>
            `),
        `
            <div class="team-stat-card no-team">
                <h3>Ikke tildelt</h3>
                <div class="count">${teamCounts['Ikke tildelt']}</div>
                <p>${teamCounts['Ikke tildelt'] === 1 ? 'deltaker' : 'deltakere'}</p>
            </div>
        `
    ].join('');

    teamStats.innerHTML = statsHTML || '<p class="text-center" style="color: var(--text-light);">Ingen deltakere lagt til ennå.</p>';
}

/**
 * Auto-assign teams to unassigned participants
 */
async function autoAssignTeams() {
    // Get unassigned participants with role "Deltaker"
    const unassignedParticipants = participants.filter(p =>
        p.role === 'Deltaker' && (!p.team || p.team === '')
    );

    if (unassignedParticipants.length === 0) {
        showAutoAssignStatus('Alle deltakere er allerede tildelt et lag', 'info');
        return;
    }

    // Calculate average max members across all teams (default to 5 if no teams)
    const avgMaxMembers = teams.length > 0
        ? Math.round(teams.reduce((sum, t) => sum + t.max_members, 0) / teams.length)
        : 5;

    // Calculate number of teams needed
    const teamsNeeded = Math.ceil(unassignedParticipants.length / avgMaxMembers);

    // Confirm action
    const confirmed = confirm(
        `Dette vil tildele ${unassignedParticipants.length} deltaker(e) til ${teamsNeeded} lag. Fortsette?`
    );

    if (!confirmed) {
        return;
    }

    autoAssignTeamsBtn.disabled = true;
    autoAssignTeamsBtn.textContent = '⏳ Tildeler...';
    showAutoAssignStatus('Tildeler lag...', 'info');

    try {
        // Count current team sizes for "Deltaker" role only
        const teamCounts = new Map();
        teams.forEach(team => {
            const count = participants.filter(p => p.role === 'Deltaker' && p.team === team.name).length;
            teamCounts.set(team.name, count);
        });

        // Find teams that aren't full yet
        const availableTeams = teams.filter(team =>
            teamCounts.get(team.name) < team.max_members
        );

        // If we need more teams, add unused ones
        const unusedTeams = teams.filter(team => teamCounts.get(team.name) === 0);
        const teamsToUse = [];

        // First, use teams that have space
        for (const team of availableTeams) {
            if (teamsToUse.length < teamsNeeded) {
                teamsToUse.push(team);
            }
        }

        // Then add new teams if needed
        for (const team of unusedTeams) {
            if (teamsToUse.length < teamsNeeded && !teamsToUse.includes(team)) {
                teamsToUse.push(team);
            }
        }

        // Sort teams by current size (smallest first)
        teamsToUse.sort((a, b) => teamCounts.get(a.name) - teamCounts.get(b.name));

        // Shuffle unassigned participants for random distribution
        const shuffled = [...unassignedParticipants].sort(() => Math.random() - 0.5);

        // Assign participants to teams respecting max_members
        let assignedCount = 0;
        let teamIndex = 0;

        for (const participant of shuffled) {
            // Find next team that has space
            while (teamIndex < teamsToUse.length &&
                   teamCounts.get(teamsToUse[teamIndex].name) >= teamsToUse[teamIndex].max_members) {
                teamIndex++;
            }

            if (teamIndex >= teamsToUse.length) {
                console.warn('Not enough team space for all participants');
                break;
            }

            const assignedTeam = teamsToUse[teamIndex];

            // Update participant via API
            const response = await fetch(`/api/participants/${participant.participant_code}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ team: assignedTeam.name })
            });

            if (response.ok) {
                assignedCount++;
                teamCounts.set(assignedTeam.name, teamCounts.get(assignedTeam.name) + 1);

                // Update local state
                const index = participants.findIndex(p => p.participant_code === participant.participant_code);
                if (index !== -1) {
                    participants[index].team = assignedTeam.name;
                }
            } else {
                console.error(`Failed to assign team to ${participant.participant_code}`);
            }
        }

        // Reload participants and update display
        await loadParticipants();
        await loadTeams(); // Reload teams to update member counts

        const uniqueTeams = new Set(participants
            .filter(p => teamsToUse.some(t => t.name === p.team))
            .map(p => p.team)
        ).size;

        showAutoAssignStatus(
            `✅ ${assignedCount} deltaker(e) ble tildelt ${uniqueTeams} lag!`,
            'success'
        );

        // Hide status after 5 seconds
        setTimeout(() => {
            autoAssignStatus.classList.add('hidden');
        }, 5000);

    } catch (err) {
        console.error('Error auto-assigning teams:', err);
        showAutoAssignStatus('Kunne ikke tildele lag: ' + err.message, 'error');
    } finally {
        autoAssignTeamsBtn.disabled = false;
        autoAssignTeamsBtn.textContent = '🎲 Tildel lag automatisk';
    }
}

/**
 * Show auto-assign status message
 */
function showAutoAssignStatus(message, type) {
    autoAssignStatus.textContent = message;
    autoAssignStatus.className = `alert ${type}`;
    autoAssignStatus.classList.remove('hidden');
}

/**
 * Render participants list
 */
function renderParticipants() {
    participantCount.textContent = participants.length;

    // Update team statistics
    updateTeamStats();

    // Update team member counts in teams list
    renderTeams();

    if (participants.length === 0) {
        participantsList.innerHTML = `
            <p class="text-center" style="color: var(--text-light);">
                Ingen deltakere lagt til ennå.
            </p>
        `;
        return;
    }

    participantsList.innerHTML = participants.map(p => `
        <div class="participant-item">
            <div class="participant-info">
                <h3>${p.first_name} ${p.last_name}</h3>
                <p>
                    ${p.age ? p.age + ' år' : ''}
                    ${p.home_location ? '• ' + p.home_location : ''}
                    ${p.club ? '• ' + p.club : ''}
                    ${p.role ? '• ' + p.role : ''}
                    ${p.team ? '• ' + p.team : ''}
                </p>
                <p style="font-size: 12px; color: #999;">
                    ${p.participant_code}
                </p>
            </div>
            <div class="participant-actions">
                <button class="button secondary btn-small" onclick="editParticipant('${p.participant_code}')">✏️</button>
                ${p.qr_code_path
                    ? `<button class="button secondary btn-small" onclick="viewQR('${p.participant_code}')">👁️ QR</button>`
                    : `<button class="button primary btn-small" onclick="generateQR('${p.participant_code}')">📱 QR</button>`
                }
                ${p.profile_photo_path
                    ? `<button class="button secondary btn-small" onclick="viewPhoto('${p.participant_code}', '${p.profile_photo_path}')">📷 Bilde</button>`
                    : ''
                }
                <button class="button secondary btn-small" onclick="deleteParticipant('${p.participant_code}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

/**
 * Handle add participant form submission
 */
async function handleAddParticipant(e) {
    e.preventDefault();

    const data = {
        participant_code: participantCodeInput.value,
        first_name: firstNameInput.value.trim(),
        last_name: lastNameInput.value.trim(),
        age: ageInput.value ? parseInt(ageInput.value) : null,
        home_location: homeLocationInput.value.trim() || null,
        club: clubInput.value.trim() || null,
        role: roleInput.value || null,
        team: teamInput.value || null,
        notes: notesInput.value.trim() || null
    };

    // Validate
    if (!data.first_name || !data.last_name) {
        showFormStatus('Fornavn og etternavn er påkrevd', 'error');
        return;
    }

    try {
        // Add participant
        const response = await fetch('/api/participants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add participant');
        }

        const newParticipant = await response.json();

        // Generate QR code automatically
        await generateQR(newParticipant.participant_code, false);

        // Show success
        showFormStatus(`${data.first_name} ${data.last_name} lagt til!`, 'success');

        // Reset form
        addParticipantForm.reset();
        nextParticipantNumber++;
        await generateNextCode();

        // Reload participants
        await loadParticipants();
    } catch (err) {
        console.error('Error adding participant:', err);
        showFormStatus(err.message, 'error');
    }
}

/**
 * Show form status message
 */
function showFormStatus(message, type) {
    formStatus.textContent = message;
    formStatus.className = `alert ${type}`;
    formStatus.classList.remove('hidden');

    setTimeout(() => {
        formStatus.classList.add('hidden');
    }, 5000);
}

/**
 * Generate QR code for a participant
 */
async function generateQR(participantCode, showAlert = true) {
    try {
        const response = await fetch(`/api/qr/${participantCode}`);
        if (!response.ok) {
            throw new Error('Failed to generate QR code');
        }

        // QR code is generated and saved
        if (showAlert) {
            alert(`QR-kode generert for ${participantCode}`);
        }

        // Reload participants to update UI
        await loadParticipants();
    } catch (err) {
        console.error('Error generating QR:', err);
        if (showAlert) {
            alert('Kunne ikke generere QR-kode: ' + err.message);
        }
    }
}

/**
 * View QR code in new window
 */
function viewQR(participantCode) {
    window.open(`/api/qr/${participantCode}`, '_blank');
}

/**
 * Delete participant (soft delete)
 */
async function deleteParticipant(participantCode) {
    const participant = participants.find(p => p.participant_code === participantCode);
    if (!participant) return;

    const confirmed = confirm(
        `Er du sikker på at du vil slette ${participant.first_name} ${participant.last_name}?`
    );

    if (!confirmed) return;

    try {
        const response = await fetch(`/api/participants/${participantCode}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete participant');
        }

        alert('Deltaker slettet');
        await loadParticipants();
    } catch (err) {
        console.error('Error deleting participant:', err);
        alert('Kunne ikke slette deltaker: ' + err.message);
    }
}

/**
 * Generate QR codes for all participants
 */
async function generateAllQRCodes() {
    const confirmed = confirm(
        `Generer QR-koder for alle ${participants.length} deltakere?\n\nDette kan ta litt tid.`
    );

    if (!confirmed) return;

    generateAllQRBtn.disabled = true;
    generateAllQRBtn.textContent = '⏳ Genererer...';

    try {
        const response = await fetch('/api/qr/generate-batch', {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error('Failed to generate QR codes');
        }

        const result = await response.json();
        alert(`QR-koder generert!\n\nVellykket: ${result.results.filter(r => r.status === 'success').length}\nFeilet: ${result.results.filter(r => r.status === 'error').length}`);

        await loadParticipants();
    } catch (err) {
        console.error('Error generating QR codes:', err);
        alert('Kunne ikke generere QR-koder: ' + err.message);
    } finally {
        generateAllQRBtn.disabled = false;
        generateAllQRBtn.textContent = '🔄 Generer alle QR';
    }
}

/**
 * Show QR codes for printing
 */
async function showQRForPrint() {
    // Filter participants that have QR codes
    const withQR = participants.filter(p => p.qr_code_path);

    if (withQR.length === 0) {
        alert('Ingen QR-koder å printe. Generer QR-koder først.');
        return;
    }

    // Render QR grid
    qrGrid.innerHTML = withQR.map(p => `
        <div class="qr-card">
            <img src="/api/qr/${p.participant_code}" alt="${p.participant_code}">
            <h4>${p.first_name} ${p.last_name}</h4>
            <p>${p.participant_code}</p>
        </div>
    `).join('');

    // Show QR section
    qrSection.style.display = 'block';

    // Scroll to QR section
    qrSection.scrollIntoView({ behavior: 'smooth' });

    // Open print dialog after a short delay
    setTimeout(() => {
        window.print();
    }, 500);
}

/**
 * Open edit modal for a participant
 */
function editParticipant(participantCode) {
    const participant = participants.find(p => p.participant_code === participantCode);
    if (!participant) return;

    // Populate form
    editParticipantCodeInput.value = participant.participant_code;
    editFirstNameInput.value = participant.first_name;
    editLastNameInput.value = participant.last_name;
    editAgeInput.value = participant.age || '';
    editHomeLocationInput.value = participant.home_location || '';
    editClubInput.value = participant.club || '';
    editRoleInput.value = participant.role || '';
    editTeamInput.value = participant.team || '';
    editNotesInput.value = participant.notes || '';

    // Show modal
    editModal.classList.remove('hidden');
    editStatus.classList.add('hidden');
}

/**
 * Close edit modal
 */
function closeEditModal() {
    editModal.classList.add('hidden');
    editParticipantForm.reset();
    editStatus.classList.add('hidden');
}

/**
 * Handle edit participant form submission
 */
async function handleEditParticipant(e) {
    e.preventDefault();

    const code = editParticipantCodeInput.value;
    const data = {
        first_name: editFirstNameInput.value.trim(),
        last_name: editLastNameInput.value.trim(),
        age: editAgeInput.value ? parseInt(editAgeInput.value) : null,
        home_location: editHomeLocationInput.value.trim() || null,
        club: editClubInput.value.trim() || null,
        role: editRoleInput.value || null,
        team: editTeamInput.value || null,
        notes: editNotesInput.value.trim() || null
    };

    try {
        const response = await fetch(`/api/participants/${code}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update participant');
        }

        // Show success
        editStatus.textContent = 'Deltaker oppdatert!';
        editStatus.className = 'alert success';
        editStatus.classList.remove('hidden');

        // Close modal and reload after short delay
        setTimeout(() => {
            closeEditModal();
            loadParticipants();
        }, 1000);
    } catch (err) {
        console.error('Error updating participant:', err);
        editStatus.textContent = 'Kunne ikke oppdatere: ' + err.message;
        editStatus.className = 'alert error';
        editStatus.classList.remove('hidden');
    }
}

// ==============================================
// SCAVENGER HUNT FUNCTIONS
// ==============================================

/**
 * Load checkpoints from API
 */
async function loadCheckpoints() {
    try {
        const response = await fetch('/api/scavenger/checkpoints');
        if (!response.ok) {
            throw new Error('Failed to load checkpoints');
        }

        checkpoints = await response.json();
        renderCheckpoints();
    } catch (err) {
        console.error('Error loading checkpoints:', err);
        checkpointsList.innerHTML = '<p class="text-center" style="color: var(--error);">Kunne ikke laste checkpoints</p>';
    }
}

/**
 * Render checkpoints list
 */
function renderCheckpoints() {
    if (checkpoints.length === 0) {
        checkpointsList.innerHTML = '<p class="text-center" style="color: var(--text-light);">Ingen checkpoints opprettet ennå. Klikk "+ Nytt Checkpoint" for å legge til.</p>';
        return;
    }

    checkpointsList.innerHTML = checkpoints.map((checkpoint, index) => `
        <div class="card" style="position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: start; gap: 15px;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <span style="font-size: 24px; font-weight: bold; color: var(--primary-color);">#${checkpoint.order_number}</span>
                        <h3 style="margin: 0;">${checkpoint.name}</h3>
                        ${checkpoint.active ? '' : '<span style="background: #999; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Inaktiv</span>'}
                    </div>
                    <p style="margin: 10px 0; font-style: italic; color: var(--text-light);">"${checkpoint.clue}"</p>
                    <p style="font-size: 14px; color: var(--text-light); margin: 5px 0;">
                        <strong>QR-kode:</strong> <code>${checkpoint.qr_code}</code>
                    </p>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <button class="button secondary btn-small" onclick="editCheckpoint(${checkpoint.id})">
                        ✏️ Rediger
                    </button>
                    <button class="button secondary btn-small" onclick="printCheckpointQR(${checkpoint.id})">
                        🖨️ Print QR
                    </button>
                    <button class="button secondary btn-small" onclick="deleteCheckpoint(${checkpoint.id}, '${checkpoint.name.replace(/'/g, "\\'")}')">
                        🗑️ Slett
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Open checkpoint modal for adding or editing
 */
function openCheckpointModal(checkpointId = null) {
    if (checkpointId) {
        // Edit mode
        const checkpoint = checkpoints.find(c => c.id === checkpointId);
        if (!checkpoint) return;

        checkpointModalTitle.textContent = 'Rediger Checkpoint';
        checkpointIdInput.value = checkpoint.id;
        checkpointNameInput.value = checkpoint.name;
        checkpointClueInput.value = checkpoint.clue;
        checkpointOrderInput.value = checkpoint.order_number;
        currentCheckpoint = checkpoint;
    } else {
        // Add mode
        checkpointModalTitle.textContent = 'Legg til Checkpoint';
        checkpointForm.reset();
        checkpointIdInput.value = '';
        checkpointOrderInput.value = checkpoints.length + 1;
        currentCheckpoint = null;
    }

    checkpointModalStatus.classList.add('hidden');
    checkpointModal.classList.remove('hidden');
}

/**
 * Close checkpoint modal
 */
function closeCheckpointModal() {
    checkpointModal.classList.add('hidden');
    checkpointForm.reset();
    currentCheckpoint = null;
}

/**
 * Handle save checkpoint (create or update)
 */
async function handleSaveCheckpoint(e) {
    e.preventDefault();

    const data = {
        name: checkpointNameInput.value.trim(),
        clue: checkpointClueInput.value.trim(),
        order_number: parseInt(checkpointOrderInput.value) || 1,
        active: 1
    };

    if (!data.name || !data.clue) {
        showCheckpointModalStatus('Navn og ledetråd er påkrevd', 'error');
        return;
    }

    try {
        let response;
        if (checkpointIdInput.value) {
            // Update existing checkpoint
            response = await fetch(`/api/scavenger/checkpoints/${checkpointIdInput.value}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            // Create new checkpoint
            response = await fetch('/api/scavenger/checkpoints', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save checkpoint');
        }

        await loadCheckpoints();
        closeCheckpointModal();
        showCheckpointStatus(
            checkpointIdInput.value ? 'Checkpoint oppdatert!' : 'Nytt checkpoint opprettet!',
            'success'
        );
    } catch (err) {
        console.error('Error saving checkpoint:', err);
        showCheckpointModalStatus(err.message, 'error');
    }
}

/**
 * Edit checkpoint (global function for onclick)
 */
window.editCheckpoint = function(checkpointId) {
    openCheckpointModal(checkpointId);
};

/**
 * Delete checkpoint (global function for onclick)
 */
window.deleteCheckpoint = async function(checkpointId, checkpointName) {
    const confirmed = confirm(`Er du sikker på at du vil slette checkpoint "${checkpointName}"?`);
    if (!confirmed) return;

    try {
        const response = await fetch(`/api/scavenger/checkpoints/${checkpointId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete checkpoint');
        }

        await loadCheckpoints();
        showCheckpointStatus('Checkpoint slettet', 'success');
    } catch (err) {
        console.error('Error deleting checkpoint:', err);
        showCheckpointStatus(err.message, 'error');
    }
};

/**
 * Print checkpoint QR code (global function for onclick)
 */
window.printCheckpointQR = function(checkpointId) {
    const checkpoint = checkpoints.find(c => c.id === checkpointId);
    if (!checkpoint) return;

    // Create print window with server-generated QR code
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="no">
        <head>
            <meta charset="UTF-8">
            <title>QR - ${checkpoint.name}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding: 40px 20px;
                    margin: 0;
                }
                h1 {
                    color: #2c5f2d;
                    margin-bottom: 20px;
                    font-size: 28px;
                }
                .clue {
                    font-size: 20px;
                    font-style: italic;
                    color: #666;
                    margin: 30px auto;
                    padding: 20px;
                    background: #f5f5f5;
                    border-radius: 8px;
                    max-width: 600px;
                    line-height: 1.6;
                }
                .qr-code {
                    margin: 40px 0;
                }
                .qr-code img {
                    max-width: 400px;
                    width: 100%;
                    height: auto;
                    border: 3px solid #2c5f2d;
                    border-radius: 8px;
                    padding: 10px;
                    background: white;
                }
                .instructions {
                    font-size: 16px;
                    color: #999;
                    margin-top: 30px;
                }
                .print-btn {
                    margin-top: 30px;
                    padding: 15px 30px;
                    font-size: 18px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                }
                .print-btn:hover {
                    background: #2c5f2d;
                }
                @media print {
                    .no-print {
                        display: none;
                    }
                    body {
                        padding: 20px;
                    }
                }
            </style>
        </head>
        <body>
            <h1>🎯 Sjekkpunkt #${checkpoint.order_number}: ${checkpoint.name}</h1>
            <div class="clue">"${checkpoint.clue}"</div>
            <div class="qr-code">
                <img src="/api/scavenger/checkpoint-qr/${checkpoint.id}" alt="QR Code">
            </div>
            <div class="instructions">
                Skann denne QR-koden når dere finner sjekkpunktet!
            </div>
            <button class="print-btn no-print" onclick="window.print();">
                🖨️ Print denne siden
            </button>
        </body>
        </html>
    `);
    printWindow.document.close();
};

/**
 * Load scavenger hunt leaderboard
 */
async function loadScavengerLeaderboard() {
    try {
        const response = await fetch('/api/scavenger/live-scoreboard');
        if (!response.ok) {
            throw new Error('Failed to load scoreboard');
        }

        const data = await response.json();
        await renderScavengerLeaderboard(data);
    } catch (err) {
        console.error('Error loading scavenger leaderboard:', err);
        scavengerLeaderboard.innerHTML = '<p class="text-center" style="color: var(--error);">Kunne ikke laste scoreboard</p>';
    }
}

/**
 * Render scavenger hunt leaderboard with detailed scans
 */
async function renderScavengerLeaderboard(data) {
    if (!data.scoreboard || data.scoreboard.length === 0) {
        scavengerLeaderboard.innerHTML = '<p class="text-center" style="color: var(--text-light); padding: 40px 20px;">Ingen lag har startet skattejakt ennå</p>';
        return;
    }

    // Get detailed scan info for each team
    const detailedScoreboard = await Promise.all(data.scoreboard.map(async (entry) => {
        try {
            const response = await fetch(`/api/scavenger/session/${encodeURIComponent(entry.team_name)}`);
            if (response.ok) {
                const sessionData = await response.json();
                return {
                    ...entry,
                    session: sessionData.session,
                    scans: sessionData.scans || []
                };
            }
        } catch (err) {
            console.error(`Error loading session for ${entry.team_name}:`, err);
        }
        return entry;
    }));

    scavengerLeaderboard.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 15px;">
            ${detailedScoreboard.map((entry, index) => {
                const rank = index + 1;
                const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
                const statusBadge = entry.status === 'completed'
                    ? '<span style="background: #4CAF50; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Fullført</span>'
                    : '<span style="background: #FFC107; color: black; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Pågår</span>';

                const scansHtml = entry.scans && entry.scans.length > 0
                    ? `
                        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                            <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: var(--text-dark);">
                                Funnet sjekkpunkter:
                            </div>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                ${entry.scans.map(scan => `
                                    <div style="display: flex; align-items: center; gap: 8px; background: #e8f5e9; padding: 6px 12px; border-radius: 8px; font-size: 13px;">
                                        <span>✅ #${scan.order_number}: ${scan.name}</span>
                                        <button
                                            onclick="deleteScan(${scan.id}, '${entry.team_name}', '${scan.name}')"
                                            class="button secondary btn-small"
                                            style="padding: 2px 8px; font-size: 11px; margin: 0;">
                                            🗑️
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `
                    : '<div style="margin-top: 10px; padding: 8px; background: #f5f5f5; border-radius: 8px; font-size: 13px; color: var(--text-light); text-align: center;">Ingen sjekkpunkter funnet ennå</div>';

                return `
                    <div class="card" style="padding: 20px;">
                        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
                            <div style="font-size: 32px; min-width: 50px; text-align: center;">
                                ${rankEmoji}
                            </div>
                            <div style="flex: 1;">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                                    <span style="font-size: 20px; font-weight: bold;">${entry.team_name}</span>
                                    ${statusBadge}
                                </div>
                                <div style="font-size: 16px; color: var(--text-light);">
                                    ⏱️ ${formatTime(entry.elapsed_seconds)} •
                                    ✅ ${entry.checkpoints_found}/${entry.total_checkpoints} sjekkpunkter
                                </div>
                            </div>
                        </div>
                        ${scansHtml}
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Delete a scan (global function for onclick)
 */
window.deleteScan = async function(scanId, teamName, checkpointName) {
    if (!confirm(`Vil du slette registreringen av "${checkpointName}" for ${teamName}?\n\nDette kan ikke angres.`)) {
        return;
    }

    try {
        const response = await fetch(`/api/scavenger/scan/${scanId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete scan');
        }

        alert('Skanningen ble slettet');
        await loadScavengerLeaderboard();
    } catch (err) {
        console.error('Error deleting scan:', err);
        alert('Kunne ikke slette skanning: ' + err.message);
    }
};

/**
 * Format seconds to MM:SS
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Show checkpoint modal status message
 */
function showCheckpointModalStatus(message, type) {
    checkpointModalStatus.textContent = message;
    checkpointModalStatus.className = `alert ${type}`;
    checkpointModalStatus.classList.remove('hidden');
}

/**
 * Show checkpoint status message
 */
function showCheckpointStatus(message, type) {
    checkpointStatus.textContent = message;
    checkpointStatus.className = `alert ${type}`;
    checkpointStatus.classList.remove('hidden');
    setTimeout(() => {
        checkpointStatus.classList.add('hidden');
    }, 3000);
}

// ==============================================
// END SCAVENGER HUNT FUNCTIONS
// ==============================================

// Make functions globally available
window.editParticipant = editParticipant;
window.viewPhoto = function(participantCode, photoPath) {
    openPhotoModal(participantCode, photoPath);
};
