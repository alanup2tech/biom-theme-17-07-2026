import { fetchConfig } from '@theme/utilities';
import { CartAddEvent } from '@theme/events';

const SHARE_PARAM = 'share_cart';
const STORAGE_PREFIX = 'biom_shared_cart_';

/**
 * @returns {string[]}
 */
function getCartSectionIds() {
  /** @type {string[]} */
  const sectionIds = [];
  document.querySelectorAll('cart-items-component').forEach((item) => {
    if (item instanceof HTMLElement && item.dataset.sectionId) {
      sectionIds.push(item.dataset.sectionId);
    }
  });
  return sectionIds;
}

/**
 * @param {Array<{ id: number, quantity: number, selling_plan?: number }>} items
 */
async function addItemsToCart(items) {
  const sectionIds = getCartSectionIds();
  const payload = {
    items,
    ...(sectionIds.length ? { sections: sectionIds.join(',') } : {}),
  };

  const response = await fetch(Theme.routes.cart_add_url, {
    ...fetchConfig('json', { body: JSON.stringify(payload) }),
  });

  return response.json();
}

/**
 * @param {Array<{ variant_id: number, quantity: number, selling_plan_allocation?: { selling_plan?: { id?: number } } }>} items
 */
function buildShareCartParam(items) {
  return items
    .map((item) => {
      const planId = item.selling_plan_allocation?.selling_plan?.id;
      return planId ? `${item.variant_id}:${item.quantity}:${planId}` : `${item.variant_id}:${item.quantity}`;
    })
    .join(',');
}

/**
 * @param {string} value
 * @returns {Array<{ id: number, quantity: number, selling_plan?: number }>}
 */
function parseShareCartParam(value) {
  return value
    .split(',')
    .map((part) => {
      const segments = part.trim().split(':');
      const variantId = Number(segments[0]);
      const quantity = Number(segments[1]);
      const sellingPlan = segments[2] ? Number(segments[2]) : undefined;

      if (!variantId || !quantity || quantity < 1) return null;

      /** @type {{ id: number, quantity: number, selling_plan?: number }} */
      const item = { id: variantId, quantity };
      if (sellingPlan) item.selling_plan = sellingPlan;
      return item;
    })
    .filter((item) => item !== null);
}

/**
 * @param {string} cartParam
 */
function buildShareUrl(cartParam) {
  const root = (window.Shopify?.routes?.root || '/').replace(/\/$/, '');
  const url = new URL(`${window.location.origin}${root || ''}`);
  url.searchParams.set(SHARE_PARAM, cartParam);
  return url.toString();
}

function cleanShareParamFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(SHARE_PARAM)) return;

  url.searchParams.delete(SHARE_PARAM);
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

/**
 * @param {HTMLButtonElement} button
 */
function showCopiedFeedback(button) {
  const copiedLabel = Theme.translations.cart_link_copied || 'Link copied!';
  const originalLabel = button.getAttribute('aria-label') || '';
  const originalTitle = button.getAttribute('title') || '';

  button.classList.add('is-copied');
  button.setAttribute('aria-label', copiedLabel);
  button.setAttribute('title', copiedLabel);

  window.setTimeout(() => {
    button.classList.remove('is-copied');
    button.setAttribute('aria-label', originalLabel);
    button.setAttribute('title', originalTitle);
  }, 2000);
}

/**
 * @param {HTMLButtonElement} button
 */
async function handleShareClick(button) {
  try {
    button.disabled = true;

    const response = await fetch(`${Theme.routes.cart_url}.js`);
    const cart = await response.json();

    if (!cart.items?.length) return;

    const shareParam = buildShareCartParam(cart.items);
    const shareUrl = buildShareUrl(shareParam);

    if (navigator.share) {
      await navigator.share({
        title: Theme.translations.share_cart_title || 'Shared cart',
        url: shareUrl,
      });
    } else {
      await navigator.clipboard.writeText(shareUrl);
      showCopiedFeedback(button);
    }
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error('Failed to share cart:', error);
    }
  } finally {
    button.disabled = false;
  }
}

async function loadSharedCart() {
  const shareParam = new URLSearchParams(window.location.search).get(SHARE_PARAM);
  if (!shareParam) return;

  const storageKey = `${STORAGE_PREFIX}${shareParam}`;
  if (sessionStorage.getItem(storageKey)) {
    cleanShareParamFromUrl();
    return;
  }

  const items = parseShareCartParam(shareParam);
  if (!items.length) {
    cleanShareParamFromUrl();
    return;
  }

  sessionStorage.setItem(storageKey, '1');
  cleanShareParamFromUrl();

  try {
    const addResponse = await addItemsToCart(items);
    if (addResponse.status) {
      console.error('Failed to load shared cart:', addResponse.message);
      return;
    }

    const cartResponse = await fetch(`${Theme.routes.cart_url}.js`);
    const cart = await cartResponse.json();

    document.dispatchEvent(
      new CartAddEvent(cart, 'cart-share', {
        source: 'cart-share',
        itemCount: cart.item_count,
        sections: addResponse.sections,
      })
    );

    const cartDrawer = document.querySelector('cart-drawer-component');
    if (cartDrawer instanceof HTMLElement && 'open' in cartDrawer && typeof cartDrawer.open === 'function') {
      cartDrawer.open();
    }
  } catch (error) {
    console.error('Failed to load shared cart:', error);
  }
}

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const button = target.closest('.button--cart__share');
  if (!(button instanceof HTMLButtonElement)) return;

  event.preventDefault();
  handleShareClick(button);
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadSharedCart);
} else {
  loadSharedCart();
}
