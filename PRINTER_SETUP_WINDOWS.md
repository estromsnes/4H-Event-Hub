# 🖨️ Kvitteringsskriver Oppsett for Windows

Denne guiden beskriver hvordan du setter opp en ESC/POS-kompatibel kvitteringsskriver på Windows med 4H Event Hub.

## 📋 Innholdsfortegnelse

1. [Forutsetninger](#forutsetninger)
2. [Python Installasjon](#python-installasjon)
3. [Python Biblioteker](#python-biblioteker)
4. [Printer Konfigurasjon](#printer-konfigurasjon)
5. [Test Scripts](#test-scripts)
6. [Backend Integrasjon](#backend-integrasjon)
7. [Testing](#testing)
8. [Feilsøking](#feilsøking)

---

## Forutsetninger

### Hardware
- ESC/POS-kompatibel kvitteringsskriver
- USB- eller nettverkstilkobling
- Skriveren må være installert i Windows som en printer

### Software
- Windows 10 eller nyere
- 4H Event Hub applikasjon
- Python 3.8+ (installeres i neste steg)

---

## Python Installasjon

### 1. Last ned Python

Gå til [python.org/downloads](https://www.python.org/downloads/) og last ned **Python 3.12** eller nyere.

**VIKTIG:** Under installasjonen, huk av for:
- ✅ **"Add Python to PATH"** (øverst i installer-vinduet)
- ✅ **"Install pip"** (standard valgt)

### 2. Verifiser installasjon

Åpne **Command Prompt** (cmd) eller **PowerShell** og kjør:

```cmd
python --version
```

Du skal se noe som: `Python 3.12.x`

Sjekk også pip:

```cmd
pip --version
```

### 3. Opprett Virtual Environment (valgfritt, men anbefalt)

```cmd
# Naviger til prosjekt-mappen
cd "C:\Users\esstr\OneDrive - EG A S\Privat\4H\4H Arrangement\4h-event-hub"

# Opprett virtual environment
python -m venv printer_env

# Aktiver det
printer_env\Scripts\activate

# Du skal nå se (printer_env) foran kommandolinjen
```

**Merk:** Husk å aktivere virtual environment hver gang du skal bruke printer-scriptene.

---

## Python Biblioteker

### 1. Installer nødvendige pakker

Med virtual environment aktivert (eller globalt hvis du ikke bruker venv):

```cmd
# Installer python-escpos for kvitteringsskriver
pip install python-escpos

# Installer pywin32 for Windows printer-tilgang
pip install pywin32

# Installer pyusb (optional, for USB direkte-tilgang)
pip install pyusb
```

### 2. Verifiser installasjon

```cmd
pip list | findstr "escpos pywin32"
```

Du skal se:
```
python-escpos      x.x.x
pywin32            xxx
```

---

## Printer Konfigurasjon

### 1. Finn skrivernavnet

Det er **veldig viktig** å bruke det eksakte navnet Windows bruker for skriveren.

**Metode 1: Via Command Prompt**
```cmd
wmic printer get name
```

**Metode 2: Via PowerShell**
```powershell
Get-Printer | Select-Object Name
```

**Metode 3: Via GUI**
1. Åpne **Innstillinger** → **Enheter** → **Skrivere og skannere**
2. Eller søk etter "Enheter og skrivere" i Start-menyen
3. Noter deg det eksakte navnet (f.eks. "POS-58", "EPSON TM-T20", etc.)

### 2. Oppdater scriptene med ditt skrivernavn

Åpne følgende filer i en teksteditor og endre `PRINTER_NAME`:

**utils/print_receipt_win.py:**
```python
PRINTER_NAME = "POS-58"  # ENDRE TIL DITT SKRIVERNAVN!
```

**utils/print_participant_win.py:**
```python
PRINTER_NAME = "POS-58"  # ENDRE TIL DITT SKRIVERNAVN!
```

**utils/test_printer_win.py:**
```python
PRINTER_NAME = "POS-58"  # ENDRE TIL DITT SKRIVERNAVN!
```

**utils/test_codepages_win.py:**
```python
PRINTER_NAME = "POS-58"  # ENDRE TIL DITT SKRIVERNAVN!
```

---

## Test Scripts

### 1. Test at Python og biblioteker fungerer

```cmd
# Aktiver virtual environment først (hvis du bruker det)
printer_env\Scripts\activate

# Kjør test-scriptet som lister skrivere og tester utskrift
python utils\test_printer_win.py
```

Dette scriptet vil:
1. Liste alle tilgjengelige Windows-skrivere
2. La deg velge en skriver å teste
3. Skrive ut en test-kvittering med norske tegn og QR-kode

### 2. Test code pages for norske tegn

Hvis norske tegn (æøå) ikke vises riktig, kjør:

```cmd
python utils\test_codepages_win.py
```

Dette printer "æøå ÆØÅ" med 21 forskjellige code pages (CP 00 til CP 20).

Se på kvitteringen og finn hvilken code page som viser tegnene riktig. Oppdater deretter i scriptene:

```python
p._raw(b'\x1b\x74\x02')  # Endre \x02 til riktig code page nummer
```

For de fleste skrivere er **CP 2 (PC850)** riktig.

### 3. Test enkel utskrift

```cmd
echo Hei fra 4H Event Hub! | python utils\print_receipt_win.py
```

### 4. Test deltaker-utskrift

```cmd
echo {"event_name":"4H Leir 2026","first_name":"Test","last_name":"Person","club":"Eina 4H","role":"Deltaker","team":"Lag Rød","participant_code":"TEST001"} | python utils\print_participant_win.py
```

---

## Backend Integrasjon

Nå må vi oppdatere backend-koden til å støtte både Windows og Linux.

### Oppdater routes/admin.js

Finn print-test endepunktet og oppdater det:

```javascript
// POST /api/admin/print-test - Test printer
router.post('/print-test', async (req, res) => {
    const db = req.app.locals.db;
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text er påkrevd' });
    }

    const isWindows = os.platform() === 'win32';
    const isLinux = os.platform() === 'linux';

    if (!isWindows && !isLinux) {
        return res.status(400).json({ error: 'Printer støttes kun på Windows og Linux' });
    }

    // Get event name
    db.get('SELECT event_name FROM event_info WHERE active = 1 LIMIT 1', [], (err, event) => {
        const eventName = event && event.event_name ? event.event_name : '4H Event Hub';

        try {
            let command;

            if (isLinux) {
                // Linux command
                const printerScript = '/home/kasse/print_receipt.py';
                const pythonPath = '/home/kasse/printer_env/bin/python3';
                const printContent = `${eventName}\n${'='.repeat(32)}\n\n${text}`;
                command = `echo "${printContent.replace(/"/g, '\\"')}" | sudo ${pythonPath} ${printerScript}`;

            } else {
                // Windows command
                const printerScript = path.join(__dirname, '..', 'utils', 'print_receipt_win.py');
                const pythonPath = process.env.VIRTUAL_ENV
                    ? path.join(process.env.VIRTUAL_ENV, 'Scripts', 'python.exe')
                    : 'python';

                const printContent = `${eventName}\n${'='.repeat(32)}\n\n${text}`;
                // Use PowerShell for better stdin handling on Windows
                command = `echo "${printContent.replace(/"/g, '`"')}" | ${pythonPath} "${printerScript}"`;
            }

            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error('Print error:', error);
                    return res.status(500).json({
                        error: 'Utskrift feilet',
                        details: error.message
                    });
                }

                console.log('✅ Print successful:', text);
                res.json({
                    message: 'Utskrift vellykket',
                    printed: text
                });
            });

        } catch (err) {
            console.error('❌ Error printing:', err);
            res.status(500).json({ error: 'Kunne ikke skrive ut' });
        }
    });
});
```

### Oppdater routes/participants.js

Finn deltaker print-endepunktet og legg til Windows-støtte:

```javascript
// POST /api/participants/:code/print - Print participant info
router.post('/:code/print', (req, res) => {
    const db = req.app.locals.db;
    const { code } = req.params;

    const isWindows = os.platform() === 'win32';
    const isLinux = os.platform() === 'linux';

    if (!isWindows && !isLinux) {
        return res.status(400).json({ error: 'Printer støttes kun på Windows og Linux' });
    }

    // ... existing code to fetch event, participant, and courses ...

    // Execute print command
    let command;

    if (isLinux) {
        // Linux command (existing)
        const pythonPath = '/home/kasse/printer_env/bin/python3';
        const printerScript = '/home/kasse/print_participant.py';
        const jsonData = JSON.stringify(printData);
        command = `echo '${jsonData.replace(/'/g, "'\\''")}' | sudo ${pythonPath} ${printerScript}`;

    } else {
        // Windows command
        const printerScript = path.join(__dirname, '..', 'utils', 'print_participant_win.py');
        const pythonPath = process.env.VIRTUAL_ENV
            ? path.join(process.env.VIRTUAL_ENV, 'Scripts', 'python.exe')
            : 'python';

        const jsonData = JSON.stringify(printData);
        // Escape quotes for Windows command line
        const escapedJson = jsonData.replace(/"/g, '\\"');
        command = `echo "${escapedJson}" | ${pythonPath} "${printerScript}"`;
    }

    exec(command, (error, stdout, stderr) => {
        // ... rest is same ...
    });
});
```

---

## Testing

### 1. Start serveren

```cmd
# I prosjekt-mappen
npm start
```

### 2. Test via Admin Panel

1. Åpne nettleseren og gå til admin-panelet
2. Gå til **🖨️ Skriver** tab
3. Skriv inn test-tekst med norske tegn: "Test æøå"
4. Klikk **Test Utskrift**
5. Sjekk at kvitteringen kommer ut og at æøå vises riktig

### 3. Test deltaker-utskrift

1. Gå til **👥 Deltakere** tab
2. Finn en deltaker i listen
3. Klikk på **🖨️**-knappen
4. Bekreft utskrift
5. Sjekk kvitteringen:
   - Arrangement-navn
   - Deltaker-info
   - Kurs (hvis påmeldt)
   - QR-kode
   - Norske tegn vises korrekt

---

## Feilsøking

### Problem: "python" ikke funnet

**Løsning:**
- Reinstaller Python og huk av for "Add Python to PATH"
- Eller bruk full sti: `C:\Python312\python.exe`

### Problem: "No module named 'escpos'" eller "No module named 'win32print'"

**Løsning:**
```cmd
pip install python-escpos pywin32
```

Hvis du bruker virtual environment, sørg for at det er aktivert først:
```cmd
printer_env\Scripts\activate
```

### Problem: "Printer not found" eller "Access denied"

**Løsning:**
1. Sjekk at PRINTER_NAME er **eksakt** som i Windows (case-sensitive!)
2. Sjekk at skriveren er påslått og tilkoblet
3. Prøv å skrive ut en test-side fra Windows for å bekrefte at skriveren fungerer:
   - Innstillinger → Skrivere → Høyreklikk på skriver → "Print test page"

### Problem: Norske tegn vises feil

**Løsning:**
Kjør code page test:
```cmd
python utils\test_codepages_win.py
```

Finn riktig CP-nummer og oppdater i scriptene.

### Problem: QR-kode vises ikke

**Løsning:**
Ikke alle skrivere/drivere støtter QR-koder via python-escpos på Windows. Alternativer:
1. Prøv en annen driver for skriveren
2. Bruk USB direct-tilgang i stedet for Windows printer (krever mer konfigurasjon)
3. Utelat QR-koden og vis kun tekst

### Problem: "Access is denied" ved utskrift

**Løsning:**
- Kjør Command Prompt som Administrator
- Eller gi din bruker skrivetilgang til skriveren i Windows

### Problem: Virtual environment virker ikke

**Løsning:**
Hvis du får "cannot be loaded because running scripts is disabled":

**PowerShell:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Eller bruk Command Prompt (cmd) i stedet for PowerShell**

---

## 🎯 Oppsummering

Etter å ha fulgt denne guiden har du:

✅ Installert Python på Windows
✅ Installert python-escpos og pywin32
✅ Konfigurert skrivernavnet i print-scriptene
✅ Testet utskrift med norske tegn og QR-kode
✅ Oppdatert backend for å støtte både Windows og Linux
✅ Testet hele oppsettet

**Hva skriver kvitteringen ut:**
- Arrangement-navn (fra database)
- Deltaker-informasjon (navn, klubb, rolle, lag)
- Påmeldte kurs med instruktør og sted
- QR-kode av deltaker-kode (hvis støttet)
- Velkommen-melding
- Støtte for norske tegn (æøå ÆØÅ)

Skriveren er nå klar til å brukes i 4H Event Hub på Windows! 🎉

---

## 📚 Ressurser

- [Python.org - Downloads](https://www.python.org/downloads/)
- [python-escpos dokumentasjon](https://python-escpos.readthedocs.io/)
- [ESC/POS Command Set](http://www.starmicronics.com/support/Mannualfolder/escpos_cm_en.pdf)
- [pywin32 GitHub](https://github.com/mhammond/pywin32)

---

*Dokumentasjon opprettet: 2026-02-25*
*Versjon: 1.0*
