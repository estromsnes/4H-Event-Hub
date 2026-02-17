const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { generateParticipantQR } = require('../utils/qr-generator');

// GET QR code for a specific participant
router.get('/:code', async (req, res) => {
    const db = req.app.locals.db;
    const { code } = req.params;

    try {
        // Check if participant exists
        const participant = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM participants WHERE participant_code = ? AND active = 1',
                [code],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!participant) {
            return res.status(404).json({ error: 'Participant not found' });
        }

        // Check if QR code already exists
        const qrFilename = `${code}.png`;
        const qrPath = path.join(__dirname, '..', 'uploads', 'qr-codes', qrFilename);

        // If QR code doesn't exist, generate it
        if (!fs.existsSync(qrPath)) {
            console.log(`Generating new QR code for ${code}`);
            const relativePath = await generateParticipantQR(code);

            // Update database with QR code path
            await new Promise((resolve, reject) => {
                db.run(
                    'UPDATE participants SET qr_code_path = ? WHERE participant_code = ?',
                    [relativePath, code],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        // Return the QR code image
        res.sendFile(qrPath);
    } catch (err) {
        console.error('Error serving QR code:', err);
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
});

// POST generate QR codes for all participants
router.post('/generate-batch', async (req, res) => {
    const db = req.app.locals.db;

    try {
        // Get all active participants
        const participants = await new Promise((resolve, reject) => {
            db.all(
                'SELECT participant_code FROM participants WHERE active = 1',
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });

        if (participants.length === 0) {
            return res.status(404).json({ error: 'No participants found' });
        }

        // Generate QR codes for all participants
        const results = [];
        for (const participant of participants) {
            try {
                const qrPath = await generateParticipantQR(participant.participant_code);

                // Update database
                await new Promise((resolve, reject) => {
                    db.run(
                        'UPDATE participants SET qr_code_path = ? WHERE participant_code = ?',
                        [qrPath, participant.participant_code],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });

                results.push({
                    code: participant.participant_code,
                    qr_path: qrPath,
                    status: 'success'
                });
            } catch (err) {
                console.error(`Error generating QR for ${participant.participant_code}:`, err);
                results.push({
                    code: participant.participant_code,
                    status: 'error',
                    error: err.message
                });
            }
        }

        res.json({
            message: 'Batch QR generation complete',
            total: participants.length,
            results: results
        });
    } catch (err) {
        console.error('Error in batch QR generation:', err);
        res.status(500).json({ error: 'Failed to generate QR codes' });
    }
});

// GET list all available QR codes
router.get('/', (req, res) => {
    const db = req.app.locals.db;

    db.all(
        `SELECT participant_code, first_name, last_name, qr_code_path
         FROM participants
         WHERE active = 1 AND qr_code_path IS NOT NULL
         ORDER BY participant_code`,
        [],
        (err, rows) => {
            if (err) {
                console.error('Error fetching QR codes:', err);
                return res.status(500).json({ error: 'Failed to fetch QR codes' });
            }
            res.json(rows);
        }
    );
});

module.exports = router;
