// Participant cards printing
let participants = [];
let eventInfo = null;

/**
 * Get URL parameter by name
 */
function getURLParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Load data on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
});

/**
 * Load event info and participants
 */
async function loadData() {
    const cardsContainer = document.getElementById('cardsContainer');

    try {
        // Load event information
        const eventResponse = await fetch('/api/event/');
        if (eventResponse.ok) {
            eventInfo = await eventResponse.json();
        }

        // Load participants
        const participantsResponse = await fetch('/api/participants');
        if (!participantsResponse.ok) {
            throw new Error('Kunne ikke laste deltakere');
        }

        participants = await participantsResponse.json();

        // Check if specific participant codes are requested via URL parameter
        const requestedCodes = getURLParameter('codes');
        let filteredParticipants = participants;

        if (requestedCodes) {
            // Split comma-separated codes and filter
            const codesArray = requestedCodes.split(',').map(c => c.trim());
            filteredParticipants = participants.filter(p =>
                codesArray.includes(p.participant_code) && p.qr_code_path
            );
        } else {
            // No specific codes requested - show all with QR codes
            filteredParticipants = participants.filter(p => p.qr_code_path);
        }

        if (filteredParticipants.length === 0) {
            const message = requestedCodes
                ? 'Ingen deltakere funnet med de angitte kodene.'
                : 'Ingen deltakere med QR-koder funnet.';
            cardsContainer.innerHTML = `<p class="error">${message}</p>`;
            return;
        }

        // Render cards
        renderCards(filteredParticipants);

        // Auto-print if specific participant(s) requested
        if (requestedCodes) {
            setTimeout(() => window.print(), 500);
        }

    } catch (error) {
        console.error('Error loading data:', error);
        cardsContainer.innerHTML = `<p class="error">Feil ved lasting av deltakerkort: ${error.message}</p>`;
    }
}

/**
 * Render participant cards
 */
function renderCards(participants) {
    const cardsContainer = document.getElementById('cardsContainer');
    const eventName = eventInfo ? eventInfo.event_name : '4H Event Hub';
    const logoPath = eventInfo && eventInfo.logo_path ? eventInfo.logo_path : '/images/4H-logo-O2.png';

    const cardsHTML = participants.map(p => {
        const fullName = `${p.first_name} ${p.last_name}`.trim();
        const teamInfo = p.team ? `<p><strong>Lag:</strong> ${p.team}</p>` : '';
        const clubInfo = p.club ? `<p><strong>Klubb:</strong> ${p.club}</p>` : '';
        const loginWord = p.login_word
            ? `<div class="login-word-section">
                   <div class="login-word-label">Login-ord:</div>
                   <div class="card-login-word">${p.login_word}</div>
               </div>`
            : '<p class="no-login-word">Ingen login-ord</p>';

        return `
            <div class="card">
                <div class="card-header">
                    <img src="${logoPath}" alt="4H Logo" class="card-logo" onerror="this.style.display='none'">
                    <div class="card-event-name">${eventName}</div>
                </div>
                <img src="/api/qr/${p.participant_code}" alt="${p.participant_code}" class="card-qr">
                <div class="card-name">${fullName}</div>
                ${loginWord}
                <div class="card-info">
                    ${teamInfo}
                    ${clubInfo}
                    <div class="card-code">${p.participant_code}</div>
                </div>
            </div>
        `;
    }).join('');

    cardsContainer.innerHTML = `<div class="cards-grid">${cardsHTML}</div>`;
}
