// Participant Authentication Module
// Handles participant login via QR code, PIN/code input, and session persistence

class ParticipantAuth {
    constructor() {
        this.currentParticipant = null;
        this.sessionKey = 'currentParticipant';
        this.sessionTimestampKey = 'participantSessionTimestamp';
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
    }

    /**
     * Initialize authentication - check for existing session
     * @returns {Object|null} Current participant if session exists
     */
    async init() {
        // Check for existing session
        const stored = this.getStoredParticipant();
        if (stored) {
            // Verify participant still exists in database
            try {
                const participant = await this.lookupParticipant(stored.participant_code);
                if (participant) {
                    this.currentParticipant = participant;
                    console.log('Restored session for:', participant.first_name, participant.last_name);
                    return participant;
                }
            } catch (error) {
                console.log('Session expired or participant not found');
                this.clearSession();
            }
        }
        return null;
    }

    /**
     * Get stored participant from localStorage
     * @returns {Object|null}
     */
    getStoredParticipant() {
        try {
            const stored = localStorage.getItem(this.sessionKey);
            const timestamp = localStorage.getItem(this.sessionTimestampKey);

            if (!stored || !timestamp) {
                return null;
            }

            // Check if session has expired
            const age = Date.now() - parseInt(timestamp);
            if (age > this.sessionTimeout) {
                console.log('Session expired');
                this.clearSession();
                return null;
            }

            return JSON.parse(stored);
        } catch (error) {
            console.error('Error reading stored participant:', error);
            return null;
        }
    }

    /**
     * Store participant in localStorage
     * @param {Object} participant
     */
    storeParticipant(participant) {
        try {
            localStorage.setItem(this.sessionKey, JSON.stringify(participant));
            localStorage.setItem(this.sessionTimestampKey, Date.now().toString());
            console.log('Participant session stored');
        } catch (error) {
            console.error('Error storing participant:', error);
        }
    }

    /**
     * Clear current session
     */
    clearSession() {
        this.currentParticipant = null;
        localStorage.removeItem(this.sessionKey);
        localStorage.removeItem(this.sessionTimestampKey);
        console.log('Session cleared');
    }

    /**
     * Login with participant code (PIN)
     * @param {string} code - Participant code (e.g., "TEST0002")
     * @returns {Promise<Object>} Participant object
     */
    async loginWithCode(code) {
        if (!code || !code.trim()) {
            throw new Error('Deltakerkode er påkrevd');
        }

        // Clean up the code (remove spaces, convert to uppercase)
        const cleanCode = code.trim().toUpperCase();

        try {
            const participant = await this.lookupParticipant(cleanCode);

            if (!participant) {
                throw new Error('Deltaker ikke funnet');
            }

            // Store session
            this.currentParticipant = participant;
            this.storeParticipant(participant);

            return participant;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Login with QR code data
     * @param {string} qrData - Raw QR code data
     * @returns {Promise<Object>} Participant object
     */
    async loginWithQR(qrData) {
        // Decode potential keyboard layout issues
        const decoded = this.decodeQRData(qrData);

        let participantCode;

        try {
            // Try to parse as JSON
            const parsed = JSON.parse(decoded);
            if (parsed && parsed.type === 'participant' && parsed.code) {
                participantCode = parsed.code;
            } else {
                throw new Error('Invalid QR code format');
            }
        } catch (e) {
            // Not JSON, use as plain participant code
            participantCode = decoded;
        }

        return await this.loginWithCode(participantCode);
    }

    /**
     * Lookup participant by code
     * @param {string} code - Participant code
     * @returns {Promise<Object>} Participant object
     */
    async lookupParticipant(code) {
        const response = await fetch(`/api/participants/${code}`);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Deltaker med kode "${code}" finnes ikke`);
            }
            throw new Error('Kunne ikke hente deltakerinformasjon');
        }

        return await response.json();
    }

    /**
     * Decode QR data (handle keyboard layout issues)
     * @param {string} input - Raw QR data
     * @returns {string} Decoded data
     */
    decodeQRData(input) {
        if (typeof GlobalBarcodeScanner !== 'undefined' && GlobalBarcodeScanner.decodeBarcodeInput) {
            return GlobalBarcodeScanner.decodeBarcodeInput(input);
        }

        // Fallback: just replace common issues
        return input.replace(/\+/g, '-');
    }

    /**
     * Get current logged-in participant
     * @returns {Object|null}
     */
    getCurrentParticipant() {
        return this.currentParticipant;
    }

    /**
     * Check if a participant is logged in
     * @returns {boolean}
     */
    isLoggedIn() {
        return this.currentParticipant !== null;
    }

    /**
     * Logout current participant
     */
    logout() {
        this.clearSession();
    }
}

// Create global instance
window.participantAuth = new ParticipantAuth();

console.log('Participant Authentication module loaded');
