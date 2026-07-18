const sliderSelector = [
  '.featureSwiper',
  '.testimonials-swiper--desktop',
  '.testimonials-swiper-mob',
  '.image-banner-swiper',
].join(',');

const observedSliders = new WeakSet();
let swiperObserver;

function loadSwiperStyles() {
  if (window.BiomSwiperStylesPromise) return window.BiomSwiperStylesPromise;

  const stylesheetUrl = document.body.dataset.swiperStylesheetUrl;
  if (!stylesheetUrl) return Promise.resolve();

  window.BiomSwiperStylesPromise = new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = stylesheetUrl;
    link.dataset.biomSwiperStyles = '';
    link.addEventListener('load', resolve, { once: true });
    link.addEventListener('error', resolve, { once: true });
    document.head.appendChild(link);
  });

  return window.BiomSwiperStylesPromise;
}

function loadSwiperScript() {
  if (window.Swiper) return Promise.resolve(window.Swiper);
  if (window.BiomSwiperPromise) return window.BiomSwiperPromise;

  const scriptUrl = document.body.dataset.swiperScriptUrl;
  if (!scriptUrl) return Promise.reject(new Error('Swiper asset URL is missing.'));

  window.BiomSwiperPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.addEventListener('load', () => resolve(window.Swiper), { once: true });
    script.addEventListener('error', reject, { once: true });
    document.head.appendChild(script);
  });

  return window.BiomSwiperPromise;
}

function autoplayOptions(element, delay) {
  if (element.dataset.autoplay === 'false') return false;

  return {
    delay,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  };
}

function initializeFeatureSlider(element) {
  return new window.Swiper(element, {
    slidesPerView: 4,
    spaceBetween: 30,
    loop: element.querySelectorAll('.swiper-slide').length > 1,
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
      el: element.querySelector('.swiper-pagination'),
      clickable: true,
    },
    autoplay: autoplayOptions(element, 1500),
  });
}

function resetTestimonialCard(card) {
  const video = card.querySelector('video');
  const iframe = card.querySelector('iframe[data-src]');

  if (video) {
    video.pause();
    video.currentTime = 0;
  }

  if (iframe) iframe.removeAttribute('src');
  card.classList.remove('is-playing');
}

function initializeTestimonialSlider(element, mobile) {
  const instance = new window.Swiper(element, {
    slidesPerView: mobile ? 1 : 2,
    slidesPerGroup: 1,
    spaceBetween: mobile ? 12 : 24,
    loop: element.querySelectorAll('.swiper-slide').length > 1,
    pagination: {
      el: element.querySelector('.swiper-pagination'),
      type: mobile ? 'bullets' : 'progressbar',
      clickable: true,
    },
    navigation: mobile
      ? undefined
      : {
          nextEl: element.querySelector('.swiper-button-next'),
          prevEl: element.querySelector('.swiper-button-prev'),
        },
    autoplay: autoplayOptions(element, 2000),
  });

  instance.on('slideChangeTransitionStart', () => {
    element.querySelectorAll('.testimonial-card--video.is-playing').forEach(resetTestimonialCard);
  });

  return instance;
}

function initializeImageBanner(element) {
  return new window.Swiper(element, {
    loop: element.querySelectorAll('.swiper-slide').length > 1,
    speed: 800,
    autoplay: autoplayOptions(element, 5000),
    pagination: {
      el: element.querySelector('.swiper-pagination'),
      type: 'bullets',
      clickable: true,
    },
    navigation: {
      nextEl: element.querySelector('.swiper-button-next'),
      prevEl: element.querySelector('.swiper-button-prev'),
    },
  });
}

async function initializeSlider(element) {
  if (element.dataset.swiperInitialized === 'true') return;
  element.dataset.swiperInitialized = 'true';

  try {
    await Promise.all([loadSwiperScript(), loadSwiperStyles()]);

    if (element.matches('.featureSwiper')) {
      initializeFeatureSlider(element);
    } else if (element.matches('.testimonials-swiper--desktop')) {
      initializeTestimonialSlider(element, false);
    } else if (element.matches('.testimonials-swiper-mob')) {
      initializeTestimonialSlider(element, true);
    } else if (element.matches('.image-banner-swiper')) {
      initializeImageBanner(element);
    }
  } catch (error) {
    element.dataset.swiperInitialized = 'false';
    console.error('Unable to initialize slider.', error);
  }
}

function observeSliders(root = document) {
  const sliders = Array.from(root.querySelectorAll(sliderSelector));
  if (sliders.length === 0) return;

  loadSwiperStyles();

  if (!('IntersectionObserver' in window)) {
    sliders.forEach(initializeSlider);
    return;
  }

  if (!swiperObserver) {
    swiperObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          swiperObserver.unobserve(entry.target);
          initializeSlider(entry.target);
        });
      },
      { rootMargin: '500px 0px' }
    );
  }

  sliders.forEach((slider) => {
    if (observedSliders.has(slider)) return;
    observedSliders.add(slider);
    swiperObserver.observe(slider);
  });
}

function withAutoplay(url) {
  if (!url) return '';
  return url + (url.includes('?') ? '&' : '?') + 'autoplay=1';
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('.js-play-video');
  if (!button) return;

  const card = button.closest('.testimonial-card--video');
  if (!card) return;

  const slider = card.closest('.swiper');
  const video = card.querySelector('video');
  const iframe = card.querySelector('iframe[data-src]');

  card.classList.add('is-playing');
  slider?.swiper?.autoplay?.stop();

  if (video) {
    if (video.dataset.testimonialEvents !== 'true') {
      video.dataset.testimonialEvents = 'true';
      video.addEventListener('ended', () => {
        resetTestimonialCard(card);
        slider?.swiper?.autoplay?.start();
      });
    }

    video.play().catch(() => {
      resetTestimonialCard(card);
      slider?.swiper?.autoplay?.start();
    });
  }

  if (iframe && !iframe.hasAttribute('src')) iframe.src = withAutoplay(iframe.dataset.src);
});

document.addEventListener('keydown', (event) => {
  const button = event.target.closest('.js-play-video[role="button"]');
  if (!button || (event.key !== 'Enter' && event.key !== ' ')) return;
  event.preventDefault();
  button.click();
});

observeSliders();

document.addEventListener('shopify:section:load', (event) => {
  observeSliders(event.target);
});
