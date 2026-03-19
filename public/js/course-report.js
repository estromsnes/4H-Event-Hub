// Course Report Logic

document.addEventListener('DOMContentLoaded', () => {
    console.log('Course report page loaded');
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

    // Load course report
    await loadCourseReport();

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
 * Load course report data
 */
async function loadCourseReport() {
    const container = document.getElementById('coursesContainer');

    try {
        // Fetch all courses
        const coursesResponse = await fetch('/api/courses');
        if (!coursesResponse.ok) {
            throw new Error('Kunne ikke laste kursdata');
        }

        const courses = await coursesResponse.json();

        if (courses.length === 0) {
            container.innerHTML = `
                <div class="empty-room">
                    <p>Ingen kurs er registrert.</p>
                </div>
            `;
            return;
        }

        // Sort courses by name
        courses.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        // Fetch participants for each course
        const coursesWithParticipants = await Promise.all(
            courses.map(async (course) => {
                try {
                    const participantsResponse = await fetch(`/api/courses/${course.id}/participants`);
                    if (participantsResponse.ok) {
                        const participants = await participantsResponse.json();
                        // Sort participants by club, then last name, then first name
                        participants.sort((a, b) => {
                            // First sort by club
                            const clubCompare = (a.club || '').localeCompare(b.club || '');
                            if (clubCompare !== 0) return clubCompare;

                            // Then by last name
                            const lastNameCompare = (a.last_name || '').localeCompare(b.last_name || '');
                            if (lastNameCompare !== 0) return lastNameCompare;

                            // Finally by first name
                            return (a.first_name || '').localeCompare(b.first_name || '');
                        });
                        return { ...course, participants };
                    }
                    return { ...course, participants: [] };
                } catch (err) {
                    console.error(`Error loading participants for course ${course.id}:`, err);
                    return { ...course, participants: [] };
                }
            })
        );

        // Render courses
        container.innerHTML = coursesWithParticipants
            .map(course => formatCourseSection(course))
            .join('');

    } catch (err) {
        console.error('Error loading course report:', err);
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
 * Format a single course section
 */
function formatCourseSection(course) {
    const participantCount = course.participants.length;
    const maxParticipants = course.max_participants || 15;
    const spotsLeft = Math.max(0, maxParticipants - participantCount);

    return `
        <div class="room-section">
            <div class="room-header">
                <h2>${course.icon || '📚'} ${course.name}</h2>
                <div class="room-meta">
                    <p><strong>Kursholder:</strong> <span>${course.instructor || 'Ikke angitt'}</span></p>
                    <p><strong>Sted:</strong> <span>${course.location || 'Ikke angitt'}</span></p>
                    <p><strong>Påmeldte:</strong> <span>${participantCount} / ${maxParticipants}</span></p>
                    <p><strong>Ledige plasser:</strong> <span>${spotsLeft}</span></p>
                </div>
            </div>

            ${course.description ? `
                <div style="margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                    <strong>Beskrivelse:</strong> ${course.description}
                </div>
            ` : ''}

            ${participantCount > 0 ? `
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
                        ${course.participants.map((p, index) => `
                            <tr>
                                <td class="participant-number">${index + 1}</td>
                                <td class="participant-name">${p.last_name}, ${p.first_name}</td>
                                <td class="participant-age">${p.age || '-'}</td>
                                <td class="participant-club">${p.club || '-'}</td>
                                <td class="participant-notes">${p.notes || ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : `
                <div class="empty-room">
                    <p>Ingen deltakere er påmeldt dette kurset.</p>
                </div>
            `}
        </div>
    `;
}
