/* =========================================================================
   HOUSE OF GUIDANCE — APP LOGIC
   All page text/data comes from content.js (SITE_CONTENT). This file only
   contains behavior: fetching real prayer times, fetching a real daily
   ayah, notifications, and the Noor chat widget.
   ========================================================================= */

(function () {
  'use strict';

  const C = window.SITE_CONTENT;

  /* ---------------------------------------------------------------------
     0. Small helpers
     --------------------------------------------------------------------- */
  function $(id) { return document.getElementById(id); }

  // Escapes HTML so nothing from an API or from the AI reply can inject
  // markup into the page. Used before any innerHTML assignment of
  // untrusted text.
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Minimal, safe markdown: only **bold**, *italic*, and line breaks —
  // applied AFTER escaping, so no raw tags from the source text survive.
  function safeMarkdownToHTML(raw) {
    const escaped = escapeHTML(raw);
    return escaped
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  /* ---------------------------------------------------------------------
     1. HEADER / NAV / LOGO / MEDIA FALLBACKS
     --------------------------------------------------------------------- */
  function initMedia() {
    const logoImg = $('site-logo');
    if (logoImg) {
      logoImg.src = C.media.logo;
      logoImg.addEventListener('error', function () {
        this.style.display = 'none';
        const fallback = $('site-logo-fallback');
        if (fallback) fallback.style.display = 'flex';
      });
    }

    const hero = $('hero-section');
    if (hero && C.media.heroImage) {
      const testImg = new Image();
      testImg.onload = function () {
        hero.style.setProperty('--hero-image', `url('${C.media.heroImage}')`);
        hero.classList.add('has-image');
      };
      testImg.src = C.media.heroImage;
    }

    if ($('hero-title')) $('hero-title').textContent = C.siteName;
    if ($('hero-tagline')) $('hero-tagline').textContent = C.tagline;
    if ($('hero-desc')) $('hero-desc').textContent = C.heroDescription;
    if ($('site-name-text')) $('site-name-text').textContent = C.siteName.toUpperCase();
  }

  function initNav() {
    const bar = $('nav-menu-bar');
    if (!bar) return;
    const currentPage = (location.pathname.split('/').pop() || 'index.html');
    bar.innerHTML = C.nav.map(item => {
      const isActive = item.href === currentPage;
      return `<a href="${item.href}" class="menu-btn${isActive ? ' active' : ''}"${isActive ? ' aria-current="page"' : ''}>${item.label}</a>`;
    }).join('');
  }

  /* ---------------------------------------------------------------------
     2. ANNOUNCEMENT BANNER
     --------------------------------------------------------------------- */
  function initAnnouncement() {
    const el = $('announcement-banner');
    if (!el) return;
    if (!C.announcement.show) { el.style.display = 'none'; return; }
    el.innerHTML = `
      <div class="ad-title-bar"><span>📢</span> ${escapeHTML(C.announcement.label)}</div>
      <p class="ad-body-text"><strong>${escapeHTML(C.announcement.title)}</strong> ${escapeHTML(C.announcement.text)}</p>
      <a class="btn btn-gold" href="${C.announcement.linkHref}">${escapeHTML(C.announcement.linkText)}</a>
    `;
  }

  /* ---------------------------------------------------------------------
     3. PROGRAMS
     --------------------------------------------------------------------- */
  function initPrograms() {
    const grid = $('programs-grid');
    if (!grid) return;
    grid.innerHTML = C.programs.map((p, i) => `
      <div class="card reveal" style="animation-delay:${i * 0.05}s">
        <span class="card-icon">${p.icon}</span>
        <h3 class="card-title">${escapeHTML(p.title)}</h3>
        <p class="card-text">${escapeHTML(p.text)}</p>
      </div>
    `).join('');
  }

  /* ---------------------------------------------------------------------
     3b. TRUST STRIP — first four program areas, no invented statistics
     --------------------------------------------------------------------- */
  function initTrust() {
    const grid = $('trust-grid');
    if (!grid) return;
    grid.innerHTML = C.programs.slice(0, 4).map((p, i) => `
      <div class="card stat-card reveal" style="animation-delay:${i * 0.05}s">
        <span class="card-icon">${p.icon}</span>
        <h3 class="card-title">${escapeHTML(p.title)}</h3>
      </div>
    `).join('');
  }

  /* ---------------------------------------------------------------------
     4. DAILY MOTIVATION — deterministic by day of year, no server needed
     --------------------------------------------------------------------- */
  function initDailyMotivation() {
    const el = $('motivation-card');
    if (!el || !C.dailyMotivations.length) return;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / 86400000);
    const item = C.dailyMotivations[dayOfYear % C.dailyMotivations.length];
    el.innerHTML = `
      <span class="card-tag">${escapeHTML(item.tag)}</span>
      <h3 class="card-title">${escapeHTML(item.title)}</h3>
      <p class="card-text">${escapeHTML(item.text)}</p>
    `;
  }

  /* ---------------------------------------------------------------------
     5. PRAYER TIMES — real calculation via the Aladhan API
     Uses the visitor's location if they allow it, otherwise falls back to
     the city configured in content.js. Falls back to cached times if
     offline, and to nothing (with a clear message) if neither works.
     --------------------------------------------------------------------- */
  const PRAYER_CACHE_KEY = 'hog_prayer_cache_v1';
  let prayerTimesToday = null; // [{name, date:Date}]
  let notifiedToday = new Set();

  async function fetchPrayerTimes(lat, lng) {
    const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=${C.location.calculationMethod}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Prayer time API request failed');
    const data = await res.json();
    if (!data || !data.data || !data.data.timings) throw new Error('Unexpected API response');
    const h = data.data.date && data.data.date.hijri;
    const hijriDate = h ? `${h.day} ${h.month.en} ${h.year} AH` : null;
    return { timings: data.data.timings, hijriDate };
  }

  function cachePrayerTimes(timingsWrap, sourceLabel, lat, lng) {
    try {
      localStorage.setItem(PRAYER_CACHE_KEY, JSON.stringify({
        date: new Date().toDateString(),
        timings: timingsWrap.timings, hijriDate: timingsWrap.hijriDate, sourceLabel, lat, lng
      }));
    } catch (e) { /* storage unavailable — safe to ignore */ }
  }

  function readCachedPrayerTimes() {
    try {
      const raw = localStorage.getItem(PRAYER_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.date !== new Date().toDateString()) return null; // stale
      return parsed;
    } catch (e) { return null; }
  }

  function buildTodayPrayerList(timings) {
    const wanted = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const now = new Date();
    return wanted.map(name => {
      const [h, m] = (timings[name] || '00:00').split(':').map(Number);
      return { name, date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0) };
    });
  }

  function renderPrayerRows(list) {
    list.forEach(p => {
      const row = $('p-' + p.name.toLowerCase());
      if (!row) return;
      const timeStr = p.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      row.querySelector('.prayer-time').textContent = timeStr;
    });
  }

  function updatePrayerCountdown() {
    if (!prayerTimesToday) return;
    const now = new Date();
    let next = null, diff = Infinity;
    prayerTimesToday.forEach(p => {
      const d = p.date - now;
      if (d > 0 && d < diff) { diff = d; next = p; }
    });
    if (!next) {
      // all of today's prayers passed — count to tomorrow's Fajr as an estimate
      next = prayerTimesToday[0];
      diff = (next.date.getTime() + 86400000) - now.getTime();
    }
    prayerTimesToday.forEach(p => {
      const row = $('p-' + p.name.toLowerCase());
      if (row) row.classList.remove('active-prayer');
    });
    const totalSeconds = Math.max(0, Math.floor(diff / 1000));
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const timer = $('countdown-timer');
    if (timer) timer.textContent = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const label = $('countdown-label');
    if (label) label.textContent = `Time remaining until ${next.name}`;
    const row = $('p-' + next.name.toLowerCase());
    if (row) row.classList.add('active-prayer');

    maybeNotify(next, diff);
  }

  function maybeNotify(next, diffMs) {
    if (!notificationsEnabled) return;
    const key = next.name + '-' + next.date.toDateString();
    if (diffMs <= 1000 && !notifiedToday.has(key)) {
      notifiedToday.add(key);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`${next.name} time`, {
          body: `It's time for ${next.name} prayer.`,
          icon: C.media.logo
        });
      }
    }
  }

  let notificationsEnabled = false;

  function initNotificationToggle() {
    const btn = $('notify-toggle-btn');
    if (!btn) return;
    if (!('Notification' in window)) {
      btn.textContent = 'Notifications not supported on this browser';
      btn.disabled = true;
      return;
    }
    notificationsEnabled = Notification.permission === 'granted';
    updateNotifyBtnLabel(btn);
    btn.addEventListener('click', async () => {
      if (Notification.permission === 'denied') {
        alert('Notifications are blocked for this site in your browser settings. Enable them there to get prayer alerts.');
        return;
      }
      const perm = await Notification.requestPermission();
      notificationsEnabled = perm === 'granted';
      updateNotifyBtnLabel(btn);
    });
  }

  function updateNotifyBtnLabel(btn) {
    btn.textContent = notificationsEnabled
      ? '🔔 Prayer notifications on'
      : '🔕 Turn on prayer notifications';
    btn.classList.toggle('btn-gold', notificationsEnabled);
    btn.classList.toggle('btn-ghost', !notificationsEnabled);
  }

  async function initPrayerHub() {
    const note = $('prayer-source-note');
    const dateEl = $('celestial-date');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    async function loadWith(lat, lng, label) {
      const timings = await fetchPrayerTimes(lat, lng);
      cachePrayerTimes(timings, label, lat, lng);
      prayerTimesToday = buildTodayPrayerList(timings.timings || timings);
      renderPrayerRows(prayerTimesToday);
      renderQibla(lat, lng);
      const hijri = (timings.hijriDate) ? timings.hijriDate : null;
      if (hijri && dateEl) {
        dateEl.textContent = `${dateEl.textContent} · ${hijri}`;
      }
      if (note) note.textContent = `Prayer times calculated for ${label}. Times shown are estimates from the Aladhan calculation service — please confirm with your local mosque for exact timing.`;
    }

    // Try precise geolocation first, then configured city, then cache.
    try {
      const pos = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('no geolocation'));
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000 });
      });
      await loadWith(pos.coords.latitude, pos.coords.longitude, 'your current location');
    } catch (e1) {
      try {
        await loadWith(C.location.lat, C.location.lng, `${C.location.city}, ${C.location.country}`);
      } catch (e2) {
        const cached = readCachedPrayerTimes();
        if (cached) {
          prayerTimesToday = buildTodayPrayerList(cached.timings);
          renderPrayerRows(prayerTimesToday);
          if (cached.lat && cached.lng) renderQibla(cached.lat, cached.lng);
          if (cached.hijriDate && dateEl) dateEl.textContent = `${dateEl.textContent} · ${cached.hijriDate}`;
          if (note) note.textContent = `Showing prayer times cached earlier today for ${cached.sourceLabel}. We couldn't reach the prayer time service just now.`;
        } else {
          renderQibla(C.location.lat, C.location.lng);
          if (note) note.textContent = 'Unable to load live prayer times right now — please check your connection and reload. Qibla direction below is estimated from your configured city.';
        }
      }
    }

    updatePrayerCountdown();
    setInterval(updatePrayerCountdown, 1000);
    initNotificationToggle();
  }

  /* ---------------------------------------------------------------------
     5b. QIBLA DIRECTION — real great-circle bearing to the Kaaba
     --------------------------------------------------------------------- */
  const KAABA_LAT = 21.4225;
  const KAABA_LNG = 39.8262;

  function computeQiblaBearing(lat, lng) {
    const toRad = d => d * Math.PI / 180;
    const toDeg = r => r * 180 / Math.PI;
    const phi1 = toRad(lat), phi2 = toRad(KAABA_LAT);
    const deltaLambda = toRad(KAABA_LNG - lng);
    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
    let bearing = toDeg(Math.atan2(y, x));
    return (bearing + 360) % 360;
  }

  function renderQibla(lat, lng) {
    const el = $('qibla-value');
    if (!el) return;
    const bearing = computeQiblaBearing(lat, lng);
    el.textContent = `${Math.round(bearing)}° from true North`;
    const arrow = $('qibla-arrow');
    if (arrow) arrow.style.transform = `rotate(${bearing}deg)`;
  }

  /* ---------------------------------------------------------------------
     6. DAILY AYAH — real Qur'an text from api.alquran.cloud
     --------------------------------------------------------------------- */
  async function initDailyAyah() {
    const wrap = $('ayah-card');
    if (!wrap) return;

    function render(arabic, translation, reference, audioUrl) {
      wrap.innerHTML = `
        <p class="ayah-arabic">${escapeHTML(arabic)}</p>
        <p class="ayah-translation">"${escapeHTML(translation)}"</p>
        <p class="ayah-reference">${escapeHTML(reference)}</p>
        ${audioUrl ? `<audio class="ayah-audio" controls src="${audioUrl}"></audio>` : ''}
        <button class="btn btn-ghost ayah-share-btn" style="margin-top:1rem" data-arabic="${escapeHTML(arabic)}" data-translation="${escapeHTML(translation)}" data-reference="${escapeHTML(reference)}">Share this Ayah</button>
      `;
      const shareBtn = wrap.querySelector('.ayah-share-btn');
      shareBtn.addEventListener('click', () => {
        const text = `"${translation}"\n— ${reference}\n\nShared from House of Guidance`;
        if (navigator.share) {
          navigator.share({ text }).catch(() => {});
        } else {
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        }
      });
    }

    // Deterministic ayah of the day (same for everyone, changes daily) —
    // picks a surah/ayah number from the day of year, within Al-Fatiha's
    // and a rotating set of well-known short surahs, then fetches the
    // real text. If the API is unreachable, show the fallback ayah from
    // content.js instead of guessing at Qur'an text.
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / 86400000);
    // A safe range within Surah Al-Baqarah's ayat (286 verses) keeps this
    // simple; ayah 1 is Surah Al-Fatiha's opening.
    const ayahGlobalNumber = 1 + (dayOfYear % 286) + 7; // offset past Al-Fatiha's 7 ayat

    try {
      const [arRes, enRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/ayah/${ayahGlobalNumber}/quran-uthmani`),
        fetch(`https://api.alquran.cloud/v1/ayah/${ayahGlobalNumber}/en.sahih`)
      ]);
      if (!arRes.ok || !enRes.ok) throw new Error('Qur\'an API request failed');
      const arData = await arRes.json();
      const enData = await enRes.json();
      const arabic = arData.data.text;
      const translation = enData.data.text;
      const surahName = enData.data.surah.englishName;
      const ayahNum = enData.data.numberInSurah;
      const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayahGlobalNumber}.mp3`;
      render(arabic, translation, `Surah ${surahName}, ${enData.data.surah.number}:${ayahNum}`, audioUrl);
    } catch (e) {
      render(C.fallbackAyah.arabic, C.fallbackAyah.translation, C.fallbackAyah.reference, null);
    }
  }

  /* ---------------------------------------------------------------------
     6b. SAKINAH — breathing guide + verses of comfort
     --------------------------------------------------------------------- */
  let breathingTimer = null;

  function initSakinah() {
    const wrap = $('sakinah-widget');
    if (!wrap) return;

    const circle = $('sakinah-circle');
    const phaseLabel = $('sakinah-phase');
    const cycleLabel = $('sakinah-cycle');
    const startBtn = $('sakinah-start-btn');
    const pattern = C.breathingPattern;

    function stopBreathing(message) {
      clearInterval(breathingTimer);
      breathingTimer = null;
      circle.classList.remove('breathing-inhale', 'breathing-exhale', 'breathing-hold');
      circle.style.transform = 'scale(1)';
      startBtn.textContent = 'Begin breathing';
      if (message) { phaseLabel.textContent = message; cycleLabel.textContent = ''; }
    }

    function runCycle(cycleNum) {
      if (cycleNum > pattern.cycles) {
        stopBreathing('Alhamdulillah. Carry that calm with you.');
        return;
      }
      cycleLabel.textContent = `Breath ${cycleNum} of ${pattern.cycles}`;

      phaseLabel.textContent = 'Breathe in…';
      circle.classList.remove('breathing-exhale', 'breathing-hold');
      circle.classList.add('breathing-inhale');
      circle.style.transitionDuration = pattern.inhale + 's';
      circle.style.transform = 'scale(1.35)';

      breathingTimer = setTimeout(() => {
        phaseLabel.textContent = 'Hold…';
        circle.classList.remove('breathing-inhale');
        circle.classList.add('breathing-hold');

        breathingTimer = setTimeout(() => {
          phaseLabel.textContent = 'Breathe out…';
          circle.classList.remove('breathing-hold');
          circle.classList.add('breathing-exhale');
          circle.style.transitionDuration = pattern.exhale + 's';
          circle.style.transform = 'scale(1)';

          breathingTimer = setTimeout(() => runCycle(cycleNum + 1), pattern.exhale * 1000);
        }, pattern.hold * 1000);
      }, pattern.inhale * 1000);
    }

    startBtn.addEventListener('click', () => {
      if (breathingTimer) { stopBreathing('Paused. Tap to begin again.'); return; }
      startBtn.textContent = 'Stop';
      runCycle(1);
    });

    // Verses of comfort
    const verseCard = $('sakinah-verse-card');
    const newVerseBtn = $('sakinah-new-verse-btn');

    async function loadComfortVerse() {
      verseCard.innerHTML = `<p class="card-text">Loading a verse of comfort…</p>`;
      const choice = C.comfortVerses[Math.floor(Math.random() * C.comfortVerses.length)];
      try {
        const [arRes, enRes] = await Promise.all([
          fetch(`https://api.alquran.cloud/v1/ayah/${choice.ref}/quran-uthmani`),
          fetch(`https://api.alquran.cloud/v1/ayah/${choice.ref}/en.sahih`)
        ]);
        if (!arRes.ok || !enRes.ok) throw new Error('Qur\'an API request failed');
        const arData = await arRes.json();
        const enData = await enRes.json();
        const arabic = arData.data.text;
        const translation = enData.data.text;
        const surahName = enData.data.surah.englishName;
        const surahNum = enData.data.surah.number;
        const ayahNum = enData.data.numberInSurah;
        const globalNumber = enData.data.number;
        const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalNumber}.mp3`;
        verseCard.innerHTML = `
          <p class="ayah-arabic">${escapeHTML(arabic)}</p>
          <p class="ayah-translation">"${escapeHTML(translation)}"</p>
          <p class="ayah-reference">Surah ${escapeHTML(surahName)}, ${surahNum}:${ayahNum}</p>
          <audio class="ayah-audio" controls src="${audioUrl}"></audio>
        `;
      } catch (e) {
        verseCard.innerHTML = `
          <p class="ayah-arabic">${escapeHTML(C.fallbackAyah.arabic)}</p>
          <p class="ayah-translation">"${escapeHTML(C.fallbackAyah.translation)}"</p>
          <p class="ayah-reference">${escapeHTML(C.fallbackAyah.reference)}</p>
        `;
      }
    }

    newVerseBtn.addEventListener('click', loadComfortVerse);
    loadComfortVerse();
  }

  /* ---------------------------------------------------------------------
     7. KHUTBAHS / EVENTS / GALLERY — render only real, configured items
     --------------------------------------------------------------------- */
  function initKhutbahs() {
    const wrap = $('khutbahs-list');
    if (!wrap) return;
    if (!C.khutbahs.length) {
      wrap.innerHTML = `<div class="empty-state">No khutbah recordings uploaded yet. Add entries to <code>khutbahs</code> in content.js once audio files are ready.</div>`;
      return;
    }
    wrap.innerHTML = C.khutbahs.map(k => `
      <div class="card khutbah-row">
        <button class="khutbah-play" aria-label="Play ${escapeHTML(k.title)}" data-audio="${k.audio}">▶</button>
        <div class="khutbah-meta">
          <h3 class="card-title">${escapeHTML(k.title)}</h3>
          <p class="card-text">${escapeHTML(k.speaker)} · ${escapeHTML(k.date)}</p>
        </div>
      </div>
    `).join('');

    let currentAudio = null;
    wrap.querySelectorAll('.khutbah-play').forEach(btn => {
      btn.addEventListener('click', () => {
        const src = btn.getAttribute('data-audio');
        if (!src) return;
        if (currentAudio) { currentAudio.pause(); }
        currentAudio = new Audio(src);
        currentAudio.play().catch(() => alert('Could not play this recording.'));
      });
    });
  }

  function initEvents() {
    const wrap = $('events-list');
    if (!wrap) return;
    if (!C.events.length) {
      wrap.innerHTML = `<div class="empty-state">No events scheduled right now — check back soon.</div>`;
      return;
    }
    wrap.innerHTML = C.events.map(ev => `
      <div class="card event-card">
        <span class="event-date">${escapeHTML(ev.date)}</span>
        <h3 class="card-title">${escapeHTML(ev.title)}</h3>
        <p class="card-text">${escapeHTML(ev.description)}</p>
        <a class="btn btn-gold" style="margin-top:0.85rem" href="${ev.registerHref}">Register</a>
      </div>
    `).join('');
  }

  function initGallery() {
    const wrap = $('gallery-grid');
    if (!wrap) return;
    if (!C.gallery.length) {
      wrap.innerHTML = `<div class="empty-state">No photos uploaded yet. Add entries to <code>gallery</code> in content.js once you have real photos.</div>`;
      return;
    }
    wrap.innerHTML = C.gallery.map((g, i) => `
      <button class="gallery-item" data-src="${g.path}" data-caption="${escapeHTML(g.caption)}" aria-label="View: ${escapeHTML(g.caption)}">
        <img src="${g.path}" alt="${escapeHTML(g.caption)}" loading="lazy">
      </button>
    `).join('');

    const lightbox = $('lightbox');
    const lightboxImg = $('lightbox-img');
    if (!lightbox || !lightboxImg) return;
    wrap.querySelectorAll('.gallery-item').forEach(btn => {
      btn.addEventListener('click', () => {
        lightboxImg.src = btn.getAttribute('data-src');
        lightboxImg.alt = btn.getAttribute('data-caption');
        lightbox.classList.add('open');
      });
    });
    $('lightbox-close')?.addEventListener('click', () => lightbox.classList.remove('open'));
    lightbox.addEventListener('click', e => { if (e.target === lightbox) lightbox.classList.remove('open'); });
  }

  /* ---------------------------------------------------------------------
     7b. REGISTRATION FORM (portal.html) — Netlify Forms, no fake backend
     --------------------------------------------------------------------- */
  function initRegistrationForm() {
    const form = $('registration-form');
    if (!form) return;

    const programSelect = $('field-program');
    if (programSelect) {
      programSelect.innerHTML = '<option value="" disabled selected>Choose a program</option>' +
        C.programs.map(p => `<option value="${escapeHTML(p.title)}">${escapeHTML(p.title)}</option>`).join('');
    }

    const requiredFields = ['field-name', 'field-phone', 'field-age', 'field-gender', 'field-program', 'field-language', 'field-schedule'];

    function validate() {
      let valid = true;
      requiredFields.forEach(id => {
        const el = $(id);
        const wrap = el.closest('.form-field');
        const empty = !el.value || !el.value.trim();
        wrap.classList.toggle('has-error', empty);
        if (empty) valid = false;
      });
      const phone = $('field-phone');
      if (phone.value && !/^[0-9+\s-]{7,15}$/.test(phone.value.trim())) {
        phone.closest('.form-field').classList.add('has-error');
        valid = false;
      }
      const age = $('field-age');
      if (age.value && (Number(age.value) < 3 || Number(age.value) > 100)) {
        age.closest('.form-field').classList.add('has-error');
        valid = false;
      }
      return valid;
    }

    requiredFields.forEach(id => {
      $(id).addEventListener('input', () => $(id).closest('.form-field').classList.remove('has-error'));
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validate()) {
        form.querySelector('.has-error input, .has-error select')?.focus();
        return;
      }
      const submitBtn = $('registration-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting…';

      const formData = new FormData(form);
      const encoded = new URLSearchParams(formData).toString();

      try {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: encoded
        });
        if (!res.ok) throw new Error('Submission failed');
        form.style.display = 'none';
        $('registration-success').style.display = 'block';
      } catch (err) {
        alert("We couldn't submit the form. Please check your connection and try again, or reach us directly on WhatsApp.");
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Registration';
        console.error('Registration submit error:', err);
      }
    });
  }

  /* ---------------------------------------------------------------------
     7b. DHIKR COUNTER — tap-to-count, per-phrase, saved locally
     --------------------------------------------------------------------- */
  const DHIKR_STORAGE_KEY = 'hog_dhikr_counts_v1';

  function readDhikrCounts() {
    try { return JSON.parse(localStorage.getItem(DHIKR_STORAGE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function writeDhikrCounts(obj) {
    try { localStorage.setItem(DHIKR_STORAGE_KEY, JSON.stringify(obj)); } catch (e) { /* ignore */ }
  }

  function initDhikrCounter() {
    const wrap = $('dhikr-counter');
    if (!wrap || !C.dhikrOptions.length) return;

    const select = $('dhikr-select');
    const tapBtn = $('dhikr-tap-btn');
    const countEl = $('dhikr-count');
    const targetSelect = $('dhikr-target');
    const resetBtn = $('dhikr-reset-btn');
    const arabicEl = $('dhikr-arabic');
    const meaningEl = $('dhikr-meaning');
    const ringEl = $('dhikr-ring');

    select.innerHTML = C.dhikrOptions.map((d, i) => `<option value="${i}">${escapeHTML(d.transliteration)}</option>`).join('');

    let counts = readDhikrCounts();
    let currentIndex = 0;
    let target = 33;

    function keyFor(i) { return C.dhikrOptions[i].transliteration; }

    function render() {
      const d = C.dhikrOptions[currentIndex];
      arabicEl.textContent = d.arabic;
      meaningEl.textContent = `${d.transliteration} — ${d.meaning}`;
      const count = counts[keyFor(currentIndex)] || 0;
      countEl.textContent = count;
      const pct = Math.min(100, (count % target === 0 && count > 0 ? target : count % target) / target * 100);
      ringEl.style.setProperty('--pct', pct);
    }

    select.addEventListener('change', () => { currentIndex = Number(select.value); render(); });
    targetSelect.addEventListener('change', () => { target = Number(targetSelect.value); render(); });

    tapBtn.addEventListener('click', () => {
      const key = keyFor(currentIndex);
      counts[key] = (counts[key] || 0) + 1;
      writeDhikrCounts(counts);
      tapBtn.classList.remove('dhikr-bump');
      void tapBtn.offsetWidth; // restart animation
      tapBtn.classList.add('dhikr-bump');

      if (counts[key] % target === 0) {
        if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
        tapBtn.classList.add('dhikr-milestone');
        setTimeout(() => tapBtn.classList.remove('dhikr-milestone'), 700);
      } else if (navigator.vibrate) {
        navigator.vibrate(12);
      }
      render();
    });

    resetBtn.addEventListener('click', () => {
      if (!confirm('Reset this count to zero?')) return;
      counts[keyFor(currentIndex)] = 0;
      writeDhikrCounts(counts);
      render();
    });

    render();
  }

  /* ---------------------------------------------------------------------
     7c. HALAL QUIZ — light Islamic knowledge quiz with celebration
     --------------------------------------------------------------------- */
  function initQuiz() {
    const wrap = $('quiz-widget');
    if (!wrap || !C.quizQuestions.length) return;

    const questions = C.quizQuestions;
    let current = 0;
    let score = 0;
    let answered = false;

    const stage = $('quiz-stage');
    const progressEl = $('quiz-progress');

    function renderQuestion() {
      answered = false;
      const q = questions[current];
      progressEl.textContent = `Question ${current + 1} of ${questions.length}`;
      stage.innerHTML = `
        <h3 class="card-title">${escapeHTML(q.question)}</h3>
        <div class="quiz-options">
          ${q.options.map((opt, i) => `<button class="quiz-option-btn" data-i="${i}">${escapeHTML(opt)}</button>`).join('')}
        </div>
      `;
      stage.querySelectorAll('.quiz-option-btn').forEach(btn => {
        btn.addEventListener('click', () => selectAnswer(Number(btn.dataset.i), q));
      });
    }

    function selectAnswer(i, q) {
      if (answered) return;
      answered = true;
      const buttons = stage.querySelectorAll('.quiz-option-btn');
      buttons.forEach(b => b.disabled = true);
      const correct = i === q.correctIndex;
      buttons[i].classList.add(correct ? 'is-correct' : 'is-wrong');
      if (!correct) buttons[q.correctIndex].classList.add('is-correct');
      if (correct) score++;

      setTimeout(() => {
        current++;
        if (current < questions.length) renderQuestion();
        else renderResult();
      }, 900);
    }

    function renderResult() {
      const pct = Math.round((score / questions.length) * 100);
      const passed = pct >= 70;
      progressEl.textContent = '';
      stage.innerHTML = `
        <div class="quiz-result">
          <div class="quiz-result-score">${score} / ${questions.length}</div>
          <h3 class="card-title">${passed ? 'Congratulations! 🎉' : 'Good effort!'}</h3>
          <p class="card-text">${passed
            ? "MashaAllah, you know your basics well!"
            : "Have another go — every attempt is good practice."}</p>
          <button id="quiz-restart-btn" class="btn btn-gold" style="margin-top:1rem">Play again</button>
        </div>
      `;
      $('quiz-restart-btn').addEventListener('click', () => { current = 0; score = 0; renderQuestion(); });
      if (passed) celebrate(wrap);
    }

    renderQuestion();
  }

  function celebrate(container) {
    const layer = document.createElement('div');
    layer.className = 'celebrate-layer';
    container.appendChild(layer);
    const symbols = ['💚', '💛', '✨', '🤍', '⭐'];
    const count = 26;
    for (let i = 0; i < count; i++) {
      const span = document.createElement('span');
      span.className = 'celebrate-piece';
      span.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      span.style.left = Math.random() * 100 + '%';
      span.style.animationDelay = (Math.random() * 0.6) + 's';
      span.style.animationDuration = (2.2 + Math.random() * 1.4) + 's';
      span.style.fontSize = (14 + Math.random() * 14) + 'px';
      layer.appendChild(span);
    }
    setTimeout(() => layer.remove(), 4200);
  }

  /* ---------------------------------------------------------------------
     8. SOCIAL DOCK — disabled until real links are configured
     --------------------------------------------------------------------- */
  function initSocial() {
    const wa = $('social-whatsapp');
    const tt = $('social-tiktok');
    [[wa, C.social.whatsapp], [tt, C.social.tiktok]].forEach(([el, href]) => {
      if (!el) return;
      if (href) { el.href = href; }
      else { el.classList.add('is-disabled'); el.removeAttribute('href'); el.setAttribute('aria-disabled', 'true'); }
    });
  }

  /* ---------------------------------------------------------------------
     9. FOOTER
     --------------------------------------------------------------------- */
  function initFooter() {
    const y = $('footer-year');
    if (y) y.textContent = new Date().getFullYear();
    const brand = $('footer-brand-name');
    if (brand) brand.textContent = C.siteName;
  }

  /* ---------------------------------------------------------------------
     10. SCROLL REVEAL
     --------------------------------------------------------------------- */
  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || !items.length) {
      items.forEach(el => el.classList.add('in-view'));
      return;
    }
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('in-view'); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.15 });
    items.forEach(el => obs.observe(el));
  }

  /* ---------------------------------------------------------------------
     11. NOOR AI ASSISTANT
     --------------------------------------------------------------------- */
  let speechEnabled = true;

  function toggleChatWindow() {
    const box = $('guidance-chatbot');
    if (!box) return;
    const willOpen = !box.classList.contains('open');
    box.classList.toggle('open', willOpen);
    if (willOpen) $('chat-user-text')?.focus();
  }

  function handleChatEnter(e) { if (e.key === 'Enter') processUserChat(); }

  function speakAssistantReply(text) {
    if (!speechEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/<[^>]*>/g, '');
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = /\b(Oli otya|Gyebale|Mwebale|Kale|Otyanno)\b/i.test(text) ? 'en-ZA' : 'en-US';
    utter.rate = 0.92;
    window.speechSynthesis.speak(utter);
  }

  function appendUserMessage(text) {
    const conv = $('chat-conversation');
    const div = document.createElement('div');
    div.className = 'chat-msg msg-user';
    div.textContent = text;
    conv.appendChild(div);
    conv.scrollTop = conv.scrollHeight;
  }

  function appendTyping() {
    const conv = $('chat-conversation');
    const div = document.createElement('div');
    div.className = 'chat-msg msg-bot';
    div.id = 'typing-indicator';
    div.innerHTML = '<span class="typing-indicator"><span></span><span></span><span></span></span>';
    conv.appendChild(div);
    conv.scrollTop = conv.scrollHeight;
    return div;
  }

  function appendBotMessage(rawText) {
    const conv = $('chat-conversation');
    const div = document.createElement('div');
    div.className = 'chat-msg msg-bot';
    div.innerHTML = safeMarkdownToHTML(rawText) + ' <span class="speaking-wave" aria-hidden="true"></span>';
    conv.appendChild(div);
    conv.scrollTop = conv.scrollHeight;
    speakAssistantReply(rawText);
  }

  async function processUserChat(prefilled) {
    const input = $('chat-user-text');
    const userMsg = (prefilled ?? input.value).trim();
    if (!userMsg) return;
    appendUserMessage(userMsg);
    if (!prefilled) input.value = '';

    const typing = appendTyping();

    try {
      const response = await fetch(C.chatEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await response.json();
      typing.remove();
      if (data && typeof data.reply === 'string' && data.reply.trim()) {
        appendBotMessage(data.reply);
      } else {
        appendBotMessage("SubhanAllah, I had a small glitch. Could you ask that again?");
      }
    } catch (err) {
      typing.remove();
      appendBotMessage("I'm having trouble connecting right now. Please try again in a moment.");
      console.error('Noor chat error:', err);
    }
  }

  function initChat() {
    if (!$('guidance-chatbot')) return;
    $('chat-trigger')?.addEventListener('click', toggleChatWindow);
    $('chat-close')?.addEventListener('click', toggleChatWindow);
    $('chat-send-btn')?.addEventListener('click', () => processUserChat());
    $('chat-user-text')?.addEventListener('keypress', handleChatEnter);

    const speechBtn = $('chat-speech-toggle');
    if (speechBtn) {
      speechBtn.addEventListener('click', () => {
        speechEnabled = !speechEnabled;
        speechBtn.classList.toggle('is-active', speechEnabled);
        speechBtn.setAttribute('aria-pressed', String(speechEnabled));
        if (!speechEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel();
      });
    }

    document.querySelectorAll('.quick-reply-btn').forEach(btn => {
      btn.addEventListener('click', () => processUserChat(btn.textContent.trim()));
    });

    // Optional mic input — gracefully does nothing if unsupported.
    const micBtn = $('chat-mic-btn');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (micBtn) {
      if (!SpeechRecognition) {
        micBtn.style.display = 'none';
      } else {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        micBtn.addEventListener('click', () => {
          try { recognition.start(); micBtn.classList.add('is-active'); }
          catch (e) { /* already listening */ }
        });
        recognition.onresult = (e) => {
          const text = e.results[0][0].transcript;
          $('chat-user-text').value = text;
        };
        recognition.onend = () => micBtn.classList.remove('is-active');
        recognition.onerror = () => micBtn.classList.remove('is-active');
      }
    }
  }

  /* ---------------------------------------------------------------------
     INIT
     --------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initMedia();
    initNav();
    initAnnouncement();
    initTrust();
    initPrograms();
    initDailyMotivation();
    initPrayerHub();
    initDailyAyah();
    initSakinah();
    initDhikrCounter();
    initQuiz();
    initKhutbahs();
    initEvents();
    initGallery();
    initRegistrationForm();
    initSocial();
    initFooter();
    initChat();
    initReveal();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => { /* optional, safe to ignore */ });
    }
  });
})();
