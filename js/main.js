/* ============================================================
   main.js — GSAP UI layer
   Preloader, hero reveal, per-letter name reveals, spec
   counters, custom cursor, magnetic buttons, side dots,
   scroll progress, header state.
   (The 3D camera is driven in scene.js.)
   ============================================================ */

import { CARS } from './cars.js';
import './scene.js'; // boots the Three.js showroom (must run before UI setup)

gsap.registerPlugin(ScrollTrigger);

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE_POINTER = matchMedia('(pointer: fine)').matches;

/* ---------- split text into letters ---------- */

function splitChars(el) {
  const text = el.textContent;
  el.textContent = '';
  [...text].forEach((ch) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = ch === ' ' ? '\u00A0' : ch;
    el.appendChild(span);
  });
}
document.querySelectorAll('[data-split]').forEach(splitChars);

/* ---------- preloader ---------- */

const preloader = document.getElementById('preloader');
const preNum = document.getElementById('pre-num');
const preBar = document.getElementById('pre-bar');

function launchHero() {
  gsap.set(preloader, { pointerEvents: 'none' });
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  tl.to(preloader, { yPercent: -100, duration: 0.9, ease: 'power4.inOut' })
    .to('.hero .line-inner', { yPercent: 0, duration: 1.15, stagger: 0.12 }, '-=0.55')
    .to('.hero .reveal', { opacity: 1, y: 0, duration: 0.9, stagger: 0.1 }, '-=0.7')
    .to('#header', { opacity: 1, y: 0, duration: 0.8 }, '-=0.6')
    .to('#side-dots', { opacity: 1, duration: 0.6 }, '-=0.4')
    .set(preloader, { display: 'none' });
  return tl;
}

if (REDUCED) {
  gsap.set(preloader, { display: 'none' });
  gsap.set(['.hero .line-inner', '.hero .reveal', '#header', '#side-dots'], { clearProps: 'all' });
} else {
  gsap.set('.hero .line-inner', { yPercent: 115 });
  gsap.set('.hero .reveal', { y: 26, opacity: 0 });
  gsap.set('#header', { y: -16, opacity: 0 });
  gsap.set('#side-dots', { opacity: 0 });

  const pre = { v: 0 };
  const dur = 1.5;
  gsap.to(pre, {
    v: 100,
    duration: dur,
    ease: 'power2.inOut',
    onUpdate: () => {
      preNum.textContent = String(Math.round(pre.v)).padStart(2, '0');
    },
  });
  gsap.to(preBar, { scaleX: 1, duration: dur, ease: 'power2.inOut' });

  const wait = Math.max(0, dur - 0.25);
  gsap.delayedCall(wait, () => {
    const tl = launchHero();
    // make sure the marquee/scroll systems sync after layout changes
    tl.eventCallback('onComplete', () => ScrollTrigger.refresh());
  });
}

/* ---------- hero title (re-usable on load) ---------- */

/* ---------- per-car reveals ---------- */

document.querySelectorAll('section.car').forEach((sec) => {
  const chars = sec.querySelectorAll('.car-name .char');
  const reveals = sec.querySelectorAll('.reveal');
  const counters = sec.querySelectorAll('.num[data-count]');

  if (REDUCED) return;

  gsap.set(chars, { yPercent: 120, opacity: 0 });
  gsap.set(reveals, { y: 34, opacity: 0 });

  ScrollTrigger.create({
    trigger: sec,
    start: 'top 12%',
    onEnter: () => {
      gsap.to(chars, {
        yPercent: 0,
        opacity: 1,
        duration: 0.85,
        ease: 'power4.out',
        stagger: 0.032,
      });
      gsap.to(reveals, {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.09,
        delay: 0.15,
      });
    },
    once: true,
  });

  ScrollTrigger.create({
    trigger: sec,
    start: 'top 45%',
    once: true,
    onEnter: () => {
      counters.forEach((el) => animateCount(el));
    },
  });
});

function animateCount(el) {
  const target = parseFloat(el.dataset.count);
  const dec = parseInt(el.dataset.dec || '0', 10);
  const o = { v: 0 };
  gsap.to(o, {
    v: target,
    duration: 1.7,
    ease: 'power3.out',
    onUpdate: () => {
      el.textContent = o.v.toFixed(dec);
    },
    onComplete: () => {
      el.textContent = target.toFixed(dec);
    },
  });
}

/* ---------- forge reveals ---------- */

