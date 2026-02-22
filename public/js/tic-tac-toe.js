// Tic-Tac-Toe Game Logic

class TicTacToeGame {
    constructor() {
        this.player1Scanner = new QRScanner();
        this.player2Scanner = new QRScanner();
        this.gameId = null;
        this.gameState = null;
        this.myPlayerNumber = null;
        this.myParticipantCode = null;
        this.player1Name = null;
        this.player2Name = null;
        this.player1Code = null;
        this.player2Code = null;

        this.initElements();
        this.initScanners();
        this.initEventListeners();
    }

    initElements() {
        // Views
        this.player1ScanView = document.getElementById('player1ScanView');
        this.player2ScanView = document.getElementById('player2ScanView');
        this.gameView = document.getElementById('gameView');
        this.resultView = document.getElementById('resultView');

        // Player 1 scan
        this.player1BarcodeInput = document.getElementById('player1BarcodeInput');
        this.player1QrReader = document.getElementById('player1QrReader');
        this.startPlayer1ScanBtn = document.getElementById('startPlayer1ScanBtn');
        this.player1ScanFeedback = document.getElementById('player1ScanFeedback');

        // Player 2 scan
        this.player2BarcodeInput = document.getElementById('player2BarcodeInput');
        this.player2QrReader = document.getElementById('player2QrReader');
        this.startPlayer2ScanBtn = document.getElementById('startPlayer2ScanBtn');
        this.player2ScanFeedback = document.getElementById('player2ScanFeedback');

        // Player info
        this.player1Info = document.getElementById('player1Info');
        this.player1Name = document.getElementById('player1Name');
        this.player1Team = document.getElementById('player1Team');

        // Game elements
        this.player1InfoGame = document.getElementById('player1InfoGame');
        this.player1NameGame = document.getElementById('player1NameGame');
        this.player1TeamGame = document.getElementById('player1TeamGame');
        this.player2InfoGame = document.getElementById('player2InfoGame');
        this.player2NameGame = document.getElementById('player2NameGame');
        this.player2TeamGame = document.getElementById('player2TeamGame');
        this.turnIndicator = document.getElementById('turnIndicator');
        this.gameCells = document.querySelectorAll('.game-cell');

        // Result elements
        this.resultCard = document.getElementById('resultCard');
        this.resultEmoji = document.getElementById('resultEmoji');
        this.resultMessage = document.getElementById('resultMessage');
        this.resultDetails = document.getElementById('resultDetails');

        // Buttons
        this.cancelWaitBtn = document.getElementById('cancelWaitBtn');
        this.playAgainBtn = document.getElementById('playAgainBtn');

        this.isPlayer1ScannerActive = false;
        this.isPlayer2ScannerActive = false;
    }

    initScanners() {
        // Player 1 scanner
        this.player1Scanner.init('player1QrReader',
            (data) => this.handlePlayer1Scan(data),
            (error) => {
                console.error('Player 1 scan error:', error);
                this.showPlayer1ScanFeedback(error, 'error');
            }
        );

        // Player 2 scanner
        this.player2Scanner.init('player2QrReader',
            (data) => this.handlePlayer2Scan(data),
            (error) => {
                console.error('Player 2 scan error:', error);
                this.showPlayer2ScanFeedback(error, 'error');
            }
        );
    }

