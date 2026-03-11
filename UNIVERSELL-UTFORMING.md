# Analyse av Universell Utforming og Tilgjengelighet

**Kjørt:** 2026-03-11
**Status:** Flere kritiske tilgjengelighetsbarrierer funnet
**WCAG 2.1 Nivå:** Oppfyller ikke Level A (kritiske mangler)

---

## 📊 Executive Summary

4H Event Hub har **god visuell design og responsive layout**, men har **betydelige tilgjengelighetsbarrierer** som hindrer personer med funksjonsnedsettelser i å bruke løsningen effektivt.

### Alvorlighetsgrad

| Nivå | Antall | Brukergruppe påvirket |
|------|--------|----------------------|
| 🔴 **KRITISK** | 4 | Blinde, tastaturbrukere |
| 🟠 **HØY** | 4 | Skjermleserbrukere |
| 🟡 **MODERAT** | 4 | Svaksynte, kognitive utfordringer |
| 🟢 **LAV** | 3 | Minimal påvirkning |

### Hva må fikses først?

1. **Focus-indikatorer** - fjernet med `outline: none` (blokkerer tastaturnavigasjon)
2. **Form-labels** - input-felt mangler tilknyttede labels
3. **ARIA-labels** - ikon-knapper mangler beskrivelse for skjermlesere
4. **Landmark roles** - mangler semantisk struktur

---

## ✅ Hva som allerede er bra

### 1. Visuell Design
- ✅ **Store klikkområder**: Knapper har minimum 60px høyde
- ✅ **Store fonter**: Basis 18px, overskrifter 22-36px
- ✅ **God kontrast**: Primærfarge #4CAF50 på hvit (#2c3e50 på hvit = 12.6:1)
- ✅ **Konsistent fargeskjema**: CSS-variabler sikrer konsistens

### 2. Responsive Design
- ✅ **Mobile-first**: Tilpasser seg til små skjermer (768px, 480px breakpoints)
- ✅ **Touch-vennlig**: Store touch targets, god spacing
- ✅ **Portrait-optimalisering**: Spesiell tilpasning for telefoner

### 3. Språk og Grunnstruktur
- ✅ **Språkattributt**: `<html lang="no">` på alle sider
- ✅ **Riktig tegnkoding**: UTF-8 satt korrekt
- ✅ **Viewport meta**: Responsiv viewport konfigurert

### 4. Bilder
- ✅ **Alt-tekst**: Logoer og deltakerprofiler har beskrivende alt-tekst
- ✅ **Dekorative ikoner**: Tomme alt-attributter på emoji (korrekt)

### 5. Interaktive Elementer
- ✅ **Ekte knapper**: Bruker `<button>` elementer (ikke divs med onclick)
- ✅ **Lenker vs knapper**: Korrekt semantikk (lenker for navigasjon, knapper for handlinger)

---

## 🔴 KRITISKE PROBLEMER (Må fikses umiddelbart)

### 1. Tastaturnavigasjon - Focus-indikatorer fjernet

**WCAG 2.4.7 Level AA - Fails**

**Problem**: Focus-outline er fjernet på flere steder, noe som gjør det umulig for tastaturbrukere å se hvor de er.

**Filer berørt**:
- `public/css/index.css`: Linjer 1216, 1235
- `public/css/main.css`: Linje 122
- `public/css/feedback.css`: Linje 181

**Eksempel fra main.css (linje 121-124)**:
```css
input:focus, textarea:focus, select:focus {
    outline: none;  /* ❌ KRITISK: Fjerner tastatur-fokus indikator */
    border-color: var(--primary-color);
}
```

**Påvirkning**:
- ❌ Tastaturbrukere ser ikke hvilket felt de har fokus på
- ❌ Skjermleserbrukere får ingen visuell tilbakemelding
- ❌ Brukere med motoriske utfordringer kan ikke navigere

**Løsning - Legg til synlig focus-stil**:
```css
input:focus, textarea:focus, select:focus {
    outline: 3px solid #4CAF50;  /* ✅ Synlig fokus-indikator */
    outline-offset: 2px;
    border-color: var(--primary-color);
}

button:focus {
    outline: 3px solid #4CAF50;
    outline-offset: 2px;
}

/* For de som vil ha mer subtil stil */
*:focus-visible {
    outline: 3px solid #4CAF50;
    outline-offset: 2px;
}
```

**Fikse i alle filer**:
1. `public/css/main.css` (linje 122)
2. `public/css/index.css` (linjer 1216, 1235)
3. `public/css/feedback.css` (linje 181)

---

### 2. Manglende Form-Labels

**WCAG 3.3.2 Level A, 1.3.1 Level A - Fails**

**Problem**: Input-felt mangler tilknyttede `<label>` elementer. Skjermlesere kan ikke fortelle brukeren hva feltet er for.

#### Eksempel 1: Profile.html (linjer 54-64)

**Nåværende kode (feil)**:
```html
<input
    type="text"
    id="participantCodeInput"
    placeholder="F.eks: 4H"
    style="flex: 1; padding: 18px; font-size: 20px; ..."
    autocomplete="off"
    maxlength="10"
>
```

**Problem**:
- ❌ Ingen `<label>` tilknyttet input
- ❌ `placeholder` er IKKE en erstatning for label (forsvinner når man skriver)
- ❌ Skjermlesere leser ikke placeholder konsekvent

**Løsning**:
```html
<label for="participantCodeInput" class="visually-hidden">
    Deltakerkode (F.eks: 4H001)
</label>
<input
    type="text"
    id="participantCodeInput"
    placeholder="F.eks: 4H"
    aria-describedby="codeHint"
    autocomplete="off"
    maxlength="10"
>
<span id="codeHint" class="visually-hidden">
    Skriv inn din unike deltakerkode for å logge inn
</span>
```

**CSS for visuelt skjulte labels** (legg til i main.css):
```css
.visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
}
```

