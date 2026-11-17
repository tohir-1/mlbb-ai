// Offline mode - backend kerak emas (frontend-only)
const DATA = () => window.MLBB_DATA || { heroes: [], items: [], builds: [], counters: {}, meta: {} };

function getToken() { return localStorage.getItem('mlbb_token'); }
function setAuth(token, user) {
  localStorage.setItem('mlbb_token', token);
  localStorage.setItem('mlbb_user', JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem('mlbb_token');
  localStorage.removeItem('mlbb_user');
}
function getUser() {
  try { return JSON.parse(localStorage.getItem('mlbb_user') || 'null'); } catch { return null; }
}

function delay(ms = 200) { return new Promise(r => setTimeout(r, ms)); }

const apiClient = {
  async getHeroes(params = {}) {
    await delay(100);
    let heroes = [...DATA().heroes];
    if (params.role) heroes = heroes.filter(h => h.role === params.role);
    if (params.q) {
      const q = params.q.toLowerCase();
      heroes = heroes.filter(h => h.name.toLowerCase().includes(q));
    }
    return { count: heroes.length, heroes };
  },

  async getHero(id) {
    await delay(100);
    const h = DATA().heroes.find(x => x.id === id);
    if (!h) throw new Error('Hero topilmadi');
    const builds = DATA().builds.filter(b => b.heroId === id);
    const counters = (DATA().counters[id] || []).map(c => ({
      counterHero: { id: DATA().heroes.find(x => x.name === c.name)?.id, name: c.name, role: '' },
      reason: c.reason
    }));
    return { ...h, builds, counters, strongAgainst: [], synergies: [], meta: [] };
  },

  async getItems(params = {}) {
    await delay(100);
    let items = [...DATA().items];
    if (params.category) items = items.filter(i => i.category === params.category);
    if (params.q) {
      const q = params.q.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q));
    }
    return { count: items.length, items };
  },

  async getBuilds() {
    await delay(100);
    const builds = DATA().builds.map(b => ({
      ...b,
      hero: { id: b.heroId, name: b.heroName },
      itemDetails: (b.items || []).map(name => DATA().items.find(i => i.name === name)).filter(Boolean)
    }));
    return { count: builds.length, builds };
  },

  async getMeta() {
    await delay(100);
    const tiers = {};
    Object.entries(DATA().meta).forEach(([tier, names]) => {
      tiers[tier] = names.map(name => {
        const h = DATA().heroes.find(x => x.name === name);
        return h ? { tier, hero: { id: h.id, name: h.name, role: h.role }, winRate: null } : null;
      }).filter(Boolean);
    });
    return { tiers, dataSource: 'Community / Offline', lastUpdated: new Date().toISOString() };
  },

  async getCounters(heroId) {
    await delay(100);
    const hero = DATA().heroes.find(h => h.id === heroId);
    if (!hero) throw new Error('Hero topilmadi');
    const list = (DATA().counters[heroId] || []).map(c => {
      const h = DATA().heroes.find(x => x.name === c.name);
      return {
        counterHero: { id: h ? h.id : '', name: c.name, role: h ? h.role : '' },
        reason: c.reason
      };
    });
    // Teammates by role synergy
    const synergyMap = {
      Assassin: ['Angela', 'Mathilda', 'Floryn', 'Diggie'],
      Marksman: ['Angela', 'Tigreal', 'Khufra', 'Lolita', 'Mathilda'],
      Mage: ['Tigreal', 'Atlas', 'Franco', 'Angela'],
      Fighter: ['Angela', 'Diggie', 'Floryn', 'Estes'],
      Tank: ['Wanwan', 'Claude', 'Melissa', 'Chang\'e', 'Granger'],
      Support: ['Fanny', 'Ling', 'Claude', 'Wanwan', 'Lancelot']
    };
    const tnames = synergyMap[hero.role] || [];
    const teammates = tnames.map(n => {
      const h = DATA().heroes.find(x => x.name === n);
      return h ? { synergyHero: { id: h.id, name: h.name, role: h.role }, reason: 'Yaxshi synergy' } : null;
    }).filter(Boolean);
    return {
      hero: { id: hero.id, name: hero.name, role: hero.role },
      bestCounters: list,
      weakAgainst: [],
      bestTeammates: teammates,
      note: "Offline matchup ma'lumoti. Patchga bog'liq."
    };
  },

  async chat(message) {
    await delay(400 + Math.random() * 400);
    const q = (message || '').toLowerCase();
    const heroes = DATA().heroes;
    let reply = '';

    for (const h of heroes) {
      if (q.includes(h.name.toLowerCase())) {
        reply = '**' + h.name + '** (' + h.role + ')\n\n';
        if (h.specialty) reply += '**Specialty:** ' + h.specialty + '\n';
        if (h.lane) reply += '**Lane:** ' + h.lane + '\n';
        reply += '**Difficulty:** ' + '★'.repeat(h.difficulty) + '☆'.repeat(3 - h.difficulty) + '\n\n';
        reply += h.description + '\n\n';
        if (h.passive_name) reply += '**Passive — ' + h.passive_name + ':** ' + h.passive_desc + '\n\n';
        if (h.skill1_name) reply += '**Skill 1 — ' + h.skill1_name + ':** ' + h.skill1_desc + '\n\n';
        if (h.skill2_name) reply += '**Skill 2 — ' + h.skill2_name + ':** ' + h.skill2_desc + '\n\n';
        if (h.ultimate_name) reply += '**Ultimate — ' + h.ultimate_name + ':** ' + h.ultimate_desc + '\n\n';
        const builds = DATA().builds.filter(b => b.heroId === h.id);
        if (builds.length) {
          reply += '**Tavsiya build:** ' + builds[0].name + '\nEmblem: ' + builds[0].emblem + '\nSpell: ' + builds[0].battleSpell + '\nItemlar: ' + (builds[0].items || []).join(', ') + '\n\n';
        }
        const counters = DATA().counters[h.id] || [];
        if (counters.length) {
          reply += '**Counterlar:**\n' + counters.map(c => '- ' + c.name + ': ' + c.reason).join('\n');
        }
        reply += '\n\n*Offline rejim.*';
        return { reply, language: 'uz', usedRealAI: false };
      }
    }

    if (/meta|tier|kuchli hero|eng yaxshi/i.test(q)) {
      reply = '**Joriy META (offline):**\n\n';
      Object.entries(DATA().meta).forEach(([tier, names]) => {
        reply += '**' + tier + ':** ' + names.join(', ') + '\n';
      });
      return { reply, language: 'uz', usedRealAI: false };
    }

    if (/build|emblem|item/i.test(q)) {
      return { reply: 'Build uchun aniq hero nomini yozing.\nMasalan: **Fanny uchun eng yaxshi build**', language: 'uz', usedRealAI: false };
    }

    if (/settings|sozlama|fps|graphics|control/i.test(q)) {
      return { reply: '**Yuqori FPS uchun:**\n- Graphics: Low/Medium\n- Frame Rate: High\n- Shadow: Off\n- HD Mode: Off\n\nSettings sahifasidan ham foydalaning.', language: 'uz', usedRealAI: false };
    }

    if (/rank|mythical|glory|solo/i.test(q)) {
      return { reply: '**Mythical Glory:**\n1. 2-3 hero mastery\n2. Draft composition\n3. Tilt control\n4. Map awareness\n5. O‘zingizga qulay role', language: 'uz', usedRealAI: false };
    }

    return {
      reply: 'Salom! Men **MLBB AI UZ** (offline).\n\nSavol bering:\n- Fanny qanday o‘ynaladi?\n- Hozirgi META\n- Miya build\n- Settings / FPS\n- Mythical Glory',
      language: 'uz',
      usedRealAI: false
    };
  },

  async recommendSettings(body = {}) {
    await delay(200);
    const ram = parseInt(body.ram) || 6;
    const priority = body.priority || 'fps';
    const isLow = ram <= 4;
    const graphics = priority === 'fps' || isLow
      ? { quality: 'Low', frameRate: 'High', shadow: 'Off', highDefinition: 'Off', effects: 'Low' }
      : { quality: 'Medium', frameRate: 'High', shadow: 'Off', highDefinition: ram >= 8 ? 'On' : 'Off', effects: 'Medium' };
    return {
      graphics,
      control: { targetingMethod: 'Locked', cameraSensitivity: 70, skillWheelSensitivity: 70 },
      tips: ['O‘yin ichida Settings dan qo‘lda o‘zgartiring.', 'Telefon qizib ketsa Frame Rate ni pasaytiring.'],
      note: 'Offline tavsiya.'
    };
  },

  async register({ email, username, password }) {
    await delay(200);
    if (!email || !username || !password) throw new Error('Barcha maydonlarni to‘ldiring');
    const user = { id: 'u_' + Date.now(), email, username, role: 'user' };
    setAuth('offline-token', user);
    if (typeof window.mlbbRegisterUser === 'function') window.mlbbRegisterUser(user);
    return { token: 'offline-token', user };
  },
  async login({ email, password }) {
    await delay(200);
    if (email === 'admin@mlbbai.uz' && password === 'Admin123!') {
      const user = { id: 'admin', email, username: 'admin', role: 'admin' };
      setAuth('offline-token', user);
      if (typeof window.mlbbRegisterUser === 'function') window.mlbbRegisterUser(user);
      return { token: 'offline-token', user };
    }
    const user = { id: 'u_' + Date.now(), email, username: email.split('@')[0], role: 'user' };
    setAuth('offline-token', user);
    if (typeof window.mlbbRegisterUser === 'function') window.mlbbRegisterUser(user);
    return { token: 'offline-token', user };
  },
  async me() {
    const u = getUser();
    if (!u) throw new Error('Login qiling');
    return u;
  },
  async logout() { clearAuth(); return { message: 'ok' }; },
  getChatHistory: async () => ({ sessions: [] }),
  getChatSession: async () => ({ session: null, messages: [] }),
  deleteChat: async () => ({}),
  newSession: async () => ({ id: 's1' }),
  health: async () => ({ status: 'ok', offline: true })
};

window.apiClient = apiClient;
window.getToken = getToken;
window.setAuth = setAuth;
window.clearAuth = clearAuth;
window.getUser = getUser;
