// Sound Effects Module
// Handles playing sound effects with admin-controlled settings

class SoundEffects {
    constructor() {
        this.settingsKey = 'soundSettings';
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.5; // Default volume (0.0 - 1.0)

        // Load settings from localStorage
        this.loadSettings();

        // Initialize sound effects
        this.initSounds();
    }

    /**
     * Initialize sound effects
     * For now using Web Audio API to generate simple tones
     * Can be replaced with actual audio files later
     */
    initSounds() {
        // Create audio context
        this.audioContext = null;

        // Try to create AudioContext (will be created on first user interaction)
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioContext = new AudioContext();
            }
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const stored = localStorage.getItem(this.settingsKey);
            if (stored) {
                const settings = JSON.parse(stored);
                this.enabled = settings.enabled !== false; // Default to true
                this.volume = settings.volume || 0.5;
            }
        } catch (error) {
            console.error('Error loading sound settings:', error);
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify({
                enabled: this.enabled,
                volume: this.volume
            }));
            console.log('Sound settings saved:', { enabled: this.enabled, volume: this.volume });
        } catch (error) {
            console.error('Error saving sound settings:', error);
        }
    }

    /**
     * Enable sound effects
     */
    enable() {
        this.enabled = true;
        this.saveSettings();
    }

    /**
     * Disable sound effects
     */
    disable() {
        this.enabled = false;
        this.saveSettings();
    }

    /**
     * Toggle sound effects on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        this.saveSettings();
        return this.enabled;
    }

    /**
     * Set volume (0.0 - 1.0)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    }

    /**
     * Check if sounds are enabled
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Play a simple tone using Web Audio API
     * @param {number} frequency - Frequency in Hz
     * @param {number} duration - Duration in milliseconds
     * @param {string} type - Oscillator type (sine, square, sawtooth, triangle)
     */
    playTone(frequency, duration, type = 'sine') {
        if (!this.enabled || !this.audioContext) return;

        try {
            // Resume audio context if suspended (required by browser autoplay policies)
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            // Set volume with fade out
            gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration / 1000);
        } catch (error) {
            console.warn('Error playing tone:', error);
        }
    }

    /**
     * Play success sound
     */
    playSuccess() {
        if (!this.enabled) return;

        // Play a pleasant ascending tone
        setTimeout(() => this.playTone(523.25, 100), 0);   // C5
        setTimeout(() => this.playTone(659.25, 100), 80);  // E5
        setTimeout(() => this.playTone(783.99, 150), 160); // G5
    }

    /**
     * Play achievement/celebration sound
     */
    playAchievement() {
        if (!this.enabled) return;

        // Play a triumphant sequence
        setTimeout(() => this.playTone(523.25, 120), 0);   // C5
        setTimeout(() => this.playTone(659.25, 120), 100); // E5
        setTimeout(() => this.playTone(783.99, 120), 200); // G5
        setTimeout(() => this.playTone(1046.50, 300), 300); // C6
    }

    /**
     * Play error sound
     */
    playError() {
        if (!this.enabled) return;

        // Play a low descending tone
        setTimeout(() => this.playTone(293.66, 100, 'square'), 0);   // D4
        setTimeout(() => this.playTone(246.94, 200, 'square'), 100); // B3
    }

    /**
     * Play notification/info sound
     */
    playNotification() {
        if (!this.enabled) return;

        // Play a simple ding
        this.playTone(800, 100);
    }

    /**
     * Play button click sound
     */
    playClick() {
        if (!this.enabled) return;

        // Play a subtle click
        this.playTone(600, 50);
    }

    /**
     * Play scan success sound
     */
    playScanSuccess() {
        if (!this.enabled) return;

        // Play a quick beep
        setTimeout(() => this.playTone(880, 80), 0);   // A5
        setTimeout(() => this.playTone(1174.66, 100), 80); // D6
    }

    /**
     * Play countdown tick sound
     */
    playTick() {
        if (!this.enabled) return;

        // Play a subtle tick
        this.playTone(440, 50);
    }

    /**
     * Play time warning sound
     */
    playWarning() {
        if (!this.enabled) return;

        // Play a pulsing warning tone
        for (let i = 0; i < 3; i++) {
            setTimeout(() => this.playTone(440, 100, 'square'), i * 200);
        }
    }
}

// Create global instance
window.soundEffects = new SoundEffects();

console.log('Sound Effects module loaded');
