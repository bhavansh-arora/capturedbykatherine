/* Captured by Katherine — booking tools
   Package finder · Wedding-day planner · Formals splitter · Golden-hour finder · Smart enquiry */
(function () {
  'use strict';
  const CBK = window.CBK;
  const U = CBK.util;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const money = U.money;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* Cheapest way to cover `hours`: a package plus extra hours where that saves money */
  CBK.bestPackage = function (hours) {
    const need = Math.max(1, Math.ceil(hours * 2) / 2);
    let best = null;
    const top = CBK.weddings[CBK.weddings.length - 1];
    CBK.weddings.forEach((p) => {
      const extra = Math.max(0, Math.ceil(need - p.hours));
      // Add-on hours top up a collection; beyond two, step up to the next collection.
      if (extra > CBK.maxExtraHours && p !== top) return;
      const cost = p.price + extra * CBK.extraHourRate;
      if (!best || cost < best.cost || (cost === best.cost && extra < best.extra)) best = { pkg: p, extra, cost, need };
    });
    return best;
  };
  const pkgLabel = (b) => b.pkg.name + (b.extra ? ` + ${b.extra} extra hour${b.extra > 1 ? 's' : ''}` : '');

  /* Upcoming Saturday roughly `months` ahead, as a default date */
  function defaultSaturday(months) {
    const d = U.today();
    d.setMonth(d.getMonth() + months);
    d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
    return U.iso(d);
  }

  /* ---------- Package finder ---------- */
  const MOMENTS = {
    prep: { s: -120, e: 0, label: 'Getting ready' },
    ceremony: { s: -15, e: 30, label: 'Ceremony' },
    family: { s: 30, e: 60, label: 'Family & group photos' },
    portraits: { s: 45, e: 90, label: 'Couple portraits' },
    reception: { s: 150, e: 240, label: 'Entrance & speeches' },
    dance: { s: 240, e: 285, label: 'Cake & first dance' },
    party: { s: 285, e: 360, label: 'Dancefloor' },
    sendoff: { s: 390, e: 450, label: 'Send-off' }
  };
  const finder = $('[data-finder]');
  if (finder) {
    const out = $('[data-finder-out]');
    const run = () => {
      const picked = $$('input[name="moments"]:checked', finder).map((i) => MOMENTS[i.value]);
      $$('.pkg[data-pkg]').forEach((p) => p.classList.remove('is-recommended'));
      if (!picked.length) {
        out.innerHTML = '<p class="eyebrow eyebrow--light">Your match</p><p class="finder__name">Pick a <em>moment</em> or two.</p><p class="lead">Choose the parts of the day you want remembered and the right collection appears here.</p>';
        return;
      }
      const start = Math.min(...picked.map((m) => m.s)), end = Math.max(...picked.map((m) => m.e));
      const best = CBK.bestPackage((end - start) / 60);
      const card = $(`.pkg[data-pkg="${best.pkg.id}"]`);
      if (card) card.classList.add('is-recommended');
      const [first, ...rest] = best.pkg.name.split(' ');
      out.innerHTML = `
        <div>
          <p class="eyebrow eyebrow--light">Your match · about ${best.need} hours of coverage</p>
          <p class="finder__name">${first} <em>${rest.join(' ')}</em></p>
          <p class="lead" style="margin-top:16px">${esc(best.pkg.blurb)}${best.extra ? ` Add ${best.extra} extra hour${best.extra > 1 ? 's' : ''} at ${money(CBK.extraHourRate)}/hr and you’re covered, which works out cheaper than the next collection up.` : ''}</p>
        </div>
        <dl class="stat-row">
          <div><dt>Coverage</dt><dd>${best.pkg.hours + best.extra} hrs</dd></div>
          <div><dt>Investment</dt><dd>${money(best.cost)}</dd></div>
          <div><dt>Deposit</dt><dd>${money(CBK.deposit)}</dd></div>
        </dl>
        <div class="tool__actions" style="margin-top:0">
          <a class="btn btn--copper" href="enquire.html?type=wedding&package=${best.pkg.id}&hours=${best.pkg.hours + best.extra}"><span>Enquire about ${esc(best.pkg.name)}</span><i class="btn__dot" aria-hidden="true"></i></a>
          <a class="btn btn--glass" href="planner.html"><span>Plan the full day</span></a>
        </div>`;
    };
    finder.addEventListener('change', run);
    run();
  }

  /* ---------- Wedding-day planner ---------- */
  const planner = $('[data-planner]');
  if (planner) {
    const f = planner.querySelector('form');
    const out = $('[data-planner-out]');
    const p = U.params();
    if (!f.date.value) f.date.value = p.get('date') || defaultSaturday(10);
    f.date.min = U.iso(U.today());

    const build = () => {
      const d = U.parseDate(f.date.value) || U.parseDate(defaultSaturday(10));
      const sun = U.sun(d);
      const C = U.toMin(f.ceremony.value || '15:00');
      const len = +f.elements.cerlen.value;
      const prep = f.prep.checked;
      const firstLook = f.firstlook.checked;
      const famDur = f.family.value === 'large' ? 35 : 20;
      const travel = +f.travel.value;
      const until = f.until.value;
      const ev = [];
      const add = (t, title, note, cls = '') => ev.push({ t, title, note, cls });

      let start = C - 30;
      if (prep) {
        start = C - (firstLook ? 165 : 120);
        add(start, 'Getting ready & details', 'Dress, rings, invitations, perfume. The little things that tell your story.');
        add(start + 60, 'Final touches', 'Into the dress, buttonholes on, a quiet moment with family.');
      }
      if (firstLook) add(C - 90, 'First look', 'A private moment before the ceremony, plus early portraits while everyone’s fresh.', 'is-key');
      add(C - 30, 'Arrive at the ceremony', 'Guests arriving, the space, the people waiting at the end of the aisle.');
      add(C, 'Ceremony', `${len} minutes. Vows, rings, the first kiss.`, 'is-key');
      let t = C + len;
      add(t, 'Congratulations & confetti', 'Hugs, happy tears and the candid chaos that follows.'); t += 15;
      add(t, 'Family photos', `${famDur} minutes. A shot list keeps this relaxed and quick.`); t += famDur;
      add(t, 'Bridal party', '20 minutes of fun, relaxed group photos.'); t += 20;
      const portraitLen = firstLook ? 15 : 25;
      const goldenStart = sun.sunset - 60;
      const portraitInGold = t + portraitLen > goldenStart && t < sun.sunset;
      add(t, 'Couple portraits', `${portraitLen} minutes, just the two of you.${portraitInGold ? ' Right in golden hour.' : ''}`, portraitInGold ? 'is-sun' : 'is-key'); t += portraitLen;
      if (travel) { add(t, 'Travel to reception', `${travel} minutes.`); t += travel; }

      let R = U.toMin(f.reception.value || '18:00');
      let pushed = false;
      if (R < t) { R = t; pushed = true; }
      if (R - t > 20) add(t, 'Canapés & the room', 'Guests mingling, the styling and details before everyone sits.');
      add(R, 'Reception entrance', pushed ? 'Moved later so nothing feels rushed.' : 'Your grand entrance as newlyweds.', 'is-key');
      add(R + 40, 'Speeches', 'The laughs, the tears and everyone’s reactions.');
      if (!portraitInGold && sun.sunset - 35 > R && sun.sunset - 35 < R + 150) {
        add(sun.sunset - 35, 'Golden-hour sneak-out', '15 minutes outside while the light glows. Often the favourite images of the day.', 'is-sun');
      }
      add(R + 120, 'Cake cutting', '');
      add(R + 135, 'First dance', 'Then the dancefloor opens.', 'is-key');
      add(R + 150, 'Dancefloor', 'Big moves, family on the floor, the fun stuff.');
      add(R + 300, 'Send-off', 'Sparklers, a guard of honour or one last wave goodbye.', 'is-key');

      const endMap = { dance: R + 150, party: R + 225, sendoff: R + 315 };
      const end = endMap[until];
      ev.sort((a, b) => a.t - b.t);
      const hours = (end - start) / 60;
      const best = CBK.bestPackage(hours);

      out.innerHTML = `
        <div class="shead" style="margin-bottom:0;border-color:var(--night-line)"><span class="eyebrow eyebrow--light">Your day · ${esc(U.niceDate(d, true))}</span></div>
        <dl class="stat-row" style="margin-top:22px">
          <div><dt>Coverage</dt><dd>${U.clock(start)}–${U.clock(end)}</dd></div>
          <div><dt>Hours needed</dt><dd>${best.need}</dd></div>
          <div><dt>Sunset</dt><dd>${U.clock(sun.sunset)}</dd></div>
        </dl>
        <div class="tl">${ev.map((e) => `
          <div class="tl__row ${e.cls} ${e.t > end || e.t < start ? 'is-off' : ''}">
            <span class="tl__time">${U.clock(e.t)}</span><span class="tl__dot"></span>
            <span class="tl__what"><strong>${esc(e.title)}${e.t > end ? ' · not covered' : ''}</strong>${e.note ? `<span>${esc(e.note)}</span>` : ''}</span>
          </div>`).join('')}
        </div>
        <div class="result-card">
          <div>
            <p class="eyebrow eyebrow--light">Recommended</p>
            <h4>${esc(pkgLabel(best))}</h4>
            <p>${money(best.cost)} AUD. Your date is secured with a ${money(CBK.deposit)} deposit.</p>
          </div>
          <a class="btn btn--sm no-print" data-plan-send href="#"><span>Send this plan</span><i class="btn__dot" aria-hidden="true"></i></a>
        </div>
        <p class="no-print" style="font-size:13px;color:rgba(255,246,235,.55);margin-top:16px">Times are a guide for ${esc(CBK.location.label)}. Katherine fine-tunes every timeline with you at your venue consultation.</p>`;

      const plan = {
        date: U.iso(d), ceremony: f.ceremony.value, reception: f.reception.value,
        start: U.clock(start), end: U.clock(end), hours: best.need, sunset: U.clock(sun.sunset),
        package: best.pkg.id, packageLabel: pkgLabel(best), cost: best.cost,
        lines: ev.filter((e) => e.t >= start && e.t <= end).map((e) => `${U.clock(e.t)}  ${e.title}`)
      };
      $('[data-plan-send]', out).addEventListener('click', (e) => {
        e.preventDefault();
        try { sessionStorage.setItem('cbk-plan', JSON.stringify(plan)); } catch (err) { /* storage unavailable */ }
        location.href = `enquire.html?type=wedding&date=${plan.date}&package=${plan.package}&hours=${best.pkg.hours + best.extra}&from=planner`;
      });
    };
    f.addEventListener('input', build);
    f.addEventListener('change', build);
    f.addEventListener('submit', (e) => { e.preventDefault(); build(); });
    $$('[data-print]').forEach((b) => b.addEventListener('click', () => window.print()));
    build();
  }

  /* ---------- Formals cost splitter ---------- */
  const fc = $('[data-formal-calc]');
  if (fc) {
    const range = $('input[type="range"]', fc);
    const run = () => {
      const n = +range.value;
      const type = $('input[name="ftype"]:checked', fc).value;
      const L = CBK.lifestyle;
      const ex = type === 'preFormal' ? L.preFormal.price + Math.max(0, n - L.preFormal.includedCouples) * L.preFormal.extraCouple : L.preSemi.price;
      range.style.setProperty('--p', ((n - range.min) / (range.max - range.min)) * 100 + '%');
      $('[data-fc-n]', fc).textContent = n;
      $('[data-fc-total]', fc).innerHTML = `${money(ex)}<small>AUD</small>`;
      $('[data-fc-each]', fc).textContent = money(ex / n, { cents: true });
      $('[data-fc-ex]', fc).textContent = n;
      $('[data-fc-note]', fc).textContent = type === 'preFormal'
        ? (n > 10 ? `${money(L.preFormal.price)} covers 10 couples, plus ${n - 10} × ${money(L.preFormal.extraCouple)}.` : `${money(L.preFormal.price)} covers up to 10 couples.`)
        : 'Flat fee for a two-hour session at one location.';
      $('[data-fc-link]', fc).href = `enquire.html?type=formal&formal=${type}&couples=${n}`;
    };
    fc.addEventListener('input', run);
    run();
  }

  /* ---------- Golden-hour finder ---------- */
  $$('[data-golden]').forEach((g) => {
    const input = $('input[type="date"]', g);
    if (!input.value) input.value = defaultSaturday(1);
    const run = () => {
      const d = U.parseDate(input.value);
      if (!d) return;
      const s = U.sun(d);
      $('[data-g-rise]', g).textContent = U.clock(s.sunrise);
      $('[data-g-gold]', g).textContent = U.clock(s.sunset - 60);
      $('[data-g-set]', g).textContent = U.clock(s.sunset);
      $('[data-g-tip]', g).innerHTML = `For a one-hour session on <strong>${esc(U.niceDate(d, true))}</strong>, start around <strong>${U.clock(s.sunset - 75)}</strong>, or at <strong>${U.clock(s.sunrise + 10)}</strong> if you’re early risers.`;
    };
    input.addEventListener('change', run);
    input.addEventListener('input', run);
    run();
  });

  /* ---------- Smart enquiry ---------- */
  const enq = $('[data-enquiry]');
  if (!enq) return;
  const form = $('form', enq);
  const steps = $$('.enq__step', form);
  const bars = $$('.enq__progress i', enq);
  const label = $('[data-enq-label]', enq);
  const count = $('[data-enq-count]', enq);
  const back = $('[data-enq-back]', enq);
  const next = $('[data-enq-next]', enq);
  const titles = ['The occasion', 'Date & place', 'The details', 'About you', 'Review & send'];
  let cur = 0;
  const val = (n) => { const el = form.elements[n]; if (!el) return ''; if (el instanceof RadioNodeList) return el.value; return el.type === 'checkbox' ? el.checked : el.value.trim(); };
  const OCC = {
    wedding: 'Wedding', family: 'Family session', formal: 'Formal', engagement: 'Engagement shoot',
    headshots: 'Headshots / company profiling', event: 'Event or function', voucher: 'Gift voucher', other: 'Something else'
  };

  // Prefill from links and the planner
  const P = U.params();
  const setRadio = (name, v) => { const r = form.querySelector(`input[name="${name}"][value="${v}"]`); if (r) r.checked = true; };
  if (P.get('type')) setRadio('occasion', P.get('type'));
  if (P.get('date')) form.date.value = P.get('date');
  if (P.get('package')) setRadio('package', P.get('package'));
  if (P.get('hours')) form.hours.value = P.get('hours');
  if (P.get('formal')) setRadio('formal', P.get('formal'));
  if (P.get('couples')) form.couples.value = P.get('couples');
  if (P.get('family')) setRadio('familypkg', P.get('family'));
  let plan = null;
  if (P.get('from') === 'planner') { try { plan = JSON.parse(sessionStorage.getItem('cbk-plan')); } catch (e) { plan = null; } }
  if (plan) {
    $('[data-plan-note]', form).hidden = false;
    $('[data-plan-note] span', form).textContent = `${plan.start}–${plan.end} · ${plan.packageLabel}`;
  }
  form.date.min = U.iso(U.today());

  function showDetails() {
    const o = val('occasion');
    $$('[data-for]', form).forEach((el) => { el.hidden = !el.dataset.for.split(' ').includes(o); });
    estimate();
  }
  function estimate() {
    const o = val('occasion');
    const box = $('[data-estimate]', form);
    let ex = null, note = '';
    if (o === 'wedding') {
      const p = CBK.weddings.find((w) => w.id === val('package'));
      if (p) {
        const hrs = Math.max(p.hours, +val('hours') || p.hours);
        const extra = Math.max(0, Math.ceil(hrs - p.hours));
        ex = p.price + extra * CBK.extraHourRate;
        note = `${p.name}, ${p.hours + extra} hours${extra ? ` (incl. ${extra} extra)` : ''}`;
      } else note = 'Pick a collection, or choose “Help me choose”.';
    } else if (o === 'family') {
      const k = val('familypkg');
      if (k) { ex = CBK.lifestyle[k].price; note = CBK.lifestyle[k].name; }
    } else if (o === 'formal') {
      const k = val('formal'); const n = Math.max(1, +val('couples') || 1);
      if (k === 'preFormal') { ex = 750 + Math.max(0, n - 10) * 75; note = `Pre-Formal, ${n} couple${n > 1 ? 's' : ''}`; }
      else if (k === 'preSemi') { ex = 750; note = 'Pre-Semi Formal, flat fee'; }
    } else note = 'Katherine will tailor a quote for you.';
    box.innerHTML = ex == null
      ? `<span>${esc(note)}</span>`
      : `<div><span>Estimated investment</span><br><b>${money(ex)}</b> <span>AUD</span></div><span style="text-align:right">${esc(note)}</span>`;
    return { ex, note };
  }
  form.addEventListener('change', (e) => {
    if (e.target.name === 'occasion') { $('[data-occ-err]', form).hidden = true; showDetails(); setTimeout(() => go(1), 260); }
    else estimate();
    if (e.target.name === 'date') dateNote();
  });
  form.addEventListener('input', (e) => { if (['couples', 'hours'].includes(e.target.name)) estimate(); });
  function dateNote() {
    const n = $('[data-date-note]', form);
    n.innerHTML = form.date.value ? CBK.checkDate(form.date.value).html : '';
  }

  function validate(i) {
    let ok = true;
    const fail = (name) => { const f = form.elements[name].closest ? form.elements[name].closest('.field') : form.elements[name][0].closest('.field'); f && f.classList.add('has-error'); ok = false; };
    $$('.field.has-error', steps[i]).forEach((f) => f.classList.remove('has-error'));
    if (i === 0 && !val('occasion')) { $('[data-occ-err]', form).hidden = false; ok = false; }
    if (i === 1) {
      const d = U.parseDate(val('date'));
      if (!val('flexible') && (!d || d < U.today())) fail('date');
    }
    if (i === 3) {
      if (!val('first')) fail('first');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('email'))) fail('email');
    }
    if (!ok) { const first = $('.has-error input, .has-error select', steps[i]); first && first.focus(); }
    return ok;
  }

  function summary() {
    const o = val('occasion');
    const d = U.parseDate(val('date'));
    const est = estimate();
    const rows = [
      ['Occasion', OCC[o] || '—'],
      ['Date', d ? U.niceDate(d, true) + (val('flexible') ? ' (flexible)' : '') : (val('flexible') ? 'Flexible' : '—')],
      ['Location', val('location') || 'To be decided'],
      ['Details', est.note || '—'],
      ['Estimate', est.ex == null ? 'Tailored quote' : `${money(est.ex)} AUD`],
      ['People', val('people') || (o === 'formal' ? `${val('couples')} couples` : '—')],
      ['Name', `${val('first')} ${val('last')}`.trim()],
      ['Email', val('email')],
      ['Phone', val('phone') || '—'],
      ['Found us via', $$('input[name="source"]:checked', form).map((c) => c.value).join(', ') || '—']
    ];
    if (plan) rows.push(['Day plan', `${plan.start}–${plan.end}, ${plan.hours} hrs`]);
    $('[data-summary]', form).innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');
    return rows;
  }

  function go(i, silent) {
    if (i > cur && !validate(cur)) return;
    cur = Math.max(0, Math.min(steps.length - 1, i));
    steps.forEach((s, k) => s.classList.toggle('is-active', k === cur));
    bars.forEach((b, k) => b.classList.toggle('is-done', k <= cur));
    label.textContent = titles[cur];
    count.textContent = `Step 0${cur + 1} / 0${steps.length}`;
    back.hidden = cur === 0;
    next.querySelector('span').textContent = cur === steps.length - 1 ? 'Send my enquiry' : 'Continue';
    if (cur === 2) showDetails();
    if (cur === 4) summary();
    if (silent) return;
    const top = $('.enq__card', enq).getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.5) CBK.scrollTo($('.enq__card', enq));
    const focusable = $('input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"]), select, textarea', steps[cur]);
    if (focusable && cur > 0 && cur < 4 && matchMedia('(hover: hover)').matches) setTimeout(() => focusable.focus({ preventScroll: true }), 300);
  }
  back.addEventListener('click', () => go(cur - 1));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (cur < steps.length - 1) { go(cur + 1); return; }
    send();
  });
  $$('[data-goto]', form).forEach((b) => b.addEventListener('click', () => go(+b.dataset.goto)));

  async function send() {
    const rows = summary();
    const lines = rows.map(([k, v]) => `${k}: ${v}`);
    if (val('message')) lines.push('', 'Message:', val('message'));
    if (plan) lines.push('', 'Day plan from the website planner:', ...plan.lines);
    const o = OCC[val('occasion')] || 'Enquiry';
    const d = U.parseDate(val('date'));
    const subject = `New enquiry: ${o}${d ? ' · ' + U.niceDate(d) : ''} · ${val('first')} ${val('last')}`.trim();
    next.disabled = true;
    let sent = false;
    if (CBK.formEndpoint) {
      try {
        const res = await fetch(CBK.formEndpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ subject, _replyto: val('email'), email: val('email'), message: lines.join('\n'), ...Object.fromEntries(rows) })
        });
        sent = res.ok;
      } catch (err) { sent = false; }
    }
    if (!sent) {
      window.location.href = `mailto:${CBK.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    }
    $('[data-done-name]', enq).textContent = val('first');
    $('[data-done-mode]', enq).textContent = sent
      ? 'It’s on its way to Katherine.'
      : 'Your email app has opened with everything filled in. Just press send.';
    $('.enq__card', enq).hidden = true;
    $('[data-done]', enq).hidden = false;
    CBK.scrollTo($('[data-done]', enq));
    next.disabled = false;
  }

  showDetails();
  if (form.date.value) dateNote();
  // Jump ahead when arriving with the occasion already chosen
  go(val('occasion') ? 1 : 0, true);
})();