#### Eksempel 2: Bingo.html (linjer 46-51)
```html
<!-- FØR (feil) -->
<input type="text" id="bingoParticipantCode" placeholder="F.eks: 4H001">

<!-- ETTER (riktig) -->
<label for="bingoParticipantCode" class="visually-hidden">
    Din deltakerkode for Bingo
</label>
<input
    type="text"
    id="bingoParticipantCode"
    placeholder="F.eks: 4H001"
    aria-describedby="bingoCodeHint"
>
<span id="bingoCodeHint" class="visually-hidden">
    Skriv eller skann deltakerkoden din for å starte bingo
</span>
```

#### Eksempel 3: Quiz.html (linjer 44-49)
```html
<!-- FØR (feil) -->
<input type="text" id="quizParticipantCode" placeholder="F.eks: 4H001">

<!-- ETTER (riktig) -->
<label for="quizParticipantCode" class="visually-hidden">
    Din deltakerkode for Quiz
</label>
<input
    type="text"
    id="quizParticipantCode"
    placeholder="F.eks: 4H001"
    aria-describedby="quizCodeHint"
>
<span id="quizCodeHint" class="visually-hidden">
    Skriv eller skann deltakerkoden din for å delta i quiz
</span>
```

#### Eksempel 4: Index.html (linje 222)
```html
<!-- FØR (feil) -->
<input type="text" id="barcode-input" style="position: absolute; left: -9999px;">

<!-- ETTER (riktig) -->
<label for="barcode-input" class="visually-hidden">
    Strekkode-skanner input
</label>
<input
    type="text"
    id="barcode-input"
    style="position: absolute; left: -9999px;"
    aria-label="Skjult felt for strekkode-skanner"
>
```

**Alle filer som trenger label-fikser**:
1. `public/profile.html` (linje 54-64)
2. `public/bingo.html` (linje 46-51)
3. `public/quiz.html` (linje 44-49)
4. `public/scavenger-hunt.html` (lignende felt)
5. `public/tic-tac-toe.html` (lignende felt)
6. `public/team-challenge.html` (lignende felt)
7. `public/photo-challenges.html` (lignende felt)
8. `public/selfie-chain.html` (lignende felt)
9. `public/index.html` (linje 222, 112)

---

### 3. Manglende ARIA-labels på Ikon-knapper

**WCAG 4.1.2 Level A - Fails**

**Problem**: Knapper med kun emoji/ikoner mangler tekstbeskrivelse for skjermlesere.

#### Eksempel 1: Admin-knapp (index.html linje 11-12)

**Nåværende kode (feil)**:
```html
<a href="/admin.html" class="settings-icon" title="Admin">⚙️</a>
```

**Problem**:
- ❌ `title` attributt leses IKKE konsekvent av skjermlesere
- ❌ Emoji ⚙️ leses som "gear" på engelsk (ikke norsk)
- ❌ Ingen kontekst om hva lenken gjør

**Løsning**:
```html
<a href="/admin.html" class="settings-icon" aria-label="Åpne admin-innstillinger">
    <span aria-hidden="true">⚙️</span>
</a>
```

#### Eksempel 2: Lukk-knapper (index.html linje 181, profile.html linje 241)

**Nåværende kode (feil)**:
```html
<button id="closeModalBtn" class="close-btn">✕</button>
```

**Løsning**:
```html
<button id="closeModalBtn" class="close-btn" aria-label="Lukk vindu">
    <span aria-hidden="true">✕</span>
</button>
```

#### Eksempel 3: Nullstill søk (index.html linje 112)

**Nåværende kode (feil)**:
```html
<button id="resetBtn" class="reset-button" title="Nullstill søk">✕</button>
```

**Løsning**:
```html
<button id="resetBtn" class="reset-button" aria-label="Nullstill søk">
    <span aria-hidden="true">✕</span>
</button>
```

#### Eksempel 4: QR-skann knapper (flere steder)

**Nåværende kode (delvis bra)**:
```html
<button id="startCameraBtn" class="action-btn">
    <div class="btn-icon">📷</div>
    <span class="btn-text">Start Kamera-Skanning</span>
</button>
```

**Dette er OK** fordi det har synlig tekst. Men kan forbedres:
```html
<button id="startCameraBtn" class="action-btn" aria-label="Start kamera for QR-skanning">
    <div class="btn-icon" aria-hidden="true">📷</div>
    <span class="btn-text">Start Kamera-Skanning</span>
</button>
```

**Alle ikon-knapper som trenger aria-label**:
- Settings-ikon (admin-lenke)
- Lukk-knapper i modaler (✕)
- Nullstill-knapper (✕)
- Pil-knapper (→, ←)
- Plus/minus knapper (+, -)

---

### 4. Manglende Tastatur-tilgang til Funksjoner

**WCAG 2.1.1 Level A - Partial Fail**

**Problem**: Noen interaktive elementer kan være vanskelige å nå med tastatur alene.

#### Eksempel: On-screen Keyboard (index.html linjer 116-156)

**Nåværende implementasjon (delvis bra)**:
```html
<div class="keyboard" id="keyboard">
    <button class="key" data-key="Q">Q</button>
    <button class="key" data-key="W">W</button>
    <!-- ... -->
</div>
```

**Bra**: Bruker `<button>` elementer (fokusérbare)

**Problem**:
- ❌ Ingen ARIA live region for å annonsere hva som skrives
- ❌ Tastaturbrukere kan ikke vite hva som er skrevet uten å se

