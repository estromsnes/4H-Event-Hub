// Transport Checklist Logic

document.addEventListener('DOMContentLoaded', () => {
    console.log('Transport checklist page loaded');
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

    // Load transport checklist
    await loadTransportChecklist();

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
 * Load transport checklist data
 */
async function loadTransportChecklist() {
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

        // Only show courses with participants
        const coursesWithEnrollments = coursesWithParticipants.filter(c => c.participants.length > 0);

        if (coursesWithEnrollments.length === 0) {
            container.innerHTML = `
                <div class="empty-room">
                    <p>Ingen kurs har påmeldte deltakere.</p>
                </div>
            `;
            return;
        }

        // Render courses
        container.innerHTML = coursesWithEnrollments
            .map(course => formatCourseChecklist(course))
            .join('');

    } catch (err) {
        console.error('Error loading transport checklist:', err);
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
 * Format a single course checklist section
 */
function formatCourseChecklist(course) {
    const participantCount = course.participants.length;

    return `
        <div class="room-section">
            <div class="room-header">
                <h2>${course.icon || '📚'} ${course.name}</h2>
                <div class="room-meta">
                    <p><strong>Kursholder:</strong> <span>${course.instructor || 'Ikke angitt'}</span></p>
                    <p><strong>Sted:</strong> <span>${course.location || 'Ikke angitt'}</span></p>
                    <p><strong>Antall deltakere:</strong> <span>${participantCount}</span></p>
                </div>
            </div>

            <table class="participants-table">
                <thead>
                    <tr>
                        <th class="participant-number">Nr</th>
                        <th class="participant-name">Navn</th>
                        <th class="participant-age">Alder</th>
                        <th class="participant-club">Klubb</th>
                        <th class="checkbox-header">✓<br>Oppmøte</th>
                        <th class="checkbox-header">✓<br>Transport<br>ut</th>
                        <th class="checkbox-header">✓<br>Kursholder</th>
                        <th class="checkbox-header">✓<br>Transport<br>tilbake</th>
                    </tr>
                </thead>
                <tbody>
                    ${course.participants.map((p, index) => `
                        <tr>
                            <td class="participant-number">${index + 1}</td>
                            <td class="participant-name">${p.last_name}, ${p.first_name}</td>
                            <td class="participant-age">${p.age || '-'}</td>
                            <td class="participant-club">${p.club || '-'}</td>
                            <td class="checkbox-cell"></td>
                            <td class="checkbox-cell"></td>
                            <td class="checkbox-cell"></td>
                            <td class="checkbox-cell"></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="signature-section">
                <div class="signature-lines">
                    <div>
                        <div class="signature-line"></div>
                        <div class="signature-label">Signatur - Oppmøtekontroll</div>
                    </div>
                    <div>
                        <div class="signature-line"></div>
                        <div class="signature-label">Signatur - Transport ut</div>
                    </div>
                    <div>
                        <div class="signature-line"></div>
                        <div class="signature-label">Signatur - Kursholder</div>
                    </div>
                    <div>
                        <div class="signature-line"></div>
                        <div class="signature-label">Signatur - Transport tilbake</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
