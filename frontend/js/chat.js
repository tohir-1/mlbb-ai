(function () {
  const messagesEl = document.getElementById('messages');
  const emptyState = document.getElementById('emptyState');
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const sessionsList = document.getElementById('sessionsList');
  const newChatBtn = document.getElementById('newChatBtn');

  let history = [];
  let sessionId = null;
  let isSending = false;

  function simpleMarkdown(text) {
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  function appendMessage(role, content, isHtml = false) {
    if (emptyState) emptyState.style.display = 'none';

    const div = document.createElement('div');
    div.className = 'msg ' + role;
    const label = role === 'user' ? 'Siz' : 'MLBB AI';
    const initial = role === 'user' ? 'S' : 'AI';
    div.innerHTML = `
      <div class="msg-avatar">${initial}</div>
      <div class="msg-body">
        <div class="msg-role">${label}</div>
        <div class="msg-content">${isHtml ? content : simpleMarkdown(content)}</div>
        ${role === 'assistant' ? `<div class="msg-actions">
          <button type="button" class="copy-btn">Nusxa</button>
        </div>` : ''}
      </div>
    `;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    div.querySelector('.copy-btn')?.addEventListener('click', () => {
      navigator.clipboard.writeText(content).then(() => toast('Nusxa olindi'));
    });
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'msg assistant';
    div.id = 'typing';
    div.innerHTML = `
      <div class="msg-avatar">AI</div>
      <div class="msg-body">
        <div class="msg-role">MLBB AI</div>
        <div class="msg-content"><div class="typing-indicator"><span></span><span></span><span></span></div></div>
      </div>
    `;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    document.getElementById('typing')?.remove();
  }

  async function send(text) {
    if (!text || isSending) return;
    isSending = true;
    sendBtn.disabled = true;

    appendMessage('user', text);
    history.push({ role: 'user', content: text });
    input.value = '';
    autoResize();
    showTyping();

    try {
      const res = await apiClient.chat(text, sessionId, history.slice(0, -1));
      hideTyping();
      appendMessage('assistant', res.reply);
      history.push({ role: 'assistant', content: res.reply });
      if (res.sessionId) sessionId = res.sessionId;
      if (getUser()) loadSessions();
    } catch (e) {
      hideTyping();
      appendMessage('assistant', 'Xatolik: ' + (e.message || 'Server javob bermadi. Backend ishlayotganini tekshiring.'));
    } finally {
      isSending = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  function autoResize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 160) + 'px';
  }

  input.addEventListener('input', autoResize);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input.value.trim());
    }
  });
  sendBtn.addEventListener('click', () => send(input.value.trim()));

  document.querySelectorAll('.suggest-card').forEach(card => {
    card.addEventListener('click', () => send(card.dataset.q));
  });

  newChatBtn?.addEventListener('click', () => {
    history = [];
    sessionId = null;
    messagesEl.innerHTML = '';
    if (emptyState) {
      messagesEl.appendChild(emptyState);
      emptyState.style.display = '';
    }
  });

  async function loadSessions() {
    if (!getUser()) return;
    try {
      const { sessions } = await apiClient.getChatHistory();
      sessionsList.innerHTML = sessions.length ? sessions.map(s => `
        <div class="session-item ${s.id === sessionId ? 'active' : ''}" data-id="${s.id}">
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(s.title || 'Suhbat')}</span>
          <button class="del" data-id="${s.id}">×</button>
        </div>
      `).join('') : '<p class="text-muted" style="padding:1rem;font-size:0.85rem">Suhbatlar yo\'q</p>';

      sessionsList.querySelectorAll('.session-item').forEach(el => {
        el.addEventListener('click', async (e) => {
          if (e.target.classList.contains('del')) return;
          const id = el.dataset.id;
          try {
            const data = await apiClient.getChatSession(id);
            sessionId = id;
            history = data.messages.map(m => ({ role: m.role, content: m.content }));
            messagesEl.innerHTML = '';
            history.forEach(m => appendMessage(m.role, m.content));
            loadSessions();
          } catch (err) {
            toast(err.message);
          }
        });
      });

      sessionsList.querySelectorAll('.del').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          try {
            await apiClient.deleteChat(btn.dataset.id);
            if (sessionId === btn.dataset.id) {
              sessionId = null;
              history = [];
              messagesEl.innerHTML = '';
              if (emptyState) {
                messagesEl.appendChild(emptyState);
                emptyState.style.display = '';
              }
            }
            loadSessions();
            toast('O\'chirildi');
          } catch (err) {
            toast(err.message);
          }
        });
      });
    } catch (e) {
      console.error(e);
    }
  }

  // URL query
  const params = new URLSearchParams(location.search);
  const q = params.get('q');
  if (q) {
    setTimeout(() => send(q), 300);
  }

  loadSessions();
  input.focus();
})();
