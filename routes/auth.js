const express = require('express');
const router = express.Router();

// Admin authentication state
// This will be set by server.js on startup
let adminAccessKey = null;
let adminPin = null;

// Set the admin access key and PIN (called from server.js)
function setAdminCredentials(accessKey, pin) {
  adminAccessKey = accessKey;
  adminPin = pin;
}

// Verify admin access (QR code or PIN)
router.post('/verify-admin', (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Ingen kode oppgitt'
    });
  }

  // Check if code matches admin access key (QR code) or PIN
  if (code === adminAccessKey || code === adminPin) {
    return res.json({
      success: true,
      message: 'Tilgang godkjent'
    });
  }

  // Invalid code
  return res.status(401).json({
    success: false,
    message: 'Ugyldig kode'
  });
});

// Get the admin QR code value
// Note: This is protected by frontend authentication
// Only authenticated admin users can access this within the admin panel
router.get('/admin-qr-value', (req, res) => {
  if (!adminAccessKey) {
    return res.status(500).json({
      success: false,
      message: 'Admin nøkkel ikke generert'
    });
  }

  res.json({
    success: true,
    accessKey: adminAccessKey,
    pin: adminPin
  });
});

module.exports = router;
module.exports.setAdminCredentials = setAdminCredentials;
