/**
 * 4H Event Hub - Reusable Login Component
 *
 * Handles alternative login methods toggle and event listeners
 *
 * Usage:
 * 1. Include login-component.css in your HTML
 * 2. Include this script after participant-auth.js
 * 3. Call initLoginComponent() after DOM is loaded
 *
 * Example:
 * document.addEventListener('DOMContentLoaded', () => {
 *     initLoginComponent({
 *         onLoginSuccess: (participant) => {
 *             console.log('Logged in:', participant);
 *             showProfileView();
 *         }
 *     });
 * });
 */

/**
 * Initialize the login component
 * @param {Object} options - Configuration options
 * @param {Function} options.onLoginSuccess - Callback when login succeeds
 * @param {Function} options.onLoginError - Callback when login fails
 * @param {string} options.primaryInputId - ID of primary login input (default: 'participantCodeInput')
 * @param {string} options.primaryButtonId - ID of primary login button (default: 'codeLoginBtn')
 * @param {string} options.altInputId - ID of alternative login input (default: 'participantCodeInputAlt')
 * @param {string} options.altButtonId - ID of alternative login button (default: 'codeLoginBtnAlt')
 * @param {string} options.statusId - ID of status div (default: 'codeStatus')
 */
function initLoginComponent(options = {}) {
    const config = {
        onLoginSuccess: options.onLoginSuccess || function(participant) {
            console.log('Login successful:', participant);
        },
        onLoginError: options.onLoginError || function(error) {
            console.error('Login error:', error);
        },
        primaryInputId: options.primaryInputId || 'participantCodeInput',
        primaryButtonId: options.primaryButtonId || 'codeLoginBtn',
        altInputId: options.altInputId || 'participantCodeInputAlt',
        altButtonId: options.altButtonId || 'codeLoginBtnAlt',
        statusId: options.statusId || 'codeStatus',
        scanStatusId: options.scanStatusId || 'scan-status'
    };

    // Initialize toggle functionality
    initToggleFunctionality();

    // Initialize alternative login button
    initAlternativeLoginButton(config);

    // Return API for external control if needed
    return {
        expandAlternatives: expandAlternatives,
        collapseAlternatives: collapseAlternatives,
        config: config
    };
}

/**
 * Initialize toggle functionality for alternative login methods
 */
function initToggleFunctionality() {
    const toggleBtn = document.getElementById('toggleAlternativeLogin');
    const content = document.getElementById('alternativeLoginContent');
    const icon = document.querySelector('.toggle-icon');

    if (!toggleBtn || !content) {
        console.warn('Login component: Toggle elements not found');
        return;
    }

    toggleBtn.addEventListener('click', () => {
        content.classList.toggle('collapsed');
        toggleBtn.classList.toggle('expanded');
    });
}

/**
 * Expand alternative login methods
 */
function expandAlternatives() {
    const content = document.getElementById('alternativeLoginContent');
    const toggleBtn = document.getElementById('toggleAlternativeLogin');

    if (content && toggleBtn) {
        content.classList.remove('collapsed');
        toggleBtn.classList.add('expanded');
    }
}

/**
 * Collapse alternative login methods
 */
function collapseAlternatives() {
    const content = document.getElementById('alternativeLoginContent');
    const toggleBtn = document.getElementById('toggleAlternativeLogin');

    if (content && toggleBtn) {
        content.classList.add('collapsed');
        toggleBtn.classList.remove('expanded');
    }
}

/**
 * Initialize alternative login button functionality
 * @param {Object} config - Configuration object
 */
function initAlternativeLoginButton(config) {
    const altInput = document.getElementById(config.altInputId);
    const altButton = document.getElementById(config.altButtonId);

    if (!altInput || !altButton) {
        console.warn('Login component: Alternative login elements not found');
        return;
    }

    // Button click handler
    altButton.addEventListener('click', () => handleAlternativeLogin(config));

    // Enter key handler
    altInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAlternativeLogin(config);
        }
    });
}

/**
 * Handle alternative login attempt
 * @param {Object} config - Configuration object
 */
