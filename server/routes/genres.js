// /api/genres — довідник жанрів (читання для всіх, зміна — admin)
const express = require('express');
const { db } = require('../db');
const { HttpError } = require('../middleware/errors');
const { requireAdmin } = require('../middleware/auth');
const { validate, parseId } = require('../validators/validate');

const router = express.Router();

const schema = {
  name: { type: 'string', required: true, minLength: 2, maxLength: 40, label: 'Назва' },
  slug: { type: 'string', required: true, minLength: 2, maxLength: 40, pattern: /^[a-z][a-z0-9-]*$/, patternMessage: 'slug: лише малі латинські літери, цифри та дефіс', label: 'slug' },
};

const SELECT = `SELECT g.id, g.name, g.slug, COUNT(m.id) AS movies_count
  FROM genres g LEFT JOIN movies m ON m.genre_id = g.id`;

function findGenre(id) {
  const genre = db.prepare(`${SELECT} WHERE g.id = ? GROUP BY g.id`).get(id);
  if (!genre) throw new HttpError(404, `Жанр з id=${id} не знайдено`);
  return { ...genre };
}

function assertUnique(data, exceptId = 0) {
  const dup = db.prepare('SELECT id FROM genres WHERE (name = ? OR slug = ?) AND id <> ?')
    .get(data.name ?? '', data.slug ?? '', exceptId);
  if (dup) throw new HttpError(409, 'Жанр з такою назвою або slug уже існує');
}

router.get('/', (req, res) => {
  res.json(db.prepare(`${SELECT} GROUP BY g.id ORDER BY g.id`).all());
});

router.get('/:id', (req, res) => {
  res.json(findGenre(parseId(req.params.id)));
});

router.post('/', requireAdmin, (req, res) => {
  const data = validate(req.body, schema);
  assertUnique(data);
  const { lastInsertRowid } = db.prepare('INSERT INTO genres (name, slug) VALUES (?, ?)').run(data.name, data.slug);
  res.status(201).location(`/api/genres/${lastInsertRowid}`).json(findGenre(lastInsertRowid));
});

function update(partial) {
  return (req, res) => {
    const id = parseId(req.params.id);
    const current = findGenre(id);
    const data = { ...current, ...validate(req.body, schema, { partial }) };
    assertUnique(data, id);
    db.prepare('UPDATE genres SET name = ?, slug = ? WHERE id = ?').run(data.name, data.slug, id);
    res.json(findGenre(id));
  };
}
router.put('/:id', requireAdmin, update(false));
router.patch('/:id', requireAdmin, update(true));

router.delete('/:id', requireAdmin, (req, res) => {
  const id = parseId(req.params.id);
  const genre = findGenre(id);
  if (genre.movies_count > 0) {
    throw new HttpError(409, `Неможливо видалити жанр: до нього прив'язано фільмів — ${genre.movies_count}`);
  }
  db.prepare('DELETE FROM genres WHERE id = ?').run(id);
  res.status(204).end();
});

module.exports = router;
