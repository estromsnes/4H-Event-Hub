// Quiz Client Logic

class QuizManager {
    constructor() {
        this.participantScanner = new QRScanner();
        this.sessionId = null;
        this.teamName = null;
        this.currentQuestion = null;
        this.totalQuestions = 0;
        this.isParticipantScannerActive = false;
        this.timerInterval = null;
        this.timeRemaining = 0;
        this.questionStartTime = null;

        this.initElements();
        this.initScanners();
        this.initEventListeners();
    }

    initElements() {
        // Views
        this.participantScanView = document.getElementById('participantScanView');
        this.questionView = document.getElementById('questionView');
        this.feedbackView = document.getElementById('feedbackView');
        this.resultsView = document.getElementById('resultsView');

        // Participant scan
        this.participantBarcodeInput = document.getElementById('participantBarcodeInput');
        this.participantQrReader = document.getElementById('participantQrReader');
        this.startParticipantScanBtn = document.getElementById('startParticipantScanBtn');
        this.participantQrFileInput = document.getElementById('participantQrFileInput');
        this.participantScanFeedback = document.getElementById('participantScanFeedback');

        // Question view
        this.teamNameEl = document.getElementById('teamName');
        this.progressText = document.getElementById('progressText');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.timerValue = document.getElementById('timerValue');
        this.selectionInstruction = document.getElementById('selectionInstruction');
        this.instructionText = document.getElementById('instructionText');
        this.questionImage = document.getElementById('questionImage');
        this.questionImg = document.getElementById('questionImg');
        this.questionText = document.getElementById('questionText');
        this.optionButtons = document.querySelectorAll('.option-button');
        this.submitAnswerBtn = document.getElementById('submitAnswerBtn');

        // Feedback view
        this.feedbackIcon = document.getElementById('feedbackIcon');
        this.feedbackTitle = document.getElementById('feedbackTitle');
        this.feedbackMessage = document.getElementById('feedbackMessage');
        this.nextQuestionBtn = document.getElementById('nextQuestionBtn');

        // Results view
        this.resultsTeamName = document.getElementById('resultsTeamName');
        this.scoreValue = document.getElementById('scoreValue');
        this.correctCount = document.getElementById('correctCount');
        this.totalCount = document.getElementById('totalCount');
        this.totalTime = document.getElementById('totalTime');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.retakeQuizBtn = document.getElementById('retakeQuizBtn');

        // Leaderboard
        this.leaderboardModal = document.getElementById('leaderboardModal');
        this.leaderboardContent = document.getElementById('leaderboardContent');
        this.closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');
        this.viewLeaderboardBtn1 = document.getElementById('viewLeaderboardBtn1');
        this.viewLeaderboardBtn2 = document.getElementById('viewLeaderboardBtn2');

        // Debug: Log if critical elements are missing
        if (!this.retakeQuizBtn) console.error('retakeQuizBtn not found');
        if (!this.viewLeaderboardBtn2) console.error('viewLeaderboardBtn2 not found');
    }

    initScanners() {
        // Participant scanner
        this.participantScanner.init('participantQrReader',
            (data) => this.handleParticipantScan(data),
            (error) => {
                console.error('Participant scan error:', error);
                this.showParticipantScanFeedback(error, 'error');
            }
        );
    }

