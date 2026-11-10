// =============================================
// login.js — вхід через POST /api/auth/login
// =============================================
(function () {
  const form = document.getElementById('login-form');
  const msg = document.getElementById('login-message');
  const submitBtn = form.querySelector('[type=submit]');

  // Куди повернутися після входу (лише відносна сторінка цього сайту)
  const next = new URLSearchParams(location.search).get('next');
  const target = next && /^[a-z]+\.html(\?[\w=&%-]*)?$/i.test(next) ? next : 'index.html';

  if (auth.token) showFormMessage(msg, `Ви вже увійшли як ${auth.user?.username}.`, 'success');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showFormMessage(msg, '');
    showFieldErrors(form, null);
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Входимо…';
    try {
      const result = await api.post('/auth/login', { login: form.login.value, password: form.password.value });
      auth.save(result);
      location.href = target;
    } catch (err) {
      showFormMessage(msg, err.message);
      showFieldErrors(form, err.details);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Увійти';
    }
  });
})();