async function handleAlternativeLogin(config) {
    // Check if participantAuth is available
    if (typeof participantAuth === 'undefined') {
        console.error('participantAuth not available');
        showLoginStatus('Autentiseringssystem ikke tilgjengelig', 'error', config.statusId);
        return;
    }

    const altInput = document.getElementById(config.altInputId);
    const altButton = document.getElementById(config.altButtonId);
    const code = altInput.value.trim();

    if (!code) {
        showLoginStatus('Vennligst skriv inn ditt login-ord', 'error', config.statusId);
        altInput.focus();
        return;
    }

    // Disable button and show loading
    altButton.disabled = true;
    altButton.textContent = '⏳';
    showLoginStatus('Logger inn...', 'info', config.statusId);

    try {
        const participant = await participantAuth.loginWithCode(code);

        if (participant) {
            console.log('Alternative login successful:', participant.first_name);

            showLoginStatus('✅ Innlogget!', 'success', config.statusId);

            // Clear input
            altInput.value = '';

            // Call success callback after short delay
            setTimeout(() => {
                config.onLoginSuccess(participant);
            }, 800);
        }
    } catch (error) {
        console.error('Alternative login error:', error);
        showLoginStatus(error.message || 'Innlogging feilet. Sjekk at du har skrevet riktig login-ord og prøv igjen.', 'error', config.statusId);
        config.onLoginError(error);

        // Re-enable button
        altButton.disabled = false;
        altButton.textContent = '➡️';
    }
}

/**
 * Show login status message
 * @param {string} message - Status message
 * @param {string} type - Status type (success, error, info)
 * @param {string} statusId - ID of status element
 */
function showLoginStatus(message, type, statusId) {
    const statusDiv = document.getElementById(statusId);

    if (!statusDiv) {
        console.warn('Status div not found:', statusId);
        return;
    }

    statusDiv.textContent = message;
    statusDiv.className = `scan-status ${type}`;
    statusDiv.classList.remove('hidden');
    statusDiv.style.display = 'block';

    // Auto-hide after 3 seconds for non-error messages
    if (type !== 'error') {
        setTimeout(() => {
            statusDiv.classList.add('hidden');
            statusDiv.style.display = 'none';
        }, 3000);
    }
}

/**
 * Get HTML template for login component
 * This can be used to dynamically generate the login HTML
 *
 * @param {Object} options - Template options
 * @param {string} options.prefix - ID prefix for unique IDs (default: '')
 * @returns {string} HTML template
 */
