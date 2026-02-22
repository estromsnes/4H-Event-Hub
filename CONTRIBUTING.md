# Contributing to 4H Event Hub

Takk for interessen i å bidra til 4H Event Hub! Dette prosjektet er laget for å hjelpe 4H-klubber med å organisere arrangementer, og vi setter pris på alle bidrag.

## 🎯 Hvordan kan jeg bidra?

### Rapportere Bugs
1. Sjekk at buggen ikke allerede er rapportert i [Issues](../../issues)
2. Opprett en ny issue med tydelig beskrivelse:
   - Hva du forventet skulle skje
   - Hva som faktisk skjedde
   - Steg for å reprodusere
   - Skjermbilder (hvis relevant)
   - Node.js og npm versjon

### Foreslå Nye Funksjoner
1. Opprett en issue med tag `enhancement`
2. Beskriv:
   - Hva funksjonen skal gjøre
   - Hvorfor den er nyttig for 4H-klubber
   - Forslag til implementasjon (valgfritt)

### Pull Requests

Vi tar gjerne imot pull requests! Her er prosessen:

1. **Fork repositoryet**
2. **Opprett en branch** fra `main`:
   ```bash
   git checkout -b feature/min-nye-funksjon
   ```
3. **Gjør endringene dine**
4. **Test grundig**
5. **Commit med tydelige meldinger**:
   ```bash
   git commit -m "Legg til: Beskrivelse av endring"
   ```
6. **Push til din fork**:
   ```bash
   git push origin feature/min-nye-funksjon
   ```
7. **Opprett Pull Request** på GitHub

## 📋 Kode-retningslinjer

### JavaScript Stil
- Bruk ES6+ syntax der det er mulig
- Konsistent indenting (2 spaces)
- Klare og beskrivende variabelnavn
- Kommenter kompleks logikk

### Filstruktur
- Backend (Node.js): `/routes`, `/database`
- Frontend: `/public` (HTML, CSS, JavaScript)
- Statiske ressurser: `/public/images`, `/public/css`, `/public/js`

### Database
- Bruk alltid parameteriserte spørringer (SQL injection beskyttelse)
- Soft delete (sett `active = 0`) i stedet for permanent sletting
- Migrasjonsfiler skal følge navnekonvensjonen: `migrate-add-[feature].js`

### Sikkerhet
- **ALDRI** commit database-filer (`data.db`)
- **ALDRI** commit personlige data eller e-postadresser
- Valider all brukerinput
- Bruk Sharp for bildeprosessering (fjerner EXIF automatisk)

## 🧪 Testing

Før du sender inn en pull request:

1. **Test manuelt**:
   ```bash
   npm start
   ```
   - Test alle berørte sider
   - Test på både desktop og mobil
   - Test med forskjellige nettlesere (Chrome, Firefox, Safari)

2. **Sjekk for feil**:
   - Ingen console errors i browser
   - Serveren starter uten feil
   - Database-operasjoner fungerer

3. **Test edge cases**:
   - Tom database
   - Mange deltakere (100+)
   - Store bilder
   - Lange navn og tekstfelt

## 📝 Commit Meldinger

Bruk tydelige commit-meldinger:

- `Legg til: [beskrivelse]` - Ny funksjonalitet
- `Fiks: [beskrivelse]` - Bug-fix
- `Oppdater: [beskrivelse]` - Endring av eksisterende funksjonalitet
- `Refaktorer: [beskrivelse]` - Kode-forbedring uten funksjonell endring
- `Dokumentasjon: [beskrivelse]` - Endring i dokumentasjon
- `Stil: [beskrivelse]` - CSS/formatering

Eksempel:
```
Legg til: Støtte for flere bilder per lagutfordring

- Endre database schema til å støtte flere bilder
- Oppdater frontend for opplasting av flere bilder
- Legg til migrering for eksisterende data
```

## 🌍 Internasjonalisering

For øyeblikket er applikasjonen kun på norsk, men vi ønsker å støtte flere språk i fremtiden. Hvis du bidrar med tekst:
- Bruk klare, enkle formuleringer
- Unngå slang og dialekt
- Tenk på at det kan oversettes senere

## 🐛 Security Issues

**VIKTIG**: Hvis du oppdager en sikkerhetssårbarhet:
- **IKKE** opprett en offentlig issue
- Les [SECURITY.md](SECURITY.md) for hvordan du rapporterer sikkerhetsroblemer

## 📜 Lisens

Ved å bidra til dette prosjektet, godtar du at dine bidrag vil bli lisensiert under samme [MIT License](LICENSE) som prosjektet.

## 💬 Spørsmål?

Har du spørsmål om hvordan du kan bidra?
- Opprett en issue med tag `question`
- Sjekk eksisterende issues for lignende spørsmål

## 🙏 Takk

Takk for at du vurderer å bidra til 4H Event Hub! Sammen kan vi gjøre dette til et enda bedre verktøy for 4H-klubber over hele Norge.

---

**4H - Klart hode • Varmt hjerte • Flinke hender • God helse** 🍀
