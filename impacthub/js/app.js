// app.js — UI, routing en interacties voor het ImpactHub-prototype.
// Pure vanilla JS, geen build-stap. We tekenen telkens de hele view opnieuw
// op basis van de huidige hash-route en de state uit store.js.

(function () {
  'use strict';
  const S = window.Store;

  // ---------- Kleine helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);

  // Veilig tekst tonen (voorkomt dat HTML uit input wordt uitgevoerd).
  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Initialen voor de avatar-cirkel.
  function initials(name) {
    return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  }

  function avatar(user, size = 48) {
    const fs = Math.round(size * 0.4);
    return `<span class="avatar" style="--c:${user.color};width:${size}px;height:${size}px;font-size:${fs}px"
      title="${esc(user.name)}">${esc(initials(user.name))}</span>`;
  }

  // "3 uur geleden" e.d.
  function ago(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'zojuist';
    const m = Math.floor(s / 60);
    if (m < 60) return m + ' min geleden';
    const h = Math.floor(m / 60);
    if (h < 24) return h + ' uur geleden';
    const d = Math.floor(h / 24);
    if (d < 7) return d + ' dag' + (d > 1 ? 'en' : '') + ' geleden';
    const w = Math.floor(d / 7);
    return w + ' week' + (w > 1 ? 'en' : '') + ' geleden';
  }

  function dateNL(iso) {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'long' });
  }

  // ---------- Routing ----------
  function currentRoute() {
    const hash = location.hash.replace(/^#\/?/, '') || 'home';
    const [name, param] = hash.split('/');
    return { name, param };
  }

  const routes = {
    home: viewHome,
    network: viewNetwork,
    jobs: viewJobs,
    events: viewEvents,
    profile: viewProfile,
  };

  function render() {
    const me = S.me();
    renderNav(me);
    const { name, param } = currentRoute();
    const view = routes[name] || viewHome;
    $('#main').innerHTML = view(param);
    window.scrollTo(0, 0);
  }

  // ---------- Topbalk ----------
  function navItem(route, icon, label) {
    const active = currentRoute().name === route ? 'active' : '';
    return `<a class="nav-item ${active}" href="#/${route}">
      <span class="nav-ico">${icon}</span><span class="nav-lbl">${label}</span></a>`;
  }

  function renderNav(me) {
    $('#nav').innerHTML = `
      <div class="nav-inner">
        <a class="brand" href="#/home" aria-label="ImpactHub home">
          <span class="brand-mark">✦</span><span class="brand-name">Impact<b>Hub</b></span>
        </a>
        <div class="search">
          <input type="search" placeholder="Zoek mensen, doelen of vacatures…" aria-label="Zoeken" />
        </div>
        <nav class="nav-links">
          ${navItem('home', '🏠', 'Home')}
          ${navItem('network', '👥', 'Netwerk')}
          ${navItem('jobs', '💼', 'Vacatures')}
          ${navItem('events', '📅', 'Events')}
          <a class="nav-item ${currentRoute().name === 'profile' && !currentRoute().param ? 'active' : ''}" href="#/profile">
            <span class="nav-ico nav-ava">${avatar(me, 26)}</span><span class="nav-lbl">Profiel</span>
          </a>
        </nav>
      </div>`;
  }

  // ---------- Linker profielkaart ----------
  function profileCard() {
    const me = S.me();
    const conns = me.connectionIds.length;
    return `<aside class="card profile-card">
      <div class="pc-cover" style="--c:${me.color}"></div>
      <a href="#/profile" class="pc-ava">${avatar(me, 72)}</a>
      <a href="#/profile" class="pc-name">${esc(me.name)}</a>
      <div class="pc-head">${esc(me.headline)}</div>
      ${me.org ? `<div class="pc-org">📍 ${esc(me.org)} · ${esc(me.location)}</div>` : `<div class="pc-org">📍 ${esc(me.location)}</div>`}
      <div class="pc-stats">
        <a href="#/network"><span>${conns}</span> connecties</a>
        <a href="#/profile"><span>${me.skills.length}</span> vaardigheden</a>
      </div>
      ${me.openToWork ? '<div class="pc-badge">🟢 Open voor werk</div>' : ''}
    </aside>`;
  }

  // ---------- Rechter kolom ----------
  function rightRail() {
    const st = S.getState();
    const causes = st.causes.map((c) =>
      `<li><a href="#/home"># ${esc(c.tag)}</a><span>${c.count.toLocaleString('nl-NL')} actief</span></li>`).join('');
    const evs = st.events.slice(0, 2).map((e) =>
      `<li><a href="#/events"><b>${esc(e.title)}</b></a><span>${dateNL(e.date)} · ${esc(e.location)}</span></li>`).join('');
    return `<aside class="rail">
      <div class="card rail-card">
        <h3>Doelen in beweging</h3>
        <ul class="rail-list causes">${causes}</ul>
      </div>
      <div class="card rail-card">
        <h3>Binnenkort</h3>
        <ul class="rail-list">${evs}</ul>
        <a class="rail-more" href="#/events">Alle events →</a>
      </div>
      <div class="rail-foot">
        ImpactHub · prototype<br>Het netwerk voor de goede-doelensector
      </div>
    </aside>`;
  }

  // ---------- HOME / feed ----------
  function postComposer() {
    const me = S.me();
    return `<div class="card composer">
      <div class="composer-top">
        ${avatar(me, 48)}
        <textarea id="composer-text" rows="1" placeholder="Deel een succes, een tip of een vraag met de sector…"></textarea>
      </div>
      <div class="composer-bar">
        <input id="composer-tags" type="text" placeholder="tags, komma-gescheiden (bijv. campagne, tip)" />
        <button class="btn btn-primary" id="composer-post">Plaatsen</button>
      </div>
    </div>`;
  }

  function commentHtml(c) {
    const u = S.user(c.authorId);
    return `<div class="comment">
      ${avatar(u, 32)}
      <div class="comment-body">
        <a class="comment-name" href="#/profile/${u.id}">${esc(u.name)}</a>
        <span class="comment-time">${ago(c.time)}</span>
        <p>${esc(c.text)}</p>
      </div>
    </div>`;
  }

  function postHtml(p) {
    const u = S.user(p.authorId);
    const me = S.me();
    const liked = p.likedBy.includes(me.id);
    const tags = (p.tags || []).map((t) => `<span class="tag">#${esc(t)}</span>`).join('');
    const comments = p.comments.map(commentHtml).join('');
    const mine = p.authorId === me.id;
    return `<article class="card post" data-post="${p.id}">
      <header class="post-head">
        <a href="#/profile/${u.id}">${avatar(u, 48)}</a>
        <div class="post-meta">
          <a class="post-name" href="#/profile/${u.id}">${esc(u.name)}</a>
          <div class="post-sub">${esc(u.headline)}</div>
          <div class="post-time">${ago(p.time)}</div>
        </div>
        ${mine ? `<button class="post-del" data-del="${p.id}" title="Verwijderen" aria-label="Verwijderen">✕</button>` : ''}
      </header>
      <div class="post-text">${esc(p.text)}</div>
      ${tags ? `<div class="post-tags">${tags}</div>` : ''}
      <div class="post-counts">
        <span>${p.likedBy.length} ❤</span><span>${p.comments.length} reacties</span>
      </div>
      <div class="post-actions">
        <button class="act ${liked ? 'liked' : ''}" data-like="${p.id}">${liked ? '❤ Geliket' : '🤍 Like'}</button>
        <button class="act" data-focus-comment="${p.id}">💬 Reageer</button>
      </div>
      <div class="post-comments">${comments}</div>
      <div class="comment-add">
        ${avatar(me, 32)}
        <input type="text" class="comment-input" data-comment="${p.id}" placeholder="Schrijf een reactie…" />
      </div>
    </article>`;
  }

  function viewHome() {
    const posts = S.feed().map(postHtml).join('');
    return `<div class="layout layout-3">
      <div class="col-left">${profileCard()}</div>
      <div class="col-center">
        ${postComposer()}
        <div id="feed">${posts}</div>
      </div>
      <div class="col-right">${rightRail()}</div>
    </div>`;
  }

  // ---------- NETWERK ----------
  function personCard(u) {
    const connected = S.isConnected(u.id);
    return `<div class="card person">
      <div class="person-cover" style="--c:${u.color}"></div>
      <a href="#/profile/${u.id}" class="person-ava">${avatar(u, 64)}</a>
      <a href="#/profile/${u.id}" class="person-name">${esc(u.name)}</a>
      <div class="person-head">${esc(u.headline)}</div>
      <div class="person-loc">📍 ${esc(u.location)}</div>
      ${u.openToWork ? '<div class="pc-badge sm">🟢 Open voor werk</div>' : '<div class="pc-badge-spacer"></div>'}
      <button class="btn ${connected ? 'btn-ghost' : 'btn-primary'}" data-connect="${u.id}">
        ${connected ? '✓ Connectie' : '+ Verbinden'}
      </button>
    </div>`;
  }

  function viewNetwork() {
    const st = S.getState();
    const me = S.me();
    const mine = me.connectionIds.map((id) => S.user(id)).filter(Boolean);
    const others = st.users.filter((u) => u.id !== me.id && !me.connectionIds.includes(u.id));
    return `<div class="layout layout-1">
      <div class="page-head">
        <h1>Jouw netwerk</h1>
        <p>${mine.length} connecties in de goede-doelensector</p>
      </div>
      <section class="net-section">
        <h2>Jouw connecties</h2>
        <div class="grid">${mine.length ? mine.map(personCard).join('') : '<p class="muted">Nog geen connecties. Verbind met mensen hieronder!</p>'}</div>
      </section>
      <section class="net-section">
        <h2>Misschien ken je…</h2>
        <div class="grid">${others.map(personCard).join('')}</div>
      </section>
    </div>`;
  }

  // ---------- VACATURES ----------
  function jobHtml(j) {
    const applied = S.hasApplied(j.id);
    return `<article class="card job">
      <div class="job-logo" style="--c:${'#0e7c66'}">${esc(initials(j.org))}</div>
      <div class="job-body">
        <h3>${esc(j.title)}</h3>
        <div class="job-org">${esc(j.org)} · ${esc(j.location)}</div>
        <div class="job-tags">
          <span class="chip">${esc(j.type)}</span>
          <span class="chip">${esc(j.category)}</span>
          <span class="chip">${esc(j.salary)}</span>
        </div>
        <p class="job-desc">${esc(j.description)}</p>
        <div class="job-foot">
          <span class="muted">Geplaatst ${ago(j.posted)}</span>
          <button class="btn ${applied ? 'btn-ghost' : 'btn-primary'}" data-apply="${j.id}">
            ${applied ? '✓ Gesolliciteerd' : 'Solliciteer'}
          </button>
        </div>
      </div>
    </article>`;
  }

  function viewJobs() {
    const st = S.getState();
    const jobs = st.jobs.map(jobHtml).join('');
    return `<div class="layout layout-1">
      <div class="page-head">
        <h1>Vacatures in de sector</h1>
        <p>${st.jobs.length} kansen bij goede doelen — van fondsenwerving tot vrijwilligerswerk</p>
      </div>
      <div class="jobs">${jobs}</div>
    </div>`;
  }

  // ---------- EVENTS ----------
  function eventHtml(e) {
    const going = S.isGoing(e.id);
    const d = new Date(e.date + 'T00:00:00');
    return `<article class="card event">
      <div class="event-date">
        <span class="ed-day">${d.getDate()}</span>
        <span class="ed-mon">${d.toLocaleDateString('nl-NL', { month: 'short' })}</span>
      </div>
      <div class="event-body">
        <h3>${esc(e.title)}</h3>
        <div class="event-org">${esc(e.org)}</div>
        <div class="event-meta">📍 ${esc(e.location)} · 👥 ${e.attendees + (going ? 1 : 0)} aanmeldingen</div>
      </div>
      <button class="btn ${going ? 'btn-ghost' : 'btn-primary'}" data-going="${e.id}">
        ${going ? '✓ Aangemeld' : 'Aanmelden'}
      </button>
    </article>`;
  }

  function viewEvents() {
    const st = S.getState();
    const evs = [...st.events].sort((a, b) => a.date.localeCompare(b.date)).map(eventHtml).join('');
    return `<div class="layout layout-1">
      <div class="page-head">
        <h1>Events & bijeenkomsten</h1>
        <p>Leer, netwerk en laat je inspireren met vakgenoten</p>
      </div>
      <div class="events">${evs}</div>
    </div>`;
  }

  // ---------- PROFIEL ----------
  function viewProfile(param) {
    const me = S.me();
    const u = param ? S.user(param) : me;
    if (!u) return `<div class="layout layout-1"><div class="page-head"><h1>Profiel niet gevonden</h1></div></div>`;
    const isMe = u.id === me.id;
    const connected = !isMe && S.isConnected(u.id);
    const skills = u.skills.map((s) => `<span class="skill">${esc(s)}</span>`).join('');
    const userPosts = S.feed().filter((p) => p.authorId === u.id);
    const postsHtml = userPosts.length
      ? userPosts.map(postHtml).join('')
      : `<div class="card empty">Nog geen berichten geplaatst.</div>`;

    return `<div class="layout layout-1 profile-view">
      <div class="card profile-hero">
        <div class="hero-cover" style="--c:${u.color}"></div>
        <div class="hero-row">
          <div class="hero-ava">${avatar(u, 120)}</div>
          <div class="hero-actions">
            ${isMe
              ? '<button class="btn btn-primary" id="edit-profile">Profiel bewerken</button>'
              : `<button class="btn ${connected ? 'btn-ghost' : 'btn-primary'}" data-connect="${u.id}">${connected ? '✓ Connectie' : '+ Verbinden'}</button>`}
          </div>
        </div>
        <h1 class="hero-name">${esc(u.name)} ${u.openToWork ? '<span class="otw">· open voor werk</span>' : ''}</h1>
        <div class="hero-head">${esc(u.headline)}</div>
        <div class="hero-meta">📍 ${esc(u.location)}${u.org ? ' · ' + esc(u.org) : ''} · ${u.connectionIds.length} connecties</div>
      </div>

      <div class="card profile-section">
        <h2>Over</h2>
        <p class="about">${esc(u.about)}</p>
      </div>

      <div class="card profile-section">
        <h2>Vaardigheden</h2>
        <div class="skills">${skills || '<span class="muted">Nog geen vaardigheden toegevoegd.</span>'}</div>
      </div>

      <div class="profile-section-title"><h2>Berichten van ${esc(u.name)}</h2></div>
      ${postsHtml}
    </div>`;
  }

  // ---------- Profiel bewerken (modal) ----------
  function openEditModal() {
    const me = S.me();
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-head"><h2>Profiel bewerken</h2><button class="modal-x" id="modal-close">✕</button></div>
        <div class="modal-body">
          <label>Naam<input id="f-name" type="text" value="${esc(me.name)}"></label>
          <label>Functietitel (headline)<input id="f-head" type="text" value="${esc(me.headline)}"></label>
          <label>Organisatie<input id="f-org" type="text" value="${esc(me.org)}"></label>
          <label>Locatie<input id="f-loc" type="text" value="${esc(me.location)}"></label>
          <label>Over jou<textarea id="f-about" rows="4">${esc(me.about)}</textarea></label>
          <label>Vaardigheden (komma-gescheiden)<input id="f-skills" type="text" value="${esc(me.skills.join(', '))}"></label>
          <label class="check"><input id="f-otw" type="checkbox" ${me.openToWork ? 'checked' : ''}> Open voor werk</label>
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" id="modal-cancel">Annuleren</button>
          <button class="btn btn-primary" id="modal-save">Opslaan</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);

    const close = () => wrap.remove();
    $('#modal-close', wrap).onclick = close;
    $('#modal-cancel', wrap).onclick = close;
    wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
    $('#modal-save', wrap).onclick = () => {
      const skills = $('#f-skills', wrap).value.split(',').map((s) => s.trim()).filter(Boolean);
      S.updateProfile({
        name: $('#f-name', wrap).value.trim() || 'Jij',
        headline: $('#f-head', wrap).value.trim(),
        org: $('#f-org', wrap).value.trim(),
        location: $('#f-loc', wrap).value.trim() || 'Nederland',
        about: $('#f-about', wrap).value.trim(),
        skills,
        openToWork: $('#f-otw', wrap).checked,
      });
      close();
    };
  }

  // ---------- Globale event-afhandeling (event delegation) ----------
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-like],[data-del],[data-connect],[data-apply],[data-going],[data-focus-comment],#composer-post,#edit-profile');
    if (!t) return;

    if (t.id === 'composer-post') {
      const text = $('#composer-text').value;
      if (!text.trim()) { $('#composer-text').focus(); return; }
      const tags = ($('#composer-tags').value || '').split(',').map((s) => s.trim()).filter(Boolean);
      S.addPost(text, tags);
      return;
    }
    if (t.id === 'edit-profile') { openEditModal(); return; }
    if (t.dataset.like) { S.toggleLike(t.dataset.like); return; }
    if (t.dataset.del) {
      if (confirm('Dit bericht verwijderen?')) S.deletePost(t.dataset.del);
      return;
    }
    if (t.dataset.connect) { S.toggleConnection(t.dataset.connect); return; }
    if (t.dataset.apply) { S.toggleJobApplied(t.dataset.apply); return; }
    if (t.dataset.going) { S.toggleEventGoing(t.dataset.going); return; }
    if (t.dataset.focusComment) {
      const input = document.querySelector(`.comment-input[data-comment="${t.dataset.focusComment}"]`);
      if (input) input.focus();
    }
  });

  // Reacties plaatsen met Enter.
  document.addEventListener('keydown', (e) => {
    const inp = e.target.closest('.comment-input');
    if (inp && e.key === 'Enter') {
      e.preventDefault();
      const text = inp.value;
      if (text.trim()) S.addComment(inp.dataset.comment, text);
    }
  });

  // Composer-textarea laten meegroeien.
  document.addEventListener('input', (e) => {
    if (e.target.id === 'composer-text') {
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight, 220) + 'px';
    }
  });

  // ---------- Opstarten ----------
  S.subscribe(render);
  window.addEventListener('hashchange', render);
  document.addEventListener('DOMContentLoaded', render);
  // Voor het geval DOMContentLoaded al voorbij is:
  if (document.readyState !== 'loading') render();

  // Reset-knop in de footer.
  window.ImpactHubReset = function () {
    if (confirm('Alle voorbeeld-data terugzetten naar het begin? Jouw wijzigingen gaan verloren.')) {
      S.reset();
    }
  };
})();
