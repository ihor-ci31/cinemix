// /api/stats — загальна статистика для головної сторінки
const express = require('express');
const { db } = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const n = (sql) => db.prepare(sql).get().n;
  res.json({
    movies: n('SELECT COUNT(*) AS n FROM movies'),
    users: n('SELECT COUNT(*) AS n FROM users'),
    reviews: n('SELECT COUNT(*) AS n FROM reviews'),
    new_this_month: n("SELECT COUNT(*) AS n FROM movies WHERE created_at >= datetime('now', '-30 days')"),
  });
});

module.exports = router;
