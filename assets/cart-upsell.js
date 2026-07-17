class CartUpsell extends HTMLElement {
  /** @type {HTMLElement | null} */
  #track = null;

  /** @type {HTMLButtonElement | null} */
  #nextButton = null;

  /** @type {HTMLElement | null} */
  #progress = null;

  #resizeObserver = new ResizeObserver(() => this.#updateControls());

  connectedCallback() {
    this.#track = this.querySelector('[data-cart-upsell-track]');
    this.#nextButton = this.querySelector('[data-cart-upsell-next]');
    this.#progress = this.querySelector('[data-cart-upsell-progress]');

    this.#nextButton?.addEventListener('click', this.#showNextProducts);
    this.#track?.addEventListener('scroll', this.#updateControls, { passive: true });

    if (this.#track) this.#resizeObserver.observe(this.#track);
    requestAnimationFrame(this.#updateControls);
  }

  disconnectedCallback() {
    this.#nextButton?.removeEventListener('click', this.#showNextProducts);
    this.#track?.removeEventListener('scroll', this.#updateControls);
    this.#resizeObserver.disconnect();
  }

  #showNextProducts = () => {
    if (!this.#track) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.#track.scrollBy({
      left: Math.max(240, this.#track.clientWidth * 0.75),
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
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
  };
}

if (!customElements.get('cart-upsell')) {
  customElements.define('cart-upsell', CartUpsell);
}