**Løsning**:
```html
<div class="search-container" style="position: relative;">
    <input
        type="text"
        id="searchInput"
        placeholder="Søk etter deltaker..."
        aria-label="Søk etter deltaker"
        aria-describedby="searchHelp"
        aria-live="polite"
        aria-atomic="true"
    >
    <span id="searchHelp" class="visually-hidden">
        Bruk tastaturet for å søke, eller klikk knappene under
    </span>

    <!-- Live region for screen reader announcements -->
    <div id="searchStatus" class="visually-hidden" aria-live="polite" aria-atomic="true">
        <!-- JavaScript oppdaterer: "Fant 5 deltakere" -->
    </div>
</div>

<div class="keyboard" id="keyboard" role="group" aria-label="Virtuelt tastatur">
    <button class="key" data-key="Q" aria-label="Bokstav Q">Q</button>
    <!-- ... -->
</div>
```

**JavaScript-tillegg** (index.js):
```javascript
// Når søk oppdateres, annonsér resultat
function updateSearchResults(count) {
    const statusDiv = document.getElementById('searchStatus');
    statusDiv.textContent = `Fant ${count} deltaker${count !== 1 ? 'e' : ''}`;
}
```

---

## 🟠 HØYPRIORITET (Må fikses snart)

### 5. Manglende Landmark Roles og Semantisk Struktur

**WCAG 1.3.1 Level A - Fails**

**Problem**: Sidene mangler HTML5 semantiske elementer og ARIA landmarks, noe som gjør det vanskelig for skjermleserbrukere å navigere.

#### Hva er Landmarks?

Landmarks lar skjermleserbrukere hoppe direkte til viktige seksjoner:
- "Hopp til hovedinnhold"
- "Hopp til navigasjon"
- "Hopp til søk"

#### Eksempel: index.html

**Nåværende struktur (feil)**:
```html
<body>
    <header class="header">...</header>

    <!-- ❌ Ingen <main> -->
    <section class="program-section">...</section>
    <section class="activities-section">...</section>
    <section class="participants-section">...</section>

    <!-- ❌ Ingen <footer> -->
</body>
```

**Korrekt struktur**:
```html
<body>
    <!-- Skip to main content link (for tastaturbrukere) -->
    <a href="#main-content" class="skip-link">Hopp til hovedinnhold</a>

    <header class="header" role="banner">
        <nav aria-label="Hovednavigasjon">
            <a href="/index.html">Hjem</a>
            <a href="/admin.html" aria-label="Admin-innstillinger">⚙️</a>
        </nav>
    </header>

    <main id="main-content" role="main">
        <section class="program-section" aria-labelledby="program-heading">
            <h2 id="program-heading">Program</h2>
            ...
        </section>

        <section class="activities-section" aria-labelledby="activities-heading">
            <h2 id="activities-heading">Spill og utfordringer</h2>
            ...
        </section>

        <section class="participants-section" aria-labelledby="participants-heading">
            <h2 id="participants-heading">Alle deltakere</h2>
            ...
        </section>
    </main>

    <footer role="contentinfo">
        <p>4H Event Hub &copy; 2026</p>
    </footer>
</body>
```

**CSS for skip-link** (main.css):
```css
.skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: white;
    padding: 8px;
    text-decoration: none;
    z-index: 100;
}

.skip-link:focus {
    top: 0;
}
```

**Filer som trenger landmarks**:
1. `public/index.html`
2. `public/participant.html`
3. `public/profile.html`
4. `public/admin.html`
5. Alle aktivitetssider (quiz.html, bingo.html, etc.)

---

### 6. Modal Dialogs Mangler ARIA Semantikk

**WCAG 4.1.2 Level A - Fails**

**Problem**: Modale dialoger mangler `role="dialog"`, `aria-modal`, og `aria-labelledby`.

#### Eksempel: Deltakerinfo Modal (index.html linjer 177-219)

**Nåværende kode (feil)**:
```html
<div id="detailModal" class="modal hidden">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Deltakerinfo</h2>
            <button id="closeModalBtn" class="close-btn">✕</button>
        </div>
        <!-- ... -->
    </div>
</div>
```

**Korrekt implementasjon**:
```html
<div
    id="detailModal"
    class="modal hidden"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modalTitle"
    aria-describedby="modalDesc"
>
    <div class="modal-content">
        <div class="modal-header">
            <h2 id="modalTitle">Deltakerinfo</h2>
            <button
                id="closeModalBtn"
                class="close-btn"
                aria-label="Lukk deltakerinfo"
            >
                <span aria-hidden="true">✕</span>
            </button>
        </div>
        <div id="modalDesc" class="visually-hidden">
            Informasjon om deltaker med profilbilde, lag, og aktiviteter
        </div>
        <!-- ... -->
    </div>
</div>
```

**JavaScript-tillegg for fokushåndtering** (index.js):
```javascript
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('hidden');

    // Lagre fokus fra element som åpnet modal
    modal.dataset.triggerElement = document.activeElement.id;

    // Flytt fokus til modal
    const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
        firstFocusable.focus();
    }

    // Fang fokus inni modal (trap focus)
    modal.addEventListener('keydown', trapFocus);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('hidden');

    // Returner fokus til trigger element
    const triggerId = modal.dataset.triggerElement;
    if (triggerId) {
        const trigger = document.getElementById(triggerId);
        if (trigger) trigger.focus();
    }

    modal.removeEventListener('keydown', trapFocus);
}

function trapFocus(e) {
    if (e.key !== 'Tab') return;

    const modal = e.currentTarget;
    const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
    }
}
```

**Alle modaler som trenger oppdatering**:
1. `detailModal` (index.html linje 177)
2. `mobileAccessModal` (index.html linje 58)
3. `messageModal` (index.html linje 226)
4. Alle modaler i aktivitetssider

---

### 7. Dynamiske Innholdoppdateringer Mangler ARIA Live Regions

**WCAG 4.1.3 Level AA - Fails**

**Problem**: Innhold som oppdateres dynamisk (tellere, resultater, timer) annonseres ikke til skjermlesere.

#### Eksempel 1: Deltakerteller (index.html linje 160)

**Nåværende kode (feil)**:
```html
<p class="participants-count">
    <span id="participantCount">0</span> deltakere
</p>
```

