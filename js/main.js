(() => {
  const WA_NUMBER = '919185151597';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const waLink = text => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

  // WhatsApp links
  $$('[data-wa]').forEach(a => {
    a.href = waLink(a.dataset.wa);
    a.target = '_blank';
    a.rel = 'noopener';
  });

  $('#year').textContent = new Date().getFullYear();

  // Hero entrance (after the intro, if it's playing; failsafe in case motion.js doesn't load)
  const startHero = () => document.body.classList.add('loaded');
  if (document.documentElement.classList.contains('intro')) {
    addEventListener('ttp:intro-done', startHero, {once: true});
    setTimeout(startHero, 6000);
  } else {
    requestAnimationFrame(startHero);
  }

  // Every load starts at the top (see the <head>); make sure nothing moved us before the intro ends
  addEventListener('load', () => {
    if (!scrollY) return;
    const root = document.documentElement;
    root.style.scrollBehavior = 'auto';
    scrollTo(0, 0);
    requestAnimationFrame(() => { root.style.scrollBehavior = ''; });
  });

  // In-page links scroll to their section without adding #section to the address,
  // so a refresh never jumps back down the page
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    if (a.classList.contains('sr-only')) {   // "Skip to content": move keyboard focus too
      target.setAttribute('tabindex', '-1');
      target.focus({preventScroll: true});
    }
  });

  // Header: scrolled state + mobile action bar
  const header = $('#top'), bar = $('#actionbar'), floatCta = $('#floatCta');
  const hero = $('#home'), visit = $('#visit');
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('scrolled', y > 8);
    const pastHero = y > hero.offsetHeight * .6;
    const r = visit.getBoundingClientRect();
    const reachedVisit = r.top < innerHeight; // contact section and footer
    bar.classList.toggle('show', pastHero && !reachedVisit);
    floatCta.classList.toggle('show', pastHero && !reachedVisit);
  };
  onScroll();
  addEventListener('scroll', onScroll, {passive:true});
  addEventListener('resize', onScroll);

  // Mobile menu
  const burger = $('#burger'), navLinks = $('#navLinks');
  const setMenu = open => {
    navLinks.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
  $$('a', navLinks).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  let resizeTimer;
  addEventListener('resize', () => {
    navLinks.classList.add('no-anim');
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => navLinks.classList.remove('no-anim'), 300);
  });

  // Reveal on scroll
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {threshold:.12, rootMargin:'0px 0px -40px 0px'});
  $$('.reveal').forEach(el => io.observe(el));

  // Scroll-spy
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      $$('a', navLinks).forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, {rootMargin:'-45% 0px -50% 0px'});
  ['home','spaces','memberships','studio','community','pricing','about','visit'].forEach(id => spy.observe(document.getElementById(id)));

  // Floor plan <-> zone list
  const zones = $$('#plan .fz');
  const items = $$('#zoneList li');
  let current = -1, userTouched = false, cycle;
  const setZone = i => {
    current = i;
    zones.forEach(z => z.classList.toggle('on', +z.dataset.z === i));
    items.forEach((li, j) => {
      li.classList.toggle('on', j === i);
      $('.zone-btn', li).setAttribute('aria-expanded', j === i);
    });
  };
  const stopCycle = () => { userTouched = true; clearInterval(cycle); };
  items.forEach((li, i) => $('.zone-btn', li).addEventListener('click', () => { stopCycle(); setZone(current === i ? -1 : i); }));
  zones.forEach(z => {
    z.addEventListener('click', () => { stopCycle(); setZone(+z.dataset.z); });
    z.addEventListener('mouseenter', () => { if (userTouched) setZone(+z.dataset.z); });
  });
  setZone(0);
  if (!reduced) {
    new IntersectionObserver((en, o) => {
      if (en[0].isIntersecting && !userTouched) {
        cycle = setInterval(() => setZone((current + 1) % zones.length), 3200);
        o.disconnect();
      }
    }, {threshold:.4}).observe($('#plan'));
  }

  // Seat finder
  const grid = $('#mgrid');
  $$('#finder .chip').forEach(chip => chip.addEventListener('click', () => {
    const on = chip.getAttribute('aria-pressed') !== 'true';
    $$('#finder .chip').forEach(c => c.setAttribute('aria-pressed', 'false'));
    chip.setAttribute('aria-pressed', on);
    grid.classList.toggle('filtering', on);
    $$('.m-card', grid).forEach(c => c.classList.toggle('match', on && c.dataset.fit === chip.dataset.fit));
    if (on && innerWidth < 980) {
      const m = $('.m-card.match', grid);
      m && m.scrollIntoView({behavior: reduced ? 'auto' : 'smooth', block:'center'});
    }
  }));

  // Amphitheatre: fold the glass
  const seats = $('#seats'), stage = $('#stage'), foldBtn = $('#foldBtn'), foldLbl = $('#foldLbl');
  [7, 11, 15, 19].forEach((n, r) => {
    const row = document.createElement('div');
    row.className = 'row';
    for (let i = 0; i < n; i++) {
      const d = document.createElement('i');
      if ((i * 7 + r * 3) % 9 === 0) d.className = 'c';
      d.style.transitionDelay = (r * 90 + i * 18) + 'ms';
      row.appendChild(d);
    }
    seats.appendChild(row);
  });
  foldBtn.addEventListener('click', () => {
    const open = foldBtn.getAttribute('aria-pressed') !== 'true';
    foldBtn.setAttribute('aria-pressed', open);
    stage.classList.toggle('open', open);
    foldLbl.textContent = open ? 'Close the glass' : 'Fold the glass back';
  });

  // Enquiry form -> Google Sheet (via Apps Script web app, see google-apps-script.gs)
  // Paste your Web app URL here after deploying the script:
  const SHEET_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzEw4spm3m1c7YvdRekThqufxg3fYJPDLrB47YY67doHMm9up8foVC5YhHYcCslo_DW3w/exec';

  const form = $('#enquiry'), err = $('#err'), body = $('#formBody'), done = $('#formDone');
  const submitBtn = $('#submitBtn');
  const intChips = $$('#interest .chip');
  const pickInterest = label => intChips.forEach(x => x.setAttribute('aria-checked', x.textContent === label));
  intChips.forEach(c => c.addEventListener('click', () => pickInterest(c.textContent)));

  // "Enquire" / "Ask" buttons: jump to the form with that option already picked
  $$('[data-interest]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    pickInterest(a.dataset.interest);
    if (!done.hidden) { done.hidden = true; body.hidden = false; }
    form.scrollIntoView({behavior: reduced ? 'auto' : 'smooth', block: 'start'});
    setTimeout(() => $('#name').focus({preventScroll: true}), reduced ? 0 : 600);
  }));

  const fail = (el, msg) => { el.setAttribute('aria-invalid', 'true'); err.textContent = msg; el.focus(); };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('#name'), phone = $('#phone'), email = $('#email');
    [name, phone, email].forEach(el => el.removeAttribute('aria-invalid'));
    err.textContent = '';
    if (!name.value.trim()) return fail(name, 'Please add your name.');
    if (phone.value.replace(/\D/g, '').length < 10) return fail(phone, 'Please add a phone number we can reach you on.');
    if (email.value.trim() && !/^\S+@\S+\.\S+$/.test(email.value.trim())) return fail(email, 'That email doesn’t look quite right.');

    const data = new URLSearchParams({
      name: name.value.trim(),
      phone: phone.value.trim(),
      email: email.value.trim(),
      interest: $('#interest [aria-checked="true"]').textContent,
      when: $('#when').value.trim(),
      message: $('#message').value.trim(),
      website: $('#website').value
    });

    if (!SHEET_ENDPOINT) {
      err.textContent = 'This form isn’t connected yet. Please call or WhatsApp us on +91 91851 51597.';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    try {
      // no-cors: Apps Script doesn't send CORS headers we can rely on; the row is still written.
      await fetch(SHEET_ENDPOINT, {method: 'POST', mode: 'no-cors', body: data});
      $('#doneName').textContent = name.value.trim().split(' ')[0];
      form.reset();
      pickInterest('Just visiting');
      body.hidden = true;
      done.hidden = false;
      done.focus();
    } catch (_) {
      err.textContent = 'Couldn’t send just now. Check your connection and try again, or call us on +91 91851 51597.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Submit <span class="arrow">→</span>';
    }
  });
  $('#again').addEventListener('click', () => { done.hidden = true; body.hidden = false; $('#name').focus(); });
})();
