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

# Installer Pillow for bildebehandling
pip install Pillow

# Installer ascii-magic for ASCII art konvertering
pip install ascii-magic
```

### 4. Verifiser installasjon

```bash
pip list | grep -E "escpos|pyusb|Pillow|ascii"
```

Du skal se:
```
ascii-magic        x.x.x
Pillow             x.x.x
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
p = Usb(0x154f, 0x154f, out_ep=0x02, in_ep=0x82)

# Les tekst fra argument eller stdin
if len(sys.argv) > 1:
    text = " ".join(sys.argv[1:])
else:
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

### Script 2: print_participant.py (Med ASCII foto)

Lag `/home/kasse/print_participant.py`:

```python
#!/usr/bin/env python3
import sys
import json
from escpos.printer import Usb
from PIL import Image
import os

def image_to_ascii(image_path, width=32, height=16):
    """Convert image to ASCII art suitable for thermal printer"""
    try:
        # ASCII characters from darkest to lightest
        ascii_chars = ['@', '#', 'S', '%', '?', '*', '+', ';', ':', ',', '.', ' ']

        # Open and convert image
        img = Image.open(image_path)

        # Convert to grayscale
        img = img.convert('L')

        # Resize to fit printer width
        aspect_ratio = img.height / img.width
        new_height = int(width * aspect_ratio * 0.5)  # 0.5 to compensate for character aspect ratio
        if new_height > height:
            new_height = height

        img = img.resize((width, new_height))

        # Convert to ASCII
        ascii_art = []
        for y in range(img.height):
            line = ''
            for x in range(img.width):
                pixel = img.getpixel((x, y))
                # Map pixel value (0-255) to ASCII character
                char_index = int((pixel / 255) * (len(ascii_chars) - 1))
                line += ascii_chars[char_index]
            ascii_art.append(line)

        return '\n'.join(ascii_art)
    except Exception as e:
        print(f"Error converting image: {e}", file=sys.stderr)
        return None

def print_participant(data):
    """Print participant info with ASCII photo"""
    # Connect to printer
    p = Usb(0x154f, 0x154f, out_ep=0x02, in_ep=0x82)

    # Print header
    p.set(align='center', text_type='B', width=2, height=2)
    p.text("4H EVENT HUB\n")
    p.set(align='center', text_type='normal')
    p.text("=" * 32 + "\n")

    # Print ASCII photo if available
    if 'photo_path' in data and data['photo_path'] and os.path.exists(data['photo_path']):
        ascii_art = image_to_ascii(data['photo_path'])
        if ascii_art:
            p.set(align='center')
            p.text(ascii_art + "\n")
            p.text("-" * 32 + "\n")

    # Print participant info
    p.set(align='left', text_type='B')
    p.text(f"{data.get('first_name', '')} {data.get('last_name', '')}\n")
    p.set(text_type='normal')

    if 'age' in data:
        p.text(f"Alder: {data['age']} ar\n")
    if 'club' in data:
        p.text(f"Klubb: {data['club']}\n")
    if 'role' in data:
        p.text(f"Rolle: {data['role']}\n")
    if 'team' in data and data['team']:
        p.text(f"Lag: {data['team']}\n")
    if 'participant_code' in data:
        p.text(f"Kode: {data['participant_code']}\n")

    # Footer
    p.text("\n")
    p.set(align='center')
    p.text("-" * 32 + "\n")
    p.text("Velkommen til 4H!\n")
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

// POST /api/participants/:code/print - Print participant info with ASCII photo
router.post('/:code/print', (req, res) => {
    const db = req.app.locals.db;
    const { code } = req.params;

    // Only run on Linux
    if (os.platform() !== 'linux') {
        return res.status(400).json({ error: 'Printer støttes kun på Linux' });
    }

    // Get participant info
    db.get(
        `SELECT participant_code, first_name, last_name, age, club, role, team, photo_path
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

            // Prepare data for printing
            const printData = {
                participant_code: participant.participant_code,
                first_name: participant.first_name,
                last_name: participant.last_name,
                age: participant.age,
                club: participant.club,
                role: participant.role,
                team: participant.team
            };

            // Add photo path if it exists
            if (participant.photo_path) {
                const fullPhotoPath = path.join(__dirname, '..', participant.photo_path);
                if (fs.existsSync(fullPhotoPath)) {
                    printData.photo_path = fullPhotoPath;
                }
            }

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
});
```

---

## Frontend Integrasjon

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

### 2. Profile Page - Print Profile

I `public/profile.html`:

**HTML:**
```html
<div class="action-buttons">
    <button id="printProfileBtn" class="button primary large-button" style="margin-bottom: 10px;">
        🖨️ Skriv Ut Profil
    </button>
    <button id="scanAgainBtn" class="button secondary large-button">
        🔄 Skann Ny Kode
    </button>
