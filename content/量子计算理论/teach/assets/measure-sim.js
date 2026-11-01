/* 测量模拟器：输入双比特态 a|00⟩+b|01⟩+c|10⟩+d|11⟩ 的实振幅，
   按计算基测量，输出每个结果概率、坍缩态，以及"给定第一比特结果时第二比特的约化态"。
   用法：<div class="tool" data-widget="measure-sim"></div> */
(function () {
  function fmt(x) {
    var r = Math.round(x * 10000) / 10000;
    return String(r);
  }
  function build(root) {
    root.innerHTML = [
      '<h4>测量模拟器</h4>',
      '<p style="font-size:0.9rem;color:var(--ink-soft);margin:0 0 0.9rem">输入双比特态 a|00⟩+b|01⟩+c|10⟩+d|11⟩ 的实振幅。按计算基测量，给出四个结果的概率，并演示"测得第一比特后，第二比特被锁定成什么"——这正是纠缠关联。</p>',
      '<div class="row">',
      '  <div class="field"><label>a (|00⟩)</label><input data-amp="a" value="0.7071" inputmode="decimal"></div>',
      '  <div class="field"><label>b (|01⟩)</label><input data-amp="b" value="0" inputmode="decimal"></div>',
      '  <div class="field"><label>c (|10⟩)</label><input data-amp="c" value="0" inputmode="decimal"></div>',
      '  <div class="field"><label>d (|11⟩)</label><input data-amp="d" value="0.7071" inputmode="decimal"></div>',
      '  <button data-run>测量</button>',
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
      var p00 = a * a, p01 = b * b, p10 = c * c, p11 = d * d;
      var p1zero = a * a + b * b;   // 第一比特 = 0
      var p1one  = c * c + d * d;   // 第一比特 = 1
      var lines = [];
      lines.push('各基结果概率（Born 规则 |振幅|²）：');
      lines.push('  p(00)=' + fmt(p00) + '   p(01)=' + fmt(p01) + '   p(10)=' + fmt(p10) + '   p(11)=' + fmt(p11));
      var sum = p00 + p01 + p10 + p11;
      lines.push((sum > 0 ? '概率和 = ' + fmt(sum) : '概率和 = 0（非法态，需先归一化）'));
      if (Math.abs(p1zero) > 1e-9) {
        var ka = a / Math.sqrt(p1zero), kb = b / Math.sqrt(p1zero);
        lines.push('若测得 第一比特=0（概率 ' + fmt(p1zero) + '）：第二比特坍缩为 (' + fmt(ka) + ')|0⟩ + (' + fmt(kb) + ')|1⟩');
      }
      if (Math.abs(p1one) > 1e-9) {
        var kc = c / Math.sqrt(p1one), kd = d / Math.sqrt(p1one);
        lines.push('若测得 第一比特=1（概率 ' + fmt(p1one) + '）：第二比特坍缩为 (' + fmt(kc) + ')|0⟩ + (' + fmt(kd) + ')|1⟩');
      }
      if (Math.abs(a * d - b * c) < 1e-4) {
        lines.push('<span class="ok">可分态：测第一比特后，第二比特的约化态与结果无关（它本就独立）。</span>');
      } else {
        lines.push('<span class="no">纠缠态：测第一比特的结果会"锁定"第二比特——这就是量子关联（隐形传态靠它）。</span>');
      }
      out.innerHTML = lines.join('\n');
    }
    root.querySelector('[data-run]').addEventListener('click', run);
    root.querySelectorAll('input').forEach(function (el) {
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
    });
    run();
  }
  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('[data-widget="measure-sim"]'), build);
  });
})();
