// Простий валідатор вхідних даних: тип, обов'язковість, межі значень.
// Схема: { field: { type, required, min, max, minLength, maxLength, pattern, enum, label } }
// partial = true — для PATCH (перевіряються лише передані поля).
const { HttpError } = require('../middleware/errors');

function validate(body, schema, { partial = false } = {}) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Тіло запиту має бути JSON-об\'єктом');
  }
  const errors = {};
  const clean = {};

  for (const [field, rule] of Object.entries(schema)) {
    const label = rule.label || field;
    let value = body[field];
    const missing = value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

    if (missing) {
      if (rule.required && !partial) errors[field] = `Поле «${label}» обов'язкове`;
      else if (field in body && !rule.required) clean[field] = null; // явне очищення необов'язкового поля
      else if (field in body && rule.required) errors[field] = `Поле «${label}» не може бути порожнім`;
      continue;
    }

    if (rule.type === 'string') {
      if (typeof value !== 'string') { errors[field] = `Поле «${label}» має бути рядком`; continue; }
      value = value.trim();
      if (rule.minLength && value.length < rule.minLength) { errors[field] = `Поле «${label}»: мінімум ${rule.minLength} символів`; continue; }
      if (rule.maxLength && value.length > rule.maxLength) { errors[field] = `Поле «${label}»: максимум ${rule.maxLength} символів`; continue; }
      if (rule.pattern && !rule.pattern.test(value)) { errors[field] = rule.patternMessage || `Поле «${label}» має неправильний формат`; continue; }
      if (rule.enum && !rule.enum.includes(value)) { errors[field] = `Поле «${label}» має бути одним із: ${rule.enum.join(', ')}`; continue; }
    } else if (rule.type === 'integer') {
      if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) value = Number(value);
      if (!Number.isInteger(value)) { errors[field] = `Поле «${label}» має бути цілим числом`; continue; }
      if (rule.min !== undefined && value < rule.min) { errors[field] = `Поле «${label}» має бути не менше ${rule.min}`; continue; }
      if (rule.max !== undefined && value > rule.max) { errors[field] = `Поле «${label}» має бути не більше ${rule.max}`; continue; }
    } else if (rule.type === 'boolean') {
      if (typeof value !== 'boolean') { errors[field] = `Поле «${label}» має бути true або false`; continue; }
    } else if (rule.type === 'url') {
      if (typeof value !== 'string' || !/^https?:\/\/\S+$/i.test(value.trim()) || value.length > 2000) {
        errors[field] = `Поле «${label}» має бути посиланням http(s)`; continue;
      }
      value = value.trim();
    }
    clean[field] = value;
  }

  if (Object.keys(errors).length) throw new HttpError(400, 'Помилка валідації', errors);
  if (partial && Object.keys(clean).length === 0) throw new HttpError(400, 'Не передано жодного поля для оновлення');
  return clean;
}

// Перевірка параметра :id
function parseId(value, label = 'id') {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, `Некоректний ${label}: має бути додатним цілим числом`);
  return id;
}

module.exports = { validate, parseId };
