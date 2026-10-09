/* Self-test: picking an option marks it right or wrong and opens the explanation.
 * Without JS the explanation is still one click away (<details>). */
(function () {
  'use strict';
  function start() {
    Array.prototype.forEach.call(document.querySelectorAll('.quiz-q'), function (q) {
      q.addEventListener('change', function (e) {
        if (!e.target.matches('input[type="radio"]')) return;
        Array.prototype.forEach.call(q.querySelectorAll('.quiz-opt'), function (opt) {
          var input = opt.querySelector('input');
          opt.classList.toggle('is-right', input.hasAttribute('data-correct') && (input.checked || e.target.hasAttribute('data-correct') === false));
          opt.classList.toggle('is-wrong', input.checked && !input.hasAttribute('data-correct'));
        });
        var ex = q.querySelector('.quiz-explain');
        if (ex) ex.open = true;
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