    initEventListeners() {
        // Player 1 barcode input - use buffer approach for better barcode scanner support
        let player1ScanBuffer = '';
        let player1ScanTimeout;

        this.player1BarcodeInput.addEventListener('input', (e) => {
            clearTimeout(player1ScanTimeout);
            player1ScanBuffer += e.target.value;
            e.target.value = '';

            player1ScanTimeout = setTimeout(() => {
                if (player1ScanBuffer.trim()) {
                    this.handlePlayer1Scan(player1ScanBuffer.trim());
                }
                player1ScanBuffer = '';
            }, 100);
        });

        // Also listen for Enter key (most barcode scanners send Enter after scan)
        this.player1BarcodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (player1ScanTimeout) {
                    clearTimeout(player1ScanTimeout);
                }
                if (player1ScanBuffer.trim()) {
                    this.handlePlayer1Scan(player1ScanBuffer.trim());
                }
                player1ScanBuffer = '';
            }
        });

        // Player 2 barcode input - use buffer approach for better barcode scanner support
        let player2ScanBuffer = '';
        let player2ScanTimeout;

        this.player2BarcodeInput.addEventListener('input', (e) => {
            clearTimeout(player2ScanTimeout);
            player2ScanBuffer += e.target.value;
            e.target.value = '';

            player2ScanTimeout = setTimeout(() => {
                if (player2ScanBuffer.trim()) {
                    this.handlePlayer2Scan(player2ScanBuffer.trim());
                }
                player2ScanBuffer = '';
            }, 100);
        });

        // Also listen for Enter key for player 2
        this.player2BarcodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (player2ScanTimeout) {
                    clearTimeout(player2ScanTimeout);
                }
                if (player2ScanBuffer.trim()) {
                    this.handlePlayer2Scan(player2ScanBuffer.trim());
                }
                player2ScanBuffer = '';
            }
        });

        // Scanner buttons
        this.startPlayer1ScanBtn.addEventListener('click', () => this.togglePlayer1Scanner());
        this.startPlayer2ScanBtn.addEventListener('click', () => this.togglePlayer2Scanner());

        // File upload for QR codes
        document.getElementById('player1QrFileInput').addEventListener('change', (e) => this.handlePlayer1FileUpload(e));
        document.getElementById('player2QrFileInput').addEventListener('change', (e) => this.handlePlayer2FileUpload(e));

        // Game cells
        this.gameCells.forEach((cell, index) => {
            cell.addEventListener('click', () => this.handleCellClick(index));
        });

        // Buttons
        this.cancelWaitBtn.addEventListener('click', () => this.reset());
        this.playAgainBtn.addEventListener('click', () => this.reset());
    }

    async togglePlayer1Scanner() {
        if (this.isPlayer1ScannerActive) {
            await this.player1Scanner.stop();
            this.isPlayer1ScannerActive = false;
            this.startPlayer1ScanBtn.textContent = '📷 Start Kamera-Skanning';
            this.startPlayer1ScanBtn.classList.remove('secondary');
            this.startPlayer1ScanBtn.classList.add('primary');
        } else {
            await this.player1Scanner.start();
            this.isPlayer1ScannerActive = true;
            this.startPlayer1ScanBtn.textContent = '⏹️ Stopp Kamera';
            this.startPlayer1ScanBtn.classList.remove('primary');
            this.startPlayer1ScanBtn.classList.add('secondary');
        }
    }

    async togglePlayer2Scanner() {
        if (this.isPlayer2ScannerActive) {
            await this.player2Scanner.stop();
            this.isPlayer2ScannerActive = false;
            this.startPlayer2ScanBtn.textContent = '📷 Start Kamera-Skanning';
            this.startPlayer2ScanBtn.classList.remove('secondary');
            this.startPlayer2ScanBtn.classList.add('primary');
        } else {
            await this.player2Scanner.start();
            this.isPlayer2ScannerActive = true;
            this.startPlayer2ScanBtn.textContent = '⏹️ Stopp Kamera';
            this.startPlayer2ScanBtn.classList.remove('primary');
            this.startPlayer2ScanBtn.classList.add('secondary');
        }
    }

    async handlePlayer1FileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const html5QrCode = new Html5Qrcode("player1QrReader");
            const qrData = await html5QrCode.scanFile(file, true);
            this.handlePlayer1Scan(qrData);
            e.target.value = '';
            document.getElementById('player1QrReader').innerHTML = '';
        } catch (err) {
            console.error('Error scanning file:', err);
            this.showPlayer1ScanFeedback('Kunne ikke lese QR-kode fra bilde', 'error');
            e.target.value = '';
            document.getElementById('player1QrReader').innerHTML = '';
        }
    }

    async handlePlayer2FileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const html5QrCode = new Html5Qrcode("player2QrReader");
            const qrData = await html5QrCode.scanFile(file, true);
            this.handlePlayer2Scan(qrData);
            e.target.value = '';
            document.getElementById('player2QrReader').innerHTML = '';
        } catch (err) {
            console.error('Error scanning file:', err);
            this.showPlayer2ScanFeedback('Kunne ikke lese QR-kode fra bilde', 'error');
            e.target.value = '';
            document.getElementById('player2QrReader').innerHTML = '';
        }
    }

    /**
     * Decode barcode scanner keyboard layout issues
     * Some barcode scanners send JSON with wrong keyboard mapping
     */
    decodeBarcodeInput(input) {
        // Map Norwegian keyboard chars back to JSON chars
        const charMap = {
            'Å': '{',
            'Æ': '"',
            'Ø': ':',
            '^': '}',
            '¨': '[',
            '\'': ']',
            '§': ','
        };

        // Try to detect if this is garbled JSON
        if (input.includes('Å') || input.includes('Æ') || input.includes('Ø')) {
            let decoded = input;
            for (const [garbled, correct] of Object.entries(charMap)) {
                decoded = decoded.split(garbled).join(correct);
            }
            return decoded;
        }

        // Also replace + with - for participant codes (SK+2026+004 → SK-2026-004)
        return input.replace(/\+/g, '-');
    }

    async handlePlayer1Scan(qrData) {
        // Decode potential keyboard layout issues
        const decodedData = this.decodeBarcodeInput(qrData);
        let participantCode;

        try {
            const parsed = JSON.parse(decodedData);
            if (parsed.type === 'participant' && parsed.code) {
                participantCode = parsed.code;
            } else {
                participantCode = decodedData;
            }
        } catch (e) {
            participantCode = decodedData;
        }

        // Trim whitespace
        participantCode = participantCode?.trim();

        // Basic validation - just check if we have something
        if (!participantCode) {
            this.showPlayer1ScanFeedback('Ugyldig deltaker-QR. Skann din deltaker-QR kode.', 'error');
            return;
        }

        try {
            const response = await fetch('/api/tic-tac-toe/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ participant_code: participantCode })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Kunne ikke starte spill');
            }

            const data = await response.json();
            this.gameId = data.game_id;
            this.myPlayerNumber = 1;
            this.myParticipantCode = participantCode;

            // Stop scanner
            if (this.isPlayer1ScannerActive) {
                await this.player1Scanner.stop();
                this.isPlayer1ScannerActive = false;
            }

            // Show player 2 scan view
            this.showPlayer2WaitingView(data.player1);

        } catch (err) {
            console.error('Error starting game:', err);
            this.showPlayer1ScanFeedback(err.message, 'error');
        }
    }

    async handlePlayer2Scan(qrData) {
        // Decode potential keyboard layout issues
        const decodedData = this.decodeBarcodeInput(qrData);
        let participantCode;

        try {
            const parsed = JSON.parse(decodedData);
            if (parsed.type === 'participant' && parsed.code) {
                participantCode = parsed.code;
            } else {
                participantCode = decodedData;
            }
        } catch (e) {
            participantCode = decodedData;
        }

        // Trim whitespace
        participantCode = participantCode?.trim();

        // Basic validation - just check if we have something
        if (!participantCode) {
            this.showPlayer2ScanFeedback('Ugyldig deltaker-QR. Skann din deltaker-QR kode.', 'error');
            return;
        }

        try {
            const response = await fetch('/api/tic-tac-toe/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    game_id: this.gameId,
                    participant_code: participantCode
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Kunne ikke bli med i spill');
            }

            const data = await response.json();
            this.gameState = data;
            this.myPlayerNumber = 2;
            this.myParticipantCode = participantCode;

            // Stop scanner
            if (this.isPlayer2ScannerActive) {
                await this.player2Scanner.stop();
                this.isPlayer2ScannerActive = false;
            }

            // Start game
            this.startGame(data);

        } catch (err) {
            console.error('Error joining game:', err);
            this.showPlayer2ScanFeedback(err.message, 'error');
        }
    }

    showPlayer2WaitingView(player1) {
        this.hideView(this.player1ScanView);
        this.showView(this.player2ScanView);

        this.player1Name.textContent = player1.name;
        this.player1Team.textContent = player1.team || 'Ikke tildelt lag';

        // Focus on player 2 barcode input for scanning
        setTimeout(() => {
            this.player2BarcodeInput.focus();
        }, 100);
    }

    startGame(gameData) {
        this.hideView(this.player2ScanView);
        this.showView(this.gameView);

        // Store player info
        this.player1Name = gameData.player1.name;
        this.player2Name = gameData.player2.name;
        this.player1Code = gameData.player1.code;
        this.player2Code = gameData.player2.code;

        // Set player info
        this.player1NameGame.textContent = gameData.player1.name;
        this.player1TeamGame.textContent = gameData.player1.team || 'Ikke tildelt lag';
        this.player2NameGame.textContent = gameData.player2.name;
        this.player2TeamGame.textContent = gameData.player2.team || 'Ikke tildelt lag';

        // Update board
        this.updateBoard(gameData);
    }

    updateBoard(gameData) {
        this.gameState = gameData;

        // Update cells - enable all empty cells (both players use same screen)
        gameData.board.forEach((symbol, index) => {
            const cell = this.gameCells[index];
            cell.textContent = symbol;
            cell.className = 'game-cell';

            if (symbol === 'X') {
                cell.classList.add('x');
                cell.disabled = true; // Occupied cells are always disabled
            } else if (symbol === 'O') {
                cell.classList.add('o');
                cell.disabled = true; // Occupied cells are always disabled
            } else {
                // Empty cell - always enabled (both players share the screen)
                cell.disabled = false;
            }
        });

        // Update turn indicator - show whose turn it is
        const currentPlayerName = gameData.current_turn === 1 ? this.player1Name : this.player2Name;
        const currentPlayerSymbol = gameData.current_turn === 1 ? 'X' : 'O';

        this.turnIndicator.textContent = `🎯 ${currentPlayerName} sin tur (${currentPlayerSymbol})`;
        this.turnIndicator.classList.add('my-turn');

        // Check if game is completed
        if (gameData.status === 'completed') {
            this.showResult(gameData);
        }
    }

    async handleCellClick(position) {
        if (!this.gameState) {
            return;
        }

        if (this.gameState.board[position] !== '') {
            return;
        }

        // Get current player's participant code
        const currentPlayerCode = this.gameState.current_turn === 1
            ? this.player1Code
            : this.player2Code;

        try {
            const response = await fetch('/api/tic-tac-toe/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    game_id: this.gameId,
                    participant_code: currentPlayerCode,
                    position: position
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Kunne ikke utføre trekk');
            }

            const data = await response.json();
            this.updateBoard(data);

        } catch (err) {
            console.error('Error making move:', err);
            alert(err.message);
        }
    }

    showResult(gameData) {
        this.hideView(this.gameView);
        this.showView(this.resultView);

        if (gameData.result === 'draw') {
            this.resultCard.classList.add('draw');
            this.resultEmoji.textContent = '🤝';
            this.resultMessage.textContent = 'Uavgjort!';
            this.resultDetails.textContent = 'Begge spilte like godt!';
        } else if (gameData.winner) {
            this.resultCard.classList.remove('draw');
            this.resultEmoji.textContent = '🏆';
            this.resultMessage.textContent = 'Gratulerer!';
            this.resultDetails.textContent = `${gameData.winner.name} vant!`;

            // Trigger confetti effect for winner
            if (typeof confetti !== 'undefined') {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        }
    }

    async showLeaderboard() {
        try {
            // Add cache busting to ensure fresh data
            const response = await fetch('/api/tic-tac-toe/leaderboard?t=' + Date.now(), {
                cache: 'no-cache'
            });
            if (!response.ok) {
                throw new Error('Kunne ikke laste resultattavle');
            }

            const data = await response.json();
            this.renderLeaderboard(data);
            this.leaderboardModal.classList.remove('hidden');

        } catch (err) {
            console.error('Error loading leaderboard:', err);
            alert('Kunne ikke laste resultattavle');
        }
    }

    renderLeaderboard(data) {
        if (!data.leaderboard || data.leaderboard.length === 0) {
            this.leaderboardContent.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-light);">Ingen resultater ennå</p>';
            return;
        }

        this.leaderboardContent.innerHTML = data.leaderboard.map((entry) => {
            const rankEmoji = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank;
            const isTop3 = entry.rank <= 3;
            const photoHtml = entry.profile_photo_path
                ? `<img src="${entry.profile_photo_path}?t=${Date.now()}" alt="${entry.name}" class="leaderboard-photo">`
                : `<div class="leaderboard-photo-placeholder">👤</div>`;

            return `
                <div class="leaderboard-entry ${isTop3 ? 'top3' : ''}">
                    <div class="leaderboard-rank">${rankEmoji}</div>
                    ${photoHtml}
                    <div class="leaderboard-stats">
                        <div class="leaderboard-name">${entry.name}</div>
                        <div class="leaderboard-record">
                            ${entry.wins} seire • ${entry.draws} uavgjort • ${entry.losses} tap
                            ${entry.team ? `<br>Lag: ${entry.team}` : ''}
                        </div>
                    </div>
                    <div class="win-rate">${entry.win_rate}%</div>
                </div>
            `;
        }).join('');
    }

    closeLeaderboard() {
        this.leaderboardModal.classList.add('hidden');
    }

    async reset() {
        // Clear scanners completely (stop and remove)
        await this.player1Scanner.clear();
        await this.player2Scanner.clear();
        this.isPlayer1ScannerActive = false;
        this.isPlayer2ScannerActive = false;

        // Reinitialize scanners for next game
        this.initScanners();

        // Reset button states
        this.startPlayer1ScanBtn.textContent = '📷 Start Kamera-Skanning';
        this.startPlayer1ScanBtn.classList.remove('secondary');
        this.startPlayer1ScanBtn.classList.add('primary');
        this.startPlayer2ScanBtn.textContent = '📷 Start Kamera-Skanning';
        this.startPlayer2ScanBtn.classList.remove('secondary');
        this.startPlayer2ScanBtn.classList.add('primary');

        // Reset state
        this.gameId = null;
        this.gameState = null;
        this.myPlayerNumber = null;
        this.myParticipantCode = null;
        this.player1Name = null;
        this.player2Name = null;
        this.player1Code = null;
        this.player2Code = null;

        // Reset UI
        this.hideView(this.player2ScanView);
        this.hideView(this.gameView);
        this.hideView(this.resultView);
        this.showView(this.player1ScanView);

        this.player1BarcodeInput.value = '';
        this.player2BarcodeInput.value = '';
        this.player1ScanFeedback.classList.add('hidden');
        this.player2ScanFeedback.classList.add('hidden');

        // Reset board
        this.gameCells.forEach(cell => {
            cell.textContent = '';
            cell.className = 'game-cell';
            cell.disabled = false;
        });
    }

    showPlayer1ScanFeedback(message, type) {
        this.player1ScanFeedback.textContent = message;
        this.player1ScanFeedback.className = `scan-status ${type}`;
        this.player1ScanFeedback.classList.remove('hidden');

        setTimeout(() => {
            if (type === 'error') {
                this.player1ScanFeedback.classList.add('hidden');
            }
        }, 3000);
    }

    showPlayer2ScanFeedback(message, type) {
        this.player2ScanFeedback.textContent = message;
        this.player2ScanFeedback.className = `scan-status ${type}`;
        this.player2ScanFeedback.classList.remove('hidden');

        setTimeout(() => {
            if (type === 'error') {
                this.player2ScanFeedback.classList.add('hidden');
            }
        }, 3000);
    }

    showView(element) {
        element.classList.remove('hidden');
    }

    hideView(element) {
        element.classList.add('hidden');
    }
}

// Initialize game
let ticTacToeGame;
document.addEventListener('DOMContentLoaded', () => {
    ticTacToeGame = new TicTacToeGame();
});
