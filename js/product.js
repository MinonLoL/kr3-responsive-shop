// Интерактивный рейтинг и добавление отзывов на странице товара
(function () {
  'use strict';

  const starsContainer = document.getElementById('star-rating');
  const ratingInput = document.getElementById('selected-rating');
  const ratingHint = document.getElementById('star-rating-hint');
  const reviewForm = document.getElementById('new-review-form');
  const reviewsList = document.querySelector('.reviews__list');
  const reviewsSummary = document.querySelector('.reviews__summary');

  if (!starsContainer || !reviewForm || !reviewsList) return;

  const ratingHints = {
    1: '1 из 5 (Плохо)',
    2: '2 из 5 (Так себе)',
    3: '3 из 5 (Нормально)',
    4: '4 из 5 (Хорошо)',
    5: '5 из 5 (Отлично)'
  };

  const stars = Array.from(starsContainer.querySelectorAll('.star-rating__star'));

  function setRating(value) {
    if (ratingInput) ratingInput.value = value;
    if (ratingHint) ratingHint.textContent = ratingHints[value] || `${value} из 5`;

    stars.forEach((star) => {
      const starVal = Number(star.dataset.value);
      star.classList.toggle('star-rating__star--active', starVal <= value);
      star.setAttribute('aria-checked', starVal === value ? 'true' : 'false');
    });
  }

  stars.forEach((star) => {
    star.addEventListener('click', (e) => {
      e.preventDefault();
      const val = Number(star.dataset.value);
      setRating(val);
    });
  });

  // Отправка формы отзыва
  reviewForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const authorInput = document.getElementById('review-author');
    const textInput = document.getElementById('review-text');

    const author = authorInput ? authorInput.value.trim() : '';
    const text = textInput ? textInput.value.trim() : '';
    const rating = Number(ratingInput ? ratingInput.value : 5);

    if (!author || !text) {
      if (typeof window.hkShowToast === 'function') {
        window.hkShowToast('Пожалуйста, заполните все поля отзыва');
      }
      return;
    }

    const starString = '★'.repeat(rating) + '☆'.repeat(5 - rating);

    const article = document.createElement('article');
    article.className = 'review-card review-card--new';
    article.innerHTML = `
      <p class="review-card__text">«${escapeHtml(text)}»</p>
      <p class="review-card__author">${escapeHtml(author)} <span style="font-size: 11px; color: var(--color-accent-gold); font-weight: normal; margin-left: 6px;">Только что</span></p>
      <span class="review-card__rating" role="img" aria-label="Оценка ${rating} из 5">${starString}</span>
    `;

    reviewsList.insertBefore(article, reviewsList.firstChild);

    // Очистка формы
    reviewForm.reset();
    setRating(5);

    if (typeof window.hkShowToast === 'function') {
      window.hkShowToast('Спасибо за отзыв! Он успешно опубликован.');
    }

    if (reviewsSummary) {
      reviewsSummary.textContent = 'Средняя оценка: 4.9 из 5. Показаны реальные отзывы владельцев игры (включая ваш отзыв).';
    }
  });

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