const forge = document.getElementById('forge');
if (forge && !REDUCED) {
  forge.querySelectorAll('.line-inner').forEach((l) => gsap.set(l, { yPercent: 115 }));
  gsap.set(forge.querySelectorAll('.reveal'), { y: 34, opacity: 0 });

  ScrollTrigger.create({
    trigger: forge,
    start: 'top 70%',
    once: true,
    onEnter: () => {
      gsap.to(forge.querySelectorAll('.line-inner'), {
        yPercent: 0,
        duration: 1,
        ease: 'power4.out',
        stagger: 0.12,
      });
      gsap.to(forge.querySelectorAll('.reveal'), {
        y: 0,
        opacity: 1,
        duration: 0.85,
        ease: 'power3.out',
        stagger: 0.06,
        delay: 0.1,
      });
    },
  });
}

/* ---------- scroll progress bar ---------- */

if (!REDUCED) {
  gsap.to('#progress', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.4 },
  });
} else {
  gsap.set('#progress', { scaleX: 0 });
}

/* ---------- header state + scroll hint fade ---------- */

ScrollTrigger.create({
  start: 40,
  onEnter: () => document.getElementById('header').classList.add('scrolled'),
  onLeaveBack: () => document.getElementById('header').classList.remove('scrolled'),
});

const hint = document.getElementById('scroll-hint');
if (hint) {
  gsap.to(hint, {
    opacity: 0,
    scrollTrigger: { start: 60, end: 320, scrub: true },
  });
}

/* ---------- side dots ---------- */

const dotMap = { ...{} };
document.querySelectorAll('#side-dots .dot').forEach((d) => (dotMap[d.dataset.dot] = d));

function setActiveDot(id) {
  document.querySelectorAll('#side-dots .dot').forEach((d) => {
    const on = d.dataset.dot === id;
    d.classList.toggle('active', on);
  });
}

// accent per dot (matches car accent colors)
const dotAccents = {
  diablo: '#ff2222',
  testarossa: '#ff4a1c',
  ultima: '#a55bff',
  carrera: '#ffd90b',
};
document.querySelectorAll('#side-dots .dot').forEach((d) => {
  const c = dotAccents[d.dataset.dot];
  if (c) d.style.setProperty('--dot-accent', c);
});

document.querySelectorAll('main section[data-dot]').forEach((sec) => {
  ScrollTrigger.create({
    trigger: sec,
    start: 'top 55%',
    end: 'bottom 45%',
    onToggle: (self) => {
      if (self.isActive) setActiveDot(sec.dataset.dot);
    },
  });
});

// click a dot -> scroll to section
document.querySelectorAll('#side-dots .dot').forEach((d) => {
  d.addEventListener('click', () => {
    const sec = document.querySelector(`main section[data-dot="${d.dataset.dot}"]`);
    if (sec) sec.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
  });
});

/* ---------- custom cursor ---------- */

if (FINE_POINTER && !REDUCED) {
  const dotX = gsap.quickTo('#cursor-dot', 'x', { duration: 0.12, ease: 'power3' });
  const dotY = gsap.quickTo('#cursor-dot', 'y', { duration: 0.12, ease: 'power3' });
  const ringX = gsap.quickTo('#cursor-ring', 'x', { duration: 0.45, ease: 'power3' });
  const ringY = gsap.quickTo('#cursor-ring', 'y', { duration: 0.45, ease: 'power3' });

  addEventListener('mousemove', (e) => {
    dotX(e.clientX);
    dotY(e.clientY);
    ringX(e.clientX);
    ringY(e.clientY);
  });

  document.querySelectorAll('a, [data-hover], .dot').forEach((el) => {
    el.addEventListener('mouseenter', () =>
      gsap.to('#cursor-ring', { scale: 1.9, borderColor: 'rgba(255,255,255,0.9)', duration: 0.3 })
    );
    el.addEventListener('mouseleave', () =>
      gsap.to('#cursor-ring', { scale: 1, borderColor: 'rgba(255,255,255,0.5)', duration: 0.3 })
    );
  });
} else {
  gsap.set(['#cursor-dot', '#cursor-ring'], { display: 'none' });
}

/* ---------- magnetic buttons ---------- */

if (FINE_POINTER && !REDUCED) {
  document.querySelectorAll('[data-magnetic]').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      gsap.to(btn, {
        x: (e.clientX - r.left - r.width / 2) * 0.28,
        y: (e.clientY - r.top - r.height / 2) * 0.28,
        duration: 0.4,
        ease: 'power3.out',
      });
    });
    btn.addEventListener('mouseleave', () =>
      gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' })
    );
  });
}

/* ---------- keep everything in sync after load ---------- */

addEventListener('load', () => ScrollTrigger.refresh());
