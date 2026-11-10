// /api/movies — повний CRUD для фільмів (читання — всім, зміна — admin)
const express = require('express');
const { db } = require('../db');
const { HttpError } = require('../middleware/errors');
const { requireAdmin } = require('../middleware/auth');
const { validate, parseId } = require('../validators/validate');
const reviews = require('./reviews');

const router = express.Router();
const MAX_YEAR = new Date().getFullYear() + 10;

const schema = {
  title:          { type: 'string', required: true, minLength: 1, maxLength: 200, label: 'Назва' },
  original_title: { type: 'string', maxLength: 200, label: 'Оригінальна назва' },
  year:           { type: 'integer', required: true, min: 1888, max: MAX_YEAR, label: 'Рік' },
  duration_min:   { type: 'integer', required: true, min: 1, max: 1000, label: 'Тривалість (хв)' },
  country:        { type: 'string', maxLength: 100, label: 'Країна' },
  director:       { type: 'string', maxLength: 100, label: 'Режисер' },
  description:    { type: 'string', maxLength: 3000, label: 'Опис' },
  poster_url:     { type: 'url', label: 'Постер (URL)' },
  genre_id:       { type: 'integer', required: true, min: 1, label: 'Жанр' },
};
const FIELDS = Object.keys(schema);

// Рейтинг і кількість відгуків обчислюються з reviews (не зберігаються — 3НФ)
const SELECT = `
  SELECT m.id, m.title, m.original_title, m.year, m.duration_min, m.country, m.director,
         m.description, m.poster_url, m.created_at,
         g.id AS genre_id, g.name AS genre_name, g.slug AS genre_slug,
         ROUND(AVG(r.rating), 1) AS rating, COUNT(r.id) AS reviews_count
  FROM movies m
  JOIN genres g ON g.id = m.genre_id
  LEFT JOIN reviews r ON r.movie_id = m.id`;

function toDto(row) {
  const { genre_id, genre_name, genre_slug, ...rest } = row;
  return { ...rest, genre: { id: genre_id, name: genre_name, slug: genre_slug } };
}

function findMovie(id) {
  const row = db.prepare(`${SELECT} WHERE m.id = ? GROUP BY m.id`).get(id);
  if (!row) throw new HttpError(404, `Фільм з id=${id} не знайдено`);
  return toDto(row);
}

function assertGenre(genreId) {
  if (genreId == null) return;
  if (!db.prepare('SELECT 1 FROM genres WHERE id = ?').get(genreId)) {
    throw new HttpError(400, 'Помилка валідації', { genre_id: `Жанру з id=${genreId} не існує` });
  }
}

// GET /api/movies?genre=scifi&q=дюна&sort=new|rating|year|title&limit=12&offset=0
router.get('/', (req, res) => {
  const where = [];
  const params = [];
  const { genre, q } = req.query;

  if (genre) {
    if (/^\d+$/.test(genre)) { where.push('g.id = ?'); params.push(Number(genre)); }
    else { where.push('g.slug = ?'); params.push(String(genre)); }
  }
  if (q) {
    const text = String(q).trim().toLowerCase();
    if (text.length > 100) throw new HttpError(400, 'Пошуковий запит задовгий (максимум 100 символів)');
    where.push(`(instr(ulower(m.title), ?) OR instr(ulower(IFNULL(m.original_title,'')), ?)
      OR instr(ulower(IFNULL(m.director,'')), ?)
      OR EXISTS (SELECT 1 FROM movie_actors ma JOIN actors a ON a.id = ma.actor_id
                 WHERE ma.movie_id = m.id AND instr(ulower(a.name), ?)))`);
    params.push(text, text, text, text);
  }

  const sorts = { new: 'm.created_at DESC, m.id DESC', rating: 'rating IS NULL, rating DESC', year: 'm.year DESC', title: 'm.title COLLATE NOCASE' };
  const sort = req.query.sort || 'title';
  if (!sorts[sort]) throw new HttpError(400, `Параметр sort має бути одним із: ${Object.keys(sorts).join(', ')}`);

  const limit = req.query.limit === undefined ? 50 : Number(req.query.limit);
  const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new HttpError(400, 'Параметр limit має бути цілим числом від 1 до 100');
  if (!Number.isInteger(offset) || offset < 0) throw new HttpError(400, 'Параметр offset має бути цілим числом ≥ 0');

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) AS n FROM movies m JOIN genres g ON g.id = m.genre_id ${whereSql}`).get(...params).n;
  const rows = db.prepare(`${SELECT} ${whereSql} GROUP BY m.id ORDER BY ${sorts[sort]} LIMIT ? OFFSET ?`)
    .all(...params, limit, offset);

  res.json({ items: rows.map(toDto), total, limit, offset });
});

// GET /api/movies/:id — разом з акторським складом
router.get('/:id', (req, res) => {
  const id = parseId(req.params.id);
  const movie = findMovie(id);
  movie.cast = db.prepare(`SELECT a.id, a.name, a.photo_url, ma.role_name
    FROM movie_actors ma JOIN actors a ON a.id = ma.actor_id WHERE ma.movie_id = ? ORDER BY a.id`).all(id);
  res.json(movie);
});

router.post('/', requireAdmin, (req, res) => {
  const data = validate(req.body, schema);
  assertGenre(data.genre_id);
  const { lastInsertRowid } = db.prepare(
    `INSERT INTO movies (${FIELDS.join(', ')}) VALUES (${FIELDS.map(() => '?').join(', ')})`,
  ).run(...FIELDS.map((f) => data[f] ?? null));
  res.status(201).location(`/api/movies/${lastInsertRowid}`).json(findMovie(lastInsertRowid));
});

// PUT — повна заміна (усі обов'язкові поля), PATCH — часткове оновлення
function update(partial) {
  return (req, res) => {
    const id = parseId(req.params.id);
    findMovie(id);
    const data = validate(req.body, schema, { partial });
    assertGenre(data.genre_id);
    const fields = partial ? Object.keys(data) : FIELDS;
    db.prepare(`UPDATE movies SET ${fields.map((f) => `${f} = ?`).join(', ')} WHERE id = ?`)
      .run(...fields.map((f) => data[f] ?? null), id);
    res.json(findMovie(id));
  };
}
router.put('/:id', requireAdmin, update(false));
router.patch('/:id', requireAdmin, update(true));

router.delete('/:id', requireAdmin, (req, res) => {
  const id = parseId(req.params.id);
  findMovie(id);
  db.prepare('DELETE FROM movies WHERE id = ?').run(id); // відгуки та склад видаляються каскадно
  res.status(204).end();
});

// Вкладений ресурс: /api/movies/:id/reviews
router.get('/:id/reviews', reviews.listForMovie);
router.post('/:id/reviews', ...reviews.createForMovie);

module.exports = router;
