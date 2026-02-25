#!/usr/bin/env python3
"""
Print participant profile script for Windows
Prints participant info with courses and QR code to Windows receipt printer
"""
import sys
import json
from escpos.printer import Win32Raw

# VIKTIG: Endre til ditt skrivernavn fra Windows
# Finn navnet ved å kjøre: wmic printer get name
# Eller se i "Enheter og skrivere"
PRINTER_NAME = "POS-58"  # ENDRE DETTE TIL DITT SKRIVERNAVN!

def print_participant(data):
    """Print participant info to thermal receipt printer"""
    # Connect to Windows printer
    p = Win32Raw(PRINTER_NAME)

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
                p.text(f"    Instruktor: {course['instructor']}\n")
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
