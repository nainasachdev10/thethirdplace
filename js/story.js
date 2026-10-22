// The Third Place: story layer.
// Big scroll set pieces on the existing sections (dive into the dot, the floor in 3D, ON AIR,
// the city forming from people, the lift, the footer dot), a line-art calendar, plus quieter
// helpers: a section rail in the page margin, a progress line, the logo's dots on section labels.
// Each piece has a switch. Off = that piece is never created, and the page is exactly as before.
// To remove everything, delete the story.css <link> and story.js <script> lines in index.html.
(() => {
  const STORY = {
    dive:        true,  // hero → The idea: zoom into the clay dot beside "Yours." and fall through it
    floor3d:     true,  // The floor: the plan tilts into a 3D model and the camera flies room to room
    onAir:       true,  // The Studio: lights down, ON AIR sign, a waveform that reacts to you, credits roll
    crowd:       true,  // Community: dots (people) swarm into NASHIK, then into the logo
    calendarArt: true,  // Community: a line-art wall calendar beside the event cards, drawn as you scroll
    lift:        true,  // Visit: a lift rides to the 4th floor and its doors open onto the form
    footDot:     true,  // Footer: the clay dot follows you, then clicks into place in the logo
    rail:        true,  // section names in the left margin (wide screens only, never over content)
    progress:    true,  // thin clay line under the header showing how far down the page you are
    labelDots:   true,  // the logo's three dots pop in beside every section label
    studioRec:   false, // The Studio: small "REC" waveform under the heading (replaced by onAir)
    askUs:       true,  // "Ask us?" beside the floating WhatsApp button (laptops)
  };

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);
  const scrollJobs = [], measureJobs = [];
  const pageTop = el => el.getBoundingClientRect().top + scrollY;
  const token = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const headerH = () => parseFloat(token('--header-h')) || 72;
  // run a frame loop only while an element is on screen
  const whileVisible = (el, tick) => {
    let raf = 0, on = false;
    const loop = t => { tick(t); raf = requestAnimationFrame(loop); };
    new IntersectionObserver(es => {
      on = es[0].isIntersecting;
      cancelAnimationFrame(raf);
      if (on) raf = requestAnimationFrame(loop);
    }).observe(el);
  };

  // ---------- 1. Dive: hero → The idea, through the clay dot ----------
  if (STORY.dive && !reduced) {
    const hero = $('#home'), idea = $('main > section.idea');
    const dot = hero && $('.h-lines li:nth-child(3) .dot', hero);
    if (idea && dot) {
      const dive = document.createElement('div');
      dive.className = 'st-dive';
      const pin = document.createElement('div');
      pin.className = 'st-dive-pin';
      hero.before(dive);
      dive.appendChild(pin);
      pin.appendChild(hero);
      const disc = document.createElement('div');
      disc.className = 'st-disc';
      disc.setAttribute('aria-hidden', 'true');
      disc.innerHTML = '<p class="st-disc-t">Step <em>inside.</em></p><span class="label">The Third Place · Nashik</span>';
      pin.appendChild(disc);
      idea.classList.add('st-over');
      const txt = $('.st-disc-t', disc), lab = $('.label', disc);
      const fade = $$('.hero-top, .h-lines li:nth-child(1), .h-lines li:nth-child(2), .h-lines li:nth-child(3) .txt, .hero-sub, .hero-cta, .badge', hero);

      let start = 0, len = 1, diving = false;
      measureJobs.push(() => {
        start = pageTop(dive) - headerH();
        len = Math.max(1, dive.offsetHeight - pin.offsetHeight);
      });
      scrollJobs.push(y => {
        const p = clamp((y - start) / len);
        if (p < .002) {
          if (diving) {
            diving = false;
            disc.style.visibility = dot.style.visibility = '';
            fade.forEach(el => el.style.opacity = '');
          }
          return;
        }
        if (p >= 1 && !diving) return;
        diving = true;
        // the disc starts exactly on the dot, then grows (slowly, then faster: falling in) to cover the screen
        const d = dot.getBoundingClientRect(), b = pin.getBoundingClientRect();
        const cx = d.left + d.width / 2 - b.left, cy = d.top + d.height / 2 - b.top;
        const cover = Math.hypot(Math.max(cx, b.width - cx), Math.max(cy, b.height - cy)) + 2;
        const g = Math.pow(clamp(p / .45), 2.2);
        disc.style.clipPath = `circle(${(lerp(d.width / 2, cover, g)).toFixed(1)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px)`;
        disc.style.visibility = 'visible';
        dot.style.visibility = 'hidden';
        fade.forEach(el => el.style.opacity = (1 - clamp(p / .22)).toFixed(3));
        const a = smooth(clamp((p - .3) / .16)), a2 = smooth(clamp((p - .38) / .14));
        txt.style.opacity = a;
        txt.style.transform = `translateY(${((1 - a) * 40).toFixed(1)}px) scale(${(.92 + a * .08).toFixed(3)})`;
        lab.style.opacity = a2;
      });
    }
  }

  // ---------- 2. The floor in 3D: tilt, rise, fly room to room ----------
  if (STORY.floor3d && !reduced) {
    const spaces = $('#spaces'), floor = spaces && $('.floor', spaces), plan = $('#plan');
    const items = $$('#zoneList li');
    if (floor && plan && items.length) {
      const RISE = [46, 30, 64, 40, 14, 54, 8];   // wall heights per zone, in plan units
      const rooms = $$('.fz', plan).map((g, i) => {
        const r = $('.room', g), n = k => +r.getAttribute(k);
        const details = $$('.detail', g).filter(d => !/url\(#/.test(d.outerHTML)).map(d => d.outerHTML).join('');
        return {x: n('x'), y: n('y'), w: n('width'), h: n('height'), d: RISE[i] || 30, details};
      });
      const zones = items.map(li => {
        const p = $('.zone-body p', li), f = p && $('.for', p);
        return {n: $('.zn', li).textContent, name: $('.zt', li).textContent,
                for: f ? f.textContent : '', text: p ? p.textContent.replace(f ? f.textContent : '', '').trim() : ''};
      });
      // the section's own heading becomes the first frame of the tour (no separate heading above it)
      const head = $('.section-head', spaces), h2 = head && $('h2', head), em = h2 && $('em', h2);
      const kick = head && $('.kicker', head) ? $('.kicker', head).textContent.trim() : 'The floor';
      const title = h2 ? (em ? `${h2.textContent.replace(em.textContent, '').trim()} <em>${em.textContent.trim()}</em>` : h2.textContent.trim()) : 'One floor.';
      const intro = head && $('.lede', head) ? $('.lede', head).textContent.replace('Tap a zone to walk the floor.', 'Scroll to walk through it, room by room.') : '';
      const hatch = '<defs><pattern id="st-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="9" class="hl"/></pattern></defs>';
      const fly = document.createElement('div');
      fly.className = 'st-fly';
      fly.innerHTML = `
        <div class="st-fly-stage">
          <div class="st-fly-scene" aria-hidden="true"><div class="st-cam"><div class="st-model">
            <div class="st-slab"></div>
            ${rooms.map((r, i) => `<div class="st-rm" style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px;--d:${r.d}">
              <i class="w n"></i><i class="w s"></i><i class="w wl"></i><i class="w e"></i>
              <div class="st-top"><svg viewBox="${r.x} ${r.y} ${r.w} ${r.h}" preserveAspectRatio="none">${i === 6 ? hatch + `<rect x="${r.x + 10}" y="${r.y + 10}" width="${r.w - 20}" height="${r.h - 20}" fill="url(#st-hatch)"/>` : r.details}</svg><b>${zones[i] ? zones[i].n : ''}</b></div>
            </div>`).join('')}
          </div></div></div>
          <div class="st-fly-copy">
            <div class="st-fz st-fz-intro"><p class="kicker">${kick}</p><h2 class="st-fz-t">${title}</h2><p>${intro}</p></div>
            ${zones.map(z => `<div class="st-fz"><span class="label">${z.n} / ${String(zones.length).padStart(2, '0')} · ${z.for}</span><h3 class="st-fz-t">${z.name}</h3><p>${z.text}</p></div>`).join('')}
            <div class="st-fz"><span class="label">That’s the floor</span><h3 class="st-fz-t">Come walk it <em>for real.</em></h3><a href="#visit" class="btn btn-clay" data-interest="Just visiting">Book a tour <span class="arrow">↗</span></a></div>
          </div>
        </div>`;
      floor.before(fly);
      spaces.classList.add('st-flying');

      const stage = $('.st-fly-stage', fly), scene = $('.st-fly-scene', fly), cam = $('.st-cam', fly), model = $('.st-model', fly);
      const rms = $$('.st-rm', fly), copy = $$('.st-fz', fly);
      // camera keyframes: tilt + rise, then stop over each zone, then pull back
      const mid = {x: 320, y: 210};
      const KF = [{p: 0, A: 0, B: 0, z: .92, ...mid, k: 0}, {p: .09, A: 54, B: -28, z: 1, ...mid, k: 1}];
      rooms.forEach((r, i) => {
        const c = {x: r.x + r.w / 2, y: r.y + r.h / 2, z: clamp(Math.sqrt(150 * 130 / (r.w * r.h)) * 1.55, 1.35, 2.25)};
        const k = {A: 48, B: -28 + (i - 3) * 3, z: c.z, x: c.x, y: c.y, k: 1};
        KF.push({p: .15 + .1 * i, ...k}, {p: .2 + .1 * i, ...k});
      });
      KF.push({p: .92, A: 54, B: -28, z: 1, ...mid, k: 1}, {p: 1, A: 54, B: -28, z: 1, ...mid, k: 1});
      const camAt = p => {
        let j = 0;
        while (j < KF.length - 2 && p > KF[j + 1].p) j++;
        const a = KF[j], b = KF[j + 1], t = smooth(clamp((p - a.p) / Math.max(1e-4, b.p - a.p)));
        const o = {};
        ['A', 'B', 'z', 'x', 'y', 'k'].forEach(key => { o[key] = lerp(a[key], b[key], t); });
        return o;
      };
      let top = 0, len = 1, fit = 1, shown = -1;
      measureJobs.push(() => {
        // the stage runs edge to edge (so the model is never cut by the column); copy lines up with the page grid
        const wrap = fly.parentElement, wr = wrap.getBoundingClientRect();
        const g = wr.left + parseFloat(getComputedStyle(wrap).paddingLeft);
        fly.style.marginLeft = -g + 'px';
        fly.style.width = document.documentElement.clientWidth + 'px';
        fly.style.setProperty('--g', g + 'px');
        top = pageTop(fly) - headerH();
        len = Math.max(1, fly.offsetHeight - stage.offsetHeight);
        const r = scene.getBoundingClientRect();
        fit = Math.min(r.width / 660, r.height / 450);
      });
      scrollJobs.push((y, vh) => {
        if (y < top - vh || y > top + len + vh) return;
        const p = clamp((y - top) / len);
        const c = camAt(p);
        cam.style.transform = `scale(${(fit * c.z).toFixed(4)}) rotateX(${c.A.toFixed(2)}deg) rotateZ(${c.B.toFixed(2)}deg) translate(${(-c.x).toFixed(1)}px,${(-c.y).toFixed(1)}px)`;
        model.style.setProperty('--k', c.k.toFixed(3));
        const idx = p < .12 ? 0 : p >= .88 ? copy.length - 1 : 1 + clamp(Math.floor((p - .12) / .1), 0, rooms.length - 1);
        if (idx !== shown) {
          copy.forEach((el, i) => { el.classList.toggle('on', i === idx); if (i) el.setAttribute('aria-hidden', i !== idx); });
          rms.forEach((el, i) => el.classList.toggle('on', i === idx - 1));
          shown = idx;
        }
      });
    }
  }

  // ---------- 3. The Studio: ON AIR card ----------
  // The section keeps the site's usual layout, a little shorter: the "setup" column becomes an
  // ON AIR card (a waveform that reacts to you), and the Creator Zone + rates fold into the closing line.
  if (STORY.onAir && !reduced) {
    const studio = $('#studio'), wrap = studio && $(':scope > .wrap', studio);
    const cols = wrap && $('.studio-cols', wrap), setup = cols && cols.children[1];
    const lede = wrap && $('.section-head .lede', wrap), creator = wrap && $('.creator', wrap), ctaP = wrap && $('.cta-row p', wrap);
    if (setup) {
      if (lede) lede.textContent = 'Acoustically treated, camera-ready, and open to members and the public. Where Nashik’s founders, brands and creators record the work that gets them heard.';
      const card = document.createElement('div');
      card.className = 'st-air-card';
      card.innerHTML = `
        <div class="st-air-top"><span class="label">The Studio · centre of the floor</span><span class="st-air-pill"><i></i>On air</span></div>
        <canvas class="st-wave" aria-hidden="true"></canvas>
        <ul class="st-air-facts">
          <li><b>No windows</b><span>Clean, controlled sound</span></li>
          <li><b>Pro kit</b><span>Mics, cameras &amp; lighting</span></li>
          <li><b>Solo to panel</b><span>Any recording setup</span></li>
        </ul>`;
      setup.replaceChildren(card);
      if (creator) creator.remove();
      if (ctaP) ctaP.innerHTML = 'Members get preferred rates and priority slots; everyone else books by the hour or half-day. Next door, the <b>Creator Zone</b> lets you edit and publish without leaving the building. Ask us for the kit list and current rates.';

      const cv = $('.st-wave', card), ctx = cv.getContext('2d');
      let W = 0, H = 0, dpr = 1, amps = [], energy = 0, mx = .5, lastY = scrollY, lit = false;
      const clayInk = token('--clay-on-ink') || '#B8653C', stoneInk = token('--stone-on-ink') || '#B8A898';
      measureJobs.push(() => {
        dpr = Math.min(2, devicePixelRatio || 1);
        W = cv.clientWidth; H = cv.clientHeight;
        cv.width = W * dpr; cv.height = H * dpr;
        amps = new Array(Math.max(8, Math.floor(W / 7))).fill(0);
      });
      // the sign comes on once the card is properly in view
      new IntersectionObserver(es => {
        lit = es[0].isIntersecting;
        card.classList.toggle('lit', lit);
      }, {threshold: .6}).observe(card);
      scrollJobs.push(y => {
        if (!fine) energy = Math.min(1.2, energy + Math.abs(y - lastY) / 420);
        lastY = y;
      });
      card.addEventListener('pointermove', e => {
        const r = cv.getBoundingClientRect();
        mx = (e.clientX - r.left) / r.width;
        energy = Math.min(1.2, energy + Math.hypot(e.movementX || 0, e.movementY || 0) / 240);
      });
      whileVisible(card, t => {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        const n = amps.length, gap = W / n;
        if (!fine) mx = .5 + .28 * Math.sin(t * .0009);
        ctx.lineCap = 'round';
        ctx.lineWidth = Math.max(2, gap * .45);
        ctx.strokeStyle = lit ? clayInk : stoneInk;
        ctx.globalAlpha = lit ? 1 : .3;
        ctx.beginPath();
        for (let j = 0; j < n; j++) {
          const x = (j + .5) * gap, u = x / W;
          const idle = lit ? .1 + .07 * Math.sin(t * .002 + j * .35) * Math.sin(t * .0007 + j * .11) : .04;
          const focus = .3 + .7 * Math.exp(-(((u - mx) / .16) ** 2));
          const target = idle + (lit ? energy : energy * .25) * focus * (.55 + .45 * Math.sin(j * 1.7 + t * .012));
          amps[j] += (target - amps[j]) * .25;
          const h = Math.max(2, Math.min(1, amps[j]) * H * .92);
          ctx.moveTo(x, (H - h) / 2);
          ctx.lineTo(x, (H + h) / 2);
        }
        ctx.stroke();
        energy *= .955;
      });
    }
  }

  // ---------- 4. Community: the city forms from people ----------
  if (STORY.crowd && !reduced) {
    const com = $('#community'), head = com && $('.section-head', com);
    if (head) {
      const box = document.createElement('div');
      box.className = 'st-crowd';
      box.innerHTML = `<div class="st-crowd-stage"><div class="st-crowd-head"></div>
        <div class="st-crowd-art" aria-hidden="true"><canvas></canvas></div>
        <p class="st-crowd-cap" aria-hidden="true"><span>Founders. Freelancers. Teams. Creators.</span><span>All from <em>one city.</em></span><span>Under <em>one roof.</em></span></p></div>`;
      // the section heading stays on screen with the dots, one page while you scroll
      head.before(box);
      $('.st-crowd-head', box).append(head);
      com.classList.add('st-crowd-on');
      const cv = $('canvas', box), ctx = cv.getContext('2d'), caps = $$('.st-crowd-cap span', box);
      const COL = {ink: token('--ink') || '#2E2620', stone: token('--stone') || '#877869', clay: token('--clay') || '#A4552F'};
      let W = 0, H = 0, dpr = 1, N = 0, P = null, top = 0, len = 1, p = 0, cap = -1;
      const mouse = {x: -1e4, y: -1e4};

      // sample the filled pixels of a drawing as target points; channel tells which shape a point belongs to
      const sample = draw => {
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const g = c.getContext('2d');
        draw(g);
        const data = g.getImageData(0, 0, W, H).data, pts = [];
        const step = Math.max(3, Math.floor(Math.sqrt(W * H * .1 / N)));
        for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) {
          const k = (y * W + x) * 4;
          if (data[k + 3] > 128) pts.push([x, y, data[k] > data[k + 1] ? 0 : 1]);
        }
        for (let i = pts.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [pts[i], pts[j]] = [pts[j], pts[i]]; }
        return pts.length ? pts : [[W / 2, H / 2, 0]];
      };
      const build = () => {
        dpr = Math.min(2, devicePixelRatio || 1);
        W = cv.clientWidth; H = cv.clientHeight;
        if (!W || !H) return;
        cv.width = W * dpr; cv.height = H * dpr;
        N = W > 900 && fine ? 2200 : W > 600 ? 1400 : 800;
        const cy = H * .5;
        const text = sample(g => {
          g.fillStyle = '#f00';
          g.textAlign = 'center'; g.textBaseline = 'middle';
          g.font = '600 100px "Bricolage Grotesque", sans-serif';
          const fs = Math.min(H * .42, 100 * W * (W < 600 ? .96 : .86) / g.measureText('NASHIK').width);
          g.font = `600 ${fs}px "Bricolage Grotesque", sans-serif`;
          g.fillText('NASHIK', W / 2, cy);
        });
        const logo = sample(g => {
          const s = Math.min(W * (W < 600 ? .9 : .7), H * .62 * 680 / 210) / 680, X = v => W / 2 + (v - 540) * s;
          g.strokeStyle = '#f00'; g.lineWidth = Math.max(5, 13.7 * s * 1.6);
          [280.6, 515.5].forEach(x => { g.beginPath(); g.arc(X(x), cy, 66.6 * s, 0, Math.PI * 2); g.stroke(); });
          g.fillStyle = '#0f0';
          g.beginPath(); g.arc(X(774.9), cy, 97.9 * s, 0, Math.PI * 2); g.fill();
        });
        P = [];
        for (let i = 0; i < N; i++) {
          const a = text[i % text.length], b = logo[i % logo.length];
          const sx = Math.random() * W, sy = Math.random() * H;
          P.push({x: sx, y: sy, sx, sy, tx: a[0] + (i >= text.length ? Math.random() * 2 : 0), ty: a[1],
                  lx: b[0], ly: b[1], disc: b[2] === 1, you: i % 11 === 0, st: Math.random(), ph: Math.random() * 6.28});
        }
      };
      measureJobs.push(() => {
        top = pageTop(box) - headerH();
        len = Math.max(1, box.offsetHeight - $('.st-crowd-stage', box).offsetHeight);
        if (cv.clientWidth !== W || cv.clientHeight !== H || !P) build();
      });
      scrollJobs.push((y, vh) => {
        if (y < top - vh || y > top + len + vh) return;
        p = clamp((y - top) / len);
      });
      box.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
      box.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });
      let heldAt = 0;
      whileVisible(box, t => {
        if (!P) return;
        // NASHIK always holds on screen for a moment before becoming the logo, however fast you scroll
        let pe = p;
        if (p >= .34) { if (!heldAt) heldAt = t; if (t - heldAt < 1100) pe = Math.min(p, .48); }
        else heldAt = 0;
        const c = pe < .26 ? 0 : pe < .54 ? 1 : 2;
        if (c !== cap) { caps.forEach((el, i) => el.classList.toggle('on', i === c)); cap = c; }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        const groups = {ink: [], stone: [], clay: []}, R = 90;
        for (const q of P) {
          const w1 = smooth(clamp((pe - .06 - q.st * .1) / .18));
          const w2 = smooth(clamp((pe - .48 - q.st * .08) / .14));
          const dx0 = Math.sin(t * .0006 + q.ph) * 16, dy0 = Math.cos(t * .0005 + q.ph * 1.3) * 16;
          let tx = lerp(q.sx + dx0, q.tx, w1), ty = lerp(q.sy + dy0, q.ty, w1);
          tx = lerp(tx, q.lx, w2); ty = lerp(ty, q.ly, w2);
          q.x += (tx - q.x) * .09; q.y += (ty - q.y) * .09;
          const dx = q.x - mouse.x, dy = q.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < R * R) { const d = Math.sqrt(d2) || 1, f = (1 - d / R) * 9; q.x += dx / d * f; q.y += dy / d * f; }
          const col = w2 > .5 ? (q.disc ? 'clay' : 'stone') : w1 > .5 ? 'ink' : (q.you ? 'clay' : 'stone');
          groups[col].push(q);
        }
        const r = W > 600 ? 1.6 : 1.3;
        Object.keys(groups).forEach(k => {
          if (!groups[k].length) return;
          ctx.fillStyle = COL[k];
          ctx.globalAlpha = k === 'stone' && pe < .3 ? .6 : 1;
          ctx.beginPath();
          for (const q of groups[k]) { ctx.moveTo(q.x + r, q.y); ctx.arc(q.x, q.y, r, 0, 6.2832); }
          ctx.fill();
        });
        ctx.globalAlpha = 1;
      });
    }
  }

  // ---------- 5. Community: line-art wall calendar beside the event deck ----------
  if (STORY.calendarArt) {
    const aside = $('.calendar-aside'), evs = $$('#events .event');
    if (aside && evs.length) {
      const ICONS = [
        'M-14 -6 H12 V6 Q12 16 -1 16 Q-14 16 -14 6 Z M12 -1 Q20 -1 20 5 Q20 11 12 11 M-20 21 H22 M-6 -12 Q-2 -16 -6 -21 M3 -12 Q7 -16 3 -21',
        'M-22 -20 H22 V8 H-22 Z M-14 0 L-5 -8 L3 -3 L14 -13 M0 8 V16 M-10 22 L0 16 L10 22',
        'M-22 -21 H18 V-13 H-22 Z M-14 -21 V-17 M-6 -21 V-17 M2 -21 V-17 M10 -21 V-17 M-14 18 L12 -8 L18 -2 L-8 24 L-16 26 Z',
        'M-22 -10 H6 V14 H-22 Z M6 -2 L20 -10 V14 L6 6 M-14 2 A5 5 0 1 0 -4 2 A5 5 0 1 0 -14 2',
        'M-9 -20 H9 Q11 0 0 3 Q-11 0 -9 -20 Z M-8 -10 H8 M0 3 V18 M-8 20 H8',
        'M-22 0 H22 Q20 18 0 18 Q-20 18 -22 0 Z M-9 -6 Q-5 -11 -9 -16 M0 -6 Q4 -11 0 -16 M9 -6 Q13 -11 9 -16',
      ];
      const LBL = ['Breakfast', 'Demo night', 'Workshop', 'Creators', 'Wine-down', 'Lunch'];
      // a clean wall calendar: six rounded tiles, one per event; the current one fills with clay
      const cells = evs.slice(0, 6).map((_, i) => {
        const x = 18 + (i % 3) * 112, y = i < 3 ? 76 : 192;
        return `<g class="st-cell">
          <rect class="tile" x="${x}" y="${y}" width="100" height="104" rx="10"/>
          <text class="n" x="${x + 12}" y="${y + 20}">${String(i + 1).padStart(2, '0')}</text>
          <g transform="translate(${x + 50} ${y + 50}) scale(.92)"><path class="ic" pathLength="1" d="${ICONS[i]}"/></g>
          <text class="t" x="${x + 50}" y="${y + 92}">${LBL[i]}</text></g>`;
      }).join('');
      const wrap = document.createElement('div');
      wrap.className = 'st-calwrap';
      wrap.setAttribute('aria-hidden', 'true');
      wrap.innerHTML = `<svg class="st-cal" viewBox="0 0 360 316">
        <path class="frame" pathLength="1" d="M22 26 H338 Q354 26 354 42 V294 Q354 310 338 310 H22 Q6 310 6 294 V42 Q6 26 22 26 Z"/>
        <path class="rings" d="M120 12 V36 M240 12 V36"/>
        <text class="hd" x="22" y="56">This month</text>
        <text class="hd2" x="338" y="56">On the floor</text>
        ${cells}</svg>`;
      aside.appendChild(wrap);
      const svg = $('.st-cal', wrap), cellEls = $$('.st-cell', wrap);
      if (reduced) { svg.classList.add('in'); cellEls.forEach(c => c.classList.add('on')); }
      else {
        new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { svg.classList.add('in'); o.disconnect(); } }, {threshold: .3}).observe(svg);
        let last = -2;
        scrollJobs.push((y, vh) => {
          let cur = -1;
          evs.forEach((ev, i) => { if (i < 6 && ev.getBoundingClientRect().top < vh * .5) cur = i; });
          if (cur === last) return;
          cellEls.forEach((c, i) => { c.classList.toggle('on', i <= cur); c.classList.toggle('cur', i === cur); });
          last = cur;
        });
      }
    }
  }

  // ---------- 6. Visit: the lift ride ----------
  if (STORY.lift && !reduced) {
    const visit = $('#visit');
    if (visit) {
      const lift = document.createElement('div');
      lift.className = 'st-lift';
      lift.setAttribute('aria-hidden', 'true');
      lift.innerHTML = `
        <div class="st-lift-stage">
          <div class="st-lift-bg"></div>
          <div class="st-door l"></div><div class="st-door r"></div>
          <div class="st-lift-panel">
            <div class="st-ind"><svg class="st-arrow" viewBox="0 0 20 16"><path d="M10 1 L19 15 H1 Z"/></svg><span class="st-floor"><span class="st-digits"><b>1</b><b>2</b><b>3</b><b>4</b></span></span></div>
            <div class="st-lift-caps"><span class="label st-lift-cap">Livin Solitaire · Going up</span><span class="st-lift-arrive">You’ve reached <em>The Third Place</em></span></div>
          </div>
        </div>`;
      visit.before(lift);
      const digits = $('.st-digits', lift), panel = $('.st-lift-panel', lift);
      const doors = $$('.st-door', lift), bg = $('.st-lift-bg', lift);
      let top = 0, len = 1, state = '';
      measureJobs.push(() => { top = pageTop(lift); len = Math.max(1, lift.offsetHeight - innerHeight); });
      scrollJobs.push((y, vh) => {
        if (y < top - vh * 1.5 || y > top + len + vh) return;
        const p = clamp((y - top) / len);
        // floors tick 1 → 4, each one holding, then sliding to the next
        const f = 3 * clamp((p - .06) / .5), whole = Math.floor(f);
        const pos = Math.min(3, whole + smooth(clamp((f - whole - .55) / .45)));
        digits.style.transform = `translateY(${(-pos).toFixed(3)}em)`;
        const s = p >= .56 ? 'arrived' : p > .06 ? 'moving' : 'waiting';
        if (s !== state) {
          lift.classList.toggle('moving', s === 'moving');
          lift.classList.toggle('arrived', s === 'arrived');
          state = s;
        }
        const o = smooth(clamp((p - .64) / .28));
        doors[0].style.transform = `translateX(${(-o * 101).toFixed(2)}%)`;
        doors[1].style.transform = `translateX(${(o * 101).toFixed(2)}%)`;
        panel.style.opacity = (1 - clamp((p - .6) / .12)).toFixed(3);
        lift.classList.toggle('open', o > .98);
        // between the opening doors only Visit shows: Ink fills the strip above it
        bg.style.height = clamp(visit.getBoundingClientRect().top, 0, vh).toFixed(1) + 'px';
      });
    }
  }

  // ---------- 7. Footer: the clay dot follows you, then clicks into the logo ----------
  if (STORY.footDot && !reduced) {
    const foot = $('.foot'), mk = foot && $('.stacked .mk', foot), slot = mk && $('.s', mk);
    const yours = foot && $('.foot-big em', foot);
    if (slot) {
      const dot = document.createElement('span');
      dot.className = 'st-fdot';
      dot.setAttribute('aria-hidden', 'true');
      document.body.appendChild(dot);
      mk.classList.add('st-wait');
      let x = 0, y = 0, px = null, py = null, q = 0, state = 'free', placedAt = 0, endAt = 0, started = false;
      foot.addEventListener('pointermove', e => { px = e.clientX + 22; py = e.clientY + 22; });
      const restPoint = () => {
        if (!yours) return [innerWidth / 2, innerHeight / 2];
        const r = yours.getBoundingClientRect();
        return [r.right + 18, r.top + r.height * .55];
      };
      const tick = now => {
        const s = slot.getBoundingClientRect(), sz = s.width;
        const sx = s.left + sz / 2, sy = s.top + sz / 2;
        if (!started) { [x, y] = restPoint(); started = true; }
        if (state === 'free') {
          const [rx, ry] = fine && px !== null ? [px, py] : restPoint();
          x += (rx - x) * .14; y += (ry - y) * .14;
          // close to the logo, or the page has reached the end: snap in
          if (fine && px !== null && Math.hypot(px - 22 - sx, py - 22 - sy) < 70) state = 'snap';
          if (q > .97) { if (!endAt) endAt = now; if (now - endAt > 900) state = 'snap'; } else endAt = 0;
        } else if (state === 'snap') {
          x += (sx - x) * .2; y += (sy - y) * .2;
          if (Math.hypot(sx - x, sy - y) < .8) {
            state = 'done';
            mk.classList.remove('st-wait');
            mk.classList.remove('st-arrived'); void mk.offsetWidth; mk.classList.add('st-arrived');
            placedAt = now;
          }
        }
        dot.style.setProperty('--sz', sz.toFixed(1) + 'px');
        dot.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
        dot.classList.toggle('on', state !== 'done' && q > .3);
      };
      let raf = 0;
      const loop = t => { tick(t); raf = requestAnimationFrame(loop); };
      scrollJobs.push((sy, vh) => {
        q = clamp(1 - foot.getBoundingClientRect().top / vh);
        if (q < .45 && state === 'done' && performance.now() - placedAt > 600) {
          state = 'free'; started = false; mk.classList.add('st-wait'); mk.classList.remove('st-arrived');
        }
        if (q > 0 && !raf) raf = requestAnimationFrame(loop);
        if (q <= 0 && raf) { cancelAnimationFrame(raf); raf = 0; dot.classList.remove('on'); }
      });
    }
  }

  // ---------- Section rail + progress line ----------
  const NAMES = {manifesto: 'Manifesto', spaces: 'The floor', memberships: 'Memberships', studio: 'The Studio',
                 community: 'Community', pricing: 'Pricing', about: 'About', visit: 'Visit'};
  const goTo = el => window.__lenis ? window.__lenis.scrollTo(el, {offset: -72}) : el.scrollIntoView({behavior: reduced ? 'auto' : 'smooth'});

  if (STORY.rail && !reduced) {
    const list = $$('main > section, .finale > section').filter(s => s.id !== 'home')
      .map(s => ({el: s, name: s.classList.contains('idea') ? 'The idea' : NAMES[s.id]})).filter(s => s.name);
    if (list.length) {
      const rail = document.createElement('nav');
      rail.className = 'st-rail';
      rail.setAttribute('aria-label', 'Sections');
      list.forEach(s => {
        const b = document.createElement('button');
        b.type = 'button';
        b.innerHTML = `<span class="tk"></span><span class="nm">${s.name}</span>`;
        b.setAttribute('aria-label', s.name);
        b.addEventListener('click', () => goTo(s.el));
        rail.appendChild(b);
        s.btn = b;
      });
      document.body.appendChild(rail);
      const hero = $('.st-dive') || $('#home'), foot = $('.foot'), manifesto = $('#manifesto');
      // full-screen moments the rail steps aside for
      const covers = [manifesto, $('.st-fly'), $('.st-lift')].filter(Boolean);
      let fits = false, tops = [], heroEnd = 0, spans = [], footTop = 0, active = -1;
      measureJobs.push(() => {
        // only where the page margin is wide enough to hold it, so it never sits over content
        const wrap = $('main .wrap');
        const contentLeft = wrap ? wrap.getBoundingClientRect().left + parseFloat(getComputedStyle(wrap).paddingLeft) : 0;
        fits = innerWidth >= 1024 && contentLeft >= 96;
        rail.classList.toggle('labels', contentLeft >= 240);
        tops = list.map(s => pageTop(s.el.parentElement.classList.contains('finale') ? s.el.parentElement : s.el));
        heroEnd = hero ? pageTop(hero) + hero.offsetHeight : 0;
        spans = covers.map(el => { const t = pageTop(el); return [t, t + el.offsetHeight - innerHeight]; });
        footTop = foot ? pageTop(foot) : Infinity;
      });
      scrollJobs.push((y, vh) => {
        const mid = y + vh * .5;
        const covered = spans.some(([a, b]) => y > a - vh * .5 && y < b + vh * .5);
        const on = fits && y > heroEnd - vh * .4 && !covered && footTop - y > vh * .55;
        rail.classList.toggle('on', on);
        let a = 0;
        tops.forEach((t, i) => { if (mid >= t) a = i; });
        if (a !== active) {
          if (active >= 0) { list[active].btn.classList.remove('on'); list[active].btn.removeAttribute('aria-current'); }
          list[a].btn.classList.add('on');
          list[a].btn.setAttribute('aria-current', 'true');
          rail.classList.toggle('ink', list[a].el.classList.contains('on-ink'));
          active = a;
        }
      });
    }
  }

  if (STORY.progress) {
    const header = $('.site-header');
    if (header) {
      const bar = document.createElement('span');
      bar.className = 'st-bar';
      bar.setAttribute('aria-hidden', 'true');
      header.appendChild(bar);
      let max = 1;
      measureJobs.push(() => { max = Math.max(1, document.documentElement.scrollHeight - innerHeight); });
      scrollJobs.push(y => { bar.style.transform = `scaleX(${clamp(y / max).toFixed(4)})`; });
    }
  }

  // ---------- The logo's dots on every section label ----------
  if (STORY.labelDots) {
    const kickers = $$('main > section:not(.hero) .kicker, .finale .kicker');
    const io = reduced ? null : new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    }), {rootMargin: '0px 0px -15% 0px'});
    kickers.forEach(k => {
      const m = document.createElement('span');
      m.className = 'st-km' + (reduced ? ' in' : '');
      m.setAttribute('aria-hidden', 'true');
      m.innerHTML = '<i></i><i></i><i></i>';
      k.prepend(m);
      if (io) io.observe(m);
    });
  }

  // ---------- The Studio: a small waveform that records as you scroll ----------
  if (STORY.studioRec) {
    const studio = $('#studio'), head = studio && $('.section-head', studio);
    if (head) {
      const N = 72;
      const bars = Array.from({length: N}, (_, i) => {
        const h = 6 + 30 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * .37) * .8 + Math.sin(i * .21) * .2);
        return `<rect x="${i * 10 + 2}" y="${(20 - h / 2).toFixed(1)}" width="5" height="${h.toFixed(1)}" rx="2.5"/>`;
      }).join('');
      const rec = document.createElement('div');
      rec.className = 'st-rec';
      rec.setAttribute('aria-hidden', 'true');
      rec.innerHTML = `<span class="rd"></span><span class="label">Rec</span><span class="tm">00:00:00</span>
        <svg viewBox="0 0 ${N * 10} 40" preserveAspectRatio="none">${bars}</svg>`;
      head.appendChild(rec);
      const rects = $$('rect', rec), tm = $('.tm', rec);
      const LENGTH = 47 * 60 + 12;   // the "episode" length in seconds shown when fully played
      const fmt = s => [s / 3600, (s % 3600) / 60, s % 60].map(v => String(Math.floor(v)).padStart(2, '0')).join(':');
      const paint = t => {
        const n = Math.round(t * N);
        rects.forEach((r, i) => r.classList.toggle('on', i < n));
        tm.textContent = fmt(Math.round(t * LENGTH));
      };
      if (reduced) paint(1);
      else {
        let top = 0, len = 1, last = -1;
        measureJobs.push(() => { top = pageTop(studio); len = Math.max(1, studio.offsetHeight); });
        scrollJobs.push((y, vh) => {
          const t = clamp((y + vh * .7 - top) / len);
          rec.classList.toggle('live', t > 0 && t < 1);
          const q = Math.round(t * 400);
          if (q !== last) { last = q; paint(t); }
        });
      }
    }
  }

  // ---------- "Ask us?" ----------
  if (STORY.askUs) {
    const wa = $('#floatCta .float-wa');
    if (wa) {
      const ask = document.createElement('a');
      ask.className = 'st-ask';
      ask.textContent = 'Ask us?';
      ask.href = wa.href;
      ask.target = '_blank';
      ask.rel = 'noopener';
      wa.before(ask);
    }
  }

  // ---------- One scroll listener, measuring only when layout changes ----------
  const measure = () => measureJobs.forEach(f => f());
  let ticking = false;
  const frame = () => { const y = scrollY, vh = innerHeight; scrollJobs.forEach(f => f(y, vh)); ticking = false; };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  const remeasure = () => { measure(); frame(); };
  remeasure();
  addEventListener('scroll', onScroll, {passive: true});
  addEventListener('resize', remeasure);
  addEventListener('load', remeasure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  if ('ResizeObserver' in window) {
    let t;
    const ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(remeasure, 150); });
    $$('main, .finale').forEach(el => ro.observe(el));
  }
})();
