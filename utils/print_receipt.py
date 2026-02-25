#!/usr/bin/env python3
import sys
from escpos.printer import Usb

# Connect to printer
p = Usb(0x154f, 0x154f, out_ep=0x02, in_ep=0x82, profile="default")

# Set character encoding for Norwegian characters (æøå)
# Code page 2 = PC850 (Multilingual)
try:
    p._raw(b'\x1b\x74\x02')  # ESC t 2 - Select code page 2 (PC850)
except:
    pass

# Print text from stdin
text = sys.stdin.read()
p.text(text)
p.text("\n\n\n")
p.cut()
