// Калькулятор доставки и дополнительных услуг для оформления заказа
(function () {
  'use strict';

  const BASE_PRICE = 1291; // Базовая стоимость «Каркассон» со всеми скидками (1990 - 500 - 199)

  const deliveryRadios = document.querySelectorAll('input[name="delivery-method"]');
  const addonCheckboxes = document.querySelectorAll('input[name="delivery-addon"]');
  const calcTotalVal = document.getElementById('calc-total-val');
  const summaryDeliveryVal = document.getElementById('summary-delivery-val');
  const summaryAddonsRow = document.getElementById('summary-addons-row');
  const summaryAddonsVal = document.getElementById('summary-addons-val');
  const summaryTotalVal = document.getElementById('summary-total-val');
  const btnTotalVal = document.getElementById('btn-total-val');
  const pickupInfoBox = document.getElementById('checkout-pickup-info');
  const addressBox = document.getElementById('checkout-address-box');
  const addressInput = document.getElementById('order-address');

  function formatPrice(val) {
    return new Intl.NumberFormat('ru-RU').format(val) + ' руб.';
  }

  function recalculate() {
    let deliveryCost = 0;
    let selectedMethod = 'pickup';

    deliveryRadios.forEach((radio) => {
      const cardOption = radio.closest('.delivery-calc__option');
      if (cardOption) {
        cardOption.classList.toggle('delivery-calc__option--active', radio.checked);
      }
      if (radio.checked) {
        deliveryCost = Number(radio.dataset.price || 0);
        selectedMethod = radio.value;
      }
    });

    // Переключение способа получения (самовывоз vs доставка)
    if (selectedMethod === 'pickup') {
      if (pickupInfoBox) pickupInfoBox.style.display = 'flex';
      if (addressBox) addressBox.style.display = 'none';
      if (addressInput) addressInput.required = false;
    } else {
      if (pickupInfoBox) pickupInfoBox.style.display = 'none';
      if (addressBox) addressBox.style.display = 'flex';
      if (addressInput) addressInput.required = true;
    }

    let addonsCost = 0;
    addonCheckboxes.forEach((chk) => {
      if (chk.checked) {
        addonsCost += Number(chk.dataset.price || 0);
      }
    });

    const grandTotal = BASE_PRICE + deliveryCost + addonsCost;

    if (calcTotalVal) {
      calcTotalVal.textContent = formatPrice(grandTotal);
    }

    if (summaryDeliveryVal) {
      summaryDeliveryVal.textContent = deliveryCost === 0 ? '0 руб. (Бесплатно)' : formatPrice(deliveryCost);
    }

    if (summaryAddonsRow && summaryAddonsVal) {
      if (addonsCost > 0) {
        summaryAddonsRow.style.display = 'flex';
        summaryAddonsVal.textContent = `+${formatPrice(addonsCost)}`;
      } else {
        summaryAddonsRow.style.display = 'none';
      }
    }

    if (summaryTotalVal) {
      summaryTotalVal.textContent = formatPrice(grandTotal);
    }

    if (btnTotalVal) {
      btnTotalVal.textContent = formatPrice(grandTotal);
    }
  }

  deliveryRadios.forEach((radio) => {
    radio.addEventListener('change', recalculate);
  });

  addonCheckboxes.forEach((chk) => {
    chk.addEventListener('change', recalculate);
  });

  // Обработка отправки формы заказа
  const orderForm = document.querySelector('.order-form--page');
  if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!orderForm.checkValidity()) {
        orderForm.reportValidity();
        return;
      }
      if (typeof window.hkShowToast === 'function') {
        window.hkShowToast('Заказ успешно принят! Менеджер свяжется с вами в течение 10 минут.');
      }
      const successBlock = document.getElementById('order-page-success');
      if (successBlock) {
        successBlock.hidden = false;
        orderForm.style.display = 'none';
        window.scrollTo({ top: successBlock.offsetTop - 80, behavior: 'smooth' });
      } else {
        alert('Спасибо! Ваш заказ принят. Мы перезвоним для подтверждения.');
        orderForm.reset();
        recalculate();
      }
    });
  }

  recalculate();
})();
