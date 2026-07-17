import { Component } from '@theme/component';

/**
 * Sticky horizontal navigation for the FAQ page. Highlights the link for
 * whichever FAQ category section is currently in view, and highlights a
 * link immediately when clicked (native smooth anchor scrolling handles
 * the actual scroll, via the theme's global `scroll-behavior: smooth`).
 *
 * @typedef {Object} Refs
 * @property {HTMLAnchorElement[]} [links]
 *
 * @extends {Component<Refs>}
 */
class FaqPageNav extends Component {
  requiredRefs = ['links'];

  /** @type {IntersectionObserver | null} */
  #observer = null;

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('click', this.#handleClick);
    this.#observeSections();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.#observer?.disconnect();
  }

  get links() {
    return this.refs.links || [];
  }

  #observeSections() {
    /** @type {[HTMLElement, HTMLAnchorElement][]} */
    const sectionLinkPairs = [];

    for (const link of this.links) {
      const id = link.getAttribute('href')?.slice(1);
      const section = id ? document.getElementById(id) : null;

      if (section) sectionLinkPairs.push([section, link]);
    }

    if (!sectionLinkPairs.length) return;

    const navHeight = this.offsetHeight || 0;

    this.#observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          const pair = sectionLinkPairs.find(([section]) => section === entry.target);
          if (pair) this.#setActiveLink(pair[1]);
        }
      },
      {
        root: null,
        rootMargin: `-${navHeight + 1}px 0px -70% 0px`,
        threshold: 0,
      }
    );

    for (const [section] of sectionLinkPairs) {
      this.#observer.observe(section);
    }
  }

  /** @param {MouseEvent} event */
  #handleClick = (event) => {
    const target = /** @type {HTMLElement} */ (event.target);
    const link = target.closest('a');

    if (!link || !this.links.includes(/** @type {HTMLAnchorElement} */ (link))) return;

    this.#setActiveLink(/** @type {HTMLAnchorElement} */ (link));
  };

  /** @param {HTMLAnchorElement} activeLink */
  #setActiveLink(activeLink) {
    for (const link of this.links) {
      const isActive = link === activeLink;
      link.classList.toggle('is-active', isActive);
      link.setAttribute('aria-current', isActive ? 'true' : 'false');
    }
  }
}

if (!customElements.get('faq-page-nav')) {
  customElements.define('faq-page-nav', FaqPageNav);
}