</div>

<div id="printStatus" class="hidden" style="margin-top: 15px; padding: 15px; border-radius: 8px; text-align: center; font-weight: 600;"></div>
```

I `public/js/profile.js`:

**JavaScript:**
```javascript
// Add to DOM elements section
const printProfileBtn = document.getElementById('printProfileBtn');
const printStatus = document.getElementById('printStatus');

// Add event listener
printProfileBtn.addEventListener('click', printProfile);

// Print function
async function printProfile() {
    if (!currentParticipant) {
        console.error('No participant loaded');
        return;
    }

    printProfileBtn.disabled = true;
    printProfileBtn.textContent = '⏳ Skriver ut...';

    try {
        const response = await fetch(`/api/participants/${currentParticipant.participant_code}/print`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Utskrift feilet');
        }

        printStatus.textContent = '✅ ' + data.message;
        printStatus.style.color = 'green';
        printStatus.style.background = '#d4edda';
        printStatus.classList.remove('hidden');

        setTimeout(() => {
            printStatus.classList.add('hidden');
        }, 3000);

    } catch (error) {
        console.error('Print error:', error);
        printStatus.textContent = '❌ Feil: ' + error.message;
        printStatus.style.color = '#721c24';
        printStatus.style.background = '#f8d7da';
        printStatus.classList.remove('hidden');
    } finally {
        printProfileBtn.disabled = false;
        printProfileBtn.textContent = '🖨️ Skriv Ut Profil';
    }
}
```

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
echo '{"first_name":"Ola","last_name":"Nordmann","age":15,"club":"Eina 4H","role":"Deltaker","team":"Lag Rød","participant_code":"TEST0001"}' | python3 ~/print_participant.py
```

**Test med foto:**
```bash
echo '{"first_name":"Kari","last_name":"Nordmann","age":16,"club":"Eina 4H","photo_path":"/full/path/to/photo.jpg"}' | python3 ~/print_participant.py
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

1. **Admin Panel:**
   - Gå til admin-panelet
   - Klikk på "🖨️ Skriver" tab
   - Skriv inn tekst
   - Klikk "Test Utskrift"

2. **Profile Page:**
   - Gå til profil-siden
   - Skann en deltaker-QR
   - Klikk "🖨️ Skriv Ut Profil"

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

### Problem: ASCII art ser dårlig ut

**Løsning:**
Juster parametrene i `image_to_ascii()` funksjonen:
```python
# Reduser bredden for mindre bilde
ascii_art = image_to_ascii(data['photo_path'], width=24, height=12)

# Eller endre ASCII-tegn for bedre kontrast
ascii_chars = ['█', '▓', '▒', '░', ' ']
```

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
✅ Installert Python-miljø med nødvendige biblioteker
✅ Opprettet print-scripts for enkel tekst og deltaker-info med ASCII-foto
✅ Konfigurert sudo for passordløs utskrift
✅ Integrert print-funksjonalitet i backend (Express.js)
✅ Lagt til print-knapper i frontend (Admin + Profile)
✅ Testet hele oppsettet

Skriveren er nå klar til å brukes i 4H Event Hub! 🎉

---

## 📚 Ressurser

- [python-escpos dokumentasjon](https://python-escpos.readthedocs.io/)
- [ESC/POS Command Set](http://www.starmicronics.com/support/Mannualfolder/escpos_cm_en.pdf)
- [Linux USB Printing Guide](https://wiki.archlinux.org/title/CUPS)
- [udev Rules Guide](https://wiki.archlinux.org/title/Udev)

---

*Dokumentasjon oppdatert: 2026-02-24*
*Versjon: 1.0*