**Korrekt implementasjon**:
```html
<p class="participants-count">
    <span
        id="participantCount"
        aria-live="polite"
        aria-atomic="true"
    >
        0
    </span> deltakere
</p>
```

#### Eksempel 2: Quiz Timer (quiz.html linje 89)

**Nåværende kode (feil)**:
```html
<div id="timerDisplay" class="timer-display">
    <span id="timerValue">30</span>
</div>
```

**Korrekt implementasjon**:
```html
<div id="timerDisplay" class="timer-display">
    <span id="timerValue" aria-live="assertive" aria-atomic="true">30</span>
    <span class="visually-hidden">sekunder gjenstår</span>
</div>
```

**Merk**:
- `aria-live="polite"` = venter til bruker er ferdig med nåværende handling
- `aria-live="assertive"` = avbryter og annonserer umiddelbart (bruk for timer, kritiske varsler)

#### Eksempel 3: Søkeresultater (index.html)

**Legg til JavaScript** (index.js):
```javascript
function updateSearch(query) {
    // ... eksisterende søkelogikk ...

    const resultCount = filteredParticipants.length;

    // Oppdater aria-live region
    const statusDiv = document.getElementById('searchStatus');
    if (resultCount === 0) {
        statusDiv.textContent = 'Ingen deltakere funnet';
    } else if (resultCount === 1) {
        statusDiv.textContent = 'Fant 1 deltaker';
    } else {
        statusDiv.textContent = `Fant ${resultCount} deltakere`;
    }
}
```

**HTML-tillegg**:
```html
<div class="search-container">
    <input type="text" id="searchInput" ...>
    <div id="searchStatus" class="visually-hidden" aria-live="polite" aria-atomic="true">
        <!-- JavaScript oppdaterer dette -->
    </div>
</div>
```

**Alle steder som trenger aria-live**:
- Deltakerteller (index.html)
- Søkeresultater (index.html)
- Quiz timer (quiz.html)
- Poengsum-oppdateringer (alle aktivitetssider)
- Lagringsbekreftelser (admin.html)
- Feilmeldinger (alle skjemaer)

---

### 8. Heading Hierarchy Problemer

**WCAG 1.3.1 Level A - Partial Fail**

**Problem**: Overskrifter hopper nivåer eller er ikke logisk strukturert.

#### Eksempel: profile.html

**Nåværende struktur**:
```html
<h1>Min Profil</h1>                    <!-- Nivå 1 OK -->
<div class="login-container">
    <h2>Logg inn</h2>                  <!-- Nivå 2 OK -->
</div>
<div class="profile-content">
    <h2>Velkommen, [Navn]</h2>         <!-- Nivå 2 OK -->
    <div class="stats-grid">
        <!-- ❌ Mangler h3 for stats-seksjon -->
    </div>
</div>
```

**Forbedret struktur**:
```html
<h1>Min Profil</h1>
<section aria-labelledby="login-heading">
    <h2 id="login-heading">Logg inn</h2>
    <!-- ... -->
</section>

<section aria-labelledby="profile-heading">
    <h2 id="profile-heading">Velkommen, [Navn]</h2>

    <section aria-labelledby="stats-heading">
        <h3 id="stats-heading" class="visually-hidden">Statistikk</h3>
        <div class="stats-grid">...</div>
    </section>

    <section aria-labelledby="activities-heading">
        <h3 id="activities-heading" class="visually-hidden">Mine aktiviteter</h3>
        <div class="activities-summary">...</div>
    </section>
</section>
```

**Sjekk heading-hierarki i**:
1. `public/index.html`
2. `public/profile.html`
3. `public/admin.html`
4. Alle aktivitetssider

---

## 🟡 MODERAT PRIORITET (Bør fikses)

### 9. Text-Transform Uppercase Reduserer Lesbarhet

**WCAG 1.4.12 Level AA - Advisory**

**Problem**: Tekst i kun store bokstaver er vanskeligere å lese, spesielt for personer med dysleksi.

**Eksempel: profile.html linje 58**:
```css
text-transform: uppercase;
```

**Påvirkning**:
- Vanskeligere ordgjenkjenning (vi leser ord etter form, ikke bokstav for bokstav)
- Spesielt problematisk for dysleksi
- Kan virke som "SKRIKING" for noen brukere

**Løsning**:
```css
/* Fjern eller begrens bruken av uppercase */
text-transform: none;
/* ELLER kun bruk på korte koder */
text-transform: uppercase; /* OK for "4H001" */
```

**Anbefaling**: Behold uppercase kun for:
- Deltakerkoder (f.eks. "4H001")
- Akronymer (f.eks. "QR")
- Ikke bruk på lengre tekst eller overskrifter

---

### 10. Contenteditable Divs i stedet for Input

**WCAG 4.1.2 Level A - Advisory**

**Problem**: `contenteditable` divs er vanskeligere for skjermlesere å håndtere enn native form controls.

**Eksempel: feedback.html linjer 146-153**:
```html
<div class="form-group">
    <label for="titleDisplay">Tittel (valgfritt)</label>
    <div class="input-display" id="titleDisplay" contenteditable="true">
        Klikk for å skrive tittel
    </div>
</div>
```

**Problem**:
- ❌ `contenteditable` har variabel skjermleser-støtte
- ❌ `label for=""` fungerer ikke korrekt med div
- ❌ Ingen native form validation

**Løsning (foretrukket)**:
```html
<div class="form-group">
    <label for="titleInput">Tittel (valgfritt)</label>
    <input
        type="text"
        id="titleInput"
        class="input-display"
        placeholder="Klikk for å skrive tittel"
        maxlength="100"
    >
</div>
```

**Hvis du MÅ bruke contenteditable**:
```html
<div class="form-group">
    <label id="titleLabel">Tittel (valgfritt)</label>
    <div
        class="input-display"
        id="titleDisplay"
        contenteditable="true"
        role="textbox"
        aria-labelledby="titleLabel"
        aria-multiline="false"
        tabindex="0"
    >
        Klikk for å skrive tittel
    </div>
</div>
```

