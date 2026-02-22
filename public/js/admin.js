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
const allowQrUploadInput = document.getElementById('allowQrUpload');
const enableQuizMusicInput = document.getElementById('enableQuizMusic');
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
const bulkCreateTeamsBtn = document.getElementById('bulkCreateTeamsBtn');
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

// Quiz elements
const questionsList = document.getElementById('questionsList');
const addQuestionBtn = document.getElementById('addQuestionBtn');
const questionModal = document.getElementById('questionModal');
const questionModalTitle = document.getElementById('questionModalTitle');
const questionForm = document.getElementById('questionForm');
const questionIdInput = document.getElementById('questionId');
const questionTextInput = document.getElementById('questionText');
const questionImageInput = document.getElementById('questionImage');
const questionImagePreview = document.getElementById('questionImagePreview');
const questionImagePreviewImg = document.getElementById('questionImagePreviewImg');
const removeQuestionImageBtn = document.getElementById('removeQuestionImage');
const optionAInput = document.getElementById('optionA');
const optionBInput = document.getElementById('optionB');
const optionCInput = document.getElementById('optionC');
const optionDInput = document.getElementById('optionD');
const questionTimeLimitInput = document.getElementById('questionTimeLimit');
const questionOrderInput = document.getElementById('questionOrder');
const closeQuestionBtn = document.getElementById('closeQuestionBtn');
const cancelQuestionBtn = document.getElementById('cancelQuestionBtn');
const questionModalStatus = document.getElementById('questionModalStatus');
const questionStatus = document.getElementById('questionStatus');
const quizLeaderboard = document.getElementById('quizLeaderboard');

// Program elements
const programList = document.getElementById('programList');
const addProgramBtn = document.getElementById('addProgramBtn');
const programModal = document.getElementById('programModal');
const programModalTitle = document.getElementById('programModalTitle');
const programForm = document.getElementById('programForm');
const programIdInput = document.getElementById('programId');
const programTitleInput = document.getElementById('programTitle');
const programDescriptionInput = document.getElementById('programDescription');
const programStartTimeInput = document.getElementById('programStartTime');
const programEndTimeInput = document.getElementById('programEndTime');
const programLocationInput = document.getElementById('programLocation');
const programDayInput = document.getElementById('programDay');
const closeProgramBtn = document.getElementById('closeProgramBtn');
const cancelProgramBtn = document.getElementById('cancelProgramBtn');
const programModalStatus = document.getElementById('programModalStatus');
const programStatus = document.getElementById('programStatus');

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
let programItems = [];
let currentProgramItem = null;
let questions = [];
let currentQuestion = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initAdmin();
    initTabs();

    // Auto-refresh feedback badge every 30 seconds
    setInterval(updateFeedbackBadge, 30000);
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

    // Load tic-tac-toe data
    await loadTicTacToeGames();

    // Load quiz data
    await loadQuizQuestions();
    await loadQuizLeaderboard();

    // Load courses
    await loadCourses();

    // Load program data
    await loadProgram();

    // Load photo challenges
    await loadPhotoChallenges();
    await loadPhotoSubmissions();
    await loadPhotoChallengeLeaderboard();

    // Load feedback
    await loadFeedback();

    // Setup event listeners
    eventInfoForm.addEventListener('submit', handleSaveEventInfo);
    eventLogoInput.addEventListener('change', handleLogoPreview);
    removeLogo.addEventListener('click', handleRemoveLogo);

    // Team event listeners
    addTeamBtn.addEventListener('click', () => openTeamModal());
    bulkCreateTeamsBtn.addEventListener('click', bulkCreateTeams);
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

    // Quiz event listeners
    addQuestionBtn.addEventListener('click', () => openQuestionModal());
    questionForm.addEventListener('submit', handleSaveQuestion);
    closeQuestionBtn.addEventListener('click', closeQuestionModal);
    cancelQuestionBtn.addEventListener('click', closeQuestionModal);
    questionImageInput.addEventListener('change', handleQuestionImagePreview);
    removeQuestionImageBtn.addEventListener('click', handleRemoveQuestionImage);

    // Program event listeners
    addProgramBtn.addEventListener('click', () => openProgramModal());
    programForm.addEventListener('submit', handleSaveProgram);
    closeProgramBtn.addEventListener('click', closeProgramModal);
    cancelProgramBtn.addEventListener('click', closeProgramModal);

    // Database management event listeners
    document.getElementById('loadDummyDataBtn').addEventListener('click', loadDummyData);
    document.getElementById('resetDatabaseBtn').addEventListener('click', resetDatabase);

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
        allowQrUploadInput.checked = currentEvent.allow_qr_upload === 1;
        enableQuizMusicInput.checked = currentEvent.enable_quiz_music !== 0; // Default to true if undefined

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
        organizer_contact: organizerContactInput.value.trim() || null,
        allow_qr_upload: allowQrUploadInput.checked ? 1 : 0,
        enable_quiz_music: enableQuizMusicInput.checked ? 1 : 0
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
 * Bulk create teams with auto-generated names
 */
