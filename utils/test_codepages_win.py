#!/usr/bin/env python3
"""
Test script to find the correct code page for Norwegian characters (æøå) on Windows
This will print the test string with multiple code pages so you can see which works
"""
import sys
from escpos.printer import Win32Raw

# VIKTIG: Endre til ditt skrivernavn
PRINTER_NAME = "POS-58"  # ENDRE DETTE!

try:
    # Connect to printer
    p = Win32Raw(PRINTER_NAME)

    # Test string with Norwegian characters
    test_string = "TEST: æøå ÆØÅ"

    # Header
    p.set(align='center', bold=True)
    p.text("CODE PAGE TEST\n")
    p.set(bold=False)
    p.text("=" * 32 + "\n\n")

    # Test different code pages (0-20)
    code_pages = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

    for cp in code_pages:
        try:
            # Set code page using raw ESC/POS command
            p._raw(b'\x1b\x74' + bytes([cp]))

            # Print code page number and test string
            p.set(align='left')
            p.text(f"CP {cp:02d}: {test_string}\n")

        except Exception as e:
            p.text(f"CP {cp:02d}: ERROR - {str(e)[:20]}\n")

    # Footer
    p.text("\n" + "=" * 32 + "\n")
    p.text("Finn hvilken code page\n")
    p.text("som viser: æøå ÆØÅ\n")
    p.text("korrekt, og oppdater\n")
    p.text("PRINTER_NAME i scriptene\n")
    p.text("\n\n\n")

    # Cut paper
    p.cut()

    print("✅ Code page test sendt til skriver!", file=sys.stderr)
    print("Se på kvitteringen og finn riktig CP-nummer", file=sys.stderr)

except Exception as e:
    print(f"❌ Error: {e}", file=sys.stderr)
    print("\nSjekk at:", file=sys.stderr)
    print("1. PRINTER_NAME er satt riktig i scriptet", file=sys.stderr)
    print("2. Skriveren er påslått og tilkoblet", file=sys.stderr)
    sys.exit(1)
