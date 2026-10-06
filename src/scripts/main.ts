// All page behaviour. No framework: the site is static HTML that works without this file;
// this layers motion, the hero carousel, the live open/smoker status and the order request on top.

type When = 'now' | 'evening' | 'weekend';
type Item = { id: string; fullName: string; when: When };
type Biz = { whatsapp: string; openMinutes: number; closeMinutes: number; closeMinutesWed: number; smokerMinutes: number };

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const data = JSON.parse($('#ct-data')!.textContent || '{}') as { items: Item[]; biz: Biz };
const itemById = new Map(data.items.map((i) => [i.id, i]));

/* ---------------------------------------------------------------- reveal */
function initReveal() {
  const els = $$('[data-reveal]');
  if (!('IntersectionObserver' in window) || reduced) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
  );
  els.forEach((el) => io.observe(el));
}

/* ---------------------------------------------------------------- scroll-linked progress + floating nav
   One passive scroll listener, batched through requestAnimationFrame; it only writes CSS variables. */
function initScroll() {
  const els = $$('[data-progress]');
  const galRow = $('[data-gal-row]');
  const galCenter = $('[data-gal-center]');
  const navEl = $('[data-nav]');
  const callbar = $('[data-callbar]');
  const heroFood = $('[data-hero-food]');
  let last = scrollY;
  let floating = false;

  const centreGallery = () => {
    if (!galRow || !galCenter) return;
    const container = galRow.parentElement!.clientWidth;
    const c = galCenter.offsetLeft + galCenter.offsetWidth / 2 - container / 2;
    galRow.style.setProperty('--c', `${c}px`);
  };

  const progress = () => {
    const vh = innerHeight;
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      const mode = el.dataset.progress;
      let p = 0;
      if (mode === 'sticky') p = -r.top / Math.max(1, r.height - vh);
      else if (mode === 'enter') p = (vh - r.top) / (vh * 0.8);
      else p = (vh - r.top) / (vh + r.height);
      el.style.setProperty('--p', clamp(p).toFixed(4));
    }
    // the hero plate turns a little as the page scrolls away
    if (heroFood && scrollY < vh * 1.5) heroFood.style.rotate = `${(scrollY * 0.05).toFixed(2)}deg`;
  };

  const nav = () => {
    const y = scrollY;
    if (callbar) callbar.hidden = y < 520;
    if (!navEl) return;
    const want = y > 420;
    if (want !== floating) {
      floating = want;
      navEl.style.transition = 'none';
      navEl.classList.toggle('is-float', want);
      navEl.classList.toggle('is-hidden', want);
      navEl.inert = want;
      void navEl.offsetWidth;
      navEl.style.transition = '';
    } else if (floating && !document.body.classList.contains('menu-open')) {
      if (Math.abs(y - last) > 6) {
        navEl.classList.toggle('is-hidden', y > last);
        navEl.inert = y > last;
      }
    }
    last = y;
  };

  let ticking = false;
  const update = () => {
    ticking = false;
    if (!reduced) progress();
    nav();
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  if (reduced) els.forEach((el) => el.style.setProperty('--p', '1'));
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => {
    centreGallery();
    onScroll();
  });
  centreGallery();
  // images load late on slow links; re-centre once they have
  addEventListener('load', centreGallery);
  update();
}

/* ---------------------------------------------------------------- mobile menu */
function initMenu() {
  const navEl = $('[data-nav]');
  const burger = $<HTMLButtonElement>('.nav__burger');
  const menu = $('#mobile-menu');
  if (!navEl || !burger || !menu) return;
  const setOpen = (open: boolean) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
    document.body.classList.toggle('menu-open', open);
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) {
      navEl.classList.remove('is-hidden');
      navEl.inert = false;
      $('a', menu)?.focus();
    }
  };
  burger.addEventListener('click', () => setOpen(burger.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) setOpen(false);
  });
  addEventListener('keydown', (e) => {
    if (menu.hidden) return;
    if (e.key === 'Escape') {
      setOpen(false);
      burger.focus();
    }
    if (e.key !== 'Tab') return;
    // cycle between the menu links and the close (burger) button
    const f = [...$$('a', menu), burger];
    const i = f.indexOf(document.activeElement as HTMLElement);
    if (e.shiftKey && i <= 0) {
      e.preventDefault();
      f.at(-1)!.focus();
    } else if (!e.shiftKey && (i === f.length - 1 || i === -1)) {
      e.preventDefault();
      f[0].focus();
    }
  });
}

