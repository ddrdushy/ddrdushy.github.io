/* ====================================================
   DUSHYANTH RAMALINGAM — "OBSIDIAN COMMAND"
   Interaction engine
   ==================================================== */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var hasGsap = typeof window.gsap !== 'undefined';

  if (hasGsap && typeof window.ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ---------- Smooth scroll (Lenis + GSAP ticker) ---------- */
  var lenis = null;
  if (!reducedMotion && typeof window.Lenis !== 'undefined' && hasGsap) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on('scroll', function () {
      if (window.ScrollTrigger) ScrollTrigger.update();
    });
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length > 1) {
          var target = document.querySelector(id);
          if (target) {
            e.preventDefault();
            lenis.scrollTo(target, { offset: -20 });
          }
        }
      });
    });
  }

  /* ---------- Text splitting ---------- */
  function splitChars(el) {
    var text = el.textContent;
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '';
    text.split('').forEach(function (ch) {
      var span = document.createElement('span');
      span.className = 'char';
      span.innerHTML = ch === ' ' ? '&nbsp;' : ch;
      el.appendChild(span);
    });
    return el.querySelectorAll('.char');
  }

  function splitWords(el) {
    var text = el.textContent;
    el.setAttribute('aria-label', text);
    el.innerHTML = '';
    text.split(' ').forEach(function (word, i) {
      var outer = document.createElement('span');
      outer.className = 'w';
      outer.setAttribute('aria-hidden', 'true');
      var inner = document.createElement('span');
      inner.textContent = word;
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < text.split(' ').length - 1) el.appendChild(document.createTextNode(' '));
    });
    return el.querySelectorAll('.w > span');
  }

  document.querySelectorAll('[data-split]').forEach(function (el) { splitChars(el); });
  document.querySelectorAll('[data-split-words]').forEach(function (el) { splitWords(el); });

  // Contact title is decorative-split; give it a readable label
  var contactTitle = document.querySelector('.contact-title');
  if (contactTitle) contactTitle.setAttribute('aria-label', "Let's build the future of work.");

  /* ---------- Preloader ---------- */
  var preloader = document.getElementById('preloader');
  var countEl = document.getElementById('preloader-count');
  var barFill = document.getElementById('preloader-bar-fill');
  var logEl = document.getElementById('preloader-log');
  var heroPlayed = false;

  function playHeroIntro() {
    if (heroPlayed) return;
    heroPlayed = true;
    if (!hasGsap || reducedMotion) return;

    var chars = document.querySelectorAll('.hero-name .char');
    var tl = gsap.timeline();
    if (chars.length) {
      tl.from(chars, {
        yPercent: 115,
        duration: 1,
        ease: 'power4.out',
        stagger: 0.028
      });
    }
    tl.from('.hero .reveal-up', {
      y: 36,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.1
    }, '-=0.55');
  }

  function dismissPreloader() {
    if (!preloader || preloader.classList.contains('done')) return;
    preloader.classList.add('done');
    document.body.style.overflow = '';
    setTimeout(playHeroIntro, 250);
    setTimeout(function () { preloader.remove(); }, 1100);
  }

  var seenIntro = false;
  try { seenIntro = sessionStorage.getItem('dr_intro') === '1'; } catch (e) {}

  if (preloader && countEl && !reducedMotion && !seenIntro) {
    try { sessionStorage.setItem('dr_intro', '1'); } catch (e) {}
    document.body.style.overflow = 'hidden';
    var logLines = [
      '> loading models ............ ok',
      '> mounting experience(15y) .. ok',
      '> agents online ✓'
    ];
    var logIndex = 0;
    var logTimer = setInterval(function () {
      if (logIndex >= logLines.length) { clearInterval(logTimer); return; }
      var line = document.createElement('span');
      line.className = 'log-line' + (logIndex === logLines.length - 1 ? ' volt' : '');
      line.textContent = logLines[logIndex++];
      logEl.appendChild(line);
    }, 360);

    var start = null;
    var DURATION = 1700;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / DURATION, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = Math.round(eased * 100);
      countEl.textContent = (val < 10 ? '0' : '') + val;
      if (barFill) barFill.style.transform = 'scaleX(' + eased + ')';
      if (p < 1) requestAnimationFrame(tick);
      else setTimeout(dismissPreloader, 220);
    }
    requestAnimationFrame(tick);
    // Safety: never trap the user
    setTimeout(dismissPreloader, 4000);
  } else {
    if (preloader) preloader.remove();
    playHeroIntro();
  }

  /* ---------- Custom cursor ---------- */
  if (finePointer && !reducedMotion) {
    var dot = document.getElementById('cursor-dot');
    var ring = document.getElementById('cursor-ring');
    if (dot && ring) {
      document.body.classList.add('has-cursor');
      var mx = -100, my = -100, rx = -100, ry = -100;
      window.addEventListener('mousemove', function (e) {
        mx = e.clientX; my = e.clientY;
        dot.style.transform = 'translate(' + (mx - 3) + 'px,' + (my - 3) + 'px)';
      }, { passive: true });
      (function ringLoop() {
        rx += (mx - rx) * 0.16;
        ry += (my - ry) * 0.16;
        ring.style.transform = 'translate(' + (rx - 18) + 'px,' + (ry - 18) + 'px)';
        requestAnimationFrame(ringLoop);
      })();
      document.querySelectorAll('a, button, .p-card, .talk-card').forEach(function (el) {
        el.addEventListener('mouseenter', function () { ring.classList.add('is-hover'); });
        el.addEventListener('mouseleave', function () { ring.classList.remove('is-hover'); });
      });
    }
  }

  /* ---------- Magnetic elements ---------- */
  if (finePointer && !reducedMotion && hasGsap) {
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      var strength = 22;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        gsap.to(el, {
          x: (x / r.width) * strength,
          y: (y / r.height) * strength,
          duration: 0.4,
          ease: 'power3.out'
        });
      });
      el.addEventListener('mouseleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  /* ---------- Hero neural canvas ---------- */
  (function () {
    var canvas = document.getElementById('hero-canvas');
    var hero = document.getElementById('hero');
    if (!canvas || !hero || reducedMotion) return;

    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w, h, particles = [];
    var mouse = { x: -9999, y: -9999 };
    var CONNECT = 130;
    var REPEL = 160;
    var running = true;

    function resize() {
      w = hero.offsetWidth;
      h = hero.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      var count = Math.min(110, Math.floor((w * h) / 16000));
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          r: Math.random() * 1.8 + 0.7
        });
      }
    }

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var dx = p.x - mouse.x, dy = p.y - mouse.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL && dist > 0.01) {
          var f = (REPEL - dist) / REPEL;
          p.vx += (dx / dist) * f * 0.6;
          p.vy += (dy / dist) * f * 0.6;
        }
        p.vx *= 0.975; p.vy *= 0.975;
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(237, 237, 230, 0.45)';
        ctx.fill();

        for (var j = i + 1; j < particles.length; j++) {
          var q = particles[j];
          var ddx = p.x - q.x, ddy = p.y - q.y;
          var d = Math.sqrt(ddx * ddx + ddy * ddy);
          if (d < CONNECT) {
            var a = (1 - d / CONNECT);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = 'rgba(212, 255, 63, ' + (a * 0.16) + ')';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(frame);
    }

    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    }, { passive: true });
    hero.addEventListener('mouseleave', function () {
      mouse.x = -9999; mouse.y = -9999;
    });

    // Pause when hero off-screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var visible = entries[0].isIntersecting;
        if (visible && !running) { running = true; frame(); }
        else if (!visible) { running = false; }
      }).observe(hero);
    }

    window.addEventListener('resize', resize);
    resize();
    frame();
  })();

  /* ---------- Typed roles ---------- */
  (function () {
    var el = document.getElementById('typed-role');
    if (!el) return;
    var roles = [
      'OmniFDE Consultant',
      'Practice Head — AI & Hyperautomation',
      'Agentic AI Systems Architect',
      'Gen AI Engineer',
      'Founder @AiSensei'
    ];
    if (reducedMotion) { el.textContent = roles[0]; return; }
    var ri = 0, ci = roles[0].length, deleting = true, delay = 2200;
    function step() {
      var word = roles[ri];
      if (deleting) {
        ci--;
        el.textContent = word.slice(0, ci);
        if (ci === 0) {
          deleting = false;
          ri = (ri + 1) % roles.length;
          delay = 350;
        } else delay = 32;
      } else {
        var next = roles[ri];
        ci++;
        el.textContent = next.slice(0, ci);
        if (ci === next.length) { deleting = true; delay = 2400; }
        else delay = 58;
      }
      setTimeout(step, delay);
    }
    setTimeout(step, delay);
  })();

  /* ---------- Navbar behaviour ---------- */
  var navbar = document.getElementById('navbar');
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    navbar.classList.toggle('scrolled', y > 40);
    if (y > lastY && y > 300 && !document.getElementById('nav-menu').classList.contains('open')) {
      navbar.classList.add('nav-hidden');
    } else {
      navbar.classList.remove('nav-hidden');
    }
    lastY = y;

    // Active section
    document.querySelectorAll('main section[id]').forEach(function (sec) {
      var top = sec.offsetTop - 140;
      var bottom = top + sec.offsetHeight;
      var link = document.querySelector('.nav-link[href="#' + sec.id + '"]');
      if (link) link.classList.toggle('active', y >= top && y < bottom);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var navToggle = document.getElementById('nav-toggle');
  var navMenu = document.getElementById('nav-menu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      var open = navMenu.classList.toggle('open');
      navToggle.classList.toggle('active', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (lenis) { open ? lenis.stop() : lenis.start(); }
      document.body.style.overflow = open ? 'hidden' : '';
    });
    navMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navMenu.classList.remove('open');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        if (lenis) lenis.start();
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- Experience tabs ---------- */
  document.querySelectorAll('.exp-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.exp-tab').forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      var target = tab.dataset.tab;
      document.getElementById('tab-work').classList.toggle('hidden', target !== 'work');
      document.getElementById('tab-education').classList.toggle('hidden', target !== 'education');
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });

  /* ---------- Project filters ---------- */
  document.querySelectorAll('.filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var filter = btn.dataset.filter;
      document.querySelectorAll('#projects-grid .p-card').forEach(function (card) {
        var show = filter === 'all' || card.dataset.category === filter;
        card.style.display = show ? '' : 'none';
        if (show && hasGsap && !reducedMotion) {
          gsap.fromTo(card, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out' });
        }
      });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });

  /* ---------- Stats count-up ---------- */
  (function () {
    var counters = document.querySelectorAll('.count');
    if (!counters.length) return;
    function animate(el) {
      var target = parseInt(el.dataset.count, 10);
      if (reducedMotion) { el.textContent = target; return; }
      var start = null;
      var DUR = 1600;
      function tick(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / DUR, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animate(entry.target);
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });
      counters.forEach(function (c) { io.observe(c); });
    } else {
      counters.forEach(animate);
    }
  })();

  /* ---------- Skill card glow follows mouse ---------- */
  if (finePointer) {
    document.querySelectorAll('.skill-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }, { passive: true });
    });
  }

  /* ---------- Card tilt ---------- */
  if (finePointer && !reducedMotion) {
    document.querySelectorAll('[data-tilt]').forEach(function (card) {
      var MAX = 5;
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          'perspective(800px) rotateX(' + (-py * MAX) + 'deg) rotateY(' + (px * MAX) + 'deg) translateY(-4px)';
      }, { passive: true });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* ---------- Talk video facades ---------- */
  document.querySelectorAll('.talk-card').forEach(function (card) {
    card.addEventListener('click', function () {
      if (card.querySelector('iframe')) return;
      var id = card.dataset.video;
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      iframe.title = 'YouTube video player';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      card.appendChild(iframe);
    });
  });

  /* ---------- Scroll reveals & timeline fill (GSAP) ---------- */
  if (hasGsap && window.ScrollTrigger && !reducedMotion) {
    // Section titles: word slide-up
    document.querySelectorAll('[data-split-words]').forEach(function (title) {
      var words = title.querySelectorAll('.w > span');
      if (!words.length) return;
      gsap.from(words, {
        yPercent: 110,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.07,
        scrollTrigger: { trigger: title, start: 'top 88%' }
      });
    });

    // Contact giant title chars
    var contactChars = document.querySelectorAll('.contact-title .char');
    if (contactChars.length) {
      gsap.from(contactChars, {
        yPercent: 115,
        duration: 0.9,
        ease: 'power4.out',
        stagger: 0.018,
        scrollTrigger: { trigger: '.contact-title', start: 'top 85%' }
      });
    }

    // Generic reveals (outside hero — hero handled post-preloader)
    gsap.utils.toArray('.reveal-up').forEach(function (el) {
      if (el.closest('.hero')) return;
      gsap.from(el, {
        y: 44,
        opacity: 0,
        duration: 0.95,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    // Timeline progress line
    var fill = document.getElementById('timeline-fill');
    var work = document.getElementById('tab-work');
    if (fill && work) {
      gsap.to(fill, {
        height: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: work,
          start: 'top 70%',
          end: 'bottom 60%',
          scrub: 0.4
        }
      });
    }

    // Hero name subtle parallax out
    gsap.to('.hero-inner', {
      yPercent: -8,
      opacity: 0.4,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });
  } else if (!hasGsap && 'IntersectionObserver' in window && !reducedMotion) {
    // Fallback: simple fade-ins without GSAP
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'none';
          io2.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal-up').forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(40px)';
      io2.observe(el);
    });
  }

})();
