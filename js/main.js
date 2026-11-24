// Основной скрипт магазина «Ход конём»: Личный кабинет, Избранное, Уведомления, Модальные окна
(function () {
  'use strict';

  // --- 1. Избранное (Wishlist) в localStorage ---
  const STORAGE_KEY = 'hk_wishlist';

  function getWishlist() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function setWishlist(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Игнорируем ошибки квот localStorage
    }
    updateWishlistUI();
  }

  function isInWishlist(id) {
    return getWishlist().includes(id);
  }

  function toggleWishlist(id, name) {
    let items = getWishlist();
    const index = items.indexOf(id);
    let added = false;
    if (index >= 0) {
      items.splice(index, 1);
    } else {
      items.push(id);
      added = true;
    }
    setWishlist(items);

    const displayName = name || 'Товар';
    showToast(added ? `«${displayName}» добавлен в избранное ❤️` : `«${displayName}» удалён из избранного`);
    return added;
  }

  function updateWishlistUI() {
    const items = getWishlist();
    const count = items.length;

    // Счётчики в шапке и профиле
    document.querySelectorAll('#wishlist-badge, .header-wishlist-badge').forEach((badge) => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    });

    const profileCount = document.getElementById('profile-wishlist-count');
    if (profileCount) {
      profileCount.textContent = count;
    }

    // Кнопки на карточках товаров
    document.querySelectorAll('.product-card__favorite').forEach((btn) => {
      const card = btn.closest('.product-card');
      const id = btn.dataset.id || (card && card.dataset.product) || '';
      const isFav = items.includes(id);
      btn.classList.toggle('product-card__favorite--active', isFav);
      btn.setAttribute('aria-pressed', isFav ? 'true' : 'false');
      btn.setAttribute('title', isFav ? 'Удалить из избранного' : 'Добавить в избранное');
    });

    // Кнопка на странице товара (product.html)
    const productPageFavBtn = document.getElementById('product-page-fav-btn');
    const productPageFavText = document.getElementById('product-page-fav-text');
    if (productPageFavBtn) {
      const prodId = productPageFavBtn.dataset.id || 'carcassonne';
      const isFav = items.includes(prodId);
      productPageFavBtn.classList.toggle('product-card__favorite--active', isFav);
      if (productPageFavText) {
        productPageFavText.textContent = isFav ? 'В избранном ❤️' : 'В избранное';
      }
    }
  }

  // --- 2. Всплывающее уведомление (Toast) ---
  let toastTimer = null;
  function showToast(message) {
    let toast = document.getElementById('shop-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'shop-toast';
      toast.className = 'shop-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('shop-toast--visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('shop-toast--visible');
    }, 2800);
  }

  // Экспорт для других скриптов
  window.hkGetWishlist = getWishlist;
  window.hkShowToast = showToast;
  window.hkToggleWishlist = toggleWishlist;
  window.hkUpdateWishlistUI = updateWishlistUI;

  // --- 3. Личный кабинет (Profile Dialog) ---
  function initProfileDialog() {
    const profileDialog = document.getElementById('profile-dialog');
    const profileBtn = document.getElementById('header-profile-btn');

    if (profileBtn && profileDialog) {
      profileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        updateWishlistUI();
        if (typeof profileDialog.showModal === 'function') {
          profileDialog.showModal();
        } else {
          profileDialog.setAttribute('open', '');
        }
      });
    }

    if (profileDialog) {
      profileDialog.addEventListener('click', (e) => {
        const rect = profileDialog.getBoundingClientRect();
        const isInDialog = (
          rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX && e.clientX <= rect.left + rect.width
        );
        if (!isInDialog) {
          profileDialog.close();
        }
      });
    }
  }

  // --- 4. Обработка кликов по кнопкам «Избранное» ---
  function initWishlistListeners() {
    document.addEventListener('click', (e) => {
      const favBtn = e.target.closest('.product-card__favorite');
      if (favBtn) {
        e.preventDefault();
        e.stopPropagation();
        const card = favBtn.closest('.product-card');
        const id = favBtn.dataset.id || (card && card.dataset.product) || 'game-' + Date.now();
        const titleEl = card ? card.querySelector('.product-card__title a, .product-card__title') : null;
        const title = titleEl ? titleEl.textContent.trim() : 'Настольная игра';
        toggleWishlist(id, title);
        return;
      }

      const prodPageBtn = e.target.closest('#product-page-fav-btn');
      if (prodPageBtn) {
        e.preventDefault();
        const id = prodPageBtn.dataset.id || 'carcassonne';
        const titleEl = document.querySelector('.product__title');
        const title = titleEl ? titleEl.textContent.trim() : 'Каркассон';
        toggleWishlist(id, title);
        return;
      }

      const headerWishlistBtn = e.target.closest('#header-wishlist-btn');
      if (headerWishlistBtn) {
        e.preventDefault();
        const count = getWishlist().length;
        if (window.location.pathname.includes('catalog.html')) {
          if (typeof window.hkFilterWishlist === 'function') {
            window.hkFilterWishlist();
          } else {
            showToast(`В избранном сейчас: ${count} шт.`);
          }
        } else {
          if (count === 0) {
            showToast('В избранном пока нет товаров. Добавьте понравившиеся в каталоге!');
          } else {
            window.location.href = 'catalog.html?filter=wishlist';
          }
        }
      }
    });
  }

  // --- 5. Модальное окно быстрого заказа (index.html) ---
  function initOrderDialog() {
    const orderDialog = document.getElementById('order-dialog');
    const orderButtons = document.querySelectorAll('.product-card__button');
    const closeDialogButton = document.getElementById('close-order-dialog');
    const selectedProductInput = document.getElementById('selected-product');
    const orderForm = document.getElementById('order-form');
    const successMessage = document.getElementById('success-message');

    if (orderDialog && orderButtons.length > 0) {
      orderButtons.forEach((button) => {
        button.addEventListener('click', () => {
          if (selectedProductInput) {
            selectedProductInput.value = button.dataset.product || '';
          }
          if (typeof orderDialog.showModal === 'function') {
            orderDialog.showModal();
          } else {
            orderDialog.setAttribute('open', '');
          }
        });
      });
    }

    if (closeDialogButton && orderDialog) {
      closeDialogButton.addEventListener('click', () => {
        orderDialog.close();
      });
    }

    if (orderForm && orderDialog) {
      orderForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formElements = Array.from(orderForm.elements);
        formElements.forEach((element) => {
          if (element.willValidate) {
            element.removeAttribute('aria-invalid');
          }
        });

        if (!orderForm.checkValidity()) {
          formElements.forEach((element) => {
            if (element.willValidate && !element.checkValidity()) {
              element.setAttribute('aria-invalid', 'true');
            }
          });
          orderForm.reportValidity();
          return;
        }

        if (successMessage) {
          successMessage.hidden = false;
        }
        showToast('Заказ успешно оформлен! Наш оператор свяжется с вами.');
        orderForm.reset();
        orderDialog.close();
      });
    }
  }

  // --- 6. Инициализация при загрузке страницы ---
  function init() {
    updateWishlistUI();
    initProfileDialog();
    initWishlistListeners();
    initOrderDialog();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