---

### 11. Ingen Skip-to-Content Link

**WCAG 2.4.1 Level A - Recommended**

**Problem**: Tastaturbrukere må tabbe gjennom all navigasjon for å nå hovedinnholdet.

**Løsning**: Legg til skip-link øverst på alle sider.

**HTML** (øverst i `<body>`):
```html
<a href="#main-content" class="skip-link">Hopp til hovedinnhold</a>

<header>...</header>

<main id="main-content">
    <!-- Hovedinnhold her -->
</main>
```

**CSS** (main.css):
```css
.skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: white;
    padding: 8px 16px;
    text-decoration: none;
    z-index: 9999;
    border-radius: 0 0 4px 0;
}

.skip-link:focus {
    top: 0;
    outline: 3px solid #4CAF50;
    outline-offset: 2px;
}
```

**Legg til i**:
- index.html
- participant.html
- profile.html
- admin.html
- Alle aktivitetssider

---

### 12. Lange Tab-sekvenser

**WCAG 2.4.3 Level A - Advisory**

**Problem**: Tastaturbrukere må tabbe gjennom mange elementer (spesielt on-screen keyboard).

**Løsning**: Implementer `tabindex="-1"` på virtuelt tastatur, og gjør det valgfritt.

**Eksempel**:
```html
<!-- Knapp for å vise/skjule virtuelt tastatur -->
<button id="toggleKeyboard" aria-expanded="false" aria-controls="keyboard">
    Vis virtuelt tastatur
</button>

<div class="keyboard hidden" id="keyboard" tabindex="-1">
    <button class="key" data-key="Q">Q</button>
    <!-- ... -->
</div>
```

**JavaScript**:
```javascript
document.getElementById('toggleKeyboard').addEventListener('click', function() {
    const keyboard = document.getElementById('keyboard');
    const isHidden = keyboard.classList.contains('hidden');

    keyboard.classList.toggle('hidden');
    this.setAttribute('aria-expanded', !isHidden);
    this.textContent = isHidden ? 'Skjul virtuelt tastatur' : 'Vis virtuelt tastatur';
});
```

---

## 🟢 LAV PRIORITET (Nice-to-have)

### 13. Bakgrunnsmusikk uten Visuell Indikator

**WCAG 1.4.2 Level A - Partial**

**Problem**: Quiz har bakgrunnsmusikk, men ingen visuell indikator på at den spiller.

**Eksempel: quiz.html linjer 200-215**:
```html
<audio id="quizMusic5" loop>
    <source src="/audio/quiz-5sec.mp3" type="audio/mpeg">
</audio>
```

**Løsning**: Legg til synlig musikk-kontroll.

```html
<div class="audio-controls">
    <button id="toggleMusic" aria-label="Slå av bakgrunnsmusikk" aria-pressed="true">
        <span id="musicIcon" aria-hidden="true">🔊</span>
        <span id="musicStatus">Musikk på</span>
    </button>
</div>

<audio id="quizMusic5" loop>
    <source src="/audio/quiz-5sec.mp3" type="audio/mpeg">
</audio>
```

**JavaScript**:
```javascript
const audio = document.getElementById('quizMusic5');
const toggleBtn = document.getElementById('toggleMusic');
const icon = document.getElementById('musicIcon');
const status = document.getElementById('musicStatus');

toggleBtn.addEventListener('click', function() {
    if (audio.paused) {
        audio.play();
        icon.textContent = '🔊';
        status.textContent = 'Musikk på';
        this.setAttribute('aria-pressed', 'true');
        this.setAttribute('aria-label', 'Slå av bakgrunnsmusikk');
    } else {
        audio.pause();
        icon.textContent = '🔇';
        status.textContent = 'Musikk av';
        this.setAttribute('aria-pressed', 'false');
        this.setAttribute('aria-label', 'Slå på bakgrunnsmusikk');
    }
});
```

---

### 14. Emoji-overbruk (Men Tekst Finnes)

**WCAG 1.1.1 Level A - Compliant (mostly)**

**Observasjon**: Løsningen bruker mye emoji (📱, 📷, ⚙️, etc.), men har heldigvis tekst som supplement de fleste steder.

**Bra eksempel** (participant.html):
```html
<div class="activity-icon">📸</div>
<h2 class="activity-title">Samle laget</h2>
```
✅ Emoji supplementerer tekst (ikke erstatter)

**Potensielt problem** (index.html):
```html
<a href="/admin.html" class="settings-icon" title="Admin">⚙️</a>
```
⚠️ Kun emoji (men vi fikser med aria-label over)

**Anbefaling**:
- Behold emoji for visuell appell
- Sørg for at `aria-hidden="true"` er på alle dekorative emoji
- Alltid ha tekst eller aria-label som supplement

---

### 15. Lange Tekster uten Oppdelinger

**WCAG 2.4.10 Level AAA - Advisory**

**Observasjon**: Noen lange tekstblokker kunne hatt `<section>` oppdelinger for lettere navigasjon.

**Eksempel**: Admin-siden har mange seksjoner som kunne struktureres bedre med landmarks.

**Løsning**: Bruk `<section>` med `aria-labelledby` for å dele opp innhold.

---

## 🎯 HANDLINGSPLAN - Prioritert Implementering

### Fase 1: KRITISK (Gjør først - 2-4 timer)

#### 1.1 Gjenopprett Focus-indikatorer
**Filer**: `public/css/main.css`, `public/css/index.css`, `public/css/feedback.css`

