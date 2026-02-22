const express = require('express');
const router = express.Router();

// POST reset all data
router.post('/reset', async (req, res) => {
    const db = req.app.locals.db;

    try {
        // List of tables to clear
        const tablesToClear = [
            'scan_log',
            'team_challenge_scans',
            'team_challenge_sessions',
            'scavenger_scans',
            'scavenger_sessions',
            'scavenger_checkpoints',
            'quiz_answers',
            'quiz_sessions',
            'quiz_questions',
            'tic_tac_toe_games',
            'photo_submissions',
            'photo_challenges',
            'program',
            'participant_courses',
            'courses',
            'teams',
            'participants'
        ];

        // Delete all data from tables (ignore errors if table doesn't exist)
        for (const table of tablesToClear) {
            try {
                await new Promise((resolve, reject) => {
                    db.run(`DELETE FROM ${table}`, [], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                console.log(`  ✓ Cleared ${table}`);
            } catch (err) {
                // Table might not exist, just log and continue
                console.log(`  ⚠ Skipped ${table} (${err.message})`);
            }
        }

        // Clear event info (set to defaults)
        try {
            await new Promise((resolve, reject) => {
                db.run(
                    `UPDATE event_info SET
                        event_name = '',
                        event_description = '',
                        location = '',
                        start_date = '',
                        end_date = '',
                        start_datetime = '',
                        organizer_name = '',
                        organizer_club = '',
                        organizer_contact = '',
                        logo_path = NULL`,
                    [],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
            console.log(`  ✓ Cleared event_info`);
        } catch (err) {
            console.log(`  ⚠ Skipped event_info (${err.message})`);
        }

        console.log('✅ All data cleared successfully');
        res.json({ message: 'Alle data er nullstilt' });

    } catch (err) {
        console.error('❌ Error resetting data:', err);
        res.status(500).json({ error: 'Kunne ikke nullstille data' });
    }
});

// POST load dummy data
router.post('/load-dummy-data', async (req, res) => {
    const db = req.app.locals.db;

    try {
        // Norwegian first names
        const firstNames = [
            'Emma', 'Olivia', 'Sofia', 'Nora', 'Ella', 'Maja', 'Emilie', 'Leah', 'Sara', 'Sofie',
            'Jakob', 'Emil', 'Lucas', 'Oliver', 'Oskar', 'Filip', 'Noah', 'Aksel', 'William', 'Magnus',
            'Ingrid', 'Astrid', 'Thea', 'Amalie', 'Ida', 'Frida', 'Tuva', 'Mathilde', 'Selma', 'Hedda',
            'Henrik', 'Tobias', 'Markus', 'Sander', 'Kristian', 'Martin', 'Jonas', 'Andreas', 'Thomas', 'Adrian'
        ];

        // Norwegian last names
        const lastNames = [
            'Hansen', 'Johansen', 'Olsen', 'Larsen', 'Andersen', 'Pedersen', 'Nilsen', 'Kristiansen',
            'Jensen', 'Karlsen', 'Johnsen', 'Pettersen', 'Eriksen', 'Berg', 'Haugen', 'Hagen',
            'Johannessen', 'Andreassen', 'Jacobsen', 'Dahl', 'Jørgensen', 'Halvorsen', 'Lund', 'Svendsen'
        ];

        // Norwegian club names
        const clubs = [
            'Eina 4H', 'Bøverbru 4H', 'Reinsvoll 4H', 'Raufoss 4H', 'Gjøvik 4H',
            'Kolbu 4H', 'Toten 4H', 'Vardal 4H', 'Østre Toten 4H', 'Vestre Toten 4H',
            'Lena 4H', 'Kapp 4H', 'Skreia 4H', 'Jevnaker 4H', 'Lunner 4H',
            'Gran 4H', 'Brandbu 4H', 'Jaren 4H', 'Hamar 4H', 'Brumunddal 4H'
        ];

        // Team names for participants
        const teamNames = [
            'Lag Rød', 'Lag Blå', 'Lag Grønn', 'Lag Gul', 'Lag Oransje',
            'Lag Lilla', 'Lag Rosa', 'Lag Turkis', 'Lag Brun', 'Lag Grå',
            'Lag Hvit', 'Lag Sort', 'Lag Sølv', 'Lag Gull', 'Lag Bronse'
        ];

        // Team names for leaders
        const leaderTeamNames = [
            'Lederlag Nord', 'Lederlag Sør', 'Lederlag Øst', 'Lederlag Vest'
        ];

        // Roles distribution
        const roles = [
            { role: 'Deltaker', weight: 70 },
            { role: 'Frivillig', weight: 15 },
            { role: 'Arrangør', weight: 10 },
            { role: 'Leder', weight: 5 }
        ];

        // Home locations (Norwegian cities/towns)
        const locations = [
            'Gjøvik', 'Toten', 'Hamar', 'Lillehammer', 'Oslo', 'Bergen', 'Trondheim',
            'Stavanger', 'Drammen', 'Fredrikstad', 'Kristiansand', 'Tromsø', 'Jevnaker', 'Lunner'
        ];

        // Create dummy event
        await new Promise((resolve, reject) => {
            db.run(
                `INSERT OR REPLACE INTO event_info (id, event_name, event_description, location, start_date, end_date, start_datetime, organizer_name, organizer_club, organizer_contact, active, allow_qr_upload)
                VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
                [
                    'Sommerleir 2026',
                    'En fantastisk helg med aktiviteter, konkurranser og moro for alle 4H-medlemmer!',
                    'Folkvang Kommunelokale, Eina',
                    '2026-06-20',
                    '2026-06-22',
                    '2026-06-20T16:00',
                    'Espen Strømsnes',
                    'Skautrollet 4H',
                    'estromsnes@gmail.com'
                ],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Create teams
        for (const teamName of teamNames) {
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO teams (name, description, max_members)
                     VALUES (?, ?, ?)`,
                    [teamName, `${teamName} - Et fantastisk lag!`, 10],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        // Create courses
        const courses = [
            {
                name: 'Melkeforedling',
                description: 'Lær å lage ost, yoghurt og smør',
                instructor: 'Anne Karine',
                location: 'Kjøkkenet',
                maxParticipants: 12,
                icon: '🧀'
            },
            {
                name: 'Styrketrening',
                description: 'Bli sterkere og få bedre kondisjon',
                instructor: 'Lars Petter',
                location: 'Gymsal',
                maxParticipants: 20,
                icon: '💪'
            },
            {
                name: 'Volleyball',
                description: 'Lær teknikk og spill volleyball',
                instructor: 'Nina Berg',
                location: 'Idrettshall',
                maxParticipants: 16,
                icon: '🏐'
            },
            {
                name: 'Matlaging',
                description: 'Lag deilig mat fra bunnen av',
                instructor: 'Tom Hagen',
                location: 'Storkjøkkenet',
                maxParticipants: 15,
                icon: '👨‍🍳'
            },
            {
                name: 'Håndarbeid',
                description: 'Strikking, hekling og søm',
                instructor: 'Berit Holm',
                location: 'Hobbyrommet',
                maxParticipants: 12,
                icon: '🧶'
            },
            {
                name: 'Foto og film',
                description: 'Ta bedre bilder og lag små filmer',
                instructor: 'Martin Lie',
                location: 'Mediarommet',
                maxParticipants: 10,
                icon: '📷'
            }
        ];

        const courseIds = [];
        for (const course of courses) {
            const courseId = await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO courses (name, description, instructor, location, max_participants, icon)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [course.name, course.description, course.instructor, course.location, course.maxParticipants, course.icon],
                    function(err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    }
                );
            });
            courseIds.push(courseId);
        }

        // Generate 100 participants
        const participants = [];
        for (let i = 1; i <= 100; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const club = clubs[Math.floor(Math.random() * clubs.length)];
            const location = locations[Math.floor(Math.random() * locations.length)];

            // Weighted role selection
            const roleRand = Math.random() * 100;
            let cumulativeWeight = 0;
            let selectedRole = 'Deltaker';
            for (const { role, weight } of roles) {
                cumulativeWeight += weight;
                if (roleRand <= cumulativeWeight) {
                    selectedRole = role;
                    break;
                }
            }

            // Age based on role
            let age;
            if (selectedRole === 'Deltaker') {
                age = 9 + Math.floor(Math.random() * 10); // 9-18
            } else if (selectedRole === 'Frivillig') {
                age = 16 + Math.floor(Math.random() * 8); // 16-23
            } else {
                age = 20 + Math.floor(Math.random() * 25); // 20-44
            }

            // Assign team based on role
            let team = null;
            if (selectedRole === 'Deltaker') {
                // Deltaker: assign to participant teams (80% have teams)
                team = Math.random() < 0.8
                    ? teamNames[Math.floor(Math.random() * teamNames.length)]
                    : null;
            } else if (selectedRole === 'Leder') {
                // Leder: assign to leader teams (all leaders get a team)
                team = leaderTeamNames[Math.floor(Math.random() * leaderTeamNames.length)];
            }
            // Frivillig and Arrangør: no team (null)

            const participantCode = `TEST${String(i).padStart(4, '0')}`;

            participants.push({
                code: participantCode,
                firstName,
                lastName,
                age,
                location,
                club,
                role: selectedRole,
                team
            });
        }

        // Insert participants
        for (const p of participants) {
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO participants (participant_code, first_name, last_name, age, home_location, club, role, team)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [p.code, p.firstName, p.lastName, p.age, p.location, p.club, p.role, p.team],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        // Enroll participants in courses (each participant in 1-2 courses)
        for (const p of participants) {
            // Skip enrolling non-participants (Arrangør, Leder, Frivillig)
            if (p.role !== 'Deltaker') continue;

            // Each participant enrolls in 1-2 courses
            const numCourses = Math.random() < 0.6 ? 1 : 2;
            const selectedCourses = [];

            // Randomly select courses
            for (let i = 0; i < numCourses; i++) {
                let courseId;
                do {
                    courseId = courseIds[Math.floor(Math.random() * courseIds.length)];
                } while (selectedCourses.includes(courseId));

                selectedCourses.push(courseId);

                await new Promise((resolve, reject) => {
                    db.run(
                        `INSERT INTO participant_courses (participant_code, course_id)
                         VALUES (?, ?)`,
                        [p.code, courseId],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
            }
        }

        // Create quiz questions
        const quizQuestions = [
            {
                question: 'Hva er hovedstaden i Norge?',
                optionA: 'Bergen',
                optionB: 'Oslo',
                optionC: 'Trondheim',
                optionD: 'Stavanger',
                correct: 'B',
                order: 1
            },
            {
                question: 'Hvor mange H-er står 4H for?',
                optionA: '3',
                optionB: '4',
                optionC: '5',
                optionD: '6',
                correct: 'B',
                order: 2
            },
            {
                question: 'Hva heter Norges høyeste fjell?',
                optionA: 'Galdhøpiggen',
                optionB: 'Glittertind',
                optionC: 'Snøhetta',
                optionD: 'Kebnekaise',
                correct: 'A',
                order: 3
            },
            {
                question: 'Hvilket år ble 4H Norge stiftet?',
                optionA: '1915',
                optionB: '1920',
                optionC: '1925',
                optionD: '1930',
                correct: 'A',
                order: 4
            },
            {
                question: 'Hva står de fire H-ene for?',
                optionA: 'Hode, Hjerte, Hender, Helse',
                optionB: 'Høy, Hyggelig, Hjelpsom, Handlekraftig',
                optionC: 'Håp, Humor, Hygge, Harmoni',
                optionD: 'Historie, Hobby, Hage, Husdyr',
                correct: 'A',
                order: 5
            }
        ];

        for (const q of quizQuestions) {
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO quiz_questions (question_text, option_a, option_b, option_c, option_d, correct_option, order_number, active)
                     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
                    [q.question, q.optionA, q.optionB, q.optionC, q.optionD, q.correct, q.order],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        // Create scavenger hunt checkpoints
        const checkpoints = [
            {
                name: 'Ved hovedinngangen',
                clue: 'Se etter stedet hvor alle kommer inn. QR-koden henger på veggen ved døren.',
                qrCode: 'SCAV_CHECKPOINT_1',
                order: 1
            },
            {
                name: 'I kjøkkenet',
                clue: 'Her lages det mat og drikke. QR-koden er ved kjøleskapet.',
                qrCode: 'SCAV_CHECKPOINT_2',
                order: 2
            },
            {
                name: 'Ved aktivitetsrommet',
                clue: 'Her foregår mange aktiviteter. Se etter QR-koden på tavlen.',
                qrCode: 'SCAV_CHECKPOINT_3',
                order: 3
            },
            {
                name: 'Ved utegården',
                clue: 'Gå ut og se etter dyr og aktiviteter. QR-koden er ved gjerdet.',
                qrCode: 'SCAV_CHECKPOINT_4',
                order: 4
            },
            {
                name: 'Ved lagerrommet',
                clue: 'Her oppbevares utstyr og materiell. QR-koden er på døren.',
                qrCode: 'SCAV_CHECKPOINT_5',
                order: 5
            }
        ];

        for (const cp of checkpoints) {
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO scavenger_checkpoints (name, clue, qr_code, order_number, active)
                     VALUES (?, ?, ?, ?, 1)`,
                    [cp.name, cp.clue, cp.qrCode, cp.order],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        // Create program schedule (Friday afternoon to Sunday morning)
        const programItems = [
            // Friday (Day 1)
            {
                title: 'Ankomst og innsjekking',
                description: 'Finn ditt rom og pakk ut',
                startTime: '16:00',
                endTime: '17:30',
                location: 'Folkvang',
                dayNumber: 1,
                order: 1
            },
            {
                title: 'Middag',
                description: 'Taco-buffet',
                startTime: '17:30',
                endTime: '18:30',
                location: 'Storsalen',
                dayNumber: 1,
                order: 2
            },
            {
                title: 'Velkomst og informasjon',
                description: 'Oversikt over helgen og praktisk info',
                startTime: '18:30',
                endTime: '19:00',
                location: 'Storsalen',
                dayNumber: 1,
                order: 3
            },
            {
                title: 'Bli-kjent aktiviteter',
                description: 'Morsomme leker og aktiviteter for å bli bedre kjent',
                startTime: '19:00',
                endTime: '20:30',
                location: 'Storsalen',
                dayNumber: 1,
                order: 4
            },
            {
                title: 'Kiosk åpen',
                description: 'Snacks og godt til kjøps',
                startTime: '20:30',
                endTime: '21:30',
                location: 'Gangen',
                dayNumber: 1,
                order: 5
            },
            {
                title: 'Sosialt / Fritid',
                description: 'Spill, prat og hygge',
                startTime: '21:30',
                endTime: '23:00',
                location: 'Storsalen',
                dayNumber: 1,
                order: 6
            },
            {
                title: 'Nattero',
                description: 'Alle på rommet',
                startTime: '23:00',
                endTime: '23:30',
                location: '',
                dayNumber: 1,
                order: 7
            },

            // Saturday (Day 2)
            {
                title: 'Frokost',
                description: 'God start på dagen',
                startTime: '08:00',
                endTime: '09:00',
                location: 'Storsalen',
                dayNumber: 2,
                order: 1
            },
            {
                title: 'Morgensamling',
                description: 'Informasjon om dagens program',
                startTime: '09:00',
                endTime: '09:15',
                location: 'Storsalen',
                dayNumber: 2,
                order: 2
            },
            {
                title: 'Quiz',
                description: 'Test kunnskapen din i lagkonkurranse',
                startTime: '09:15',
                endTime: '10:00',
                location: 'Storsalen',
                dayNumber: 2,
                order: 3
            },
            {
                title: 'QR Skattejakt',
                description: 'Finn alle sjekkpunktene rundt omkring',
                startTime: '10:00',
                endTime: '11:30',
                location: 'Ute og inne',
                dayNumber: 2,
                order: 4
            },
            {
                title: 'Lunsj',
                description: 'Pannekaker med syltetøy',
                startTime: '11:30',
                endTime: '12:30',
                location: 'Storsalen',
                dayNumber: 2,
                order: 5
            },
            {
                title: 'Lagkonkurranse',
                description: 'Skann QR-koder sammen og ta lagbilde',
                startTime: '12:30',
                endTime: '13:30',
                location: 'Storsalen',
                dayNumber: 2,
                order: 6
            },
            {
                title: 'Tripp-Trapp-Tresko turnering',
                description: 'Hvem blir mester?',
                startTime: '13:30',
                endTime: '15:00',
                location: 'Storsalen',
                dayNumber: 2,
                order: 7
            },
            {
                title: 'Utendørsaktiviteter',
                description: 'Lek og moro i friluft',
                startTime: '15:00',
                endTime: '17:00',
                location: 'Uteområdet',
                dayNumber: 2,
                order: 8
            },
            {
                title: 'Middag',
                description: 'Kjøttboller med poteter',
                startTime: '17:00',
                endTime: '18:00',
                location: 'Storsalen',
                dayNumber: 2,
                order: 9
            },
            {
                title: 'Underholdning',
                description: 'Talentshow - vis hva du kan!',
                startTime: '18:00',
                endTime: '20:00',
                location: 'Storsalen',
                dayNumber: 2,
                order: 10
            },
            {
                title: 'Kiosk åpen',
                description: 'Siste sjanse for godteri',
                startTime: '20:00',
                endTime: '21:00',
                location: 'Gangen',
                dayNumber: 2,
                order: 11
            },
            {
                title: 'Film og popcorn',
                description: 'Slapp av med god film',
                startTime: '21:00',
                endTime: '23:00',
                location: 'Storsalen',
                dayNumber: 2,
                order: 12
            },
            {
                title: 'Nattero',
                description: 'God natt!',
                startTime: '23:00',
                endTime: '23:30',
                location: '',
                dayNumber: 2,
                order: 13
            },

            // Sunday (Day 3)
            {
                title: 'Frokost',
                description: 'Siste frokost sammen',
                startTime: '08:00',
                endTime: '09:00',
                location: 'Storsalen',
                dayNumber: 3,
                order: 1
            },
            {
                title: 'Pakking og rydding',
                description: 'Rydd rommet og pakk sammen',
                startTime: '09:00',
                endTime: '09:45',
                location: 'Rom',
                dayNumber: 3,
                order: 2
            },
            {
                title: 'Avslutning og premieutdeling',
                description: 'Oppsummering av helgen og premier til vinnere',
                startTime: '09:45',
                endTime: '10:30',
                location: 'Storsalen',
                dayNumber: 3,
                order: 3
            },
            {
                title: 'Hjemreise',
                description: 'Takk for en fantastisk helg!',
                startTime: '10:30',
                endTime: '11:00',
                location: 'Folkvang',
                dayNumber: 3,
                order: 4
            }
        ];

        for (const item of programItems) {
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO program (title, description, start_time, end_time, location, day_number, order_number)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [item.title, item.description, item.startTime, item.endTime, item.location, item.dayNumber, item.order],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        // Create photo challenges
        const photoChallenges = [
            {
                title: 'Blid 4H-leder',
                description: 'Ta bilde av en smilende 4H-leder',
                points: 10,
                icon: '😊',
                order: 1
            },
            {
                title: 'Alle på laget står på ett ben',
                description: 'Hele laget må stå på ett ben samtidig',
                points: 15,
                icon: '🦩',
                order: 2
            },
            {
                title: 'Menneskepyramide',
                description: 'Lag en pyramide med hele laget',
                points: 20,
                icon: '🔺',
                order: 3
            },
            {
                title: 'Finne noe grønt',
                description: 'Ta bilde av laget med noe grønt (4H-fargen!)',
                points: 10,
                icon: '💚',
                order: 4
            },
            {
                title: 'Kreativ lagstilling',
                description: 'Lag en kreativ og morsom posisjon sammen',
                points: 15,
                icon: '🎭',
                order: 5
            },
            {
                title: 'Finne et kløverblad',
                description: 'Ta bilde av laget med et ekte kløverblad',
                points: 20,
                icon: '🍀',
                order: 6
            }
        ];

        for (const challenge of photoChallenges) {
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO photo_challenges (title, description, points, icon, active, order_number)
                     VALUES (?, ?, ?, ?, 1, ?)`,
                    [challenge.title, challenge.description, challenge.points, challenge.icon, challenge.order],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        console.log('✅ Dummy data loaded successfully');
        console.log(`   - Event: Sommerleir 2026`);
        console.log(`   - Participants: ${participants.length}`);
        console.log(`   - Clubs: ${clubs.length}`);
        console.log(`   - Teams: ${teamNames.length}`);
        console.log(`   - Courses: ${courses.length}`);
        console.log(`   - Quiz questions: ${quizQuestions.length}`);
        console.log(`   - Scavenger checkpoints: ${checkpoints.length}`);
        console.log(`   - Photo challenges: ${photoChallenges.length}`);
        console.log(`   - Program items: ${programItems.length}`);

        res.json({
            message: 'Testdata lastet inn',
            stats: {
                event: 'Sommerleir 2026',
                participants: participants.length,
                clubs: clubs.length,
                teams: teamNames.length,
                courses: courses.length,
                quizQuestions: quizQuestions.length,
                checkpoints: checkpoints.length,
                photoChallenges: photoChallenges.length,
                programItems: programItems.length
            }
        });

    } catch (err) {
        console.error('❌ Error loading dummy data:', err);
        res.status(500).json({ error: 'Kunne ikke laste testdata' });
    }
});

// POST bulk create teams
router.post('/bulk-create-teams', async (req, res) => {
    const db = req.app.locals.db;
    const { count } = req.body;

    if (!count || count < 1 || count > 50) {
        return res.status(400).json({ error: 'Antall lag må være mellom 1 og 50' });
    }

    try {
        // Norwegian adjectives and nouns grouped by starting letter
        const wordsByLetter = {
            'B': {
                adjectives: ['Blide', 'Brave', 'Blå', 'Brune', 'Brede', 'Blanke', 'Behagelige'],
                nouns: ['Bjørner', 'Bier', 'Bever', 'Bønder', 'Bøtter', 'Bengaler', 'Busker']
            },
            'D': {
                adjectives: ['Dyktige', 'Dristige', 'Dedikerte', 'Dumsnille', 'Deilige'],
                nouns: ['Duer', 'Delfiner', 'Dukkemakere', 'Dansere', 'Drager']
            },
            'F': {
                adjectives: ['Flinke', 'Friske', 'Frekke', 'Frodige', 'Fulle', 'Fantastiske'],
                nouns: ['Flaggermus', 'Froer', 'Fisker', 'Fjellrev', 'Fanger', 'Fjelltopper']
            },
            'G': {
                adjectives: ['Glade', 'Greie', 'Grønne', 'Gule', 'Gnistrende', 'Gode'],
                nouns: ['Geiter', 'Griser', 'Grevling', 'Grisunger', 'Gjeter', 'Gjenger']
            },
            'H': {
                adjectives: ['Harde', 'Hyggelige', 'Høye', 'Heldige', 'Hurtige'],
                nouns: ['Høner', 'Hester', 'Haier', 'Harer', 'Hunder']
            },
            'K': {
                adjectives: ['Kloke', 'Kule', 'Kreative', 'Kjekke', 'Kraftige'],
                nouns: ['Kyllinger', 'Kaniner', 'Katter', 'Kameleon', 'Konger']
            },
            'L': {
                adjectives: ['Lure', 'Lyse', 'Livlige', 'Lekne', 'Lattermilde'],
                nouns: ['Lam', 'Løver', 'Laks', 'Leoparder', 'Lusker']
            },
            'M': {
                adjectives: ['Modige', 'Muntre', 'Morsomme', 'Mektige', 'Magiske'],
                nouns: ['Melkekyr', 'Maur', 'Mus', 'Moskus', 'Måker']
            },
            'R': {
                adjectives: ['Raske', 'Rare', 'Rappe', 'Robuste', 'Røde'],
                nouns: ['Rever', 'Rådyr', 'Reinsdyr', 'Rotter', 'Rompetroll']
            },
            'S': {
                adjectives: ['Spreke', 'Smarte', 'Snille', 'Stolte', 'Sterke', 'Sprø'],
                nouns: ['Sauer', 'Snegler', 'Sauegjeter', 'Storker', 'Spader']
            },
            'T': {
                adjectives: ['Tøffe', 'Tålmodige', 'Trofaste', 'Tøyelige', 'Tapre'],
                nouns: ['Traktorer', 'Turteldue', 'Tigere', 'Tusser', 'Trollmenn']
            },
            'V': {
                adjectives: ['Ville', 'Vennlige', 'Varme', 'Vidunderlige', 'Vakre'],
                nouns: ['Vannhjul', 'Villsvin', 'Vepser', 'Varger', 'Vesener']
            }
        };

        // Get all existing team names to avoid duplicates
        const existingTeams = await new Promise((resolve, reject) => {
            db.all('SELECT name FROM teams', [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(r => r.name));
            });
        });

        const existingNamesSet = new Set(existingTeams);
        const newTeams = [];
        const letters = Object.keys(wordsByLetter);

        // Shuffle letters to get random order but ensure different letters
        const shuffledLetters = [...letters].sort(() => Math.random() - 0.5);

        // Generate team names - cycle through different letters
        let letterIndex = 0;
        let attempts = 0;
        const maxAttempts = count * 10;

        while (newTeams.length < count && attempts < maxAttempts) {
            attempts++;

            // Pick the next letter in sequence (cycles through all letters)
            const letter = shuffledLetters[letterIndex % shuffledLetters.length];
            const { adjectives, nouns } = wordsByLetter[letter];

            // Pick random adjective and noun from this letter
            const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
            const noun = nouns[Math.floor(Math.random() * nouns.length)];

            const teamName = `${adjective} ${noun}`;

            // Check if name already exists
            if (!existingNamesSet.has(teamName) && !newTeams.includes(teamName)) {
                newTeams.push(teamName);
                existingNamesSet.add(teamName);
                letterIndex++; // Move to next letter only when we successfully create a team
            }
        }

        if (newTeams.length < count) {
            return res.status(400).json({
                error: `Kunne bare generere ${newTeams.length} unike lagnavn. Prøv med et lavere tall.`
            });
        }

        // Insert teams into database
        for (const teamName of newTeams) {
            await new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO teams (name, max_members) VALUES (?, ?)',
                    [teamName, 5],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        console.log(`✅ Created ${newTeams.length} teams`);
        console.log(`   Teams: ${newTeams.join(', ')}`);

        res.json({
            message: `${newTeams.length} lag opprettet`,
            teams: newTeams
        });

    } catch (err) {
        console.error('❌ Error creating teams:', err);
        res.status(500).json({ error: 'Kunne ikke opprette lag' });
    }
});

module.exports = router;
