document.addEventListener('DOMContentLoaded', function () {
  var swiper = new Swiper(".featureSwiper", {
      slidesPerView: 4,
      spaceBetween: 30,
      loop: true,
      breakpoints: {
        0: {
          slidesPerView: 1,
          spaceBetween: 16,
          centeredSlides: true,
        },
        768: {
          slidesPerView: 2,
          spaceBetween: 20,
          centeredSlides: false,
        },
        1024: {
          slidesPerView: 3,
          spaceBetween: 24,
          centeredSlides: false,
        },
        1400: {
          slidesPerView: 4,
          spaceBetween: 30,
          centeredSlides: false,
        },
      },
      pagination: {
        el: ".featureSwiper .swiper-pagination",
        clickable: true,
      },
      autoplay: {
        delay: 1500,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
  });
  // var swiper = new Swiper(".testimonials-swiper", {
  //     slidesPerView: 1,
  //     slidesPerGroup: 1,
  //     spaceBetween: 30,
  //     loop: true,
  //     breakpoints: {
  //       0: {
  //         slidesPerView: 1,
  //         spaceBetween: 12,
  //         slidesPerGroup: 1,
  //       },
  //       426: {
  //         slidesPerView: 1,
  //         spaceBetween: 14,
  //         slidesPerGroup: 1,
  //       },
  //       768: {
  //         slidesPerView: 2,
  //         spaceBetween: 30,
  //         slidesPerGroup: 1,
  //       },
  //     },
  //     pagination: {
  //         el: ".testimonial-pagination-desktop",
  //         type: "progressbar",
  //         clickable: true,
  //     },
  //     navigation: {
  //         nextEl: ".testimonials-swiper .swiper-button-next",
  //         prevEl: ".testimonials-swiper .swiper-button-prev",
  //     },
  //     autoplay: {
  //         delay: 2000,                  
  //         disableOnInteraction: false,
  //         pauseOnMouseEnter: true,  
  //     },
  // });
  // var swiper = new Swiper(".testimonials-swiper-mob", {
  //     slidesPerView: 1,
  //     slidesPerGroup: 1,
  //     spaceBetween: 30,
  //     loop: true,
  //     breakpoints: {
  //       0: {
  //         slidesPerView: 1,
  //         spaceBetween: 12,
  //         slidesPerGroup: 1,
  //       },
  //       426: {
  //         slidesPerView: 1,
  //         spaceBetween: 14,
  //         slidesPerGroup: 1,
  //       },
  //       768: {
  //         slidesPerView: 1,
  //         spaceBetween: 30,
  //         slidesPerGroup: 1,
  //       },
  //     },
  //     pagination: {
  //     el: '.testimonials-swiper-mob .swiper-pagination',
  //     type: 'bullets',
  //     clickable: true,
  //   },
  //     // navigation: {
  //     //     nextEl: ".testimonials-swiper .swiper-button-next",
  //     //     prevEl: ".testimonials-swiper .swiper-button-prev",
  //     // },
  //     autoplay: {
  //         delay: 2000,                  
  //         disableOnInteraction: false,
  //         pauseOnMouseEnter: true,  
  //     },
  // });
 if (document.querySelector('.testimonials-swiper--desktop')) {
    new Swiper('.testimonials-swiper--desktop', {
      slidesPerView: 2,
      slidesPerGroup: 1,
      spaceBetween: 24,
      loop: true,
      pagination: {
        el: '.testimonial-pagination-desktop',
        type: 'progressbar',
        clickable: true,
      },
      navigation: {
        nextEl: '.testimonials-swiper--desktop .swiper-button-next',
        prevEl: '.testimonials-swiper--desktop .swiper-button-prev',
      },
      autoplay: {
        delay: 2000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
    });
  }

  if (document.querySelector('.testimonials-swiper-mob')) {
    new Swiper('.testimonials-swiper-mob', {
      slidesPerView: 1,
      slidesPerGroup: 1,
      spaceBetween: 12,
      loop: true,
      pagination: {
        el: '.testimonial-pagination-mobile',
        type: 'bullets',
        clickable: true,
      },
      autoplay: {
        delay: 2000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
    });
  }
  var swiper = new Swiper('.image-banner-swiper', {
    loop: true,
    speed: 800,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    // effect: 'fade',
    // fadeEffect: {
    //   crossFade: true
    // },
    pagination: {
      el: '.image-banner-swiper .swiper-pagination',
      type: 'bullets',
      clickable: true,
    },
    navigation: {
      nextEl: '.image-banner-swiper .swiper-button-next',
      prevEl: '.image-banner-swiper .swiper-button-prev',
    },
  });
});
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.js-play-video');
  if (!btn) return;

  const card = btn.closest('.testimonial-card--video');
  const video = card.querySelector('video');
  const iframe = card.querySelector('iframe');

  card.classList.add('is-playing');
  if (video) {
    video.play();
  }
  if (iframe) {
    const src = iframe.src;
    iframe.src = src + (src.includes('?') ? '&' : '?') + 'autoplay=1';
  }
});

document.addEventListener('DOMContentLoaded', function () {
  // Get Swiper instance
  const swiperEl = document.querySelector('.testimonials-swiper');
  const swiper = swiperEl?.swiper;

  // Handle each play button
  document.querySelectorAll('.js-play-video').forEach(function (playBtn) {
    playBtn.addEventListener('click', function () {
      const card = playBtn.closest('.testimonial-card--video');
      const poster = card?.querySelector('.testimonial-card__poster');
      const videoEl = card?.querySelector('.testimonial-card__video');
      const video = card?.querySelector('video.testimonial-video');
      const iframe = card?.querySelector('iframe');

      // Hide poster + play button, show video
      if (poster) poster.style.display = 'none';
      if (videoEl) videoEl.style.display = 'block';
      playBtn.style.display = 'none';

      // Stop swiper autoplay while video plays
      if (swiper) swiper.autoplay?.stop();

      if (video) {
        // Show pause state while buffering
        video.addEventListener('waiting', function () {
          playBtn.style.display = 'none'; // keep hidden, buffering
        });

        // Resume swiper when video ends or is paused
        video.addEventListener('pause', function () {
          if (swiper) swiper.autoplay?.start();
          playBtn.style.display = 'flex';
        });

        video.addEventListener('ended', function () {
          if (swiper) swiper.autoplay?.start();
          // Show poster again
          if (poster) poster.style.display = 'block';
          if (videoEl) videoEl.style.display = 'none';
          playBtn.style.display = 'flex';
        });

        video.play();
      }

      // For YouTube / Vimeo iframes — just stop swiper, can't control play/pause
      if (iframe) {
        // Resume swiper if user navigates away (slide change)
        swiper?.on('slideChange', function () {
          if (swiper) swiper.autoplay?.start();
        });
      }
    });
  });

  // Also stop swiper on slide change if a video is playing
  swiper?.on('slideChange', function () {
    document.querySelectorAll('video.testimonial-video').forEach(function (v) {
      if (!v.paused) {
        v.pause();
        if (swiper) swiper.autoplay?.start();
      }
    });
  });

});
document.addEventListener('DOMContentLoaded', function () {
  // Get Swiper instance
  const swiperEl = document.querySelector('.testimonials-swiper-mob');
  const swiper = swiperEl?.swiper;

  // Handle each play button
  document.querySelectorAll('.js-play-video').forEach(function (playBtn) {
    playBtn.addEventListener('click', function () {
      const card = playBtn.closest('.testimonial-card--video');
      const poster = card?.querySelector('.testimonial-card__poster');
      const videoEl = card?.querySelector('.testimonial-card__video');
      const video = card?.querySelector('video.testimonial-video');
      const iframe = card?.querySelector('iframe');

      // Hide poster + play button, show video
      if (poster) poster.style.display = 'none';
      if (videoEl) videoEl.style.display = 'block';
      playBtn.style.display = 'none';

      // Stop swiper autoplay while video plays
      if (swiper) swiper.autoplay?.stop();

      if (video) {
        // Show pause state while buffering
        video.addEventListener('waiting', function () {
          playBtn.style.display = 'none'; // keep hidden, buffering
        });

        // Resume swiper when video ends or is paused
        video.addEventListener('pause', function () {
          if (swiper) swiper.autoplay?.start();
          playBtn.style.display = 'flex';
        });

        video.addEventListener('ended', function () {
          if (swiper) swiper.autoplay?.start();
          // Show poster again
          if (poster) poster.style.display = 'block';
          if (videoEl) videoEl.style.display = 'none';
          playBtn.style.display = 'flex';
        });

        video.play();
      }

      // For YouTube / Vimeo iframes — just stop swiper, can't control play/pause
      if (iframe) {
        // Resume swiper if user navigates away (slide change)
        swiper?.on('slideChange', function () {
          if (swiper) swiper.autoplay?.start();
        });
      }
    });
  });

  // Also stop swiper on slide change if a video is playing
  swiper?.on('slideChange', function () {
    document.querySelectorAll('video.testimonial-video').forEach(function (v) {
      if (!v.paused) {
        v.pause();
        if (swiper) swiper.autoplay?.start();
      }
    });
  });

});

  const menuBtn = document.querySelector('#header-menu-btn');
  const themeMenuBtn = document.querySelector('.header__icon--menu');
  const menuDrawer = document.querySelector('#MenuDrawer');
  const overlay = document.querySelector('[data-menu-overlay]');
  const closeBtn = document.querySelector('[data-menu-close]');

  function openDrawer() {
    menuDrawer?.classList.add('is-open');
    menuDrawer?.removeAttribute('aria-hidden');
    menuBtn?.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-drawer--open');
    overlay?.classList.add('is-open');
    menuDrawer?.focus();
  }

  function closeDrawer() {
    menuDrawer?.classList.remove('is-open');
    menuDrawer?.setAttribute('aria-hidden', 'true');
    menuBtn?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-drawer--open');
    overlay?.classList.remove('is-open');
    menuBtn?.focus();
  }

  menuBtn?.addEventListener('click', openDrawer);
  overlay?.addEventListener('click', closeDrawer);
  closeBtn?.addEventListener('click', closeDrawer);

  // Make theme's 9-dot menu icon open custom drawer
  if (themeMenuBtn) {
    themeMenuBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var details = themeMenuBtn.closest('details');
      if (details) details.removeAttribute('open');
      openDrawer();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });

