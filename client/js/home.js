// =============================================
// home.js — головна: статистика, нові надходження, жанри
// =============================================
(function () {
  const newMovies = document.getElementById('new-movies');
  const genresGrid = document.getElementById('genres-grid');
  const icons = { scifi: '🚀', comedy: '😂', horror: '😱', drama: '🎭', action: '💥', detective: '🕵️', romance: '❤️', animation: '🎬', thriller: '🔪' };

  function plural(n, forms) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return forms[0];
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1];
    return forms[2];
  }

  async function loadStats() {
    try {
      const stats = await api.get('/stats');
      document.querySelectorAll('[data-stat]').forEach((el) => { el.textContent = stats[el.dataset.stat]; });
    } catch {
      document.querySelectorAll('[data-stat]').forEach((el) => { el.textContent = '—'; });
    }
  }

  async function loadNew() {
    showLoading(newMovies, 'Завантажуємо новинки…');
    try {
      const { items } = await api.get('/movies?sort=new&limit=3');
      if (!items.length) return showEmpty(newMovies, 'Фільмів поки немає.');
      newMovies.removeAttribute('aria-busy');
      newMovies.innerHTML = items.map((m) => movieCardHtml(m, 'h3')).join('');
    } catch (err) {
      showError(newMovies, err, loadNew);
    }
  }

  async function loadGenres() {
    showLoading(genresGrid, 'Завантажуємо жанри…');
    try {
      const genres = await api.get('/genres');
      genresGrid.removeAttribute('aria-busy');
      genresGrid.innerHTML = genres.map((g) => `
        <a href="catalog.html?genre=${encodeURIComponent(g.slug)}" class="genre-card">
          <div class="genre-icon" aria-hidden="true">${icons[g.slug] || '🎞️'}</div>
          <div class="genre-name">${escapeHtml(g.name)}</div>
          <div class="genre-count">${g.movies_count} ${plural(g.movies_count, ['фільм', 'фільми', 'фільмів'])}</div>
        </a>`).join('');
    } catch (err) {
      showError(genresGrid, err, loadGenres);
    }
  }

  loadStats();
  loadNew();
  loadGenres();
})();
