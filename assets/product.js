document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.main-product').forEach(function (section) {
    initGallery(section);
    initQuantity(section);
    initTabs(section);
    initSubscribeSaveButton(section);
  });
});

function initGallery(section) {
  var mainImage = section.querySelector('[data-gallery-image]');
  if (!mainImage) return;

  var track = section.querySelector('[data-gallery-track]');

  function setGalleryImage(thumb) {
    if (!thumb) return;

    var imageUrl = thumb.getAttribute('data-gallery-thumb');
    if (!imageUrl) return;

    mainImage.src = imageUrl;

    var thumbImage = thumb.querySelector('img');
    if (thumbImage && thumbImage.alt) {
      mainImage.alt = thumbImage.alt;
    }

    section.querySelectorAll('[data-gallery-thumb]').forEach(function (button) {
      var isActive = button === thumb;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-current', isActive ? 'true' : 'false');
    });

    thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }

  function setGalleryImageFromVariant(variant) {
    if (!variant || !variant.featured_media) return;

    var mediaId = String(variant.featured_media.id);
    var thumb = section.querySelector('[data-gallery-thumb][data-media-id="' + mediaId + '"]');

    if (thumb) {
      setGalleryImage(thumb);
      return;
    }

    var preview = variant.featured_media.preview_image;
    if (!preview || !preview.src) return;

    var imageUrl = preview.src;
    if (imageUrl.indexOf('width=') === -1) {
      imageUrl += (imageUrl.indexOf('?') === -1 ? '?' : '&') + 'width=1100';
    }

    mainImage.src = imageUrl;
    if (preview.alt) {
      mainImage.alt = preview.alt;
    }
  }

  section.addEventListener('variant:update', function (event) {
    if (!event.detail || !event.detail.resource) return;
    setGalleryImageFromVariant(event.detail.resource);
  });

  if (!track) return;

  var prevBtn = section.querySelector('[data-gallery-prev]');
  var nextBtn = section.querySelector('[data-gallery-next]');

  function getScrollStep() {
    var firstThumb = track.querySelector('.product-gallery__thumb');
    if (!firstThumb) return track.clientWidth;
    var styles = window.getComputedStyle(track);
    var gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
    return firstThumb.offsetWidth + gap;
  }

  function updateNavState() {
    if (!prevBtn || !nextBtn) return;
    var maxScroll = track.scrollWidth - track.clientWidth;
    prevBtn.disabled = track.scrollLeft <= 1;
    nextBtn.disabled = track.scrollLeft >= maxScroll - 1;
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      track.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      track.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
    });
  }

  track.addEventListener('scroll', updateNavState, { passive: true });
  window.addEventListener('resize', updateNavState);
  updateNavState();

  section.addEventListener('click', function (event) {
    var thumb = event.target.closest('[data-gallery-thumb]');
    if (!thumb || !section.contains(thumb)) return;
    setGalleryImage(thumb);
  });
}

function initQuantity(section) {
  var qtyWrap = section.querySelector('[data-product-qty]');
  if (!qtyWrap) return;

  var input = qtyWrap.querySelector('input[name="quantity"]');
  var minusBtn = qtyWrap.querySelector('[data-qty-minus]');
  var plusBtn = qtyWrap.querySelector('[data-qty-plus]');
  if (!input || !minusBtn || !plusBtn) return;

  minusBtn.addEventListener('click', function () {
    var value = Math.max(1, parseInt(input.value || '1', 10) - 1);
    input.value = String(value);
  });

  plusBtn.addEventListener('click', function () {
    var value = Math.max(1, parseInt(input.value || '1', 10) + 1);
    input.value = String(value);
  });
}

function initTabs(section) {
  var tabs = section.querySelectorAll('[data-product-tab]');
  var panels = section.querySelectorAll('.product-tab-panel');
  if (!tabs.length) return;

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var targetId = tab.getAttribute('data-product-tab');
      if (!targetId) return;

      tabs.forEach(function (item) {
        item.classList.toggle('is-active', item === tab);
        item.setAttribute('aria-selected', item === tab ? 'true' : 'false');
      });

      panels.forEach(function (panel) {
        panel.classList.toggle('is-active', panel.id === targetId);
      });
    });
  });
}

