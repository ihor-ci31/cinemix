// Відгуки — повний CRUD.
//   GET  /api/movies/:id/reviews   — відгуки фільму
//   POST /api/movies/:id/reviews   — створити (автентифікований користувач)
//   GET  /api/reviews/:id          — один відгук
//   PUT/PATCH /api/reviews/:id     — змінити (автор або admin)
//   DELETE /api/reviews/:id        — видалити (автор або admin)
const express = require('express');
const { db } = require('../db');
const { HttpError } = require('../middleware/errors');
const { requireAuth } = require('../middleware/auth');
const { validate, parseId } = require('../validators/validate');

const router = express.Router();

const schema = {
  rating: { type: 'integer', required: true, min: 1, max: 10, label: 'Оцінка' },
  text:   { type: 'string', required: true, minLength: 3, maxLength: 2000, label: 'Текст відгуку' },
};

const SELECT = `SELECT r.id, r.movie_id, r.rating, r.text, r.created_at, r.updated_at,
  u.id AS user_id, u.username, u.name AS user_name
  FROM reviews r JOIN users u ON u.id = r.user_id`;

function toDto(row) {
  const { user_id, username, user_name, ...rest } = row;
  return { ...rest, user: { id: user_id, username, name: user_name } };
}

function findReview(id) {
  const row = db.prepare(`${SELECT} WHERE r.id = ?`).get(id);
  if (!row) throw new HttpError(404, `Відгук з id=${id} не знайдено`);
  return toDto(row);
}

function assertMovie(id) {
  if (!db.prepare('SELECT 1 FROM movies WHERE id = ?').get(id)) throw new HttpError(404, `Фільм з id=${id} не знайдено`);
}

function assertCanEdit(req, review) {
  if (req.user.role !== 'admin' && req.user.id !== review.user.id) {
    throw new HttpError(403, 'Змінювати чи видаляти відгук може лише його автор або адміністратор');
  }
}

function listForMovie(req, res) {
  const movieId = parseId(req.params.id);
  assertMovie(movieId);
  const rows = db.prepare(`${SELECT} WHERE r.movie_id = ? ORDER BY r.created_at DESC, r.id DESC`).all(movieId);
  res.json(rows.map(toDto));
}

const createForMovie = [requireAuth, (req, res) => {
  const movieId = parseId(req.params.id);
  assertMovie(movieId);
  const data = validate(req.body, schema);
  if (db.prepare('SELECT 1 FROM reviews WHERE movie_id = ? AND user_id = ?').get(movieId, req.user.id)) {
    throw new HttpError(409, 'Ви вже залишили відгук до цього фільму — відредагуйте його');
  }
  const { lastInsertRowid } = db.prepare('INSERT INTO reviews (movie_id, user_id, rating, text) VALUES (?, ?, ?, ?)')
    .run(movieId, req.user.id, data.rating, data.text);
  res.status(201).location(`/api/reviews/${lastInsertRowid}`).json(findReview(lastInsertRowid));
}];

router.get('/:id', (req, res) => {
  res.json(findReview(parseId(req.params.id)));
});

function update(partial) {
  return (req, res) => {
    const id = parseId(req.params.id);
    const review = findReview(id);
    assertCanEdit(req, review);
    const data = { rating: review.rating, text: review.text, ...validate(req.body, schema, { partial }) };
    db.prepare("UPDATE reviews SET rating = ?, text = ?, updated_at = datetime('now') WHERE id = ?")
      .run(data.rating, data.text, id);
    res.json(findReview(id));
  };
}
router.put('/:id', requireAuth, update(false));
router.patch('/:id', requireAuth, update(true));

router.delete('/:id', requireAuth, (req, res) => {
  const id = parseId(req.params.id);
  assertCanEdit(req, findReview(id));
  db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
  res.status(204).end();
});

module.exports = router;
module.exports.listForMovie = listForMovie;
module.exports.createForMovie = createForMovie;
