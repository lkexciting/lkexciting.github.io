/* 纠缠判断器：输入双比特态四个振幅，判断可分 / 纠缠
   用法：<div class="tool" data-widget="tensor-bell"></div> */
(function () {
  function fmt(x) {
    var r = Math.round(x * 10000) / 10000;
    return String(r);
  }
  function build(root) {
    root.innerHTML = [
      '<h4>纠缠判断器</h4>',
      '<p style="font-size:0.9rem;color:var(--ink-soft);margin:0 0 0.9rem">输入双比特态 a|00⟩+b|01⟩+c|10⟩+d|11⟩ 的四个振幅（实系数即可），判断它能否写成两个单比特态的张量积。</p>',
      '<div class="row">',
      '  <div class="field"><label>a (|00⟩)</label><input data-amp="a" value="0.7071" inputmode="decimal"></div>',
      '  <div class="field"><label>b (|01⟩)</label><input data-amp="b" value="0" inputmode="decimal"></div>',
      '  <div class="field"><label>c (|10⟩)</label><input data-amp="c" value="0" inputmode="decimal"></div>',
      '  <div class="field"><label>d (|11⟩)</label><input data-amp="d" value="0.7071" inputmode="decimal"></div>',
      '  <button data-run>判断</button>',
      '</div>',
      '<output></output>'
    ].join('');

    var out = root.querySelector('output');
    function val(n) {
      var v = parseFloat(root.querySelector('input[data-amp="' + n + '"]').value);
      return isNaN(v) ? 0 : v;
    }
    function run() {
      var a = val('a'), b = val('b'), c = val('c'), d = val('d');
      var det = a * d - b * c;
      var p = a * a + b * b + c * c + d * d;
      var lines = [];
      lines.push('态 = (' + fmt(a) + ')|00⟩ + (' + fmt(b) + ')|01⟩ + (' + fmt(c) + ')|10⟩ + (' + fmt(d) + ')|11⟩');
      lines.push('排成 2×2 矩阵，det = a·d − b·c = ' + fmt(det));
      if (Math.abs(p - 1) < 1e-4) lines.push('<span class="ok">已归一化（概率和 = 1）</span>');
      else lines.push('<span class="no">未归一化（概率和 = ' + fmt(p) + '）</span>');
      if (Math.abs(det) < 1e-4) lines.push('<span class="ok">可分：能写成 |ψ⟩⊗|φ⟩（det = 0，秩为 1）</span>');
      else lines.push('<span class="no">纠缠：不能写成乘积态（det ≠ 0）</span>');
      out.innerHTML = lines.join('\n');
    }
    root.querySelector('[data-run]').addEventListener('click', run);
    root.querySelectorAll('input').forEach(function (el) {
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
    });
    run();
  }
  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('[data-widget="tensor-bell"]'), build);
  });
})();
