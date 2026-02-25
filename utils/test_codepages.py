#!/usr/bin/env python3
"""
Test script to find the correct code page for Norwegian characters (æøå)
This will print the test string with multiple code pages so you can see which works
"""
import sys
from escpos.printer import Usb

# Connect to printer
p = Usb(0x154f, 0x154f, out_ep=0x02, in_ep=0x82, profile="default")

# Test string with Norwegian characters
test_string = "TEST: æøå ÆØÅ"

# Header
p.set(align='center', bold=True)
p.text("CODE PAGE TEST\n")
p.set(bold=False)
p.text("=" * 32 + "\n\n")

# Test different code pages (0-20)
# Common ones:
# 0 = PC437 (USA)
# 1 = Katakana
# 2 = PC850 (Multilingual)
# 3 = PC860 (Portuguese)
# 4 = PC863 (Canadian-French)
# 5 = PC865 (Nordic)
# 13 = PC857 (Turkish)
# 16 = WPC1252
# 19 = PC858 (Euro)

code_pages = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

for cp in code_pages:
    try:
        # Set code page using raw ESC/POS command
        p._raw(b'\x1b\x74' + bytes([cp]))

        # Print code page number and test string
        p.set(align='left')
        p.text(f"CP {cp:02d}: {test_string}\n")

    except Exception as e:
        p.text(f"CP {cp:02d}: ERROR - {str(e)}\n")

# Footer
p.text("\n" + "=" * 32 + "\n")
p.text("Find which code page\n")
p.text("shows: æøå ÆØÅ correctly\n")
p.text("\n\n\n")

# Cut paper
p.cut()

print("Test print completed!", file=sys.stderr)