async function bulkCreateTeams() {
    const count = prompt('Hvor mange lag vil du opprette? (1-50)');

    if (!count) return; // User cancelled

    const numTeams = parseInt(count);

    if (isNaN(numTeams) || numTeams < 1 || numTeams > 50) {
        alert('Vennligst skriv inn et tall mellom 1 og 50');
        return;
    }

    const confirmation = confirm(
        `Vil du opprette ${numTeams} nye lag med auto-genererte navn?\n\n` +
        `Navnene vil følge mønsteret: Adjektiv + Substantiv som starter på samme bokstav.\n\n` +
        `Eksempel: "Blide Bjørner", "Raske Rever", "Glade Geiter"`
    );

    if (!confirmation) return;

    const teamStatus = document.getElementById('teamStatus');
    teamStatus.textContent = `Oppretter ${numTeams} lag...`;
    teamStatus.style.background = '#e3f2fd';
    teamStatus.style.color = '#1565C0';
    teamStatus.classList.remove('hidden');

    try {
        const response = await fetch('/api/admin/bulk-create-teams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count: numTeams })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Kunne ikke opprette lag');
        }

        const result = await response.json();

        teamStatus.textContent = `✅ ${result.message}! Lag opprettet: ${result.teams.join(', ')}`;
        teamStatus.style.background = '#c8e6c9';
        teamStatus.style.color = '#2e7d32';

        // Reload teams list
        await loadTeams();

        setTimeout(() => {
            teamStatus.classList.add('hidden');
        }, 8000);

    } catch (error) {
        console.error('Error creating teams:', error);
        teamStatus.textContent = `❌ ${error.message}`;
        teamStatus.style.background = '#ffcdd2';
        teamStatus.style.color = '#c62828';

        setTimeout(() => {
            teamStatus.classList.add('hidden');
        }, 5000);
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

    // Count available teams
    const teamCounts = new Map();
    teams.forEach(team => {
        const count = participants.filter(p => p.role === 'Deltaker' && p.team === team.name).length;
        teamCounts.set(team.name, count);
    });

    const availableTeams = teams.filter(team =>
        teamCounts.get(team.name) < team.max_members
    );

    if (availableTeams.length === 0) {
        showAutoAssignStatus('Alle lag er fulle. Opprett flere lag først.', 'warning');
        return;
    }

    const totalAvailableSlots = availableTeams.reduce((sum, team) =>
        sum + (team.max_members - teamCounts.get(team.name)), 0
    );

    // Confirm action
    const confirmed = confirm(
        `Dette vil tildele ${unassignedParticipants.length} deltaker(e) til tilgjengelige lag.\n` +
        `Det er ${availableTeams.length} lag med ${totalAvailableSlots} ledige plasser.\n\n` +
        `Fortsette?`
    );

    if (!confirmed) {
        return;
    }

    autoAssignTeamsBtn.disabled = true;
    autoAssignTeamsBtn.textContent = '⏳ Tildeler...';
    showAutoAssignStatus('Tildeler lag...', 'info');

    try {
        // Use ALL teams that have available space (already calculated above)
        const teamsToUse = availableTeams.slice(); // Make a copy

        // Sort teams by current size (smallest first) to fill evenly
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

// ==============================================
// TIC-TAC-TOE ADMIN FUNCTIONS
// ==============================================

/**
 * Load and display tic-tac-toe games
 */
async function loadTicTacToeGames() {
    const gamesList = document.getElementById('ticTacToeGamesList');

    try {
        const response = await fetch('/api/tic-tac-toe/games');
        if (!response.ok) {
            throw new Error('Failed to load games');
        }

        const data = await response.json();

        if (!data.games || data.games.length === 0) {
            gamesList.innerHTML = '<p class="text-center" style="color: var(--text-light); padding: 40px;">Ingen fullførte spill ennå</p>';
            return;
        }

        // Render games list
        gamesList.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 15px;">
                ${data.games.map(game => {
                    const resultText = game.result === 'draw'
                        ? '🤝 Uavgjort'
                        : `🏆 ${game.winner_name} vant`;

                    const date = new Date(game.completed_at);
                    const dateStr = date.toLocaleString('nb-NO', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    return `
                        <div class="card" style="display: flex; justify-content: space-between; align-items: center; padding: 20px;">
                            <div style="flex: 1;">
                                <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">
                                    ${game.player1_name} (X) vs ${game.player2_name} (O)
                                </div>
                                <div style="color: var(--text-light); font-size: 14px; margin-bottom: 5px;">
                                    ${resultText}
                                </div>
                                <div style="color: var(--text-light); font-size: 14px;">
                                    Fullført: ${dateStr}
                                </div>
                            </div>
                            <button
                                onclick="deleteTicTacToeGame(${game.id}, '${game.player1_name}', '${game.player2_name}')"
                                class="button secondary btn-small"
                                style="white-space: nowrap;">
                                🗑️ Slett spill
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } catch (err) {
        console.error('Error loading tic-tac-toe games:', err);
        gamesList.innerHTML = '<p class="text-center" style="color: var(--error);">Kunne ikke laste spill</p>';
    }
}

/**
 * Delete a tic-tac-toe game
 */
window.deleteTicTacToeGame = async function(gameId, player1, player2) {
    if (!confirm(`Vil du slette spillet mellom ${player1} og ${player2}?\n\nDette vil fjerne resultatet fra statistikken.\n\nDette kan ikke angres.`)) {
        return;
    }

    try {
        const response = await fetch(`/api/tic-tac-toe/game/${gameId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete game');
        }

        alert('Spillet ble slettet og statistikken er oppdatert');
        await loadTicTacToeGames();
    } catch (err) {
        console.error('Error deleting game:', err);
        alert('Kunne ikke slette spill: ' + err.message);
    }
};

// ==============================================
// END TIC-TAC-TOE FUNCTIONS
// ==============================================

// ==============================================
// QUIZ FUNCTIONS
// ==============================================

/**
 * Load quiz questions from API
 */
async function loadQuizQuestions() {
    try {
        const response = await fetch('/api/quiz/questions');
        if (!response.ok) {
            throw new Error('Failed to load questions');
        }

        questions = await response.json();
        renderQuestions();
    } catch (err) {
        console.error('Error loading questions:', err);
        questionsList.innerHTML = '<p class="text-center" style="color: var(--error);">Kunne ikke laste spørsmål</p>';
    }
}

/**
 * Render questions list
 */
function renderQuestions() {
    if (questions.length === 0) {
        questionsList.innerHTML = '<p class="text-center" style="color: var(--text-light);">Ingen spørsmål opprettet ennå. Klikk "+ Nytt Spørsmål" for å legge til.</p>';
        return;
    }

    questionsList.innerHTML = questions.map((question, index) => {
        const correctAnswers = question.correct_option ? question.correct_option.split(',') : [];

        return `
        <div class="card" style="position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: start; gap: 15px;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <span style="font-size: 24px; font-weight: bold; color: var(--primary-color);">#${question.order_number}</span>
                        <h3 style="margin: 0;">Spørsmål ${index + 1}</h3>
                        <span style="background: #2196F3; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">⏱️ ${question.time_limit_seconds || 30}s</span>
                        ${question.active ? '' : '<span style="background: #999; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Inaktiv</span>'}
                    </div>
                    <p style="margin: 10px 0; color: var(--text-dark);">${question.question_text}</p>
                    ${question.image_path ? `<div style="margin: 10px 0;"><img src="${question.image_path}" style="max-width: 200px; border-radius: 8px; border: 2px solid #ddd;" alt="Question image"></div>` : ''}
                    <div style="margin: 15px 0; padding: 10px; background: #f9f9f9; border-radius: 8px;">
                        <div style="font-size: 14px; margin-bottom: 8px;">
                            <strong>A:</strong> ${question.option_a}
                            ${correctAnswers.includes('A') ? '<span style="color: #4CAF50; margin-left: 8px;">✓</span>' : ''}
                        </div>
                        <div style="font-size: 14px; margin-bottom: 8px;">
                            <strong>B:</strong> ${question.option_b}
                            ${correctAnswers.includes('B') ? '<span style="color: #4CAF50; margin-left: 8px;">✓</span>' : ''}
                        </div>
                        <div style="font-size: 14px; margin-bottom: 8px;">
                            <strong>C:</strong> ${question.option_c}
                            ${correctAnswers.includes('C') ? '<span style="color: #4CAF50; margin-left: 8px;">✓</span>' : ''}
                        </div>
                        <div style="font-size: 14px;">
                            <strong>D:</strong> ${question.option_d}
                            ${correctAnswers.includes('D') ? '<span style="color: #4CAF50; margin-left: 8px;">✓</span>' : ''}
                        </div>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <button class="button secondary btn-small" onclick="editQuestion(${question.id})">
                        ✏️ Rediger
                    </button>
                    <button class="button secondary btn-small" onclick="deleteQuestion(${question.id})">
                        🗑️ Slett
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

/**
 * Open question modal for adding or editing
 */
function openQuestionModal(questionId = null) {
    if (questionId) {
        // Edit mode
        const question = questions.find(q => q.id === questionId);
        if (!question) return;

        questionModalTitle.textContent = 'Rediger Spørsmål';
        questionIdInput.value = question.id;
        questionTextInput.value = question.question_text;
        optionAInput.value = question.option_a;
        optionBInput.value = question.option_b;
        optionCInput.value = question.option_c;
        optionDInput.value = question.option_d;
        questionTimeLimitInput.value = question.time_limit_seconds || 30;
        questionOrderInput.value = question.order_number;

        // Clear all checkboxes first
        document.querySelectorAll('.correct-option-checkbox').forEach(cb => cb.checked = false);

        // Set correct option checkboxes (support comma-separated values)
        const correctAnswers = question.correct_option ? question.correct_option.split(',') : [];
        correctAnswers.forEach(answer => {
            const checkbox = document.querySelector(`.correct-option-checkbox[value="${answer.trim()}"]`);
            if (checkbox) checkbox.checked = true;
        });

        // Show image preview if exists
        if (question.image_path) {
            questionImagePreviewImg.src = question.image_path + '?t=' + Date.now();
            questionImagePreview.classList.remove('hidden');
        }

        currentQuestion = question;
    } else {
        // Add mode
        questionModalTitle.textContent = 'Legg til Spørsmål';
        questionForm.reset();
        questionIdInput.value = '';
        questionTimeLimitInput.value = 30;
        questionOrderInput.value = questions.length + 1;
        questionImagePreview.classList.add('hidden');

        // Clear all checkboxes
        document.querySelectorAll('.correct-option-checkbox').forEach(cb => cb.checked = false);

        currentQuestion = null;
    }

    questionModalStatus.classList.add('hidden');
    questionModal.classList.remove('hidden');
}

/**
 * Close question modal
 */
function closeQuestionModal() {
    questionModal.classList.add('hidden');
    questionForm.reset();
    questionImagePreview.classList.add('hidden');
    currentQuestion = null;
}

/**
 * Handle question image preview
 */
function handleQuestionImagePreview(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            questionImagePreviewImg.src = e.target.result;
            questionImagePreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Handle remove question image
 */
function handleRemoveQuestionImage() {
    questionImageInput.value = '';
    questionImagePreview.classList.add('hidden');
    questionImagePreviewImg.src = '';

    // If editing and image exists, mark for deletion
    if (currentQuestion && currentQuestion.image_path) {
        deleteQuestionImageOnServer(currentQuestion.id);
    }
}

/**
 * Delete question image on server
 */
async function deleteQuestionImageOnServer(questionId) {
    try {
        const response = await fetch(`/api/quiz/questions/${questionId}/image`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete image');
        }

        // Reload questions to get updated data
        await loadQuizQuestions();
    } catch (err) {
        console.error('Error deleting question image:', err);
    }
}

/**
 * Handle save question (create or update)
 */
async function handleSaveQuestion(e) {
    e.preventDefault();

    // Get correct options from checkboxes (can be multiple)
    const checkedBoxes = document.querySelectorAll('.correct-option-checkbox:checked');
    if (checkedBoxes.length === 0) {
        showQuestionModalStatus('Du må velge minst ett riktig svar', 'error');
        return;
    }

    const correctOptions = Array.from(checkedBoxes).map(cb => cb.value).sort().join(',');

    const data = {
        question_text: questionTextInput.value.trim(),
        option_a: optionAInput.value.trim(),
        option_b: optionBInput.value.trim(),
        option_c: optionCInput.value.trim(),
        option_d: optionDInput.value.trim(),
        correct_option: correctOptions,
        time_limit_seconds: parseInt(questionTimeLimitInput.value) || 30,
        order_number: parseInt(questionOrderInput.value) || 999,
        active: 1
    };

    if (!data.question_text || !data.option_a || !data.option_b || !data.option_c || !data.option_d) {
        showQuestionModalStatus('Alle felter er påkrevd', 'error');
        return;
    }

    try {
        let response;
        let questionId = questionIdInput.value;

        if (questionId) {
            // Update existing question
            response = await fetch(`/api/quiz/questions/${questionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            // Create new question
            response = await fetch('/api/quiz/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save question');
        }

        const savedQuestion = await response.json();
        questionId = savedQuestion.id;

        // Upload image if file is selected
        if (questionImageInput.files.length > 0) {
            const formData = new FormData();
            formData.append('image', questionImageInput.files[0]);

            const imageResponse = await fetch(`/api/quiz/questions/${questionId}/image`, {
                method: 'POST',
                body: formData
            });

            if (!imageResponse.ok) {
                console.error('Failed to upload image');
            }
        }

        await loadQuizQuestions();
        closeQuestionModal();
        showQuestionStatus(
            questionIdInput.value ? 'Spørsmål oppdatert!' : 'Nytt spørsmål opprettet!',
            'success'
        );
    } catch (err) {
        console.error('Error saving question:', err);
        showQuestionModalStatus(err.message, 'error');
    }
}

/**
 * Edit question (global function for onclick)
 */
window.editQuestion = function(questionId) {
    openQuestionModal(questionId);
};

/**
 * Delete question (global function for onclick)
 */
window.deleteQuestion = async function(questionId) {
    const confirmed = confirm('Er du sikker på at du vil slette dette spørsmålet?');
    if (!confirmed) return;

    try {
        const response = await fetch(`/api/quiz/questions/${questionId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete question');
        }

        await loadQuizQuestions();
        showQuestionStatus('Spørsmål slettet', 'success');
    } catch (err) {
        console.error('Error deleting question:', err);
        showQuestionStatus(err.message, 'error');
    }
};

/**
 * Load quiz leaderboard
 */
async function loadQuizLeaderboard() {
    try {
        const response = await fetch('/api/quiz/leaderboard');
        if (!response.ok) {
            throw new Error('Failed to load leaderboard');
        }

        const data = await response.json();
        renderQuizLeaderboard(data);
    } catch (err) {
        console.error('Error loading quiz leaderboard:', err);
        quizLeaderboard.innerHTML = '<p class="text-center" style="color: var(--error);">Kunne ikke laste resultattavle</p>';
    }
}

/**
 * Render quiz leaderboard
 */
function renderQuizLeaderboard(data) {
    if (!data.leaderboard || data.leaderboard.length === 0) {
        quizLeaderboard.innerHTML = '<p class="text-center" style="color: var(--text-light); padding: 40px 20px;">Ingen lag har fullført quizen ennå</p>';
        return;
    }

    quizLeaderboard.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 15px;">
            ${data.leaderboard.map((entry, index) => {
                const rank = entry.rank;
                const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

                // Format time as MM:SS
                const totalSeconds = entry.total_time || 0;
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                return `
                    <div class="card" style="padding: 20px;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="font-size: 32px; min-width: 50px; text-align: center;">
                                ${rankEmoji}
                            </div>
                            <div style="flex: 1;">
                                <div style="font-size: 20px; font-weight: bold; margin-bottom: 5px;">
                                    ${entry.team_name}
                                </div>
                                <div style="font-size: 16px; color: var(--text-light);">
                                    🏆 ${entry.score} poeng •
                                    ✅ ${entry.correct_answers}/${entry.total_questions} riktige •
                                    ⏱️ ${timeStr}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Show question modal status message
 */
function showQuestionModalStatus(message, type) {
    questionModalStatus.textContent = message;
    questionModalStatus.className = `alert ${type}`;
    questionModalStatus.classList.remove('hidden');
}

/**
 * Show question status message
 */
function showQuestionStatus(message, type) {
    questionStatus.textContent = message;
    questionStatus.className = `alert ${type}`;
    questionStatus.classList.remove('hidden');
    setTimeout(() => {
        questionStatus.classList.add('hidden');
    }, 3000);
}

// ==============================================
// END QUIZ FUNCTIONS
// ==============================================

// ==============================================
// PROGRAM FUNCTIONS
// ==============================================

/**
 * Load program items
 */
async function loadProgram() {
    try {
        const response = await fetch('/api/program');
        if (!response.ok) throw new Error('Failed to load program');

        programItems = await response.json();
        renderProgram();
    } catch (error) {
        console.error('Error loading program:', error);
        programList.innerHTML = '<p class="text-center text-error">Kunne ikke laste program</p>';
    }
}

/**
 * Render program items
 */
function renderProgram() {
    if (programItems.length === 0) {
        programList.innerHTML = '<p class="text-center" style="color: var(--text-light);">Ingen programpunkter lagt til ennå</p>';
        return;
    }

    // Group by day
    const days = {};
    programItems.forEach(item => {
        if (!days[item.day_number]) days[item.day_number] = [];
        days[item.day_number].push(item);
    });

    let html = '';
    Object.keys(days).sort((a, b) => a - b).forEach(dayNum => {
        html += `<div style="margin-bottom: 20px;">
            <h3 style="margin-bottom: 10px;">Dag ${dayNum}</h3>`;

        days[dayNum].forEach(item => {
            html += `
            <div class="card" style="padding: 15px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 5px;">
                            <span style="font-weight: 600; color: var(--primary);">${item.start_time} - ${item.end_time}</span>
                            ${item.location ? `<span style="color: var(--text-light);">📍 ${item.location}</span>` : ''}
                        </div>
                        <h4 style="margin: 5px 0;">${item.title}</h4>
                        ${item.description ? `<p style="margin: 5px 0 0 0; color: var(--text-light);">${item.description}</p>` : ''}
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button onclick="openProgramModal(${item.id})" class="button secondary btn-small">✏️ Rediger</button>
                        <button onclick="deleteProgram(${item.id})" class="button danger btn-small">🗑️</button>
                    </div>
                </div>
            </div>`;
        });

        html += '</div>';
    });

    programList.innerHTML = html;
}

/**
 * Open program modal
 */
function openProgramModal(itemId = null) {
    if (itemId) {
        // Edit mode
        const item = programItems.find(p => p.id === itemId);
        if (!item) return;

        programModalTitle.textContent = 'Rediger Programpunkt';
        programIdInput.value = item.id;
        programTitleInput.value = item.title;
        programDescriptionInput.value = item.description || '';
        programStartTimeInput.value = item.start_time;
        programEndTimeInput.value = item.end_time;
        programLocationInput.value = item.location || '';
        programDayInput.value = item.day_number || 1;
        currentProgramItem = item;
    } else {
        // Add mode
        programModalTitle.textContent = 'Legg til Programpunkt';
        programForm.reset();
        programIdInput.value = '';
        programDayInput.value = 1;
        currentProgramItem = null;
    }

    programModalStatus.classList.add('hidden');
    programModal.classList.remove('hidden');
}

/**
 * Close program modal
 */
function closeProgramModal() {
    programModal.classList.add('hidden');
    programForm.reset();
    currentProgramItem = null;
}

/**
 * Handle save program
 */
async function handleSaveProgram(e) {
    e.preventDefault();

    const programData = {
        title: programTitleInput.value.trim(),
        description: programDescriptionInput.value.trim(),
        start_time: programStartTimeInput.value,
        end_time: programEndTimeInput.value,
        location: programLocationInput.value.trim(),
        day_number: parseInt(programDayInput.value) || 1
    };

    const itemId = programIdInput.value;
    const url = itemId ? `/api/program/${itemId}` : '/api/program';
    const method = itemId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(programData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Kunne ikke lagre programpunkt');
        }

        await loadProgram();
        closeProgramModal();

        programStatus.textContent = itemId ? '✅ Programpunkt oppdatert' : '✅ Programpunkt opprettet';
        programStatus.className = 'alert success';
        programStatus.classList.remove('hidden');
        setTimeout(() => programStatus.classList.add('hidden'), 3000);

    } catch (error) {
        console.error('Error saving program:', error);
        programModalStatus.textContent = '❌ ' + error.message;
        programModalStatus.className = 'alert error';
        programModalStatus.classList.remove('hidden');
    }
}

/**
 * Delete program item
 */
async function deleteProgram(itemId) {
    const item = programItems.find(p => p.id === itemId);
    if (!item) return;

    if (!confirm(`Vil du slette programpunkt "${item.title}"?`)) return;

    try {
        const response = await fetch(`/api/program/${itemId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Kunne ikke slette programpunkt');
        }

        await loadProgram();

        programStatus.textContent = '✅ Programpunkt slettet';
        programStatus.className = 'alert success';
        programStatus.classList.remove('hidden');
        setTimeout(() => programStatus.classList.add('hidden'), 3000);

    } catch (error) {
        console.error('Error deleting program:', error);
        programStatus.textContent = '❌ Kunne ikke slette programpunkt';
        programStatus.className = 'alert error';
        programStatus.classList.remove('hidden');
    }
}

// ==============================================
// DATABASE MANAGEMENT FUNCTIONS
// ==============================================

/**
 * Load dummy data for testing
 */
async function loadDummyData() {
    const confirmation = confirm(
        '⚠️ Dette vil laste inn testdata i databasen.\n\n' +
        'Inkluderer:\n' +
        '• 1 arrangement (Høstleir 2024)\n' +
        '• 100 deltakere\n' +
        '• 20 klubber\n' +
        '• 15 lag\n' +
        '• 5 quiz-spørsmål\n' +
        '• 5 skattejakt-poster\n\n' +
        'Vil du fortsette?'
    );

    if (!confirmation) return;

    const statusDiv = document.getElementById('databaseStatus');
    statusDiv.textContent = 'Laster inn testdata...';
    statusDiv.style.background = '#e3f2fd';
    statusDiv.style.color = '#1565C0';
    statusDiv.classList.remove('hidden');

    try {
        const response = await fetch('/api/admin/load-dummy-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Failed to load dummy data');
        }

        const result = await response.json();

        statusDiv.textContent = `✅ ${result.message}! ${result.stats.participants} deltakere, ${result.stats.quizQuestions} quiz-spørsmål og ${result.stats.checkpoints} skattejakt-poster lastet inn.`;
        statusDiv.style.background = '#c8e6c9';
        statusDiv.style.color = '#2e7d32';

        // Reload participants table if on that tab
        if (document.getElementById('participantsTab').classList.contains('active')) {
            await loadParticipants();
        }

        // Reload event info if on that tab
        if (document.getElementById('eventTab').classList.contains('active')) {
            await loadEventInfo();
        }

        // Reload quiz questions if on that tab
        if (document.getElementById('quizTab').classList.contains('active')) {
            await loadQuizQuestions();
        }

        // Reload scavenger checkpoints if on that tab
        if (document.getElementById('scavengerTab').classList.contains('active')) {
            await loadCheckpoints();
        }

        setTimeout(() => {
            statusDiv.classList.add('hidden');
        }, 5000);

    } catch (error) {
        console.error('Error loading dummy data:', error);
        statusDiv.textContent = '❌ Kunne ikke laste testdata';
        statusDiv.style.background = '#ffcdd2';
        statusDiv.style.color = '#c62828';

        setTimeout(() => {
            statusDiv.classList.add('hidden');
        }, 5000);
    }
}

/**
 * Reset entire database
 */
async function resetDatabase() {
    const confirmation = confirm(
        '🚨 ADVARSEL! 🚨\n\n' +
        'Dette vil PERMANENT SLETTE all data:\n\n' +
        '• Alle deltakere og bilder\n' +
        '• Alle quiz-svar og økter\n' +
        '• Alle lagutfordring-svar\n' +
        '• Alle skattejakt-økter\n' +
        '• Alle spill (tic-tac-toe)\n' +
        '• Arrangement-informasjon\n\n' +
        'Denne handlingen kan IKKE angres!\n\n' +
        'Er du HELT SIKKER på at du vil fortsette?'
    );

    if (!confirmation) return;

    // Double confirmation for safety
    const doubleCheck = confirm(
        '⚠️ SISTE SJANSE!\n\n' +
        'Skriv OK i prompt-vinduet som kommer for å bekrefte at du vil slette ALT.'
    );

    if (!doubleCheck) return;

    const finalConfirm = prompt('Skriv "SLETT ALT" for å bekrefte:');
    if (finalConfirm !== 'SLETT ALT') {
        alert('Handlingen ble avbrutt.');
        return;
    }

    const statusDiv = document.getElementById('databaseStatus');
    statusDiv.textContent = 'Nullstiller database...';
    statusDiv.style.background = '#ffebee';
    statusDiv.style.color = '#c62828';
    statusDiv.classList.remove('hidden');

    try {
        const response = await fetch('/api/admin/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Failed to reset database');
        }

        const result = await response.json();

        statusDiv.textContent = `✅ ${result.message}`;
        statusDiv.style.background = '#c8e6c9';
        statusDiv.style.color = '#2e7d32';

        // Reload all relevant sections
        await loadParticipants();
        await loadEventInfo();
        await loadCheckpoints();
        await loadScavengerLeaderboard();
        await loadQuizQuestions();
        await loadQuizLeaderboard();

        setTimeout(() => {
            statusDiv.classList.add('hidden');
        }, 5000);

    } catch (error) {
        console.error('Error resetting database:', error);
        statusDiv.textContent = '❌ Kunne ikke nullstille database';
        statusDiv.style.background = '#ffcdd2';
        statusDiv.style.color = '#c62828';

        setTimeout(() => {
            statusDiv.classList.add('hidden');
        }, 5000);
    }
}

// ==============================================
// END DATABASE MANAGEMENT FUNCTIONS
// ==============================================

// ==============================================
// COURSES MANAGEMENT FUNCTIONS
// ==============================================

// DOM Elements - Courses
const coursesList = document.getElementById('coursesList');
const addCourseBtn = document.getElementById('addCourseBtn');
const courseModal = document.getElementById('courseModal');
const courseModalTitle = document.getElementById('courseModalTitle');
const courseForm = document.getElementById('courseForm');
const courseIdInput = document.getElementById('courseId');
const courseNameInput = document.getElementById('courseName');
const courseDescriptionInput = document.getElementById('courseDescription');
const courseInstructorInput = document.getElementById('courseInstructor');
const courseLocationInput = document.getElementById('courseLocation');
const courseMaxParticipantsInput = document.getElementById('courseMaxParticipants');
const courseIconInput = document.getElementById('courseIcon');
const courseActiveInput = document.getElementById('courseActive');
const closeCourseBtn = document.getElementById('closeCourseBtn');
const cancelCourseBtn = document.getElementById('cancelCourseBtn');
const courseModalStatus = document.getElementById('courseModalStatus');
const courseStatus = document.getElementById('courseStatus');

// DOM Elements - Enrollments
const enrollmentCourseSelect = document.getElementById('enrollmentCourseSelect');
const courseEnrollmentInfo = document.getElementById('courseEnrollmentInfo');
const enrollmentCourseTitle = document.getElementById('enrollmentCourseTitle');
const enrollmentCount = document.getElementById('enrollmentCount');
const enrollmentMax = document.getElementById('enrollmentMax');
const enrolledParticipantsList = document.getElementById('enrolledParticipantsList');
const addEnrollmentBtn = document.getElementById('addEnrollmentBtn');
const bulkEnrollBtn = document.getElementById('bulkEnrollBtn');
const enrollmentStatus = document.getElementById('enrollmentStatus');

// DOM Elements - Add Enrollment Modal
const addEnrollmentModal = document.getElementById('addEnrollmentModal');
const addEnrollmentForm = document.getElementById('addEnrollmentForm');
const addEnrollmentCourseIdInput = document.getElementById('addEnrollmentCourseId');
const addEnrollmentParticipant = document.getElementById('addEnrollmentParticipant');
const closeAddEnrollmentBtn = document.getElementById('closeAddEnrollmentBtn');
const cancelAddEnrollmentBtn = document.getElementById('cancelAddEnrollmentBtn');
const addEnrollmentModalStatus = document.getElementById('addEnrollmentModalStatus');

// DOM Elements - Bulk Enrollment Modal
const bulkEnrollModal = document.getElementById('bulkEnrollModal');
const bulkEnrollForm = document.getElementById('bulkEnrollForm');
const bulkEnrollCourseIdInput = document.getElementById('bulkEnrollCourseId');
const bulkEnrollParticipantsList = document.getElementById('bulkEnrollParticipantsList');
const selectAllParticipants = document.getElementById('selectAllParticipants');
const closeBulkEnrollBtn = document.getElementById('closeBulkEnrollBtn');
const cancelBulkEnrollBtn = document.getElementById('cancelBulkEnrollBtn');
const bulkEnrollModalStatus = document.getElementById('bulkEnrollModalStatus');

// Event Listeners - Courses
addCourseBtn.addEventListener('click', () => openCourseModal());
closeCourseBtn.addEventListener('click', closeCourseModal);
cancelCourseBtn.addEventListener('click', closeCourseModal);
courseForm.addEventListener('submit', saveCourse);

// Event Listeners - Enrollments
enrollmentCourseSelect.addEventListener('change', handleCourseSelectChange);
addEnrollmentBtn.addEventListener('click', openAddEnrollmentModal);
bulkEnrollBtn.addEventListener('click', openBulkEnrollModal);

// Event Listeners - Add Enrollment Modal
closeAddEnrollmentBtn.addEventListener('click', closeAddEnrollmentModal);
cancelAddEnrollmentBtn.addEventListener('click', closeAddEnrollmentModal);
addEnrollmentForm.addEventListener('submit', saveEnrollment);

// Event Listeners - Bulk Enrollment Modal
closeBulkEnrollBtn.addEventListener('click', closeBulkEnrollModal);
cancelBulkEnrollBtn.addEventListener('click', closeBulkEnrollModal);
bulkEnrollForm.addEventListener('submit', saveBulkEnrollment);
selectAllParticipants.addEventListener('change', toggleAllParticipants);

/**
 * Load all courses
 */
async function loadCourses() {
    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();

        if (courses.length === 0) {
            coursesList.innerHTML = '<p class="text-center" style="color: var(--text-light); padding: 40px;">Ingen kurs opprettet ennå</p>';
            return;
        }

        coursesList.innerHTML = courses.map(course => `
            <div class="team-card" style="background: ${course.active ? '#f9f9f9' : '#ffe0e0'};">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <h3 style="margin: 0; font-size: 20px;">
                        ${course.icon || '📚'} ${course.name}
                    </h3>
                    ${!course.active ? '<span style="background: #f44336; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">INAKTIV</span>' : ''}
                </div>

                ${course.description ? `<p style="margin: 5px 0; color: var(--text-light); font-size: 14px;">${course.description}</p>` : ''}

                ${course.instructor ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Kursholder:</strong> ${course.instructor}</p>` : ''}
                ${course.location ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Sted:</strong> ${course.location}</p>` : ''}

                <p style="margin: 5px 0; font-size: 14px;">
                    <strong>Kapasitet:</strong> <span id="enrollment-count-${course.id}">0</span> / ${course.max_participants} påmeldte
                </p>

                <div class="team-card-actions">
                    <button onclick="editCourse(${course.id})" class="button secondary btn-small">
                        ✏️ Rediger
                    </button>
                    <button onclick="deleteCourse(${course.id}, '${course.name.replace(/'/g, "\\'")}')" class="button secondary btn-small">
                        🗑️ Slett
                    </button>
                </div>
            </div>
        `).join('');

        // Load enrollment counts for each course
        courses.forEach(course => loadEnrollmentCount(course.id));

        // Populate enrollment course select
        populateEnrollmentCourseSelect(courses);

    } catch (error) {
        console.error('Error loading courses:', error);
        coursesList.innerHTML = '<p class="text-center" style="color: #f44336;">Kunne ikke laste kurs</p>';
    }
}

/**
 * Load enrollment count for a specific course
 */
async function loadEnrollmentCount(courseId) {
    try {
        const response = await fetch(`/api/courses/${courseId}/participants`);
        const participants = await response.json();

        const countElement = document.getElementById(`enrollment-count-${courseId}`);
        if (countElement) {
            countElement.textContent = participants.length;
        }
    } catch (error) {
        console.error(`Error loading enrollment count for course ${courseId}:`, error);
    }
}

/**
 * Populate enrollment course select dropdown
 */
function populateEnrollmentCourseSelect(courses) {
    enrollmentCourseSelect.innerHTML = '<option value="">-- Velg et kurs --</option>' +
        courses.map(course => `
            <option value="${course.id}">${course.icon || '📚'} ${course.name}</option>
        `).join('');
}

/**
 * Open course modal for adding/editing
 */
function openCourseModal(courseId = null) {
    if (courseId) {
        courseModalTitle.textContent = 'Rediger Kurs';
        loadCourseForEdit(courseId);
    } else {
        courseModalTitle.textContent = 'Legg til Kurs';
        courseForm.reset();
        courseIdInput.value = '';
        courseActiveInput.checked = true;
    }
    courseModal.classList.remove('hidden');
}

/**
 * Close course modal
 */
function closeCourseModal() {
    courseModal.classList.add('hidden');
    courseForm.reset();
    courseModalStatus.classList.add('hidden');
}

/**
 * Load course data for editing
 */
async function loadCourseForEdit(courseId) {
    try {
        const response = await fetch(`/api/courses/${courseId}`);
        const course = await response.json();

        courseIdInput.value = course.id;
        courseNameInput.value = course.name;
        courseDescriptionInput.value = course.description || '';
        courseInstructorInput.value = course.instructor || '';
        courseLocationInput.value = course.location || '';
        courseMaxParticipantsInput.value = course.max_participants;
        courseIconInput.value = course.icon || '';
        courseActiveInput.checked = course.active === 1;

    } catch (error) {
        console.error('Error loading course:', error);
        alert('Kunne ikke laste kurs');
    }
}

/**
 * Save course (create or update)
 */
async function saveCourse(e) {
    e.preventDefault();

    const courseId = courseIdInput.value;
    const courseData = {
        name: courseNameInput.value.trim(),
        description: courseDescriptionInput.value.trim(),
        instructor: courseInstructorInput.value.trim(),
        location: courseLocationInput.value.trim(),
        max_participants: parseInt(courseMaxParticipantsInput.value),
        icon: courseIconInput.value.trim() || '📚',
        active: courseActiveInput.checked ? 1 : 0
    };

    const url = courseId ? `/api/courses/${courseId}` : '/api/courses';
    const method = courseId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(courseData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save course');
        }

        const result = await response.json();

        courseModalStatus.textContent = courseId ? '✅ Kurset ble oppdatert!' : '✅ Kurset ble opprettet!';
        courseModalStatus.style.background = '#c8e6c9';
        courseModalStatus.style.color = '#2e7d32';
        courseModalStatus.classList.remove('hidden');

        setTimeout(() => {
            closeCourseModal();
            loadCourses();
        }, 1500);

    } catch (error) {
        console.error('Error saving course:', error);
        courseModalStatus.textContent = `❌ ${error.message}`;
        courseModalStatus.style.background = '#ffcdd2';
        courseModalStatus.style.color = '#c62828';
        courseModalStatus.classList.remove('hidden');
    }
}

/**
 * Edit course
 */
function editCourse(courseId) {
    openCourseModal(courseId);
}

/**
 * Delete course
 */
async function deleteCourse(courseId, courseName) {
    const confirmation = confirm(`Er du sikker på at du vil slette kurset "${courseName}"?\n\nAlle påmeldinger til kurset vil også bli slettet.`);
    if (!confirmation) return;

    try {
        const response = await fetch(`/api/courses/${courseId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete course');
        }

        showStatus(courseStatus, '✅ Kurset ble slettet', 'success');
        loadCourses();

    } catch (error) {
        console.error('Error deleting course:', error);
        showStatus(courseStatus, '❌ Kunne ikke slette kurset', 'error');
    }
}

/**
 * Handle course select change in enrollment section
 */
async function handleCourseSelectChange() {
    const courseId = enrollmentCourseSelect.value;

    if (!courseId) {
        courseEnrollmentInfo.classList.add('hidden');
        return;
    }

    try {
        // Load course details
        const courseResponse = await fetch(`/api/courses/${courseId}`);
        const course = await courseResponse.json();

        // Load enrolled participants
        const participantsResponse = await fetch(`/api/courses/${courseId}/participants`);
        const participants = await participantsResponse.json();

        enrollmentCourseTitle.textContent = `${course.icon || '📚'} ${course.name}`;
        enrollmentCount.textContent = participants.length;
        enrollmentMax.textContent = course.max_participants;

        // Store current course ID
        addEnrollmentCourseIdInput.value = courseId;
        bulkEnrollCourseIdInput.value = courseId;

        // Display enrolled participants
        if (participants.length === 0) {
            enrolledParticipantsList.innerHTML = '<p style="color: var(--text-light); text-align: center; padding: 20px;">Ingen deltakere påmeldt ennå</p>';
        } else {
            enrolledParticipantsList.innerHTML = participants.map(p => `
                <div class="participant-item">
                    <div class="participant-info">
                        <h3>${p.first_name} ${p.last_name}</h3>
                        <p>${p.age ? p.age + ' år' : ''} ${p.home_location ? '• ' + p.home_location : ''}</p>
                    </div>
                    <button onclick="removeEnrollment(${courseId}, '${p.participant_code}')" class="button secondary btn-small">
                        🗑️ Fjern
                    </button>
                </div>
            `).join('');
        }

        courseEnrollmentInfo.classList.remove('hidden');

    } catch (error) {
        console.error('Error loading course enrollment:', error);
        showStatus(enrollmentStatus, '❌ Kunne ikke laste påmeldinger', 'error');
    }
}

/**
 * Open add enrollment modal
 */
async function openAddEnrollmentModal() {
    const courseId = enrollmentCourseSelect.value;
    if (!courseId) {
        alert('Velg et kurs først');
        return;
    }

    try {
        // Get all participants
        const allParticipantsResponse = await fetch('/api/participants');
        const allParticipants = await allParticipantsResponse.json();

        // Get enrolled participants
        const enrolledResponse = await fetch(`/api/courses/${courseId}/participants`);
        const enrolledParticipants = await enrolledResponse.json();
        const enrolledCodes = new Set(enrolledParticipants.map(p => p.participant_code));

        // Filter out already enrolled participants
        const availableParticipants = allParticipants.filter(p => !enrolledCodes.has(p.participant_code));

        if (availableParticipants.length === 0) {
            alert('Alle deltakere er allerede påmeldt dette kurset');
            return;
        }

        addEnrollmentParticipant.innerHTML = '<option value="">-- Velg deltaker --</option>' +
            availableParticipants.map(p => `
                <option value="${p.participant_code}">
                    ${p.first_name} ${p.last_name} ${p.age ? '(' + p.age + ' år)' : ''}
                </option>
            `).join('');

        addEnrollmentModal.classList.remove('hidden');

    } catch (error) {
        console.error('Error opening add enrollment modal:', error);
        alert('Kunne ikke laste deltakere');
    }
}

/**
 * Close add enrollment modal
 */
function closeAddEnrollmentModal() {
    addEnrollmentModal.classList.add('hidden');
    addEnrollmentForm.reset();
    addEnrollmentModalStatus.classList.add('hidden');
}

/**
 * Save enrollment
 */
async function saveEnrollment(e) {
    e.preventDefault();

    const courseId = addEnrollmentCourseIdInput.value;
    const participantCode = addEnrollmentParticipant.value;

    try {
        const response = await fetch('/api/courses/enroll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseId, participantCode })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to enroll participant');
        }

        addEnrollmentModalStatus.textContent = '✅ Deltaker ble påmeldt!';
        addEnrollmentModalStatus.style.background = '#c8e6c9';
        addEnrollmentModalStatus.style.color = '#2e7d32';
        addEnrollmentModalStatus.classList.remove('hidden');

        setTimeout(() => {
            closeAddEnrollmentModal();
            handleCourseSelectChange(); // Reload enrollments
            loadCourses(); // Reload to update counts
        }, 1500);

    } catch (error) {
        console.error('Error saving enrollment:', error);
        addEnrollmentModalStatus.textContent = `❌ ${error.message}`;
        addEnrollmentModalStatus.style.background = '#ffcdd2';
        addEnrollmentModalStatus.style.color = '#c62828';
        addEnrollmentModalStatus.classList.remove('hidden');
    }
}

/**
 * Remove enrollment
 */
async function removeEnrollment(courseId, participantCode) {
    const confirmation = confirm('Er du sikker på at du vil fjerne denne deltakeren fra kurset?');
    if (!confirmation) return;

    try {
        const response = await fetch('/api/courses/unenroll', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseId, participantCode })
        });

        if (!response.ok) {
            throw new Error('Failed to remove enrollment');
        }

        showStatus(enrollmentStatus, '✅ Deltaker ble fjernet fra kurset', 'success');
        handleCourseSelectChange(); // Reload enrollments
        loadCourses(); // Reload to update counts

    } catch (error) {
        console.error('Error removing enrollment:', error);
        showStatus(enrollmentStatus, '❌ Kunne ikke fjerne deltaker', 'error');
    }
}

/**
 * Open bulk enrollment modal
 */
async function openBulkEnrollModal() {
    const courseId = enrollmentCourseSelect.value;
    if (!courseId) {
        alert('Velg et kurs først');
        return;
    }

    try {
        // Get all participants
        const allParticipantsResponse = await fetch('/api/participants');
        const allParticipants = await allParticipantsResponse.json();

        // Get enrolled participants
        const enrolledResponse = await fetch(`/api/courses/${courseId}/participants`);
        const enrolledParticipants = await enrolledResponse.json();
        const enrolledCodes = new Set(enrolledParticipants.map(p => p.participant_code));

        // Filter out already enrolled participants
        const availableParticipants = allParticipants.filter(p => !enrolledCodes.has(p.participant_code));

        if (availableParticipants.length === 0) {
            alert('Alle deltakere er allerede påmeldt dette kurset');
            return;
        }

        bulkEnrollParticipantsList.innerHTML = availableParticipants.map(p => `
            <label style="display: flex; align-items: center; gap: 10px; padding: 8px; cursor: pointer; border-radius: 5px; transition: background 0.2s;">
                <input type="checkbox" class="bulk-enroll-checkbox" value="${p.participant_code}">
                <span style="flex: 1;">${p.first_name} ${p.last_name} ${p.age ? '(' + p.age + ' år)' : ''} ${p.home_location ? '• ' + p.home_location : ''}</span>
            </label>
        `).join('');

        selectAllParticipants.checked = false;
        bulkEnrollModal.classList.remove('hidden');

    } catch (error) {
        console.error('Error opening bulk enrollment modal:', error);
        alert('Kunne ikke laste deltakere');
    }
}

/**
 * Close bulk enrollment modal
 */
function closeBulkEnrollModal() {
    bulkEnrollModal.classList.add('hidden');
    bulkEnrollForm.reset();
    bulkEnrollModalStatus.classList.add('hidden');
}

/**
 * Toggle all participants in bulk enrollment
 */
function toggleAllParticipants() {
    const checkboxes = document.querySelectorAll('.bulk-enroll-checkbox');
    checkboxes.forEach(cb => cb.checked = selectAllParticipants.checked);
}

/**
 * Save bulk enrollment
 */
async function saveBulkEnrollment(e) {
    e.preventDefault();

    const courseId = bulkEnrollCourseIdInput.value;
    const checkboxes = document.querySelectorAll('.bulk-enroll-checkbox:checked');
    const participantCodes = Array.from(checkboxes).map(cb => cb.value);

    if (participantCodes.length === 0) {
        alert('Velg minst én deltaker');
        return;
    }

    try {
        let successCount = 0;
        let failCount = 0;

        for (const participantCode of participantCodes) {
            try {
                const response = await fetch('/api/courses/enroll', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ courseId, participantCode })
                });

                if (response.ok) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (error) {
                failCount++;
            }
        }

        bulkEnrollModalStatus.textContent = `✅ ${successCount} deltakere påmeldt${failCount > 0 ? `, ${failCount} feilet` : ''}`;
        bulkEnrollModalStatus.style.background = '#c8e6c9';
        bulkEnrollModalStatus.style.color = '#2e7d32';
        bulkEnrollModalStatus.classList.remove('hidden');

        setTimeout(() => {
            closeBulkEnrollModal();
            handleCourseSelectChange(); // Reload enrollments
            loadCourses(); // Reload to update counts
        }, 2000);

    } catch (error) {
        console.error('Error bulk enrolling:', error);
        bulkEnrollModalStatus.textContent = '❌ Kunne ikke melde på deltakere';
        bulkEnrollModalStatus.style.background = '#ffcdd2';
        bulkEnrollModalStatus.style.color = '#c62828';
        bulkEnrollModalStatus.classList.remove('hidden');
    }
}

// ==============================================
// END COURSES MANAGEMENT FUNCTIONS
// ==============================================

// ==============================================
// PHOTO CHALLENGES MANAGEMENT FUNCTIONS
// ==============================================

// DOM Elements - Photo Challenges
const photoChallengesList = document.getElementById('photoChallengesList');
const addPhotoChallengeBtn = document.getElementById('addPhotoChallengeBtn');
const photoChallengeModal = document.getElementById('photoChallengeModal');
const photoChallengeModalTitle = document.getElementById('photoChallengeModalTitle');
const photoChallengeForm = document.getElementById('photoChallengeForm');
const photoChallengeIdInput = document.getElementById('photoChallengeId');
const photoChallengeTitleInput = document.getElementById('photoChallengeTitle');
const photoChallengeDescriptionInput = document.getElementById('photoChallengeDescription');
const photoChallengePointsInput = document.getElementById('photoChallengePoints');
const photoChallengeIconInput = document.getElementById('photoChallengeIcon');
const photoChallengeOrderInput = document.getElementById('photoChallengeOrder');
const photoChallengeActiveInput = document.getElementById('photoChallengeActive');
const closePhotoChallengeBtn = document.getElementById('closePhotoChallengeBtn');
const cancelPhotoChallengeBtn = document.getElementById('cancelPhotoChallengeBtn');
const photoChallengeModalStatus = document.getElementById('photoChallengeModalStatus');
const photoChallengeStatus = document.getElementById('photoChallengeStatus');

// DOM Elements - Submissions
const submissionsFilter = document.getElementById('submissionsFilter');
const submissionsSort = document.getElementById('submissionsSort');
const groupByChallenge = document.getElementById('groupByChallenge');
const pendingCount = document.getElementById('pendingCount');
const photoSubmissionsList = document.getElementById('photoSubmissionsList');
const submissionStatus = document.getElementById('submissionStatus');

// DOM Elements - Review Modal
const reviewSubmissionModal = document.getElementById('reviewSubmissionModal');
const prevSubmissionBtn = document.getElementById('prevSubmissionBtn');
const nextSubmissionBtn = document.getElementById('nextSubmissionBtn');
const quickApproveBtn = document.getElementById('quickApproveBtn');
const quickRejectBtn = document.getElementById('quickRejectBtn');
const reviewSubmissionForm = document.getElementById('reviewSubmissionForm');
const reviewSubmissionIdInput = document.getElementById('reviewSubmissionId');

// DOM Elements - Feedback
const feedbackList = document.getElementById('feedbackList');
const feedbackCount = document.getElementById('feedbackCount');
const feedbackBadge = document.getElementById('feedbackBadge');
const feedbackFilter = document.getElementById('feedbackFilter');
const refreshFeedbackBtn = document.getElementById('refreshFeedbackBtn');
const feedbackModal = document.getElementById('feedbackModal');
const feedbackModalBody = document.getElementById('feedbackModalBody');
const feedbackModalTitle = document.getElementById('feedbackModalTitle');
const feedbackModalMessage = document.getElementById('feedbackModalMessage');
const feedbackModalFrom = document.getElementById('feedbackModalFrom');
const feedbackModalSubmitted = document.getElementById('feedbackModalSubmitted');
const feedbackModalStatus = document.getElementById('feedbackModalStatus');
const feedbackModalRead = document.getElementById('feedbackModalRead');
const toggleReadBtn = document.getElementById('toggleReadBtn');
const deleteFeedbackBtn = document.getElementById('deleteFeedbackBtn');
const closeFeedbackBtn = document.getElementById('closeFeedbackBtn');
const closeFeedbackModal2Btn = document.getElementById('closeFeedbackModal2Btn');
const reviewSubmissionMaxPointsInput = document.getElementById('reviewSubmissionMaxPoints');
const reviewSubmissionImage = document.getElementById('reviewSubmissionImage');
const reviewSubmissionChallenge = document.getElementById('reviewSubmissionChallenge');
const reviewSubmissionTeam = document.getElementById('reviewSubmissionTeam');
const reviewSubmissionParticipant = document.getElementById('reviewSubmissionParticipant');
const reviewSubmissionTime = document.getElementById('reviewSubmissionTime');
const reviewSubmissionStatus = document.getElementById('reviewSubmissionStatus');
const reviewSubmissionPoints = document.getElementById('reviewSubmissionPoints');
const reviewSubmissionMaxPointsDisplay = document.getElementById('reviewSubmissionMaxPointsDisplay');
const reviewSubmissionComment = document.getElementById('reviewSubmissionComment');
const reviewSubmissionStatusSelect = document.getElementById('reviewSubmissionStatusSelect');
const closeReviewSubmissionBtn = document.getElementById('closeReviewSubmissionBtn');
const cancelReviewSubmissionBtn = document.getElementById('cancelReviewSubmissionBtn');
const reviewSubmissionModalStatus = document.getElementById('reviewSubmissionModalStatus');

// DOM Elements - Leaderboard
const photoChallengeLeaderboard = document.getElementById('photoChallengeLeaderboard');

// DOM Elements - Participant Connection
const wifiSSID = document.getElementById('wifiSSID');
const wifiPassword = document.getElementById('wifiPassword');
const serverURL = document.getElementById('serverURL');
const detectIPBtn = document.getElementById('detectIPBtn');
const generateQRBtn = document.getElementById('generateQRBtn');
const showConnectionScreenBtn = document.getElementById('showConnectionScreenBtn');
const printConnectionBtn = document.getElementById('printConnectionBtn');
const qrPreview = document.getElementById('qrPreview');
const wifiQRPreview = document.getElementById('wifiQRPreview');
const urlQRPreview = document.getElementById('urlQRPreview');
const previewSSID = document.getElementById('previewSSID');
const previewURL = document.getElementById('previewURL');

// State for connection
let currentConnectionURL = '';

// Event Listeners - Photo Challenges
addPhotoChallengeBtn.addEventListener('click', () => openPhotoChallengeModal());
closePhotoChallengeBtn.addEventListener('click', closePhotoChallengeModal);
cancelPhotoChallengeBtn.addEventListener('click', closePhotoChallengeModal);
photoChallengeForm.addEventListener('submit', savePhotoChallenge);

// Event Listeners - Participant Connection
detectIPBtn.addEventListener('click', detectLocalIP);
generateQRBtn.addEventListener('click', generateConnectionQR);
showConnectionScreenBtn.addEventListener('click', showConnectionScreen);
printConnectionBtn.addEventListener('click', printConnectionScreen);

// Auto-detect IP on page load
window.addEventListener('load', () => {
    if (document.getElementById('photo-challengesTab').classList.contains('active')) {
        detectLocalIP();
    }
});

// State for navigation
let currentSubmissions = [];
let currentSubmissionIndex = -1;

// State for feedback
let allFeedback = [];
let currentFeedbackItem = null;

// Event Listeners - Submissions
submissionsFilter.addEventListener('change', loadPhotoSubmissions);
submissionsSort.addEventListener('change', loadPhotoSubmissions);
groupByChallenge.addEventListener('change', loadPhotoSubmissions);

// Event Listeners - Review Modal
closeReviewSubmissionBtn.addEventListener('click', closeReviewSubmissionModal);
cancelReviewSubmissionBtn.addEventListener('click', closeReviewSubmissionModal);
reviewSubmissionForm.addEventListener('submit', saveReview);
prevSubmissionBtn.addEventListener('click', navigateToPreviousSubmission);
nextSubmissionBtn.addEventListener('click', navigateToNextSubmission);
quickApproveBtn.addEventListener('click', quickApprove);
quickRejectBtn.addEventListener('click', quickReject);

// Keyboard navigation in modal
document.addEventListener('keydown', (e) => {
    if (!reviewSubmissionModal.classList.contains('hidden')) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            navigateToPreviousSubmission();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            navigateToNextSubmission();
        }
    }
});

// Event Listeners - Feedback
feedbackFilter.addEventListener('change', renderFeedback);
refreshFeedbackBtn.addEventListener('click', loadFeedback);
closeFeedbackBtn.addEventListener('click', closeFeedbackModal);
closeFeedbackModal2Btn.addEventListener('click', closeFeedbackModal);
toggleReadBtn.addEventListener('click', toggleFeedbackReadStatus);
deleteFeedbackBtn.addEventListener('click', deleteFeedback);

/**
 * Load all photo challenges
 */
async function loadPhotoChallenges() {
    try {
        const response = await fetch('/api/photo-challenges?admin=true');
        const challenges = await response.json();

        if (challenges.length === 0) {
            photoChallengesList.innerHTML = '<p class="text-center" style="color: var(--text-light); padding: 40px;">Ingen bildeoppgaver opprettet ennå</p>';
            return;
        }

        photoChallengesList.innerHTML = challenges.map(challenge => `
            <div class="team-card" style="background: ${challenge.active ? '#f9f9f9' : '#ffe0e0'};">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <h3 style="margin: 0; font-size: 20px;">
                        ${challenge.icon || '📸'} ${challenge.title}
                    </h3>
                    ${!challenge.active ? '<span style="background: #f44336; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">INAKTIV</span>' : ''}
                </div>

                ${challenge.description ? `<p style="margin: 5px 0; color: var(--text-light); font-size: 14px;">${challenge.description}</p>` : ''}

                <p style="margin: 5px 0; font-size: 14px;"><strong>Poeng:</strong> ${challenge.points}</p>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Rekkefølge:</strong> ${challenge.order_number}</p>

                <div class="team-card-actions">
                    <button onclick="editPhotoChallenge(${challenge.id})" class="button secondary btn-small">
                        ✏️ Rediger
                    </button>
                    <button onclick="deletePhotoChallenge(${challenge.id}, '${challenge.title.replace(/'/g, "\\'")}')" class="button secondary btn-small">
                        🗑️ Slett
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading photo challenges:', error);
        photoChallengesList.innerHTML = '<p class="text-center" style="color: #f44336;">Kunne ikke laste bildeoppgaver</p>';
    }
}

/**
 * Open photo challenge modal for adding/editing
 */
function openPhotoChallengeModal(challengeId = null) {
    if (challengeId) {
        photoChallengeModalTitle.textContent = 'Rediger Bildeoppgave';
        loadPhotoChallengeForEdit(challengeId);
    } else {
        photoChallengeModalTitle.textContent = 'Legg til Bildeoppgave';
        photoChallengeForm.reset();
        photoChallengeIdInput.value = '';
        photoChallengeActiveInput.checked = true;
        photoChallengePointsInput.value = 10;
        photoChallengeOrderInput.value = 0;
    }
    photoChallengeModal.classList.remove('hidden');
}

/**
 * Close photo challenge modal
 */
function closePhotoChallengeModal() {
    photoChallengeModal.classList.add('hidden');
    photoChallengeForm.reset();
    photoChallengeModalStatus.classList.add('hidden');
}

/**
 * Load photo challenge data for editing
 */
async function loadPhotoChallengeForEdit(challengeId) {
    try {
        const response = await fetch(`/api/photo-challenges/${challengeId}`);
        const challenge = await response.json();

        photoChallengeIdInput.value = challenge.id;
        photoChallengeTitleInput.value = challenge.title;
        photoChallengeDescriptionInput.value = challenge.description || '';
        photoChallengePointsInput.value = challenge.points;
        photoChallengeIconInput.value = challenge.icon || '';
        photoChallengeOrderInput.value = challenge.order_number;
        photoChallengeActiveInput.checked = challenge.active === 1;

    } catch (error) {
        console.error('Error loading photo challenge:', error);
        alert('Kunne ikke laste bildeoppgave');
    }
}

/**
 * Save photo challenge (create or update)
 */
async function savePhotoChallenge(e) {
    e.preventDefault();

    const challengeId = photoChallengeIdInput.value;
    const challengeData = {
        title: photoChallengeTitleInput.value.trim(),
        description: photoChallengeDescriptionInput.value.trim(),
        points: parseInt(photoChallengePointsInput.value),
        icon: photoChallengeIconInput.value.trim() || '📸',
        order_number: parseInt(photoChallengeOrderInput.value),
        active: photoChallengeActiveInput.checked ? 1 : 0
    };

    const url = challengeId ? `/api/photo-challenges/${challengeId}` : '/api/photo-challenges';
    const method = challengeId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(challengeData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save challenge');
        }

        const result = await response.json();

        photoChallengeModalStatus.textContent = challengeId ? '✅ Oppgaven ble oppdatert!' : '✅ Oppgaven ble opprettet!';
        photoChallengeModalStatus.style.background = '#c8e6c9';
        photoChallengeModalStatus.style.color = '#2e7d32';
        photoChallengeModalStatus.classList.remove('hidden');

        setTimeout(() => {
            closePhotoChallengeModal();
            loadPhotoChallenges();
        }, 1500);

    } catch (error) {
        console.error('Error saving photo challenge:', error);
        photoChallengeModalStatus.textContent = `❌ ${error.message}`;
        photoChallengeModalStatus.style.background = '#ffcdd2';
        photoChallengeModalStatus.style.color = '#c62828';
        photoChallengeModalStatus.classList.remove('hidden');
    }
}

/**
 * Edit photo challenge
 */
function editPhotoChallenge(challengeId) {
    openPhotoChallengeModal(challengeId);
}

/**
 * Delete photo challenge
 */
async function deletePhotoChallenge(challengeId, challengeTitle) {
    const confirmation = confirm(`Er du sikker på at du vil slette oppgaven "${challengeTitle}"?\n\nAlle innleveringer for denne oppgaven vil også bli slettet.`);
    if (!confirmation) return;

    try {
        const response = await fetch(`/api/photo-challenges/${challengeId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete challenge');
        }

        showStatus(photoChallengeStatus, '✅ Oppgaven ble slettet', 'success');
        loadPhotoChallenges();
        loadPhotoSubmissions();

    } catch (error) {
        console.error('Error deleting photo challenge:', error);
        showStatus(photoChallengeStatus, '❌ Kunne ikke slette oppgaven', 'error');
    }
}

/**
 * Load photo submissions with filtering, sorting, and grouping
 */
async function loadPhotoSubmissions() {
    try {
        const response = await fetch('/api/photo-challenges/submissions/all');
        let submissions = await response.json();

        // Update counter
        const pendingSubmissions = submissions.filter(s => s.status === 'pending');
        pendingCount.textContent = pendingSubmissions.length;

        // Apply filter
        const filterValue = submissionsFilter.value;
        if (filterValue !== 'all') {
            submissions = submissions.filter(s => s.status === filterValue);
        }

        // Apply sorting
        const sortValue = submissionsSort.value;
        if (sortValue === 'newest') {
            submissions.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
        } else if (sortValue === 'oldest') {
            submissions.sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
        } else if (sortValue === 'team') {
            submissions.sort((a, b) => a.team_name.localeCompare(b.team_name));
        } else if (sortValue === 'challenge') {
            submissions.sort((a, b) => a.challenge_title.localeCompare(b.challenge_title));
        }

        // Store for navigation
        currentSubmissions = submissions;

        if (submissions.length === 0) {
            photoSubmissionsList.innerHTML = '<p class="text-center" style="color: var(--text-light); padding: 40px;">Ingen innleveringer ennå</p>';
            return;
        }

        // Check if grouping is enabled
        const shouldGroup = groupByChallenge.checked;

        if (shouldGroup) {
            // Group by challenge
            const groupedSubmissions = {};
            submissions.forEach(sub => {
                const challengeKey = sub.challenge_id;
                if (!groupedSubmissions[challengeKey]) {
                    groupedSubmissions[challengeKey] = {
                        title: sub.challenge_title,
                        icon: sub.icon,
                        submissions: []
                    };
                }
                groupedSubmissions[challengeKey].submissions.push(sub);
            });

            // Render grouped
            photoSubmissionsList.innerHTML = Object.values(groupedSubmissions).map(group => {
                const submissionCards = group.submissions.map(sub => renderSubmissionCard(sub)).join('');
                return `
                    <div style="grid-column: 1 / -1; margin-bottom: 20px;">
                        <h3 style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 3px solid var(--primary-color); color: var(--primary-dark);">
                            ${group.icon || '📸'} ${group.title} (${group.submissions.length})
                        </h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px;">
                            ${submissionCards}
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            // Render flat list
            photoSubmissionsList.innerHTML = submissions.map(sub => renderSubmissionCard(sub)).join('');
        }

    } catch (error) {
        console.error('Error loading photo submissions:', error);
        photoSubmissionsList.innerHTML = '<p class="text-center" style="color: #f44336;">Kunne ikke laste innleveringer</p>';
    }
}

/**
 * Render a single submission card
 */
function renderSubmissionCard(sub) {
    const statusBadge = sub.status === 'pending'
        ? '<span style="background: #ff9800; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">⏳ VENTER</span>'
        : sub.status === 'reviewed'
        ? '<span style="background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">✓ VURDERT</span>'
        : '<span style="background: #f44336; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">✗ AVVIST</span>';

    const submittedTime = new Date(sub.submitted_at).toLocaleString('no-NO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return `
        <div class="team-card" style="cursor: pointer;" onclick="openReviewSubmissionModal(${sub.id})">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <h3 style="margin: 0; font-size: 18px;">
                    ${sub.icon || '📸'} ${sub.challenge_title}
                </h3>
                ${statusBadge}
            </div>

            <div style="margin-bottom: 15px;">
                <img src="${sub.image_path}" alt="Submission" style="width: 100%; border-radius: 10px; border: 2px solid #ddd;">
            </div>

            <p style="margin: 5px 0; font-size: 14px;"><strong>Lag:</strong> ${sub.team_name}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Deltaker:</strong> ${sub.participant_code}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Sendt inn:</strong> ${submittedTime}</p>
            ${sub.points_awarded !== null ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Poeng tildelt:</strong> ${sub.points_awarded} / ${sub.max_points}</p>` : ''}
            ${sub.admin_comment ? `<p style="margin: 5px 0; font-size: 14px; color: var(--text-light);"><strong>Kommentar:</strong> ${sub.admin_comment}</p>` : ''}

            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd; text-align: center; color: var(--primary-color); font-weight: 600;">
                Klikk for å vurdere
            </div>
        </div>
    `;
}

/**
 * Open review submission modal
 */
async function openReviewSubmissionModal(submissionId) {
    try {
        const response = await fetch('/api/photo-challenges/submissions/all');
        const submissions = await response.json();
        const submission = submissions.find(s => s.id === submissionId);

        if (!submission) {
            alert('Kunne ikke finne innlevering');
            return;
        }

        // Find and store current index
        currentSubmissionIndex = currentSubmissions.findIndex(s => s.id === submissionId);
        updateNavigationButtons();

        reviewSubmissionIdInput.value = submission.id;
        reviewSubmissionMaxPointsInput.value = submission.max_points;
        reviewSubmissionImage.src = submission.image_path;
        reviewSubmissionChallenge.textContent = `${submission.icon || '📸'} ${submission.challenge_title}`;
        reviewSubmissionTeam.textContent = submission.team_name;
        reviewSubmissionParticipant.textContent = submission.participant_code;

        const submittedTime = new Date(submission.submitted_at).toLocaleString('no-NO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        reviewSubmissionTime.textContent = submittedTime;

        reviewSubmissionStatus.textContent = submission.status === 'pending' ? 'Venter på vurdering' :
                                             submission.status === 'reviewed' ? 'Vurdert' : 'Avvist';

        // For pending submissions (new or resubmitted), default to max_points
        // For already reviewed submissions, keep existing points
        if (submission.points_awarded !== null) {
            reviewSubmissionPoints.value = submission.points_awarded;
        } else if (submission.status === 'pending') {
            reviewSubmissionPoints.value = submission.max_points;
        } else {
            reviewSubmissionPoints.value = 0;
        }
        reviewSubmissionMaxPointsDisplay.textContent = submission.max_points;
        reviewSubmissionPoints.max = submission.max_points;
        reviewSubmissionComment.value = submission.admin_comment || '';
        reviewSubmissionStatusSelect.value = submission.status === 'rejected' ? 'rejected' : 'reviewed';

        reviewSubmissionModal.classList.remove('hidden');

    } catch (error) {
        console.error('Error loading submission:', error);
        alert('Kunne ikke laste innlevering');
    }
}

/**
 * Close review submission modal
 */
function closeReviewSubmissionModal() {
    reviewSubmissionModal.classList.add('hidden');
    reviewSubmissionForm.reset();
    reviewSubmissionModalStatus.classList.add('hidden');
}

/**
 * Save review
 */
async function saveReview(e) {
    e.preventDefault();

    const submissionId = reviewSubmissionIdInput.value;
    const reviewData = {
        points_awarded: parseInt(reviewSubmissionPoints.value),
        status: reviewSubmissionStatusSelect.value,
        admin_comment: reviewSubmissionComment.value.trim()
    };

    try {
        const response = await fetch(`/api/photo-challenges/submissions/${submissionId}/review`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save review');
        }

        reviewSubmissionModalStatus.textContent = '✅ Vurdering lagret!';
        reviewSubmissionModalStatus.style.background = '#c8e6c9';
        reviewSubmissionModalStatus.style.color = '#2e7d32';
        reviewSubmissionModalStatus.classList.remove('hidden');

        setTimeout(() => {
            closeReviewSubmissionModal();
            loadPhotoSubmissions();
            loadPhotoChallengeLeaderboard();
        }, 1500);

    } catch (error) {
        console.error('Error saving review:', error);
        reviewSubmissionModalStatus.textContent = `❌ ${error.message}`;
        reviewSubmissionModalStatus.style.background = '#ffcdd2';
        reviewSubmissionModalStatus.style.color = '#c62828';
        reviewSubmissionModalStatus.classList.remove('hidden');
    }
}

/**
 * Navigate to previous submission
 */
function navigateToPreviousSubmission() {
    if (currentSubmissionIndex > 0) {
        const prevSubmission = currentSubmissions[currentSubmissionIndex - 1];
        openReviewSubmissionModal(prevSubmission.id);
    }
}

/**
 * Navigate to next submission
 */
function navigateToNextSubmission() {
    if (currentSubmissionIndex < currentSubmissions.length - 1) {
        const nextSubmission = currentSubmissions[currentSubmissionIndex + 1];
        openReviewSubmissionModal(nextSubmission.id);
    }
}

/**
 * Update navigation button states
 */
function updateNavigationButtons() {
    prevSubmissionBtn.disabled = currentSubmissionIndex <= 0;
    nextSubmissionBtn.disabled = currentSubmissionIndex >= currentSubmissions.length - 1;
}

/**
 * Quick approve with full points
 */
async function quickApprove() {
    const submissionId = reviewSubmissionIdInput.value;
    const maxPoints = reviewSubmissionMaxPointsInput.value;

    const reviewData = {
        points_awarded: parseInt(maxPoints),
        status: 'reviewed',
        admin_comment: ''
    };

    try {
        const response = await fetch(`/api/photo-challenges/submissions/${submissionId}/review`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to approve');
        }

        reviewSubmissionModalStatus.textContent = '✅ Godkjent!';
        reviewSubmissionModalStatus.style.background = '#c8e6c9';
        reviewSubmissionModalStatus.style.color = '#2e7d32';
        reviewSubmissionModalStatus.classList.remove('hidden');

        setTimeout(() => {
            // Move to next submission if available
            if (currentSubmissionIndex < currentSubmissions.length - 1) {
                navigateToNextSubmission();
            } else {
                closeReviewSubmissionModal();
            }
            loadPhotoSubmissions();
            loadPhotoChallengeLeaderboard();
        }, 800);

    } catch (error) {
        console.error('Error approving:', error);
        reviewSubmissionModalStatus.textContent = `❌ ${error.message}`;
        reviewSubmissionModalStatus.style.background = '#ffcdd2';
        reviewSubmissionModalStatus.style.color = '#c62828';
        reviewSubmissionModalStatus.classList.remove('hidden');
    }
}

/**
 * Quick reject with 0 points
 */
async function quickReject() {
    const submissionId = reviewSubmissionIdInput.value;

    const reviewData = {
        points_awarded: 0,
        status: 'rejected',
        admin_comment: ''
    };

    try {
        const response = await fetch(`/api/photo-challenges/submissions/${submissionId}/review`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to reject');
        }

        reviewSubmissionModalStatus.textContent = '✅ Avvist!';
        reviewSubmissionModalStatus.style.background = '#ffcdd2';
        reviewSubmissionModalStatus.style.color = '#c62828';
        reviewSubmissionModalStatus.classList.remove('hidden');

        setTimeout(() => {
            // Move to next submission if available
            if (currentSubmissionIndex < currentSubmissions.length - 1) {
                navigateToNextSubmission();
            } else {
                closeReviewSubmissionModal();
            }
            loadPhotoSubmissions();
            loadPhotoChallengeLeaderboard();
        }, 800);

    } catch (error) {
        console.error('Error rejecting:', error);
        reviewSubmissionModalStatus.textContent = `❌ ${error.message}`;
        reviewSubmissionModalStatus.style.background = '#ffcdd2';
        reviewSubmissionModalStatus.style.color = '#c62828';
        reviewSubmissionModalStatus.classList.remove('hidden');
    }
}

/**
 * Load photo challenge leaderboard
 */
async function loadPhotoChallengeLeaderboard() {
    try {
        const response = await fetch('/api/photo-challenges/leaderboard/teams');
        const teams = await response.json();

        if (teams.length === 0) {
            photoChallengeLeaderboard.innerHTML = '<p class="text-center" style="color: var(--text-light); padding: 40px;">Ingen lag har sendt inn bilder ennå</p>';
            return;
        }

        photoChallengeLeaderboard.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: var(--primary-color); color: white;">
                        <th style="padding: 15px; text-align: left; border-radius: 10px 0 0 0;">Plassering</th>
                        <th style="padding: 15px; text-align: left;">Lag</th>
                        <th style="padding: 15px; text-align: center;">Innleveringer</th>
                        <th style="padding: 15px; text-align: center;">Vurdert</th>
                        <th style="padding: 15px; text-align: center; border-radius: 0 10px 0 0;">Total poeng</th>
                    </tr>
                </thead>
                <tbody>
                    ${teams.map((team, index) => `
                        <tr style="background: ${index % 2 === 0 ? 'white' : '#f9f9f9'}; border-bottom: 1px solid #ddd;">
                            <td style="padding: 15px; font-size: 24px; font-weight: bold; color: ${index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'var(--text-dark)'};">
                                ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                            </td>
                            <td style="padding: 15px; font-weight: 600;">${team.team_name}</td>
                            <td style="padding: 15px; text-align: center;">${team.submissions_count}</td>
                            <td style="padding: 15px; text-align: center;">${team.reviewed_count}</td>
                            <td style="padding: 15px; text-align: center; font-size: 20px; font-weight: bold; color: var(--primary-color);">${team.total_points}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

    } catch (error) {
        console.error('Error loading photo challenge leaderboard:', error);
        photoChallengeLeaderboard.innerHTML = '<p class="text-center" style="color: #f44336;">Kunne ikke laste resultattavle</p>';
    }
}

// ==============================================
// END PHOTO CHALLENGES MANAGEMENT FUNCTIONS
// ==============================================

// ==============================================
// FEEDBACK MANAGEMENT FUNCTIONS
// ==============================================

/**
 * Load all feedback from API
 */
async function loadFeedback() {
    try {
        const response = await fetch('/api/feedback');
        if (!response.ok) {
            throw new Error('Failed to load feedback');
        }

        allFeedback = await response.json();
        renderFeedback();
        updateFeedbackBadge();

    } catch (error) {
        console.error('Error loading feedback:', error);
        feedbackList.innerHTML = '<p class="text-center" style="color: #f44336;">Kunne ikke laste tilbakemeldinger</p>';
    }
}

/**
 * Render feedback list based on current filter
 */
function renderFeedback() {
    let filteredFeedback = [...allFeedback];

    // Apply filter
    const filterValue = feedbackFilter.value;
    if (filterValue === 'new') {
        filteredFeedback = filteredFeedback.filter(f => f.status === 'new');
    } else if (filterValue === 'read') {
        filteredFeedback = filteredFeedback.filter(f => f.status === 'read');
    } else if (filterValue === 'anonymous') {
        filteredFeedback = filteredFeedback.filter(f => f.is_anonymous === 1);
    } else if (filterValue === 'identified') {
        filteredFeedback = filteredFeedback.filter(f => f.is_anonymous === 0);
    }

    // Update count
    feedbackCount.textContent = filteredFeedback.length;

    // Render list
    if (filteredFeedback.length === 0) {
        feedbackList.innerHTML = '<p class="text-center" style="color: var(--text-light); padding: 40px;">Ingen tilbakemeldinger funnet</p>';
        return;
    }

    feedbackList.innerHTML = filteredFeedback.map(fb => renderFeedbackCard(fb)).join('');
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Render a single feedback card
 */
function renderFeedbackCard(fb) {
    const statusBadge = fb.status === 'new'
        ? '<span style="background: #4CAF50; color: white; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600;">✨ NY</span>'
        : '<span style="background: #9e9e9e; color: white; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600;">✓ LEST</span>';

    let fromBadge;
    if (fb.is_anonymous === 1) {
        fromBadge = '<span style="background: #9c27b0; color: white; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600;">🕵️ ANONYM</span>';
    } else {
        const name = `${fb.first_name || ''} ${fb.last_name || ''}`.trim();
        const club = fb.club ? ` (${escapeHtml(fb.club)})` : '';
        fromBadge = `<span style="background: #2196F3; color: white; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600;">👤 ${escapeHtml(name)}${club}</span>`;
    }

    const submittedTime = new Date(fb.submitted_at).toLocaleString('no-NO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const messagePreview = fb.message.length > 150
        ? escapeHtml(fb.message.substring(0, 150)) + '...'
        : escapeHtml(fb.message);

    return `
        <div class="team-card" style="cursor: pointer; ${fb.status === 'new' ? 'border-left: 5px solid #4CAF50;' : ''}" onclick="showFeedbackDetail(${fb.id})">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                ${fb.title ? `<h3 style="margin: 0; font-size: 18px; color: var(--primary-dark);">${escapeHtml(fb.title)}</h3>` : '<h3 style="margin: 0; font-size: 16px; color: var(--text-light); font-style: italic;">Ingen tittel</h3>'}
                <div style="display: flex; gap: 8px;">
                    ${statusBadge}
                </div>
            </div>

            <div style="margin-bottom: 10px;">
                ${fromBadge}
            </div>

            <p style="margin: 10px 0; color: var(--text-dark); line-height: 1.5; font-size: 14px;">${messagePreview}</p>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding-top: 10px; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0; font-size: 13px; color: var(--text-light);">📅 ${submittedTime}</p>
                <p style="margin: 0; font-size: 13px; color: var(--primary-color); font-weight: 600;">Klikk for å se detaljer →</p>
            </div>
        </div>
    `;
}

/**
 * Show feedback detail modal
 */
async function showFeedbackDetail(feedbackId) {
    try {
        const feedback = allFeedback.find(f => f.id === feedbackId);

        if (!feedback) {
            alert('Kunne ikke finne tilbakemelding');
            return;
        }

        currentFeedbackItem = feedback;

        // Populate modal
        if (feedback.title) {
            feedbackModalTitle.innerHTML = `<h3 style="margin: 0 0 15px 0; color: var(--primary-dark);">${escapeHtml(feedback.title)}</h3>`;
        } else {
            feedbackModalTitle.innerHTML = '';
        }

        feedbackModalMessage.textContent = feedback.message;

        // From (participant or anonymous)
        if (feedback.is_anonymous === 1) {
            feedbackModalFrom.textContent = '🕵️ Anonym';
        } else {
            const firstName = feedback.first_name || '';
            const lastName = feedback.last_name || '';
            const name = `${firstName} ${lastName}`.trim();
            const club = feedback.club ? ` (${feedback.club})` : '';
            feedbackModalFrom.textContent = `👤 ${name}${club}`;
        }

        // Submitted date/time
        const submittedTime = new Date(feedback.submitted_at).toLocaleString('no-NO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        feedbackModalSubmitted.textContent = submittedTime;

        // Status
        feedbackModalStatus.textContent = feedback.status === 'new' ? 'Ny (ulest)' : 'Lest';
        feedbackModalStatus.style.color = feedback.status === 'new' ? '#4CAF50' : '#9e9e9e';
        feedbackModalStatus.style.fontWeight = 'bold';

        // Read at
        if (feedback.read_at) {
            const readTime = new Date(feedback.read_at).toLocaleString('no-NO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            feedbackModalRead.textContent = readTime;
        } else {
            feedbackModalRead.textContent = '-';
        }

        // Update toggle button text
        toggleReadBtn.textContent = feedback.status === 'new' ? '✓ Merk som lest' : '✗ Merk som ulest';
        toggleReadBtn.className = feedback.status === 'new' ? 'button primary' : 'button secondary';

        // Show modal
        feedbackModal.classList.remove('hidden');

    } catch (error) {
        console.error('Error showing feedback detail:', error);
        alert('Kunne ikke vise tilbakemelding');
    }
}

/**
 * Close feedback modal
 */
function closeFeedbackModal() {
    feedbackModal.classList.add('hidden');
    currentFeedbackItem = null;
}

/**
 * Toggle feedback read/unread status
 */
async function toggleFeedbackReadStatus() {
    if (!currentFeedbackItem) return;

    try {
        const newStatus = currentFeedbackItem.status === 'new' ? 'read' : 'new';
        const endpoint = newStatus === 'read' ? 'read' : 'unread';

        const response = await fetch(`/api/feedback/${currentFeedbackItem.id}/${endpoint}`, {
            method: 'PUT'
        });

        if (!response.ok) {
            throw new Error('Failed to update status');
        }

        // Reload feedback
        await loadFeedback();

        // Re-show modal with updated data
        showFeedbackDetail(currentFeedbackItem.id);

    } catch (error) {
        console.error('Error toggling read status:', error);
        alert('Kunne ikke oppdatere status');
    }
}

/**
 * Delete feedback
 */
async function deleteFeedback() {
    if (!currentFeedbackItem) return;

    const confirmed = confirm('Er du sikker på at du vil slette denne tilbakemeldingen?\n\nDenne handlingen kan ikke angres.');

    if (!confirmed) return;

    try {
        const response = await fetch(`/api/feedback/${currentFeedbackItem.id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete feedback');
        }

        // Close modal
        closeFeedbackModal();

        // Reload feedback
        await loadFeedback();

        alert('Tilbakemelding slettet');

    } catch (error) {
        console.error('Error deleting feedback:', error);
        alert('Kunne ikke slette tilbakemelding');
    }
}

/**
 * Update feedback badge with count of new messages
 */
async function updateFeedbackBadge() {
    try {
        const response = await fetch('/api/feedback/count/new');
        if (!response.ok) {
            throw new Error('Failed to get count');
        }

        const data = await response.json();
        const count = data.count || 0;

        if (count > 0) {
            feedbackBadge.textContent = count;
            feedbackBadge.classList.remove('hidden');
        } else {
            feedbackBadge.classList.add('hidden');
        }

    } catch (error) {
        console.error('Error updating feedback badge:', error);
        // Don't show error to user, just log it
    }
}

// ==============================================
// END FEEDBACK MANAGEMENT FUNCTIONS
// ==============================================

// ==============================================
// PARTICIPANT CONNECTION FUNCTIONS
// ==============================================

/**
 * Detect local IP address and populate server URL
 */
async function detectLocalIP() {
    try {
        // Use the current hostname (will be local IP if accessed via IP)
        const hostname = window.location.hostname;
        const port = window.location.port;
        const protocol = window.location.protocol;

        // Construct URL to photo-challenges.html
        let baseURL = `${protocol}//${hostname}`;
        if (port) {
            baseURL += `:${port}`;
        }
        const fullURL = `${baseURL}/photo-challenges.html`;

        serverURL.value = fullURL;
        currentConnectionURL = fullURL;

        console.log('Detected server URL:', fullURL);
    } catch (error) {
        console.error('Error detecting IP:', error);
        alert('Kunne ikke finne IP-adresse. Vennligst skriv inn manuelt.');
    }
}

/**
 * Generate QR codes for WiFi and URL
 */
function generateConnectionQR() {
    const ssid = wifiSSID.value.trim();
    const password = wifiPassword.value.trim();
    const url = serverURL.value.trim();

    // Validate inputs
    if (!ssid) {
        alert('Vennligst skriv inn WiFi-navn (SSID)');
        wifiSSID.focus();
        return;
    }

    if (!password) {
        alert('Vennligst skriv inn WiFi-passord');
        wifiPassword.focus();
        return;
    }

    if (!url) {
        alert('Vennligst generer server URL først');
        detectIPBtn.click();
        return;
    }

    // Clear previous QR codes
    wifiQRPreview.innerHTML = '';
    urlQRPreview.innerHTML = '';

    // Generate WiFi QR code
    // Format: WIFI:T:WPA;S:ssid;P:password;;
    const wifiString = `WIFI:T:WPA;S:${ssid};P:${password};;`;
    new QRCode(wifiQRPreview, {
        text: wifiString,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    // Generate URL QR code
    new QRCode(urlQRPreview, {
        text: url,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    // Update preview text
    previewSSID.textContent = ssid;
    previewURL.textContent = url;

    // Show preview section
    qrPreview.classList.remove('hidden');

    // Enable buttons
    showConnectionScreenBtn.disabled = false;
    printConnectionBtn.disabled = false;

    console.log('QR codes generated successfully');
}

/**
 * Show connection screen in fullscreen/new window
 */
function showConnectionScreen() {
    const ssid = wifiSSID.value.trim();
    const password = wifiPassword.value.trim();
    const url = serverURL.value.trim();

    if (!ssid || !password || !url) {
        alert('Vennligst generer QR-koder først');
        return;
    }

    // Build URL with parameters
    const screenURL = `/connection-screen.html?ssid=${encodeURIComponent(ssid)}&password=${encodeURIComponent(password)}&url=${encodeURIComponent(url)}`;

    // Open in new window (fullscreen)
    window.open(screenURL, '_blank', 'width=1920,height=1080,toolbar=0,menubar=0,location=0');
}

/**
 * Print connection screen
 */
function printConnectionScreen() {
    const ssid = wifiSSID.value.trim();
    const password = wifiPassword.value.trim();
    const url = serverURL.value.trim();

    if (!ssid || !password || !url) {
        alert('Vennligst generer QR-koder først');
        return;
    }

    // Build URL with parameters
    const screenURL = `/connection-screen.html?ssid=${encodeURIComponent(ssid)}&password=${encodeURIComponent(password)}&url=${encodeURIComponent(url)}`;

    // Open in new window and trigger print
    const printWindow = window.open(screenURL, '_blank', 'width=1920,height=1080');

    // Wait for page to load, then print
    if (printWindow) {
        printWindow.addEventListener('load', () => {
            setTimeout(() => {
                printWindow.print();
            }, 500);
        });
    }
}

// ==============================================
// END PARTICIPANT CONNECTION FUNCTIONS
// ==============================================

// Make functions globally available
window.editParticipant = editParticipant;
window.viewPhoto = function(participantCode, photoPath) {
    openPhotoModal(participantCode, photoPath);
};
window.editCourse = editCourse;
window.deleteCourse = deleteCourse;
window.removeEnrollment = removeEnrollment;
window.editPhotoChallenge = editPhotoChallenge;
window.deletePhotoChallenge = deletePhotoChallenge;
window.openReviewSubmissionModal = openReviewSubmissionModal;
window.showFeedbackDetail = showFeedbackDetail;
