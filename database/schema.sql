-- 4H Event Hub Database Schema
-- SQLite database for storing participant information

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_code TEXT UNIQUE NOT NULL,  -- Unique code for QR generation (e.g., "SK-2026-001")
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    age INTEGER,
    home_location TEXT,                     -- e.g., "Eina", "Bøverbru", "Reinsvoll", "Raufoss"
    club TEXT,                              -- 4H club name (e.g., "Skautrollet 4H")
    role TEXT,                              -- Role at event (e.g., "Deltaker", "Leder", "Hjelper")
    team TEXT,                              -- Team assignment (e.g., "Lag 1", "Lag 2")
    profile_photo_path TEXT,                -- Path to profile selfie image
    qr_code_path TEXT,                      -- Path to generated QR code image
    registered_date TEXT DEFAULT (datetime('now')),
    last_scan_date TEXT,
    notes TEXT,
    active INTEGER DEFAULT 1                -- Soft delete flag (1 = active, 0 = inactive)
);

-- Index for faster lookups by participant code
CREATE INDEX IF NOT EXISTS idx_participant_code ON participants(participant_code);

-- Scan log table for tracking participant engagement
CREATE TABLE IF NOT EXISTS scan_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_code TEXT NOT NULL,
    scan_timestamp TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (participant_code) REFERENCES participants(participant_code)
);

-- Index for faster lookups by timestamp
CREATE INDEX IF NOT EXISTS idx_scan_timestamp ON scan_log(scan_timestamp);

-- Event information table
CREATE TABLE IF NOT EXISTS event_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT NOT NULL,
    event_description TEXT,
    location TEXT,
    start_date TEXT,                        -- ISO date format (YYYY-MM-DD)
    end_date TEXT,                          -- ISO date format (YYYY-MM-DD)
    organizer_name TEXT,                    -- Person/organization organizing
    organizer_club TEXT,                    -- Club/organization name
    organizer_contact TEXT,                 -- Email or phone
    logo_path TEXT,                         -- Path to event logo/image
    created_date TEXT DEFAULT (datetime('now')),
    updated_date TEXT DEFAULT (datetime('now')),
    active INTEGER DEFAULT 1                -- Only one event should be active at a time
);
