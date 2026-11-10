-- =============================================
-- Cinemix — схема бази даних (SQLite)
-- =============================================
PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS movie_actors;
DROP TABLE IF EXISTS actors;
DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS genres;

-- Жанри (довідник)
CREATE TABLE genres (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL UNIQUE CHECK (length(name) BETWEEN 2 AND 40),
  slug  TEXT NOT NULL UNIQUE CHECK (slug GLOB '[a-z]*')
);

-- Користувачі
CREATE TABLE users (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  name               TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 50),
  username           TEXT NOT NULL UNIQUE COLLATE NOCASE CHECK (length(username) BETWEEN 3 AND 20),
  email              TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash      TEXT NOT NULL,
  role               TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  favorite_genre_id  INTEGER REFERENCES genres(id) ON DELETE SET NULL,
  created_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Фільми
CREATE TABLE movies (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  original_title  TEXT,
  year            INTEGER NOT NULL CHECK (year BETWEEN 1888 AND 2100),
  duration_min    INTEGER NOT NULL CHECK (duration_min BETWEEN 1 AND 1000),
  country         TEXT,
  director        TEXT,
  description     TEXT,
  poster_url      TEXT,
  genre_id        INTEGER NOT NULL REFERENCES genres(id) ON DELETE RESTRICT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_movies_genre ON movies(genre_id);

-- Актори
CREATE TABLE actors (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 100),
  photo_url  TEXT
);

-- Акторський склад фільму (зв'язок M:N між movies та actors)
CREATE TABLE movie_actors (
  movie_id   INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  actor_id   INTEGER NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
  role_name  TEXT,
  PRIMARY KEY (movie_id, actor_id)
);

-- Відгуки (користувач залишає не більше одного відгуку на фільм)
CREATE TABLE reviews (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  movie_id    INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 10),
  text        TEXT NOT NULL CHECK (length(text) BETWEEN 3 AND 2000),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT,
  UNIQUE (movie_id, user_id)
);
CREATE INDEX idx_reviews_movie ON reviews(movie_id);
