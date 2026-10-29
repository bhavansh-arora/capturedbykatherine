/* Captured by Katherine — core interactions (no animation library required) */
(function () {
  'use strict';
  const CBK = window.CBK || (window.CBK = {});
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = document.documentElement.classList.contains('reduced');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Utilities shared with tools.js ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const util = {
    money(n, opts = {}) {
      const v = Math.round(n * 100) / 100;
      return '$' + v.toLocaleString('en-AU', { minimumFractionDigits: opts.cents && v % 1 ? 2 : 0, maximumFractionDigits: opts.cents ? 2 : 0 });
    },
    incGst(n) { return n * (1 + (CBK.gstRate || 0.1)); },
    parseDate(str) {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str || '');
      if (!m) return null;
      const d = new Date(+m[1], +m[2] - 1, +m[3]);
      return isNaN(d) ? null : d;
    },
    iso(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; },
    niceDate(d, long) {
      return d.toLocaleDateString('en-AU', long
        ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
        : { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    },
    today() { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); },
    monthsBetween(a, b) { return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) - (b.getDate() < a.getDate() ? 1 : 0); },
    // minutes since midnight -> "5:42pm"
    clock(min) {
      min = ((Math.round(min) % 1440) + 1440) % 1440;
      const h = Math.floor(min / 60), m = min % 60;
      return `${((h + 11) % 12) + 1}:${pad(m)}${h < 12 ? 'am' : 'pm'}`;
    },
    // "14:30" -> 870
    toMin(hhmm) { const [h, m] = String(hhmm || '0:0').split(':').map(Number); return h * 60 + (m || 0); },
    // Sunrise / sunset (NOAA sunrise equation). Returns minutes after local midnight.
    sun(date, loc = CBK.location) {
      const rad = Math.PI / 180;
      const jdNoon = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12) / 86400000 + 2440587.5;
      const n = Math.round(jdNoon - 2451545.0);
      const Js = n - loc.lng / 360;
      const M = (357.5291 + 0.98560028 * Js) % 360;
      const C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
      const L = (M + C + 180 + 102.9372) % 360;
      const Jt = 2451545.0 + Js + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * L * rad);
      const decl = Math.asin(Math.sin(L * rad) * Math.sin(23.4397 * rad));
      const cosW = (Math.sin(-0.833 * rad) - Math.sin(loc.lat * rad) * Math.sin(decl)) / (Math.cos(loc.lat * rad) * Math.cos(decl));
      const w = Math.acos(Math.max(-1, Math.min(1, cosW))) / rad;
      const toLocal = (J) => {
        const ms = (J - 2440587.5) * 86400000 + loc.utcOffset * 3600000;
        return (((ms / 60000) % 1440) + 1440) % 1440;
      };
      return { sunrise: toLocal(Jt - w / 360), sunset: toLocal(Jt + w / 360), noon: toLocal(Jt) };
    },
    params() { return new URLSearchParams(location.search); }
  };
  CBK.util = util;

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (!reduced && window.Lenis && finePointer) {
    lenis = new window.Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    CBK.lenis = lenis;
    if (window.gsap) {
      window.gsap.ticker.add((t) => lenis.raf(t * 1000));
      window.gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  CBK.scrollTo = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: -90 });
    else {
      const el = typeof target === 'string' ? $(target) : target;
      if (typeof target === 'number') window.scrollTo({ top: target, behavior: reduced ? 'auto' : 'smooth' });
      else if (el) window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 90, behavior: reduced ? 'auto' : 'smooth' });
    }
  };

  /* ---------- Page curtain ---------- */
  const curtain = $('.curtain');
  window.CBK_READY = true;
  if (curtain) {
    requestAnimationFrame(() => requestAnimationFrame(() => curtain.classList.add('is-out')));
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) { curtain.classList.remove('is-in', 'is-reset'); curtain.classList.add('is-out'); }
    });
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const href = a.getAttribute('href');
    if (a.target === '_blank' || a.hasAttribute('download') || /^(mailto:|tel:|https?:|#)/.test(href)) {
      if (href.startsWith('#') && href.length > 1 && $(href)) { e.preventDefault(); CBK.scrollTo(href); }
      return;
    }
    if (a.hasAttribute('data-lb')) return;
    const url = new URL(href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
    if (!curtain || reduced) return;
    e.preventDefault();
    closeMenu();
    curtain.classList.remove('is-out');
    curtain.classList.add('is-reset');
    void curtain.offsetWidth;
    curtain.classList.remove('is-reset');
    curtain.classList.add('is-in');
    setTimeout(() => { location.href = url.href; }, 620);
  });

  /* ---------- Navigation ---------- */
  const nav = $('[data-nav-root]');
  const burger = $('.nav__burger');
  const menu = $('#menu');
  let lastY = 0;
  function onScroll() {
    const y = window.scrollY;
    if (nav) {
      nav.classList.toggle('is-scrolled', y > 40);
      const hide = y > 500 && y > lastY + 4 && !document.body.classList.contains('menu-open');
      const show = y < lastY - 4 || y < 500;
      if (hide) nav.classList.add('is-hidden'); else if (show) nav.classList.remove('is-hidden');
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function openMenu() {
    document.body.classList.add('menu-open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    menu.setAttribute('aria-hidden', 'false');
    menu.removeAttribute('inert');
    nav.classList.remove('is-hidden');
    if (lenis) lenis.stop(); else document.documentElement.style.overflow = 'hidden';
    setTimeout(() => { const f = $('.menu__links a', menu); f && f.focus({ preventScroll: true }); }, 400);
  }
  function closeMenu() {
    if (!document.body.classList.contains('menu-open')) return;
    document.body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    menu.setAttribute('aria-hidden', 'true');
    menu.setAttribute('inert', '');
    if (lenis) lenis.start(); else document.documentElement.style.overflow = '';
  }
  if (menu) menu.setAttribute('inert', '');
  if (burger) burger.addEventListener('click', () => (document.body.classList.contains('menu-open') ? closeMenu() : openMenu()));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- Back to top & year ---------- */
  $$('[data-top]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); CBK.scrollTo(0); }));
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Hero slideshow ---------- */
  const hero = $('[data-hero]');
  if (hero) {
    const slides = $$('.hero__slide', hero);
    const bars = $$('.hero__bars button', hero);
    const counter = $('[data-hero-count]', hero);
    let i = 0, timer;
    const go = (n) => {
      slides[i].classList.remove('is-active');
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('is-active');
      bars.forEach((b, k) => { b.classList.toggle('is-active', k === i); b.classList.toggle('is-done', k < i); });
      bars.forEach((b) => { const bar = b.querySelector('i'); if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; } });
      if (counter) counter.textContent = pad(i + 1);
      clearTimeout(timer);
      if (!reduced) timer = setTimeout(() => go(i + 1), 6500);
    };
    bars.forEach((b, k) => b.addEventListener('click', () => go(k)));
    if (slides.length > 1) setTimeout(() => go(0), 50);
    document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(timer); else go(i); });
  }

  /* ---------- Custom cursor & magnetic buttons ---------- */
  if (finePointer && !reduced) {
    const cur = $('.cursor');
    const label = cur && $('.cursor__label', cur);
    let x = -100, y = -100, cx = -100, cy = -100;
    window.addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; cur.classList.add('is-visible'); }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.remove('is-visible'));
    const loop = () => {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      cur.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    };
    if (cur) loop();
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('[data-cursor]');
      if (t) { label.textContent = t.dataset.cursor; cur.classList.add('has-label'); }
      cur.classList.toggle('is-hidden', !!e.target.closest('input, textarea, select, .nav, .menu, .lightbox'));
    });
    document.addEventListener('pointerout', (e) => {
      const t = e.target.closest('[data-cursor]');
      if (t && !t.contains(e.relatedTarget)) cur.classList.remove('has-label');
    });

    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * 0.22}px, ${dy * 0.3}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Date availability checker ---------- */
  CBK.checkDate = function (value) {
    const d = util.parseDate(value);
    const today = util.today();
    if (!d) return { state: 'empty', html: 'Pick a date to see if it’s open.' };
    if (d < today) return { state: 'past', html: '<span class="warn">That date has already passed.</span> Pick an upcoming one.' };
    const iso = util.iso(d);
    const sun = util.sun(d);
    const enquire = `enquire.html?date=${iso}`;
    if ((CBK.bookedDates || []).includes(iso)) {
      return { state: 'booked', html: `<span class="warn"><strong>${util.niceDate(d)}</strong> is already booked.</span> Ask about nearby dates. <a href="${enquire}">Enquire →</a>` };
    }
    const months = util.monthsBetween(today, d);
    const when = months < 1 ? 'Under a month away' : months === 1 ? '1 month away' : `${months} months away`;
    let note = ` ${when} · golden hour from ${util.clock(sun.sunset - 60)}.`;
    if (months < 3) note += ' Short notice is fine, Katherine will confirm personally.';
    else if (d.getDay() === 6 && [2, 3, 4, 8, 9, 10].includes(d.getMonth())) note += ' Peak-season Saturdays go first.';
    return { state: 'open', html: `<span class="ok"><strong>${util.niceDate(d)}</strong> looks open.</span>${note} <a href="${enquire}">Hold this date →</a>` };
  };
  $$('[data-datecheck]').forEach((form) => {
    const input = $('input[type="date"]', form);
    const out = $('.datecheck__result', form);
    input.min = util.iso(util.today());
    const run = () => { out.innerHTML = CBK.checkDate(input.value).html; };
    form.addEventListener('submit', (e) => { e.preventDefault(); run(); });
    input.addEventListener('change', run);
  });

  /* ---------- Gallery filters ---------- */
  $$('[data-filters]').forEach((group) => {
    const target = $(group.dataset.filters);
    const buttons = $$('button', group);
    buttons.forEach((b) => b.addEventListener('click', () => {
      buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const f = b.dataset.filter;
      $$('[data-cat]', target).forEach((it) => it.classList.toggle('is-hidden', f !== 'all' && it.dataset.cat !== f));
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }));
    const pre = util.params().get('f');
    const btn = pre && buttons.find((b) => b.dataset.filter === pre);
    if (btn) btn.click();
  });

  /* ---------- Lightbox ---------- */
  const lbItems = () => $$('[data-lb]').filter((a) => !a.classList.contains('is-hidden') && a.offsetParent !== null);
  let lb, lbImg, lbCount, lbCap, lbIndex = 0, lbList = [], lastFocus;
  function buildLightbox() {
    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Image viewer');
    lb.innerHTML = `
      <div class="lightbox__top"><span data-lb-count>01 / 01</span><button class="lightbox__btn" data-lb-close aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
      <div class="lightbox__stage"><img alt=""><button class="lightbox__btn lightbox__prev" data-lb-prev aria-label="Previous image"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M15 6l-6 6 6 6"/></svg></button><button class="lightbox__btn lightbox__next" data-lb-next aria-label="Next image"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m9 6 6 6-6 6"/></svg></button></div>
      <div class="lightbox__bottom"><span data-lb-cap>Captured by Katherine</span><span>← → to browse · Esc to close</span></div>`;
    document.body.appendChild(lb);
    lbImg = $('.lightbox__stage img', lb); lbCount = $('[data-lb-count]', lb); lbCap = $('[data-lb-cap]', lb);
    $('[data-lb-close]', lb).addEventListener('click', closeLb);
    $('[data-lb-prev]', lb).addEventListener('click', () => showLb(lbIndex - 1));
    $('[data-lb-next]', lb).addEventListener('click', () => showLb(lbIndex + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lightbox__stage')) closeLb(); });
    let sx = 0;
    lb.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) showLb(lbIndex + (dx < 0 ? 1 : -1)); });
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowRight') showLb(lbIndex + 1);
      if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
    });
  }
  function showLb(i) {
    lbIndex = (i + lbList.length) % lbList.length;
    const a = lbList[lbIndex];
    const img = $('img', a);
    lbImg.style.opacity = 0;
    const next = new Image();
    next.onload = () => { lbImg.src = next.src; lbImg.alt = img ? img.alt : ''; lbImg.style.opacity = 1; };
    next.src = a.getAttribute('href');
    lbCount.textContent = `${pad(lbIndex + 1)} / ${pad(lbList.length)}`;
    lbCap.textContent = a.dataset.caption || (img && img.alt) || 'Captured by Katherine';
  }
  function closeLb() {
    lb.classList.remove('is-open');
    if (lenis) lenis.start(); else document.documentElement.style.overflow = '';
    lastFocus && lastFocus.focus({ preventScroll: true });
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-lb]');
    if (!a) return;
    e.preventDefault();
    if (!lb) buildLightbox();
    lastFocus = a;
    lbList = lbItems();
    lb.classList.add('is-open');
    if (lenis) lenis.stop(); else document.documentElement.style.overflow = 'hidden';
    showLb(lbList.indexOf(a));
    $('[data-lb-close]', lb).focus({ preventScroll: true });
  });

  /* ---------- Mobile booking bar ---------- */
  if (!document.body.classList.contains('no-mbar')) {
    const bar = document.createElement('div');
    bar.className = 'mbar';
    bar.innerHTML = '<a class="btn btn--copper" href="enquire.html"><span>Check your date</span><i class="btn__dot" aria-hidden="true"></i></a><a class="mbar__call" href="tel:' + CBK.contact.phoneIntl + '" aria-label="Call Katherine"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg></a>';
    document.body.appendChild(bar);
    document.body.classList.add('has-mbar');
    const cta = $('.cta') || $('.footer');
    let ctaVisible = false;
    if (cta && 'IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => { ctaVisible = en.isIntersecting; update(); }).observe(cta);
    }
    function update() { bar.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.7 && !ctaVisible); }
    window.addEventListener('scroll', update, { passive: true });
  }

  /* ---------- Marquee: duplicate tracks for a seamless loop ---------- */
  $$('[data-marquee]').forEach((m) => {
    const track = $('.marquee__track, .strip__track', m);
    if (!track) return;
    const clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    $$('a, button', clone).forEach((el) => el.setAttribute('tabindex', '-1'));
    m.appendChild(clone);
  });
})();
