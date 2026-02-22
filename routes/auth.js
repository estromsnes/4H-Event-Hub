const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// Admin authentication state
// This will be set by server.js on startup
let adminAccessKey = null;
let adminPin = null;

// Active admin sessions (token -> timestamp)
const activeSessions = new Map();

// Session expiry time (4 hours)
const SESSION_EXPIRY = 4 * 60 * 60 * 1000;

// Clean up expired sessions every hour
setInterval(() => {
  const now = Date.now();
  for (const [token, timestamp] of activeSessions.entries()) {
    if (now - timestamp > SESSION_EXPIRY) {
      activeSessions.delete(token);
    }
  }
}, 60 * 60 * 1000);

// Set the admin access key and PIN (called from server.js)
function setAdminCredentials(accessKey, pin) {
  adminAccessKey = accessKey;
  adminPin = pin;
}

// Generate a secure random token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
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
    // Generate a session token
    const token = generateToken();
    activeSessions.set(token, Date.now());

    return res.json({
      success: true,
      message: 'Tilgang godkjent',
      token: token
    });
  }

  // Invalid code
  return res.status(401).json({
    success: false,
    message: 'Ugyldig kode'
  });
});

// Verify if a token is valid
router.post('/verify-token', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Ingen token oppgitt'
    });
  }

  const timestamp = activeSessions.get(token);
  if (!timestamp) {
    return res.status(401).json({
      success: false,
      message: 'Ugyldig token'
    });
  }

  // Check if token is expired
  if (Date.now() - timestamp > SESSION_EXPIRY) {
    activeSessions.delete(token);
    return res.status(401).json({
      success: false,
      message: 'Token utløpt'
    });
  }

  // Token is valid
  return res.json({
    success: true,
    message: 'Token gyldig'
  });
});

// Middleware to verify admin token
function requireAdminToken(req, res, next) {
  const token = req.headers['x-admin-token'] || req.body.token || req.query.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Ingen token oppgitt. Vennligst logg inn på nytt.'
    });
  }

  const timestamp = activeSessions.get(token);
  if (!timestamp) {
    return res.status(401).json({
      success: false,
      message: 'Ugyldig token. Vennligst logg inn på nytt.'
    });
  }

  // Check if token is expired
  if (Date.now() - timestamp > SESSION_EXPIRY) {
    activeSessions.delete(token);
    return res.status(401).json({
      success: false,
      message: 'Token utløpt. Vennligst logg inn på nytt.'
    });
  }

  // Update timestamp (sliding expiry)
  activeSessions.set(token, Date.now());
  next();
}

// Get the admin QR code value (protected)
router.get('/admin-qr-value', requireAdminToken, (req, res) => {
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
module.exports.requireAdminToken = requireAdminToken;
