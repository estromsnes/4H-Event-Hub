# 🖨️ Kvitteringsskriver Oppsett for 4H Event Hub

Denne guiden beskriver hvordan du setter opp en FEC/SNBC kvitteringsskriver med 4H Event Hub på Linux Mint.

## 📋 Innholdsfortegnelse

1. [Hardware](#hardware)
2. [Linux Oppsett](#linux-oppsett)
3. [Python Miljø](#python-miljø)
4. [Print Scripts](#print-scripts)
5. [Sudo Konfigurasjon](#sudo-konfigurasjon)
6. [Backend Integrasjon](#backend-integrasjon)
7. [Frontend Integrasjon](#frontend-integrasjon)
8. [Testing](#testing)
9. [Feilsøking](#feilsøking)

---

## Hardware

### Skriver Informasjon
- **Merke:** FEC (rebrand av SNBC)
- **Produsent:** SNBC CO., Ltd. (Shanghai New Beiyang Corporation)
- **USB ID:** 154f:154f
- **Type:** Termisk kvitteringsskriver
- **Protokoll:** ESC/POS kompatibel
- **Tilkobling:** USB

### USB Endpoints
- **OUT endpoint:** 0x02 (for sending data til skriver)
- **IN endpoint:** 0x82 (for mottak av data fra skriver)
- **Interface class:** ff (vendor-specific)

---

## Linux Oppsett

### 1. Identifiser Skriveren

Sjekk at skriveren er tilkoblet:
```bash
lsusb | grep 154f
```

Output skal vise:
```
Bus 001 Device 006: ID 154f:154f SNBC CO., Ltd
```

### 2. Last inn USB Printer Driver

```bash
# Sjekk om usblp modulen er lastet
lsmod | grep usblp

# Hvis ikke, last den inn
sudo modprobe usblp

# Gjør det permanent
echo "usblp" | sudo tee -a /etc/modules
```

### 3. Opprett udev-regel

Lag en udev-regel for å gi tillatelser og opprette /dev/lp0:

```bash
sudo nano /etc/udev/rules.d/99-snbc-printer.rules
```

Legg inn:
```
SUBSYSTEM=="usb", ATTRS{idVendor}=="154f", ATTRS{idProduct}=="154f", MODE="0666", GROUP="lp", SYMLINK+="lp0"
```

Aktiver reglene:
```bash
sudo udevadm control --reload-rules
sudo udevadm trigger
```

Sjekk at /dev/lp0 finnes:
```bash
ls -la /dev/lp0
```

### 4. Legg til bruker i lp-gruppen

```bash
sudo usermod -a -G lp,lpadmin $USER
```

**Viktig:** Logg ut og inn igjen for at gruppe-endringene skal tre i kraft.

### 5. Installer CUPS (valgfritt)

Hvis du vil bruke CUPS:
```bash
sudo apt update
sudo apt install cups cups-client printer-driver-escpos
```

---

## Python Miljø

### 1. Installer Python og pip

```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv
```

### 2. Opprett Virtual Environment

```bash
# Lag virtual environment
python3 -m venv ~/printer_env

# Aktiver det
source ~/printer_env/bin/activate
```

### 3. Installer Python-biblioteker

```bash
# Installer python-escpos for kvitteringsskriver
pip install python-escpos

# Installer pyusb for USB-kommunikasjon
pip install pyusb
```

### 4. Verifiser installasjon

```bash
pip list | grep -E "escpos|pyusb"
```

Du skal se:
```
python-escpos      x.x.x
pyusb              x.x.x
```

---

## Print Scripts

### Script 1: print_receipt.py (Enkel tekst)

Lag `/home/kasse/print_receipt.py`:

```python
#!/usr/bin/env python3
import sys
from escpos.printer import Usb

# Koble til skriver
p = Usb(0x154f, 0x154f, out_ep=0x02, in_ep=0x82, profile="default")

# Sett tegnkoding for norske tegn (æøå)
# Code page 2 = PC850 (Multilingual)
try:
    p._raw(b'\x1b\x74\x02')  # ESC t 2 - Velg code page 2 (PC850)
except:
    pass

# Les tekst fra stdin
text = sys.stdin.read()

# Skriv ut
p.text(text)
p.text("\n\n\n")
p.cut()
```

Gjør den kjørbar:
```bash
chmod +x ~/print_receipt.py
```

### Script 2: print_participant.py (Deltaker-profil)

Lag `/home/kasse/print_participant.py`:

```python
#!/usr/bin/env python3
import sys
import json
from escpos.printer import Usb

def print_participant(data):
    """Print participant info to thermal receipt printer"""
    # Connect to printer
    p = Usb(0x154f, 0x154f, out_ep=0x02, in_ep=0x82, profile="default")

    # Sett tegnkoding for norske tegn (æøå)
    # Code page 2 = PC850 (Multilingual)
    try:
        p._raw(b'\x1b\x74\x02')  # ESC t 2 - Velg code page 2 (PC850)
    except:
        pass

    # Print header with event name
    event_name = data.get('event_name', '4H Event Hub')
    p.set(align='center', bold=True, width=2, height=2)
    p.text(f"{event_name}\n")
    p.set(align='center', bold=False)
    p.text("=" * 32 + "\n\n")

    # Print participant info
    p.set(align='left', bold=True)
    p.text(f"{data.get('first_name', '')} {data.get('last_name', '')}\n")
    p.set(bold=False)

    if 'club' in data:
        p.text(f"Klubb: {data['club']}\n")
    if 'role' in data:
        p.text(f"Rolle: {data['role']}\n")
    if 'team' in data and data['team']:
        p.text(f"Lag: {data['team']}\n")

    # Print courses if any
    if 'courses' in data and data['courses'] and len(data['courses']) > 0:
        p.text("\n")
        p.set(align='left', bold=True)
        p.text("Kurs:\n")
        p.set(bold=False)
        for course in data['courses']:
            p.text(f"  - {course['name']}\n")
            if course.get('instructor'):
                p.text(f"    Instruktør: {course['instructor']}\n")
            if course.get('location'):
                p.text(f"    Sted: {course['location']}\n")

    # Print QR code of participant code
    if 'participant_code' in data:
        p.text("\n")
        p.set(align='center')
        try:
            p.qr(data['participant_code'], size=6)
            p.text("\n")
        except Exception as e:
            print(f"QR code error: {e}", file=sys.stderr)

    # Footer
    p.text("\n")
    p.set(align='center')
    p.text("-" * 32 + "\n")
    p.text("Velkommen!\n")
    p.text("\n\n\n")

    # Cut paper
    p.cut()

if __name__ == '__main__':
    # Read JSON data from stdin
    try:
        data = json.load(sys.stdin)
        print_participant(data)
        print("Success", file=sys.stderr)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
```

**Funksjoner:**
- Skriver ut arrangement-navn som header
- Viser deltaker-informasjon (navn, klubb, rolle, lag)
- Lister opp påmeldte kurs med instruktør og sted
- Printer QR-kode av deltaker-kode for enkel re-skanning
- Støtter norske tegn (æøå) via PC850 code page

Gjør den kjørbar:
```bash
chmod +x ~/print_participant.py
```

---

## Sudo Konfigurasjon

For å la web-applikasjonen skrive ut uten å spørre om passord, må vi konfigurere sudo.

### Åpne sudoers-filen

```bash
sudo visudo
```

### Legg til disse linjene på slutten

```
# Allow printing without password
kasse ALL=(ALL) NOPASSWD: /home/kasse/printer_env/bin/python3 /home/kasse/print_receipt.py
kasse ALL=(ALL) NOPASSWD: /home/kasse/printer_env/bin/python3 /home/kasse/print_participant.py
```

**Viktig:**
- Erstatt `kasse` med ditt brukernavn
- Bruk hele stien til python3 i virtual environment
- Bruk hele stien til print-scriptene

### Test sudo-konfigurasjonen

```bash
# Test enkel utskrift (skal ikke spørre om passord)
echo "Test" | sudo /home/kasse/printer_env/bin/python3 /home/kasse/print_receipt.py

# Test deltaker-utskrift med dummy data
echo '{"first_name":"Test","last_name":"Person","age":25}' | sudo /home/kasse/printer_env/bin/python3 /home/kasse/print_participant.py
```

---

## Backend Integrasjon

### 1. Installer nødvendige Node.js pakker

Pakkene er allerede installert i prosjektet:
- `express` - Web framework
- `child_process` - For å kjøre eksterne kommandoer (innebygd i Node.js)

### 2. Admin Print Endpoint

I `routes/admin.js`:

```javascript
const { exec } = require('child_process');
const os = require('os');

// POST /api/admin/print-test - Test printer (proof of concept)
router.post('/print-test', async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text er påkrevd' });
    }

    // Only run on Linux
    if (os.platform() !== 'linux') {
        return res.status(400).json({ error: 'Printer støttes kun på Linux' });
    }

    try {
        const printerScript = '/home/kasse/print_receipt.py';
        const pythonPath = '/home/kasse/printer_env/bin/python3';
        const command = `echo "${text.replace(/"/g, '\\"')}" | sudo ${pythonPath} ${printerScript}`;

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
```

### 3. Participant Print Endpoint

I `routes/participants.js`:

```javascript
const { exec } = require('child_process');
const os = require('os');

// POST /api/participants/:code/print - Print participant info to receipt printer
router.post('/:code/print', (req, res) => {
    const db = req.app.locals.db;
    const { code } = req.params;

    // Only run on Linux
    if (os.platform() !== 'linux') {
        return res.status(400).json({ error: 'Printer støttes kun på Linux' });
    }

    // Get event name first
    db.get('SELECT event_name FROM event_info WHERE active = 1 LIMIT 1', [], (err, event) => {
        const eventName = event && event.event_name ? event.event_name : '4H Event Hub';

        // Get participant info
        db.get(
            `SELECT participant_code, first_name, last_name, age, club, role, team
             FROM participants
             WHERE participant_code = ? AND active = 1`,
            [code],
            (err, participant) => {
                if (err) {
                    return res.status(500).json({ error: 'Kunne ikke hente deltaker' });
                }
                if (!participant) {
                    return res.status(404).json({ error: 'Deltaker ikke funnet' });
                }

                // Get participant's courses
                db.all(
                    `SELECT c.name, c.instructor, c.location
                     FROM courses c
                     JOIN participant_courses pc ON c.id = pc.course_id
                     WHERE pc.participant_code = ? AND c.active = 1
                     ORDER BY c.name`,
                    [code],
                    (err, courses) => {
                        if (err) {
                            console.error('Error fetching courses:', err);
                            courses = [];
                        }

                        // Prepare data for printing
                        const printData = {
                            event_name: eventName,
                            participant_code: participant.participant_code,
                            first_name: participant.first_name,
                            last_name: participant.last_name,
                            age: participant.age,
                            club: participant.club,
                            role: participant.role,
                            team: participant.team,
                            courses: courses || []
                        };

                        // Execute print command
                        const pythonPath = '/home/kasse/printer_env/bin/python3';
                        const printerScript = '/home/kasse/print_participant.py';
                        const jsonData = JSON.stringify(printData);
                        const command = `echo '${jsonData.replace(/'/g, "'\\''")}' | sudo ${pythonPath} ${printerScript}`;

                        exec(command, (error, stdout, stderr) => {
                            if (error) {
                                console.error('Print error:', error);
                                return res.status(500).json({
                                    error: 'Utskrift feilet',
                                    details: stderr || error.message
                                });
                            }

                            console.log('✅ Printed participant:', participant.first_name, participant.last_name);
                            res.json({
                                message: 'Deltaker skrevet ut',
                                participant: {
                                    name: `${participant.first_name} ${participant.last_name}`,
                                    code: participant.participant_code
                                }
                            });
                        });
                    }
                );
            }
        );
    });
});
```

**Endepunktet:**
- Henter arrangement-navn fra databasen
- Henter deltaker-informasjon
- Henter deltakers påmeldte kurs
- Sender alt til Python-scriptet som JSON
- Krever admin-autentisering (via middleware)

---

## Frontend Integrasjon

**Merk:** Utskriftsfunksjonalitet er kun tilgjengelig i admin-panelet for sikkerhet. Deltakere kan ikke skrive ut sine egne profiler.

### 1. Admin Panel - Test Printer

I `public/admin.html`, legg til en ny tab:

**HTML:**
```html
<!-- Printer Tab Button -->
<button class="tab-button" data-tab="printer">🖨️ Skriver</button>

<!-- Printer Tab Content -->
<div id="printerTab" class="tab-content">
    <div class="section no-print">
        <h2>🖨️ Kvitteringsskriver Test</h2>
        <p style="color: var(--text-light); margin-bottom: 30px;">
            Test kvitteringsskriveren. Dette er et proof-of-concept.
        </p>

        <form id="printerTestForm" onsubmit="testPrint(event)" style="max-width: 600px;">
            <div class="form-group">
                <label for="printText">Tekst å skrive ut</label>
                <textarea id="printText" rows="5" placeholder="Skriv inn tekst..." style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: monospace;">Velkommen til 4H Event Hub!
Test utskrift.

Dato: {{DATE}}
Tid: {{TIME}}</textarea>
            </div>

            <button type="submit" class="button primary" style="width: 100%; padding: 15px; font-size: 18px;">
                🖨️ Test Utskrift
            </button>
        </form>

        <div id="printerStatus" class="hidden" style="margin-top: 30px; padding: 20px; border-radius: 12px; text-align: center; font-size: 18px; font-weight: 600;"></div>
    </div>
</div>
```

**JavaScript:**
```javascript
async function testPrint(event) {
    event.preventDefault();

    const textInput = document.getElementById('printText');
    const statusDiv = document.getElementById('printerStatus');
    const submitBtn = event.target.querySelector('button[type="submit"]');

    let text = textInput.value;

    // Replace placeholders
    const now = new Date();
    text = text.replace('{{DATE}}', now.toLocaleDateString('no-NO'));
    text = text.replace('{{TIME}}', now.toLocaleTimeString('no-NO'));

    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Skriver ut...';

    try {
        const response = await fetch('/api/admin/print-test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAdminToken()}`
            },
            body: JSON.stringify({ text })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Utskrift feilet');
        }

        statusDiv.textContent = '✅ ' + data.message;
        statusDiv.style.color = 'green';
        statusDiv.style.background = '#d4edda';
        statusDiv.classList.remove('hidden');

        setTimeout(() => {
            statusDiv.classList.add('hidden');
        }, 3000);

    } catch (error) {
        console.error('Print error:', error);
        statusDiv.textContent = '❌ Feil: ' + error.message;
        statusDiv.style.color = '#721c24';
        statusDiv.style.background = '#f8d7da';
        statusDiv.classList.remove('hidden');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '🖨️ Test Utskrift';
    }
}
```

### 2. Admin Panel - Print Participant

I `public/js/admin.js`, legg til print-knapp i deltaker-listen:

**I renderParticipants-funksjonen:**
```javascript
// Add print button to participant actions
participantsList.innerHTML = filteredParticipants.map(p => `
    <div class="participant-item">
        <div class="participant-info">
            <h3>${p.first_name} ${p.last_name}</h3>
            <p>${p.age ? p.age + ' år' : ''} • ${p.club || ''} • ${p.role || ''}</p>
        </div>
        <div class="participant-actions">
            <!-- Other buttons... -->
            <button class="button primary btn-small"
                    onclick="printParticipant('${p.participant_code}')"
                    title="Skriv ut profil">🖨️</button>
            <!-- Delete button... -->
        </div>
    </div>
`).join('');
```

**Print-funksjon:**
```javascript
async function printParticipant(participantCode) {
    const participant = participants.find(p => p.participant_code === participantCode);
    if (!participant) return;

    if (!confirm(`Skriv ut profil for ${participant.first_name} ${participant.last_name}?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/participants/${participantCode}/print`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Token': getAdminToken()
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Utskrift feilet');
        }

        alert('✅ ' + data.message);

    } catch (error) {
        console.error('Print error:', error);
        alert('❌ Feil: ' + error.message);
    }
}
```

**Funksjonalitet:**
- 🖨️-knapp vises ved hver deltaker i admin-panelet
- Krever bekreftelse før utskrift
- Bruker admin-autentisering (X-Admin-Token)
- Viser suksess/feilmelding

---

## Testing

### 1. Test Python Scripts Direkte

**Test enkel utskrift:**
```bash
source ~/printer_env/bin/activate
echo "Test utskrift" | python3 ~/print_receipt.py
```

**Test deltaker-utskrift:**
```bash
echo '{"event_name":"4H Leir 2026","first_name":"Ola","last_name":"Nordmann","club":"Eina 4H","role":"Deltaker","team":"Lag Rød","participant_code":"TEST0001"}' | python3 ~/print_participant.py
```

**Test med kurs:**
```bash
echo '{"event_name":"4H Leir 2026","first_name":"Kari","last_name":"Nordmann","club":"Eina 4H","role":"Deltaker","participant_code":"TEST0002","courses":[{"name":"Håndverk","instructor":"Anne Hansen","location":"Rom 101"},{"name":"Foto","instructor":"Per Olsen","location":"Rom 202"}]}' | python3 ~/print_participant.py
```

### 2. Test Backend API

Start serveren:
```bash
cd ~/4h-event-hub
npm start
```

**Test admin endpoint (krever admin token):**
```bash
curl -X POST http://localhost:3000/api/admin/print-test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"text":"Test fra API"}'
```

**Test participant endpoint:**
```bash
curl -X POST http://localhost:3000/api/participants/TEST0001/print \
  -H "Content-Type: application/json"
```

### 3. Test Frontend

1. **Admin Panel - Test Print:**
   - Gå til admin-panelet
   - Klikk på "🖨️ Skriver" tab
   - Skriv inn tekst (norske tegn som æøå fungerer)
   - Klikk "Test Utskrift"

2. **Admin Panel - Print Participant:**
   - Gå til "👥 Deltakere" tab
   - Finn en deltaker i listen
   - Klikk på 🖨️-knappen ved deltakeren
   - Bekreft utskrift
   - Sjekk at kvitteringen inneholder:
     * Arrangement-navn
     * Deltaker-info (navn, klubb, rolle, lag)
     * Kurs (hvis påmeldt)
     * QR-kode
     * Norske tegn vises korrekt

---

## Feilsøking

### Problem: /dev/lp0 finnes ikke

**Løsning:**
```bash
# Sjekk om usblp er lastet
lsmod | grep usblp

# Last inn modulen
sudo modprobe usblp

# Sjekk udev-regler
cat /etc/udev/rules.d/99-snbc-printer.rules

# Aktiver udev-regler på nytt
sudo udevadm control --reload-rules
sudo udevadm trigger

# Koble fra og til skriveren
```

### Problem: "No such device" ved binding

**Løsning:**
Skriveren har vendor-specific interface class (ff), så usblp bindes ikke automatisk. Løsningen er å bruke udev-regelen som lager /dev/lp0 symlink.

### Problem: "Permission denied" ved skriving

**Løsning:**
```bash
# Sjekk tillatelser
ls -la /dev/lp0

# Legg til bruker i lp-gruppen
sudo usermod -a -G lp $USER

# Logg ut og inn igjen
```

### Problem: sudo spør om passord

**Løsning:**
```bash
# Sjekk sudoers-filen
sudo visudo

# Verifiser at disse linjene er lagt til:
kasse ALL=(ALL) NOPASSWD: /home/kasse/printer_env/bin/python3 /home/kasse/print_receipt.py
kasse ALL=(ALL) NOPASSWD: /home/kasse/printer_env/bin/python3 /home/kasse/print_participant.py
```

### Problem: "Invalid endpoint address"

**Løsning:**
Skriveren har spesifikke endpoints. Verifiser at du bruker riktige endpoints i Python-scriptet:
```python
p = Usb(0x154f, 0x154f, out_ep=0x02, in_ep=0x82)
```

### Problem: Norske tegn (æøå) vises feil

**Løsning:**
Skriveren må settes til riktig code page. For de fleste kvitteringsskrivere fungerer PC850 (code page 2):

```python
# Legg til etter printer-tilkobling
p._raw(b'\x1b\x74\x02')  # ESC t 2 - PC850 (Multilingual)
```

Hvis code page 2 ikke fungerer, bruk test-scriptet for å finne riktig code page:
```bash
sudo /home/kasse/printer_env/bin/python3 /home/kasse/test_codepages.py
```

Se på utskriften og finn hvilken code page (CP XX) som viser æøå korrekt, og oppdater scriptet med det nummeret.

### Problem: QR-kode printar ikke

**Løsning:**
Sjekk at python-escpos støtter QR-koder for din skriver-modell. Noen modeller krever spesifikke QR-kommandoer:

```python
# Test manuelt
p.qr("TEST123", size=6)
```

Hvis det ikke fungerer, kan du alternativt printe deltaker-koden som tekst i stedet.

### Problem: Tekst kuttes av på høyre side

**Løsning:**
De fleste kvitteringsskrivere har 32 eller 48 tegn bredde. Juster formateringen i Python-scriptet:
```python
# For 32 tegn bredde
p.text("=" * 32 + "\n")

# For 48 tegn bredde
p.text("=" * 48 + "\n")
```

### Problem: Node.js får timeout

**Løsning:**
Øk timeout i backend:
```javascript
exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
    // ...
});
```

---

## 🎯 Oppsummering

Etter å ha fulgt denne guiden har du:

✅ Satt opp FEC/SNBC kvitteringsskriver på Linux Mint
✅ Konfigurert USB-tilgang med udev-regler
✅ Installert Python-miljø med python-escpos og pyusb
✅ Opprettet print-scripts for enkel tekst og deltaker-profiler
✅ Konfigurert code page 2 (PC850) for norske tegn (æøå)
✅ Lagt til QR-kode printing av deltaker-koder
✅ Integrert kurs-informasjon i utskrifter
✅ Konfigurert sudo for passordløs utskrift
✅ Integrert print-funksjonalitet i backend med arrangement-navn
✅ Lagt til print-knapper i admin-panelet (kun admin-tilgang)
✅ Testet hele oppsettet

**Hva skriver kvitteringen ut:**
- Arrangement-navn (fra database)
- Deltaker-informasjon (navn, klubb, rolle, lag)
- Påmeldte kurs med instruktør og sted
- QR-kode av deltaker-kode (for re-skanning)
- Velkommen-melding
- Støtte for norske tegn (æøå ÆØÅ)

Skriveren er nå klar til å brukes i 4H Event Hub! 🎉

---

## 📚 Ressurser

- [python-escpos dokumentasjon](https://python-escpos.readthedocs.io/)
- [ESC/POS Command Set](http://www.starmicronics.com/support/Mannualfolder/escpos_cm_en.pdf)
- [Linux USB Printing Guide](https://wiki.archlinux.org/title/CUPS)
- [udev Rules Guide](https://wiki.archlinux.org/title/Udev)

---

*Dokumentasjon oppdatert: 2026-02-25*
*Versjon: 2.0 - Fjernet ASCII art, lagt til QR-koder, kurs og norsk tegnstøtte*