    initEventListeners() {
        // Participant barcode input
        this.participantBarcodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleParticipantScan(e.target.value);
                e.target.value = '';
            }
        });

        // Scanner button
        this.startParticipantScanBtn.addEventListener('click', () => this.toggleParticipantScanner());

        // File upload for QR code
        this.participantQrFileInput.addEventListener('change', (e) => this.handleParticipantQrFileUpload(e));

        // Option buttons
        this.optionButtons.forEach(btn => {
            btn.addEventListener('click', () => this.selectOption(btn));
        });

        // Submit answer button
        this.submitAnswerBtn.addEventListener('click', () => this.submitAnswer());

        // Navigation buttons
        if (this.nextQuestionBtn) {
            this.nextQuestionBtn.addEventListener('click', () => this.loadNextQuestion());
        }
        if (this.retakeQuizBtn) {
            this.retakeQuizBtn.addEventListener('click', () => {
                console.log('Retake button clicked');
                this.reset();
            });
        }
        if (this.viewLeaderboardBtn1) {
            this.viewLeaderboardBtn1.addEventListener('click', () => {
                console.log('Leaderboard button 1 clicked');
                this.showLeaderboard();
            });
        }
        if (this.viewLeaderboardBtn2) {
            this.viewLeaderboardBtn2.addEventListener('click', () => {
                console.log('Leaderboard button 2 clicked');
                this.showLeaderboard();
            });
        }
        if (this.closeLeaderboardBtn) {
            this.closeLeaderboardBtn.addEventListener('click', () => this.closeLeaderboard());
        }
    }

    /**
     * Decode barcode scanner keyboard layout issues
     */
    decodeBarcodeInput(input) {
        const charMap = {
            'Å': '{',
            'Æ': '"',
            'Ø': ':',
            '^': '}',
            '¨': '[',
            '\'': ']',
            '§': ','
        };

        if (input.includes('Å') || input.includes('Æ') || input.includes('Ø')) {
            let decoded = input;
            for (const [garbled, correct] of Object.entries(charMap)) {
                decoded = decoded.split(garbled).join(correct);
            }
            return decoded;
        }

        // Replace + with - for participant codes
        return input.replace(/\+/g, '-');
    }

    async toggleParticipantScanner() {
        if (this.isParticipantScannerActive) {
            await this.participantScanner.stop();
            this.isParticipantScannerActive = false;
            this.startParticipantScanBtn.textContent = '📷 Start Kamera-Skanning';
            this.startParticipantScanBtn.classList.remove('secondary');
            this.startParticipantScanBtn.classList.add('primary');
        } else {
            await this.participantScanner.start();
            this.isParticipantScannerActive = true;
            this.startParticipantScanBtn.textContent = '⏹️ Stopp Kamera';
            this.startParticipantScanBtn.classList.remove('primary');
            this.startParticipantScanBtn.classList.add('secondary');
        }
    }

    async handleParticipantQrFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            this.showParticipantScanFeedback('Leser QR-kode fra bilde...', 'info');

            const html5QrCode = new Html5Qrcode("participantQrReader");
            const qrData = await html5QrCode.scanFile(file, true);

            // Clear file input
            e.target.value = '';

            // Process the scanned data
            await this.handleParticipantScan(qrData);
        } catch (err) {
            console.error('Error reading QR from file:', err);
            this.showParticipantScanFeedback('Kunne ikke lese QR-kode fra bildet. Prøv igjen.', 'error');
            e.target.value = '';
        }
    }

    async handleParticipantScan(qrData) {
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

        if (!participantCode || !participantCode.match(/^[A-Z]+-\d{4}-\d{3}$/)) {
            this.showParticipantScanFeedback('Ugyldig deltaker-QR. Skann din deltaker-QR kode.', 'error');
            return;
        }

        try {
            this.showParticipantScanFeedback('Starter quiz...', 'info');

            const response = await fetch('/api/quiz/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ participant_code: participantCode })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Kunne ikke starte quiz');
            }

            const data = await response.json();
            this.sessionId = data.session_id;
            this.teamName = data.team_name;
            this.totalQuestions = data.total_questions;

            // Stop scanner
            if (this.isParticipantScannerActive) {
                await this.participantScanner.stop();
                this.isParticipantScannerActive = false;
            }

            this.showParticipantScanFeedback(`Quiz startet for ${this.teamName}!`, 'success');

            setTimeout(() => {
                this.startQuiz();
            }, 1000);

        } catch (err) {
            console.error('Error starting quiz:', err);
            this.showParticipantScanFeedback(err.message, 'error');
        }
    }

    showParticipantScanFeedback(message, type) {
        this.participantScanFeedback.textContent = message;
        this.participantScanFeedback.className = `scan-status ${type}`;
        this.participantScanFeedback.classList.remove('hidden');

        setTimeout(() => {
            if (type === 'error') {
                this.participantScanFeedback.classList.add('hidden');
            }
        }, 3000);
    }

    startTimer(timeLimit) {
        // Stop any existing timer
        this.stopTimer();

        // Reset timer display classes
        this.timerDisplay.classList.remove('warning', 'danger');

        // Set initial time
        this.timeRemaining = timeLimit;
        this.questionStartTime = Date.now();

        // Update display immediately
        this.updateTimerDisplay();

        // Start countdown
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();

            if (this.timeRemaining <= 0) {
                this.stopTimer();
                // Auto-submit when time runs out
                this.submitAnswer();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        this.timerValue.textContent = this.timeRemaining;

        // Update color based on time remaining
        this.timerDisplay.classList.remove('warning', 'danger');

        if (this.timeRemaining <= 5) {
            this.timerDisplay.classList.add('danger');
        } else if (this.timeRemaining <= 10) {
            this.timerDisplay.classList.add('warning');
        }
    }

    calculateTimeTaken() {
        if (!this.questionStartTime) return 0;
        const timeLimit = this.currentQuestion?.time_limit_seconds || 30;
        const elapsed = Math.floor((Date.now() - this.questionStartTime) / 1000);
        return Math.min(elapsed, timeLimit);
    }

    async startQuiz() {
        this.hideView(this.participantScanView);
        this.showView(this.questionView);
        this.teamNameEl.textContent = this.teamName;
        await this.loadNextQuestion();
    }

    async loadNextQuestion() {
        try {
            const response = await fetch(`/api/quiz/session/${this.sessionId}/question`);

            if (!response.ok) {
                const error = await response.json();
                if (error.all_completed) {
                    await this.showResults();
                    return;
                }
                throw new Error(error.error || 'Kunne ikke hente spørsmål');
            }

            const question = await response.json();
            this.currentQuestion = question;
            this.displayQuestion(question);

            this.hideView(this.feedbackView);
            this.showView(this.questionView);

        } catch (err) {
            console.error('Error loading question:', err);
            alert('Kunne ikke laste spørsmål: ' + err.message);
        }
    }

    displayQuestion(question) {
        // Update progress
        this.progressText.textContent = `Spørsmål ${question.question_number} av ${question.total_questions}`;

        // Debug log
        console.log('displayQuestion:', {
            question_id: question.question_id,
            question_number: question.question_number,
            is_multiple_choice: question.is_multiple_choice
        });

        // Update instruction based on single/multiple choice
        if (question.is_multiple_choice) {
            this.instructionText.textContent = 'Velg ALLE riktige alternativ';
            this.selectionInstruction.classList.add('multiple');
        } else {
            this.instructionText.textContent = 'Velg ETT alternativ';
            this.selectionInstruction.classList.remove('multiple');
        }

        // Display image if exists
        if (question.image_path) {
            this.questionImg.src = question.image_path;
            this.questionImage.classList.remove('hidden');
        } else {
            this.questionImage.classList.add('hidden');
        }

        // Display question text
        this.questionText.textContent = question.question_text;

        // Display options
        document.getElementById('optionA').textContent = question.option_a;
        document.getElementById('optionB').textContent = question.option_b;
        document.getElementById('optionC').textContent = question.option_c;
        document.getElementById('optionD').textContent = question.option_d;

        // Reset option buttons
        this.optionButtons.forEach(btn => {
            btn.classList.remove('selected');
            btn.disabled = false;
        });

        // Start timer for this question
        const timeLimit = question.time_limit_seconds || 30;
        this.startTimer(timeLimit);
    }

    selectOption(button) {
        const isMultipleChoice = this.currentQuestion?.is_multiple_choice;

        if (isMultipleChoice) {
            // Toggle selection for multiple choice
            button.classList.toggle('selected');
        } else {
            // Single choice - deselect all others first
            this.optionButtons.forEach(btn => {
                if (btn !== button) {
                    btn.classList.remove('selected');
                }
            });
            // Toggle the clicked button
            button.classList.toggle('selected');
        }
    }

    async submitAnswer() {
        try {
            // Stop the timer
            this.stopTimer();

            // Calculate time taken
            const timeTaken = this.calculateTimeTaken();

            // Get all selected options
            const selectedButtons = document.querySelectorAll('.option-button.selected');

            // If no options selected and timer didn't expire, warn user
            if (selectedButtons.length === 0 && this.timeRemaining > 0) {
                alert('Du må velge minst ett alternativ');
                // Restart timer with remaining time
                this.startTimer(this.timeRemaining);
                return;
            }

            const selectedOptions = Array.from(selectedButtons).map(btn => btn.dataset.option).sort();

            // Disable all buttons after submission
            this.optionButtons.forEach(btn => btn.disabled = true);

            const response = await fetch(`/api/quiz/session/${this.sessionId}/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question_id: this.currentQuestion.question_id,
                    selected_options: selectedOptions,
                    time_taken: timeTaken
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Kunne ikke lagre svar');
            }

            const result = await response.json();

            // Check if quiz is completed
            if (result.all_completed) {
                await this.showResults();
            } else {
                // Load next question without feedback
                await this.loadNextQuestion();
            }

        } catch (err) {
            console.error('Error submitting answer:', err);
            alert('Kunne ikke lagre svar: ' + err.message);
            // Re-enable buttons on error and restart timer
            this.optionButtons.forEach(btn => btn.disabled = false);
            if (this.timeRemaining > 0) {
                this.startTimer(this.timeRemaining);
            }
        }
    }

    showFeedback(isCorrect, allCompleted) {
        this.hideView(this.questionView);
        this.showView(this.feedbackView);

        if (isCorrect) {
            this.feedbackIcon.textContent = '✓';
            this.feedbackTitle.textContent = 'Riktig!';
            this.feedbackTitle.className = 'feedback-title correct';
            this.feedbackMessage.textContent = 'Bra jobbet!';
        } else {
            this.feedbackIcon.textContent = '✗';
            this.feedbackTitle.textContent = 'Feil';
            this.feedbackTitle.className = 'feedback-title incorrect';
            this.feedbackMessage.textContent = 'Det var ikke riktig svar.';
        }

        if (allCompleted) {
            this.nextQuestionBtn.textContent = 'Se Resultater →';
        } else {
            this.nextQuestionBtn.textContent = 'Neste Spørsmål →';
        }
    }

    async showResults() {
        try {
            const response = await fetch(`/api/quiz/session/${this.sessionId}/results`);

            if (!response.ok) {
                throw new Error('Kunne ikke hente resultater');
            }

            const results = await response.json();

            this.hideView(this.questionView);
            this.hideView(this.feedbackView);
            this.showView(this.resultsView);

            this.resultsTeamName.textContent = results.team_name;
            this.scoreValue.textContent = results.score;
            this.correctCount.textContent = results.correct_answers;
            this.totalCount.textContent = results.total_questions;

            // Format and display total time
            const totalSeconds = results.total_time || 0;
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            this.totalTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            // Display results list with detailed answers
            this.resultsContainer.innerHTML = results.questions.map((q, index) => {
                const isCorrect = q.is_correct;

                // Parse selected and correct answers
                const selectedAnswers = q.selected_options ? q.selected_options.split(',') : [];
                const correctAnswers = q.correct_option ? q.correct_option.split(',') : [];

                // Build answer text
                const getOptionText = (letter) => {
                    const optionMap = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d };
                    return optionMap[letter] || letter;
                };

                const selectedText = selectedAnswers.length > 0
                    ? selectedAnswers.map(a => `${a}: ${getOptionText(a.trim())}`).join(', ')
                    : 'Ingen svar';

                return `
                    <div class="result-item ${isCorrect ? 'correct' : 'incorrect'}">
                        <div class="result-icon">${isCorrect ? '✓' : '✗'}</div>
                        <div class="result-details">
                            <div class="result-question">
                                <strong>Spørsmål ${index + 1}:</strong> ${q.question_text}
                            </div>
                            <div class="result-answer ${isCorrect ? 'answer-correct' : 'answer-incorrect'}">
                                <strong>Ditt svar:</strong> ${selectedText}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            // Confetti if score is good
            if (results.correct_answers / results.total_questions >= 0.7) {
                if (typeof confetti !== 'undefined') {
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                }
            }

        } catch (err) {
            console.error('Error loading results:', err);
            alert('Kunne ikke laste resultater: ' + err.message);
        }
    }

    async showLeaderboard() {
        try {
            this.leaderboardContent.innerHTML = '<p style="text-align: center;">⏳ Laster...</p>';
            this.leaderboardModal.classList.remove('hidden');

            const response = await fetch('/api/quiz/leaderboard');

            if (!response.ok) {
                throw new Error('Kunne ikke laste resultattavle');
            }

            const data = await response.json();

            if (data.leaderboard.length === 0) {
                this.leaderboardContent.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--text-light);">
                        <p>Ingen lag har fullført quizen ennå.</p>
                    </div>
                `;
                return;
            }

            this.leaderboardContent.innerHTML = data.leaderboard.map(entry => {
                const rankClass = entry.rank <= 3 ? `rank-${entry.rank}` : '';
                const photoHtml = entry.team_photo_path
                    ? `<img src="${entry.team_photo_path}" class="team-photo-thumb" alt="${entry.team_name}">`
                    : '<div class="team-photo-thumb" style="background: #e0e0e0; display: flex; align-items: center; justify-content: center; font-size: 24px;">🏆</div>';

                return `
                    <div class="leaderboard-item ${rankClass}">
                        <div class="rank-badge">${entry.rank}</div>
                        ${photoHtml}
                        <div class="team-info">
                            <div class="team-name-display">${entry.team_name}</div>
                            <div class="team-score">
                                ${entry.score} poeng (${entry.correct_answers}/${entry.total_questions} riktige)
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (err) {
            console.error('Error loading leaderboard:', err);
            this.leaderboardContent.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--error-color);">
                    <p>❌ Kunne ikke laste resultattavle</p>
                </div>
            `;
        }
    }

    closeLeaderboard() {
        this.leaderboardModal.classList.add('hidden');
    }

    reset() {
        // Stop any running timer
        this.stopTimer();

        this.sessionId = null;
        this.teamName = null;
        this.currentQuestion = null;
        this.totalQuestions = 0;
        this.timeRemaining = 0;
        this.questionStartTime = null;

        this.hideView(this.questionView);
        this.hideView(this.feedbackView);
        this.hideView(this.resultsView);
        this.showView(this.participantScanView);

        this.participantBarcodeInput.value = '';
        this.participantScanFeedback.classList.add('hidden');
    }

    showView(element) {
        element.classList.remove('hidden');
    }

    hideView(element) {
        element.classList.add('hidden');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.quizManager = new QuizManager();
});