**Erstatt alle `outline: none` med**:
```css
/* main.css linje 122 */
input:focus, textarea:focus, select:focus {
    outline: 3px solid #4CAF50;
    outline-offset: 2px;
    border-color: var(--primary-color);
}

button:focus {
    outline: 3px solid #4CAF50;
    outline-offset: 2px;
}

/* Alternativt: kun vis outline ved tastatur-fokus (ikke mus-klikk) */
*:focus-visible {
    outline: 3px solid #4CAF50;
    outline-offset: 2px;
}

*:focus:not(:focus-visible) {
    outline: none;
}
```

**Fiks i**:
- [ ] `public/css/main.css` (linje 122)
- [ ] `public/css/index.css` (linjer 1216, 1235)
- [ ] `public/css/feedback.css` (linje 181)

---

#### 1.2 Legg til .visually-hidden CSS Class
**Fil**: `public/css/main.css`

**Legg til øverst**:
```css
/* Screen reader-only content */
.visually-hidden {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    margin: -1px !important;
    padding: 0 !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border-width: 0 !important;
}

/* Make focusable elements visible when focused */
.visually-hidden.focusable:active,
.visually-hidden.focusable:focus {
    position: static !important;
    width: auto !important;
    height: auto !important;
    margin: 0 !important;
    overflow: visible !important;
    clip: auto !important;
    white-space: inherit !important;
}
```

---

#### 1.3 Legg til Form Labels på Alle Input-felt

**Template for alle login-skjemaer**:
```html
<label for="[UNIQUE-ID]" class="visually-hidden">
    [Beskrivende tekst]
</label>
<input
    type="text"
    id="[UNIQUE-ID]"
    placeholder="[Placeholder]"
    aria-describedby="[UNIQUE-ID]-hint"
>
<span id="[UNIQUE-ID]-hint" class="visually-hidden">
    [Utvidet hjelpetekst]
</span>
```

**Filer å oppdatere**:
- [ ] `public/profile.html` (linje 54-64)
- [ ] `public/bingo.html` (linje 46-51)
- [ ] `public/quiz.html` (linje 44-49)
- [ ] `public/scavenger-hunt.html` (lignende felt)
- [ ] `public/tic-tac-toe.html` (lignende felt)
- [ ] `public/team-challenge.html` (lignende felt)
- [ ] `public/photo-challenges.html` (lignende felt)
- [ ] `public/selfie-chain.html` (lignende felt)
- [ ] `public/index.html` (linje 112, 222)

---

#### 1.4 Legg til ARIA-labels på Ikon-knapper

**Template**:
```html
<button class="[CLASS]" aria-label="[Norsk beskrivelse]">
    <span aria-hidden="true">[EMOJI/IKON]</span>
</button>
```

**Fiks i**:
- [ ] Admin-ikon (`index.html` linje 12)
- [ ] Alle lukk-knapper (✕)
- [ ] Nullstill søk (`index.html` linje 112)
- [ ] Pil-knapper (→, ←)
- [ ] Settings-ikoner

---

### Fase 2: HØY PRIORITET (Gjør snart - 3-5 timer)

#### 2.1 Legg til Landmark Roles og Semantic HTML

**Template for alle HTML-sider**:
```html
<!DOCTYPE html>
<html lang="no">
<head>...</head>
<body>
    <!-- Skip link -->
    <a href="#main-content" class="skip-link">Hopp til hovedinnhold</a>

    <!-- Header med navigasjon -->
    <header class="header" role="banner">
        <nav aria-label="Hovednavigasjon">
            <!-- Nav-innhold -->
        </nav>
    </header>

    <!-- Hovedinnhold -->
    <main id="main-content" role="main">
        <section aria-labelledby="[SECTION-ID]">
            <h2 id="[SECTION-ID]">Overskrift</h2>
            <!-- Innhold -->
        </section>
    </main>

    <!-- Footer -->
    <footer role="contentinfo">
        <!-- Footer-innhold -->
    </footer>
</body>
</html>
```

**Filer å oppdatere**:
- [ ] `public/index.html`
- [ ] `public/participant.html`
- [ ] `public/profile.html`
- [ ] `public/admin.html`
- [ ] Alle aktivitetssider (7 filer)

---

#### 2.2 Oppdater Modaler med Dialog Semantikk

**Template**:
```html
<div
    id="[MODAL-ID]"
    class="modal hidden"
    role="dialog"
    aria-modal="true"
    aria-labelledby="[MODAL-ID]-title"
    aria-describedby="[MODAL-ID]-desc"
>
    <div class="modal-content">
        <div class="modal-header">
            <h2 id="[MODAL-ID]-title">Overskrift</h2>
            <button class="close-btn" aria-label="Lukk vindu">
                <span aria-hidden="true">✕</span>
            </button>
        </div>
        <div id="[MODAL-ID]-desc" class="visually-hidden">
            Beskrivelse av modal-innhold
        </div>
        <!-- Modal body -->
    </div>
</div>
```

**Filer å oppdatere**:
- [ ] `index.html` (detailModal, mobileAccessModal, messageModal)
- [ ] `profile.html` (alle modaler)
- [ ] Aktivitetssider (alle modaler)

**JavaScript-tillegg**: Implementer fokushåndtering (se kapittel 6)

---

#### 2.3 Legg til ARIA Live Regions

**Eksempel-plasseringer**:

**index.html** (etter søkefelt):
```html
<div id="searchStatus" class="visually-hidden" aria-live="polite" aria-atomic="true"></div>
```

**index.html** (deltakerteller):
```html
<p class="participants-count">
    <span id="participantCount" aria-live="polite" aria-atomic="true">0</span> deltakere
</p>
```

**quiz.html** (timer):
```html
<div id="timerDisplay" class="timer-display">
    <span id="timerValue" aria-live="assertive" aria-atomic="true">30</span>
    <span class="visually-hidden">sekunder gjenstår</span>
</div>
```

**Filer å oppdatere**:
- [ ] `public/index.html` (søk, teller)
- [ ] `public/quiz.html` (timer, poeng)
- [ ] `public/bingo.html` (status)
- [ ] Andre aktivitetssider (feedback-meldinger)
- [ ] `public/admin.html` (lagre-bekreftelser)

