# Kom i gang på 15 minutter! 🚀

**En super-enkel guide for deg som aldri har kodet før.**

Dette er et ferdig system for 4H-arrangement. Du trenger ikke å kunne programmering - bare følg stegene under!

---

## Del 1: Forberedelser (5 minutter)

### Steg 1: Last ned programmet 📥

1. **Åpne denne nettsiden**: https://github.com/[din-bruker]/4h-event-hub
2. **Klikk den GRØNNE knappen** som sier "Code"
3. **Klikk "Download ZIP"**
4. **Finn filen i Nedlastinger** og **høyreklikk → Pakk ut alt**
5. **Flytt mappen** til Skrivebordet (så du finner den lett)

### Steg 2: Installer Node.js 🔧

**Hva er Node.js?** Programmet som får arrangementssystemet til å kjøre.

1. **Åpne**: https://nodejs.org/
2. **Last ned** den GRØNNE knappen (LTS-versjon)
3. **Dobbeltklikk** på nedlastet fil
4. **Klikk "Next"** hele veien (standardinnstillinger er fine)
5. **Vent** til installasjonen er ferdig
6. **Start datamaskinen** på nytt (viktig!)

---

## Del 2: Start systemet (5 minutter)

### Steg 3: Åpne mappen i terminalen 💻

**Windows:**
1. **Åpne mappen** du pakket ut (fra Steg 1)
2. **Klikk i adressefeltet** øverst (der det står "Skrivebordet > 4h-event-hub")
3. **Skriv** `cmd` og **trykk Enter**
4. Et svart vindu åpnes - dette er terminalen!

**Mac:**
1. **Åpne mappen** du pakket ut
2. **Høyreklikk på mappen**
3. **Velg "Services" → "New Terminal at Folder"**

### Steg 4: Installer programmet 📦

**I det svarte vinduet (terminalen), skriv:**

```
npm install
```

**Trykk Enter** og **vent** (kan ta 1-3 minutter). Du vil se mye tekst - det er normalt!

✅ **Ferdig når det står noe slikt:**
```
added 150 packages in 2m
```

### Steg 5: Sett opp databasen 🗄️

**I terminalen, skriv:**

```
npm run init-db
```

✅ **Ferdig når det står:** `Database initialized successfully!`

### Steg 6: Start serveren 🎯

**I terminalen, skriv:**

```
npm start
```

✅ **Serveren kjører når det står:**
```
Server running on port 3000
✅ Database connected
```

**VIKTIG:** Ikke lukk det svarte vinduet! La det stå åpent.

---

## Del 3: Åpne arrangementssystemet (1 minutt)

### Steg 7: Åpne i nettleseren 🌐

1. **Åpne Google Chrome** (eller Edge/Firefox)
2. **Skriv inn** i adressefeltet:
   ```
   localhost:3000
   ```
3. **Trykk Enter**

🎉 **Gratulerer! Du er inne!**

---

## Del 4: Last inn testdata (2 minutter)

**For å teste systemet med dummy-deltakere:**

1. **Klikk på "Admin"** øverst til høyre (tannhjul-ikonet ⚙️)
2. **Skriv inn PIN-kode** (står i det svarte terminalen vinduet, f.eks. `1234`)
3. **Klikk på "Database"** fanen
4. **Klikk "Last inn testdata"**
5. **Vent** 5-10 sekunder

✅ **Nå har du:**
- 100 testdeltakere
- 15 lag
- 5 quiz-spørsmål
- 5 skattejakt-sjekkpunkter
- Og mye mer!

---

## Del 5: Prøv systemet! (2 minutter)

### Test deltakerprofil:

1. **Gå til hovedsiden**: Klikk på logoen øverst til venstre
2. **Klikk "Min Profil"**
3. **Klikk "Start Kamera-Skanning"** (eller skriv inn en testkode)
4. **Test koden:** `4H001` (fra testdataene)

Du skal nå se en testdeltakers profil!

### Test quiz:

1. **Gå tilbake til hovedsiden**
2. **Klikk "Quiz"**
3. **Skann deltaker-QR** (eller bruk `4H001`)
4. **Svar på spørsmålene**

---

## Neste steg 📚

### Legg til dine egne deltakere:

