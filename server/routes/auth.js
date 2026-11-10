// /api/auth — реєстрація, вхід, поточний користувач
const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { HttpError } = require('../middleware/errors');
const { signToken, requireAuth } = require('../middleware/auth');
const { validate } = require('../validators/validate');

const router = express.Router();
const BCRYPT_ROUNDS = 10;

// Ті самі правила, що й HTML5-валідація форми register.html з ЛР1
const registerSchema = {
  name:     { type: 'string', required: true, minLength: 2, maxLength: 50, label: "Ім'я" },
  username: { type: 'string', required: true, minLength: 3, maxLength: 20, pattern: /^[a-zA-Z0-9_]+$/, patternMessage: 'Нікнейм: лише латиниця, цифри та _', label: 'Нікнейм' },
  email:    { type: 'string', required: true, maxLength: 254, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, patternMessage: 'Некоректний email', label: 'Email' },
  password: { type: 'string', required: true, minLength: 8, maxLength: 72, label: 'Пароль' },
  genre:    { type: 'string', maxLength: 40, label: 'Улюблений жанр' },
  terms:    { type: 'boolean', required: true, label: 'Згода з умовами' },
};

const loginSchema = {
  login:    { type: 'string', required: true, maxLength: 254, label: 'Email або нікнейм' },
  password: { type: 'string', required: true, maxLength: 72, label: 'Пароль' },
};

function publicUser(id) {
  const u = db.prepare(`SELECT u.id, u.name, u.username, u.email, u.role, u.created_at,
      g.id AS genre_id, g.name AS genre_name, g.slug AS genre_slug
    FROM users u LEFT JOIN genres g ON g.id = u.favorite_genre_id WHERE u.id = ?`).get(id);
  const { genre_id, genre_name, genre_slug, ...rest } = u;
  return { ...rest, favorite_genre: genre_id ? { id: genre_id, name: genre_name, slug: genre_slug } : null };
}

// POST /api/auth/register → 201 { token, user }
router.post('/register', (req, res) => {
  const data = validate(req.body, registerSchema);
  if (data.terms !== true) {
    throw new HttpError(400, 'Помилка валідації', { terms: 'Потрібно погодитися з умовами використання' });
  }

  let genreId = null;
  if (data.genre) {
    const g = db.prepare('SELECT id FROM genres WHERE slug = ?').get(data.genre);
    if (!g) throw new HttpError(400, 'Помилка валідації', { genre: `Невідомий жанр «${data.genre}»` });
    genreId = g.id;
  }

  const conflicts = {};
  if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(data.username)) conflicts.username = 'Цей нікнейм уже зайнятий';
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(data.email)) conflicts.email = 'Користувач з таким email уже існує';
  if (Object.keys(conflicts).length) throw new HttpError(409, 'Користувач уже існує', conflicts);

  // Пароль зберігається лише як bcrypt-хеш (із сіллю)
  const hash = bcrypt.hashSync(data.password, BCRYPT_ROUNDS);
  const { lastInsertRowid } = db.prepare(`INSERT INTO users (name, username, email, password_hash, favorite_genre_id)
    VALUES (?, ?, ?, ?, ?)`).run(data.name, data.username, data.email.toLowerCase(), hash, genreId);

  const user = publicUser(lastInsertRowid);
  res.status(201).json({ token: signToken(user), user });
});

// POST /api/auth/login → 200 { token, user }
router.post('/login', (req, res) => {
  const data = validate(req.body, loginSchema);
  const row = db.prepare('SELECT id, password_hash FROM users WHERE email = ? OR username = ?').get(data.login, data.login);
  // Однакова відповідь для «немає користувача» та «невірний пароль»
  if (!row || !bcrypt.compareSync(data.password, row.password_hash)) {
    throw new HttpError(401, 'Невірний email/нікнейм або пароль');
  }
  const user = publicUser(row.id);
  res.json({ token: signToken(user), user });
});

// GET /api/auth/me → 200 user
router.get('/me', requireAuth, (req, res) => {
  res.json(publicUser(req.user.id));
});

module.exports = router;