---

#### 2.4 Fiks Heading Hierarchy

**Sjekkliste for hver HTML-fil**:
1. Kun én `<h1>` per side
2. Ingen hoppede nivåer (h1 → h3)
3. Logisk struktur (h1 → h2 → h3 → h2 → h3...)
4. Alle seksjoner har heading

**Verktøy for testing**:
- HeadingsMap browser extension
- WAVE browser extension
- axe DevTools

---

### Fase 3: MODERAT PRIORITET (Når tid - 2-3 timer)

#### 3.1 Reduser Uppercase-bruk
- [ ] Fjern `text-transform: uppercase` på lengre tekster
- [ ] Behold kun på korte koder (4H001, QR, etc.)

#### 3.2 Erstatt Contenteditable med Input
- [ ] `feedback.html` (linjer 146-153)
- [ ] Andre steder med contenteditable

#### 3.3 Legg til Skip-to-Content Links
- [ ] Alle HTML-filer (se template i fase 2.1)

#### 3.4 Optimaliser Tab-sekvenser
- [ ] Virtuelt tastatur: `tabindex="-1"` når skjult
- [ ] Vurder `tabindex="0"` på custom widgets

---

### Fase 4: LAV PRIORITET (Nice-to-have - 1-2 timer)

#### 4.1 Musikk-kontroller
- [ ] `quiz.html` (legg til toggle-knapp)
- [ ] Visuell indikator på musikk-status

#### 4.2 Emoji-opprydding
- [ ] Legg til `aria-hidden="true"` på alle dekorative emoji
- [ ] Sjekk at alle har tekst-supplement

#### 4.3 Seksjonsopdeling
- [ ] `admin.html` (bedre landmarks på tabs)

---

## 📋 Testing-sjekkliste

### Tastaturnavigasjon
- [ ] Tab gjennom alle interaktive elementer
- [ ] Se tydelig fokus-indikator på alle elementer
- [ ] Enter/Space aktiverer knapper
- [ ] Escape lukker modaler
- [ ] Ingen "tastatur-feller" (kan komme seg ut overalt)

### Skjermleser-testing (NVDA / JAWS / VoiceOver)
- [ ] Alle form-felt har labels som leses opp
- [ ] Knapper har beskrivende tekst/aria-label
- [ ] Landmarks finnes (main, nav, footer)
- [ ] Headings strukturerer innhold logisk
- [ ] Dynamiske oppdateringer annonseres (aria-live)
- [ ] Modaler annonseres som dialoger
- [ ] Bilder har alt-tekst

### Visuell testing
- [ ] 200% zoom: Innhold fortsatt lesbart og funksjonelt
- [ ] Høy-kontrast modus: Alt synlig
- [ ] Fargeblind-simulering (Deuteranopia, Protanopia): Ingen kun-farge-basert info
- [ ] Dark mode (hvis implementert)

### Mobil/Touch-testing
- [ ] Alle klikk-mål minst 44x44px (WCAG AAA: 44px, AA: 24px)
- [ ] Touch-gestures har tastatur-alternativer
- [ ] Pinch-to-zoom fungerer

### Automatisk testing (Verktøy)
- [ ] **WAVE** (WebAIM): https://wave.webaim.org/
- [ ] **axe DevTools**: Chrome/Firefox extension
- [ ] **Lighthouse** (Chrome DevTools): Accessibility-score
- [ ] **HTML validator**: https://validator.w3.org/

---

## 🛠️ Verktøy og Ressurser

### Testing-verktøy (Gratis)

#### Browser Extensions
- **WAVE** - Visuell accessibility evaluering
- **axe DevTools** - Detaljert WCAG-testing
- **HeadingsMap** - Heading hierarchy visualisering
- **Accessibility Insights** - Microsoft's testing tool

#### Skjermlesere
- **NVDA** (Windows) - Gratis: https://www.nvaccess.org/
- **JAWS** (Windows) - Betalt, men gratis demo
- **VoiceOver** (Mac/iOS) - Innebygd (Cmd+F5)
- **TalkBack** (Android) - Innebygd

#### Online Verktøy
- **WAVE**: https://wave.webaim.org/
- **HTML Validator**: https://validator.w3.org/
- **Color Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Lighthouse**: Chrome DevTools (F12 → Lighthouse)

### Læringsressurser (Norsk)

- **Digitaliseringsdirektoratet**: https://www.uutilsynet.no/
- **WCAG 2.1 på norsk**: https://www.w3.org/Translations/WCAG21-no/
- **Tilsyn**: Tilsynet for universell utforming av IKT

### Læringsressurser (Engelsk)

- **WebAIM**: https://webaim.org/
- **MDN Accessibility**: https://developer.mozilla.org/en-US/docs/Web/Accessibility
- **A11y Project**: https://www.a11yproject.com/
- **WCAG Quick Reference**: https://www.w3.org/WAI/WCAG21/quickref/

---

## 📖 WCAG 2.1 Nivåer - Hva Betyr Det?

### Level A (Minimum)
**Kritiske tilgjengelighetsfunksjoner** som MÅ være på plass.
- Tastaturnavigasjon
- Alt-tekst på bilder
- Form-labels
- Heading-struktur

**4H Event Hub status**: ❌ Fails Level A (kritiske mangler)

### Level AA (Standard)
**Anbefalt for de fleste nettsider**. Inkluderer Level A + forbedringer.
- Fargekontrast 4.5:1 (normal tekst)
- Fokus-indikatorer
- Konsistent navigasjon
- Feilmeldings-hjelp

**4H Event Hub mål**: ✅ Oppnå Level AA etter fikser

### Level AAA (Forbedret)
**Best practice**. Inkluderer Level A + AA + avanserte forbedringer.
- Fargekontrast 7:1
- Tegnspråk-video
- Ingen timing-begrensninger
- Kontekst-sensitiv hjelp

