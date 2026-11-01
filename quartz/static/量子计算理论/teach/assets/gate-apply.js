/* 单比特门计算器：选择门，输入 α、β，输出门作用后的态与测量概率
   用法：<div class="tool" data-widget="gate-apply"></div> */
(function () {
  var SQ = Math.SQRT1_2;

  // 复数用 [实部, 虚部] 表示
  var GATES = {
    X: { name: 'X（比特翻转）', m: [[[0, 0], [1, 0]], [[1, 0], [0, 0]]] },
    Y: { name: 'Y（绕 y 轴 π）', m: [[[0, 0], [0, -1]], [[0, 1], [0, 0]]] },
    Z: { name: 'Z（相位翻转）', m: [[[1, 0], [0, 0]], [[0, 0], [-1, 0]]] },
    H: { name: 'H（制造叠加）', m: [[[SQ, 0], [SQ, 0]], [[SQ, 0], [-SQ, 0]]] }
  };

  function cadd(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
  function cmul(a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; }

  function fmtC(c) {
    var re = Math.round(c[0] * 10000) / 10000;
    var im = Math.round(c[1] * 10000) / 10000;
    if (Math.abs(im) < 1e-9) return String(re);
    if (Math.abs(re) < 1e-9) return (im === 1 ? 'i' : im === -1 ? '−i' : im + 'i');
    return re + (im > 0 ? ' + ' : ' − ') + Math.abs(im) + 'i';
  }

  function norm2(c) { return c[0] * c[0] + c[1] * c[1]; }

  function build(root) {
    var opts = Object.keys(GATES).map(function (k) {
      return '<option value="' + k + '">' + GATES[k].name + '</option>';
    }).join('');

    root.innerHTML = [
      '<h4>单比特门计算器</h4>',
      '<div class="row">',
      '  <div class="field"><label>Re(α)</label><input data-amp="ar" value="1" inputmode="decimal"></div>',
      '  <div class="field"><label>Im(α)</label><input data-amp="ai" value="0" inputmode="decimal"></div>',
      '  <div class="field"><label>Re(β)</label><input data-amp="br" value="0" inputmode="decimal"></div>',
      '  <div class="field"><label>Im(β)</label><input data-amp="bi" value="0" inputmode="decimal"></div>',
      '  <div class="field"><label>门</label><select data-gate style="font-family:var(--mono);padding:0.38rem 0.4rem;border:1px solid var(--rule-strong);border-radius:2px;background:#fff">' + opts + '</select></div>',
      '  <button data-run>作用</button>',
      '</div>',
      '<output></output>'
    ].join('');

    var out = root.querySelector('output');

    function val(name) {
      var v = parseFloat(root.querySelector('input[data-amp="' + name + '"]').value);
      return isNaN(v) ? 0 : v;
    }

    function run() {
      var inA = [val('ar'), val('ai')];
      var inB = [val('br'), val('bi')];
      var key = root.querySelector('[data-gate]').value;
      var m = GATES[key].m;

      var out0 = cadd(cmul(m[0][0], inA), cmul(m[0][1], inB));
      var out1 = cadd(cmul(m[1][0], inA), cmul(m[1][1], inB));
      var p0 = norm2(out0), p1 = norm2(out1);

      out.innerHTML =
        'U|ψ⟩ = (' + fmtC(out0) + ')|0⟩ + (' + fmtC(out1) + ')|1⟩\n' +
        'p(0) = ' + (Math.round(p0 * 10000) / 10000) +
        '　p(1) = ' + (Math.round(p1 * 10000) / 10000) + '\n' +
        (Math.abs(p0 + p1 - 1) < 1e-6
          ? '<span class="ok">概率之和仍为 1</span>：酉变换保持归一化。'
          : '<span class="no">概率之和不为 1</span>：输入的 α、β 本身就不合法（先归一化）。');
    }

    root.querySelector('[data-run]').addEventListener('click', run);
    root.querySelectorAll('input').forEach(function (el) {
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
    });
    run();
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('[data-widget="gate-apply"]'), build);
  });
})();
