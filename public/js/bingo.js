class BingoGame {
    constructor() {
        this.participantCode = null;
        this.cardId = null;
        this.tasks = [];
        this.layout = [];
        this.completions = [];
        this.achievements = { rows: [], columns: [], diagonals: [], fullCard: false };
        this.stats = null;
        this.config = null;
        this.currentTaskPosition = null;
        this.currentTaskId = null;

        // Scanners
        this.participantScanner = new QRScanner();
        this.taskScanner = new QRScanner();
        this.auth = new ParticipantAuth();

        // Views
        this.views = {
            participantScanView: document.getElementById('participantScanView'),
            instructionsView: document.getElementById('instructionsView'),
            cardView: document.getElementById('cardView'),
            scanTaskView: document.getElementById('scanTaskView'),
            leaderboardView: document.getElementById('leaderboardView')
        };

        // Elements
        this.elements = {
            // Participant scan
            participantScanner: document.getElementById('participantScanner'),
            startParticipantScanBtn: document.getElementById('startParticipantScanBtn'),
            uploadParticipantQRBtn: document.getElementById('uploadParticipantQRBtn'),
            participantQRFileInput: document.getElementById('participantQRFileInput'),
            participantCodeInput: document.getElementById('participantCodeInput'),
            codeLoginBtn: document.getElementById('codeLoginBtn'),

            // Instructions
            pointsPerTask: document.getElementById('pointsPerTask'),
            bonusRowPoints: document.getElementById('bonusRowPoints'),
            bonusFullCardPoints: document.getElementById('bonusFullCardPoints'),
            startBingoBtn: document.getElementById('startBingoBtn'),

            // Card view
            teamNameDisplay: document.getElementById('teamNameDisplay'),
            participantNameDisplay: document.getElementById('participantNameDisplay'),
            teamBadge: document.getElementById('teamBadge'),
            progressFill: document.getElementById('progressFill'),
            progressPercent: document.getElementById('progressPercent'),
            bingoGrid: document.getElementById('bingoGrid'),
            tasksCompleted: document.getElementById('tasksCompleted'),
            achievementsCount: document.getElementById('achievementsCount'),
            pointsEarned: document.getElementById('pointsEarned'),
            viewLeaderboardBtn: document.getElementById('viewLeaderboardBtn'),
            refreshCardBtn: document.getElementById('refreshCardBtn'),

            // Scan task
            backToCardBtn: document.getElementById('backToCardBtn'),
            currentTaskInfo: document.getElementById('currentTaskInfo'),
            taskCodeInput: document.getElementById('taskCodeInput'),
            taskCodeLoginBtn: document.getElementById('taskCodeLoginBtn'),
            taskCodeStatus: document.getElementById('taskCodeStatus'),
            taskScanner: document.getElementById('taskScanner'),
            startTaskScanBtn: document.getElementById('startTaskScanBtn'),
            taskQRFileInput: document.getElementById('taskQRFileInput'),
            taskScanStatus: document.getElementById('taskScanStatus'),

            // Achievement modal
            achievementModal: document.getElementById('achievementModal'),
            achievementContent: document.getElementById('achievementContent'),
            closeAchievementBtn: document.getElementById('closeAchievementBtn'),

            // Leaderboard
            backToCardFromLeaderboardBtn: document.getElementById('backToCardFromLeaderboardBtn'),
            leaderboardContainer: document.getElementById('leaderboardContainer'),

            // Common
            statusMessage: document.getElementById('statusMessage'),
            eventLogo: document.getElementById('eventLogo')
        };

        this.loadEventInfo();
        this.init();
    }

    async init() {
        console.log('[Bingo] Initializing...');

        // Set up event listeners
        this.setupEventListeners();

        // Always show participant scan view (shared PC - each user must identify)
        this.showView('participantScanView');
    }

    setupEventListeners() {
        // Participant scan
        this.elements.startParticipantScanBtn.addEventListener('click', () => this.startParticipantScan());
        this.elements.uploadParticipantQRBtn.addEventListener('click', () => this.elements.participantQRFileInput.click());
        this.elements.participantQRFileInput.addEventListener('change', (e) => this.handleParticipantQRUpload(e));
        this.elements.codeLoginBtn.addEventListener('click', () => this.handleLoginWord());
        this.elements.participantCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLoginWord();
        });

        // Instructions
        this.elements.startBingoBtn.addEventListener('click', () => this.startBingo());

        // Card view
        this.elements.viewLeaderboardBtn.addEventListener('click', () => this.showLeaderboard());
        if (this.elements.refreshCardBtn) {
            this.elements.refreshCardBtn.addEventListener('click', () => this.loadCard());
        }

        // Scan task
        this.elements.backToCardBtn.addEventListener('click', () => this.showView('cardView'));
        if (this.elements.taskCodeLoginBtn) {
            this.elements.taskCodeLoginBtn.addEventListener('click', () => this.handleTaskLoginWord());
        }
        if (this.elements.taskCodeInput) {
            this.elements.taskCodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleTaskLoginWord();
            });
        }
        this.elements.startTaskScanBtn.addEventListener('click', () => this.startTaskScan());
        // Note: Upload button is now a <label for="taskQRFileInput">, so no click handler needed
        this.elements.taskQRFileInput.addEventListener('change', (e) => this.handleTaskQRUpload(e));

        // Initialize login components (alternative login methods)
        if (typeof initLoginComponent !== 'undefined') {
            // Participant login component
            initLoginComponent({
                onLoginSuccess: (participant) => {
                    this.handleParticipantScan(participant.participant_code, true);
                },
                altInputId: 'participantCodeInputAlt',
                altButtonId: 'codeLoginBtnAlt',
                statusId: 'codeStatus'
            });

            // Task login component
            initLoginComponent({
                onLoginSuccess: (participant) => {
                    this.handleTaskScan(participant.participant_code, true);
                },
                altInputId: 'taskCodeInputAlt',
                altButtonId: 'taskCodeLoginBtnAlt',
                statusId: 'taskCodeStatus'
            });

            // Task toggle functionality
            const taskToggleBtn = document.getElementById('taskToggleAlternativeLogin');
            const taskContent = document.getElementById('taskAlternativeLoginContent');
            if (taskToggleBtn && taskContent) {
                taskToggleBtn.addEventListener('click', () => {
                    taskContent.classList.toggle('collapsed');
                    taskToggleBtn.classList.toggle('expanded');
                });
            }
        }

        // Achievement modal
        this.elements.closeAchievementBtn.addEventListener('click', () => this.closeAchievementModal());

        // Leaderboard
        this.elements.backToCardFromLeaderboardBtn.addEventListener('click', () => this.showView('cardView'));

        // Global barcode scanner
        if (typeof globalBarcodeScanner !== 'undefined') {
            globalBarcodeScanner.activate((code) => {
                console.log('[Bingo] Global barcode scanned:', code);
                this.handleGlobalBarcodeScan(code);
            });
        }
    }

    showView(viewName) {
        Object.values(this.views).forEach(view => view.classList.add('hidden'));
        if (this.views[viewName]) {
            this.views[viewName].classList.remove('hidden');
        }
    }

    showStatus(message, type = 'info') {
        this.elements.statusMessage.textContent = message;
        this.elements.statusMessage.className = `status-message ${type}`;
        this.elements.statusMessage.classList.remove('hidden');

        setTimeout(() => {
            this.elements.statusMessage.classList.add('hidden');
        }, 5000);
    }

    // ========================================================================
    // Participant Authentication
    // ========================================================================

    async startParticipantScan() {
        try {
            await this.participantScanner.init(
                'participantScanner',
                (decodedText) => this.handleParticipantScan(decodedText),
                (error) => console.log('[Bingo] Scan error:', error)
            );
            await this.participantScanner.start();
            this.elements.startParticipantScanBtn.textContent = '⏸ Stopp Scanning';
            this.elements.startParticipantScanBtn.onclick = () => this.stopParticipantScan();
        } catch (err) {
            console.error('[Bingo] Error starting scan:', err);
            this.showStatus('Kunne ikke starte scanning', 'error');
        }
    }

    async stopParticipantScan() {
        await this.participantScanner.stop();
        this.elements.startParticipantScanBtn.textContent = '📷 Start Scanning';
        this.elements.startParticipantScanBtn.onclick = () => this.startParticipantScan();
    }

    async handleParticipantQRUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const code = await this.participantScanner.scanFile(file);
            if (code) {
                await this.handleParticipantScan(code);
            }
        } catch (err) {
            console.error('[Bingo] Error scanning file:', err);
            this.showStatus('Kunne ikke lese QR-kode fra bilde', 'error');
        }
    }

    async handleParticipantScan(decodedText) {
        console.log('[Bingo] Participant scanned (raw):', decodedText);

        // Decode keyboard layout issues (Norwegian characters from barcode scanners)
        const decoded = GlobalBarcodeScanner.decodeBarcodeInput(decodedText);
        console.log('[Bingo] Participant scanned (decoded):', decoded);

        let participantCode;
        try {
            const data = JSON.parse(decoded);
            if (data.type === 'participant' && data.code) {
                participantCode = data.code;
            } else {
                participantCode = decoded;
            }
        } catch (e) {
            participantCode = decoded;
        }

        await this.loginParticipant(participantCode);
    }

    async handleLoginWord() {
        const loginWord = this.elements.participantCodeInput.value.trim().toUpperCase();
        if (!loginWord) {
            this.showStatus('Skriv inn innloggingsord', 'warning');
            return;
        }

        try {
            // Use the login word directly as participant code
            await this.loginParticipant(loginWord);
        } catch (err) {
            console.error('[Bingo] Login error:', err);
            this.showStatus('Ugyldig innloggingsord eller deltaker ikke funnet', 'error');
        }
    }

    async loginParticipant(participantCode) {
        try {
            const participant = await this.auth.lookupParticipant(participantCode);

            if (!participant) {
                this.showStatus('Deltaker ikke funnet', 'error');
                return;
            }

            this.auth.currentParticipant = participant;
            this.auth.storeParticipant(participant);
            this.participantCode = participant.participant_code;

            await this.stopParticipantScan();

            // Try to load existing card or show instructions
            try {
                await this.loadCard();
            } catch (err) {
                this.showInstructions();
            }

        } catch (err) {
            console.error('[Bingo] Login error:', err);
            this.showStatus('Kunne ikke logge inn', 'error');
        }
    }

    // ========================================================================
    // Game Flow
    // ========================================================================

    async showInstructions() {
        // Get config to show points
        try {
            const response = await fetch('/api/bingo/admin/config');
            const config = await response.json();

            this.elements.pointsPerTask.textContent = config.points_per_task;
            this.elements.bonusRowPoints.textContent = `+${config.bonus_row_points}`;
            this.elements.bonusFullCardPoints.textContent = `+${config.bonus_full_card_points}`;
        } catch (err) {
            console.error('[Bingo] Error loading config:', err);
        }

        this.showView('instructionsView');
    }

    async startBingo() {
        try {
            const response = await fetch('/api/bingo/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ participant_code: this.participantCode })
            });

            if (!response.ok) {
                const error = await response.json();
                this.showStatus(error.error || 'Kunne ikke starte bingo', 'error');
                return;
            }

            const data = await response.json();
            this.cardId = data.card_id;
            this.tasks = data.tasks;
            this.layout = data.layout;
            this.completions = data.completions || [];
            this.achievements = data.achievements || { rows: [], columns: [], diagonals: [], fullCard: false };
            this.stats = data.stats;
            this.config = data.config;

            this.renderCard();
            this.updateProgress();
            this.displayParticipantInfo();
            this.showView('cardView');

        } catch (err) {
            console.error('[Bingo] Error starting bingo:', err);
            this.showStatus('Kunne ikke starte bingo', 'error');
        }
    }

    async loadCard() {
        try {
            const response = await fetch(`/api/bingo/card/${this.participantCode}`);

            if (!response.ok) {
                throw new Error('No card found');
            }

            const data = await response.json();
            this.cardId = data.card_id;
            this.tasks = data.tasks;
            this.layout = data.layout;
            this.completions = data.completions || [];
            this.achievements = data.achievements || { rows: [], columns: [], diagonals: [], fullCard: false };
            this.stats = data.stats;

            // Get config
            const configResponse = await fetch('/api/bingo/admin/config');
            this.config = await configResponse.json();

            this.renderCard();
            this.updateProgress();
            this.displayParticipantInfo();
            this.showView('cardView');

        } catch (err) {
            console.error('[Bingo] Error loading card:', err);
            throw err;
        }
    }

    renderCard() {
        const gridSize = this.config.card_size || 5;
        const centerPos = Math.floor((gridSize * gridSize) / 2);

        this.elements.bingoGrid.innerHTML = '';
        this.elements.bingoGrid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

        this.tasks.forEach((task, index) => {
            const cell = document.createElement('div');
            cell.className = 'bingo-cell';
            cell.dataset.position = index;
            cell.dataset.taskId = task.id;

            // Check if completed
            const completion = this.completions.find(c => c.position === index);
            const isFreeSpace = index === centerPos;

            if (completion || isFreeSpace) {
                cell.classList.add('completed');
            }

            // Check if part of achievement
            const row = Math.floor(index / gridSize);
            const col = index % gridSize;

            if (this.achievements.rows.includes(row)) {
                cell.classList.add('in-row');
            }
            if (this.achievements.columns.includes(col)) {
                cell.classList.add('in-column');
            }
            if (this.achievements.diagonals.includes(0) && row === col) {
                cell.classList.add('in-diagonal');
            }
            if (this.achievements.diagonals.includes(1) && row === (gridSize - 1 - col)) {
                cell.classList.add('in-diagonal');
            }

            // Content
            const taskText = document.createElement('div');
            taskText.className = 'task-text';
            taskText.textContent = isFreeSpace ? '⭐ FRI RUTE' : task.task_text;

            const status = document.createElement('div');
            status.className = 'completion-status';
            if (completion || isFreeSpace) {
                status.textContent = '✓';
            }

            cell.appendChild(taskText);
            cell.appendChild(status);

            // Click handler (only if not completed)
            if (!completion && !isFreeSpace) {
                cell.addEventListener('click', () => this.handleCellClick(index, task.id, task));
            }

            this.elements.bingoGrid.appendChild(cell);
        });
    }

    updateProgress() {
        this.elements.tasksCompleted.textContent = this.stats.tasks_completed;

        const totalAchievements = this.stats.rows_completed +
                                  this.stats.columns_completed +
                                  this.stats.diagonals_completed +
                                  (this.stats.full_card_completed ? 1 : 0);
        this.elements.achievementsCount.textContent = totalAchievements;

        this.elements.pointsEarned.textContent = this.stats.total_points;

        // Update progress bar
        const percentage = Math.round((this.completions.length / 25) * 100);
        this.elements.progressFill.style.width = `${percentage}%`;
        this.elements.progressPercent.textContent = `${percentage}%`;
    }

    displayParticipantInfo() {
        const participant = this.auth.getCurrentParticipant();
        if (participant) {
            this.elements.participantNameDisplay.textContent =
                `${participant.first_name} ${participant.last_name}`;
            this.elements.teamNameDisplay.textContent =
                participant.team_name || 'Ingen lag';

            // Update team badge color based on team
            if (participant.team_name) {
                this.elements.teamBadge.style.backgroundColor = this.getTeamColor(participant.team_name);
            }
        }
    }

    getTeamColor(teamName) {
        // Simple hash function to get consistent color for team name
        let hash = 0;
        for (let i = 0; i < teamName.length; i++) {
            hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = hash % 360;
        return `hsl(${hue}, 60%, 50%)`;
    }

    handleCellClick(position, taskId, task) {
        console.log('[Bingo] Cell clicked:', position, taskId);

        this.currentTaskPosition = position;
        this.currentTaskId = taskId;

        // Show task info
        this.elements.currentTaskInfo.innerHTML = `
            <h3>${task.task_text}</h3>
            <p class="task-category">📂 ${task.category}</p>
            <p>Skriv inn personens login-ord eller scan QR-koden til en deltaker som oppfyller dette kriteriet</p>
        `;

        // Reset input and status
        if (this.elements.taskCodeInput) {
            this.elements.taskCodeInput.value = '';
        }
        if (this.elements.taskCodeStatus) {
            this.elements.taskCodeStatus.classList.add('hidden');
        }

        this.showView('scanTaskView');
    }

    // ========================================================================
    // Task Scanning
    // ========================================================================

    async startTaskScan() {
        try {
            await this.taskScanner.init(
                'taskScanner',
                (decodedText) => this.handleTaskScan(decodedText),
                (error) => console.log('[Bingo] Task scan error:', error)
            );
            await this.taskScanner.start();
            this.elements.startTaskScanBtn.textContent = '⏸ Stopp Scanning';
            this.elements.startTaskScanBtn.onclick = () => this.stopTaskScan();
        } catch (err) {
            console.error('[Bingo] Error starting task scan:', err);
            this.showStatus('Kunne ikke starte scanning', 'error');
        }
    }

    async stopTaskScan() {
        await this.taskScanner.stop();
        this.elements.startTaskScanBtn.textContent = '📷 Start Scanning';
        this.elements.startTaskScanBtn.onclick = () => this.startTaskScan();
    }

    async handleTaskQRUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const code = await this.taskScanner.scanFile(file);
            if (code) {
                await this.handleTaskScan(code);
            }
        } catch (err) {
            console.error('[Bingo] Error scanning task file:', err);
            this.showStatus('Kunne ikke lese QR-kode fra bilde', 'error');
        }
    }

    async handleTaskLoginWord() {
        const code = this.elements.taskCodeInput.value.trim().toUpperCase();

        if (!code) {
            this.showTaskCodeStatus('Vennligst skriv inn login-ord', 'error');
            return;
        }

        this.elements.taskCodeLoginBtn.disabled = true;
        this.elements.taskCodeLoginBtn.textContent = '⏳';
        this.showTaskCodeStatus('Verifiserer...', 'info');

        try {
            // Verify that the participant exists
            const response = await fetch(`/api/participants/${code}`);

            if (!response.ok) {
                throw new Error('Deltaker ikke funnet');
            }

            const participant = await response.json();

            // Show success message briefly
            this.showTaskCodeStatus(`✅ Funnet: ${participant.first_name} ${participant.last_name}`, 'success');

            // Clear input
            this.elements.taskCodeInput.value = '';

            // Wait a moment for user to see the success message
            await new Promise(resolve => setTimeout(resolve, 500));

            // Process the scan with the participant code
            await this.handleTaskScan(code);

        } catch (error) {
            console.error('[Bingo] Error verifying login word:', error);
            this.showTaskCodeStatus('❌ Ugyldig login-ord. Prøv igjen.', 'error');
        } finally {
            this.elements.taskCodeLoginBtn.disabled = false;
            this.elements.taskCodeLoginBtn.textContent = '➡️';
        }
    }

    showTaskCodeStatus(message, type = 'info') {
        if (!this.elements.taskCodeStatus) return;

        this.elements.taskCodeStatus.textContent = message;
        this.elements.taskCodeStatus.className = `scan-status ${type}`;
        this.elements.taskCodeStatus.classList.remove('hidden');

        if (type === 'error') {
            setTimeout(() => {
                this.elements.taskCodeStatus.classList.add('hidden');
            }, 3000);
        }
    }

    async handleTaskScan(decodedText) {
        console.log('[Bingo] Task scanned (raw):', decodedText);

        // Decode keyboard layout issues (Norwegian characters from barcode scanners)
        const decoded = GlobalBarcodeScanner.decodeBarcodeInput(decodedText);
        console.log('[Bingo] Task scanned (decoded):', decoded);

        let scannedCode;
        try {
            const data = JSON.parse(decoded);
            if (data.type === 'participant' && data.code) {
                scannedCode = data.code;
            } else {
                scannedCode = decoded;
            }
        } catch (e) {
            scannedCode = decoded;
        }

        await this.recordCompletion(scannedCode);
    }

    async recordCompletion(scannedCode) {
        try {
            await this.stopTaskScan();

            const response = await fetch('/api/bingo/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    participant_code: this.participantCode,
                    scanned_code: scannedCode,
                    task_id: this.currentTaskId,
                    position: this.currentTaskPosition
                })
            });

            const data = await response.json();

            if (!response.ok) {
                this.showStatus(data.error || 'Kunne ikke registrere oppgave', 'error');
                return;
            }

            // Success!
            this.showStatus(`✓ Oppgave fullført! +${data.points_earned} poeng`, 'success');

            // Update stats
            this.stats = {
                ...this.stats,
                tasks_completed: data.stats.tasks_completed,
                rows_completed: data.stats.rows_completed,
                columns_completed: data.stats.columns_completed,
                diagonals_completed: data.stats.diagonals_completed,
                full_card_completed: data.stats.full_card_completed,
                total_points: data.total_points
            };

            // Add completion
            this.completions.push({
                position: this.currentTaskPosition,
                task_id: this.currentTaskId,
                matched_participant: data.matched_participant
            });

            // Reload card to update
            await this.loadCard();

            // Show achievements if any
            if (data.achievements && data.achievements.length > 0) {
                this.showAchievements(data.achievements);
            }

        } catch (err) {
            console.error('[Bingo] Error recording completion:', err);
            this.showStatus('Kunne ikke registrere oppgave', 'error');
        }
    }

    handleGlobalBarcodeScan(code) {
        const currentView = Object.entries(this.views).find(([name, view]) =>
            !view.classList.contains('hidden')
        );

        if (currentView && currentView[0] === 'scanTaskView') {
            this.handleTaskScan(code);
        } else if (currentView && currentView[0] === 'participantScanView') {
            this.handleParticipantScan(code);
        }
    }

    // ========================================================================
    // Achievements
    // ========================================================================

    showAchievements(achievements) {
        let content = '<div class="achievement-content">';

        achievements.forEach(achievement => {
            if (achievement.type === 'row') {
                content += `
                    <div class="achievement-item">
                        <div class="achievement-icon">🎉</div>
                        <h3>Rad fullført!</h3>
                        <p>Du har fullført rad ${achievement.index + 1}</p>
                        <p class="points">+${this.config.bonus_row_points} poeng</p>
                    </div>
                `;
            } else if (achievement.type === 'column') {
                content += `
                    <div class="achievement-item">
                        <div class="achievement-icon">🎊</div>
                        <h3>Kolonne fullført!</h3>
                        <p>Du har fullført kolonne ${achievement.index + 1}</p>
                        <p class="points">+${this.config.bonus_row_points} poeng</p>
                    </div>
                `;
            } else if (achievement.type === 'diagonal') {
                content += `
                    <div class="achievement-item">
                        <div class="achievement-icon">✨</div>
                        <h3>Diagonal fullført!</h3>
                        <p>Du har fullført en diagonal</p>
                        <p class="points">+${this.config.bonus_row_points} poeng</p>
                    </div>
                `;
            } else if (achievement.type === 'full_card') {
                content += `
                    <div class="achievement-item">
                        <div class="achievement-icon">🏆</div>
                        <h3>FULLT KORT!</h3>
                        <p>Du har fullført hele bingo-kortet!</p>
                        <p class="points">+${this.config.bonus_full_card_points} poeng</p>
                    </div>
                `;
            }
        });

        content += '</div>';

        this.elements.achievementContent.innerHTML = content;
        this.elements.achievementModal.classList.remove('hidden');
    }

    closeAchievementModal() {
        this.elements.achievementModal.classList.add('hidden');
    }

    // ========================================================================
    // Leaderboard
    // ========================================================================

    async showLeaderboard() {
        try {
            const response = await fetch('/api/bingo/leaderboard');
            const leaderboard = await response.json();

            this.renderLeaderboard(leaderboard);
            this.showView('leaderboardView');

        } catch (err) {
            console.error('[Bingo] Error loading leaderboard:', err);
            this.showStatus('Kunne ikke laste resultatliste', 'error');
        }
    }

    renderLeaderboard(leaderboard) {
        if (leaderboard.length === 0) {
            this.elements.leaderboardContainer.innerHTML = '<p>Ingen resultater ennå</p>';
            return;
        }

        let html = '<table class="leaderboard-table">';
        html += `
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Navn</th>
                    <th>Oppgaver</th>
                    <th>Achievements</th>
                    <th>Poeng</th>
                </tr>
            </thead>
            <tbody>
        `;

        leaderboard.forEach(entry => {
            const isCurrentUser = entry.participant_code === this.participantCode;
            const rowClass = isCurrentUser ? 'current-user' : '';

            const totalAchievements = entry.rows_completed +
                                     entry.columns_completed +
                                     entry.diagonals_completed +
                                     (entry.full_card_completed ? 1 : 0);

            html += `
                <tr class="${rowClass}">
                    <td>${entry.rank}</td>
                    <td>${entry.first_name} ${entry.last_name}</td>
                    <td>${entry.tasks_completed}/25</td>
                    <td>${totalAchievements}${entry.full_card_completed ? ' 🏆' : ''}</td>
                    <td><strong>${entry.total_points}</strong></td>
                </tr>
            `;
        });

        html += '</tbody></table>';

        this.elements.leaderboardContainer.innerHTML = html;
    }

    // ========================================================================
    // Event Info
    // ========================================================================

    async loadEventInfo() {
        try {
            const response = await fetch('/api/event');
            if (response.ok) {
                const event = await response.json();
                if (event.event_name) {
                    document.title = event.event_name + ' - Sosial Bingo';
                }

                if (event.logo_path && this.elements.eventLogo) {
                    this.elements.eventLogo.src = event.logo_path + '?t=' + Date.now();
                    this.elements.eventLogo.classList.remove('hidden');
                }
            }
        } catch (err) {
            console.error('[Bingo] Error loading event info:', err);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.bingoGame = new BingoGame();
});
