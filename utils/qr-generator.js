const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

/**
 * Generate a QR code for a participant
 * @param {string} participantCode - Unique participant code (e.g., "SK-2026-001")
 * @param {string} outputPath - Full path where QR code image should be saved
 * @returns {Promise<string>} - Path to generated QR code
 */
async function generateQRCode(participantCode, outputPath) {
    try {
        // Create QR code data as JSON
        const data = JSON.stringify({
            type: 'participant',
            code: participantCode
        });

        // Generate QR code and save to file
        await QRCode.toFile(outputPath, data, {
            width: 400,
            margin: 2,
            errorCorrectionLevel: 'M',
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        return outputPath;
    } catch (err) {
        console.error('Error generating QR code:', err);
        throw err;
    }
}

/**
 * Generate QR code for a participant and return the relative path
 * @param {string} participantCode - Unique participant code
 * @returns {Promise<string>} - Relative path to QR code (e.g., "/uploads/qr-codes/SK-2026-001.png")
 */
async function generateParticipantQR(participantCode) {
    const filename = `${participantCode}.png`;
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'qr-codes');

    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fullPath = path.join(uploadsDir, filename);
    await generateQRCode(participantCode, fullPath);

    return `/uploads/qr-codes/${filename}`;
}

module.exports = {
    generateQRCode,
    generateParticipantQR
};
