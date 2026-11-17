// Shared UI helpers

function toast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span>${escapeHtml(message)}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(100%)';
    el.style.transition = 'all 0.3s';
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function initSidebar() {
  const toggle = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  if (!toggle || !sidebar) return;

  function close() {
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  }
  function open() {
    sidebar.classList.add('open');
    if (overlay) overlay.classList.add('open');
  }

  toggle.addEventListener('click', () => {
    if (sidebar.classList.contains('open')) close();
    else open();
  });
  if (overlay) overlay.addEventListener('click', close);

  // Active link
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href.endsWith(path) || (path === '' && href.includes('index'))) {
      link.classList.add('active');
    }
  });
}

function initAuthUI() {
  const user = getUser();
  const authArea = document.querySelector('.auth-area');
  if (!authArea) return;

  if (user) {
    authArea.innerHTML = `
      <span class="text-muted" style="font-size:0.85rem">${escapeHtml(user.username)}</span>
      <button class="btn btn-secondary btn-sm" id="logoutBtn">Chiqish</button>
    `;
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      clearAuth();
      toast('Chiqdingiz');
      location.href = 'index.html';
    });
  } else {
    authArea.innerHTML = `
      <a href="login.html" class="btn btn-secondary btn-sm">Kirish</a>
      <a href="register.html" class="btn btn-primary btn-sm">Ro'yxat</a>
    `;
  }
}

function roleBadge(role) {
  const map = {
    Tank: 'badge-primary',
    Fighter: 'badge-s',
    Assassin: 'badge-danger',
    Mage: 'badge-accent',
    Marksman: 'badge-success',
    Support: 'badge-primary'
  };
  return `<span class="badge ${map[role] || 'badge-primary'}">${role || '?'}</span>`;
}

function tierBadge(tier) {
  if (!tier) return '';
  const map = { 'S+': 'badge-s', 'S': 'badge-s', 'A': 'badge-a', 'B': 'badge-b', 'C': 'badge-b' };
  return `<span class="badge ${map[tier] || 'badge-b'}">${tier}</span>`;
}

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initAuthUI();
});
