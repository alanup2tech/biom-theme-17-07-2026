import { DialogComponent, DialogOpenEvent, DialogCloseEvent } from '@theme/dialog';
import { CartAddEvent } from '@theme/events';
import { isMobileBreakpoint } from '@theme/utilities';

/**
 * A custom element that manages a cart drawer.
 *
 * @typedef {object} Refs
 * @property {HTMLDialogElement} dialog - The dialog element.
 * @property {HTMLElement} [liveRegion] - The live region for cart announcements when dialog is open.
 *
 * @extends {DialogComponent}
 */
class CartDrawerComponent extends DialogComponent {
  /** @type {number} */
  #summaryThreshold = 0.5;

  /** @type {AbortController | null} */
  #historyAbortController = null;

  /** @type {number | null} */
  #stickyStateFrame = null;

  #summaryResizeObserver = new ResizeObserver(() => this.#scheduleStickyStateUpdate());

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener(CartAddEvent.eventName, this.#handleCartAdd);
    this.addEventListener(DialogOpenEvent.eventName, this.#handleDialogOpen);
    this.addEventListener(DialogCloseEvent.eventName, this.#handleDialogClose);
    this.addEventListener(DialogOpenEvent.eventName, this.#handleHistoryOpen);
    this.addEventListener(DialogCloseEvent.eventName, this.#handleHistoryClose);

    if (history.state?.cartDrawerOpen) {
      history.replaceState(null, '');
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener(CartAddEvent.eventName, this.#handleCartAdd);
    this.removeEventListener(DialogOpenEvent.eventName, this.#handleDialogOpen);
    this.removeEventListener(DialogCloseEvent.eventName, this.#handleDialogClose);
    this.removeEventListener(DialogOpenEvent.eventName, this.#handleHistoryOpen);
    this.removeEventListener(DialogCloseEvent.eventName, this.#handleHistoryClose);
    this.#historyAbortController?.abort();
    this.#summaryResizeObserver.disconnect();
    this.#cancelStickyStateUpdate();
  }

  #handleHistoryOpen = () => {
    if (!isMobileBreakpoint()) return;

    if (!history.state?.cartDrawerOpen) {
      history.pushState({ cartDrawerOpen: true }, '');
    }

    this.#historyAbortController = new AbortController();
    window.addEventListener('popstate', this.#handlePopState, { signal: this.#historyAbortController.signal });
  };

  #handleHistoryClose = () => {
    this.#historyAbortController?.abort();
    if (history.state?.cartDrawerOpen) {
      history.back();
    }
  };

  #handlePopState = async () => {
    if (this.refs.dialog?.open) {
      this.refs.dialog.style.setProperty('--dialog-drawer-closing-animation', 'none');
      await this.closeDialog();
      this.refs.dialog.style.removeProperty('--dialog-drawer-closing-animation');
    }
  };

  /**
   * Handles cart add events - opens drawer if auto-open and announces count when open.
   * @param {CustomEvent<{ resource?: { item_count?: number } }>} event
   */
  #handleCartAdd = (event) => {
    if (this.hasAttribute('auto-open')) {
      this.showDialog();
    }

    // The cart section morphs during this event. Reconnect the observer on the
    // next frame so async payment buttons and the morphed summary are measured.
    requestAnimationFrame(this.#handleDialogOpen);

    this.#announceCartCount(event.detail.resource?.item_count);
  };

  #handleDialogOpen = () => {
    const { dialog } = /** @type {Refs} */ (this.refs);
    if (!dialog?.open) return;

    this.#summaryResizeObserver.disconnect();
    this.#summaryResizeObserver.observe(dialog);

    const summary = dialog.querySelector('.cart-drawer__summary');
    if (summary instanceof HTMLElement) {
      this.#summaryResizeObserver.observe(summary);
    }

    this.#scheduleStickyStateUpdate();
  };

  #handleDialogClose = () => {
    this.#summaryResizeObserver.disconnect();
    this.#cancelStickyStateUpdate();
  };

  #scheduleStickyStateUpdate = () => {
    if (this.#stickyStateFrame !== null) return;

    this.#stickyStateFrame = requestAnimationFrame(() => {
      this.#stickyStateFrame = null;
      this.#updateStickyState();
    });
  };

  #cancelStickyStateUpdate = () => {
    if (this.#stickyStateFrame === null) return;

    cancelAnimationFrame(this.#stickyStateFrame);
    this.#stickyStateFrame = null;
  };

  /**
   * Announces cart count to screen readers when dialog is open.
   * @param {number | undefined} cartCount
   */
  #announceCartCount(cartCount) {
    const liveRegion = /** @type {HTMLElement | undefined} */ (this.refs.liveRegion);
    if (!this.refs.dialog?.open || !liveRegion || cartCount === undefined) return;

    liveRegion.textContent = `${Theme.translations.cart_count}: ${cartCount}`;
  }

  open() {
    this.showDialog();

    /**
     * Close cart drawer when installments CTA is clicked to avoid overlapping dialogs
     */
    customElements.whenDefined('shopify-payment-terms').then(() => {
      const installmentsContent = document.querySelector('shopify-payment-terms')?.shadowRoot;
      const cta = installmentsContent?.querySelector('#shopify-installments-cta');
      cta?.addEventListener('click', this.closeDialog, { once: true });
    });
  }

  close() {
    this.closeDialog();
  }

  #updateStickyState() {
    const { dialog } = /** @type {Refs} */ (this.refs);
    if (!dialog?.open) return;

    // Refs do not cross nested `*-component` boundaries (e.g., `cart-items-component`), so we query within the dialog.
    const content = dialog.querySelector('.cart-drawer__content');
    const summary = dialog.querySelector('.cart-drawer__summary');

    if (!content || !summary) {
      // Ensure the dialog doesn't get stuck in "unsticky" mode when summary disappears (e.g., empty cart).
      dialog.setAttribute('cart-summary-sticky', 'false');
      return;
    }

    // The recommendation carousel must remain fully visible. A sticky summary
    // would shrink the items region into a nested vertical scroller and clip it.
    if (dialog.querySelector('.cart-drawer__upsell')) {
      dialog.setAttribute('cart-summary-sticky', 'false');
      return;
    }

    const drawerHeight = dialog.getBoundingClientRect().height;
    const summaryHeight = summary.getBoundingClientRect().height;
    if (drawerHeight <= 0) return;

    const ratio = summaryHeight / drawerHeight;
    const nextStickyState = ratio > this.#summaryThreshold ? 'false' : 'true';

    if (dialog.getAttribute('cart-summary-sticky') !== nextStickyState) {
      dialog.setAttribute('cart-summary-sticky', nextStickyState);
    }
  }
}

if (!customElements.get('cart-drawer-component')) {
  customElements.define('cart-drawer-component', CartDrawerComponent);
}
