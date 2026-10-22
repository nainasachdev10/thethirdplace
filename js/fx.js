// The Third Place: optional effects (fx).
// Each effect is independent. To turn one off, set its switch to false: the site then
// behaves exactly as it did without it (its styles in css/fx.css stop applying too).
// To remove all of them, delete the fx.css / lenis / fx.js lines from index.html.
(() => {
  const FX = {
    dealCards:    true,  // Memberships: cards fan in from a stack and land in place
    shuffle:      false, // Memberships: picking an "I'm…" option shuffles the deck, match lands on top
    readAlong:    true,  // The idea: text turns from faint Stone to Ink as you scroll
    tourDot:      true,  // The floor: a clay dot walks between zones
    colourFlow:   false, // Soft colour transitions between Paper, tint and Ink sections
    smoothScroll: true,  // Momentum scrolling, laptops/desktops only (Lenis)
  };

  const html = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const EASE = 'cubic-bezier(.2,.7,.2,1)';
  const scrollJobs = [];   // per-frame work, all driven by one scroll listener
  const measureJobs = [];  // re-measure on resize / content changes (never on every frame)

  // ---------- Colour flow ----------
  // Gradients between differently coloured sections, inside their empty padding (pure CSS at runtime).
  if (FX.colourFlow) {
    const PAPER = [245, 241, 233], PANEL = [235, 231, 223], INK = [46, 38, 32];
    const colourOf = s => s.classList.contains('on-ink') ? INK : s.classList.contains('tint') ? PANEL : PAPER;
    const mid = (a, b) => a.map((v, k) => Math.round((v + b[k]) / 2));
    const css = c => `rgb(${c})`;
    const sections = $$('main > section, .finale > section');
    const cols = sections.map(colourOf);
    sections.forEach((s, i) => {
      // the hero and the pinned manifesto keep their own look
      if (s.id === 'home' || s.id === 'manifesto') return;
      const prev = i > 0 ? mid(cols[i - 1], cols[i]) : cols[i];
      const next = i < sections.length - 1 && s.id !== 'visit' ? mid(cols[i], cols[i + 1]) : cols[i];
      s.classList.add('flow');
      s.style.setProperty('--flow-prev', css(prev));
      s.style.setProperty('--flow-self', css(cols[i]));
      s.style.setProperty('--flow-next', css(next));
      // the gradient length follows the section padding token (--section), so it stays in the empty space at every screen size
    });
    html.classList.add('fx-flow');
  }

  if (!reduced) {
    // ---------- Read-along ----------
    if (FX.readAlong) {
      const paras = $$('.idea-grid p:not(.kicker)');
      if (paras.length) {
        html.classList.add('fx-read');
        const words = [];
        const wrap = node => {
          [...node.childNodes].forEach(n => {
            if (n.nodeType === 3) {
              const frag = document.createDocumentFragment();
              n.textContent.split(/(\s+)/).forEach(part => {
                if (!part) return;
                if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
                const w = document.createElement('span');
                w.className = 'rw';
                w.textContent = part;
                words.push(w);
                frag.appendChild(w);
              });
              n.replaceWith(frag);
            } else if (n.nodeType === 1) wrap(n);
          });
        };
        paras.forEach(wrap);
        let box = {top: 0, bottom: 0}, lit = 0;
        measureJobs.push(() => {
          box = {top: paras[0].getBoundingClientRect().top + scrollY,
                 bottom: paras[paras.length - 1].getBoundingClientRect().bottom + scrollY};
        });
        scrollJobs.push((y, vh) => {
          const start = box.top - vh * .8, end = box.bottom - vh * .45;
          const n = Math.round(clamp((y - start) / Math.max(1, end - start)) * words.length);
          if (n === lit) return;
          const [from, to, on] = n > lit ? [lit, n, true] : [n, lit, false];
          for (let i = from; i < to; i++) words[i].classList.toggle('lit', on);
          lit = n;
        });
      }
    }

    // ---------- Dealt cards + shuffle (Memberships) ----------
    const grid = $('#mgrid');
    const cards = grid ? $$('.m-card', grid) : [];
    const oneColumn = () => getComputedStyle(grid).gridTemplateColumns.split(' ').length === 1;

    if (FX.dealCards && cards.length) {
      html.classList.add('fx-deal');
      const dealGrid = () => {
        const g = grid.getBoundingClientRect();
        const n = cards.length;
        const froms = cards.map((c, i) => {
          const r = c.getBoundingClientRect();
          const dx = g.left + g.width / 2 - (r.left + r.width / 2);
          const dy = g.top + g.height / 2 - (r.top + r.height / 2);
          return `translate(${dx}px,${dy}px) rotate(${(i % 2 ? 1 : -1) * (3 + i * 2)}deg) scale(.94)`;
        });
        grid.classList.add('dealt');
        cards.forEach((c, i) => {
          // the pile appears, then the top card is dealt first
          c.animate([{opacity: 0}, {opacity: 1}], {duration: 350, easing: EASE});
          c.animate([{transform: froms[i]}, {transform: 'none'}],
                    {duration: 950, delay: 350 + (n - 1 - i) * 120, easing: EASE, fill: 'backwards'});
        });
      };
      const dealEach = () => {
        grid.classList.add('dealt');
        const io = new IntersectionObserver(entries => entries.forEach(e => {
          if (!e.isIntersecting) return;
          const c = e.target, i = cards.indexOf(c);
          c.style.opacity = '';
          c.animate([{opacity: 0, transform: `translateY(56px) rotate(${i % 2 ? 4 : -4}deg) scale(.96)`},
                     {opacity: 1, transform: 'none'}], {duration: 800, easing: EASE});
          io.unobserve(c);
        }), {threshold: .15});
        cards.forEach(c => { c.style.opacity = '0'; io.observe(c); });
      };
      const io = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        oneColumn() ? dealEach() : dealGrid();
      }, {threshold: .2});
      io.observe(grid);
    }

    if (FX.shuffle && cards.length) {
      html.classList.add('fx-shuffle');
      const running = new Map();
      $$('#finder .chip').forEach(chip => chip.addEventListener('click', () => {
        // main.js has already marked the matching card (its listener runs first)
        const match = grid.classList.contains('filtering') ? $('.m-card.match', grid) : null;
        const g = grid.getBoundingClientRect();
        const single = oneColumn();
        cards.forEach((c, i) => {
          const prev = running.get(c);
          if (prev) prev.cancel();
          const r = c.getBoundingClientRect();
          const dx = g.left + g.width / 2 - (r.left + r.width / 2);
          const dy = g.top + g.height / 2 - (r.top + r.height / 2);
          const mid = single
            ? `translateX(${i % 2 ? 22 : -22}px) rotate(${i % 2 ? 3 : -3}deg)`
            : `translate(${dx * .8}px,${dy * .8}px) rotate(${(i % 2 ? 1 : -1) * (4 + i * 1.5)}deg) scale(.94)`;
          const end = c === match ? 'translateY(-4px)' : 'none';   // matches the CSS resting state
          c.classList.toggle('shuffling', c === match);
          const anim = c.animate([{transform: 'none'}, {transform: mid, offset: .45}, {transform: end}],
                                 {duration: 900, delay: c === match ? 220 : i * 40, easing: EASE});
          running.set(c, anim);
        });
      }));
    }

    // ---------- Tour dot (The floor) ----------
    if (FX.tourDot) {
      const plan = $('#plan');
      const zones = plan ? $$('.fz', plan) : [];
      if (zones.length) {
        html.classList.add('fx-tour');
        const NS = 'http://www.w3.org/2000/svg';
        const dot = document.createElementNS(NS, 'g');
        dot.setAttribute('class', 'tour-dot');
        dot.setAttribute('aria-hidden', 'true');
        dot.innerHTML = '<circle class="ring" r="7"/><circle class="core" r="6"/>';
        plan.appendChild(dot);
        // stand in the middle of each room, but keep clear of the room's number badge
        const centers = zones.map(z => {
          const b = $('.room', z).getBBox();
          const p = {x: b.x + b.width / 2, y: b.y + b.height / 2};
          const badge = $('.badge circle', z);
          if (badge) {
            const bx = +badge.getAttribute('cx'), by = +badge.getAttribute('cy');
            const dx = p.x - bx, dy = p.y - by, d = Math.hypot(dx, dy), min = 34;
            if (d < min) {
              const ux = d ? dx / d : 1, uy = d ? dy / d : 0;
              p.x = bx + ux * min; p.y = by + uy * min;
            }
          }
          return p;
        });
        const entrance = {x: 320, y: 404};
        const moveTo = p => { dot.style.transform = `translate(${p.x}px,${p.y}px)`; };
        const follow = () => {
          const on = zones.findIndex(z => z.classList.contains('on'));
          moveTo(on < 0 ? entrance : centers[on]);
        };
        dot.style.transition = 'none';
        moveTo(entrance);
        requestAnimationFrame(() => { dot.style.transition = ''; follow(); });
        const mo = new MutationObserver(follow);
        zones.forEach(z => mo.observe(z, {attributes: true, attributeFilter: ['class']}));
      }
    }

    // ---------- Smooth scrolling (laptops/desktops with a mouse or trackpad) ----------
    if (FX.smoothScroll && window.Lenis && matchMedia('(pointer: fine) and (min-width: 1024px)').matches) {
      const lenis = new window.Lenis({lerp: .1, smoothWheel: true});
      window.__lenis = lenis;
      const loop = t => { lenis.raf(t); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
      // let these scroll on their own
      $$('textarea, .nav-links').forEach(el => el.setAttribute('data-lenis-prevent', ''));
      // in-page links glide with Lenis (runs before main.js's handler, which then stands aside)
      document.addEventListener('click', e => {
        const a = e.target.closest('a[href^="#"]');
        if (!a || a.hasAttribute('data-interest') || e.metaKey || e.ctrlKey || e.shiftKey) return;
        const id = a.getAttribute('href');
        if (id.length < 2) return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, {offset: -72});
        if (a.classList.contains('sr-only')) {
          target.setAttribute('tabindex', '-1');
          target.focus({preventScroll: true});
        }
      }, true);
    }
  }

  // ---------- One scroll listener for everything above ----------
  const measure = () => measureJobs.forEach(f => f());
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY, vh = innerHeight;
      scrollJobs.forEach(f => f(y, vh));
      ticking = false;
    });
  };
  if (scrollJobs.length) {
    measure();
    addEventListener('scroll', onScroll, {passive: true});
    addEventListener('resize', () => { measure(); onScroll(); });
    addEventListener('load', () => { measure(); onScroll(); });
    if ('ResizeObserver' in window) {
      let t;
      const ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => { measure(); onScroll(); }, 150); });
      $$('main, .finale').forEach(el => ro.observe(el));
    }
    onScroll();
  }
})();
