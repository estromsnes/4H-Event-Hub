# 4H Event Hub - Login Component

Gjenbrukbar innloggingskomponent som fungerer på alle sider.

## Funksjoner

✅ **Responsive design** - Tilpasser seg automatisk til mobil/desktop
✅ **Primær innlogging** - Strekkodeleser (PC) / Login-ord (mobil)
✅ **Alternative metoder** - Kollapsbar seksjon med andre innloggingsvalg
✅ **Enkel integrasjon** - Drop-in komponent med minimal konfigurasjon
✅ **Konsistent UX** - Samme oppførsel på alle sider

---

## Kom i gang

### 1. Inkluder nødvendige filer i `<head>`:

```html
<link rel="stylesheet" href="/css/login-component.css">
```

### 2. Inkluder JavaScript før `</body>`:

```html
<!-- Dependencies -->
<script src="/js/participant-auth.js"></script>

<!-- Login Component -->
<script src="/js/login-component.js"></script>
```

### 3. Legg til HTML-markup:

**Metode A: Kopier ferdig HTML**

```html
<div class="scanner-section">
    <!-- Hidden barcode input (required for hardware scanner) -->
    <input type="text" id="barcode-input" style="position: absolute; left: -9999px;" autocomplete="off">

    <!-- PRIMARY LOGIN SECTION -->

    <!-- Desktop Primary: Barcode Scanner -->
    <div id="desktopPrimaryLogin" class="primary-login-section">
        <div class="scanner-mode-indicator">
            <svg class="qr-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="2" width="8" height="8" rx="1"/>
                <rect x="14" y="2" width="8" height="8" rx="1"/>
                <rect x="2" y="14" width="8" height="8" rx="1"/>
                <rect x="4" y="4" width="4" height="4" fill="white"/>
                <rect x="16" y="4" width="4" height="4" fill="white"/>
                <rect x="4" y="16" width="4" height="4" fill="white"/>
            </svg>
            <span>Skanner klar - skann QR-koden din!</span>
        </div>
        <div id="scan-status" class="scan-status hidden"></div>
    </div>

    <!-- Mobile Primary: Login Word -->
    <div id="mobilePrimaryLogin" class="primary-login-section">
        <p style="color: var(--text-light); margin-bottom: 15px; font-size: 16px;">Skriv inn ditt login-ord</p>
        <div style="display: flex; gap: 10px; max-width: 400px; margin: 0 auto 20px;">
            <input
                type="text"
                id="participantCodeInput"
                placeholder="F.eks: 4H"
                style="flex: 1; padding: 18px; font-size: 20px; border: 2px solid var(--primary-green); border-radius: 12px; text-align: center; text-transform: uppercase; font-weight: bold; letter-spacing: 2px;"
                maxlength="10"
            >
            <button id="codeLoginBtn" class="button primary" style="padding: 18px 25px; font-size: 18px;">
                ➡️
            </button>
        </div>
        <p style="color: var(--text-light); font-size: 14px;">
            💡 Finner du dette på ditt navneskilt/deltakerkort
        </p>
        <div id="codeStatus" class="scan-status hidden"></div>
    </div>

    <!-- ALTERNATIVE LOGIN METHODS (Collapsible) -->
    <div id="alternativeLoginSection" style="margin-top: 25px; max-width: 500px; margin: 0 auto;">
        <button id="toggleAlternativeLogin" class="toggle-alternative-btn">
            <span class="toggle-icon">▼</span> Andre måter å logge inn
        </button>

        <div id="alternativeLoginContent" class="alternative-login-content collapsed">
            <!-- Desktop Alternative: Login Word -->
            <div id="desktopAlternativeCode" class="alternative-method">
                <p style="color: var(--text-dark); font-weight: 600;">📝 Login-ord</p>
                <p style="color: var(--text-light); font-size: 14px;">Skriv inn ditt login-ord fra navneskiltet</p>
                <div style="display: flex; gap: 10px;">
                    <input
                        type="text"
                        id="participantCodeInputAlt"
                        placeholder="F.eks: 4H"
                        style="flex: 1; padding: 15px; font-size: 18px; border: 2px solid var(--primary-green); border-radius: 12px; text-align: center; text-transform: uppercase; font-weight: bold;"
                        maxlength="10"
                    >
                    <button id="codeLoginBtnAlt" class="button primary">➡️</button>
                </div>
            </div>

            <!-- Mobile Alternative: Barcode Scanner -->
            <div id="mobileAlternativeScanner" class="alternative-method">
                <p style="color: var(--text-dark); font-weight: 600;">📷 Strekkodeleser</p>
                <p style="color: var(--text-light); font-size: 14px;">Bruk ekstern strekkodeleser hvis tilgjengelig</p>
                <div class="scanner-mode-indicator" style="font-size: 14px; padding: 12px;">
                    <span>Skanner klar</span>
                </div>
            </div>

            <!-- Desktop Only: Camera Scanning -->
            <div id="desktopCameraScanning" class="alternative-method">
                <p style="color: var(--text-dark); font-weight: 600;">📸 Kamera-skanning</p>
                <p style="color: var(--text-light); font-size: 14px;">Bruk kameraet til å skanne QR-kode</p>
                <div id="qr-reader"></div>
                <button id="start-scan-btn" class="button primary">📷 Start Kamera-Skanning</button>
            </div>

            <!-- Upload QR Image -->
            <div id="uploadQRMethod" class="alternative-method">
                <p style="color: var(--text-dark); font-weight: 600;">🖼️ Last opp bilde</p>
                <p style="color: var(--text-light); font-size: 14px;">Last opp et bilde av QR-koden</p>
                <label for="qr-file-input" class="button secondary">🖼️ Velg bilde</label>
                <input type="file" id="qr-file-input" accept="image/*" style="display: none;">
            </div>
        </div>
    </div>
</div>
```