function initHeroVideoModal() {
  const modal = document.querySelector('[data-hero-video-modal]');
  const openBtn = document.querySelector('[data-hero-video-play]');
  const closeModal = modal?.querySelector('[data-hero-video-close]');
  const modalBackdrop = modal?.querySelector('[data-hero-video-backdrop]');
  const modalVideo = modal?.querySelector('video');

  function openHeroVideoModal() {
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('hero-video-modal-open');
    modalVideo?.play();
  }

  function closeHeroVideoModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('hero-video-modal-open');
    if (modalVideo) {
      modalVideo.pause();
      modalVideo.currentTime = 0;
    }
  }

  window.openHeroVideoModal = openHeroVideoModal;
  window.closeHeroVideoModal = closeHeroVideoModal;

  openBtn?.addEventListener('click', openHeroVideoModal);
  closeModal?.addEventListener('click', closeHeroVideoModal);
  modalBackdrop?.addEventListener('click', closeHeroVideoModal);

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-hero-video-open]');
    if (!trigger || !modal) return;
    event.preventDefault();
    openHeroVideoModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeHeroVideoModal();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeroVideoModal);
} else {
  initHeroVideoModal();
}
(function () {
  'use strict';

  var lockCount = 0;

  function getScrollbarWidth() {
    return Math.max(0, window.innerWidth - document.documentElement.clientWidth);
  }

  function applyCompensation() {
    var width = getScrollbarWidth();
    document.documentElement.style.setProperty('--scrollbar-width', width + 'px');
    document.documentElement.classList.add('scroll-locked');
  }

  function clearCompensation() {
    document.documentElement.classList.remove('scroll-locked');
    document.documentElement.style.removeProperty('--scrollbar-width');
  }

  function lock() {
    lockCount += 1;
    if (lockCount > 1) return;
    applyCompensation();
  }

  function unlock() {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount > 0) return;
    clearCompensation();
  }

  window.BiomScrollLock = {
    lock: lock,
    unlock: unlock,
    getScrollbarWidth: getScrollbarWidth,
  };
})();


