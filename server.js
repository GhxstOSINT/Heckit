require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const JWT_SECRET = process.env.JWT_SECRET || 'stitchd_prod_super_secret_2026';
const PORT = process.env.PORT || 3000;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// In-memory user "database": email -> { email, name, role }
const USERS = new Map();

function upsertUser(profile) {
  if (!USERS.has(profile.email)) {
    USERS.set(profile.email, {
      email: profile.email,
      name: profile.name || 'Unknown',
      role: 'customer'
    });
  } else {
    USERS.get(profile.email).name = profile.name || USERS.get(profile.email).name;
  }
  return USERS.get(profile.email);
}

// 1) Google OAuth login: frontend sends the GIS id_token ("credential")
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body || {};
  if (!credential) return res.status(400).json({ error: 'Missing credential' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const user = upsertUser({ email: payload.email, name: payload.name });

    // NOTE: role is NOT put in the token - it lives server-side in USERS
    const token = jwt.sign({ sub: user.email, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

// 2) Middleware: authentication (valid token?)
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// 3) Middleware: authorization (is this user an admin?)
const requireAdmin = (req, res, next) => {
  const user = USERS.get(req.user.sub);
  if (user && user.role === 'admin') return next();
  return res.status(403).json({ error: 'Forbidden: admin role required' });
};

// 4) Profile endpoints
app.get('/api/v1/users/me', requireAuth, (req, res) => {
  res.json(USERS.get(req.user.sub));
});

// VULNERABILITY (intentional): Mass Assignment.
// Object.assign copies EVERY field the client sends - including "role".
app.put('/api/v1/users/me', requireAuth, (req, res) => {
  const user = USERS.get(req.user.sub);
  Object.assign(user, req.body);
  res.json({ status: 'updated', user });
});

// 5) The admin-only document portal (the target of the exploit)
app.get('/api/v1/admin/internal/docs', requireAuth, requireAdmin, (req, res) => {
  res.json({
    status: 'success',
    message: 'Internal Engineering & DevOps Portal',
    files: [
      { name: 'onboarding_infrastructure.pdf', url: '/secure/onboarding.pdf' }
    ]
  });
});

// 6) SPA fallback + start
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => {
  console.log("Stitch'd Boutique running on http://localhost:" + PORT);
});