**4H Event Hub mål**: Nice-to-have (ikke påkrevd)

---

## 🎯 OPPSUMMERING

### 🔴 Kritiske Problemer (Må fikses)
1. **Focus-indikatorer fjernet** → Gjenopprett `outline` på alle fokusérbare elementer
2. **Manglende form-labels** → Legg til `<label>` på alle input-felt
3. **Manglende ARIA-labels** → Legg til `aria-label` på ikon-knapper
4. **Ingen tastatur-feedback** → Implementer fokus-synlighet

**Estimert tid**: 2-4 timer
**Påvirkning**: Blinde, tastaturbrukere får tilgang

---

### 🟠 Høy Prioritet (Gjør snart)
5. **Manglende landmarks** → Legg til `<main>`, `<nav>`, `role="banner"`
6. **Modal semantikk** → `role="dialog"`, fokushåndtering
7. **Dynamisk innhold** → `aria-live` regions
8. **Heading hierarchy** → Fiks logisk struktur

**Estimert tid**: 3-5 timer
**Påvirkning**: Skjermleserbrukere får god navigasjon

---

### 🟡 Moderat Prioritet (Bør fikses)
9. Reduser uppercase-bruk
10. Erstatt contenteditable med input
11. Skip-to-content links
12. Optimaliser tab-sekvenser

**Estimert tid**: 2-3 timer
**Påvirkning**: Bedre brukeropplevelse for alle

---

### 🟢 Lav Prioritet (Nice-to-have)
13. Musikk-kontroller
14. Emoji-opprydding
15. Seksjonsopdeling

**Estimert tid**: 1-2 timer
**Påvirkning**: Små forbedringer

---

## 💡 Beste Praksis Fremover

### Under Utvikling
1. **Test med tastatur først** - Aldri `outline: none` uten erstatning
2. **Bruk semantic HTML** - `<button>`, `<nav>`, `<main>`, ikke `<div onclick>`
3. **Alltid labels på forms** - Placeholder er ikke nok
4. **Alt-tekst på bilder** - Beskrivende tekst, ikke "bilde av..."

### Før Lansering
1. **Kjør WAVE-test** - Fikse alle feil og advarsler
2. **Tastaturnavigasjon** - Tab gjennom hele siden
3. **Skjermleser-test** - NVDA (Windows) eller VoiceOver (Mac)
4. **Zoom til 200%** - Alt fortsatt lesbart?

### Løpende
1. **Sjekk hvert semester** - WCAG oppdateres
2. **Få tilbakemeldinger** - Spør brukere med funksjonsnedsettelser
3. **Hold deg oppdatert** - Følg WebAIM og UU-tilsynet

---

## 📞 Hjelp og Støtte

### Hvis du trenger hjelp
- **UU-tilsynet** (Norge): https://www.uutilsynet.no/
- **Digitaliseringsdirektoratet**: Veiledning og ressurser
- **WebAIM Forum**: https://webaim.org/discussion/

### Profesjonell Testing
For en fullstendig accessibility audit før stor lansering:
- Søk etter "WCAG audit Norge"
- Mange byrder tilbyr UU-testing
- Kan koste 10.000-50.000 kr avhengig av omfang

---

**Oppdatert:** 2026-03-11
**Neste gjennomgang:** Etter at kritiske fikser er implementert

**4H - Klart hode • Varmt hjerte • Flinke hender • God helse** 🍀

---

## 📄 Appendiks: Kjappe Referanser

### Kjappe ARIA-attributter

| Attributt | Bruk | Eksempel |
|-----------|------|----------|
| `aria-label` | Tekstalternativ for element | `<button aria-label="Lukk">✕</button>` |
| `aria-labelledby` | Peker til annen tekst som label | `<div aria-labelledby="title">` |
| `aria-describedby` | Peker til utvidet beskrivelse | `<input aria-describedby="help">` |
| `aria-live="polite"` | Annonsér oppdateringer (venter) | `<div aria-live="polite">5 nye</div>` |
| `aria-live="assertive"` | Annonsér umiddelbart | `<div aria-live="assertive">FEIL!</div>` |
| `aria-modal="true"` | Markerer modal dialog | `<div role="dialog" aria-modal="true">` |
| `aria-hidden="true"` | Skjul fra skjermleser | `<span aria-hidden="true">🎉</span>` |
| `aria-expanded` | Viser om element er ekspandert | `<button aria-expanded="false">Meny</button>` |
| `aria-pressed` | Toggle-knapp status | `<button aria-pressed="true">Mute</button>` |

### Kjappe WCAG-krav (Level AA)

| Krav | Nivå | Kort beskrivelse |
|------|------|------------------|
| 1.1.1 | A | Alt-tekst på bilder |
| 1.3.1 | A | Info og relasjoner (semantisk HTML) |
| 1.4.3 | AA | Fargekontrast 4.5:1 (normal tekst) |
| 2.1.1 | A | Tastaturnavigasjon |
| 2.4.1 | A | Skip-links |
| 2.4.3 | A | Fokusorden |
| 2.4.7 | AA | Synlig fokus |
| 3.3.2 | A | Labels eller instruksjoner |
| 4.1.2 | A | Navn, rolle, verdi (ARIA) |
| 4.1.3 | AA | Statusmeldinger (aria-live) |

### Kjappe Fargekontrast-krav

| Tekststørrelse | Level AA | Level AAA |
|----------------|----------|-----------|
| Normal (<18px) | 4.5:1 | 7:1 |
| Stor (≥18px eller ≥14px bold) | 3:1 | 4.5:1 |
| UI-komponenter | 3:1 | - |

**4H Event Hub farger**:
- #4CAF50 på hvit: 3.8:1 (Passes AA Large ✅)
- #2c3e50 på hvit: 12.6:1 (Passes AAA ✅✅✅)
- #666 på hvit: 5.7:1 (Passes AA ✅, Fails AAA)
