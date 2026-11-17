// Offline admin: foydalanuvchilar localStorage da
(function () {
  const USERS_KEY = 'mlbb_users_db';
  const VISITS_KEY = 'mlbb_visits';
  const ONLINE_KEY = 'mlbb_online_ping';

  function loadUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
  }
  function saveUsers(list) {
    localStorage.setItem(USERS_KEY, JSON.stringify(list));
  }

  // Ro'yxatga qo'shish / yangilash
  window.mlbbRegisterUser = function (user) {
    const list = loadUsers();
    const exists = list.find(u => u.email === user.email);
    if (exists) {
      exists.lastLogin = new Date().toISOString();
      exists.username = user.username || exists.username;
    } else {
      list.push({
        id: user.id || ('u_' + Date.now()),
        email: user.email,
        username: user.username,
        role: user.role || 'user',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });
    }
    saveUsers(list);
    return list.length;
  };

  window.mlbbGetStats = function () {
    const users = loadUsers();
    const visits = parseInt(localStorage.getItem(VISITS_KEY) || '0', 10);
    // Online: oxirgi 5 daqiqada ping yuborganlar
    let online = 0;
    try {
      const pings = JSON.parse(localStorage.getItem(ONLINE_KEY) || '{}');
      const now = Date.now();
      online = Object.values(pings).filter(t => now - t < 5 * 60 * 1000).length;
    } catch {}
    return {
      totalUsers: users.length,
      visits,
      online: Math.max(online, users.length ? 1 : 0),
      users: users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    };
  };

  // Tashrif hisobi
  (function trackVisit() {
    const key = 'mlbb_visited_session';
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      const v = parseInt(localStorage.getItem(VISITS_KEY) || '0', 10) + 1;
      localStorage.setItem(VISITS_KEY, String(v));
    }
    // Online ping
    try {
      const uid = (JSON.parse(localStorage.getItem('mlbb_user') || 'null') || {}).id || 'guest_' + (sessionStorage.getItem('gid') || (sessionStorage.setItem('gid', Date.now()), sessionStorage.getItem('gid')));
      const pings = JSON.parse(localStorage.getItem(ONLINE_KEY) || '{}');
      pings[uid] = Date.now();
      localStorage.setItem(ONLINE_KEY, JSON.stringify(pings));
    } catch {}
  })();
})();