/* ---------------------------------------------------------------- hero carousel
   Each slide shifts the headline to that dish's availability colour. */
function initHero() {
  const stage = $('[data-hero]');
  const slides = $$('[data-slide]');
  const live = $('[data-hero-live]');
  if (!stage || !slides.length) return;
  let current = 0;

  const go = (next: number, dir: 1 | -1) => {
    next = (next + slides.length) % slides.length;
    if (next === current) return;
    stage.style.setProperty('--dir', String(dir));
    const prev = slides[current];
    const incoming = slides[next];
    // park the incoming slide on the correct side before animating it in
    incoming.style.transition = 'none';
    incoming.classList.remove('is-leaving', 'is-active');
    void incoming.offsetWidth;
    incoming.style.transition = '';
    prev.classList.remove('is-active');
    prev.classList.add('is-leaving');
    prev.setAttribute('aria-hidden', 'true');
    incoming.classList.add('is-active');
    incoming.setAttribute('aria-hidden', 'false');
    setTimeout(() => prev.classList.remove('is-leaving'), 1000);
    current = next;
    if (incoming.dataset.accent) document.documentElement.style.setProperty('--hero-accent', incoming.dataset.accent);
    if (live) live.textContent = `Slide ${next + 1} of ${slides.length}: ${incoming.querySelector('figcaption')?.textContent ?? ''}`;
  };

  $('[data-hero-next]')?.addEventListener('click', () => go(current + 1, 1));
  $('[data-hero-prev]')?.addEventListener('click', () => go(current - 1, -1));

  // swipe
  let x0: number | null = null;
  stage.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') x0 = e.clientX;
  });
  stage.addEventListener('pointerup', (e) => {
    if (x0 == null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 50) go(current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  });

  setTimeout(() => document.documentElement.classList.add('hero-ready'), 2100);
}

/* ---------------------------------------------------------------- story player */
function initStory() {
  const root = $('[data-story]');
  if (!root) return;
  const frames = $$('[data-frame]', root);
  const bars = $$<HTMLElement>('.story__bar i', root);
  const DUR = 5000;
  let i = 0;
  let t0 = performance.now();
  let paused = false;
  let visible = false;
  let elapsed = 0;
  let raf = 0;

  const show = (n: number) => {
    frames[i].classList.remove('is-on');
    frames[i].setAttribute('aria-hidden', 'true');
    i = (n + frames.length) % frames.length;
    frames[i].classList.add('is-on');
    frames[i].setAttribute('aria-hidden', 'false');
    bars.forEach((b, k) => b.style.setProperty('--f', k < i ? '1' : '0'));
    elapsed = 0;
    t0 = performance.now();
  };
  const tick = (now: number) => {
    if (!paused) {
      elapsed += now - t0;
      if (elapsed >= DUR) show(i + 1);
      bars[i].style.setProperty('--f', String(clamp(elapsed / DUR)));
    }
    t0 = now;
    raf = requestAnimationFrame(tick);
  };
  root.addEventListener('pointerenter', () => (paused = true));
  root.addEventListener('pointerleave', () => (paused = false));
  $('[data-story-next]', root)?.addEventListener('click', () => show(i + 1));
  $('[data-story-prev]', root)?.addEventListener('click', () => show(i - 1));
  if (reduced) return;
  // the frame loop only runs while the player is on screen
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting === visible) return;
    visible = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) {
      t0 = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }).observe(root);
}

/* ---------------------------------------------------------------- open / smoker / brisket status (IST) */
function nowIST() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return { minutes: (+get('hour') % 24) * 60 + +get('minute'), day: get('weekday') };
}
function status() {
  const { minutes, day } = nowIST();
  const b = data.biz;
  const close = day === 'Wed' ? b.closeMinutesWed : b.closeMinutes;
  const closeText = day === 'Wed' ? '10 PM' : '11 PM';
  const weekend = day === 'Sat' || day === 'Sun';
  const open = minutes >= b.openMinutes && minutes < close;
  const smoking = open && minutes >= b.smokerMinutes;
  let text: string;
  if (!open) {
    text = minutes < b.openMinutes ? 'Closed now · opens 12:30 PM' : 'Closed now · opens 12:30 PM tomorrow';
    if (minutes < b.openMinutes && weekend) text += ' · brisket from 6 PM';
  } else if (!smoking) {
    text = weekend ? 'Open now · brisket from 6 PM' : 'Open now · smoker from 6 PM';
  } else {
    text = weekend ? 'Open now · brisket on until sold out' : `Open now · smoker on until ${closeText}`;
  }
  return { open, smoking, weekend, text };
}
function initStatus() {
  const set = () => {
    const s = status();
    $$('[data-open-status]').forEach((el) => (el.textContent = s.text));
    $$('[data-open-dot]').forEach((el) => (el.dataset.state = s.open ? 'open' : 'closed'));
  };
  set();
  setInterval(set, 60_000);
}