(function () {
  'use strict';

  var DESKTOP_MIN = 990;

  function getImageInset() {
    var compare = document.querySelector('.why-biom__compare');
    if (!compare) return 0.42;
    var value = parseFloat(getComputedStyle(compare).getPropertyValue('--connector-image-inset'));
    return Number.isFinite(value) ? value : 0.42;
  }

  /**
   * @param {HTMLElement} visual
   */
  function getImageTargets(visual) {
    var leftWrap = visual.querySelector('.probiotics_wrap');
    var rightWrap = visual.querySelector('.biom-probiotics_wrap');
    var visualRect = visual.getBoundingClientRect();

    return {
      left: leftWrap ? leftWrap.getBoundingClientRect() : visualRect,
      right: rightWrap ? rightWrap.getBoundingClientRect() : visualRect,
    };
  }

  function resetConnector(connector) {
    connector.style.display = 'none';
    connector.style.top = '';
    connector.style.left = '';
    connector.style.width = '';
    connector.style.height = '';
    connector.classList.remove('is-vertical');
  }

  /**
   * @param {HTMLElement} connector
   * @param {HTMLElement} row
   * @param {HTMLElement} card
   * @param {{ left: DOMRect, right: DOMRect }} targets
   * @param {DOMRect} compareRect
   * @param {'left' | 'right'} side
   */
  function positionDesktopConnector(connector, row, card, targets, compareRect, side) {
    var rowRect = row.getBoundingClientRect();
    var cardRect = card.getBoundingClientRect();
    var rowCenterY = rowRect.top + rowRect.height / 2 - compareRect.top;
    var inset = getImageInset();

    connector.classList.remove('is-vertical');
    connector.style.display = 'block';
    connector.style.transform = 'translateY(-50%)';
    connector.style.top = rowCenterY + 'px';
    connector.style.height = '';

    if (side === 'left') {
      var startX = cardRect.right - compareRect.left;
      var endX = targets.left.left + targets.left.width * inset - compareRect.left;
      connector.style.left = startX + 'px';
      connector.style.width = Math.max(0, endX - startX) + 'px';
      return;
    }

    var imageX = targets.right.right - targets.right.width * inset - compareRect.left;
    var cardLeft = cardRect.left - compareRect.left;
    connector.style.left = imageX + 'px';
    connector.style.width = Math.max(0, cardLeft - imageX) + 'px';
  }

  /**
   * @param {HTMLElement} connector
   * @param {HTMLElement} card
   * @param {{ left: DOMRect, right: DOMRect }} targets
   * @param {DOMRect} compareRect
   * @param {'left' | 'right'} side
   */
  function positionMobileConnector(connector, card, targets, compareRect, side) {
    var cardRect = card.getBoundingClientRect();
    var inset = getImageInset();

    connector.classList.add('is-vertical');
    connector.style.display = 'block';
    connector.style.transform = 'translateX(-50%)';
    connector.style.width = '';

    if (side === 'left') {
      var centerX = targets.left.left + targets.left.width * 0.2 - compareRect.left;
      var startY = cardRect.bottom - compareRect.top;
      var endY = targets.left.top + targets.left.height * inset - compareRect.top;
      connector.style.left = centerX + 'px';
      connector.style.top = startY + 'px';
      connector.style.height = Math.max(0, endY - startY) + 'px';
      return;
    }

    var rightCenterX = targets.right.right - targets.right.width * 0.2 - compareRect.left;
    var lineTop = targets.right.top + targets.right.height * (1 - inset) - compareRect.top;
    var lineBottom = cardRect.top - compareRect.top;
    connector.style.left = rightCenterX + 'px';
    connector.style.top = lineTop + 'px';
    connector.style.height = Math.max(0, lineBottom - lineTop) + 'px';
  }

  function updateWhyBiomConnectors() {
    var compare = document.querySelector('.why-biom__compare');
    if (!compare) return;

    var leftConnector = compare.querySelector('.why-biom__connector--left');
    var rightConnector = compare.querySelector('.why-biom__connector--right');
    var visual = compare.querySelector('.why-biom__visual');
    var leftCard = compare.querySelector('.why-biom-card--left');
    var rightCard = compare.querySelector('.why-biom-card--right');
    var leftRow = compare.querySelector('.why-biom-card__row--connector-left');
    var rightRow = compare.querySelector('.why-biom-card__row--connector-right');

    if (!leftConnector || !rightConnector || !visual || !leftCard || !rightCard) return;

    [leftConnector, rightConnector].forEach(resetConnector);

    var compareRect = compare.getBoundingClientRect();
    var targets = getImageTargets(visual);
    var isDesktop = window.innerWidth >= DESKTOP_MIN;

    if (isDesktop) {
      if (leftRow) {
        positionDesktopConnector(leftConnector, leftRow, leftCard, targets, compareRect, 'left');
      }
      if (rightRow) {
        positionDesktopConnector(rightConnector, rightRow, rightCard, targets, compareRect, 'right');
      }
      return;
    }

    positionMobileConnector(leftConnector, leftCard, targets, compareRect, 'left');
    positionMobileConnector(rightConnector, rightCard, targets, compareRect, 'right');
  }

  var resizeTimer;
  function onResize() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(updateWhyBiomConnectors, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateWhyBiomConnectors);
  } else {
    updateWhyBiomConnectors();
  }

  window.addEventListener('resize', onResize);
  window.addEventListener('load', updateWhyBiomConnectors);

  document.addEventListener('shopify:section:load', function (event) {
    if (event.target.querySelector('.why-biom__compare')) {
      updateWhyBiomConnectors();
    }
  });
})();