1. **Gå til Admin** (⚙️)
2. **Klikk "Deltakere"**
3. **Klikk "Legg til Deltaker"**
4. **Fyll ut informasjon**
5. **Klikk "Legg til"**

### Slå på/av aktiviteter:

1. **Gå til Admin**
2. **Velg en aktivitet** (f.eks. "Quiz")
3. **Finn "Konfigurasjon"** seksjonen
4. **Huk av/av "Aktivert"** checkboxen
5. **Klikk "Lagre konfigurasjon"**

Inaktive aktiviteter vises ikke for deltakere!

### Print QR-koder:

1. **Gå til Admin → Deltakere**
2. **Klikk "Print QR-koder"**
3. **Velg print** (Ctrl+P / Cmd+P)
4. **Skriv ut på klistremerker eller papir**

---

## Vanlige problemer og løsninger 🔧

### "npm: command not found" eller "npm er ikke gjenkjent"
**Løsning:** Start datamaskinen på nytt etter å ha installert Node.js.

### "Port 3000 is already in use"
**Løsning:**
- Lukk det svarte vinduet
- Åpne det på nytt (Steg 3)
- Kjør `npm start` igjen

### "Cannot find module..."
**Løsning:**
- Skriv `npm install` i terminalen
- Vent til den er ferdig
- Prøv `npm start` igjen

### Kameraet fungerer ikke
**Løsning:**
- Bruk Chrome eller Edge (best støtte)
- Klikk "Tillat" når nettleseren spør om kamera-tilgang
- Lukk andre programmer som bruker kameraet (Zoom, Teams, etc.)

### Ingenting skjer når jeg skriver i terminalen
**Løsning:**
- Sjekk at du er i riktig mappe (se Steg 3)
- Prøv å høyreklikke i terminalen og velg "Paste" i stedet for Ctrl+V

---

## Stoppe serveren 🛑

**For å stoppe serveren:**
1. **Klikk i det svarte vinduet** (terminalen)
2. **Trykk** `Ctrl + C` (Windows) eller `Cmd + C` (Mac)
3. **Skriv** `Y` hvis den spør
4. **Lukk vinduet**

**For å starte igjen:**
- Følg Steg 3 og 6 igjen

---

## Hjelp og Support 🆘

**Trenger du mer hjelp?**

- **Detaljert guide:** Les `README.md` i mappen
- **Tekniske problemer:** Se "Feilsøking" i README.md
- **Spørsmål:** Opprett en issue på GitHub
- **4H-støtte:** Kontakt din lokale 4H-klubb

---

## Hva kan systemet gjøre? 🎯

### For deltakere:
- ✅ Skanne QR-koder og se profiler
- ✅ Ta selfies
- ✅ Spille quiz som lag
- ✅ Delta i QR Skattejakt
- ✅ Spille Tripp-Trapp-Tresko
- ✅ Delta i Selfie-kjedet
- ✅ Sosial Bingo
- ✅ Samle laget og ta lagbilde
- ✅ Bildeoppgaver
- ✅ Se program
- ✅ Se alle deltakere
- ✅ Sende tilbakemeldinger

### For arrangører (Admin):
- ✅ Administrere deltakere og lag
- ✅ Opprette og redigere aktiviteter
- ✅ Slå aktiviteter på/av
- ✅ Se live resultater
- ✅ Print QR-koder
- ✅ Se statistikk og tilbakemeldinger

---

## Tips for arrangementsdagen 💡

### Før arrangementet:
1. **Test systemet** med testdata (Del 4)
2. **Legg til dine deltakere** i Admin
3. **Print QR-koder** og laminér dem
4. **Slå på/av** de aktivitetene dere skal bruke
5. **Opprett program** i Admin → Program

### På arrangementsdagen:
1. **Start serveren** (Steg 3-6)
2. **Åpne systemet** på skjerm/projektor
3. **La deltakere skanne** sine QR-koder
4. **Overvåk aktiviteter** i Admin-panelet

### Etter arrangementet:
1. **Stopp serveren** (Ctrl+C)
2. **Ta backup** av `database/data.db` filen
3. **Se statistikk** i Admin

---

**4H - Klart hode • Varmt hjerte • Flinke hender • God helse** 🍀

**God fornøyelse med arrangementet!** 🎉
