// =============================================
// layout.js — бургер-меню та стан входу в шапці
// =============================================
(function () {
  const burger = document.getElementById('burger');
  const nav = document.getElementById('main-nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
  }

  const actions = document.querySelector('.header-actions');
  if (!actions) return;

  function render() {
    const user = auth.user;
    if (!auth.token || !user) {
      actions.innerHTML = `
        <a href="login.html" class="btn btn-ghost">Увійти</a>
        <a href="register.html" class="btn btn-primary">Приєднатись</a>`;
      return;
    }
    actions.innerHTML = `
      ${user.role === 'admin' ? '<a href="admin.html" class="btn btn-ghost btn-sm">Адмінка</a>': ''}
      <span class="header-user" title="${escapeHtml(user.email)}">${escapeHtml(user.username)}</span>
      <button type="button" class="btn btn-outline btn-sm" id="logout-btn">Вийти</button>`;
    document.getElementById('logout-btn').addEventListener('click', () => {
      auth.clear();
      window.location.reload();
    });
  }

  render();
  window.renderHeader = render;

  // Перевіряємо токен на сервері (stateless JWT): якщо прострочений — виходимо
  if (auth.token) {
    api.get('/auth/me')
      .then((user) => { auth.setUser(user); render(); })
      .catch((err) => { if (err.status === 401) render(); });
  }
})();
