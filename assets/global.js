/* Biom Probiotics 2026 — global behaviors
   Menu drawer, header dropdown/search, cart drawer (AJAX), scroll reveals,
   and the shared carousel engine. No dependencies. */

(function () {
  'use strict';

  var docEl = document.documentElement;

  /* ----------------------------------------------------------------------
     Menu drawer
     ---------------------------------------------------------------------- */
  var drawer = document.getElementById('MenuDrawer');
  var overlay = document.querySelector('[data-menu-overlay]');
  var openBtns = document.querySelectorAll('[data-menu-open]');
  var lastFocused = null;

  function openDrawer() {
    if (!drawer) return;
    lastFocused = document.activeElement;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    if (overlay) overlay.classList.add('is-open');
    document.body.classList.add('no-scroll');
    openBtns.forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    var closeBtn = drawer.querySelector('[data-menu-close]');
    if (closeBtn) closeBtn.focus();
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (overlay) overlay.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    openBtns.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    if (lastFocused) lastFocused.focus();
  }

  openBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      drawer && drawer.classList.contains('is-open') ? closeDrawer() : openDrawer();
    });
  });
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-menu-close]')) closeDrawer();
  });
  if (overlay) overlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeDrawer();
      closeDropdown();
      closeSearch();
      closeCartDrawer();
    }
  });

  /* ----------------------------------------------------------------------
     Header dropdown (Our Products) + search
     ---------------------------------------------------------------------- */
  var dropdownToggle = document.querySelector('[data-dropdown-toggle]');
  var dropdown = document.getElementById('HeaderProductsDropdown');

  function closeDropdown() {
    if (!dropdown) return;
    dropdown.classList.remove('is-open');
    if (dropdownToggle) dropdownToggle.setAttribute('aria-expanded', 'false');
  }

  if (dropdownToggle && dropdown) {
    dropdownToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = dropdown.classList.toggle('is-open');
      dropdownToggle.setAttribute('aria-expanded', String(isOpen));
      if (isOpen) closeSearch();
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('#HeaderProductsDropdown') && !e.target.closest('[data-dropdown-toggle]')) {
        closeDropdown();
      }
    });
  }

  var searchToggle = document.querySelector('[data-search-toggle]');
  var searchPanel = document.getElementById('HeaderSearch');

  function closeSearch() {
    if (!searchPanel) return;
    searchPanel.classList.remove('is-open');
    if (searchToggle) searchToggle.setAttribute('aria-expanded', 'false');
  }

  if (searchToggle && searchPanel) {
    searchToggle.addEventListener('click', function () {
      var isOpen = searchPanel.classList.toggle('is-open');
      searchToggle.setAttribute('aria-expanded', String(isOpen));
      if (isOpen) {
        closeDropdown();
        var input = searchPanel.querySelector('input[type="search"]');
        if (input) input.focus();
      }
    });
  }

  /* ----------------------------------------------------------------------
     Scroll reveal
     ---------------------------------------------------------------------- */
  function initReveals(scope) {
    var items = (scope || document).querySelectorAll('.reveal:not(.is-visible)');
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );
    items.forEach(function (el) { io.observe(el); });
  }
  initReveals();
  document.addEventListener('shopify:section:load', function (e) { initReveals(e.target); });

  /* ----------------------------------------------------------------------
     Carousel engine — scroll-snap track with prev/next + dots
     Markup: [data-carousel] > [data-carousel-track] > slides
             optional [data-carousel-prev]/[data-carousel-next]/[data-carousel-dots]
     ---------------------------------------------------------------------- */
  function initCarousel(root) {
    var track = root.querySelector('[data-carousel-track]');
    if (!track) return;
    var prev = root.querySelector('[data-carousel-prev]');
    var next = root.querySelector('[data-carousel-next]');
    var dotsWrap = root.querySelector('[data-carousel-dots]');
    var slides = Array.prototype.slice.call(track.children);
    if (!slides.length) return;

    function slideWidth() {
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 0) || 0;
      return slides[0].getBoundingClientRect().width + gap;
    }

    function goTo(i) {
      track.scrollTo({ left: i * slideWidth(), behavior: 'smooth' });
    }

    function currentIndex() {
      return Math.round(track.scrollLeft / slideWidth());
    }

    if (prev) prev.addEventListener('click', function () { goTo(Math.max(0, currentIndex() - 1)); });
    if (next) next.addEventListener('click', function () { goTo(Math.min(slides.length - 1, currentIndex() + 1)); });

    var dots = [];
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      slides.forEach(function (_, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        b.addEventListener('click', function () { goTo(i); });
        dotsWrap.appendChild(b);
        dots.push(b);
      });
    }

    function sync() {
      var i = currentIndex();
      dots.forEach(function (d, di) { d.classList.toggle('is-active', di === i); });
      if (prev) prev.disabled = track.scrollLeft <= 4;
      if (next) next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
    }
    track.addEventListener('scroll', function () { window.requestAnimationFrame(sync); }, { passive: true });
    window.addEventListener('resize', sync);
    sync();

    /* autoplay (opt-in via data-carousel-autoplay="ms") */
    var autoplayMs = parseInt(root.getAttribute('data-carousel-autoplay'), 10);
    if (autoplayMs && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var timer = setInterval(function () {
        var i = currentIndex();
        goTo(i >= slides.length - 1 ? 0 : i + 1);
      }, autoplayMs);
      root.addEventListener('pointerenter', function () { clearInterval(timer); });
    }
  }
  document.querySelectorAll('[data-carousel]').forEach(initCarousel);
  document.addEventListener('shopify:section:load', function (e) {
    e.target.querySelectorAll('[data-carousel]').forEach(initCarousel);
  });

  /* ----------------------------------------------------------------------
     Cart drawer + AJAX add to cart
     ---------------------------------------------------------------------- */
  var cartDrawer = document.getElementById('CartDrawer');
  var cartOverlay = document.querySelector('[data-cart-overlay]');

  function openCartDrawer() {
    if (!cartDrawer) return;
    cartDrawer.classList.add('is-open');
    cartDrawer.setAttribute('aria-hidden', 'false');
    if (cartOverlay) cartOverlay.classList.add('is-open');
    document.body.classList.add('no-scroll');
  }

  function closeCartDrawer() {
    if (!cartDrawer) return;
    cartDrawer.classList.remove('is-open');
    cartDrawer.setAttribute('aria-hidden', 'true');
    if (cartOverlay) cartOverlay.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
  }

  window.BiomCart = {
    open: openCartDrawer,
    close: closeCartDrawer,
    refresh: refreshCartDrawer,
  };

  if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-cart-close]')) closeCartDrawer();
    var cartIcon = e.target.closest('[data-cart-icon]');
    if (cartIcon && cartDrawer && window.innerWidth > 749) {
      e.preventDefault();
      openCartDrawer();
    }
  });

  function updateCartCount(count) {
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = count > 0 ? count : '';
    });
  }

  function refreshCartDrawer(openAfter) {
    return fetch(window.location.pathname + '?section_id=cart-drawer')
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var fresh = doc.querySelector('#CartDrawer .cart-drawer__body');
        var current = cartDrawer && cartDrawer.querySelector('.cart-drawer__body');
        if (fresh && current) current.innerHTML = fresh.innerHTML;
        return fetch(window.routes.cart_url + '.js')
          .then(function (r) { return r.json(); })
          .then(function (cart) {
            updateCartCount(cart.item_count);
            if (openAfter) openCartDrawer();
          });
      })
      .catch(function () {
        if (openAfter) window.location.href = window.routes.cart_url;
      });
  }

  /* product forms -> AJAX add */
  document.addEventListener('submit', function (e) {
    var form = e.target.closest('form[data-ajax-cart]');
    if (!form) return;
    e.preventDefault();
    var btn = form.querySelector('[type="submit"]');
    if (btn) {
      btn.classList.add('is-loading');
      btn.disabled = true;
    }
    fetch(window.routes.cart_add_url + '.js', {
      method: 'POST',
      body: new FormData(form),
    })
      .then(function (r) {
        if (!r.ok) throw new Error('add failed');
        return r.json();
      })
      .then(function () { return refreshCartDrawer(true); })
      .catch(function () { form.submit(); })
      .finally(function () {
        if (btn) {
          btn.classList.remove('is-loading');
          btn.disabled = false;
        }
      });
  });

  /* quantity steppers + line removals inside cart drawer / cart page */
  document.addEventListener('click', function (e) {
    var stepBtn = e.target.closest('[data-qty-change]');
    if (stepBtn) {
      var wrapper = stepBtn.closest('[data-line-item]');
      var input = wrapper && wrapper.querySelector('[data-qty-input]');
      if (input) {
        var qty = Math.max(0, parseInt(input.value || '0', 10) + parseInt(stepBtn.getAttribute('data-qty-change'), 10));
        changeLine(wrapper.getAttribute('data-line-key'), qty, wrapper);
      }
    }
    var removeBtn = e.target.closest('[data-line-remove]');
    if (removeBtn) {
      var li = removeBtn.closest('[data-line-item]');
      if (li) changeLine(li.getAttribute('data-line-key'), 0, li);
    }
  });

  function changeLine(key, quantity, el) {
    if (!key) return;
    if (el) el.classList.add('is-loading');
    fetch(window.routes.cart_change_url + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity: quantity }),
    })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        updateCartCount(cart.item_count);
        if (document.body.classList.contains('template-cart')) {
          window.location.reload();
        } else {
          refreshCartDrawer(false);
        }
      });
  }

  /* ----------------------------------------------------------------------
     Header: hide announcement on scroll-down, keep header sticky
     ---------------------------------------------------------------------- */
  var lastY = 0;
  var headerGroup = document.querySelector('.section-header');
  window.addEventListener(
    'scroll',
    function () {
      var y = window.scrollY;
      if (headerGroup) headerGroup.classList.toggle('is-scrolled', y > 10 && y > lastY);
      lastY = y;
    },
    { passive: true }
  );

})();
