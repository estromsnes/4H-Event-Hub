#!/usr/bin/env python3
"""
Print receipt script for Windows
Sends text to a Windows-installed receipt printer using ESC/POS
"""
import sys
from escpos.printer import Win32Raw

# VIKTIG: Endre til ditt skrivernavn fra Windows
# Finn navnet ved å kjøre: wmic printer get name
# Eller se i "Enheter og skrivere"
PRINTER_NAME = "POS-58"  # ENDRE DETTE TIL DITT SKRIVERNAVN!

try:
    # Koble til Windows-skriver
    p = Win32Raw(PRINTER_NAME)

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

    print("Print successful!", file=sys.stderr)

except Exception as e:
    print(f"Print error: {e}", file=sys.stderr)
    sys.exit(1)
