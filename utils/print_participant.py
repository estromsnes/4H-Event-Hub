#!/usr/bin/env python3
import sys
import json
from escpos.printer import Usb

def print_participant(data):
  """Print participant info to thermal receipt printer"""
  # Connect to printer
  p = Usb(0x154f, 0x154f, out_ep=0x02, in_ep=0x82, profile="default")

  # Set character encoding for Norwegian characters (æøå)
  # Code page 2 = PC850 (Multilingual)
  try:
      p._raw(b'\x1b\x74\x02')  # ESC t 2 - Select code page 2 (PC850)
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

  #if 'age' in data:
  #    p.text(f"Alder: {data['age']} ar\n")
  if 'club' in data:
      p.text(f"Klubb: {data['club']}\n")
  if 'role' in data:
      p.text(f"Rolle: {data['role']}\n")
  if 'team' in data and data['team']:
      p.text(f"Lag: {data['team']}\n")
  #if 'participant_code' in data:
  #    p.text(f"Kode: {data['participant_code']}\n")

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