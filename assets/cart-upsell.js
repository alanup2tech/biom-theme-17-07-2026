class CartUpsell extends HTMLElement {
  static AUTOPLAY_DELAY = 3500;

  /** @type {HTMLElement | null} */
  #track = null;

  /** @type {HTMLButtonElement | null} */
  #nextButton = null;

  /** @type {HTMLElement | null} */
  #progress = null;

  /** @type {number | null} */
  #autoplayTimer = null;

  #pauseReasons = new Set();

  #resizeObserver = new ResizeObserver(() => {
    this.#updateControls();
    this.#startAutoplay();
  });

  connectedCallback() {
    this.#track = this.querySelector('[data-cart-upsell-track]');
    this.#nextButton = this.querySelector('[data-cart-upsell-next]');
    this.#progress = this.querySelector('[data-cart-upsell-progress]');

    this.#nextButton?.addEventListener('click', this.#showNextProducts);
    this.#track?.addEventListener('scroll', this.#updateControls, { passive: true });
    this.addEventListener('pointerenter', this.#handlePointerEnter);
    this.addEventListener('pointerleave', this.#handlePointerLeave);
    this.addEventListener('pointerdown', this.#handleInteractionStart, { passive: true });
    this.addEventListener('pointerup', this.#handleInteractionEnd, { passive: true });
    this.addEventListener('pointercancel', this.#handleInteractionEnd, { passive: true });
    this.addEventListener('focusin', this.#handleFocusIn);
    this.addEventListener('focusout', this.#handleFocusOut);
    document.addEventListener('visibilitychange', this.#handleVisibilityChange);

    if (this.#track) this.#resizeObserver.observe(this.#track);
    requestAnimationFrame(() => {
      this.#updateControls();
      this.#startAutoplay();
    });
  }

  disconnectedCallback() {
    this.#stopAutoplay();
    this.#nextButton?.removeEventListener('click', this.#showNextProducts);
    this.#track?.removeEventListener('scroll', this.#updateControls);
    this.removeEventListener('pointerenter', this.#handlePointerEnter);
    this.removeEventListener('pointerleave', this.#handlePointerLeave);
    this.removeEventListener('pointerdown', this.#handleInteractionStart);
    this.removeEventListener('pointerup', this.#handleInteractionEnd);
    this.removeEventListener('pointercancel', this.#handleInteractionEnd);
    this.removeEventListener('focusin', this.#handleFocusIn);
    this.removeEventListener('focusout', this.#handleFocusOut);
    document.removeEventListener('visibilitychange', this.#handleVisibilityChange);
    this.#resizeObserver.disconnect();
  }

  #showNextProducts = () => {
    this.#advanceCarousel();
  };

  #advanceCarousel = () => {
    if (!this.#track) return;

    const maximumScroll = Math.max(0, this.#track.scrollWidth - this.#track.clientWidth);
    if (maximumScroll <= 2) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const firstCard = this.#track.querySelector('.upsell-card');
    const trackStyles = getComputedStyle(this.#track);
    const gap = Number.parseFloat(trackStyles.columnGap || trackStyles.gap) || 0;
    const cardStep = firstCard ? firstCard.getBoundingClientRect().width + gap : this.#track.clientWidth * 0.75;
    const isAtEnd = this.#track.scrollLeft >= maximumScroll - 2;

    this.#track.scrollTo({
      left: isAtEnd ? 0 : Math.min(maximumScroll, this.#track.scrollLeft + Math.max(240, cardStep)),
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  #handleAutoplayTick = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.#stopAutoplay();
      return;
    }

    this.#advanceCarousel();
  };

  #startAutoplay = () => {
    if (
      this.#autoplayTimer !== null ||
      this.#pauseReasons.size > 0 ||
      document.hidden ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !this.#track ||
      this.#track.scrollWidth - this.#track.clientWidth <= 2
    ) {
      return;
    }

    this.#autoplayTimer = window.setInterval(this.#handleAutoplayTick, CartUpsell.AUTOPLAY_DELAY);
  };

  #stopAutoplay = () => {
    if (this.#autoplayTimer === null) return;

    window.clearInterval(this.#autoplayTimer);
    this.#autoplayTimer = null;
  };

  #pauseAutoplay = (reason) => {
    this.#pauseReasons.add(reason);
    this.#stopAutoplay();
  };

  #resumeAutoplay = (reason) => {
    this.#pauseReasons.delete(reason);
    this.#startAutoplay();
  };

  #handlePointerEnter = (event) => {
    if (event.pointerType === 'mouse') this.#pauseAutoplay('hover');
  };

  #handlePointerLeave = (event) => {
    if (event.pointerType === 'mouse') this.#resumeAutoplay('hover');
  };

  #handleInteractionStart = () => {
    this.#pauseAutoplay('interaction');
  };

  #handleInteractionEnd = () => {
    this.#resumeAutoplay('interaction');
  };

  #handleFocusIn = () => {
    this.#pauseAutoplay('focus');
  };

  #handleFocusOut = (event) => {
    if (event.relatedTarget instanceof Node && this.contains(event.relatedTarget)) return;
    this.#resumeAutoplay('focus');
  };

  #handleVisibilityChange = () => {
    if (document.hidden) {
      this.#pauseAutoplay('visibility');
    } else {
      this.#resumeAutoplay('visibility');
    }
  };

  #updateControls = () => {
    if (!this.#track) return;

    const maximumScroll = Math.max(0, this.#track.scrollWidth - this.#track.clientWidth);
    const hasOverflow = maximumScroll > 2;
    const scrollProgress = hasOverflow ? Math.min(1, Math.max(0, this.#track.scrollLeft / maximumScroll)) : 0;
    const thumbSize = hasOverflow ? Math.max(24, (this.#track.clientWidth / this.#track.scrollWidth) * 100) : 100;

    if (this.#nextButton) {
      this.#nextButton.hidden = !hasOverflow || scrollProgress > 0.98;
    }

    if (this.#progress) {
      this.#progress.hidden = !hasOverflow;
      this.#progress.style.setProperty('--upsell-progress-size', `${thumbSize}%`);
      this.#progress.style.setProperty('--upsell-progress-offset', `${scrollProgress * (100 - thumbSize)}%`);
    }

    if (!hasOverflow) this.#stopAutoplay();
  };
}

if (!customElements.get('cart-upsell')) {
  customElements.define('cart-upsell', CartUpsell);
}
