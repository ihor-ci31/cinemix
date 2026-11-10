// Підключення до SQLite (вбудований модуль node:sqlite)
const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');
const config = require('./config');

const file = path.resolve(__dirname, '..', config.dbFile);
fs.mkdirSync(path.dirname(file), { recursive: true });

const db = new DatabaseSync(file);
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');
// Вбудовані LOWER/LIKE в SQLite не знають кирилиці — додаємо власну функцію для пошуку
db.function('ulower', { deterministic: true }, (s) => (s == null ? null : String(s).toLowerCase()));

// Виконати функцію в транзакції
function transaction(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

module.exports = { db, transaction, file };
