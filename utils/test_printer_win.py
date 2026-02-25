#!/usr/bin/env python3
"""
Test script for Windows receipt printer
Tests basic printing and lists available printers
"""
import sys

def list_printers():
    """List all available Windows printers"""
    try:
        import win32print
        printers = win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS)

        print("\n" + "="*50)
        print("TILGJENGELIGE SKRIVERE:")
        print("="*50)

        for i, printer in enumerate(printers, 1):
            printer_name = printer[2]
            print(f"{i}. {printer_name}")

        print("="*50)
        print(f"\nTotalt {len(printers)} skriver(e) funnet")
        print("\nBruk det eksakte navnet i print_receipt_win.py")
        print("="*50 + "\n")

        return printers
    except ImportError:
        print("ERROR: pywin32 ikke installert!")
        print("Installer med: pip install pywin32")
        sys.exit(1)
    except Exception as e:
        print(f"Error listing printers: {e}")
        sys.exit(1)

def test_printer(printer_name):
    """Test printing to specified printer"""
    try:
        from escpos.printer import Win32Raw

        print(f"\n{'='*50}")
        print(f"TESTER SKRIVER: {printer_name}")
        print(f"{'='*50}\n")

        # Connect to printer
        p = Win32Raw(printer_name)

        # Set code page for Norwegian characters
        try:
            p._raw(b'\x1b\x74\x02')  # ESC t 2 - PC850
        except:
            pass

        # Print test content
        p.set(align='center', bold=True)
        p.text("PRINTER TEST\n")
        p.set(bold=False)
        p.text("="*32 + "\n\n")

        p.set(align='left')
        p.text("Norske tegn test:\n")
        p.text("æøå ÆØÅ\n")
        p.text("Test: æble, øl, ål\n\n")

        p.text("4H Event Hub\n")
        p.text("Kvitteringsskriver\n")
        p.text("Fungerer!\n\n")

        # Try QR code
        try:
            p.set(align='center')
            p.text("QR-kode test:\n")
            p.qr("TEST123", size=6)
            p.text("\n")
        except Exception as e:
            p.text(f"QR error: {str(e)[:20]}\n")

        p.text("\n")
        p.set(align='center')
        p.text("-"*32 + "\n")
        p.text("Test fullført\n")
        p.text("\n\n\n")
        p.cut()

        print("✅ Test utskrift sendt!")
        print("Sjekk at kvitteringen ble skrevet ut.\n")

    except Exception as e:
        print(f"❌ ERROR: {e}")
        print("\nMulige årsaker:")
        print("- Feil skrivernavn (bruk det eksakte navnet fra listen)")
        print("- Skriver ikke påslått eller tilkoblet")
        print("- Skriver ikke støtter ESC/POS")
        sys.exit(1)

if __name__ == '__main__':
    print("\n" + "="*50)
    print("4H EVENT HUB - WINDOWS PRINTER TEST")
    print("="*50)

    # List available printers
    printers = list_printers()

    if len(printers) == 0:
        print("Ingen skrivere funnet!")
        sys.exit(1)

    # Ask user to select printer
    print("\nVelg en skriver å teste:")
    print("(Trykk Enter for å hoppe over test)\n")

    try:
        choice = input("Skriv nummer (1-{}): ".format(len(printers)))

        if choice.strip():
            idx = int(choice) - 1
            if 0 <= idx < len(printers):
                printer_name = printers[idx][2]
                test_printer(printer_name)
            else:
                print("Ugyldig valg!")
        else:
            print("Test hoppet over.")
    except KeyboardInterrupt:
        print("\n\nAvbrutt av bruker.")
    except Exception as e:
        print(f"Error: {e}")
