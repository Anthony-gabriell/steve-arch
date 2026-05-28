/**
 * ATECH — Main JavaScript
 * - IntersectionObserver for fade-in animations
 * - Navbar scroll (solid background)
 * - Mobile hamburger menu toggle
 * - Product filter logic (produtos.html)
 */
(function () {
  'use strict';

  // ============================
  // 1. Fade-in on scroll
  // ============================
  var fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var delay = el.dataset.delay || 0;
          setTimeout(function() {
            el.classList.add('visible');
          }, delay);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.12 });
    fadeEls.forEach(function(el, i) {
      if (!el.dataset.delay) el.dataset.delay = i * 80;
      observer.observe(el);
    });
  }

  // ============================
  // 2. Navbar scroll effect
  // ============================
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // ============================
  // 3. Mobile overlay menu toggle
  // ============================
  var hamburger = document.getElementById('hamburger');
  var menuOverlay = document.getElementById('menuOverlay');
  var menuClose = document.getElementById('menuClose');
  if (hamburger && menuOverlay) {
    hamburger.addEventListener('click', function() {
      hamburger.classList.toggle('active');
      menuOverlay.classList.toggle('open');
    });
    menuClose.addEventListener('click', function() {
      hamburger.classList.remove('active');
      menuOverlay.classList.remove('open');
    });
    menuOverlay.querySelectorAll('.menu-link').forEach(function(link) {
      link.addEventListener('click', function() {
        hamburger.classList.remove('active');
        menuOverlay.classList.remove('open');
      });
    });
  }

  // ============================
  // 4. Product filtering
  // ============================
  const filterBar = document.querySelector('.filter-bar');
  if (filterBar) {
    const cards = document.querySelectorAll('.product-card');
    const emptyStates = document.querySelectorAll('.filter-empty-state');
    const buttons = filterBar.querySelectorAll('.filter-btn');

    // Hide all empty states initially
    emptyStates.forEach(function (el) { el.style.display = 'none'; });

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const category = btn.getAttribute('data-filter');

        // Update active button
        buttons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        // Hide all empty state messages
        emptyStates.forEach(function (el) { el.style.display = 'none'; });

        // Show / hide cards
        let visibleCount = 0;
        cards.forEach(function (card) {
          if (category === 'todos') {
            card.style.display = '';
            visibleCount++;
          } else {
            const cardCat = card.getAttribute('data-category');
            const match = cardCat === category;
            card.style.display = match ? '' : 'none';
            if (match) visibleCount++;
          }
        });

        // Show matching empty-state if filter has no products
        if (visibleCount === 0) {
          const emptyState = document.getElementById('empty-' + category);
          if (emptyState) emptyState.style.display = '';
        }
      });
    });
  }

  // ============================
  // 5. Accordion audience
  // ============================
  document.querySelectorAll('.acc-header').forEach(function(header) {
    header.addEventListener('click', function() {
      var item = this.closest('.acc-item');
      var isActive = item.classList.contains('active');
      document.querySelectorAll('.acc-item').forEach(function(i) {
        i.classList.remove('active');
      });
      if (!isActive) item.classList.add('active');
    });
  });

})();