function initSubscribeSaveButton(section) {
  var container = section.querySelector('[data-subscribe-save-button]');
  var button = container && container.querySelector('.main-product__subscribe-save-btn');
  var labelEl = button && button.querySelector('[data-subscribe-save-label]');
  var labelTextEl = button && button.querySelector('[data-subscribe-save-text]');
  var priceEl = button && button.querySelector('.dynamic-subscribe-price');
  if (!container || !button || !labelEl || !labelTextEl || !priceEl) return;

  var labelPrefix = container.dataset.buttonLabelPrefix || 'Subscribe & Save';
  var outOfStockLabel = container.dataset.outOfStockLabel || 'Out of stock';
  var fallbackOneTimePrice = container.dataset.onetimePrice || container.dataset.variantPrice || '';
  var fallbackSubscribePrice = container.dataset.subscribePrice || '';
  var isApplying = false;
  var lastSelectedOption = null;
  var subifyClickDelays = [50, 150, 350, 600];

  function isValidPrice(price) {
    if (!price) return false;
    var amount = parseFloat(String(price).replace(/[^0-9.]/g, ''));
    return !isNaN(amount) && amount > 0;
  }

  function isInvalidPrice(text) {
    var value = String(text || '').replace(/\s+/g, ' ').trim();
    if (!value) return true;
    if (/^\$0\.00$/.test(value)) return true;
    if (/^0(\.00)?$/.test(value)) return true;
    return false;
  }

  function parseAmount(price) {
    return parseFloat(String(price).replace(/[^0-9.]/g, ''));
  }

  function getCurrentQuantity() {
    var quantityInput = section.querySelector('input[name="quantity"]');
    if (!quantityInput) return 1;
    return Math.max(1, parseInt(quantityInput.value, 10) || 1);
  }

  function formatPriceForQuantity(unitPrice, quantity) {
    if (!isValidPrice(unitPrice) || quantity <= 1) return unitPrice;

    var total = parseAmount(unitPrice) * quantity;
    var priceStr = String(unitPrice).trim();
    var match = priceStr.match(/^([^\d]*?)([\d,]+(?:\.\d+)?)(.*)$/);

    if (!match) return unitPrice;

    var prefix = match[1];
    var suffix = match[3] || '';
    var decimals = (match[2].split('.')[1] || '').length || 2;
    var formatted = total.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return prefix + formatted + suffix;
  }

  function extractPrices(text) {
    var matches = String(text).match(/\$[\d,]+(?:\.\d{2})?/g) || [];
    return matches.filter(isValidPrice);
  }

  function getSubifyActiveOption() {
    return (
      section.querySelector('.subify-minimal-option.active') ||
      section.querySelector('.subify-minimal-option.is-active') ||
      section.querySelector('.subify-minimal-option[aria-checked="true"]') ||
      section.querySelector('.subify-minimal-option.selected')
    );
  }

  function getPriceFromSubifyOption(option) {
    if (!option) return '';

    var priceElement = option.querySelector(
      '.subify-minimal-price:not(.subify-minimal-original-price)'
    );
    if (priceElement) {
      var directPrice = priceElement.textContent.replace(/\s+/g, ' ').trim();
      if (isValidPrice(directPrice)) return directPrice;
    }

    var salePrice = option.querySelector('.subify-minimal-price');
    if (salePrice) {
      var saleText = salePrice.textContent.replace(/\s+/g, ' ').trim();
      if (isValidPrice(saleText)) return saleText;
    }

    var optionPrices = extractPrices(option.textContent);
    return optionPrices.length ? optionPrices[optionPrices.length - 1] : '';
  }

  function getSubifyPrice() {
    var activeOption = getSubifyActiveOption();
    if (!activeOption) return '';
    return getPriceFromSubifyOption(activeOption);
  }

  function getPurchaseOptions() {
    return Array.prototype.slice.call(section.querySelectorAll('.purchase-option'));
  }

  function getOptionLabel(row) {
    if (!row) return '';
    var nameEl = row.querySelector('.purchase-option__name');
    return (nameEl ? nameEl.textContent : row.textContent).replace(/\s+/g, ' ').trim();
  }

  function isSubscribeRow(row) {
    var label = getOptionLabel(row);
    return /subscribe|subscription|recurring/i.test(label) && !/one.?time/i.test(label);
  }

  function isOneTimeRow(row) {
    return /one.?time/i.test(getOptionLabel(row));
  }

  function isSubscriptionSelected() {
    var activeOption = getSubifyActiveOption();

    if (activeOption) {
      if (activeOption.classList.contains('subscription-option')) return true;
      if (activeOption.classList.contains('one-time-purchase-option')) return false;

      var optionText = activeOption.textContent.toLowerCase();
      if (/one.?time/.test(optionText)) return false;
      if (/subscribe|subscription|recurring/.test(optionText)) return true;
    }

    var selectedRow = getSelectedRow();
    if (selectedRow) {
      if (isOneTimeRow(selectedRow)) return false;
      if (isSubscribeRow(selectedRow)) return true;
    }

    return false;
  }

  function pickPriceForRow(prices, row) {
    if (!prices.length) return '';

    if (isSubscribeRow(row)) {
      return prices.reduce(function (cheapest, price) {
        return parseAmount(price) < parseAmount(cheapest) ? price : cheapest;
      });
    }

    return prices[0];
  }

  function getPriceFromRow(row) {
    if (!row || row.contains(button)) return '';

    var rowPriceEl = row.querySelector('.purchase-option__price');
    if (rowPriceEl) {
      var prices = extractPrices(rowPriceEl.textContent);
      var picked = pickPriceForRow(prices, row);
      if (isValidPrice(picked)) return picked;
    }

    var rowPrices = extractPrices(row.textContent);
    var rowPicked = pickPriceForRow(rowPrices, row);
    return isValidPrice(rowPicked) ? rowPicked : '';
  }

  function syncLastSelectedFromDom() {
    var subifyActive = getSubifyActiveOption();
    if (subifyActive) {
      lastSelectedOption = null;
      return;
    }

    var options = getPurchaseOptions();
    if (!options.length) return;

    var selected =
      section.querySelector('.purchase-option.is-selected') ||
      options.find(function (option) {
        var input = option.querySelector('input[type="radio"], input[type="checkbox"]');
        return input && input.checked;
      });

    if (selected) {
      lastSelectedOption = selected;
    }
  }

  function getSelectedRow() {
    if (lastSelectedOption && section.contains(lastSelectedOption)) {
      return lastSelectedOption;
    }

    syncLastSelectedFromDom();
    if (lastSelectedOption) return lastSelectedOption;

    var checkedInput = section.querySelector('.purchase-option input:checked');
    if (checkedInput) {
      return checkedInput.closest('.purchase-option');
    }

    return section.querySelector('.purchase-option.is-selected');
  }

  function getSelectedPrice() {
    var subifyPrice = getSubifyPrice();
    if (isValidPrice(subifyPrice)) return subifyPrice;

    var selectedRow = getSelectedRow();

    if (selectedRow) {
      var rowPrice = getPriceFromRow(selectedRow);
      if (isValidPrice(rowPrice)) return rowPrice;

      if (isSubscribeRow(selectedRow) && isValidPrice(fallbackSubscribePrice)) {
        return fallbackSubscribePrice;
      }

      if (isOneTimeRow(selectedRow) && isValidPrice(fallbackOneTimePrice)) {
        return fallbackOneTimePrice;
      }
    }

    if (isValidPrice(fallbackOneTimePrice)) return fallbackOneTimePrice;
    return '';
  }

  function isVariantAvailable() {
    var availabilityState =
      button.getAttribute('data-variant-available') || container.getAttribute('data-variant-available');

    if (availabilityState === 'true') return true;
    if (availabilityState === 'false') return false;

    return !button.disabled;
  }

  function setVariantAvailability(isAvailable) {
    var availabilityState = isAvailable ? 'true' : 'false';
    container.setAttribute('data-variant-available', availabilityState);
    button.setAttribute('data-variant-available', availabilityState);
  }

 function syncButtonLabel(price) {
  var isAvailable = isVariantAvailable();

  if (!isAvailable) {
    labelTextEl.textContent = outOfStockLabel;
    priceEl.hidden = true;
    button.setAttribute('aria-label', outOfStockLabel);
    button.classList.add('is-out-of-stock');
    return;
  }

  // Default label
  var buttonLabel = 'Quick Cart';

  // Check which Subify option is active
  var activeOption = getSubifyActiveOption();

  if (activeOption) {
    if (activeOption.classList.contains('subscription-option')) {
      buttonLabel = 'Subscribe & Save';
    } else if (activeOption.classList.contains('one-time-purchase-option')) {
      buttonLabel = 'Quick Cart';
    } else {
      // Fallback by text
      var optionText = activeOption.textContent.toLowerCase();

      if (
        optionText.includes('subscribe') ||
        optionText.includes('subscription')
      ) {
        buttonLabel = 'Subscribe & Save';
      } else if (optionText.includes('one-time')) {
        buttonLabel = 'Quick Cart';
      }
    }
  } else {
    var selectedRow = getSelectedRow();
    if (selectedRow && isSubscribeRow(selectedRow)) {
      buttonLabel = 'Subscribe & Save';
    }
  }

  button.classList.remove('is-out-of-stock');

  if (isSubscriptionSelected()) {
    labelTextEl.textContent = buttonLabel;
    priceEl.hidden = true;
    button.setAttribute('aria-label', buttonLabel);
    return;
  }

  labelTextEl.textContent = buttonLabel + ' –';
  priceEl.hidden = false;

  if (isValidPrice(price)) {
    button.setAttribute('aria-label', buttonLabel + ' – ' + price);
  } else {
    button.setAttribute('aria-label', buttonLabel);
  }
}

  function applyPrice() {
    if (isApplying) return;

    if (isSubscriptionSelected()) {
      syncButtonLabel('');
      return;
    }

    var unitPrice = getSelectedPrice();
    var price = formatPriceForQuantity(unitPrice, getCurrentQuantity());
    syncButtonLabel(price);

    if (!isVariantAvailable()) return;
    if (!isValidPrice(price)) return;

    var currentPrice = priceEl.textContent.replace(/\s+/g, ' ').trim();
    if (currentPrice === price) return;

    isApplying = true;
    priceEl.textContent = price;
    syncButtonLabel(price);
    isApplying = false;
  }

  function schedulePriceUpdate(useSubifyDelays) {
    syncLastSelectedFromDom();
    requestAnimationFrame(applyPrice);

    var delays = useSubifyDelays ? subifyClickDelays : [50, 150, 350];
    delays.forEach(function (delay) {
      window.setTimeout(applyPrice, delay);
    });
  }

  function handleOptionInteraction(event) {
    var subifyOption = event.target.closest('.subify-minimal-option');
    if (subifyOption && section.contains(subifyOption)) {
      lastSelectedOption = null;
      schedulePriceUpdate(true);
      return;
    }

    var option = event.target.closest('.purchase-option');
    if (!option || !section.contains(option)) return;

    lastSelectedOption = option;
    schedulePriceUpdate(false);
  }

  applyPrice();

  section.addEventListener('click', handleOptionInteraction, true);
  section.addEventListener('change', function (event) {
    if (
      event.target.matches(
        '.purchase-option input, .subify-minimal-option input, input[name="selling_plan"], input[data-selling-plan-id]'
      )
    ) {
      var subifyOption = event.target.closest('.subify-minimal-option');
      if (subifyOption) {
        lastSelectedOption = null;
        schedulePriceUpdate(true);
        return;
      }

      var option = event.target.closest('.purchase-option');
      if (option) lastSelectedOption = option;
      schedulePriceUpdate(false);
    }
  });

  var purchaseRoot = section.querySelector('.purchase-options, [class*="subify"]');
  if (purchaseRoot) {
    var purchaseDebounce;
    var purchaseObserver = new MutationObserver(function () {
      clearTimeout(purchaseDebounce);
      purchaseDebounce = setTimeout(function () {
        syncLastSelectedFromDom();
        applyPrice();
      }, 50);
    });
    purchaseObserver.observe(purchaseRoot, {
      attributes: true,
      attributeFilter: ['class', 'aria-checked'],
      subtree: true,
    });
  }

  var subifyLoadTarget = section.querySelector('.main-product__details') || section;
  var subifyLoadDebounce;
  var subifyLoadObserver = new MutationObserver(function () {
    if (!section.querySelector('.subify-minimal-option')) return;

    clearTimeout(subifyLoadDebounce);
    subifyLoadDebounce = setTimeout(function () {
      applyPrice();
    }, 100);
  });
  subifyLoadObserver.observe(subifyLoadTarget, { childList: true, subtree: true });

  var restoreTimer;
  var priceObserver = new MutationObserver(function () {
    if (isApplying) return;

    if (isInvalidPrice(priceEl.textContent)) {
      clearTimeout(restoreTimer);
      restoreTimer = setTimeout(applyPrice, 0);
    }
  });

  priceObserver.observe(priceEl, { childList: true, characterData: true, subtree: true });

  section.addEventListener('variant:update', function (event) {
    var isAvailable = !!(event.detail && event.detail.resource && event.detail.resource.available);
    setVariantAvailability(isAvailable);
    applyPrice();
  });

  section.addEventListener('quantity-selector:update', function (event) {
    if (event.detail && event.detail.cartLine) return;
    if (!section.contains(event.target)) return;
    applyPrice();
  });

  [100, 300, 600, 1200, 2500, 4000].forEach(function (delay) {
    window.setTimeout(applyPrice, delay);
  });
}
