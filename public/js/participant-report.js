// Participant Report Logic

document.addEventListener('DOMContentLoaded', () => {
    console.log('Participant report page loaded');
    initReport();
});

async function initReport() {
    // Set current date and time
    const now = new Date();
    const dateStr = now.toLocaleDateString('no-NO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('no-NO', {
        hour: '2-digit',
        minute: '2-digit'
    });

    document.getElementById('reportDate').textContent = dateStr;
    document.getElementById('reportTime').textContent = timeStr;
    document.getElementById('footerDate').textContent = dateStr;

    // Get filter from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const filterType = urlParams.get('filter') || 'all';

    // Update title based on filter
    updateTitles(filterType);

    // Load event info
    await loadEventInfo();

    // Load participant report
    await loadParticipantReport(filterType);

    // Check if auto-print is requested
    if (urlParams.get('autoprint') === 'true') {
        setTimeout(() => {
            window.print();
        }, 1000);
    }
}

/**
 * Update page titles based on filter type
 */
function updateTitles(filterType) {
    const filterNames = {
        'all': 'Alle deltakere',
        'confirmed': 'Bekreftede deltakere',
        'unconfirmed': 'Ubekreftede deltakere',
        'no-show': 'No-show deltakere',
        'no-room': 'Deltakere uten soverom'
    };

    const filterName = filterNames[filterType] || 'Deltakere';

    document.getElementById('reportHeaderTitle').textContent = `👥 ${filterName}`;
    document.getElementById('printHeaderTitle').textContent = filterName;

    // Show filter info if not "all"
    if (filterType !== 'all') {
        document.getElementById('filterInfo').style.display = 'block';
        document.getElementById('filterType').textContent = filterName;
    }
}

/**
 * Load event information
 */
async function loadEventInfo() {
    try {
        const response = await fetch('/api/event');
        if (!response.ok) return;

        const event = await response.json();
        if (event && event.event_name) {
            document.getElementById('reportEvent').textContent = event.event_name;
        }
    } catch (err) {
        console.error('Error loading event info:', err);
    }
}

/**
 * Load participant report data
 */
async function loadParticipantReport(filterType) {
    const container = document.getElementById('participantsContainer');

    try {
        // Fetch all participants
        const response = await fetch('/api/participants');
        if (!response.ok) {
            throw new Error('Kunne ikke laste deltaker-data');
        }

        let participants = await response.json();

        // Apply filter
        participants = applyFilter(participants, filterType);

        if (participants.length === 0) {
            container.innerHTML = `
                <div class="empty-room">
                    <p>Ingen deltakere matcher filteret.</p>
                </div>
            `;
            return;
        }

        // Sort participants by last name, then first name
        participants.sort((a, b) => {
            const lastNameCompare = (a.last_name || '').localeCompare(b.last_name || '');
            if (lastNameCompare !== 0) return lastNameCompare;
            return (a.first_name || '').localeCompare(b.first_name || '');
        });

        // Fetch room data for room names
        let rooms = [];
        try {
            const roomsResponse = await fetch('/api/sleeping-rooms');
            if (roomsResponse.ok) {
                rooms = await roomsResponse.json();
            }
        } catch (err) {
            console.error('Error loading rooms:', err);
        }

        // Render participants table
        container.innerHTML = formatParticipantsTable(participants, rooms, filterType);

    } catch (err) {
        console.error('Error loading participant report:', err);
        container.innerHTML = `
            <div class="error">
                <p><strong>Feil ved lasting av data</strong></p>
                <p>${err.message}</p>
                <p>Vennligst last siden på nytt.</p>
            </div>
        `;
    }
}

/**
 * Apply filter to participants
 */
function applyFilter(participants, filterType) {
    switch (filterType) {
        case 'confirmed':
            return participants.filter(p => p.confirmed === 1 && p.no_show !== 1);
        case 'unconfirmed':
            return participants.filter(p => p.confirmed !== 1 && p.no_show !== 1);
        case 'no-show':
            return participants.filter(p => p.no_show === 1);
        case 'no-room':
            return participants.filter(p => !p.sleeping_room_id);
        case 'all':
        default:
            return participants;
    }
}

/**
 * Format participants table
 */
function formatParticipantsTable(participants, rooms, filterType) {
    const showRoomColumn = filterType === 'no-room' || filterType === 'all';

    return `
        <div class="room-section">
            <div style="margin-bottom: 15px;">
                <p style="font-size: 16px;"><strong>Antall deltakere:</strong> ${participants.length}</p>
            </div>

            <table class="participants-table">
                <thead>
                    <tr>
                        <th class="participant-number">Nr</th>
                        <th class="participant-name">Navn</th>
                        <th class="participant-age">Alder</th>
                        <th class="participant-club">Klubb</th>
                        ${showRoomColumn ? '<th class="participant-room">Soverom</th>' : ''}
                        <th class="participant-notes">Merknad</th>
                    </tr>
                </thead>
                <tbody>
                    ${participants.map((p, index) => {
                        const roomName = p.sleeping_room_id
                            ? (rooms.find(r => r.id === p.sleeping_room_id)?.name || 'Ukjent')
                            : '-';

                        return `
                            <tr>
                                <td class="participant-number">${index + 1}</td>
                                <td class="participant-name">${p.last_name}, ${p.first_name}</td>
                                <td class="participant-age">${p.age || '-'}</td>
                                <td class="participant-club">${p.club || '-'}</td>
                                ${showRoomColumn ? `<td class="participant-room">${roomName}</td>` : ''}
                                <td class="participant-notes">${p.notes || ''}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}
