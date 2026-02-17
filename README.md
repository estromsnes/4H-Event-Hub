# 4H Event Hub - Skautrollet 4H

En Node.js webapplikasjon for å skape sosialt samhold på 4H-leirer og arrangement. Applikasjonen lar deltakere skanne sine QR-koder og ta selfies som lagres på deres profil.

## Funksjoner

### Profilside
- **Skann QR-kode** med to metoder:
  - Strekkodeskanner (keyboard-emulering) - anbefalt for arrangementer
  - Webkamera - for testing og backup
- Vis deltakerprofil (navn, alder, hjemsted)
- Ta selfie med webkamera
- Lagre selfie på profil
- Automatisk fokus på keyboard-input for rask scanning

### Admin Panel
- Legg til nye deltakere
- Auto-generer unike deltakerkoder (SK-2026-001, osv.)
- Generer QR-koder automatisk
- Print QR-koder for fysiske kort
- Liste over alle deltakere
- Slett deltakere

## Teknisk Stack

- **Backend**: Node.js + Express
- **Database**: SQLite (fil-basert)
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **QR-generering**: qrcode npm pakke
- **QR-scanning**: html5-qrcode library
- **Bildeprosessering**: Sharp
- **Kamera**: Native browser MediaDevices API

## Installasjon

### Forutsetninger
- Node.js (v14 eller nyere)
- npm (kommer med Node.js)

### Steg 1: Installer dependencies
```bash
cd 4h-event-hub
npm install
```

### Steg 2: Initialiser database
```bash
npm run init-db
```

Dette oppretter SQLite databasen og nødvendige tabeller.

### Steg 3: Start serveren
```bash
npm start
```

Serveren starter på http://localhost:3000

## Bruksanvisning

### For Arrangører (Admin)

1. **Åpne Admin Panel**: http://localhost:3000/admin.html

2. **Legg til deltakere**:
   - Fyll inn fornavn, etternavn, alder og hjemsted
   - Deltakerkode genereres automatisk (SK-YYYY-NNN)
   - Klikk "Legg til Deltaker"
   - QR-kode genereres automatisk

3. **Print QR-koder**:
   - Klikk "Print QR-koder" i deltakerlisten
   - Velg print i nettleseren
   - Print på kartong eller klistrelapper
   - Klipp ut og lim på fysiske kort

4. **Generere QR-koder for eksisterende deltakere**:
   - Klikk "Generer alle QR" for å generere QR-koder for alle
   - Eller klikk "Generer QR" på enkeltdeltakere

### For Deltakere (Profilside)

1. **Åpne Profilside**: http://localhost:3000/profile.html

2. **Skann QR-kode** (to metoder):

   **Metode 1: Strekkodeskanner (anbefalt for arrangementer)**
   - Skjermen viser "Strekkodeskanner klar"
   - Hold QR-koden foran strekkodeskanneren
   - Skanneren leser koden automatisk (fungerer som tastatur)
   - Profilen vises automatisk

   **Metode 2: Webkamera (for testing)**
   - Klikk "Start Kamera-Skanning"
   - Gi kamera-tillatelse når nettleseren ber om det
   - Hold QR-koden på kortet ditt foran kameraet
   - Profilen din vises automatisk

3. **Ta Selfie**:
   - Klikk "Ta Selfie" når profilen er åpen
   - Gi kamera-tillatelse hvis nødvendig
   - Poser for kameraet
   - Klikk "Ta Bilde"
   - Klikk "Lagre Selfie" eller "Ta På Nytt"

4. **Skann ny kode**:
   - Klikk "Skann Ny Kode" for å la noen andre bruke enheten

## Prosjektstruktur

