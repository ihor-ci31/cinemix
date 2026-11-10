// =============================================
// register.js — реєстрація через POST /api/auth/register
// =============================================
(function () {
  const form = document.getElementById('register-form');
  const msg = document.getElementById('register-message');
  const pwd = document.getElementById('password');
  const confirmInput = document.getElementById('confirm');
  const confirmError = document.getElementById('confirm-error');
  const genreSelect = document.getElementById('genre');
  const submitBtn = form.querySelector('[type=submit]');

  if (auth.token) {
    showFormMessage(msg, `Ви вже увійшли як ${auth.user?.username}. Щоб створити інший акаунт, спочатку вийдіть.`, 'success');
  }

  // Жанри — з бази даних (замість статичного списку)
  api.get('/genres').then((genres) => {
    genreSelect.innerHTML = '<option value="" disabled selected>Оберіть жанр</option>' +
      genres.map((g) => `<option value="${escapeHtml(g.slug)}">${escapeHtml(g.name)}</option>`).join('');
  }).catch(() => { /* лишаємо статичний список з ЛР1 */ });

  confirmInput.addEventListener('input', () => {
    if (pwd.value === confirmInput.value) confirmError.style.display = 'none';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showFormMessage(msg, '');
    showFieldErrors(form, null);

    // Клієнтська перевірка (HTML5) — сервер все одно перевіряє все повторно
    if (pwd.value !== confirmInput.value) {
      confirmError.style.display = 'block';
      confirmInput.focus();
      return;
    }
    confirmError.style.display = 'none';
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const body = {
      name: form.name.value,
      username: form.username.value,
      email: form.email.value,
      password: pwd.value,
      genre: genreSelect.value || null,
      terms: form.terms.checked,
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Реєструємо…';
    try {
      const result = await api.post('/auth/register', body);
      auth.save(result);
      window.renderHeader?.();
      showFormMessage(msg, `Акаунт створено! Вітаємо, ${result.user.name}. Переходимо до каталогу…`, 'success');
      form.reset();
      msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { location.href = 'catalog.html'; }, 1200);
    } catch (err) {
      showFormMessage(msg, err.message);
      showFieldErrors(form, err.details);
      msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      submitBtn.disabled = false;
      submitBtn.textContent = 'Зареєструватись';
    }
  });
})();
