// Express-застосунок: API + статичний клієнт
const path = require('node:path');
const express = require('express');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

// --- REST API ---
const api = express.Router();
api.get('/health', (req, res) => res.json({ status: 'ok' }));
api.use('/genres', require('./routes/genres'));
api.use('/movies', require('./routes/movies'));
api.use('/reviews', require('./routes/reviews'));
api.use('/stats', require('./routes/stats'));
api.use(notFound);
app.use('/api', api);

// --- Клієнт (сторінки з ЛР1) ---
app.use(express.static(path.join(__dirname, '..', 'client'), { extensions: ['html'] }));

app.use(errorHandler);

module.exports = app;
