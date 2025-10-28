// Motioncraft — Interactions & Effects
// - Background particles with subtle parallax
// - Smooth nav, mobile menu
// - Scroll reveals via IntersectionObserver
// - Video hover/tap play-pause
// - Support form submission to Google Apps Script endpoint

(function () {
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  // Year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const isOpen = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
    links.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      })
    );
  }

  // Smooth scroll offset for fixed header
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href.length <= 1) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const headerH = document.querySelector('.site-header')?.clientHeight || 64;
      const y = target.getBoundingClientRect().top + window.scrollY - (headerH + 10);
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });

  // Intersection Observer for reveal animations
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // Background particles with parallax
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const particles = [];
  const NUM = 80; // modest amount for perf

  let mouseX = 0, mouseY = 0;
  let w = 0, h = 0;

  function resize() {
    if (!canvas || !ctx) return;
    w = canvas.clientWidth = window.innerWidth;
    h = canvas.clientHeight = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function initParticles() {
    particles.length = 0;
    for (let i = 0; i < NUM; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        r: Math.random() * 2 + 0.5,
        hue: Math.random() < 0.5 ? 175 : 270,
        alpha: Math.random() * 0.6 + 0.2,
      });
    }
  }

  function step() {
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, w, h);
    // parallax offset
    const px = (mouseX / w - 0.5) * 10;
    const py = (mouseY / h - 0.5) * 10;
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10; if (p.y > h + 10) p.y = -10;
      ctx.beginPath();
      ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${p.alpha})`;
      ctx.shadowColor = `hsla(${p.hue}, 90%, 60%, ${p.alpha * 0.8})`;
      ctx.shadowBlur = 8;
      ctx.arc(p.x + px, p.y + py, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(step);
  }

  if (canvas && ctx) {
    resize();
    initParticles();
    requestAnimationFrame(step);
    window.addEventListener('resize', () => { resize(); initParticles(); });
    window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) { mouseX = e.touches[0].clientX; mouseY = e.touches[0].clientY; }
    }, { passive: true });
  }

  // Showcase: video hover/tap controls
  document.querySelectorAll('.media--video').forEach((wrap) => {
    const video = wrap.querySelector('video');
    const toggleBtn = wrap.querySelector('.video-toggle');
    if (!video || !toggleBtn) return;

    const play = () => { video.play().catch(() => {}); toggleBtn.textContent = '⏸'; };
    const pause = () => { video.pause(); toggleBtn.textContent = '▶'; };

    wrap.addEventListener('mouseenter', play);
    wrap.addEventListener('mouseleave', pause);
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (video.paused) play(); else pause();
    });
  });

  // Open project in new window
  window.openProject = function(url) {
    // Create a new window with the project URL
    const newWindow = window.open(url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    
    // Focus the new window
    if (newWindow) {
      newWindow.focus();
    } else {
      // Fallback if popup is blocked
      alert('Popup blocked! Please allow popups for this site to view projects in a separate window.');
    }
  };

  // Support Form submission → Google Apps Script
  // Replace GAS_ENDPOINT with your deployed web app URL.
  // How to update:
  // 1) In Google Apps Script, deploy a Web app and copy its URL.
  // 2) Set GAS_ENDPOINT below to that URL. Example: const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbx.../exec'
  // 3) The payload fields (name, email, message) must match your doPost handler.
  const GAS_ENDPOINT = 'https://formspree.io/f/xeopjdew'; // Replace with your actual Google Apps Script URL

  const form = document.getElementById('support-form');
  const statusEl = document.getElementById('form-status');
  const submitBtn = document.getElementById('submitBtn');

  function setStatus(message, ok = true) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.color = ok ? 'var(--primary)' : 'var(--danger)';
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
      setStatus('Sending…');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

      const fd = new FormData(form);
      const payload = {
        name: String(fd.get('name') || '').trim(),
        email: String(fd.get('email') || '').trim(),
        message: String(fd.get('message') || '').trim(),
      };

      // Basic client validation
      if (!payload.name || !payload.email || !payload.message) {
        setStatus('Please fill out all fields.', false);
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send Message'; }
        return;
      }

      try {
        const res = await fetch(GAS_ENDPOINT, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({ ok: false }));
        if (res.ok && data.ok) {
          setStatus('Thanks! We will be in touch shortly.');
          form.reset();
        } else {
          throw new Error('Submission failed');
        }
      } catch (err) {
        console.error(err);
        setStatus('There was a problem sending your message. Please try again.', false);
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send Message'; }
      }
    });
  }
})();
