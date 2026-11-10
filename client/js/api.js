// =============================================
// api.js — звернення до REST API через fetch
// =============================================
const API_BASE = '/api';
const TOKEN_KEY = 'cinemix_token';
const USER_KEY = 'cinemix_user';

class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details || null;
  }
}

const auth = {
  get token() { return localStorage.getItem(TOKEN_KEY); },
  get user() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  },
  save({ token, user }) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  setUser(user) { localStorage.setItem(USER_KEY, JSON.stringify(user)); },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  get isAdmin() { return this.user?.role === 'admin'; },
};

async function request(method, path, body) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth.token) headers.Authorization = `Bearer ${auth.token}`;

  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Сервер недоступний. Перевірте, що його запущено, і спробуйте ще раз.');
  }

  if (res.status === 204) return null;
  let data = null;
  try { data = await res.json(); } catch { /* тіло не JSON */ }

  if (!res.ok) {
    // Токен прострочений — виходимо з акаунта
    if (res.status === 401 && auth.token) auth.clear();
    throw new ApiError(res.status, data?.error || `Помилка ${res.status}`, data?.details);
  }
  return data;
}

const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body ?? {}),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  del: (path) => request('DELETE', path),
};

// --- Допоміжні функції для рендерингу ---
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Безпечне посилання на зображення (лише http/https або відносний шлях)
function safeUrl(url, fallback = 'img/no-poster.svg') {
  return /^(https?:\/\/|\/|img\/)/i.test(url || '') ? url : fallback;
}

function showLoading(el, text = 'Завантаження…') {
  el.setAttribute('aria-busy', 'true');
  el.innerHTML = `<div class="state state-loading" role="status"><span class="spinner" aria-hidden="true"></span>${escapeHtml(text)}</div>`;
}

function showError(el, err, onRetry) {
  el.removeAttribute('aria-busy');
  el.innerHTML = `<div class="state state-error" role="alert">
      <p>${escapeHtml(err.message || 'Щось пішло не так')}</p>
      ${onRetry ? '<button type="button" class="btn btn-outline">Спробувати ще</button>' : ''}
    </div>`;
  if (onRetry) el.querySelector('button').addEventListener('click', onRetry);
}

function showEmpty(el, text) {
  el.removeAttribute('aria-busy');
  el.innerHTML = `<div class="state state-empty">${escapeHtml(text)}</div>`;
}

function formatDate(sqlDate) {
  const d = new Date(String(sqlDate).replace(' ', 'T') + 'Z');
  return isNaN(d) ? '' : d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
}

function stars(rating10) {
  const full = Math.round((rating10 || 0) / 2);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

// Картка фільму (та сама розмітка, що й у ЛР1)
function movieCardHtml(m, headingTag = 'h2') {
  const rating = m.rating != null ? `★ ${Number(m.rating).toFixed(1)}` : '★ —';
  return `<article class="movie-card">
      <div class="card-poster">
        <img src="${escapeHtml(safeUrl(m.poster_url))}" alt="Постер фільму ${escapeHtml(m.title)}" loading="lazy">
        <span class="card-genre">${escapeHtml(m.genre.name)}</span>
      </div>
      <div class="card-body">
        <${headingTag} class="card-title">${escapeHtml(m.title)}</${headingTag}>
        <div class="card-meta">
          <span class="card-rating">${rating}</span>
          <span>${m.year}</span>
          <span>${m.duration_min} хв</span>
        </div>
      </div>
      <div class="card-footer"><a href="movie.html?id=${m.id}">Детальніше</a></div>
    </article>`;
}

// Показати помилки валідації від сервера під полями форми
function showFieldErrors(form, details) {
  form.querySelectorAll('.field-error').forEach((e) => e.remove());
  form.querySelectorAll('[aria-invalid]').forEach((e) => e.removeAttribute('aria-invalid'));
  if (!details) return;
  for (const [field, message] of Object.entries(details)) {
    const input = form.elements[field];
    const target = input?.closest('.form-group, .form-check');
    if (!target) continue;
    input.setAttribute('aria-invalid', 'true');
    const span = document.createElement('span');
    span.className = 'field-error';
    span.textContent = message;
    target.appendChild(span);
  }
}

function showFormMessage(el, text, type = 'error') {
  el.textContent = text;
  el.className = `form-message form-message-${type}`;
  el.hidden = !text;
}
