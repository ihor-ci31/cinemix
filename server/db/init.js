// Створення схеми та заповнення бази початковими даними: npm run db:init
const fs = require('node:fs');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const config = require('../config');
const { db, transaction, file } = require('../db');
const data = require('./seed-data');

db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

transaction(() => {
  const genreId = {};
  const insGenre = db.prepare('INSERT INTO genres (name, slug) VALUES (?, ?)');
  for (const g of data.genres) genreId[g.slug] = insGenre.run(g.name, g.slug).lastInsertRowid;

  const movieId = {};
  const insMovie = db.prepare(`INSERT INTO movies
    (title, original_title, year, duration_min, country, director, description, poster_url, genre_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))`);
  data.movies.forEach((m, i) => {
    // різний час додавання, щоб працювало сортування «нові надходження»
    movieId[m.title] = insMovie.run(m.title, m.original_title, m.year, m.duration_min, m.country,
      m.director, m.description, m.poster_url, genreId[m.genre], `-${data.movies.length - i} hours`).lastInsertRowid;
  });

  const insActor = db.prepare('INSERT INTO actors (name, photo_url) VALUES (?, ?)');
  const insCast = db.prepare('INSERT INTO movie_actors (movie_id, actor_id, role_name) VALUES (?, ?, ?)');
  for (const [title, list] of Object.entries(data.cast)) {
    for (const [name, role, photo] of list) {
      const actorId = insActor.run(name, photo).lastInsertRowid;
      insCast.run(movieId[title], actorId, role);
    }
  }

  const insUser = db.prepare(`INSERT INTO users (name, username, email, password_hash, role, favorite_genre_id)
    VALUES (?, ?, ?, ?, ?, ?)`);
  insUser.run('Адміністратор', 'admin', config.adminEmail, bcrypt.hashSync(config.adminPassword, 10), 'admin', null);
  const userId = {};
  for (const u of data.users) {
    userId[u.username] = insUser.run(u.name, u.username, u.email, bcrypt.hashSync(u.password, 10), 'user', genreId[u.favorite]).lastInsertRowid;
  }

  const insReview = db.prepare('INSERT INTO reviews (movie_id, user_id, rating, text) VALUES (?, ?, ?, ?)');
  for (const r of data.reviews) insReview.run(movieId[r.movie], userId[r.user], r.rating, r.text);
});

const count = (t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
console.log(`База створена: ${file}`);
console.log(`genres=${count('genres')} movies=${count('movies')} actors=${count('actors')} users=${count('users')} reviews=${count('reviews')}`);
console.log(`Адміністратор: ${config.adminEmail} (пароль з ADMIN_PASSWORD у .env)`);