/* ---------------------------------------------------------------- toast */
let toastTimer = 0;
function toast(msg: string, action?: { label: string; run: () => void }) {
  const el = $('[data-toast]');
  if (!el) return;
  el.replaceChildren(document.createTextNode(msg));
  if (action) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = action.label;
    b.addEventListener('click', () => {
      action.run();
      el.classList.remove('is-on');
    });
    el.append(b);
  }
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove('is-on'), action ? 5000 : 2200);
}

/* ---------------------------------------------------------------- order request (WhatsApp) */
function initOrder() {
  const KEY = 'ct-basket';
  const TTL = 2 * 60 * 60 * 1000;
  const pill = $<HTMLButtonElement>('[data-tray-open]');
  const tray = $('#tray');
  if (!pill || !tray) return;
  const count = $('[data-tray-count]')!;
  const scrim = $('[data-tray-scrim]')!;
  const list = $('[data-tray-list]')!;
  const empty = $('[data-tray-empty]')!;
  const whenNote = $('[data-tray-when]')!;
  const send = $<HTMLAnchorElement>('[data-tray-send]')!;
  const nameIn = $<HTMLInputElement>('input[name="oname"]', tray)!;
  const noteIn = $<HTMLTextAreaElement>('textarea[name="onote"]', tray)!;
  const noteCount = $('[data-note-count]', tray)!;
  let opener: HTMLElement | null = null;

  let basket: [string, number][] = [];
  try {
    const raw = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (raw && Date.now() - raw.t < TTL) {
      const before = raw.items.length;
      basket = raw.items.filter(([id]: [string, number]) => itemById.has(id));
      if (basket.length < before) toast('Some items are no longer on the menu and were removed.');
    }
  } catch {
    /* storage blocked: the basket lives in memory only */
  }

  const save = () => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now(), items: basket }));
    } catch {
      /* ignore */
    }
  };
  const total = () => basket.reduce((n, [, q]) => n + q, 0);
  const whenText = (w: When) => (w === 'weekend' ? 'Sat & Sun, from 6 PM' : w === 'evening' ? 'From 6 PM' : '');

  const payload = () => {
    const type = $<HTMLInputElement>('input[name="otype"]:checked', tray)?.value || 'Dine in';
    const name = nameIn.value.trim();
    const note = noteIn.value.trim();
    const d = new Date();
    const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).toUpperCase();
    const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }).format(d);
    const lines = ['*ORDER REQUEST - CAFE TAMARIND*', '', `*Type:* ${type}`];
    if (name) lines.push(`*Name:* ${name}`);
    lines.push(
      '',
      ...basket.map(([id, q]) => {
        const it = itemById.get(id)!;
        const w = whenText(it.when);
        return `${q} x ${it.fullName}${w ? ` (${w})` : ''}`;
      }),
    );
    if (note) lines.push('', `*When / how many:* ${note}`);
    lines.push('', `_Sent from the website, ${time}, ${date}_`);
    return lines.join('\n');
  };

  const render = () => {
    const n = total();
    count.textContent = String(n);
    pill.hidden = n === 0;
    pill.setAttribute('aria-label', `Your order, ${n} item${n === 1 ? '' : 's'}`);
    empty.hidden = n > 0;
    // the list is rebuilt, so remember which +/- had focus and hand it back afterwards
    const act = document.activeElement;
    const focusLabel = act && list.contains(act) ? act.getAttribute('aria-label') : null;
    list.replaceChildren(
      ...basket.map(([id, q]) => {
        const it = itemById.get(id)!;
        const li = document.createElement('li');
        const nm = document.createElement('span');
        nm.className = 't-name';
        nm.textContent = it.fullName;
        const w = whenText(it.when);
        if (w) {
          const tag = document.createElement('span');
          tag.className = 't-when';
          tag.dataset.when = it.when;
          tag.textContent = w;
          nm.append(tag);
        }
        const qty = document.createElement('span');
        qty.className = 't-qty';
        const minus = Object.assign(document.createElement('button'), { type: 'button', textContent: '−' });
        minus.setAttribute('aria-label', `Remove one ${it.fullName}`);
        minus.addEventListener('click', () => change(id, -1));
        const out = document.createElement('output');
        out.textContent = String(q);
        const plus = Object.assign(document.createElement('button'), { type: 'button', textContent: '+' });
        plus.setAttribute('aria-label', `Add one more ${it.fullName}`);
        plus.addEventListener('click', () => change(id, 1));
        qty.append(minus, out, plus);
        li.append(nm, qty);
        return li;
      }),
    );
    if (focusLabel) {
      const back = $$<HTMLButtonElement>('button', list).find((b) => b.getAttribute('aria-label') === focusLabel);
      (back ?? $<HTMLElement>('[data-tray-close]', tray))?.focus();
    }
    // say plainly when something in the basket is not available right now
    const s = status();
    const kinds = new Set(basket.map(([id]) => itemById.get(id)!.when));
    let msg = '';
    if (kinds.has('weekend') && !s.weekend) msg = 'Brisket is Saturday and Sunday only, from 6 PM until sold out.';
    else if (kinds.has('weekend') && !s.smoking) msg = 'Brisket is ready from 6 PM today, until sold out.';
    else if (kinds.has('evening') && !s.smoking) msg = 'Smoker items are ready from 6 PM.';
    whenNote.textContent = msg;
    whenNote.hidden = !msg;

    send.setAttribute('aria-disabled', String(n === 0));
    send.textContent = n === 0 ? 'Add something first' : 'Send on WhatsApp';
    // an <a> without href is neither focusable nor activatable: a real disabled state
    if (n) send.href = `https://wa.me/${data.biz.whatsapp}?text=${encodeURIComponent(payload())}`;
    else send.removeAttribute('href');
    save();
  };

  const change = (id: string, delta: number) => {
    const idx = basket.findIndex(([k]) => k === id);
    if (idx === -1) {
      if (delta > 0) basket.push([id, delta]);
    } else {
      const q = basket[idx][1] + delta;
      if (q <= 0) {
        const removed = basket.splice(idx, 1)[0];
        toast(`Removed ${itemById.get(id)!.fullName}`, {
          label: 'Undo',
          run: () => {
            basket.splice(idx, 0, removed);
            render();
          },
        });
      } else if (q > 40) {
        toast('That is a big order. Please call so we get it right.');
        return;
      } else basket[idx][1] = q;
    }
    render();
  };

  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-add]');
    if (!btn) return;
    const id = btn.dataset.add!;
    const it = itemById.get(id);
    if (!it) return;
    change(id, 1);
    pill.classList.remove('bump');
    void pill.offsetWidth;
    pill.classList.add('bump');
    const w = whenText(it.when);
    toast(`Added ${it.fullName}${w ? `. ${w}.` : ''}`);
  });

  const focusables = () =>
    $$<HTMLElement>('button, a[href], input, textarea', tray).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
  const open = () => {
    opener = document.activeElement as HTMLElement;
    tray.hidden = false;
    scrim.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    render();
    focusables()[0]?.focus();
  };
  const close = () => {
    tray.hidden = true;
    scrim.hidden = true;
    document.documentElement.style.overflow = '';
    (opener || pill).focus();
  };
  pill.addEventListener('click', open);
  scrim.addEventListener('click', close);
  $('[data-tray-close]', tray)?.addEventListener('click', close);
  // on document, not the sheet: the toast's Undo button sits outside it and can hold focus
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !tray.hidden) close();
  });
  tray.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const f = focusables();
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) {
      e.preventDefault();
      f.at(-1)!.focus();
    } else if (!e.shiftKey && document.activeElement === f.at(-1)) {
      e.preventDefault();
      f[0].focus();
    }
  });
  tray.addEventListener('input', () => {
    const len = noteIn.value.length;
    noteCount.hidden = len < 160;
    noteCount.textContent = `${len}/200`;
    render();
  });
  render();
}

initReveal();
initScroll();
initMenu();
initHero();
initStory();
initStatus();
initOrder();
