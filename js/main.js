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
    lenis = new Lenis({ duration: 0.85, smoothWheel: true });
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
            // If the mobile menu is open, release scroll before navigating
            var menu = document.getElementById('nav-menu');
            if (menu && menu.classList.contains('open')) lenis.start();
            lenis.scrollTo(target, { offset: -20 });
            // Keep keyboard focus order in sync with the visual scroll
            target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
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

  // Play the boot intro at most once per half hour — repeat visitors and
  // mid-page refreshes go straight to content.
  var seenIntro = false;
  try {
    var seenAt = parseInt(localStorage.getItem('dr_intro_at') || '0', 10);
    seenIntro = Date.now() - seenAt < 30 * 60 * 1000;
  } catch (e) {}

  if (preloader && countEl && !reducedMotion && !seenIntro) {
    try { localStorage.setItem('dr_intro_at', String(Date.now())); } catch (e) {}
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
        dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%, -50%)';
      }, { passive: true });
      (function ringLoop() {
        rx += (mx - rx) * 0.16;
        ry += (my - ry) * 0.16;
        // -50% keeps the ring centred even when it grows on hover
        ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%, -50%)';
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

  /* ---------- Hero photo carousel ---------- */
  (function () {
    var wrap = document.getElementById('hero-carousel');
    if (!wrap) return;
    var imgs = wrap.querySelectorAll('img');
    if (!imgs.length) return;

    var dotsWrap = wrap.querySelector('.carousel-dots');
    var dots = [];
    if (dotsWrap) {
      imgs.forEach(function (_, i) {
        var d = document.createElement('span');
        d.className = 'dot' + (i === 0 ? ' on' : '');
        dotsWrap.appendChild(d);
        dots.push(d);
      });
    }

    if (reducedMotion || imgs.length < 2) return; // static first photo

    var idx = 0;
    var INTERVAL = 6800;
    var FADE_MS = 1700;
    var timer = null;

    function next() {
      var leaving = imgs[idx];
      leaving.classList.remove('is-active');
      // Keep the Ken Burns animation alive while the old slide dissolves,
      // then drop the class once it is fully transparent.
      leaving.classList.add('is-leaving');
      setTimeout(function () { leaving.classList.remove('is-leaving'); }, FADE_MS);
      if (dots[idx]) dots[idx].classList.remove('on');
      idx = (idx + 1) % imgs.length;
      imgs[idx].classList.add('is-active');
      if (dots[idx]) dots[idx].classList.add('on');
    }
    function start() { if (!timer) timer = setInterval(next, INTERVAL); }
    function stop() { clearInterval(timer); timer = null; }

    // Don't rotate while the tab or the hero is out of sight
    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : start();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }).observe(wrap);
    } else {
      start();
    }
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
  // Cache section/link pairs once — querying inside the scroll handler janks
  var navSections = [];
  document.querySelectorAll('main section[id]').forEach(function (sec) {
    var link = document.querySelector('.nav-link[href="#' + sec.id + '"]');
    if (link) navSections.push({ sec: sec, link: link });
  });
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    navbar.classList.toggle('scrolled', y > 40);
    if (y > lastY && y > 300 && !document.getElementById('nav-menu').classList.contains('open')) {
      navbar.classList.add('nav-hidden');
    } else {
      navbar.classList.remove('nav-hidden');
    }
    lastY = y;

    for (var i = 0; i < navSections.length; i++) {
      var top = navSections[i].sec.offsetTop - 140;
      var bottom = top + navSections[i].sec.offsetHeight;
      navSections[i].link.classList.toggle('active', y >= top && y < bottom);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  // Reveal the auto-hidden navbar when keyboard focus enters it
  navbar.addEventListener('focusin', function () { navbar.classList.remove('nav-hidden'); });

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
        t.setAttribute('aria-pressed', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-pressed', 'true');
      var target = tab.dataset.tab;
      document.getElementById('tab-work').classList.toggle('hidden', target !== 'work');
      document.getElementById('tab-education').classList.toggle('hidden', target !== 'education');
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });

  /* ---------- Project filters ---------- */
  document.querySelectorAll('.filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-btn').forEach(function (b) {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
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
      iframe.title = card.dataset.title || 'YouTube video player';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      var playBtn = card.querySelector('.talk-play');
      if (playBtn) playBtn.hidden = true;
      card.appendChild(iframe);
      iframe.focus();
    });
  });

  /* ---------- Scroll reveals & timeline fill (GSAP) ---------- */
  // Skip entrance animations for anything already on screen — a refresh
  // mid-page (or a deep link) must never flash blank content.
  function alreadyInView(el) {
    return el.getBoundingClientRect().top < window.innerHeight * 0.92;
  }

  function initReveals() {
    // Section titles: word slide-up
    document.querySelectorAll('[data-split-words]').forEach(function (title) {
      var words = title.querySelectorAll('.w > span');
      if (!words.length || alreadyInView(title)) return;
      gsap.from(words, {
        yPercent: 110,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.07,
        scrollTrigger: { trigger: title, start: 'top 88%' }
      });
    });

    // Contact giant title chars
    var contactTitleEl = document.querySelector('.contact-title');
    var contactChars = document.querySelectorAll('.contact-title .char');
    if (contactChars.length && contactTitleEl && !alreadyInView(contactTitleEl)) {
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
      if (el.closest('.hero') || alreadyInView(el)) return;
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
  }

  if (hasGsap && window.ScrollTrigger && !reducedMotion) {
    // Wait for full load so the browser has restored any previous scroll
    // position before we decide what is "already in view".
    if (document.readyState === 'complete') initReveals();
    else window.addEventListener('load', initReveals);
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
      if (alreadyInView(el)) return;
      el.style.opacity = '0';
      el.style.transform = 'translateY(40px)';
      io2.observe(el);
    });
  }

})();
