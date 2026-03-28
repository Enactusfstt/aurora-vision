/**
 * Aurora Vision — script.js
 * Handles: Particle canvas, scroll reveal, nav scroll behavior,
 *          mobile menu, lightbox, year auto-update.
 */

/* ── 1. AUTO-YEAR IN FOOTER ─────────────────────────────────── */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ── 2. NAV — SCROLL BEHAVIOR ────────────────────────────────── */
const nav = document.getElementById('nav');

const onNavScroll = () => {
  if (window.scrollY > 60) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
};

window.addEventListener('scroll', onNavScroll, { passive: true });
onNavScroll(); // run on load

/* ── 3. MOBILE MENU ──────────────────────────────────────────── */
const hamburger   = document.getElementById('hamburger');
const mobileMenu  = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
  mobileMenu.setAttribute('aria-hidden', !isOpen);
});

// Close mobile menu when any mobile link is clicked
mobileMenu.querySelectorAll('.nav__mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
  });
});

/* ── 4. SCROLL REVEAL (IntersectionObserver) ─────────────────── */
/**
 * Watches all .reveal elements and adds .visible when they
 * enter the viewport, triggering the CSS fade-up transition.
 * Stagger delays are applied to sibling .reveal elements
 * within the same grid/flex parent.
 */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Stop observing once visible (animation plays once)
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

// Add stagger delays to sibling reveal groups
document.querySelectorAll('.features__grid, .statsbar__inner, .how__steps, .problem__grid, .solution__grid, .gallery__grid').forEach(parent => {
  const revealChildren = Array.from(parent.querySelectorAll(':scope > .reveal'));
  revealChildren.forEach((child, i) => {
    child.dataset.delay = Math.min(i + 1, 4);
  });
});

// Observe all reveal elements
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ── 5. PARTICLE CANVAS (Hero background) ────────────────────── */
/**
 * Renders a field of gently drifting particles on a <canvas>.
 * Very lightweight — no external library needed.
 */
(function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles;

  // Respect reduced-motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    canvas.style.display = 'none';
    return;
  }

  /** Resize canvas to fill hero section */
  const resize = () => {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  };

  /** Create a single particle with random properties */
  const createParticle = () => ({
    x:     Math.random() * W,
    y:     Math.random() * H,
    r:     Math.random() * 1.8 + 0.4,       // radius 0.4–2.2
    vx:    (Math.random() - 0.5) * 0.3,     // horizontal drift
    vy:    (Math.random() - 0.5) * 0.3,     // vertical drift
    alpha: Math.random() * 0.6 + 0.1,       // base opacity
    pulse: Math.random() * Math.PI * 2,     // phase offset for pulsing
    color: Math.random() > 0.5 ? '123,97,255' : '0,212,255', // purple or cyan
  });

  /** Initialise the particle array */
  const initParticleArray = () => {
    const count = Math.min(Math.floor((W * H) / 12000), 120);
    particles = Array.from({ length: count }, createParticle);
  };

  /** Draw one frame */
  const draw = (timestamp) => {
    ctx.clearRect(0, 0, W, H);

    particles.forEach(p => {
      // Move
      p.x += p.vx;
      p.y += p.vy;
      p.pulse += 0.012;

      // Wrap around edges
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;

      // Pulsing opacity
      const alpha = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));

      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${alpha.toFixed(2)})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  };

  // Init
  resize();
  initParticleArray();
  requestAnimationFrame(draw);

  // Re-init on resize (debounced)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      initParticleArray();
    }, 200);
  });
})();

/* ── 6. GALLERY LIGHTBOX ─────────────────────────────────────── */
/**
 * Opens a full-screen modal with the clicked gallery image.
 * Closes on backdrop click, close button, or Escape key.
 */
(function initLightbox() {
  const lightbox     = document.getElementById('lightbox');
  const lightboxImg  = document.getElementById('lightboxImg');
  const lightboxCap  = document.getElementById('lightboxCaption');
  const backdrop     = document.getElementById('lightboxBackdrop');
  const closeBtn     = document.getElementById('lightboxClose');
  if (!lightbox) return;

  const openLightbox = (src, alt, caption, fallback) => {
    lightboxImg.src = src;
    lightboxImg.alt = alt || caption;
    lightboxCap.textContent = caption || '';
    // Fallback if image fails to load
    lightboxImg.onerror = () => {
      if (fallback) lightboxImg.src = fallback;
    };
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  };

  const closeLightbox = () => {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  // Attach click listeners to gallery items
  document.querySelectorAll('.gallery__item').forEach(item => {
    item.addEventListener('click', () => {
      const img      = item.querySelector('img');
      const src      = item.dataset.src || img?.src;
      const alt      = img?.alt || '';
      const caption  = item.dataset.caption || '';
      const fallback = item.dataset.fallback || '';
      openLightbox(src, alt, caption, fallback);
    });
    // Keyboard support
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
    });
  });

  backdrop.addEventListener('click', closeLightbox);
  closeBtn.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) {
      closeLightbox();
    }
  });
})();

/* ── 7. SMOOTH ANCHOR SCROLL (accessibility enhancement) ────── */
/**
 * Intercepts clicks on all #hash anchor links and scrolls
 * smoothly, accounting for the fixed nav height as an offset.
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href').slice(1);
    const target   = document.getElementById(targetId);
    if (!target) return;
    e.preventDefault();
    const navHeight = nav.offsetHeight + 16; // 16px extra breathing room
    const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ── 8. ACTIVE NAV LINK HIGHLIGHTING ────────────────────────── */
/**
 * Highlights the nav link corresponding to the section
 * currently in view using IntersectionObserver.
 */
(function initActiveNav() {
  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav__links a');
  if (!sections.length || !navLinks.length) return;

  const activateLink = (id) => {
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === `#${id}`) {
        link.style.color = 'var(--text-primary)';
      } else {
        link.style.color = '';
      }
    });
  };

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) activateLink(entry.target.id);
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach(s => sectionObserver.observe(s));
})();
