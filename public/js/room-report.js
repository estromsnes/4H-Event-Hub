// Room Report Logic

document.addEventListener('DOMContentLoaded', () => {
    console.log('Room report page loaded');
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

    // Load event info
    await loadEventInfo();

    // Load room report
    await loadRoomReport();

    // Check if auto-print is requested
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autoprint') === 'true') {
        setTimeout(() => {
            window.print();
        }, 1000);
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
 * Load room report data
 */
async function loadRoomReport() {
    const container = document.getElementById('roomsContainer');

    try {
        const response = await fetch('/api/sleeping-rooms/report/all');
        if (!response.ok) {
            throw new Error('Kunne ikke laste soverom-data');
        }

        const rooms = await response.json();

        if (rooms.length === 0) {
            container.innerHTML = `
                <div class="empty-room">
                    <p>Ingen soverom er opprettet ennå.</p>
                </div>
            `;
            return;
        }

        // Render each room
        container.innerHTML = rooms.map(room => formatRoomSection(room)).join('');

    } catch (err) {
        console.error('Error loading room report:', err);
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
 * Format a single room section
 */
function formatRoomSection(room) {
    const participants = room.participants || [];
    const occupancy = room.occupancy || 0;
    const capacity = room.capacity || 10;

    // Sort participants by last name, then first name
    participants.sort((a, b) => {
        const lastNameCompare = (a.last_name || '').localeCompare(b.last_name || '');
        if (lastNameCompare !== 0) return lastNameCompare;
        return (a.first_name || '').localeCompare(b.first_name || '');
    });

    return `
        <div class="room-section">
            <div class="room-header">
                <h2>🛏️ ${room.name}</h2>
                <div class="room-meta">
                    ${room.floor ? `<div><strong>Etasje:</strong> <span>${room.floor}</span></div>` : ''}
                    <div><strong>Kapasitet:</strong> <span>${occupancy} / ${capacity} plasser</span></div>
                    ${room.description ? `<div><strong>Beskrivelse:</strong> <span>${room.description}</span></div>` : ''}
                </div>
            </div>

            ${participants.length === 0 ? `
                <div class="empty-room">
                    <p>🚫 Ingen deltakere påmeldt til dette rommet</p>
                </div>
            ` : `
                <table class="participants-table">
                    <thead>
                        <tr>
                            <th class="participant-number">Nr</th>
                            <th class="participant-name">Navn</th>
                            <th class="participant-age">Alder</th>
                            <th class="participant-club">Klubb</th>
                            <th class="participant-notes">Merknad</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${participants.map((p, index) => `
                            <tr>
                                <td class="participant-number">${index + 1}</td>
                                <td class="participant-name">${p.first_name} ${p.last_name}</td>
                                <td class="participant-age">${p.age || '-'}</td>
                                <td class="participant-club">${p.club || '-'}</td>
                                <td class="participant-notes">${p.notes || ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `}

            ${room.notes ? `
                <div class="room-notes">
                    <strong>Romnotater:</strong> ${room.notes}
                </div>
            ` : ''}

            <div class="signature-section">
                <h3>Kontroll ved brann/evakuering</h3>
                <div class="signature-lines">
                    <div>
                        <div class="signature-line"></div>
                        <div class="signature-label">Kontrollert av (navn)</div>
                    </div>
                    <div>
                        <div class="signature-line"></div>
                        <div class="signature-label">Dato og klokkeslett</div>
                    </div>
                    <div>
                        <div class="signature-line"></div>
                        <div class="signature-label">Antall personer funnet</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