```
4h-event-hub/
├── package.json              # npm konfigurasjon
├── server.js                 # Express server
├── database/
│   ├── init.js              # Database initialisering
│   ├── schema.sql           # Database schema
│   └── data.db              # SQLite database (genereres)
├── routes/
│   ├── participants.js      # Deltaker API
│   └── qr.js                # QR-kode API
├── public/
│   ├── index.html           # Hjemmeside
│   ├── profile.html         # Profilside
│   ├── admin.html           # Admin panel
│   ├── css/
│   │   ├── main.css         # Global styling
│   │   └── profile.css      # Profilside styling
│   └── js/
│       ├── scanner.js       # QR-scanning logikk
│       ├── camera.js        # Kamera-håndtering
│       ├── profile.js       # Profilside logikk
│       └── admin.js         # Admin panel logikk
├── uploads/
│   ├── profile-photos/      # Deltaker selfies
│   └── qr-codes/            # Genererte QR-koder
└── utils/
    └── qr-generator.js      # QR-generering utility
```

## API Endepunkter

### Deltakere
- `GET /api/participants` - Hent alle deltakere
- `GET /api/participants/:code` - Hent spesifikk deltaker
- `POST /api/participants` - Opprett ny deltaker
- `PUT /api/participants/:code` - Oppdater deltaker
- `DELETE /api/participants/:code` - Slett deltaker
- `POST /api/participants/:code/photo` - Last opp selfie

### QR-koder
- `GET /api/qr/:code` - Hent/generer QR-kode
- `POST /api/qr/generate-batch` - Generer QR for alle deltakere

## Deployment for Leir/Arrangement

### På Linux PC med Touchskjerm

1. **Installer Node.js**:
```bash
sudo apt update
sudo apt install nodejs npm
```

2. **Klon/kopier prosjektet** til Linux PC

3. **Installer og initialiser**:
```bash
cd 4h-event-hub
npm install --registry=https://registry.npmjs.org/
npm run init-db
```

4. **Installer PM2** (for auto-restart):
```bash
sudo npm install -g pm2
pm2 start server.js --name "4h-event-hub"
pm2 save
pm2 startup
```

5. **Konfigurer nettleser** til å starte i fullscreen:
   - Legg til i autostart
   - Åpne http://localhost:3000/profile.html
   - F11 for fullscreen

6. **Deaktiver skjermsparring**:
```bash
xset s off
xset -dpms
```

## Feilsøking

### Strekkodeskanner virker ikke
- Sjekk at strekkodeskanneren er tilkoblet via USB
- Sjekk at skjermen har fokus (klikk på siden)
- Test skanneren i et tekstfelt (Notepad) for å bekrefte at den fungerer
- Sjekk at skanneren er konfigurert til å sende Enter etter scanning
- Verifiser at QR-kodene er i riktig format (SK-YYYY-NNN)

### Kamera virker ikke (for webkamera-scanning)
- Sjekk at nettleseren har tillatelse til kamera
- Prøv i Chrome/Edge (bedre støtte enn Firefox)
- Sjekk at kamera er tilkoblet og fungerer

### QR-koder scannes ikke med webkamera
- Sørg for god belysning
- Hold QR-koden stille foran kameraet
- Sjekk at QR-koden er trykt i god kvalitet
- Prøv med bakoverkamera hvis tilgjengelig

### Database feil
- Slett `database/data.db` og kjør `npm run init-db` på nytt
- Sjekk at du har skrivetillatelse i database-mappen

### npm install feil
- Bruk `--registry=https://registry.npmjs.org/` flagget
- Sjekk internettforbindelse

## Sikkerhet og Personvern

- Alle bilder lagres lokalt på serveren
- Ingen data sendes til eksterne tjenester
- Applikasjonen fungerer helt offline
- EXIF-metadata fjernes fra bilder
- Deltakere kan slettes (soft delete)

## Fremtidig Utvidelse

Arkitekturen støtter enkel tilføying av:
- Aktivitets-tracking (sjekk inn på stasjoner)
- Poeng/achievements system
- Team/lag-konkurranser
- Kompliment-vegg
- Bingo/scavenger hunt
- "Finn din match" basert på interesser

## Support

For spørsmål eller problemer, kontakt klubbrådgiver eller opprett en issue i prosjektet.

## Lisens

MIT License - Dette er et klubbprosjekt for Skautrollet 4H

---

**4H - Klart hode • Varmt hjerte • Flinke hender • God helse**
