/* 归一化检查器：输入 α、β 的实部与虚部，判断 |ψ⟩ = α|0⟩ + β|1⟩ 是否合法
   用法：
   <div class="tool" data-widget="norm-check"></div>
   脚本会注入输入框、按钮与输出区。计算全程在浏览器本地完成。 */
(function () {
  function fmt(x) {
    if (!isFinite(x)) return '—';
    var r = Math.round(x * 10000) / 10000;
    return String(r);
  }

  function build(root) {
    root.innerHTML = [
      '<h4>归一化检查器</h4>',
      '<div class="row">',
      '  <div class="field"><label>Re(α)</label><input data-amp="ar" value="0.6" inputmode="decimal"></div>',
      '  <div class="field"><label>Im(α)</label><input data-amp="ai" value="0" inputmode="decimal"></div>',
      '  <div class="field"><label>Re(β)</label><input data-amp="br" value="0.8" inputmode="decimal"></div>',
      '  <div class="field"><label>Im(β)</label><input data-amp="bi" value="0" inputmode="decimal"></div>',
      '  <button data-run>检查</button>',
      '</div>',
      '<output></output>'
    ].join('');

    var out = root.querySelector('output');
    var inputs = root.querySelectorAll('input');

    function val(name) {
      var el = root.querySelector('input[data-amp="' + name + '"]');
      var v = parseFloat(el.value);
      return isNaN(v) ? 0 : v;
    }

    function run() {
      var ar = val('ar'), ai = val('ai'), br = val('br'), bi = val('bi');
      var p0 = ar * ar + ai * ai;
      var p1 = br * br + bi * bi;
      var sum = p0 + p1;
      var ok = Math.abs(sum - 1) < 1e-6;

      out.innerHTML =
        '|α|² = ' + fmt(p0) + '　　|β|² = ' + fmt(p1) + '\n' +
        '|α|² + |β|² = ' + fmt(sum) + '\n' +
        '测得 0 的概率 = ' + (sum > 0 ? fmt(p0 / sum) : '—') +
        '　　测得 1 的概率 = ' + (sum > 0 ? fmt(p1 / sum) : '—') + '\n' +
        (ok
          ? '<span class="ok">合法量子态</span>：模长为 1，满足归一化条件。'
          : '<span class="no">不是合法量子态</span>：模长不为 1。考试中若给出这样的态，必须先归一化。');
    }

    root.querySelector('[data-run]').addEventListener('click', run);
    inputs.forEach(function (el) {
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
    });
    run();
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('[data-widget="norm-check"]'), build);
  });
})();