// document.addEventListener("DOMContentLoaded", function () {
//   const faqSection = document.querySelector(".section-content-wrapper");

//   if (!faqSection) return;

//   const questions = faqSection.querySelectorAll(".details__header");

//   let hasQuestion = false;

//   questions.forEach(question => {
//     if (question.textContent.trim() !== "") {
//       hasQuestion = true;
//     }
//   });

//   if (!hasQuestion) {
//     faqSection.style.display = "none";
//   }
// });

// document.addEventListener("DOMContentLoaded", function () {
//   document.querySelectorAll("accordion-custom").forEach(function (item) {
//     const question = item.querySelector(".details__header");
//     const answer = item.querySelector(".details-content");

//     const q = question ? question.textContent.replace(/\s/g, "") : "";
//     const a = answer ? answer.textContent.replace(/\s/g, "") : "";

//     if (q === "" && a === "") {
//       item.remove(); // or item.style.display = "none";
//     }
//   });
// });


//product under faq//

document.addEventListener("DOMContentLoaded", function () {
  const faqSection = document.getElementById("shopify-section-template--21203203817607__section_drW3jc");

  if (!faqSection) return;

  const questions = faqSection.querySelectorAll(".details__header");

  let hasQuestion = false;

  questions.forEach(question => {
    if (question.textContent.trim() !== "") {
      hasQuestion = true;
    }
  });

  if (!hasQuestion) {
    faqSection.style.display = "none";
  }
});

document.addEventListener("DOMContentLoaded", function () {

  const faqSection = document.getElementById("shopify-section-template--21203203817607__section_drW3jc");

  if (!faqSection) return;

  faqSection.querySelectorAll("accordion-custom").forEach(function (item) {
    const question = item.querySelector(".details__header");
    const answer = item.querySelector(".details-content");

    const q = question ? question.textContent.replace(/\s/g, "") : "";
    const a = answer ? answer.textContent.replace(/\s/g, "") : "";

    if (q === "" && a === "") {
      item.remove(); // or item.style.display = "none";
    }
  });

});