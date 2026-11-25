// Каталог: фильтрация, сортировка, ползунок цен, фильтр избранного
(function () {
  'use strict';

  const header = document.querySelector('.site-header');
  const filtersForm = document.getElementById('catalog-filters-form');
  const resetButton = document.getElementById('reset-filters');
  const grid = document.getElementById('catalog-grid');
  if (!grid || !filtersForm) return;

  const cards = Array.from(grid.querySelectorAll('.product-card'));
  const countOutput = document.getElementById('catalog-count');
  const emptyMessage = document.getElementById('catalog-empty');
  const emptyResetBtn = document.getElementById('catalog-empty-reset');
  const sortSelect = document.getElementById('catalog-sort');
  const searchInput = document.getElementById('catalog-search');
  const filtersToggleBtn = document.getElementById('catalog-filters-toggle');
  const activeFiltersWrap = document.getElementById('catalog-active-filters');
  const wishlistChip = document.getElementById('catalog-wishlist-chip');

  // Ползунок цены
  const priceSlider = document.getElementById('price-range');
  const priceRangeVal = document.getElementById('price-range-val');
  const priceFromInput = document.getElementById('price-from');
  const priceToInput = document.getElementById('price-to');

  let filterOnlyWishlist = false;

  // Исходный порядок карточек для сортировки «По умолчанию»
  const originalOrder = new Map(cards.map((card, index) => [card, index]));

  function updateHeaderHeight() {
    if (header) {
      document.documentElement.style.setProperty('--header-height', header.offsetHeight + 'px');
    }
  }

  function formatPrice(val) {
    return new Intl.NumberFormat('ru-RU').format(val) + ' ₽';
  }

  function getSelectedCategories() {
    return Array.from(filtersForm.querySelectorAll('input[name="category"]:checked'))
      .map((input) => input.value);
  }

  function matchesFilters(card, categories, priceFrom, priceTo, onlyInStock, query) {
    const price = Number(card.dataset.price);
    const cardCategories = (card.dataset.category || '').split(' ');
    const cardId = card.dataset.product || card.querySelector('.product-card__favorite')?.dataset.id || '';

    // Фильтр только по избранному
    if (filterOnlyWishlist) {
      const wishlist = typeof window.hkGetWishlist === 'function' ? window.hkGetWishlist() : [];
      if (!wishlist.includes(cardId)) {
        return false;
      }
    }

    // Поисковый запрос
    if (query) {
      const titleText = (card.querySelector('.product-card__title')?.textContent || '').toLowerCase();
      const descText = (card.querySelector('.product-card__description')?.textContent || '').toLowerCase();
      if (!titleText.includes(query) && !descText.includes(query)) {
        return false;
      }
    }

    // Категории
    if (categories.length && !categories.some((c) => cardCategories.includes(c))) {
      return false;
    }
    if (!Number.isNaN(priceFrom) && price < priceFrom) return false;
    if (!Number.isNaN(priceTo) && price > priceTo) return false;
    if (onlyInStock && card.dataset.stock !== 'in') return false;
    return true;
  }

  function getSortedCards() {
    const mode = sortSelect ? sortSelect.value : 'default';
    const sorted = [...cards];

    sorted.sort((a, b) => {
      if (mode === 'price-asc') return Number(a.dataset.price) - Number(b.dataset.price);
      if (mode === 'price-desc') return Number(b.dataset.price) - Number(a.dataset.price);
      if (mode === 'rating-desc') return Number(b.dataset.rating) - Number(a.dataset.rating);
      return originalOrder.get(a) - originalOrder.get(b);
    });

    return sorted;
  }

  function applyCatalog() {
    const categories = getSelectedCategories();
    const priceFrom = parseFloat(priceFromInput?.value);
    const priceTo = parseFloat(priceToInput?.value);
    const onlyInStock = filtersForm.elements['in-stock']?.checked;
    const query = (searchInput?.value || '').trim().toLowerCase();

    let visibleCount = 0;

    getSortedCards().forEach((card) => {
      grid.appendChild(card);
      const visible = matchesFilters(card, categories, priceFrom, priceTo, onlyInStock, query);
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    if (activeFiltersWrap && wishlistChip) {
      wishlistChip.hidden = !filterOnlyWishlist;
      activeFiltersWrap.hidden = !filterOnlyWishlist;
    }

    if (countOutput) {
      if (filterOnlyWishlist) {
        countOutput.textContent = `В избранном показано: ${visibleCount} из ${cards.length}`;
      } else {
        countOutput.textContent = `Показано товаров: ${visibleCount} из ${cards.length}`;
      }
    }
    if (emptyMessage) {
      emptyMessage.hidden = visibleCount > 0;
    }
  }

  // Синхронизация ползунка и числовых инпутов
  if (priceSlider) {
    priceSlider.addEventListener('input', () => {
      const val = Number(priceSlider.value);
      if (priceRangeVal) {
        priceRangeVal.textContent = formatPrice(val);
      }
      if (priceToInput) {
        priceToInput.value = val;
      }
      applyCatalog();
    });
  }

  if (priceToInput) {
    priceToInput.addEventListener('input', () => {
      const val = Number(priceToInput.value);
      if (!Number.isNaN(val) && val >= 0) {
        if (priceSlider) {
          priceSlider.value = Math.min(Math.max(val, Number(priceSlider.min)), Number(priceSlider.max));
        }
        if (priceRangeVal) {
          priceRangeVal.textContent = formatPrice(val);
        }
      }
      applyCatalog();
    });
  }

  // Фильтр по избранному из других страниц или клика
  window.hkFilterWishlist = function () {
    filterOnlyWishlist = !filterOnlyWishlist;
    applyCatalog();
    if (filterOnlyWishlist) {
      if (typeof window.hkShowToast === 'function') {
        window.hkShowToast('Показаны только товары из вашего избранного');
      }
    } else {
      if (typeof window.hkShowToast === 'function') {
        window.hkShowToast('Показан весь каталог');
      }
    }
  };

  // Проверяем URL параметры ?filter=wishlist, ?category=..., ?q=...
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('filter') === 'wishlist') {
    filterOnlyWishlist = true;
  }
  const initialCategory = urlParams.get('category');
  if (initialCategory) {
    const catCheckbox = filtersForm.querySelector(`input[name="category"][value="${initialCategory}"]`);
    if (catCheckbox) catCheckbox.checked = true;
  }
  const initialQuery = urlParams.get('q');
  if (initialQuery && searchInput) {
    searchInput.value = initialQuery;
  }

  // Мобильный аккордеон фильтров
  if (filtersToggleBtn) {
    filtersToggleBtn.addEventListener('click', () => {
      const collapsed = filtersForm.classList.toggle('is-collapsed');
      filtersToggleBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    });
  }

  if (wishlistChip) {
    wishlistChip.addEventListener('click', () => {
      filterOnlyWishlist = false;
      applyCatalog();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', applyCatalog);
  }

  if (emptyResetBtn && resetButton) {
    emptyResetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      resetButton.click();
    });
  }

  filtersForm.addEventListener('submit', (event) => {
    event.preventDefault();
    applyCatalog();
  });
  filtersForm.addEventListener('change', applyCatalog);
  filtersForm.addEventListener('input', applyCatalog);
  if (sortSelect) {
    sortSelect.addEventListener('change', applyCatalog);
  }

  if (resetButton) {
    resetButton.addEventListener('click', () => {
      filterOnlyWishlist = false;
      if (searchInput) searchInput.value = '';
      setTimeout(() => {
        if (priceSlider) {
          priceSlider.value = priceSlider.max;
          if (priceRangeVal) priceRangeVal.textContent = formatPrice(priceSlider.max);
        }
        applyCatalog();
      }, 0);
    });
  }

  window.addEventListener('resize', updateHeaderHeight);
  updateHeaderHeight();
  applyCatalog();
})();
