// The Third Place: motion layer.
// Intro, word reveals, custom cursor, magnetic buttons, hero parallax,
// rotating badge and the scroll-driven manifesto panel.
// Nothing here runs when the visitor has asked for reduced motion.
(() => {
  const html = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  // ---------- Intro (every page load; click or Esc skips) ----------
  const loader = $('#loader');
  if (html.classList.contains('intro') && loader) {
    const dots = $$('.loader-dots i', loader);
    const words = $$('.loader-words span', loader);
    const count = $('#loaderCount');
    let done = false;

    const step = i => {
      dots[i].classList.add('on');
      words.forEach((w, j) => {
        w.classList.toggle('on', j === i);
        w.classList.toggle('gone', j < i);
      });
    };
    [0, 1, 2].forEach(i => setTimeout(() => !done && step(i), 250 + i * 750));

    const t0 = performance.now();
    const tick = now => {
      const p = clamp((now - t0) / 2500);
      count.textContent = String(Math.round(easeOut(p) * 100)).padStart(3, '0');
      if (p < 1 && !done) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    const finish = () => {
      if (done) return;
      done = true;
      loader.classList.add('out');
      setTimeout(() => dispatchEvent(new Event('ttp:intro-done')), 600);
      setTimeout(() => { html.classList.remove('intro'); loader.remove(); }, 1400);
    };
    setTimeout(finish, 2900);
    loader.addEventListener('click', finish);
    addEventListener('keydown', e => { if (e.key === 'Escape') finish(); });
  }

  // Events deck: stacking offset + slight tilt per card (used by the desktop CSS)
  const tilts = [-2, 1.5, -1, 2, -1.5, 1];
  $$('#events .event').forEach((ev, i) => {
    ev.style.setProperty('--i', i);
    ev.style.setProperty('--rot', tilts[i % tilts.length] + 'deg');
  });

  // ---------- Finale: Visit pins (its bottom at the screen bottom) while the footer slides over ----------
  const visitSec = $('#visit'), foot = $('.foot');
  const visitInner = visitSec && $(':scope > .wrap', visitSec);
  const setStick = () => {
    if (visitSec) visitSec.style.setProperty('--stick', Math.min(0, innerHeight - visitSec.offsetHeight) + 'px');
  };
  setStick();
  addEventListener('resize', setStick);
  if (visitSec && 'ResizeObserver' in window) new ResizeObserver(setStick).observe(visitSec);

  if (reduced) return;

  // ---------- Word-by-word headline reveal ----------
  const splitWords = el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement('span');
            const wi = document.createElement('span');
            w.className = 'w';
            wi.className = 'wi';
            wi.style.setProperty('--i', i++);
            wi.textContent = part;
            w.appendChild(wi);
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          walk(n);
        }
      });
    };
    walk(el);
    el.classList.add('split');
  };
  const splitTargets = $$('main h2:not(.mf-words), .foot-big');
  splitTargets.forEach(splitWords);
  const splitIO = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); splitIO.unobserve(e.target); } });
  }, {threshold: .25});
  splitTargets.forEach(el => splitIO.observe(el));

  // ---------- Custom cursor + magnetic buttons (mouse / trackpad only) ----------
  if (finePointer) {
    const cur = $('#cursor'), dot = $('.cursor-dot', cur), ring = $('.cursor-ring', cur), label = $('.cursor-label', cur);
    html.classList.add('has-cursor');
    cur.classList.add('hidden');
    let mx = -100, my = -100, rx = -100, ry = -100, lastTarget = null;

    // Which brand surface is under the pointer: ink, clay or paper
    const surfaceOf = el => {
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
        const bg = getComputedStyle(n).backgroundColor;
        const m = bg.match(/\d+(\.\d+)?/g);
        if (!m || (m.length === 4 && +m[3] < .5)) continue;
        const [r, g, b] = m.map(Number);
        if (r === 164 && g === 85 && b === 47) return 'clay';
        return (r + g + b) / 3 < 100 ? 'dark' : 'light';
      }
      return 'light';
    };
    const labelFor = el => {
      if (el.dataset.cursor) return el.dataset.cursor;
      return '';
    };

    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      if (rx < 0) { rx = mx; ry = my; }
      dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
      const t = e.target;
      if (t === lastTarget) return;
      lastTarget = t;
      const inField = !!t.closest('input, textarea');
      const special = t.closest('[data-cursor]');
      const interactive = t.closest('a, button, summary, .fz, [role="button"]');
      const surface = surfaceOf(t);
      cur.classList.toggle('hidden', inField);
      cur.classList.toggle('label', !!special);
      cur.classList.toggle('hover', !special && !!interactive);
      cur.classList.toggle('dark', surface === 'dark');
      cur.classList.toggle('clay', surface === 'clay');
      label.textContent = special ? labelFor(special) : '';
    }, {passive: true});
    document.addEventListener('mouseleave', () => cur.classList.add('hidden'));
    document.addEventListener('mouseenter', () => cur.classList.remove('hidden'));
    addEventListener('pointerdown', () => cur.classList.add('down'));
    addEventListener('pointerup', () => cur.classList.remove('down'));
    addEventListener('scroll', () => { lastTarget = null; }, {passive: true});

    const follow = () => {
      rx += (mx - rx) * .35;
      ry += (my - ry) * .35;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      requestAnimationFrame(follow);
    };
    follow();

    $$('.btn, .socials a, .float-wa, .badge').forEach(el => {
      el.classList.add('magnetic');
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * .3;
        const y = (e.clientY - r.top - r.height / 2) * .4;
        el.style.transform = `translate(${x}px,${y}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  // ---------- Scroll-driven: hero parallax, badge, manifesto ----------
  const heroLines = $$('.h-lines li');
  const badgeSvg = $('#badge svg');
  const mf = $('#manifesto');
  const panel = mf && $('.mf-panel', mf);
  const mfWords = mf ? $$('.mf-words > span', mf) : [];
  const cards = mf ? $$('.mf-card', mf) : [];
  const counters = mf ? $$('.mf-stats b[data-count]', mf) : [];
  let counted = false;

  const countUp = () => {
    counters.forEach(b => {
      const target = +b.dataset.count, suffix = b.dataset.suffix || '';
      const t0 = performance.now();
      const run = now => {
        const p = clamp((now - t0) / 1200);
        b.textContent = Math.round(easeOut(p) * target) + suffix;
        if (p < 1) requestAnimationFrame(run);
      };
      requestAnimationFrame(run);
    });
  };

  const update = () => {
    const y = scrollY, vh = innerHeight, vw = innerWidth;

    if (y < vh * 1.3) {
      const k = y / vh;
      if (heroLines[0]) heroLines[0].style.transform = `translateX(${-k * 14}vw)`;
      if (heroLines[1]) heroLines[1].style.transform = `translateX(${k * 9}vw)`;
      if (heroLines[2]) heroLines[2].style.transform = `translateX(${-k * 4}vw) scale(${1 + k * .18})`;
    }
    if (badgeSvg) badgeSvg.style.transform = `rotate(${y * .15}deg)`;

    // Visit recedes as the footer covers it
    if (foot && visitInner) {
      const q = clamp(1 - foot.getBoundingClientRect().top / vh);
      visitInner.style.transform = q ? `translateY(${q * 6}vh) scale(${1 - q * .08})` : '';
      visitInner.style.opacity = 1 - q * .65;
    }

    if (!mf) return;
    const r = mf.getBoundingClientRect();
    if (r.top > vh || r.bottom < 0) return;
    const p = clamp(-r.top / (r.height - vh));

    // 1) panel grows from a card to full screen
    const open = easeOut(clamp(p / .28));
    panel.style.setProperty('--ciy', `${(1 - open) * 22}%`);
    panel.style.setProperty('--cix', `${(1 - open) * 24}%`);
    panel.style.setProperty('--cr', `${(1 - open) * 24}px`);
    panel.style.setProperty('--ko', open);

    // 2) cards fly out slowly from the centre, then drift a little,
    //    always kept fully on screen (below the header, inside the edges)
    const fly = easeOut(clamp((p - .08) / .62));
    const drift = clamp((p - .7) / .3);
    const narrow = vw < 700;
    const headerH = 72, edge = 16;
    cards.forEach(c => {
      const hw = c.offsetWidth / 2 + edge, hh = c.offsetHeight / 2 + edge;
      const tx = +c.dataset.x * vw * (narrow ? .9 : 1);
      const ty = +c.dataset.y * vh * (narrow ? .95 : 1);
      const k = fly + drift * .06;
      const maxX = vw / 2 - hw, minY = -(vh / 2 - hh - headerH), maxY = vh / 2 - hh;
      const dx = clamp(tx * k, -maxX, maxX), dy = clamp(ty * k, minY, maxY);
      c.style.transform = `translate(-50%,-50%) translate(${dx}px,${dy}px) rotate(${+c.dataset.r * fly}deg) scale(${.4 + .6 * fly})`;
      c.style.opacity = fly;
    });

    // 3) the big word changes: Work. → Meet. → Record. → Belong.
    const idx = p < .1 ? -1 : Math.min(3, Math.floor((p - .1) / .18));
    mfWords.forEach((w, j) => {
      w.classList.toggle('on', j === idx);
      w.classList.toggle('past', j < idx);
    });

    // 4) facts fade in and count up
    const show = easeOut(clamp((p - .72) / .14));
    panel.style.setProperty('--so', show);
    if (show > .3 && !counted) { counted = true; countUp(); }
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  };
  addEventListener('scroll', onScroll, {passive: true});
  addEventListener('resize', onScroll);
  update();
})();
