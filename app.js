/* VALORANT WIKI — redesigned app.
   Plain JS, no build step. Hash routes:
   #home #agents #agent/<name> #weapons #weapon/<name>[/<skin-uuid>] #maps #map/<name>
   #cards[/<uuid>] #buddies #sprays #titles #currency #seasons #ranks #trainer #about */
(function () {
  'use strict';

  const API = 'https://valorant-api.com/v1';
  const app = document.getElementById('app');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const hex = c => (c ? '#' + String(c).slice(0, 6) : null);
  const num = n => Number(n).toLocaleString('en-US');
  const fmtDate = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const enumLabel = s => String(s || '').split('::').pop().replace(/([a-z])([A-Z])/g, '$1 $2');
  const img = (src, alt, cls = '', extra = '') => src
    ? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" class="${cls}" ${extra} onload="this.classList.add('is-loaded')" onerror="this.classList.add('is-broken')">`
    : '';

  const ICON = {
    arrow: '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>',
    back: '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>',
    play: '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4l14 8-14 8z" fill="currentColor"/></svg>',
    search: '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 15.5L21 21" stroke="currentColor" stroke-width="2"/></svg>',
    pin: '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" fill="currentColor"/></svg>'
  };

  /* ---------- data ---------- */
  const store = new Map();
  function api(path, transform) {
    if (!store.has(path)) {
      const p = fetch(API + path)
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(j => (transform ? transform(j.data) : j.data))
        .catch(err => { store.delete(path); throw err; });
      store.set(path, p);
    }
    return store.get(path);
  }

  const WEAPON_ORDER = ['Sidearm', 'SMG', 'Shotgun', 'Rifle', 'Sniper', 'Heavy', 'Melee'];
  const WEAPON_LABEL = { Sidearm: 'Sidearms', SMG: 'SMGs', Shotgun: 'Shotguns', Rifle: 'Rifles', Sniper: 'Snipers', Heavy: 'Machine Guns', Melee: 'Melee' };
  const ROLE_ORDER = ['Duelist', 'Initiator', 'Controller', 'Sentinel'];
  const SLOT_KEY = { Grenade: 'C', Ability1: 'Q', Ability2: 'E', Ultimate: 'X', Passive: 'P' };
  const SLOT_ORDER = ['Grenade', 'Ability1', 'Ability2', 'Ultimate', 'Passive'];

  const DB = {
    agents: () => api('/agents?isPlayableCharacter=true', d => {
      const seen = new Set();
      return d.filter(a => !seen.has(a.displayName) && seen.add(a.displayName))
        .sort((a, b) => a.displayName.localeCompare(b.displayName))
        .map(a => Object.assign(a, { slug: slug(a.displayName) }));
    }),
    weapons: () => api('/weapons', d => d.map(w => Object.assign(w, {
      slug: slug(w.displayName),
      cat: enumLabel(w.category),
      skins: (w.skins || []).filter(s => s.displayName && !/random favorite/i.test(s.displayName))
    })).sort((a, b) => (WEAPON_ORDER.indexOf(a.cat) - WEAPON_ORDER.indexOf(b.cat)) || ((a.shopData ? a.shopData.cost : 0) - (b.shopData ? b.shopData.cost : 0)))),
    maps: () => api('/maps', d => {
      const seen = new Set();
      return d.filter(m => m.displayName !== 'The Range' && m.displayName !== 'Basic Training' && !seen.has(m.displayName) && seen.add(m.displayName))
        .map(m => Object.assign(m, { slug: slug(m.displayName), competitive: !!(m.tacticalDescription && /site/i.test(m.tacticalDescription)) }))
        .sort((a, b) => (b.competitive - a.competitive) || a.displayName.localeCompare(b.displayName));
    }),
    cards: () => api('/playercards', d => d.filter(c => c.displayIcon || c.largeArt).reverse()),
    buddies: () => api('/buddies', d => d.filter(b => b.displayIcon).reverse()),
    sprays: () => api('/sprays', d => d.filter(s => (s.fullTransparentIcon || s.displayIcon) && !s.isNullSpray).reverse()),
    titles: () => api('/playertitles', d => d.filter(t => t.titleText).reverse()),
    currencies: () => api('/currencies'),
    seasons: () => api('/seasons'),
    tiers: () => api('/competitivetiers', d => d[d.length - 1].tiers.filter(t => t.largeIcon && !/unused|unranked/i.test(t.tierName))),
    contentTiers: () => api('/contenttiers'),
    version: () => api('/version')
  };

  /* ---------- small UI pieces ---------- */
  function pageHead(kicker, title, sub, extra = '') {
    return `<header class="phead">
      <div class="phead__inner">
        <p class="kicker">${kicker}</p>
        <h1 class="phead__title" data-text="${esc(title)}">${esc(title)}</h1>
        ${sub ? `<p class="phead__sub">${sub}</p>` : ''}
        ${extra}
      </div>
    </header>`;
  }

  function skeleton(kind) {
    const n = kind === 'detail' ? 0 : 12;
    const head = `<div class="phead"><div class="phead__inner"><div class="sk sk--kicker"></div><div class="sk sk--title"></div><div class="sk sk--line"></div></div></div>`;
    if (kind === 'detail') return `<div class="sk-hero sk"></div>`;
    return head + `<div class="wrap"><div class="grid grid--${kind || 'cards'}">${'<div class="sk sk--card"></div>'.repeat(n)}</div></div>`;
  }

  function errorView(err) {
    return `<section class="wrap state">
      <p class="kicker">CONNECTION LOST</p>
      <h1 class="state__title">Couldn't reach the game data.</h1>
      <p class="state__text">${esc(err && err.message ? err.message : 'Network error')} — check your connection and try again.</p>
      <button class="btn btn--red" type="button" onclick="location.reload()">Retry</button>
    </section>`;
  }

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('is-on'), 1800);
  }

  // staggered reveal for grids
  function reveal(root = app) {
    const items = $$('.rv:not(.in)', root);
    items.forEach((el, i) => { if (!reduceMotion) el.style.setProperty('--d', Math.min(i, 14) * 30 + 'ms'); el.classList.add('in'); });
  }

  // filter + search + incremental rendering for big lists
  function pagedGrid({ mount, items, render, batch = 48, match }) {
    let list = items, shown = 0, query = '';
    const grid = $('.js-grid', mount), count = $('.js-count', mount), more = $('.js-more', mount);
    function paint(reset) {
      if (reset) { grid.innerHTML = ''; shown = 0; }
      const next = list.slice(shown, shown + batch);
      grid.insertAdjacentHTML('beforeend', next.map((it, i) => render(it, shown + i)).join(''));
      shown += next.length;
      if (count) count.textContent = list.length === items.length ? `${num(items.length)} items` : `${num(list.length)} of ${num(items.length)}`;
      if (more) more.hidden = shown >= list.length;
      if (!list.length) grid.innerHTML = `<p class="empty">Nothing matches “${esc(query)}”.</p>`;
      reveal(grid);
    }
    const input = $('.js-filter', mount);
    if (input) {
      let t;
      input.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          query = input.value.trim().toLowerCase();
          list = query ? items.filter(it => match(it).toLowerCase().includes(query)) : items;
          paint(true);
        }, 120);
      });
    }
    if (more) {
      more.addEventListener('click', () => paint(false));
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(es => { if (es[0].isIntersecting && !more.hidden) paint(false); }, { rootMargin: '600px' });
        io.observe(more);
      }
    }
    paint(true);
  }

  function toolbar(placeholder) {
    return `<div class="toolbar">
      <label class="field">${ICON.search}<input class="js-filter" type="search" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}"></label>
      <span class="toolbar__count js-count"></span>
    </div>`;
  }

  /* ---------- HOME ---------- */
  function agentCard(a, i = 0) {
    const [c1, c2, c3] = (a.backgroundGradientColors || []).map(hex);
    return `<a class="acard rv" href="#agent/${a.slug}" style="--c1:${c1 || '#ff4655'};--c2:${c2 || '#0f1923'};--c3:${c3 || c1 || '#1f2731'}" aria-label="${esc(a.displayName)}, ${esc(a.role ? a.role.displayName : '')}">
      <span class="acard__bg" aria-hidden="true">${img(a.background, '', 'acard__bgimg')}</span>
      ${img(a.fullPortrait || a.displayIcon, a.displayName, 'acard__img', i < 4 ? 'fetchpriority="high"' : '')}
      <span class="acard__meta">
        <span class="acard__role">${a.role ? img(a.role.displayIcon, '', 'acard__roleicon') + esc(a.role.displayName) : ''}</span>
        <span class="acard__name">${esc(a.displayName)}</span>
      </span>
    </a>`;
  }

  function currentAct(seasons) {
    const now = Date.now();
    const act = seasons.find(s => s.type === 'EAresSeasonType::Act' && new Date(s.startTime) <= now && new Date(s.endTime) > now);
    if (!act) return null;
    const start = +new Date(act.startTime), end = +new Date(act.endTime);
    return { act, pct: Math.round((now - start) / (end - start) * 100), days: Math.max(0, Math.ceil((end - now) / 864e5)) };
  }

  async function renderHome(ctx) {
    const [agents, weapons, maps] = await Promise.all([DB.agents(), DB.weapons(), DB.maps()]);
    if (ctx.stale()) return;
    const hero = agents[Math.floor(Math.random() * agents.length)];
    const skins = weapons.reduce((n, w) => n + w.skins.length, 0);
    const vandal = weapons.find(w => w.displayName === 'Vandal') || weapons[0];
    const ascent = maps.find(m => m.displayName === 'Ascent') || maps[0];
    const comp = maps.filter(m => m.competitive).length;
    const [g1, g2] = (hero.backgroundGradientColors || []).map(hex);

    app.innerHTML = `
    <section class="hero" style="--c1:${g1 || '#ff4655'};--c2:${g2 || '#0f1923'}">
      <div class="hero__bgword" aria-hidden="true">${esc(hero.displayName)}</div>
      <div class="hero__inner">
        <div class="hero__copy">
          <p class="kicker"><span class="dot"></span> LIVE DATABASE <span class="js-patch"></span></p>
          <h1 class="hero__title">EVERY AGENT.<br>EVERY GUN.<br><span>EVERY ANGLE.</span></h1>
          <p class="hero__sub">Abilities, weapon stats, ${num(skins)} skins, map callouts, ranks and seasons — straight from the game files, updated every patch.</p>
          <div class="hero__ctas">
            <a class="btn btn--red" href="#agents">Browse agents ${ICON.arrow}</a>
            <a class="btn btn--ghost" href="#trainer">${ICON.play} Aim trainer</a>
          </div>
          <a class="hero__feature" href="#agent/${hero.slug}">
            ${img(hero.displayIcon, '', 'hero__featureimg')}
            <span><small>FEATURED AGENT</small><b>${esc(hero.displayName)}</b> <em>${esc(hero.role ? hero.role.displayName : '')}</em></span>
            ${ICON.arrow}
          </a>
        </div>
        <div class="hero__art" aria-hidden="true">
          ${img(hero.background, '', 'hero__glyph')}
          <img class="hero__portrait" src="${esc(hero.fullPortrait)}" alt="" fetchpriority="high" decoding="async" onload="this.classList.add('is-loaded')">
        </div>
      </div>
      <div class="hero__stats">
        <div><b>${agents.length}</b><span>Agents</span></div>
        <div><b>${weapons.length}</b><span>Weapons</span></div>
        <div><b>${num(skins)}</b><span>Skins</span></div>
        <div><b>${comp}</b><span>Comp maps</span></div>
      </div>
    </section>

    <section class="actbar wrap js-act" hidden></section>

    <section class="section">
      <div class="wrap section__head">
        <div><p class="kicker">// THE ROSTER</p><h2 class="h2">Agents</h2></div>
        <a class="link" href="#agents">All ${agents.length} agents ${ICON.arrow}</a>
      </div>
      <div class="rail" tabindex="0" aria-label="Agents">
        ${agents.map((a, i) => agentCard(a, i)).join('')}
      </div>
    </section>

    <section class="section wrap">
      <div class="section__head"><div><p class="kicker">// EXPLORE</p><h2 class="h2">The database</h2></div></div>
      <div class="tiles">
        <a class="tile tile--wide rv" href="#weapons"><span class="tile__label"><small>${weapons.length} weapons · ${num(skins)} skins</small>Arsenal</span>${img(vandal.displayIcon, '', 'tile__gun')}</a>
        <a class="tile tile--wide tile--map rv" href="#maps">${img(ascent.splash, '', 'tile__photo')}<span class="tile__label"><small>${maps.length} maps · callouts</small>Maps</span></a>
        <a class="tile rv js-ranktile" href="#ranks"><span class="tile__label"><small>Iron → Radiant</small>Ranks</span></a>
        <a class="tile rv" href="#cards"><span class="tile__label"><small>Collection</small>Player cards</span><span class="tile__glyph" aria-hidden="true">▣</span></a>
        <a class="tile rv" href="#buddies"><span class="tile__label"><small>Collection</small>Gun buddies</span><span class="tile__glyph" aria-hidden="true">◈</span></a>
        <a class="tile rv" href="#sprays"><span class="tile__label"><small>Collection</small>Sprays</span><span class="tile__glyph" aria-hidden="true">✦</span></a>
        <a class="tile rv" href="#titles"><span class="tile__label"><small>Collection</small>Titles</span><span class="tile__glyph" aria-hidden="true">“”</span></a>
        <a class="tile rv" href="#seasons"><span class="tile__label"><small>Timeline</small>Seasons</span><span class="tile__glyph" aria-hidden="true">⟶</span></a>
        <a class="tile rv" href="#currency"><span class="tile__label"><small>Economy</small>Currency</span><span class="tile__glyph" aria-hidden="true">¤</span></a>
      </div>
    </section>

    <section class="section wrap">
      <a class="promo rv" href="#trainer">
        <div class="promo__copy">
          <p class="kicker">// REYNA'S RANGE</p>
          <h2 class="h2">Shoot the Blind</h2>
          <p>A 30-second pixel aim trainer. Destroy the Leers before they escape — Reyna roasts every miss.</p>
          <span class="btn btn--red">${ICON.play} Play now</span>
          <p class="promo__best">YOUR BEST: <b>${window.RetroGame ? window.RetroGame.highScore : 0}</b></p>
        </div>
        <div class="promo__art" aria-hidden="true"><div class="promo__eye"></div><div class="promo__eye promo__eye--2"></div><div class="promo__eye promo__eye--3"></div><div class="promo__cross"></div></div>
      </a>
    </section>`;
    reveal();

    // secondary, non-blocking data
    DB.version().then(v => { const el = $('.js-patch'); if (el && v && v.version) el.textContent = '· PATCH ' + v.version.split('.').slice(0, 2).join('.'); }).catch(() => {});
    DB.seasons().then(s => {
      const cur = currentAct(s); const el = $('.js-act'); if (!cur || !el) return;
      const parent = s.find(x => x.uuid === cur.act.parentUuid);
      el.innerHTML = `<div class="actbar__live"><span class="dot"></span>NOW LIVE</div>
        <div class="actbar__name">${esc(cur.act.title || ((parent ? parent.displayName + ' // ' : '') + cur.act.displayName))}</div>
        <div class="actbar__track" role="progressbar" aria-valuenow="${cur.pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Act progress"><i style="width:${cur.pct}%"></i></div>
        <div class="actbar__left">${cur.days} day${cur.days === 1 ? '' : 's'} left</div>`;
      el.hidden = false;
    }).catch(() => {});
    DB.tiers().then(t => { const el = $('.js-ranktile'); const r = t[t.length - 1]; if (el && r) el.insertAdjacentHTML('beforeend', img(r.largeIcon, '', 'tile__rank')); }).catch(() => {});
  }

  /* ---------- AGENTS ---------- */
  async function renderAgents(ctx) {
    const agents = await DB.agents();
    if (ctx.stale()) return;
    const roles = ROLE_ORDER.map(r => agents.find(a => a.role && a.role.displayName === r)).filter(Boolean).map(a => a.role);
    app.innerHTML = pageHead(`// ${agents.length} AGENTS · ${roles.length} ROLES`, 'AGENTS', 'Pick a role, tap an agent, read every ability.') + `
      <div class="wrap">
        <div class="toolbar toolbar--agents">
          <div class="chips" role="group" aria-label="Filter by role">
            <button type="button" class="chip is-on" data-role="all" aria-pressed="true">All</button>
            ${roles.map(r => `<button type="button" class="chip" data-role="${esc(r.displayName)}" aria-pressed="false">${img(r.displayIcon, '', 'chip__icon')}${esc(r.displayName)}</button>`).join('')}
          </div>
          <label class="field">${ICON.search}<input class="js-filter" type="search" placeholder="Find an agent" aria-label="Find an agent"></label>
        </div>
        <p class="rolenote js-rolenote" hidden></p>
        <div class="grid grid--agents js-grid">${agents.map((a, i) => agentCard(a, i)).join('')}</div>
      </div>`;
    let role = 'all', q = '';
    const grid = $('.js-grid'), note = $('.js-rolenote');
    const apply = () => {
      const list = agents.filter(a => (role === 'all' || (a.role && a.role.displayName === role)) && a.displayName.toLowerCase().includes(q));
      grid.innerHTML = list.length ? list.map(agentCard).join('') : `<p class="empty">No agent called “${esc(q)}”.</p>`;
      const r = roles.find(x => x.displayName === role);
      note.hidden = !r; if (r) note.textContent = r.description;
      reveal(grid);
    };
    $$('.chip').forEach(c => c.addEventListener('click', () => {
      $$('.chip').forEach(x => { x.classList.toggle('is-on', x === c); x.setAttribute('aria-pressed', x === c); });
      role = c.dataset.role; apply();
    }));
    $('.js-filter').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); apply(); });
    reveal();
  }

  async function renderAgent(ctx, id) {
    const agents = await DB.agents();
    if (ctx.stale()) return;
    const idx = agents.findIndex(a => a.slug === id || a.uuid === id);
    if (idx < 0) return notFound('agent');
    const a = agents[idx];
    const prev = agents[(idx - 1 + agents.length) % agents.length], next = agents[(idx + 1) % agents.length];
    const [c1, c2, c3] = (a.backgroundGradientColors || []).map(hex);
    const abilities = (a.abilities || []).filter(x => x.displayName).sort((x, y) => SLOT_ORDER.indexOf(x.slot) - SLOT_ORDER.indexOf(y.slot));
    const mates = agents.filter(x => x !== a && x.role && a.role && x.role.uuid === a.role.uuid);
    document.title = `${a.displayName} — VALORANT WIKI`;

    app.innerHTML = `
    <section class="dhero dhero--agent" style="--c1:${c1 || '#ff4655'};--c2:${c2 || '#0f1923'};--c3:${c3 || '#1f2731'}">
      <div class="dhero__word" aria-hidden="true">${esc(a.displayName)}</div>
      <div class="wrap dhero__inner">
        <a class="crumb" href="#agents">${ICON.back} All agents</a>
        <div class="dhero__grid">
          <div class="dhero__copy">
            <p class="kicker">${a.role ? img(a.role.displayIcon, '', 'kicker__icon') + esc(a.role.displayName.toUpperCase()) : ''} <span class="muted">// CODENAME ${esc((a.developerName || '').toUpperCase())}</span></p>
            <h1 class="dhero__title">${esc(a.displayName)}</h1>
            <p class="dhero__desc">${esc(a.description)}</p>
            ${a.role ? `<p class="dhero__role"><b>${esc(a.role.displayName)}:</b> ${esc(a.role.description)}</p>` : ''}
          </div>
          <div class="dhero__art">
            ${img(a.background, '', 'dhero__glyph')}
            <img class="dhero__portrait" src="${esc(a.fullPortrait)}" alt="${esc(a.displayName)} full portrait" fetchpriority="high" decoding="async" onload="this.classList.add('is-loaded')">
          </div>
        </div>
      </div>
    </section>

    <section class="wrap section">
      <div class="section__head"><div><p class="kicker">// KIT</p><h2 class="h2">Abilities</h2></div></div>
      <div class="abil">
        <div class="abil__tabs" role="tablist" aria-label="${esc(a.displayName)} abilities">
          ${abilities.map((ab, i) => `<button type="button" role="tab" id="tab-${i}" aria-controls="panel-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" class="abil__tab${ab.slot === 'Ultimate' ? ' abil__tab--ult' : ''}">
            <span class="abil__key">${SLOT_KEY[ab.slot] || ''}</span>
            ${ab.displayIcon ? `<img src="${esc(ab.displayIcon)}" alt="" width="44" height="44">` : '<span class="abil__noicon"></span>'}
            <span class="abil__tabname">${esc(ab.displayName)}</span>
          </button>`).join('')}
        </div>
        ${abilities.map((ab, i) => `<div class="abil__panel" role="tabpanel" id="panel-${i}" aria-labelledby="tab-${i}" ${i === 0 ? '' : 'hidden'}>
          <p class="kicker">${ab.slot === 'Ultimate' ? 'ULTIMATE' : ab.slot === 'Passive' ? 'PASSIVE' : 'ABILITY'} · KEY ${SLOT_KEY[ab.slot] || '—'}</p>
          <h3 class="abil__name">${esc(ab.displayName)}</h3>
          <p class="abil__desc">${esc(ab.description)}</p>
        </div>`).join('')}
      </div>
    </section>

    ${mates.length ? `<section class="section">
      <div class="wrap section__head"><div><p class="kicker">// SAME ROLE</p><h2 class="h2">Other ${esc(a.role.displayName)}s</h2></div></div>
      <div class="rail">${mates.map(agentCard).join('')}</div>
    </section>` : ''}

    <nav class="wrap pager" aria-label="More agents">
      <a href="#agent/${prev.slug}" class="pager__btn">${ICON.back}<span><small>Previous</small>${esc(prev.displayName)}</span></a>
      <a href="#agent/${next.slug}" class="pager__btn pager__btn--next"><span><small>Next</small>${esc(next.displayName)}</span>${ICON.arrow}</a>
    </nav>`;

    const tabs = $$('.abil__tab'), panels = $$('.abil__panel');
    const select = i => {
      tabs.forEach((t, j) => { t.setAttribute('aria-selected', i === j); t.tabIndex = i === j ? 0 : -1; });
      panels.forEach((p, j) => { p.hidden = i !== j; });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', e => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); const n = (i + d + tabs.length) % tabs.length; select(n); tabs[n].focus(); }
      });
    });
    reveal();
  }

  /* ---------- WEAPONS ---------- */
  function weaponCard(w) {
    const s = w.weaponStats;
    return `<a class="wcard rv" href="#weapon/${w.slug}">
      <span class="wcard__top"><span class="wcard__cat">${esc(w.shopData ? w.shopData.categoryText || w.cat : w.cat)}</span><span class="wcard__cost">${w.shopData && w.shopData.cost ? num(w.shopData.cost) : 'FREE'}</span></span>
      <span class="wcard__img">${img(w.displayIcon, w.displayName)}</span>
      <span class="wcard__name">${esc(w.displayName)}</span>
      ${s ? `<span class="wcard__stats"><span><small>RATE</small>${s.fireRate}</span><span><small>MAG</small>${s.magazineSize}</span><span><small>SKINS</small>${w.skins.length}</span></span>` : `<span class="wcard__stats"><span><small>SKINS</small>${w.skins.length}</span></span>`}
    </a>`;
  }

  async function renderWeapons(ctx) {
    const weapons = await DB.weapons();
    if (ctx.stale()) return;
    const cats = WEAPON_ORDER.filter(c => weapons.some(w => w.cat === c));
    const skins = weapons.reduce((n, w) => n + w.skins.length, 0);
    app.innerHTML = pageHead(`// ${weapons.length} WEAPONS · ${num(skins)} SKINS`, 'ARSENAL', 'Every gun with live stats, damage falloff and its full skin line-up.') + `
      <div class="wrap">
        <div class="chips chips--sticky" role="navigation" aria-label="Jump to category">
          ${cats.map(c => `<a class="chip" href="#weapons" data-jump="cat-${c}">${WEAPON_LABEL[c]}</a>`).join('')}
        </div>
        ${cats.map(c => `<section class="wsec" id="cat-${c}">
          <h2 class="wsec__title"><span>${WEAPON_LABEL[c]}</span><i></i></h2>
          <div class="grid grid--weapons">${weapons.filter(w => w.cat === c).map(weaponCard).join('')}</div>
        </section>`).join('')}
      </div>`;
    $$('[data-jump]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      const el = document.getElementById(a.dataset.jump);
      if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }));
    reveal();
  }

  function statBar(label, value, max, unit = '', invert = false) {
    if (value == null) return '';
    const pct = Math.max(4, Math.min(100, (invert ? (max - value) / max : value / max) * 100));
    return `<div class="sbar"><span class="sbar__label">${label}</span><span class="sbar__track"><i style="width:${pct}%"></i></span><span class="sbar__val">${value}${unit}</span></div>`;
  }

  async function renderWeapon(ctx, id, sub) {
    const [weapons, tiers] = await Promise.all([DB.weapons(), DB.contentTiers().catch(() => [])]);
    if (ctx.stale()) return;
    const w = weapons.find(x => x.slug === id || x.uuid === id);
    if (!w) return notFound('weapon');
    const s = w.weaponStats;
    const tierMap = Object.fromEntries(tiers.map(t => [t.uuid, t]));
    document.title = `${w.displayName} — VALORANT WIKI`;
    const usedTiers = tiers.filter(t => w.skins.some(sk => sk.contentTierUuid === t.uuid)).sort((a, b) => a.rank - b.rank);

    app.innerHTML = `
    <section class="dhero dhero--weapon">
      <div class="dhero__word" aria-hidden="true">${esc(w.displayName)}</div>
      <div class="wrap dhero__inner">
        <a class="crumb" href="#weapons">${ICON.back} Arsenal</a>
        <div class="whero">
          <div>
            <p class="kicker">${esc(w.shopData ? w.shopData.categoryText : WEAPON_LABEL[w.cat] || w.cat)}</p>
            <h1 class="dhero__title">${esc(w.displayName)}</h1>
            <div class="whero__chips">
              <span class="pill pill--red">${w.shopData && w.shopData.cost ? num(w.shopData.cost) + ' credits' : (w.shopData ? 'Free' : 'Always equipped')}</span>
              ${s && s.wallPenetration ? `<span class="pill">${esc(enumLabel(s.wallPenetration))} wall pen</span>` : ''}
              ${s && s.feature ? `<span class="pill">${esc(enumLabel(s.feature))}</span>` : ''}
              ${s && s.altFireType ? `<span class="pill">Alt: ${esc(enumLabel(s.altFireType))}</span>` : ''}
              <span class="pill">${w.skins.length} skins</span>
            </div>
          </div>
          <div class="whero__img">${img(w.displayIcon, w.displayName, '', 'fetchpriority="high"')}</div>
        </div>
      </div>
    </section>

    ${s ? `<section class="wrap section wstats">
      <div class="panel">
        <p class="kicker">// HANDLING</p>
        ${statBar('Fire rate', s.fireRate, 16, '/s')}
        ${statBar('Magazine', s.magazineSize, 100)}
        ${statBar('Reload', s.reloadTimeSeconds, 6, 's', true)}
        ${statBar('Equip', s.equipTimeSeconds, 2, 's', true)}
        ${statBar('Run speed', Math.round(s.runSpeedMultiplier * 100), 100, '%')}
        ${statBar('1st shot spread', s.firstBulletAccuracy, 5, '°', true)}
      </div>
      <div class="panel">
        <p class="kicker">// DAMAGE BY RANGE</p>
        <table class="dmg">
          <thead><tr><th scope="col">Range</th><th scope="col">Head</th><th scope="col">Body</th><th scope="col">Legs</th></tr></thead>
          <tbody>${(s.damageRanges || []).map(r => `<tr><th scope="row">${r.rangeStartMeters}–${r.rangeEndMeters}m</th><td class="dmg__head">${Math.round(r.headDamage)}</td><td>${Math.round(r.bodyDamage)}</td><td>${Math.round(r.legDamage)}</td></tr>`).join('')}</tbody>
        </table>
        ${s.shotgunPelletCount > 1 ? `<p class="muted small">${s.shotgunPelletCount} pellets per shot — damage is per pellet.</p>` : ''}
      </div>
    </section>` : ''}

    <section class="wrap section js-skins">
      <div class="section__head"><div><p class="kicker">// COLLECTION</p><h2 class="h2">${esc(w.displayName)} skins</h2></div></div>
      <div class="toolbar">
        <div class="chips" role="group" aria-label="Filter by edition">
          <button type="button" class="chip is-on" data-tier="all" aria-pressed="true">All</button>
          ${usedTiers.map(t => `<button type="button" class="chip" data-tier="${t.uuid}" aria-pressed="false" style="--tc:${hex(t.highlightColor)}">${img(t.displayIcon, '', 'chip__icon')}${esc(t.devName || t.displayName.replace(' Edition', ''))}</button>`).join('')}
        </div>
        <label class="field">${ICON.search}<input class="js-filter" type="search" placeholder="Search skins" aria-label="Search skins"></label>
      </div>
      <p class="toolbar__count js-count"></p>
      <div class="grid grid--skins js-grid"></div>
      <button type="button" class="btn btn--ghost btn--block js-more" hidden>Load more</button>
    </section>`;

    const renderSkin = sk => {
      const t = tierMap[sk.contentTierUuid];
      const icon = sk.displayIcon || (sk.chromas[0] && (sk.chromas[0].displayIcon || sk.chromas[0].fullRender)) || (sk.levels[0] && sk.levels[0].displayIcon);
      return `<button type="button" class="skin rv" data-skin="${sk.uuid}" style="--tc:${t ? hex(t.highlightColor) : 'rgba(236,232,225,.15)'}">
        <span class="skin__img">${img(icon, sk.displayName)}</span>
        <span class="skin__name">${esc(sk.displayName)}</span>
        ${t ? `<img class="skin__tier" src="${esc(t.displayIcon)}" alt="${esc(t.displayName)}" width="18" height="18" loading="lazy">` : ''}
      </button>`;
    };
    let tierSel = 'all';
    const section = $('.js-skins');
    const mountSkins = () => pagedGrid({
      mount: section,
      items: w.skins.filter(sk => tierSel === 'all' || sk.contentTierUuid === tierSel),
      render: renderSkin, batch: 36, match: sk => sk.displayName
    });
    // chips rebuild the list; input listener added once per pagedGrid, so replace input to avoid stacking
    $$('[data-tier]', section).forEach(c => c.addEventListener('click', () => {
      $$('[data-tier]', section).forEach(x => { x.classList.toggle('is-on', x === c); x.setAttribute('aria-pressed', x === c); });
      tierSel = c.dataset.tier;
      const old = $('.js-filter', section), fresh = old.cloneNode(true); fresh.value = ''; old.replaceWith(fresh);
      const oldMore = $('.js-more', section), freshMore = oldMore.cloneNode(true); oldMore.replaceWith(freshMore);
      mountSkins();
    }));
    mountSkins();
    section.addEventListener('click', e => {
      const b = e.target.closest('[data-skin]'); if (!b) return;
      const sk = w.skins.find(x => x.uuid === b.dataset.skin);
      if (sk) openSkin(sk, w, tierMap);
    });
    reveal();
    if (sub) { const sk = w.skins.find(x => x.uuid === sub); if (sk) openSkin(sk, w, tierMap, `#weapon/${w.slug}`); }
  }

  function openSkin(sk, w, tierMap, closeHash) {
    const t = tierMap[sk.contentTierUuid];
    const chromas = (sk.chromas || []).filter(c => c.fullRender || c.displayIcon);
    const video = (sk.levels || []).map(l => l.streamedVideo).filter(Boolean).pop() || (chromas.map(c => c.streamedVideo).filter(Boolean)[0]);
    const first = chromas[0] ? (chromas[0].fullRender || chromas[0].displayIcon) : sk.displayIcon;
    openLightbox(`
      <div class="lb lb--skin" style="--tc:${t ? hex(t.highlightColor) : '#ff4655'}">
        <div class="lb__stage"><img class="js-skinimg" src="${esc(first || sk.displayIcon)}" alt="${esc(sk.displayName)}"></div>
        <div class="lb__info">
          <p class="kicker">${t ? img(t.displayIcon, '', 'kicker__icon') + esc(t.displayName.toUpperCase()) : esc(w.displayName.toUpperCase())}</p>
          <h2 id="lightbox-title" class="lb__title">${esc(sk.displayName)}</h2>
          ${chromas.length > 1 ? `<p class="muted small">${chromas.length} variants</p><div class="swatches">${chromas.map((c, i) => `<button type="button" class="swatch${i === 0 ? ' is-on' : ''}" data-src="${esc(c.fullRender || c.displayIcon)}" aria-label="${esc(c.displayName)}">${c.swatch ? `<img src="${esc(c.swatch)}" alt="" width="40" height="40">` : `<span>${i + 1}</span>`}</button>`).join('')}</div>` : ''}
          ${sk.levels && sk.levels.length > 1 ? `<p class="muted small">${sk.levels.length} upgrade levels</p>` : ''}
          ${video ? `<details class="lb__video"><summary>${ICON.play} Watch in-game preview</summary><video src="${esc(video)}" controls playsinline preload="none"></video></details>` : ''}
        </div>
      </div>`, closeHash);
    $$('.swatch').forEach(b => b.addEventListener('click', () => {
      $$('.swatch').forEach(x => x.classList.toggle('is-on', x === b));
      $('.js-skinimg').src = b.dataset.src;
    }));
  }

  /* ---------- MAPS ---------- */
  function mapCard(m) {
    return `<a class="mcard rv${m.competitive ? '' : ' mcard--mode'}" href="#map/${m.slug}">
      ${img(m.listViewIcon || m.splash, '', 'mcard__img')}
      <span class="mcard__shade"></span>
      <span class="mcard__meta">
        <span class="mcard__name">${esc(m.displayName)}</span>
        <span class="mcard__sub">${esc(m.tacticalDescription || 'Alternate mode')}${m.coordinates ? ` · <span class="mono">${esc(m.coordinates)}</span>` : ''}</span>
      </span>
    </a>`;
  }

  async function renderMaps(ctx) {
    const maps = await DB.maps();
    if (ctx.stale()) return;
    const comp = maps.filter(m => m.competitive), other = maps.filter(m => !m.competitive);
    app.innerHTML = pageHead(`// ${maps.length} MAPS`, 'MAPS', 'Every battleground — tap one for its minimap with every callout.') + `
      <div class="wrap">
        <section class="wsec"><h2 class="wsec__title"><span>Competitive pool</span><i></i></h2><div class="grid grid--maps">${comp.map(mapCard).join('')}</div></section>
        ${other.length ? `<section class="wsec"><h2 class="wsec__title"><span>Deathmatch &amp; modes</span><i></i></h2><div class="grid grid--maps">${other.map(mapCard).join('')}</div></section>` : ''}
      </div>`;
    reveal();
  }

  async function renderMap(ctx, id) {
    const maps = await DB.maps();
    if (ctx.stale()) return;
    const m = maps.find(x => x.slug === id || x.uuid === id);
    if (!m) return notFound('map');
    document.title = `${m.displayName} — VALORANT WIKI`;
    const callouts = (m.callouts || []).map(c => ({
      name: c.regionName, region: c.superRegionName,
      x: c.location.y * m.xMultiplier + m.xScalarToAdd,
      y: c.location.x * m.yMultiplier + m.yScalarToAdd
    })).filter(c => c.x > 0 && c.x < 1 && c.y > 0 && c.y < 1);
    const regions = [...new Set(callouts.map(c => c.region))];
    const others = maps.filter(x => x !== m && x.competitive === m.competitive);

    app.innerHTML = `
    <section class="mhero">
      ${m.splash ? `<img class="mhero__img" src="${esc(m.splash)}" alt="" fetchpriority="high" decoding="async" onload="this.classList.add('is-loaded')">` : ''}
      <div class="mhero__shade"></div>
      <div class="wrap mhero__inner">
        <a class="crumb" href="#maps">${ICON.back} All maps</a>
        <p class="kicker">${esc(m.tacticalDescription || 'Alternate mode')}</p>
        <h1 class="dhero__title">${esc(m.displayName)}</h1>
        ${m.coordinates ? `<p class="mono mhero__coords">${ICON.pin} ${esc(m.coordinates)}</p>` : ''}
        ${m.narrativeDescription ? `<p class="dhero__desc">${esc(m.narrativeDescription)}</p>` : ''}
      </div>
    </section>

    ${m.displayIcon ? `<section class="wrap section">
      <div class="section__head"><div><p class="kicker">// TACTICAL VIEW</p><h2 class="h2">Minimap${callouts.length ? ' &amp; callouts' : ''}</h2></div>
        ${callouts.length ? `<label class="switch"><input type="checkbox" class="js-callouts" checked><span></span> Callouts</label>` : ''}</div>
      <div class="minimap-wrap">
        <div class="minimap js-minimap">
          <img src="${esc(m.displayIcon)}" alt="${esc(m.displayName)} minimap" decoding="async">
          ${callouts.map(c => `<span class="callout" data-region="${esc(c.region)}" style="left:${(c.x * 100).toFixed(2)}%;top:${(c.y * 100).toFixed(2)}%">${esc(c.name)}</span>`).join('')}
        </div>
        ${regions.length ? `<div class="regions">
          ${regions.map(r => `<div class="regions__group"><button type="button" class="regions__title" data-hl="${esc(r)}">${esc(r)}</button>
            <p>${callouts.filter(c => c.region === r).map(c => esc(c.name)).sort().join(' · ')}</p></div>`).join('')}
        </div>` : ''}
      </div>
    </section>` : ''}

    ${others.length ? `<section class="section">
      <div class="wrap section__head"><div><p class="kicker">// KEEP EXPLORING</p><h2 class="h2">More maps</h2></div></div>
      <div class="rail rail--maps">${others.map(mapCard).join('')}</div>
    </section>` : ''}`;

    const mm = $('.js-minimap');
    const t = $('.js-callouts');
    if (t && mm) t.addEventListener('change', () => mm.classList.toggle('no-callouts', !t.checked));
    $$('[data-hl]').forEach(b => b.addEventListener('click', () => {
      const on = b.classList.toggle('is-on');
      $$('[data-hl]').forEach(x => { if (x !== b) x.classList.remove('is-on'); });
      $$('.callout', mm).forEach(c => c.classList.toggle('is-dim', on && c.dataset.region !== b.dataset.hl));
      if (on && mm) mm.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    }));
    reveal();
  }

  /* ---------- COLLECTIONS ---------- */
  const COLL = {
    cards: {
      title: 'PLAYER CARDS', kicker: 'COLLECTION', sub: 'Every banner in the game. Tap one for the full-size art.', get: () => DB.cards(),
      thumb: c => c.largeArt || c.displayIcon, kind: 'tall',
      open: c => `<div class="lb lb--card"><div class="lb__stage lb__stage--card">${c.largeArt ? `<img src="${esc(c.largeArt)}" alt="${esc(c.displayName)}">` : ''}</div>
        <div class="lb__info"><p class="kicker">PLAYER CARD</p><h2 id="lightbox-title" class="lb__title">${esc(c.displayName)}</h2>
        ${c.wideArt ? `<p class="muted small">In-game banner</p><img class="lb__wide" src="${esc(c.wideArt)}" alt="" loading="lazy">` : ''}</div></div>`
    },
    buddies: {
      title: 'GUN BUDDIES', kicker: 'COLLECTION', sub: 'Tiny charms, big flex.', get: () => DB.buddies(),
      thumb: b => b.displayIcon, kind: 'square',
      open: b => `<div class="lb"><div class="lb__stage lb__stage--pad"><img src="${esc(b.displayIcon)}" alt="${esc(b.displayName)}"></div>
        <div class="lb__info"><p class="kicker">GUN BUDDY</p><h2 id="lightbox-title" class="lb__title">${esc(b.displayName)}</h2></div></div>`
    },
    sprays: {
      title: 'SPRAYS', kicker: 'COLLECTION', sub: 'Tag the site. Animated sprays play in the preview.', get: () => DB.sprays(),
      thumb: s => s.displayIcon || s.fullTransparentIcon, kind: 'square',
      open: s => `<div class="lb"><div class="lb__stage lb__stage--pad"><img src="${esc(s.animationGif || s.fullTransparentIcon || s.fullIcon || s.displayIcon)}" alt="${esc(s.displayName)}"></div>
        <div class="lb__info"><p class="kicker">${s.animationGif ? 'ANIMATED SPRAY' : 'SPRAY'}</p><h2 id="lightbox-title" class="lb__title">${esc(s.displayName.replace(/ Spray$/, ''))}</h2></div></div>`
    }
  };

  async function renderCollection(ctx, key, id) {
    const c = COLL[key];
    const items = await c.get();
    if (ctx.stale()) return;
    app.innerHTML = pageHead(`// ${c.kicker} · ${num(items.length)}`, c.title, c.sub) + `
      <div class="wrap js-coll">
        ${toolbar('Search ' + c.title.toLowerCase())}
        <div class="grid grid--${c.kind} js-grid"></div>
        <button type="button" class="btn btn--ghost btn--block js-more" hidden>Load more</button>
      </div>`;
    const mount = $('.js-coll');
    pagedGrid({
      mount, items, batch: 48, match: it => it.displayName,
      render: it => `<button type="button" class="citem citem--${c.kind} rv" data-id="${it.uuid}">
        <span class="citem__img">${img(c.thumb(it), it.displayName)}</span>
        <span class="citem__name">${esc(it.displayName.replace(/ (Card|Buddy|Spray)$/, ''))}</span></button>`
    });
    mount.addEventListener('click', e => {
      const b = e.target.closest('[data-id]'); if (!b) return;
      const it = items.find(x => x.uuid === b.dataset.id);
      if (it) openLightbox(c.open(it));
    });
    if (id) { const it = items.find(x => x.uuid === id); if (it) openLightbox(c.open(it), '#' + key); }
  }

  async function renderTitles(ctx, id) {
    const titles = await DB.titles();
    if (ctx.stale()) return;
    app.innerHTML = pageHead(`// COLLECTION · ${num(titles.length)}`, 'TITLES', 'The words under your name. Tap any title to copy it.') + `
      <div class="wrap js-coll">
        ${toolbar('Search titles')}
        <div class="grid grid--titles js-grid"></div>
        <button type="button" class="btn btn--ghost btn--block js-more" hidden>Load more</button>
      </div>`;
    const mount = $('.js-coll');
    pagedGrid({
      mount, items: titles, batch: 90, match: t => t.titleText + ' ' + t.displayName,
      render: t => `<button type="button" class="ttl rv${t.uuid === id ? ' is-hl' : ''}" data-copy="${esc(t.titleText)}"><span>${esc(t.titleText)}</span></button>`
    });
    mount.addEventListener('click', e => {
      const b = e.target.closest('[data-copy]'); if (!b) return;
      const text = b.dataset.copy;
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast(`Copied “${text}”`), () => toast(text));
    });
    if (id) { const el = $('.ttl.is-hl'); if (el) el.scrollIntoView({ block: 'center' }); }
  }

  async function renderCurrency(ctx) {
    const cur = await DB.currencies();
    if (ctx.stale()) return;
    app.innerHTML = pageHead('// ECONOMY', 'CURRENCY', 'Everything you spend, earn and upgrade with.') + `
      <div class="wrap grid grid--currency">
        ${cur.map(c => `<div class="cur rv">${img(c.largeIcon || c.displayIcon, '', 'cur__img')}<h2 class="cur__name">${esc(c.displayName)}</h2></div>`).join('')}
      </div>`;
    reveal();
  }

  async function renderSeasons(ctx) {
    const seasons = await DB.seasons();
    if (ctx.stale()) return;
    const now = Date.now();
    const acts = seasons.filter(s => s.type === 'EAresSeasonType::Act');
    const parents = seasons.filter(s => s.type !== 'EAresSeasonType::Act' && !s.parentUuid && acts.some(a => a.parentUuid === s.uuid))
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    // the API names some chapters identically (e.g. two "V26" halves): number them
    const nameCount = {};
    parents.slice().reverse().forEach(p => { nameCount[p.displayName] = (nameCount[p.displayName] || 0) + 1; p._label = p.displayName + (parents.filter(x => x.displayName === p.displayName).length > 1 ? ' · PART ' + nameCount[p.displayName] : ''); });
    const live = s => new Date(s.startTime) <= now && new Date(s.endTime) > now;
    const future = s => new Date(s.startTime) > now;
    app.innerHTML = pageHead(`// TIMELINE · ${parents.length} CHAPTERS · ${acts.length} ACTS`, 'SEASONS', 'Every episode and act since launch, newest first.') + `
      <div class="wrap timeline">
        ${parents.map(p => {
          const kids = acts.filter(a => a.parentUuid === p.uuid).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
          return `<section class="ep rv${live(p) ? ' ep--live' : ''}">
            <div class="ep__rail"><span class="ep__dot"></span></div>
            <div class="ep__body">
              <div class="ep__head"><h2 class="ep__name">${esc(p._label || p.displayName)}</h2><span class="mono muted small">${fmtDate(p.startTime)} — ${fmtDate(p.endTime)}</span></div>
              <div class="acts">
                ${kids.map(a => {
                  const isLive = live(a), isNext = future(a);
                  const pct = isLive ? Math.round((now - new Date(a.startTime)) / (new Date(a.endTime) - new Date(a.startTime)) * 100) : (isNext ? 0 : 100);
                  return `<div class="act${isLive ? ' act--live' : ''}${isNext ? ' act--next' : ''}">
                    <div class="act__top"><b>${esc(a.displayName)}</b>${isLive ? '<span class="tag tag--live"><span class="dot"></span>LIVE</span>' : isNext ? '<span class="tag">UPCOMING</span>' : ''}</div>
                    <span class="act__track"><i style="width:${pct}%"></i></span>
                    <span class="mono muted small">${fmtDate(a.startTime)} — ${fmtDate(a.endTime)}</span>
                  </div>`;
                }).join('')}
              </div>
            </div>
          </section>`;
        }).join('')}
      </div>`;
    reveal();
  }

  async function renderRanks(ctx) {
    const tiers = await DB.tiers();
    if (ctx.stale()) return;
    const divs = [];
    tiers.forEach(t => { let d = divs.find(x => x.name === t.divisionName); if (!d) divs.push(d = { name: t.divisionName, tiers: [], color: hex(t.color) }); d.tiers.push(t); });
    app.innerHTML = pageHead(`// COMPETITIVE · ${tiers.length} TIERS`, 'RANKS', 'From Iron to Radiant — the full competitive ladder of the current act.') + `
      <div class="wrap ranks">
        ${divs.map((d, i) => `<section class="rdiv rv" style="--rc:${d.color || '#ece8e1'}">
          <div class="rdiv__head"><span class="rdiv__num mono">${String(i + 1).padStart(2, '0')}</span><h2 class="rdiv__name">${esc(d.name)}</h2></div>
          <div class="rdiv__tiers">${d.tiers.map(t => `<figure class="rank">${img(t.largeIcon, t.tierName)}<figcaption>${esc(t.tierName)}</figcaption></figure>`).join('')}</div>
        </section>`).join('')}
      </div>`;
    reveal();
  }

  function renderTrainer() {
    app.innerHTML = pageHead("// REYNA'S RANGE", 'AIM TRAINER', 'Shoot the Blind: 30 seconds, as many Leers as you can. Tap or click to fire.') + `
      <div class="wrap trainer"><div id="game-container-root"></div>
      <p class="muted small trainer__tip">Tip: hits in a row build a streak. Misses (and escaped Leers) wake Reyna up.</p></div>`;
    if (window.RetroGame) window.RetroGame.mount($('#game-container-root'));
  }

  function renderAbout() {
    app.innerHTML = pageHead('// ABOUT', 'ABOUT', null) + `
      <div class="wrap about">
        <div class="panel about__card rv">
          <img src="logo.png" alt="" width="72" height="72">
          <h2 class="h2">VALORANT WIKI</h2>
          <p class="about__by">This page is designed by <b>SRIHARI</b>.</p>
          <p>A fast, mobile-first database for everything in VALORANT — agents and their abilities, every weapon with live stats and skins, maps with callouts, ranks, seasons and the full cosmetic collection. All data is pulled live from the community Valorant API, so it updates with every patch.</p>
          <p>Bored between queues? Try <a href="#trainer">Shoot the Blind</a>, the built-in aim trainer.</p>
          <p class="about__legal">DISCLAIMER: This project is not affiliated with Riot Games. Valorant and all related assets are trademarks of Riot Games, Inc.</p>
        </div>
      </div>`;
    reveal();
  }

  function notFound(what) {
    app.innerHTML = `<section class="wrap state"><p class="kicker">404 // ${esc((what || 'page').toUpperCase())} NOT FOUND</p>
      <h1 class="state__title">That one's off the map.</h1><a class="btn btn--red" href="#home">Back to base ${ICON.arrow}</a></section>`;
  }

  /* ---------- LIGHTBOX ---------- */
  let lbReturnFocus = null, lbCloseHash = null;
  function openLightbox(html, closeHash) {
    const lb = $('#lightbox');
    $('#lightbox-body').innerHTML = html;
    lbReturnFocus = document.activeElement;
    lbCloseHash = closeHash || null;
    lb.hidden = false;
    document.body.classList.add('is-locked');
    requestAnimationFrame(() => lb.classList.add('is-open'));
    $('.lightbox__close', lb).focus();
  }
  function closeLightbox() {
    const lb = $('#lightbox');
    if (lb.hidden) return;
    lb.classList.remove('is-open');
    $$('video', lb).forEach(v => v.pause());
    setTimeout(() => { lb.hidden = true; $('#lightbox-body').innerHTML = ''; }, reduceMotion ? 0 : 180);
    document.body.classList.remove('is-locked');
    if (lbCloseHash) { history.replaceState(null, '', lbCloseHash); lbCloseHash = null; }
    if (lbReturnFocus && lbReturnFocus.focus) lbReturnFocus.focus();
  }
  $('#lightbox').addEventListener('click', e => { if (e.target.closest('[data-close]')) closeLightbox(); });

  /* ---------- SEARCH ---------- */
  const PAGES = [
    ['Agents', '#agents'], ['Arsenal', '#weapons'], ['Maps', '#maps'], ['Ranks', '#ranks'], ['Player Cards', '#cards'],
    ['Gun Buddies', '#buddies'], ['Sprays', '#sprays'], ['Titles', '#titles'], ['Currency', '#currency'],
    ['Seasons', '#seasons'], ['Aim Trainer', '#trainer'], ['About', '#about']
  ];
  let index = null, extraLoaded = false;
  async function buildIndex() {
    const [agents, weapons, maps] = await Promise.all([DB.agents(), DB.weapons(), DB.maps()]);
    const out = [];
    PAGES.forEach(([n, h]) => out.push({ type: 'Pages', name: n, href: h, sub: 'Section' }));
    agents.forEach(a => {
      out.push({ type: 'Agents', name: a.displayName, href: `#agent/${a.slug}`, sub: a.role ? a.role.displayName : '', icon: a.displayIcon });
      (a.abilities || []).forEach(ab => ab.displayName && out.push({ type: 'Abilities', name: ab.displayName, href: `#agent/${a.slug}`, sub: `${a.displayName} · ${SLOT_KEY[ab.slot] || ''}`, icon: ab.displayIcon, dark: true }));
    });
    weapons.forEach(w => {
      out.push({ type: 'Weapons', name: w.displayName, href: `#weapon/${w.slug}`, sub: WEAPON_LABEL[w.cat] || w.cat, icon: w.displayIcon, wide: true });
      w.skins.forEach(s => out.push({ type: 'Skins', name: s.displayName, href: `#weapon/${w.slug}/${s.uuid}`, sub: w.displayName, icon: s.displayIcon || (s.chromas[0] && s.chromas[0].displayIcon), wide: true }));
    });
    maps.forEach(m => out.push({ type: 'Maps', name: m.displayName, href: `#map/${m.slug}`, sub: m.tacticalDescription || 'Mode', icon: m.listViewIcon, wide: true }));
    index = out;
    return out;
  }
  function loadExtra() {
    if (extraLoaded) return; extraLoaded = true;
    const add = (p, type, fn) => p.then(list => { if (index) list.forEach(x => index.push(fn(x))); runSearch(); }).catch(() => {});
    add(DB.cards(), 'Player Cards', c => ({ type: 'Player Cards', name: c.displayName, href: `#cards/${c.uuid}`, sub: 'Player card', icon: c.displayIcon }));
    add(DB.buddies(), 'Buddies', b => ({ type: 'Buddies', name: b.displayName, href: `#buddies/${b.uuid}`, sub: 'Gun buddy', icon: b.displayIcon }));
    add(DB.sprays(), 'Sprays', s => ({ type: 'Sprays', name: s.displayName, href: `#sprays/${s.uuid}`, sub: 'Spray', icon: s.displayIcon }));
    add(DB.titles(), 'Titles', t => ({ type: 'Titles', name: t.titleText, href: `#titles/${t.uuid}`, sub: 'Player title' }));
  }
  const GROUP_ORDER = ['Pages', 'Agents', 'Abilities', 'Weapons', 'Maps', 'Skins', 'Player Cards', 'Buddies', 'Sprays', 'Titles'];
  let sel = 0;
  function runSearch() {
    const box = $('#search-results'), q = $('#search-input').value.trim().toLowerCase();
    if (!index) { box.innerHTML = '<p class="search__hint">Loading the database…</p>'; return; }
    if (!q) {
      box.innerHTML = `<p class="search__hint">Try “jett”, “vandal”, “prime”, “ascent”, “updraft”…</p>
        <div class="search__quick">${PAGES.slice(0, 8).map(([n, h]) => `<a href="${h}" class="chip">${n}</a>`).join('')}</div>`;
      return;
    }
    const scored = [];
    for (const it of index) {
      const n = it.name.toLowerCase();
      const i = n.indexOf(q);
      if (i < 0) continue;
      const score = (i === 0 ? 0 : (n[i - 1] === ' ' ? 1 : 2)) + n.length / 100;
      scored.push([score, it]);
    }
    scored.sort((a, b) => a[0] - b[0]);
    const groups = {};
    scored.forEach(([, it]) => { (groups[it.type] = groups[it.type] || []); if (groups[it.type].length < 6) groups[it.type].push(it); });
    const order = GROUP_ORDER.filter(g => groups[g]);
    if (!order.length) { box.innerHTML = `<p class="search__hint">No results for “${esc(q)}”.</p>`; return; }
    let k = 0;
    box.innerHTML = order.map(g => `<div class="search__group"><p class="search__gtitle">${g}</p>${groups[g].map(it => `
      <a class="sres${k === 0 ? ' is-sel' : ''}" href="${esc(it.href)}" data-k="${k++}" role="option">
        <span class="sres__icon${it.wide ? ' sres__icon--wide' : ''}${it.dark ? ' sres__icon--dark' : ''}">${it.icon ? `<img src="${esc(it.icon)}" alt="" loading="lazy">` : '<i>#</i>'}</span>
        <span class="sres__text"><b>${esc(it.name)}</b><small>${esc(it.sub || '')}</small></span>
      </a>`).join('')}</div>`).join('');
    sel = 0;
  }
  let searchReturn = null;
  function openSearch() {
    const s = $('#search');
    searchReturn = document.activeElement;
    s.hidden = false;
    document.body.classList.add('is-locked');
    requestAnimationFrame(() => s.classList.add('is-open'));
    const input = $('#search-input');
    input.value = '';
    input.focus();
    runSearch();
    if (!index) buildIndex().then(runSearch).catch(() => { $('#search-results').innerHTML = '<p class="search__hint">Couldn\'t load search data.</p>'; });
    loadExtra();
  }
  function closeSearch() {
    const s = $('#search');
    if (s.hidden) return;
    s.classList.remove('is-open');
    s.hidden = true;
    document.body.classList.remove('is-locked');
    if (searchReturn && searchReturn.focus) searchReturn.focus();
  }
  $('#open-search').addEventListener('click', openSearch);
  $('#search').addEventListener('click', e => {
    if (e.target.closest('[data-close]')) closeSearch();
    else if (e.target.closest('a')) closeSearch();
  });
  $('#search-input').addEventListener('input', runSearch);
  $('#search-input').addEventListener('keydown', e => {
    const items = $$('.sres');
    if (!items.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((x, i) => x.classList.toggle('is-sel', i === sel));
      items[sel].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      location.hash = items[sel].getAttribute('href');
      closeSearch();
    }
  });

  /* ---------- MORE SHEET + DROPDOWN ---------- */
  const sheet = $('#more-sheet');
  function openSheet() { sheet.hidden = false; requestAnimationFrame(() => sheet.classList.add('is-open')); document.body.classList.add('is-locked'); }
  function closeSheet() { if (sheet.hidden) return; sheet.classList.remove('is-open'); document.body.classList.remove('is-locked'); setTimeout(() => { sheet.hidden = true; }, reduceMotion ? 0 : 220); }
  $('#open-more').addEventListener('click', openSheet);
  sheet.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeSheet(); });

  const moreBtn = $('.mainnav__morebtn'), moreWrap = $('.mainnav__more');
  moreBtn.addEventListener('click', e => { e.stopPropagation(); const on = moreWrap.classList.toggle('is-open'); moreBtn.setAttribute('aria-expanded', on); });
  document.addEventListener('click', e => { if (!e.target.closest('.mainnav__more')) { moreWrap.classList.remove('is-open'); moreBtn.setAttribute('aria-expanded', 'false'); } });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeLightbox(); closeSearch(); closeSheet(); moreWrap.classList.remove('is-open'); return; }
    const typing = /input|textarea|select/i.test(document.activeElement.tagName);
    if ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); openSearch(); }
  });

  // topbar style on scroll
  const topbar = $('#topbar');
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { topbar.classList.toggle('is-scrolled', window.scrollY > 8); ticking = false; });
  }, { passive: true });

  // skip link without breaking hash routing
  $('.skip-link').addEventListener('click', e => { e.preventDefault(); app.focus(); });

  /* ---------- ROUTER ---------- */
  const TITLES = {
    home: 'VALORANT WIKI — Agents, Arsenal, Maps & More', agents: 'Agents', weapons: 'Arsenal', maps: 'Maps', cards: 'Player Cards',
    buddies: 'Gun Buddies', sprays: 'Sprays', titles: 'Titles', currency: 'Currency', seasons: 'Seasons', ranks: 'Ranks', trainer: 'Aim Trainer', about: 'About'
  };
  const NAV_OF = { agent: 'agents', weapon: 'weapons', map: 'maps', cards: 'collection', buddies: 'collection', sprays: 'collection', titles: 'collection', currency: 'collection', seasons: 'collection' };
  let routeId = 0, lastPage = null;

  async function route() {
    let [page, id, sub] = decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/');
    page = page || 'home';
    if (page === 'collection') page = 'cards';
    if (page === 'app') return;
    const my = ++routeId;
    const ctx = { stale: () => my !== routeId };
    if (window.RetroGame) window.RetroGame.destroy();
    lbCloseHash = null; closeLightbox(); closeSearch(); closeSheet();
    moreWrap.classList.remove('is-open');

    const nav = NAV_OF[page] || page;
    $$('[data-nav]').forEach(a => { const on = a.dataset.nav === nav || (nav === 'collection' && a.dataset.nav === 'more'); a.classList.toggle('is-active', on); if (a.tagName === 'A') { if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); } });
    document.title = page === 'home' ? TITLES.home : `${TITLES[page] || 'VALORANT WIKI'} — VALORANT WIKI`;

    const samePage = lastPage === page + '/' + (id || '');
    lastPage = page + '/' + (id || '');
    if (!samePage) window.scrollTo(0, 0);

    const views = {
      home: () => renderHome(ctx),
      agents: () => renderAgents(ctx),
      agent: () => renderAgent(ctx, id),
      weapons: () => renderWeapons(ctx),
      weapon: () => renderWeapon(ctx, id, sub),
      maps: () => renderMaps(ctx),
      map: () => renderMap(ctx, id),
      cards: () => renderCollection(ctx, 'cards', id),
      buddies: () => renderCollection(ctx, 'buddies', id),
      sprays: () => renderCollection(ctx, 'sprays', id),
      titles: () => renderTitles(ctx, id),
      currency: () => renderCurrency(ctx),
      seasons: () => renderSeasons(ctx),
      ranks: () => renderRanks(ctx),
      trainer: () => renderTrainer(),
      about: () => renderAbout()
    };
    const view = views[page];
    if (!view) { notFound(); return; }
    if (!samePage) {
      const kind = { agents: 'agents', weapons: 'weapons', maps: 'maps', cards: 'tall', agent: 'detail', weapon: 'detail', map: 'detail', home: 'detail' }[page] || 'square';
      app.innerHTML = skeleton(kind);
    }
    app.classList.remove('page-in');
    try {
      await view();
      if (ctx.stale()) return;
      void app.offsetWidth;
      app.classList.add('page-in');
    } catch (err) {
      if (ctx.stale()) return;
      console.error(err);
      app.innerHTML = errorView(err);
    }
  }

  window.addEventListener('hashchange', route);
  route();
  // warm the core data in the background
  (window.requestIdleCallback || (f => setTimeout(f, 1200)))(() => { DB.agents().catch(() => {}); DB.weapons().catch(() => {}); DB.maps().catch(() => {}); });
})();
