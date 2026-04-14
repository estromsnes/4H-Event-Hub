// Loading Animations Module
// Provides fun loading animations with rotating messages

class LoadingAnimations {
    constructor() {
        this.loadingMessages = {
            general: [
                'Gjør klar ting og tang...',
                'Teller kuer i skogen... 🐄',
                'Vekker datamaskinene... 💤',
                'Mikser litt 4H-magi... ✨',
                'Snakker med serverne... 🤖',
                'Varmer opp elektronene... ⚡',
                'Lager litt digital moro... 🎮',
                'Sjekker at alt er på stell... 🔍',
                'Henter data fra det store hvelvet... 🗄️',
                'Blander inn litt kreativitet... 🎨'
            ],
            login: [
                'Logger deg inn... 🔐',
                'Sjekker at du er ekte... 🕵️',
                'Åpner dørene for deg... 🚪',
                'Finner frem nøklene... 🗝️',
                'Sjekker medlemskortet... 🎫',
                'Gir deg tilgang... ✅',
                'Godkjenner identiteten din... 👤'
            ],
            quiz: [
                'Finner frem spørsmålene... 🤔',
                'Blander spørsmålskortene... 🃏',
                'Sjekker fasiten... 📝',
                'Henter hjernebryterne... 🧠',
                'Laster inn kunnskap... 📚',
                'Gjør klar quiz-opplegget... 🎯'
            ],
            scanning: [
                'Skanner QR-koden... 📱',
                'Leser strekkodene... 🔍',
                'Tolker pikslene... 📷',
                'Analyserer mønsteret... 🔬'
            ],
            saving: [
                'Lagrer arbeidet ditt... 💾',
                'Skriver til databasen... ✍️',
                'Tar vare på dataene... 🗃️',
                'Sender til serveren... 📤',
                'Lagrer poengene dine... 🏆'
            ],
            loading: [
                'Henter dataene... 📊',
                'Sjekker statusen... 📈',
                'Oppdaterer visningen... 🔄',
                'Klargjør alt for deg... 🎁'
            ],
            camera: [
                'Starter kameraet... 📸',
                'Sjekker linsen... 🔍',
                'Justerer fokuset... 🎯',
                'Gjør deg klar for foto... 📷',
                'Kalibrerer kameraet... ⚙️'
            ],
            results: [
                'Regner ut resultatene... 🧮',
                'Teller poengene... 💯',
                'Sjekker rangeringen... 🏅',
                'Gjør klar resultattavlen... 📊'
            ]
        };

        this.currentMessageInterval = null;
        this.currentMessageIndex = 0;
        this.currentCategory = 'general';
    }

    /**
     * Show a loading overlay with animated spinner and rotating messages
     * @param {string} category - Message category (general, login, quiz, scanning, saving, loading, camera, results)
     * @param {number} messageRotationSpeed - Speed in ms to rotate messages (default: 2500)
     */
    show(category = 'general', messageRotationSpeed = 2500) {
        // Remove any existing loading overlay
        this.hide();

        this.currentCategory = category;
        this.currentMessageIndex = 0;

        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';

        // Create spinner container
        const spinnerContainer = document.createElement('div');
        spinnerContainer.className = 'loading-spinner-container';

        // Create animated spinner
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';

        // Add 4H-themed animation elements
        for (let i = 0; i < 4; i++) {
            const leaf = document.createElement('div');
            leaf.className = 'spinner-leaf';
            spinner.appendChild(leaf);
        }

        // Create message element
        const message = document.createElement('div');
        message.id = 'loading-message';
        message.className = 'loading-message';
        message.textContent = this.getRandomMessage(category);

        // Assemble and add to page
        spinnerContainer.appendChild(spinner);
        overlay.appendChild(spinnerContainer);
        overlay.appendChild(message);
        document.body.appendChild(overlay);

        // Trigger animation
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });

        // Rotate messages
        this.currentMessageInterval = setInterval(() => {
            const messageEl = document.getElementById('loading-message');
            if (messageEl) {
                // Fade out
                messageEl.style.opacity = '0';

                // Change message and fade in
                setTimeout(() => {
                    messageEl.textContent = this.getRandomMessage(category);
                    messageEl.style.opacity = '1';
                }, 300);
            }
        }, messageRotationSpeed);
    }

    /**
     * Show loading with a specific custom message
     * @param {string} message - Custom message to display
     */
    showWithMessage(message) {
        this.hide();

        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';

        const spinnerContainer = document.createElement('div');
        spinnerContainer.className = 'loading-spinner-container';

        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';

        for (let i = 0; i < 4; i++) {
            const leaf = document.createElement('div');
            leaf.className = 'spinner-leaf';
            spinner.appendChild(leaf);
        }

        const messageEl = document.createElement('div');
        messageEl.id = 'loading-message';
        messageEl.className = 'loading-message';
        messageEl.textContent = message;

        spinnerContainer.appendChild(spinner);
        overlay.appendChild(spinnerContainer);
        overlay.appendChild(messageEl);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });
    }

    /**
     * Hide the loading overlay
     */
    hide() {
        // Clear message rotation interval
        if (this.currentMessageInterval) {
            clearInterval(this.currentMessageInterval);
            this.currentMessageInterval = null;
        }

        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('visible');
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }
    }

    /**
     * Get a random message from the specified category
     * @param {string} category - Message category
     * @returns {string} Random message
     */
    getRandomMessage(category) {
        const messages = this.loadingMessages[category] || this.loadingMessages.general;
        const randomIndex = Math.floor(Math.random() * messages.length);
        return messages[randomIndex];
    }

    /**
     * Update the current message
     * @param {string} message - New message to display
     */
    updateMessage(message) {
        const messageEl = document.getElementById('loading-message');
        if (messageEl) {
            messageEl.style.opacity = '0';
            setTimeout(() => {
                messageEl.textContent = message;
                messageEl.style.opacity = '1';
            }, 300);
        }
    }

    /**
     * Show a simple inline spinner (no overlay)
     * @param {HTMLElement} targetElement - Element to show spinner in
     * @param {string} message - Optional message
     */
    showInline(targetElement, message = '') {
        if (!targetElement) return;

        const container = document.createElement('div');
        container.className = 'loading-inline';

        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner-small';
        container.appendChild(spinner);

        if (message) {
            const messageEl = document.createElement('span');
            messageEl.className = 'loading-inline-message';
            messageEl.textContent = message;
            container.appendChild(messageEl);
        }

        targetElement.innerHTML = '';
        targetElement.appendChild(container);
    }
}

// Create global instance
window.loadingAnimations = new LoadingAnimations();

console.log('Loading Animations module loaded');
