/* Captured by Katherine — motion layer (GSAP + ScrollTrigger) */
(function () {
  'use strict';
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = document.documentElement.classList.contains('reduced');

  // Wrap every word of an element in spans, keeping inline elements (em, br, chips) intact.
  function splitWords(el, outerClass, innerClass) {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const o = document.createElement('span');
            o.className = outerClass;
            if (innerClass) {
              const i = document.createElement('span');
              i.className = innerClass;
              i.textContent = p;
              o.appendChild(i);
            } else o.textContent = p;
            frag.appendChild(o);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && !child.matches('br, .chip-img, img, svg')) {
          walk(child);
        }
      });
    };
    walk(el);
  }

  // Prepare split headings even without GSAP so the CSS fallback can show them.
  $$('[data-split]').forEach((el) => splitWords(el, 'w', 'wi'));
  $$('[data-lit]').forEach((el) => splitWords(el, 'lw'));

  const gsap = window.gsap, ST = window.ScrollTrigger;
  if (!gsap || !ST || reduced) {
    $$('[data-split]').forEach((el) => el.classList.add('is-in'));
    $$('[data-reveal]').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
    $$('[data-clip]').forEach((el) => { el.style.clipPath = 'none'; });
    $$('.lw').forEach((el) => { el.style.opacity = 1; });
    return;
  }
  gsap.registerPlugin(ST);
  // Animations for content already on screen wait for the loader to reveal the page.
  const ready = (window.CBK && window.CBK.revealed) || Promise.resolve();
  let isRevealed = false;
  ready.then(() => { isRevealed = true; });
  const onReady = (fn) => (isRevealed ? fn() : ready.then(fn));

  /* Headings: words rise into place */
  $$('[data-split]').forEach((el) => {
    const words = $$('.wi', el);
    const inView = el.getBoundingClientRect().top < window.innerHeight;
    const vars = { y: 0, yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: { amount: Math.min(0.7, words.length * 0.055) }, onComplete: () => el.classList.add('is-in') };
    if (inView) onReady(() => gsap.to(words, { ...vars, delay: 0.05 + (parseFloat(el.dataset.delay) || 0) }));
    else gsap.to(words, { ...vars, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  /* Fade-up reveals, batched for a natural stagger */
  ST.batch('[data-reveal]', {
    start: 'top 90%', once: true,
    onEnter: (els) => onReady(() => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, delay: 0.15 }))
  });

  /* Scroll-lit paragraphs */
  $$('[data-lit]').forEach((el) => {
    gsap.to($$('.lw', el), {
      opacity: 1, ease: 'none', stagger: 0.1,
      scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 52%', scrub: 0.6 }
    });
  });

  /* Parallax images */
  $$('[data-parallax]').forEach((img) => {
    const amt = parseFloat(img.dataset.parallax) || -12;
    gsap.fromTo(img, { yPercent: 0 }, {
      yPercent: amt, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  /* Clip-path media reveals */
  $$('[data-clip]').forEach((el) => {
    gsap.to(el, {
      clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 35%', scrub: 0.6 }
    });
  });

  /* Hero: subtle zoom-out of the card as you leave it */
  $$('.hero__card, .phero__card').forEach((card) => {
    gsap.to(card, {
      scale: 0.96, borderRadius: 40, ease: 'none',
      scrollTrigger: { trigger: card, start: 'top top', end: 'bottom top', scrub: true }
    });
  });
  $$('.hero__float').forEach((f) => { const t = gsap.from(f, { x: 40, opacity: 0, duration: 1.2, ease: 'expo.out', delay: 0.7, paused: true }); onReady(() => t.play()); });
  $$('.hero__foot, .phero__foot').forEach((f) => { const t = gsap.from(f, { opacity: 0, y: 24, duration: 1.2, ease: 'expo.out', delay: 0.4, paused: true }); onReady(() => t.play()); });
  $$('.hero__slide:first-child img').forEach((img) => { const t = gsap.from(img, { scale: 1.3, duration: 2.6, ease: 'expo.out', paused: true, clearProps: 'transform' }); onReady(() => t.play()); });
  $$('.phero__media img').forEach((img) => { const t = gsap.from(img, { scale: 1.2, duration: 2.4, ease: 'expo.out', paused: true }); onReady(() => t.play()); });

  /* Counters */
  $$('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count);
    const obj = { v: 0 };
    gsap.to(obj, {
      v: end, duration: 2, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString('en-AU'); }
    });
  });

  /* Vertical timeline progress */
  $$('.vtl').forEach((v) => {
    const line = v.querySelector('.vtl__line');
    if (line) gsap.to(line, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: v, start: 'top 70%', end: 'bottom 60%', scrub: 0.5 } });
  });

  /* Stacking steps: earlier cards recede as the next arrives */
  const steps = $$('.step');
  steps.forEach((step, i) => {
    const next = steps[i + 1];
    if (!next) return;
    gsap.to(step, {
      scale: 0.94, filter: 'brightness(.94)', ease: 'none',
      scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 25%', scrub: true }
    });
  });

  /* Footer wordmark rises */
  $$('.footer__word').forEach((w) => gsap.from(w, { yPercent: 40, opacity: 0, ease: 'expo.out', duration: 1.6, scrollTrigger: { trigger: w, start: 'top 98%', once: true } }));

  /* Horizontal reel (desktop): pin and scroll sideways */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1025px)', () => {
    $$('[data-reel]').forEach((reel) => {
      const pin = reel.querySelector('.reel__pin');
      const track = reel.querySelector('.reel__track');
      const vp = reel.querySelector('.reel__viewport');
      const bar = reel.querySelector('.reel__progress i');
      const dist = () => Math.max(0, track.scrollWidth - vp.clientWidth);
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: pin, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (self) => { if (bar) bar.style.transform = `scaleX(${self.progress})`; }
        }
      });
      return () => tween.kill();
    });
  });

  /* Mosaic & cards: gentle stagger in */
  ST.batch('.mosaic__item, .rv, .pkg, .fact, .card, .tile, .qcard, .reel__card', {
    start: 'top 92%', once: true,
    onEnter: (els) => { const t = gsap.from(els, { y: 50, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07, clearProps: 'transform,opacity', paused: true }); onReady(() => t.play()); }
  });

  window.addEventListener('load', () => ST.refresh());
  document.fonts && document.fonts.ready.then(() => ST.refresh());
})();
