// =============================================
// catalog.js — каталог: жанри, пошук і фільми з API
// =============================================
(function () {
  const grid = document.getElementById('movies-grid');
  const filters = document.getElementById('genre-filters');
  const form = document.getElementById('search-form');
  const input = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  const summary = document.getElementById('catalog-summary');

  const params = new URLSearchParams(location.search);
  const state = {
    genre: params.get('genre') || '',
    q: params.get('q') || '',
    sort: params.get('sort') || 'title',
  };
  input.value = state.q;
  sortSelect.value = state.sort;

  function syncUrl() {
    const p = new URLSearchParams();
    if (state.genre) p.set('genre', state.genre);
    if (state.q) p.set('q', state.q);
    if (state.sort !== 'title') p.set('sort', state.sort);
    history.replaceState(null, '', p.toString() ? `?${p}` : location.pathname);
  }

  function renderFilters(genres) {
    const buttons = [{ slug: '', name: 'Всі', movies_count: null }, ...genres.filter((g) => g.movies_count > 0)];
    filters.innerHTML = buttons.map((g) => `
      <button type="button" class="filter-btn${g.slug === state.genre ? ' active' : ''}" data-genre="${escapeHtml(g.slug)}"
        aria-pressed="${g.slug === state.genre}">${escapeHtml(g.name)}${g.movies_count ? ` <small>${g.movies_count}</small>` : ''}</button>`).join('');
  }

  filters.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    state.genre = btn.dataset.genre;
    filters.querySelectorAll('.filter-btn').forEach((b) => {
      const on = b === btn;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    loadMovies();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.q = input.value.trim();
    loadMovies();
  });

  sortSelect.addEventListener('change', () => {
    state.sort = sortSelect.value;
    loadMovies();
  });

  let requestId = 0;
  async function loadMovies() {
    syncUrl();
    const current = ++requestId;
    showLoading(grid, 'Завантажуємо фільми…');
    summary.textContent = '';
    const p = new URLSearchParams({ sort: state.sort, limit: '100' });
    if (state.genre) p.set('genre', state.genre);
    if (state.q) p.set('q', state.q);
    try {
      const data = await api.get(`/movies?${p}`);
      if (current !== requestId) return; // відповідь на застарілий запит
      grid.removeAttribute('aria-busy');
      if (!data.items.length) {
        showEmpty(grid, state.q ? `За запитом «${state.q}» нічого не знайдено.` : 'У цьому жанрі поки немає фільмів.');
        return;
      }
      summary.textContent = `Знайдено фільмів: ${data.total}`;
      grid.innerHTML = data.items.map((m) => movieCardHtml(m)).join('');
    } catch (err) {
      if (current === requestId) showError(grid, err, loadMovies);
    }
  }

  async function loadGenres() {
    try {
      renderFilters(await api.get('/genres'));
    } catch {
      filters.innerHTML = '<span class="field-error">Не вдалося завантажити жанри</span>';
    }
  }

  loadGenres();
  loadMovies();
})();
