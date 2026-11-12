/* Native selects can match :focus-visible after a pointer click, too. */
(function () {
  'use strict';
  const raiz = document.documentElement;
  document.addEventListener('pointerdown', function () {
    raiz.dataset.interacao = 'ponteiro';
  }, { capture: true, passive: true });
  document.addEventListener('keydown', function () {
    raiz.dataset.interacao = 'teclado';
  }, true);
})();
