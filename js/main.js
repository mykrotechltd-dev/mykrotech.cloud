/**
 * MYKROTECH ETHERWORX — main.js
 * Handles: particle background, navigation, scroll-reveal, stats counter,
 *          portfolio filter + modal, contact form validation, back-to-top.
 *
 * No external dependencies — vanilla JS only.
 */

(function () {
  'use strict';

  /* ============================================================
     UTILITY HELPERS
     ============================================================ */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     1. PARTICLE BACKGROUND (Canvas)
     Lightweight network of drifting dots connected by lines.
     ============================================================ */
  function initParticles() {
    const canvas = $('#particles-canvas');
    if (!canvas || prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;
    let W, H;

    function resize() {
      const section = $('#home');
      W = canvas.width  = section ? section.offsetWidth  : window.innerWidth;
      H = canvas.height = section ? section.offsetHeight : window.innerHeight;
    }

    function createParticles() {
      particles = [];
      const count = Math.min(90, Math.floor((W * H) / 14000));
      for (let i = 0; i < count; i++) {
        particles.push({
          x:       Math.random() * W,
          y:       Math.random() * H,
          vx:      (Math.random() - 0.5) * 0.45,
          vy:      (Math.random() - 0.5) * 0.45,
          size:    Math.random() * 1.8 + 0.4,
          opacity: Math.random() * 0.45 + 0.15,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      /* Draw connecting lines first (below dots) */
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx   = particles[i].x - particles[j].x;
          const dy   = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 212, 255, ${0.18 * (1 - dist / 130)})`;
            ctx.lineWidth   = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      /* Draw dots */
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${p.opacity})`;
        ctx.fill();
      }
    }

    function update() {
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      }
    }

    function loop() {
      update();
      draw();
      animationId = requestAnimationFrame(loop);
    }

    /* Pause particles when the hero is not visible (performance) */
    const heroObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!animationId) animationId = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    }, { threshold: 0 });

    const hero = $('#home');
    if (hero) heroObserver.observe(hero);

    resize();
    createParticles();
    animationId = requestAnimationFrame(loop);

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        createParticles();
      }, 200);
    });
  }

  /* ============================================================
     2. NAVIGATION
     Sticky behavior, active links, mobile hamburger.
     ============================================================ */
  function initNav() {
    const navbar    = $('#navbar');
    const hamburger = $('.hamburger');
    const mobileMenu = $('.mobile-menu');
    if (!navbar) return;

    /* Sticky class on scroll */
    let lastScroll = 0;
    function onScroll() {
      const y = window.scrollY;
      if (y > 40) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
      lastScroll = y;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Mobile hamburger toggle */
    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.toggle('open');
        hamburger.classList.toggle('open', isOpen);
        hamburger.setAttribute('aria-expanded', isOpen);
        document.body.classList.toggle('menu-open', isOpen);
      });

      /* Close mobile menu when a link is clicked */
      $$('a', mobileMenu).forEach(link => {
        link.addEventListener('click', () => {
          mobileMenu.classList.remove('open');
          hamburger.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
          document.body.classList.remove('menu-open');
        });
      });
    }

    /* Smooth scroll for all anchor links */
    $$('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', e => {
        const id = anchor.getAttribute('href');
        if (id === '#') return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        const offset = navbar.offsetHeight + 16;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });

    /* Active nav link highlight via IntersectionObserver */
    const sections   = $$('section[id]');
    const navLinks   = $$('.nav-links a[href^="#"], .mobile-menu a[href^="#"]');

    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    sections.forEach(s => sectionObserver.observe(s));
  }

  /* ============================================================
     3. SCROLL REVEAL
     Fades elements in as they enter the viewport.
     ============================================================ */
  function initScrollReveal() {
    if (prefersReducedMotion) return;

    /* Add data-reveal to all major block elements that don't have it */
    const autoTargets = [
      '.section-header',
      '.service-card',
      '.value-card',
      '.team-card',
      '.portfolio-card',
      '.blog-card',
      '.blog-card-large',
      '.info-card',
      '.mv-card',
      '.about-text',
      '.mission-vision',
    ];

    autoTargets.forEach(sel => {
      $$(sel).forEach((el, i) => {
        if (!el.hasAttribute('data-reveal')) {
          el.setAttribute('data-reveal', '');
          /* Stagger delay for siblings in a grid */
          const delay = Math.min(i % 6, 5) + 1;
          if (i % 6 !== 0) el.setAttribute('data-delay', delay);
        }
      });
    });

    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    $$('[data-reveal]').forEach(el => revealObserver.observe(el));
  }

  /* ============================================================
     4. STATS COUNTER
     Animates numbers in the hero stats strip when they come into view.
     ============================================================ */
  function initStatsCounter() {
    if (prefersReducedMotion) return;

    const stats = $$('.stat-number[data-target]');
    if (!stats.length) return;

    function animateCounter(el) {
      const target   = parseFloat(el.getAttribute('data-target'));
      const suffix   = el.getAttribute('data-suffix') || '';
      const isFloat  = el.getAttribute('data-float') === 'true';
      const duration = 2000;
      const start    = performance.now();

      function step(now) {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / duration, 1);
        /* Ease out cubic */
        const eased  = 1 - Math.pow(1 - progress, 3);
        const current = target * eased;
        el.textContent = (isFloat ? current.toFixed(1) : Math.floor(current)) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    }

    const statsObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    stats.forEach(el => statsObserver.observe(el));
  }

  /* ============================================================
     5. PORTFOLIO FILTER
     Show/hide project cards based on selected category.
     ============================================================ */
  function initPortfolioFilter() {
    const filterBtns = $$('.filter-btn');
    const cards      = $$('.portfolio-card');
    if (!filterBtns.length || !cards.length) return;

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');

        cards.forEach((card, i) => {
          const category = card.getAttribute('data-category');
          const show = filter === 'all' || category === filter;

          if (show) {
            card.classList.remove('hidden');
            card.style.transitionDelay = `${(i % 9) * 0.04}s`;
          } else {
            card.classList.add('hidden');
            card.style.transitionDelay = '0s';
          }
        });
      });
    });
  }

  /* ============================================================
     6. PORTFOLIO MODAL
     Opens a detail modal on card click.
     ============================================================ */
  function initPortfolioModal() {
    const overlay  = $('#portfolio-modal');
    if (!overlay)  return;

    const content  = $('.modal-content', overlay);
    const closeBtn = $('.modal-close', overlay);

    function openModal(data) {
      /* Populate modal with card data */
      const thumb = $('.modal-thumb', overlay);
      if (thumb) {
        thumb.className  = `modal-thumb ${data.thumbClass || ''}`;
        const icon = $('.modal-thumb-icon', thumb);
        if (icon) icon.textContent = data.icon || '💻';
      }

      const cat = $('.modal-category', overlay);
      if (cat) cat.textContent = data.category || '';

      const title = $('h2', overlay);
      if (title) title.textContent = data.title || '';

      const desc = $('.modal-desc', overlay);
      if (desc) desc.textContent = data.description || '';

      const tags = $('.modal-tags', overlay);
      if (tags) {
        tags.innerHTML = '';
        (data.stack || []).forEach(tag => {
          const span = document.createElement('span');
          span.className = 'modal-tag';
          span.textContent = tag;
          tags.appendChild(span);
        });
      }

      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      overlay.setAttribute('aria-hidden', 'false');
      if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      overlay.setAttribute('aria-hidden', 'true');
    }

    /* Bind portfolio cards */
    $$('.portfolio-card').forEach(card => {
      card.addEventListener('click', () => {
        const data = {
          thumbClass:  card.getAttribute('data-thumb-class'),
          icon:        card.getAttribute('data-icon'),
          category:    card.getAttribute('data-modal-category'),
          title:       card.getAttribute('data-modal-title'),
          description: card.getAttribute('data-modal-desc'),
          stack:       JSON.parse(card.getAttribute('data-stack') || '[]'),
        };
        openModal(data);
      });

      /* Keyboard activation */
      card.setAttribute('tabindex', '0');
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });

    /* Close handlers */
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) {
        closeModal();
      }
    });

    /* Trap focus within modal */
    overlay.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const focusable = $$('button, a, input, [tabindex="0"]', overlay)
        .filter(el => !el.disabled && el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ============================================================
     7. CONTACT FORM
     Client-side validation with neon error/success states.
     ============================================================ */
  function initContactForm() {
    const form    = $('#contact-form');
    if (!form) return;

    const successMsg = form.nextElementSibling;

    const validators = {
      required: (v) => v.trim() !== '' || 'This field is required.',
      email:    (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Please enter a valid email address.',
      phone:    (v) => v.trim() === '' || /^[\+]?[\d\s\-\(\)]{7,20}$/.test(v.trim()) || 'Please enter a valid phone number.',
    };

    function getFieldRules(field) {
      const rules = [];
      if (field.required || field.hasAttribute('required')) rules.push('required');
      if (field.type === 'email')  rules.push('email');
      if (field.id === 'phone')    rules.push('phone');
      return rules;
    }

    function validateField(field) {
      const value = field.value;
      const rules = getFieldRules(field);
      const group = field.closest('.form-group');

      for (const rule of rules) {
        const result = validators[rule](value);
        if (result !== true) {
          group.classList.add('error');
          group.classList.remove('success');
          let errEl = group.querySelector('.field-error');
          if (!errEl) {
            errEl = document.createElement('span');
            errEl.className = 'field-error';
            errEl.setAttribute('role', 'alert');
            group.appendChild(errEl);
          }
          errEl.textContent = result;
          field.setAttribute('aria-invalid', 'true');
          return false;
        }
      }

      group.classList.remove('error');
      if (value.trim()) group.classList.add('success');
      const errEl = group.querySelector('.field-error');
      if (errEl) errEl.textContent = '';
      field.setAttribute('aria-invalid', 'false');
      return true;
    }

    /* Live validation on blur */
    $$('input, select, textarea', form).forEach(field => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        const group = field.closest('.form-group');
        if (group.classList.contains('error')) validateField(field);
      });
    });

    /* Submit handler */
    form.addEventListener('submit', e => {
      e.preventDefault();

      const fields   = $$('input, select, textarea', form);
      const allValid = fields.map(validateField).every(Boolean);
      if (!allValid) {
        /* Focus first invalid field */
        const firstError = form.querySelector('.form-group.error input, .form-group.error select, .form-group.error textarea');
        if (firstError) firstError.focus();
        return;
      }

      /* Show loading state */
      const submitBtn = form.querySelector('[type="submit"]');
      const originalHTML = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending…';
      submitBtn.classList.add('btn-loading');

      /* Simulate async form submission */
      setTimeout(() => {
        form.style.display = 'none';
        if (successMsg) {
          successMsg.classList.add('show');
        }
      }, 1400);
    });
  }

  /* ============================================================
     8. BACK TO TOP
     ============================================================ */
  function initBackToTop() {
    const btn = $('#back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 320);
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ============================================================
     9. TYPING ANIMATION — Hero tagline word cycling
     ============================================================ */
  function initTypingAnimation() {
    const el = $('#hero-typed');
    if (!el || prefersReducedMotion) return;

    const words  = ['Digitized.', 'Automated.', 'Unstoppable.', 'Transformed.'];
    let index    = 0;
    let charIndex = 0;
    let deleting  = false;

    function type() {
      const current = words[index];

      if (!deleting) {
        el.textContent = current.slice(0, ++charIndex);
        if (charIndex === current.length) {
          deleting = true;
          setTimeout(type, 2200);
          return;
        }
      } else {
        el.textContent = current.slice(0, --charIndex);
        if (charIndex === 0) {
          deleting = false;
          index = (index + 1) % words.length;
        }
      }

      setTimeout(type, deleting ? 50 : 90);
    }

    type();
  }

  /* ============================================================
     BOOT — run everything when DOM is ready
     ============================================================ */
  function boot() {
    initParticles();
    initNav();
    initScrollReveal();
    initStatsCounter();
    initPortfolioFilter();
    initPortfolioModal();
    initContactForm();
    initBackToTop();
    initTypingAnimation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
