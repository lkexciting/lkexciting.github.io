/* 小测组件：即时反馈，不泄露答案
   用法：
   <div class="quiz" data-answer="c" data-explanation="H 门把 |0⟩ 变成 (|0⟩+|1⟩)/√2。">
     <p class="quiz-q"><span class="qno">Q1</span>题干</p>
     <div class="opts">
       <button data-opt="a">选项 A</button>
       <button data-opt="b">选项 B</button>
       <button data-opt="c">选项 C</button>
     </div>
     <p class="feedback"></p>
   </div>
   正确答案应分散在不同位置，并由作者控制，不在 DOM 中提前标记。 */
(function () {
  function initQuiz(quiz) {
    var answer = quiz.getAttribute('data-answer');
    var explanation = quiz.getAttribute('data-explanation') || '';
    var feedback = quiz.querySelector('.feedback');
    var buttons = Array.prototype.slice.call(quiz.querySelectorAll('button[data-opt]'));

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (quiz.dataset.done === '1') return;
        quiz.dataset.done = '1';
        var picked = btn.getAttribute('data-opt');
        var right = picked === answer;

        buttons.forEach(function (b) {
          b.disabled = true;
          if (b.getAttribute('data-opt') === answer) b.classList.add('correct');
        });
        if (!right) btn.classList.add('wrong');

        if (feedback) {
          feedback.innerHTML = (right ? '<strong>对了。</strong> ' : '<strong>再想一步：</strong> ') + explanation;
          feedback.classList.add('show', right ? 'good' : 'bad');
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('.quiz'), initQuiz);
  });
})();