**Metode B: Generer med JavaScript**

```javascript
const container = document.getElementById('loginContainer');
container.innerHTML = getLoginComponentHTML();
```

### 4. Initialiser komponenten i JavaScript:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    // Initialize login component
    const loginComponent = initLoginComponent({
        onLoginSuccess: (participant) => {
            console.log('Logged in as:', participant.first_name);
            // Redirect to profile or show content
            window.location.href = '/profile.html';
        },
        onLoginError: (error) => {
            console.error('Login failed:', error);
        }
    });
});
```

---

## Konfigurasjon

### Standard IDer

Komponenten bruker disse standard IDene:

| Element | ID | Beskrivelse |
|---------|---|-------------|
| Primær login input | `participantCodeInput` | Mobil primær input |
| Primær login knapp | `codeLoginBtn` | Mobil primær knapp |
| Alternativ login input | `participantCodeInputAlt` | Desktop alternativ input |
| Alternativ login knapp | `codeLoginBtnAlt` | Desktop alternativ knapp |
| Status div | `codeStatus` | Statusmeldinger |
| Toggle knapp | `toggleAlternativeLogin` | Åpne/lukke alternativer |
| Alternativer container | `alternativeLoginContent` | Container for alternativer |

### Tilpass IDer (for flere login-seksjoner på samme side)

Hvis du har flere innloggingsseksjoner på samme side (f.eks. tic-tac-toe med 2 spillere):

```javascript
// Player 1 login
const player1Login = initLoginComponent({
    primaryInputId: 'player1CodeInput',
    primaryButtonId: 'player1CodeLoginBtn',
    altInputId: 'player1CodeInputAlt',
    altButtonId: 'player1CodeLoginBtnAlt',
    statusId: 'player1CodeStatus',
    onLoginSuccess: (participant) => {
        console.log('Player 1:', participant);
    }
});

