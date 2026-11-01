/* Deutsch 算法模拟器：选择 1 比特函数类型，模拟整条线路，
   输出第一比特的最终测量结果（0=常量，1=平衡）。
   用法：<div class="tool" data-widget="deutsch-sim"></div> */
(function () {
  function build(root) {
    var types = [
      ['c0', '常量：f(x)=0'],
      ['c1', '常量：f(x)=1'],
      ['bx', '平衡：f(x)=x'],
      ['bnx', '平衡：f(x)=1−x']
    ];
    root.innerHTML = [
      '<h4>Deutsch 算法模拟器</h4>',
      '<p style="font-size:0.9rem;color:var(--ink-soft);margin:0 0 0.9rem">选择函数 f，模拟线路 |0⟩|1⟩ → H⊗H → U_f → H⊗I → 测第一比特。看"一次查询"如何区分常量/平衡。（注意：课件 P64 那句"测得 |0⟩ 说明平衡"是笔误，正确结论见下方。）</p>',
      '<div class="row">',
      '  <div class="field"><label>函数 f</label><select data-fn style="font-family:var(--mono);padding:0.38rem 0.4rem;border:1px solid var(--rule-strong);border-radius:2px;background:#fff">' + types.map(function (t) { return '<option value="' + t[0] + '">' + t[1] + '</option>'; }).join('') + '</select></div>',
      '  <button data-run>运行</button>',
      '</div>',
      '<output></output>'
    ].join('');

    var out = root.querySelector('output');
    function run() {
      var fn = root.querySelector('[data-fn]').value;
      var f0, f1;
      if (fn === 'c0') { f0 = 0; f1 = 0; }
      else if (fn === 'c1') { f0 = 1; f1 = 1; }
      else if (fn === 'bx') { f0 = 0; f1 = 1; }
      else { f0 = 1; f1 = 0; }
      var s0 = Math.pow(-1, f0);   // (−1)^{f(0)}
      var s1 = Math.pow(-1, f1);   // (−1)^{f(1)}
      var amp0 = (s0 + s1) / 2;
      var amp1 = (s0 - s1) / 2;
      var p0 = amp0 * amp0, p1 = amp1 * amp1;
      var lines = [];
      lines.push('f(0) = ' + f0 + '，  f(1) = ' + f1);
      lines.push('U_f 后第一比特叠加：(' + s0 + '|0⟩ + ' + s1 + '|1⟩)/√2');
      lines.push('经末位 H 干涉：amp(0) = ' + amp0 + '，  amp(1) = ' + amp1);
      lines.push('p(第一比特=0) = ' + p0 + '　　p(第一比特=1) = ' + p1);
      if (p0 === 1) {
        lines.push('测得 <strong>0</strong> → <span class="ok">常量函数（f(0)=f(1)）</span>');
      } else {
        lines.push('测得 <strong>1</strong> → <span class="no">平衡函数（f(0)≠f(1)）</span>');
      }
      lines.push('只调用了 <span style="color:var(--accent);font-weight:600">一次</span> U_f，就判定了函数类型。');
      out.innerHTML = lines.join('\n');
    }
    root.querySelector('[data-run]').addEventListener('click', run);
    run();
  }
  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('[data-widget="deutsch-sim"]'), build);
  });
})();
