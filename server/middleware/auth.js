// Автентифікація (JWT у заголовку Authorization: Bearer <token>) та авторизація за роллю.
// Сервер не зберігає сесій: уся інформація про користувача — у підписаному токені (stateless).
const jwt = require('jsonwebtoken');
const config = require('../config');
const { db } = require('../db');
const { HttpError } = require('./errors');

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

function readUser(req) {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new HttpError(401, 'Токен недійсний або прострочений');
  }
  // Перевіряємо, що користувач досі існує, і беремо актуальну роль
  const user = db.prepare('SELECT id, name, username, email, role FROM users WHERE id = ?').get(payload.sub);
  if (!user) throw new HttpError(401, 'Користувача з цим токеном не існує');
  return { ...user };
}

// Обов'язкова автентифікація → 401
function requireAuth(req, res, next) {
  const user = readUser(req);
  if (!user) throw new HttpError(401, 'Потрібна автентифікація');
  req.user = user;
  next();
}

// Лише для адміністратора → 403
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') throw new HttpError(403, 'Недостатньо прав: потрібна роль admin');
    next();
  });
}

module.exports = { signToken, requireAuth, requireAdmin };