// Player 2 login
const player2Login = initLoginComponent({
    primaryInputId: 'player2CodeInput',
    primaryButtonId: 'player2CodeLoginBtn',
    altInputId: 'player2CodeInputAlt',
    altButtonId: 'player2CodeLoginBtnAlt',
    statusId: 'player2CodeStatus',
    onLoginSuccess: (participant) => {
        console.log('Player 2:', participant);
    }
});
```

Husk å bruke `prefix` i HTML-generering:

```javascript
const player1HTML = getLoginComponentHTML({ prefix: 'player1' });
const player2HTML = getLoginComponentHTML({ prefix: 'player2' });
```

---

## API

### `initLoginComponent(options)`

Initialiserer innloggingskomponenten med event listeners.

**Options:**
```javascript
{
    onLoginSuccess: Function,  // Callback når innlogging lykkes
    onLoginError: Function,    // Callback når innlogging feiler
    primaryInputId: string,    // ID for primær input (default: 'participantCodeInput')
    primaryButtonId: string,   // ID for primær knapp (default: 'codeLoginBtn')
    altInputId: string,        // ID for alternativ input (default: 'participantCodeInputAlt')
    altButtonId: string,       // ID for alternativ knapp (default: 'codeLoginBtnAlt')
    statusId: string,          // ID for status div (default: 'codeStatus')
    scanStatusId: string       // ID for scan status div (default: 'scan-status')
}
```

**Returns:**
```javascript
{
    expandAlternatives: Function,   // Ekspander alternative metoder
    collapseAlternatives: Function, // Kollaps alternative metoder
    config: Object                  // Konfigurasjonsobjekt
}
```

### `getLoginComponentHTML(options)`

Generer HTML-markup for komponenten.

**Options:**
```javascript
{
    prefix: string  // ID-prefix for unike IDer (default: '')
}
```

**Returns:** `string` - HTML markup

---

## Eksempler

### Grunnleggende bruk (welcome.html, quiz.html, etc.)

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="/css/common.css">
    <link rel="stylesheet" href="/css/login-component.css">
</head>
<body>
    <div id="loginContainer">
        <!-- Insert login component HTML here -->
    </div>

    <script src="/js/participant-auth.js"></script>
    <script src="/js/login-component.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            initLoginComponent({
                onLoginSuccess: (participant) => {
                    sessionStorage.setItem('participantCode', participant.participant_code);
                    window.location.href = '/profile.html';
                }
            });
        });
    </script>
</body>
</html>
```

### Aktivitetsside med egen callback

```javascript
initLoginComponent({
    onLoginSuccess: (participant) => {
        // Start activity
        startQuiz(participant);
    },
    onLoginError: (error) => {
        alert('Kunne ikke logge inn: ' + error.message);
    }
});
```

### Flere login-seksjoner (tic-tac-toe)

```html
<div id="player1Login"></div>
<div id="player2Login"></div>

<script>
    document.getElementById('player1Login').innerHTML = getLoginComponentHTML({ prefix: 'player1' });
    document.getElementById('player2Login').innerHTML = getLoginComponentHTML({ prefix: 'player2' });

    initLoginComponent({
        primaryInputId: 'player1-participantCodeInput',
        altInputId: 'player1-participantCodeInputAlt',
        // ... other player1 IDs
        onLoginSuccess: (p) => setPlayer1(p)
    });

    initLoginComponent({
        primaryInputId: 'player2-participantCodeInput',
        altInputId: 'player2-participantCodeInputAlt',
        // ... other player2 IDs
        onLoginSuccess: (p) => setPlayer2(p)
    });
</script>
```

---

## Responsive oppførsel

### Desktop (≥769px)
- **Primær:** Strekkodeleser (automatisk QR-skanning)
- **Alternativer:**
  - Login-ord (manuell)
  - Kamera-skanning
  - Bilde-opplasting

### Mobil (<768px)
- **Primær:** Login-ord (stor input)
- **Alternativer:**
  - Strekkodeleser (ekstern)
  - Bilde-opplasting

---

## Styling

Komponenten bruker CSS-variabler fra `common.css`:

```css
--primary-color
--primary-dark
--text-dark
--text-light
--primary-green
```

Tilpass ved å overskrive i din egen CSS:

```css
.toggle-alternative-btn {
    background: linear-gradient(135deg, #yourcolor1, #yourcolor2);
}
```

---

## Feilsøking

### Komponenten vises ikke
- Sjekk at `login-component.css` er inkludert
- Sjekk at HTML-elementene har riktige IDer

### Toggle fungerer ikke
- Sjekk at `login-component.js` er lastet
- Sjekk at `initLoginComponent()` er kalt etter DOM er lastet

### Alternativ login fungerer ikke
- Sjekk at `participant-auth.js` er lastet **før** `login-component.js`
- Sjekk at callbacks er definert korrekt

### Responsive design fungerer ikke
- Sjekk at viewport meta tag er satt: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- Sjekk at media queries ikke er overskrevet

---

## Support

For spørsmål eller problemer, se:
- `/js/login-component.js` - Source code med kommentarer
- `/css/login-component.css` - Styling
- Denne README-filen

---

**Versjon:** 1.0
**Sist oppdatert:** 2026-03-29
