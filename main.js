// ── CUSTOM CURSOR ──
const cursorDot  = document.getElementById('cursor-dot');
const cursorRing = document.getElementById('cursor-ring');

let ringX = 0, ringY = 0;
let dotX  = 0, dotY  = 0;

function animateCursor() {
  // Dot follows instantly via CSS transform set on mousemove
  // Ring follows with smooth lerp
  ringX += (dotX - ringX) * 0.08;
  ringY += (dotY - ringY) * 0.08;

  cursorRing.style.transform = `translate(calc(${ringX}px - 50%), calc(${ringY}px - 50%))`;

  requestAnimationFrame(animateCursor);
}

window.addEventListener('mousemove', (e) => {
  dotX = e.clientX;
  dotY = e.clientY;
  cursorDot.style.transform = `translate(calc(${dotX}px - 50%), calc(${dotY}px - 50%))`;
});

document.addEventListener('mouseenter', () => {
  cursorDot.classList.remove('hidden');
  cursorRing.classList.remove('hidden');
});
document.addEventListener('mouseleave', () => {
  cursorDot.classList.add('hidden');
  cursorRing.classList.add('hidden');
});

document.addEventListener('mousedown', () => cursorDot.classList.add('clicking'));
document.addEventListener('mouseup',   () => cursorDot.classList.remove('clicking'));

// Expand ring on interactive elements
const hoverTargets = 'a, button, .about-card, .event-card, .topic-tag, .social-btn, .nav-cta';
document.querySelectorAll(hoverTargets).forEach(el => {
  el.addEventListener('mouseenter', () => cursorRing.classList.add('hovering'));
  el.addEventListener('mouseleave', () => cursorRing.classList.remove('hovering'));
});

cursorDot.classList.add('hidden');
cursorRing.classList.add('hidden');
animateCursor();

// ── TEXT SCRAMBLE ──
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&';

function scramble(el, finalText, duration = 1200, delay = 0) {
  const total = finalText.length;
  const startTime = performance.now() + delay;

  function tick(now) {
    const elapsed = Math.max(0, now - startTime);
    const progress = Math.min(elapsed / duration, 1);
    const revealed = Math.floor(progress * total);

    let result = '';
    for (let i = 0; i < total; i++) {
      if (finalText[i] === ' ' || finalText[i] === '\n') {
        result += finalText[i];
      } else if (i < revealed) {
        result += finalText[i];
      } else {
        result += CHARS[Math.floor(Math.random() * CHARS.length)];
      }
    }
    el.textContent = result;

    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = finalText;
  }

  requestAnimationFrame(tick);
}

window.addEventListener('load', () => {
  const h1 = document.querySelector('#hero h1');
  if (!h1) return;

  // Scramble the plain text node ("La comunidad")
  const textNode = h1.firstChild;
  const original = textNode.textContent.trim();
  textNode.textContent = original;
  scramble(textNode, original, 1000, 300);

  // Scramble the gradient span ("dev de Villa.")
  const span = h1.querySelector('.gradient-text');
  if (span) {
    const spanText = span.textContent;
    scramble(span, spanText, 900, 600);
  }
});

// ── SCROLL REVEAL ──
const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, entry.target.dataset.delay || 0);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

reveals.forEach((el, i) => {
  el.dataset.delay = (i % 4) * 90;
  revealObserver.observe(el);
});

// ── COUNTER ANIMATION ──
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  if (isNaN(target)) return;
  const duration = 1600;
  const start = performance.now();

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    el.textContent = Math.floor(eased * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }

  requestAnimationFrame(step);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('[data-target]').forEach(animateCounter);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.stats-grid').forEach(el => counterObserver.observe(el));

// ── SCROLL PROGRESS BAR ──
const progressBar = document.getElementById('progress-bar');

window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = pct + '%';
}, { passive: true });

// ── NAV ACTIVE HIGHLIGHT ON SCROLL ──
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 100) current = sec.id;
  });
  navLinks.forEach(a => {
    a.style.color = a.getAttribute('href') === `#${current}` ? '#f5f5f7' : '';
  });
}, { passive: true });

// ── HAMBURGER MENU ──
const hamburger   = document.getElementById('hamburger');
const mobileMenu  = document.getElementById('mobile-menu');
const mobileOverlay = document.getElementById('mobile-overlay');

