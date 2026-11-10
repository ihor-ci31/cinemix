// Помилки HTTP та обробники 404 / 500

class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// 404 для невідомих маршрутів API
function notFound(req, res) {
  res.status(404).json({ error: `Маршрут ${req.method} ${req.originalUrl} не знайдено` });
}

// Єдиний формат відповіді з помилкою: { error, details? }
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Некоректний JSON у тілі запиту
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некоректний JSON у тілі запиту' });
  }
  if (err instanceof HttpError) {
    const body = { error: err.message };
    if (err.details) body.details = err.details;
    return res.status(err.status).json(body);
  }
  // Порушення обмежень SQLite (UNIQUE / FOREIGN KEY / CHECK), які не перехопила валідація
  if (err.code === 'ERR_SQLITE_ERROR' && /constraint/i.test(err.message)) {
    return res.status(409).json({ error: 'Порушено обмеження цілісності даних', details: { db: err.message } });
  }
  console.error(err);
  res.status(500).json({ error: 'Внутрішня помилка сервера' });
}

module.exports = { HttpError, notFound, errorHandler };
