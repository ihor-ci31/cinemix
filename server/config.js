// Конфігурація з .env
require('dotenv').config({ path: require('node:path').resolve(__dirname, '..', '.env'), quiet: true });

const config = {
  port: Number(process.env.PORT) || 3000,
  dbFile: process.env.DB_FILE || 'data/cinemix.db',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@cinemix.local',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin12345',
};

if (!config.jwtSecret) {
  console.error('Помилка: не задано JWT_SECRET. Скопіюйте .env.example у .env і вкажіть секрет.');
  process.exit(1);
}

module.exports = config;
