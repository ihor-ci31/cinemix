// =============================================
// admin.js — CRUD фільмів для адміністратора
// =============================================
(function () {
  const guard = document.getElementById('admin-guard');
  const layout = document.getElementById('admin-layout');
  const form = document.getElementById('movie-form');
  const formTitle = document.getElementById('movie-form-title');
  const msg = document.getElementById('movie-message');
  const submitBtn = document.getElementById('movie-submit');
  const cancelBtn = document.getElementById('movie-cancel');
  const table = document.getElementById('movies-table');
  const genreSelect = document.getElementById('f-genre');

  const FIELDS = ['title', 'original_title', 'year', 'duration_min', 'genre_id', 'country', 'director', 'poster_url', 'description'];
  let movies = [];
  let editingId = null;

  if (!auth.token) {
    guard.innerHTML = '<div class="state state-error" role="alert"><p>Сторінка доступна лише адміністратору.</p><a class="btn btn-primary" href="login.html?next=admin.html">Увійти</a></div>';
    return;
  }
  if (!auth.isAdmin) {
    guard.innerHTML = '<div class="state state-error" role="alert"><p>Недостатньо прав: потрібна роль адміністратора.</p></div>';
    return;
  }
  layout.hidden = false;

  function renderTable() {
    if (!movies.length) return showEmpty(table, 'Фільмів немає. Додайте перший.');
    table.removeAttribute('aria-busy');
    table.innerHTML = `
      <table class="admin-table">
        <thead><tr><th>Назва</th><th class="col-hide">Рік</th><th class="col-hide">Жанр</th><th class="col-hide">Рейтинг</th><th><span class="visually-hidden">Дії</span></th></tr></thead>
        <tbody>
          ${movies.map((m) => `
            <tr data-id="${m.id}" class="${m.id === editingId ? 'is-editing' : ''}">
              <td><a href="movie.html?id=${m.id}">${escapeHtml(m.title)}</a></td>
              <td class="col-hide">${m.year}</td>
              <td class="col-hide">${escapeHtml(m.genre.name)}</td>
              <td class="col-hide">${m.rating != null ? Number(m.rating).toFixed(1) : '—'}</td>
              <td><div class="row-actions">
                <button type="button" class="btn btn-ghost btn-sm" data-action="edit">Змінити</button>
                <button type="button" class="btn btn-danger btn-sm" data-action="delete">Видалити</button>
              </div></td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  }

  async function loadMovies() {
    showLoading(table, 'Завантажуємо фільми…');
    try {
      movies = (await api.get('/movies?sort=new&limit=100')).items;
      renderTable();
    } catch (err) {
      showError(table, err, loadMovies);
    }
  }

  async function loadGenres() {
    const genres = await api.get('/genres');
    genreSelect.innerHTML = '<option value="" disabled selected>Оберіть жанр</option>' +
      genres.map((g) => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join('');
  }

  function resetForm() {
    editingId = null;
    form.reset();
    formTitle.textContent = 'Новий фільм';
    submitBtn.textContent = 'Створити';
    cancelBtn.hidden = true;
    showFieldErrors(form, null);
    renderTable();
  }

  async function startEdit(id) {
    showFormMessage(msg, '');
    showFieldErrors(form, null);
    try {
      const m = await api.get(`/movies/${id}`);
      editingId = id;
      for (const f of FIELDS) form.elements[f].value = f === 'genre_id' ? m.genre.id : (m[f] ?? '');
      formTitle.textContent = `Редагування: ${m.title}`;
      submitBtn.textContent = 'Зберегти зміни';
      cancelBtn.hidden = false;
      renderTable();
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      showFormMessage(msg, err.message);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showFormMessage(msg, '');
    showFieldErrors(form, null);

    const body = {};
    for (const f of FIELDS) {
      const v = form.elements[f].value.trim();
      body[f] = ['year', 'duration_min', 'genre_id'].includes(f) ? (v === '' ? null : Number(v)) : (v || null);
    }

    submitBtn.disabled = true;
    try {
      if (editingId) {
        const updated = await api.put(`/movies/${editingId}`, body); // повна заміна ресурсу
        showFormMessage(msg, `Зміни у «${updated.title}» збережено.`, 'success');
      } else {
        const created = await api.post('/movies', body);
        showFormMessage(msg, `Фільм «${created.title}» створено (id ${created.id}).`, 'success');
      }
      resetForm();
      await loadMovies();
    } catch (err) {
      showFormMessage(msg, err.status === 403 ? 'Недостатньо прав.' : err.message);
      showFieldErrors(form, err.details);
    } finally {
      submitBtn.disabled = false;
    }
  });

  cancelBtn.addEventListener('click', () => { showFormMessage(msg, ''); resetForm(); });

  table.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = Number(btn.closest('tr').dataset.id);
    if (btn.dataset.action === 'edit') return startEdit(id);

    const movie = movies.find((m) => m.id === id);
    if (!confirm(`Видалити фільм «${movie?.title}»? Відгуки до нього теж буде видалено.`)) return;
    btn.disabled = true;
    try {
      await api.del(`/movies/${id}`);
      showFormMessage(msg, `Фільм «${movie?.title}» видалено.`, 'success');
      if (editingId === id) resetForm();
      await loadMovies();
    } catch (err) {
      btn.disabled = false;
      showFormMessage(msg, err.message);
    }
  });

  loadGenres()
    .then(() => {
      const editParam = Number(new URLSearchParams(location.search).get('edit'));
      if (editParam) startEdit(editParam);
    })
    .catch((err) => showFormMessage(msg, `Не вдалося завантажити жанри: ${err.message}`));
  loadMovies();
})();