function openMenu() {
  hamburger.classList.add('open');
  mobileMenu.classList.add('open');
  mobileOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  hamburger.classList.remove('open');
  mobileMenu.classList.remove('open');
  mobileOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', () => {
  hamburger.classList.contains('open') ? closeMenu() : openMenu();
});

mobileOverlay.addEventListener('click', closeMenu);

mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', closeMenu);
});

// ── COUNTDOWN TO NEXT THURSDAY 7PM CST ──
function getNextEventDate() {
  // CST = UTC-6 · Find next Thursday at 19:00 CST
  const now = new Date();
  const cstNow = new Date(now.getTime() - 6 * 3600 * 1000); // shift to CST

  const day = cstNow.getUTCDay(); // 0=Sun … 4=Thu
  let daysAhead = (4 - day + 7) % 7;

  // If today IS Thursday but it's already past 7PM CST, push to next week
  if (daysAhead === 0 && (cstNow.getUTCHours() > 19 || (cstNow.getUTCHours() === 19 && cstNow.getUTCMinutes() >= 0))) {
    daysAhead = 7;
  }
  // If it hasn't started yet (exactly 0 days, before 7PM) keep daysAhead = 0
  if (daysAhead === 0 && cstNow.getUTCHours() < 19) {
    daysAhead = 0;
  }

  const target = new Date(cstNow);
  target.setUTCDate(target.getUTCDate() + daysAhead);
  target.setUTCHours(19, 0, 0, 0); // 7PM in CST space

  // Convert back to real UTC for comparison with Date.now()
  return new Date(target.getTime() + 6 * 3600 * 1000);
}

function updateCountdown() {
  const now  = new Date();
  const diff = getNextEventDate() - now;

  if (diff <= 0) {
    document.getElementById('cd-days').textContent  = '00';
    document.getElementById('cd-hours').textContent = '00';
    document.getElementById('cd-mins').textContent  = '00';
    document.getElementById('cd-secs').textContent  = '00';
    return;
  }

  const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs  = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById('cd-days').textContent  = String(days).padStart(2, '0');
  document.getElementById('cd-hours').textContent = String(hours).padStart(2, '0');
  document.getElementById('cd-mins').textContent  = String(mins).padStart(2, '0');
  document.getElementById('cd-secs').textContent  = String(secs).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);

// ── HERO CURSOR SPOTLIGHT ──
const hero = document.getElementById('hero');
const spotlight = document.createElement('div');
spotlight.className = 'hero-spotlight';
hero.appendChild(spotlight);

hero.addEventListener('mousemove', (e) => {
  const rect = hero.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  spotlight.style.background =
    `radial-gradient(650px circle at ${x}px ${y}px, rgba(123,111,255,0.09), transparent 55%)`;
});

hero.addEventListener('mouseleave', () => {
  spotlight.style.background = '';
});

// ── 3D CARD TILT ──
document.querySelectorAll('.about-card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    card.style.transition = 'transform 0.12s ease, border-color 0.3s, box-shadow 0.3s';
  });

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -7;
    const rotateY = ((x - cx) / cx) *  7;
    card.style.transform =
      `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transition = 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.3s, box-shadow 0.3s';
    card.style.transform = '';
    setTimeout(() => { card.style.transition = ''; }, 600);
  });
});

// ── MAGNETIC BUTTON ──
document.querySelectorAll('.btn-primary').forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    btn.style.transition = 'transform 0.15s ease, box-shadow 0.2s';
  });

  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width  / 2;
    const y = e.clientY - rect.top  - rect.height / 2;
    btn.style.transform = `translate(${x * 0.2}px, ${y * 0.3}px) scale(1.04)`;
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.transition = 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s';
    btn.style.transform = '';
    setTimeout(() => { btn.style.transition = ''; }, 500);
  });
});

// ── STAGGERED TOPIC TAGS ──
const tagsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const tags = entry.target.querySelectorAll('.topic-tag');
      tags.forEach((tag, i) => {
        tag.style.opacity = '0';
        tag.style.transform = 'translateY(16px) scale(0.95)';
        tag.style.transition = 'none';
        setTimeout(() => {
          tag.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
          tag.style.opacity = '1';
          tag.style.transform = '';
        }, i * 55);
      });
      tagsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('.topics-cloud').forEach(el => tagsObserver.observe(el));
