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
        this.musicEnabled = true; // Default to enabled, will be loaded from event settings

        this.initElements();
        this.initScanners();
        this.initEventListeners();
        this.loadEventSettings();

        // Activate global barcode scanner on initial load
        globalBarcodeScanner.activate((qrData) => this.handleParticipantScan(qrData));
    }

    initElements() {
        // Views
        this.participantScanView = document.getElementById('participantScanView');
        this.questionView = document.getElementById('questionView');
        this.feedbackView = document.getElementById('feedbackView');
        this.resultsView = document.getElementById('resultsView');

        // Participant scan
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

        // Background music - different tracks for different time limits
        this.quizMusic = {
            5: document.getElementById('quizMusic5'),
            10: document.getElementById('quizMusic10'),
            20: document.getElementById('quizMusic20'),
            30: document.getElementById('quizMusic30')
        };

        // Set volume for all tracks
        Object.values(this.quizMusic).forEach(audio => {
            if (audio) {
                audio.volume = 0.3; // Set volume to 30%
            }
        });

        this.currentMusic = null; // Track which audio is currently playing

        // Debug: Log if critical elements are missing
        if (!this.retakeQuizBtn) console.error('retakeQuizBtn not found');
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
        // Login word input
        const participantCodeInput = document.getElementById('participantCodeInput');
        const codeLoginBtn = document.getElementById('codeLoginBtn');
        if (codeLoginBtn) {
            codeLoginBtn.addEventListener('click', () => this.handleLoginWithCode());
        }
        if (participantCodeInput) {
            participantCodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleLoginWithCode();
                }
            });
        }

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

    async loadEventSettings() {
        try {
            const response = await fetch('/api/event');
            if (response.ok) {
                const event = await response.json();
                this.musicEnabled = event.enable_quiz_music !== 0; // Default to true if undefined
            }
        } catch (err) {
            console.error('Error loading event settings:', err);
            // Keep default value (true) if loading fails
        }
    }

    async handleParticipantQrFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            this.showParticipantScanFeedback('Leser QR-kode fra bilde...', 'info');

            // Use the QRScanner's scanFile method (handles jsQR + fallback internally)
            await this.participantScanner.scanFile(file);

            // Clear file input
            e.target.value = '';

            // Clear the qr-reader div to remove displayed image
            document.getElementById('participantQrReader').innerHTML = '';
        } catch (err) {
            console.error('Error reading QR from file:', err);
            this.showParticipantScanFeedback('Kunne ikke lese QR-kode fra bildet. Prøv igjen.', 'error');
            e.target.value = '';
            // Clear the qr-reader div
            document.getElementById('participantQrReader').innerHTML = '';
        }
    }

    async handleLoginWithCode() {
        const participantCodeInput = document.getElementById('participantCodeInput');
        const codeLoginBtn = document.getElementById('codeLoginBtn');

        if (typeof participantAuth === 'undefined') {
            console.error('participantAuth not available');
            this.showCodeStatus('Autentiseringssystem ikke tilgjengelig', 'error');
            return;
        }

        const code = participantCodeInput.value.trim();

        if (!code) {
            this.showCodeStatus('Vennligst skriv inn ditt login-ord', 'error');
            participantCodeInput.focus();
            return;
        }

        codeLoginBtn.disabled = true;
        codeLoginBtn.textContent = '⏳';
        this.showCodeStatus('Logger inn...', 'info');

        try {
            const participant = await participantAuth.loginWithCode(code);

            if (participant) {
                console.log('Login successful:', participant.first_name);
                await this.handleParticipantScan(participant.participant_code, true);
                participantCodeInput.value = '';
                codeLoginBtn.disabled = false;
                codeLoginBtn.textContent = '➡️';
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showCodeStatus(error.message || 'Feil ved innlogging', 'error');
            codeLoginBtn.disabled = false;
            codeLoginBtn.textContent = '➡️';
        }
    }

    showCodeStatus(message, type) {
        const codeStatus = document.getElementById('codeStatus');
        if (!codeStatus) return;

        codeStatus.textContent = message;
        codeStatus.className = `scan-status ${type}`;
        codeStatus.classList.remove('hidden');

        if (type !== 'error') {
            setTimeout(() => {
                codeStatus.classList.add('hidden');
            }, 3000);
        }
    }

    async handleParticipantScan(qrData, skipDecode = false) {
        console.log('Raw QR data:', qrData);
        const decodedData = skipDecode ? qrData : GlobalBarcodeScanner.decodeBarcodeInput(qrData);
        console.log('Decoded data:', decodedData);
        let participantCode;

        try {
            const parsed = JSON.parse(decodedData);
            console.log('Parsed JSON:', parsed);
            if (parsed.type === 'participant' && parsed.code) {
                participantCode = parsed.code;
            } else {
                participantCode = decodedData;
            }
        } catch (e) {
            console.log('Not JSON, using raw:', decodedData);
            participantCode = decodedData;
        }

        console.log('Final participant code:', participantCode);

        // Trim whitespace
        participantCode = participantCode?.trim();

        // Basic validation - just check if we have something
        if (!participantCode) {
            console.error('No participant code provided');
            this.showParticipantScanFeedback('Ugyldig deltaker-QR. Skann din deltaker-QR kode.', 'error');
            return;
        }

        try {
            // Show fun loading animation
            if (window.loadingAnimations) {
                window.loadingAnimations.show('quiz');
            }

            const response = await fetch('/api/quiz/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ participant_code: participantCode })
            });

            if (!response.ok) {
                const error = await response.json();
                if (window.loadingAnimations) {
                    window.loadingAnimations.hide();
                }
                throw new Error(error.error || 'Kunne ikke starte quizen. Sjekk internett-tilkoblingen og prøv igjen. Kontakt en arrangør hvis problemet vedvarer.');
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

            // Hide loading animation
            if (window.loadingAnimations) {
                window.loadingAnimations.hide();
            }

            this.showParticipantScanFeedback(`Quiz startet for ${this.teamName}!`, 'success');

            // Play success sound
            if (window.soundEffects) {
                window.soundEffects.playScanSuccess();
            }

            setTimeout(() => {
                this.startQuiz();
            }, 1000);

        } catch (err) {
            console.error('Error starting quiz:', err);
            if (window.loadingAnimations) {
                window.loadingAnimations.hide();
            }
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
        // Deactivate global barcode scanner
        globalBarcodeScanner.deactivate();

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
                throw new Error(error.error || 'Kunne ikke laste spørsmålet. Sjekk internett-tilkoblingen og prøv igjen.');
            }

            const question = await response.json();
            this.currentQuestion = question;
            this.displayQuestion(question);

            this.hideView(this.feedbackView);
            this.showView(this.questionView);

        } catch (err) {
            console.error('Error loading question:', err);
            this.showStatus('Kunne ikke laste spørsmålet. Sjekk internett-tilkoblingen og last inn siden på nytt. Kontakt en arrangør hvis problemet vedvarer.', 'error');
        }
    }

    displayQuestion(question) {
        // Stop any currently playing music
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
        }

        // Get time limit for this question
        const timeLimit = question.time_limit_seconds || 30;

        // Only play music if enabled in settings
        if (this.musicEnabled) {
            // Select the correct music based on time limit
            let selectedMusic = this.quizMusic[timeLimit];

            // If exact time limit doesn't exist, find the closest match
            if (!selectedMusic) {
                const availableTimes = [5, 10, 20, 30];
                const closestTime = availableTimes.reduce((prev, curr) => {
                    return Math.abs(curr - timeLimit) < Math.abs(prev - timeLimit) ? curr : prev;
                });
                selectedMusic = this.quizMusic[closestTime];
            }

            // Play the selected music
            if (selectedMusic) {
                this.currentMusic = selectedMusic;
                selectedMusic.play().catch(err => {
                    console.log('Audio playback prevented by browser:', err);
                });
            }
        }

        // Update progress
        this.progressText.textContent = `Spørsmål ${question.question_number} av ${question.total_questions}`;

        // Update instruction based on single/multiple choice
        const icon = this.selectionInstruction.querySelector('.icon');
        if (question.is_multiple_choice) {
            this.instructionText.textContent = 'Velg ALLE riktige alternativ';
            this.selectionInstruction.classList.add('multiple');
            icon.textContent = '☑️';
        } else {
            this.instructionText.textContent = 'Velg ETT alternativ';
            this.selectionInstruction.classList.remove('multiple');
            icon.textContent = '👆';
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

        // Start timer for this question (using timeLimit already declared above)
        this.startTimer(timeLimit);

        // Play notification sound for new question
        if (window.soundEffects) {
            window.soundEffects.playNotification();
        }
    }

    selectOption(button) {
        const isMultipleChoice = this.currentQuestion?.is_multiple_choice;

        // Play click sound
        if (window.soundEffects) {
            window.soundEffects.playClick();
        }

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
                this.showStatus('Du må velge minst ett alternativ før du kan gå videre', 'warning');
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
                throw new Error(error.error || 'Kunne ikke lagre svaret ditt. Sjekk internett-tilkoblingen og prøv igjen.');
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
            this.showStatus('Kunne ikke lagre svaret ditt. Sjekk internett-tilkoblingen og prøv igjen. Hvis problemet vedvarer, kontakt en arrangør.', 'error');
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
            // Show fun loading animation for results
            if (window.loadingAnimations) {
                window.loadingAnimations.show('results');
            }

            // Stop background music
            if (this.currentMusic) {
                this.currentMusic.pause();
                this.currentMusic.currentTime = 0;
                this.currentMusic = null;
            }

            const response = await fetch(`/api/quiz/session/${this.sessionId}/results`);

            if (!response.ok) {
                throw new Error('Kunne ikke laste resultatene dine. Sjekk internett-tilkoblingen og prøv igjen.');
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

            // Confetti and sound based on score
            if (typeof confetti !== 'undefined') {
                const scorePercentage = results.correct_answers / results.total_questions;

                if (scorePercentage === 1.0) {
                    // Perfect score - SPECTACULAR confetti celebration! 🎉
                    const duration = 5000;
                    const end = Date.now() + duration;

                    const colors = ['#4CAF50', '#2196F3', '#FFC107', '#E91E63', '#9C27B0', '#00BCD4', '#FF5722', '#CDDC39'];

                    (function frame() {
                        // Side cannons
                        confetti({
                            particleCount: 15,
                            angle: 60,
                            spread: 70,
                            origin: { x: 0, y: 0.8 },
                            colors: colors,
                            startVelocity: 60,
                            gravity: 1.2,
                            scalar: 1.4,
                            ticks: 300
                        });
                        confetti({
                            particleCount: 15,
                            angle: 120,
                            spread: 70,
                            origin: { x: 1, y: 0.8 },
                            colors: colors,
                            startVelocity: 60,
                            gravity: 1.2,
                            scalar: 1.4,
                            ticks: 300
                        });

                        // Center explosion
                        if (Math.random() < 0.3) {
                            confetti({
                                particleCount: 25,
                                spread: 360,
                                origin: { x: 0.5, y: 0.5 },
                                colors: colors,
                                startVelocity: 45,
                                scalar: 1.6,
                                ticks: 250
                            });
                        }

                        if (Date.now() < end) {
                            requestAnimationFrame(frame);
                        }
                    }());

                    // Initial big burst
                    confetti({
                        particleCount: 150,
                        spread: 100,
                        origin: { y: 0.6 },
                        colors: colors,
                        scalar: 1.5,
                        ticks: 300
                    });

                    // Play achievement sound for perfect score
                    if (window.soundEffects) {
                        window.soundEffects.playAchievement();
                    }

                } else if (scorePercentage >= 0.8) {
                    // Great score - impressive confetti!
                    const colors = ['#4CAF50', '#2196F3', '#FFC107', '#E91E63'];

                    // Multiple bursts
                    setTimeout(() => {
                        confetti({
                            particleCount: 80,
                            spread: 80,
                            origin: { y: 0.6, x: 0.3 },
                            colors: colors,
                            scalar: 1.3,
                            ticks: 250
                        });
                    }, 0);

                    setTimeout(() => {
                        confetti({
                            particleCount: 80,
                            spread: 80,
                            origin: { y: 0.6, x: 0.7 },
                            colors: colors,
                            scalar: 1.3,
                            ticks: 250
                        });
                    }, 200);

                    setTimeout(() => {
                        confetti({
                            particleCount: 100,
                            spread: 90,
                            origin: { y: 0.6, x: 0.5 },
                            colors: colors,
                            scalar: 1.3,
                            ticks: 250
                        });
                    }, 400);

                    // Play success sound for great score
                    if (window.soundEffects) {
                        window.soundEffects.playSuccess();
                    }

                } else if (scorePercentage >= 0.7) {
                    // Good score - standard confetti
                    confetti({
                        particleCount: 150,
                        spread: 85,
                        origin: { y: 0.6 },
                        colors: ['#4CAF50', '#2196F3', '#FFC107'],
                        scalar: 1.2,
                        ticks: 200
                    });

                    // Play success sound for good score
                    if (window.soundEffects) {
                        window.soundEffects.playSuccess();
                    }
                }
            }

            // Hide loading animation after results are displayed
            if (window.loadingAnimations) {
                window.loadingAnimations.hide();
            }

        } catch (err) {
            console.error('Error loading results:', err);
            if (window.loadingAnimations) {
                window.loadingAnimations.hide();
            }
            this.showStatus('Kunne ikke laste resultatene dine. Sjekk internett-tilkoblingen og last inn siden på nytt. Kontakt en arrangør hvis problemet vedvarer.', 'error');
        }
    }

    async showLeaderboard() {
        try {
            this.leaderboardContent.innerHTML = '<p style="text-align: center;">⏳ Laster...</p>';
            this.leaderboardModal.classList.remove('hidden');

            const response = await fetch('/api/quiz/leaderboard');

            if (!response.ok) {
                throw new Error('Kunne ikke laste resultattavlen. Sjekk internett-tilkoblingen og prøv igjen.');
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

        this.participantScanFeedback.classList.add('hidden');

        // Activate global barcode scanner
        globalBarcodeScanner.activate((qrData) => this.handleParticipantScan(qrData));
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

    // Initialize login component (alternative login methods)
    initLoginComponent({
        onLoginSuccess: (participant) => {
            window.quizManager.handleParticipantScan(participant.participant_code, true);
        },
        altInputId: 'participantCodeInputAlt',
        altButtonId: 'codeLoginBtnAlt'
    });
});
