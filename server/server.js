// Точка входу: npm start
const config = require('./config');
const { db } = require('./db');

const hasSchema = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='movies'").get();
if (!hasSchema) {
  console.error('База порожня. Спочатку виконайте: npm run db:init');
  process.exit(1);
}

const app = require('./app');
app.listen(config.port, () => {
  console.log(`Cinemix запущено: http://localhost:${config.port}`);
  console.log(`API: http://localhost:${config.port}/api`);
});
