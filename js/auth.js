// ── 認證邏輯 ──────────────────────────────────────────
(function() {
  const PWD = '53251954';
  const KEY = 'ww_auth';
  const EMPLOYEE_PWD = '820626';
  const EMPLOYEE_KEY = 'ww_employee_auth';

  function isAuthed() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY));
      return d && d.ok === true;
    } catch { return false; }
  }
  function isEmployee() {
    try {
      const d = JSON.parse(localStorage.getItem(EMPLOYEE_KEY));
      return d && d.ok === true;
    } catch { return false; }
  }
  function checkAuth() {
    const val = document.getElementById('auth-input').value;
    if (val === PWD) {
      localStorage.setItem(KEY, JSON.stringify({ ok: true }));
      localStorage.removeItem(EMPLOYEE_KEY);
      document.getElementById('auth-overlay').classList.add('hidden');document.getElementById('auth-overlay').classList.remove('flex');
      document.getElementById('auth-input').value = '';
    } else if (val === EMPLOYEE_PWD) {
      localStorage.setItem(EMPLOYEE_KEY, JSON.stringify({ ok: true }));
      localStorage.removeItem(KEY);
      document.getElementById('auth-overlay').classList.add('hidden');document.getElementById('auth-overlay').classList.remove('flex');
      document.getElementById('auth-input').value = '';
      applyEmployeeMode();
    } else {
      const err = document.getElementById('auth-error');
      err.textContent = '密碼錯誤，請再試一次';
      document.getElementById('auth-input').value = '';
      document.getElementById('auth-input').focus();
      setTimeout(() => err.textContent = '', 3000);
    }
  }
  function applyEmployeeMode() {
    window._employeeMode = true;
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.style.display = btn.dataset.tab === 'cod' ? '' : 'none';
    });
    const headerBtns = document.querySelector('.header-inner .no-print');
    if (headerBtns) headerBtns.style.display = 'none';
    if (typeof switchTab === 'function') switchTab('cod');
  }
  window.checkAuth = checkAuth;
  window.isEmployeeMode = function() { return !!window._employeeMode; };

  if (isEmployee()) {
    document.getElementById('auth-overlay').classList.add('hidden');document.getElementById('auth-overlay').classList.remove('flex');
    window._employeeMode = true;
    document.addEventListener('DOMContentLoaded', applyEmployeeMode);
    if (document.readyState !== 'loading') applyEmployeeMode();
  } else if (isAuthed()) {
    document.getElementById('auth-overlay').classList.add('hidden');document.getElementById('auth-overlay').classList.remove('flex');
  } else {
    document.getElementById('auth-overlay').classList.remove('hidden');document.getElementById('auth-overlay').classList.add('flex');
    setTimeout(() => document.getElementById('auth-input').focus(), 100);
  }
})();
