// =============================================
// movie.js — сторінка фільму: дані, акторський склад, відгуки (CRUD)
// =============================================
(function () {
  const root = document.getElementById('movie-root');
  const crumb = document.getElementById('crumb-title');
  const castSection = document.getElementById('cast-section');
  const castGrid = document.getElementById('cast-grid');
  const reviewsSection = document.getElementById('reviews-section');
  const reviewsList = document.getElementById('reviews-list');
  const formBox = document.getElementById('review-form-box');

  const movieId = Number(new URLSearchParams(location.search).get('id'));
  let reviews = [];
  let editingId = null;

  function formatDuration(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h ? `${h} год ${m} хв` : `${m} хв`;
  }

  function renderMovie(m) {
    document.title = `${m.title} — Cinemix`;
    crumb.textContent = m.title;
    const original = [m.original_title, `(${m.year})`].filter(Boolean).join(' ');
    const meta = [
      ['Рік', m.year],
      ['Тривалість', formatDuration(m.duration_min)],
      ['Країна', m.country],
      ['Режисер', m.director],
      ['Жанр', m.genre.name],
    ].filter(([, v]) => v);

    root.removeAttribute('aria-busy');
    root.innerHTML = `
      <div class="movie-hero-inner">
        <div class="movie-poster">
          <img src="${escapeHtml(safeUrl(m.poster_url))}" alt="Постер фільму ${escapeHtml(m.title)}" width="280" height="420">
        </div>
        <div class="movie-info">
          <a class="movie-genre-badge" href="catalog.html?genre=${encodeURIComponent(m.genre.slug)}">${escapeHtml(m.genre.name)}</a>
          <h1 class="movie-title">${escapeHtml(m.title)}</h1>
          <p class="movie-original">${escapeHtml(original)}</p>
          <div class="movie-rating-big" id="rating-box"></div>
          <div class="movie-meta-list">
            ${meta.map(([label, value]) => `
              <div class="meta-item">
                <div class="meta-label">${label}</div>
                <div class="meta-value">${escapeHtml(value)}</div>
              </div>`).join('')}
          </div>
          <p class="movie-description">${escapeHtml(m.description || 'Опис поки відсутній.')}</p>
          <div class="movie-actions">
            <a href="#reviews-section" class="btn btn-outline">Написати відгук</a>
            ${auth.isAdmin ? `<a href="admin.html?edit=${m.id}" class="btn btn-ghost">Редагувати фільм</a>` : ''}
          </div>
        </div>
      </div>`;
    renderRating();

    if (m.cast?.length) {
      castSection.hidden = false;
      castGrid.innerHTML = m.cast.map((a) => `
        <div class="cast-card">
          <div class="cast-photo"><img src="${escapeHtml(safeUrl(a.photo_url))}" alt="${escapeHtml(a.name)}" width="80" height="80" loading="lazy"></div>
          <div class="cast-name">${escapeHtml(a.name)}</div>
          <div class="cast-role">${escapeHtml(a.role_name || '')}</div>
        </div>`).join('');
    }
  }

  // Рейтинг рахується з актуальних відгуків
  function renderRating() {
    const box = document.getElementById('rating-box');
    if (!box) return;
    if (!reviews.length) {
      box.innerHTML = '<div class="rating-count">Оцінок ще немає — будьте першим</div>';
      return;
    }
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    box.innerHTML = `
      <span class="rating-score">${avg.toFixed(1)}</span>
      <div>
        <div class="rating-stars" aria-label="Рейтинг ${avg.toFixed(1)} з 10">${stars(avg)}</div>
        <div class="rating-count">${reviews.length} ${plural(reviews.length, ['оцінка', 'оцінки', 'оцінок'])}</div>
      </div>`;
  }

  function plural(n, forms) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return forms[0];
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1];
    return forms[2];
  }

  function canEdit(r) {
    const u = auth.user;
    return auth.token && u && (u.role === 'admin' || u.id === r.user.id);
  }

  function reviewHtml(r) {
    const initial = (r.user.name || r.user.username || '?').trim().charAt(0).toUpperCase();
    return `<article class="review-card" data-id="${r.id}">
        <div class="review-header">
          <div class="review-avatar" aria-hidden="true">${escapeHtml(initial)}</div>
          <div>
            <h3 class="review-name">${escapeHtml(r.user.username)}</h3>
            <div class="review-date">${formatDate(r.created_at)}${r.updated_at ? ' · змінено' : ''}</div>
          </div>
          <div class="review-stars">${stars(r.rating)} ${r.rating}/10</div>
        </div>
        <p class="review-text">${escapeHtml(r.text)}</p>
        ${canEdit(r) ? `<div class="review-actions">
            <button type="button" class="btn btn-ghost btn-sm" data-action="edit">Редагувати</button>
            <button type="button" class="btn btn-danger btn-sm" data-action="delete">Видалити</button>
          </div>` : ''}
      </article>`;
  }

  function renderReviews() {
    renderRating();
    if (!reviews.length) {
      showEmpty(reviewsList, 'Відгуків поки немає.');
    } else {
      reviewsList.removeAttribute('aria-busy');
      reviewsList.innerHTML = reviews.map(reviewHtml).join('');
    }
    renderForm();
  }

  function renderForm() {
    if (!auth.token) {
      formBox.innerHTML = `<p class="review-login-note"><a href="login.html?next=${encodeURIComponent(location.pathname.split('/').pop() + location.search)}">Увійдіть</a>, щоб залишити відгук.</p>`;
      return;
    }
    const mine = reviews.find((r) => r.user.id === auth.user?.id);
    const editing = editingId ? reviews.find((r) => r.id === editingId) : null;
    if (mine && !editing) {
      formBox.innerHTML = '<p class="review-login-note">Ви вже оцінили цей фільм. Свій відгук можна змінити нижче.</p>';
      return;
    }
    const r = editing || { rating: '', text: '' };
    formBox.innerHTML = `
      <form class="review-form" id="review-form" novalidate>
        <h3>${editing ? 'Редагувати відгук' : 'Ваш відгук'}</h3>
        <div class="form-message" id="review-message" hidden></div>
        <div class="form-group">
          <label for="rv-rating">Оцінка</label>
          <select id="rv-rating" name="rating" required>
            <option value="" disabled ${r.rating === '' ? 'selected' : ''}>Оберіть від 1 до 10</option>
            ${Array.from({ length: 10 }, (_, i) => 10 - i).map((n) => `<option value="${n}" ${n === r.rating ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="rv-text">Текст відгуку</label>
          <textarea id="rv-text" name="text" required minlength="3" maxlength="2000" placeholder="Що вам сподобалось чи ні?">${escapeHtml(r.text)}</textarea>
        </div>
        <div class="review-form-actions">
          <button type="submit" class="btn btn-primary">${editing ? 'Зберегти' : 'Опублікувати'}</button>
          ${editing ? '<button type="button" class="btn btn-ghost" id="cancel-edit">Скасувати</button>' : ''}
        </div>
      </form>`;

    const form = document.getElementById('review-form');
    const msg = document.getElementById('review-message');
    document.getElementById('cancel-edit')?.addEventListener('click', () => { editingId = null; renderForm(); });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = { rating: Number(form.rating.value) || null, text: form.text.value };
      const btn = form.querySelector('[type=submit]');
      btn.disabled = true;
      btn.textContent = 'Надсилаємо…';
      showFormMessage(msg, '');
      showFieldErrors(form, null);
      try {
        if (editing) {
          const updated = await api.patch(`/reviews/${editing.id}`, body);
          reviews = reviews.map((x) => (x.id === updated.id ? updated : x));
          editingId = null;
        } else {
          const created = await api.post(`/movies/${movieId}/reviews`, body);
          reviews = [created, ...reviews];
        }
        renderReviews();
      } catch (err) {
        btn.disabled = false;
        btn.textContent = editing ? 'Зберегти' : 'Опублікувати';
        showFormMessage(msg, err.status === 401 ? 'Сесія завершилась — увійдіть знову.' : err.message);
        showFieldErrors(form, err.details);
      }
    });
  }

  reviewsList.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = Number(btn.closest('.review-card').dataset.id);
    if (btn.dataset.action === 'edit') {
      editingId = id;
      renderForm();
      formBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (!confirm('Видалити цей відгук?')) return;
    btn.disabled = true;
    try {
      await api.del(`/reviews/${id}`);
      reviews = reviews.filter((r) => r.id !== id);
      if (editingId === id) editingId = null;
      renderReviews();
    } catch (err) {
      btn.disabled = false;
      alert(err.message);
    }
  });

  async function load() {
    if (!Number.isInteger(movieId) || movieId < 1) {
      showError(root, { message: 'Фільм не вказано. Оберіть його в каталозі.' });
      return;
    }
    showLoading(root, 'Завантажуємо фільм…');
    try {
      const [movie, list] = await Promise.all([
        api.get(`/movies/${movieId}`),
        api.get(`/movies/${movieId}/reviews`),
      ]);
      reviews = list;
      renderMovie(movie);
      reviewsSection.hidden = false;
      renderReviews();
    } catch (err) {
      if (err.status === 404) {
        crumb.textContent = 'Не знайдено';
        showError(root, { message: 'Такого фільму немає в каталозі.' });
      } else {
        showError(root, err, load);
      }
    }
  }

  load();
})();