function getLoginComponentHTML(options = {}) {
    const prefix = options.prefix || '';
    const idPrefix = prefix ? prefix + '-' : '';

    return `
<!-- PRIMARY LOGIN SECTION (Desktop: Barcode | Mobile: Login word) -->

<!-- Desktop Primary: Barcode Scanner -->
<div id="${idPrefix}desktopPrimaryLogin" class="primary-login-section desktop-primary-login">
    <div class="scanner-mode-indicator">
        <svg class="qr-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="8" height="8" rx="1"/>
            <rect x="14" y="2" width="8" height="8" rx="1"/>
            <rect x="2" y="14" width="8" height="8" rx="1"/>
            <rect x="4" y="4" width="4" height="4" fill="white"/>
            <rect x="16" y="4" width="4" height="4" fill="white"/>
            <rect x="4" y="16" width="4" height="4" fill="white"/>
            <rect x="14" y="14" width="2" height="2"/>
            <rect x="18" y="14" width="2" height="2"/>
            <rect x="14" y="18" width="2" height="2"/>
            <rect x="20" y="18" width="2" height="2"/>
            <rect x="12" y="12" width="2" height="2"/>
        </svg>
        <span>Skanner klar - skann QR-koden din!</span>
    </div>
    <div id="${idPrefix}scan-status" class="scan-status hidden"></div>
</div>

<!-- Mobile Primary: Login Word -->
<div id="${idPrefix}mobilePrimaryLogin" class="primary-login-section mobile-primary-login">
    <p style="color: var(--text-light); margin-bottom: 15px; font-size: 16px;">Skriv inn ditt login-ord</p>
    <div style="display: flex; gap: 10px; max-width: 400px; margin: 0 auto 20px;">
        <input
            type="text"
            id="${idPrefix}participantCodeInput"
            placeholder="F.eks: 4H"
            style="flex: 1; padding: 18px; font-size: 20px; border: 2px solid var(--primary-green); border-radius: 12px; text-align: center; text-transform: uppercase; font-weight: bold; letter-spacing: 2px;"
            maxlength="10"
        >
        <button id="${idPrefix}codeLoginBtn" class="button primary" style="padding: 18px 25px; font-size: 18px;">
            ➡️
        </button>
    </div>
    <p style="color: var(--text-light); font-size: 14px; margin: -10px auto 20px; max-width: 400px; text-align: center;">
        💡 Finner du dette på ditt navneskilt/deltakerkort
    </p>
    <div id="${idPrefix}codeStatus" class="scan-status hidden" style="max-width: 400px; margin: 0 auto 20px;"></div>
</div>

<!-- ALTERNATIVE LOGIN METHODS (Collapsible) -->
<div id="${idPrefix}alternativeLoginSection" style="margin-top: 25px; max-width: 500px; margin-left: auto; margin-right: auto;">
    <button id="${idPrefix}toggleAlternativeLogin" class="toggle-alternative-btn">
        <span class="toggle-icon">▼</span> Andre måter å logge inn
    </button>

    <div id="${idPrefix}alternativeLoginContent" class="alternative-login-content collapsed">
        <!-- Desktop Alternative: Login Word -->
        <div id="${idPrefix}desktopAlternativeCode" class="alternative-method desktop-alternative-code">
            <p style="color: var(--text-dark); margin-bottom: 10px; font-size: 16px; font-weight: 600;">📝 Login-ord</p>
            <p style="color: var(--text-light); margin-bottom: 15px; font-size: 14px;">Skriv inn ditt login-ord fra navneskiltet</p>
            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <input
                    type="text"
                    id="${idPrefix}participantCodeInputAlt"
                    placeholder="F.eks: 4H"
                    style="flex: 1; padding: 15px; font-size: 18px; border: 2px solid var(--primary-green); border-radius: 12px; text-align: center; text-transform: uppercase; font-weight: bold; letter-spacing: 2px;"
                    maxlength="10"
                >
                <button id="${idPrefix}codeLoginBtnAlt" class="button primary" style="padding: 15px 25px; font-size: 18px;">
                    ➡️
                </button>
            </div>
        </div>

        <!-- Mobile Alternative: Barcode Scanner -->
        <div id="${idPrefix}mobileAlternativeScanner" class="alternative-method mobile-alternative-scanner">
            <p style="color: var(--text-dark); margin-bottom: 10px; font-size: 16px; font-weight: 600;">📷 Strekkodeleser</p>
            <p style="color: var(--text-light); margin-bottom: 15px; font-size: 14px;">Bruk ekstern strekkodeleser hvis tilgjengelig</p>
            <div class="scanner-mode-indicator" style="font-size: 14px; padding: 12px;">
                <svg class="qr-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="8" height="8" rx="1"/>
                    <rect x="14" y="2" width="8" height="8" rx="1"/>
                    <rect x="2" y="14" width="8" height="8" rx="1"/>
                    <rect x="4" y="4" width="4" height="4" fill="white"/>
                    <rect x="16" y="4" width="4" height="4" fill="white"/>
                    <rect x="4" y="16" width="4" height="4" fill="white"/>
                </svg>
                <span>Skanner klar</span>
            </div>
        </div>

        <!-- Desktop Only: Camera Scanning -->
        <div id="${idPrefix}desktopCameraScanning" class="alternative-method desktop-camera-scanning">
            <p style="color: var(--text-dark); margin-bottom: 10px; font-size: 16px; font-weight: 600;">📸 Kamera-skanning</p>
            <p style="color: var(--text-light); margin-bottom: 15px; font-size: 14px;">Bruk kameraet til å skanne QR-kode</p>
            <div id="${idPrefix}qr-reader" class="qr-reader" style="margin-bottom: 15px;"></div>
            <button id="${idPrefix}start-scan-btn" class="button primary" style="width: 100%; font-size: 16px; padding: 15px;">
                📷 Start Kamera-Skanning
            </button>
        </div>

        <!-- Upload QR Image (Both) -->
        <div id="${idPrefix}uploadQRMethod" class="alternative-method">
            <p style="color: var(--text-dark); margin-bottom: 10px; font-size: 16px; font-weight: 600;">🖼️ Last opp bilde</p>
            <p style="color: var(--text-light); margin-bottom: 15px; font-size: 14px;">Last opp et bilde av QR-koden</p>
            <label for="${idPrefix}qr-file-input" class="button secondary" style="width: 100%; font-size: 16px; padding: 15px; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer;">
                🖼️ Velg bilde
            </label>
            <input type="file" id="${idPrefix}qr-file-input" accept="image/*" style="display: none;">
        </div>
    </div>
</div>
    `.trim();
}

// Export for use in modules (if using ES6 modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initLoginComponent,
        expandAlternatives,
        collapseAlternatives,
        getLoginComponentHTML
    };
}
