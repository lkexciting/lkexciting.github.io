/* CNOT 制备贝尔态交互：从 |q0 q1⟩ 出发（q1 固定 |0⟩），分步施加 H(q0) 与
   CNOT(q0→q1)，展示态如何演变、以及最终是否产生纠缠（写不成 |a⟩⊗|b⟩）。
   用法：<div class="tool" data-widget="cnot-bell"></div> */
(function () {
  function fmt(x) {
    var r = Math.round(x * 10000) / 10000;
    return String(r);
  }
  function build(root) {
    root.innerHTML = [
      '<h4>CNOT 制备贝尔态</h4>',
      '<p style="font-size:0.9rem;color:var(--ink-soft);margin:0 0 0.9rem">从 ' + MQ('|q0 q1⟩') + ' 出发（q1 固定为 ' + MQ('|0⟩') + '）。先选 q0 初态，再分步施加 H(q0) 与 CNOT(q0→q1)，观察态如何变成纠缠的贝尔态。态写作 ' + MQ('a|00⟩+b|01⟩+c|10⟩+d|11⟩') + '。</p>',
      '<div class="row">',
      '  <div class="field"><label>q0 初态</label><select data-q0><option value="0">|0⟩</option><option value="1">|1⟩</option></select></div>',
      '  <button data-h>H(q0)</button>',
      '  <button data-cnot>CNOT(q0→q1)</button>',
      '  <button data-reset>重置</button>',
      '</div>',
      '<output></output>'
    ].join('');
    MQTypeset(root);

    var out = root.querySelector('output');
    var sel = root.querySelector('[data-q0]');
    // 态：[a,b,c,d] = a|00⟩+b|01⟩+c|10⟩+d|11⟩
    var state, steps;
    function init0(v) {
      state = (v === '1') ? [0, 0, 1, 0] : [1, 0, 0, 0];
      steps = [(v === '1' ? MQ('初始 |10⟩') : MQ('初始 |00⟩'))];
    }
    function hadamardQ0() {
      var a = state[0], b = state[1], c = state[2], d = state[3];
      state = [(a + c) / Math.SQRT2, (b + d) / Math.SQRT2, (a - c) / Math.SQRT2, (b - d) / Math.SQRT2];
      steps.push('H(q0)');
    }
    function cnot() {
      var t = state[2]; state[2] = state[3]; state[3] = t; // 控制 q0，翻转 q1：c↔d
      steps.push('CNOT(q0→q1)');
    }
    function entangled() {
      return Math.abs(state[0] * state[3] - state[1] * state[2]) > 1e-4;
    }
    function render() {
      var a = state[0], b = state[1], c = state[2], d = state[3];
      var lines = [];
      lines.push('态 = ' + MQ('(' + fmt(a) + ')|00⟩ + (' + fmt(b) + ')|01⟩ + (' + fmt(c) + ')|10⟩ + (' + fmt(d) + ')|11⟩'));
      lines.push('步骤：' + steps.join(' → '));
      var p = a * a + b * b + c * c + d * d;
      if (Math.abs(p - 1) < 1e-4) lines.push('<span class="ok">已归一化（概率和 = 1）</span>');
      else lines.push('<span class="no">概率和 = ' + fmt(p) + '（非法态，需先归一化）</span>');
      if (entangled()) lines.push('<span class="no">纠缠：写不成 ' + MQ('|a⟩⊗|b⟩') + ' —— 这就是贝尔态</span>');
      else lines.push('<span class="ok">可分：仍可写成两个单比特之积</span>');
      out.innerHTML = lines.join('\n');
      MQTypeset(out);
    }
    root.querySelector('[data-h]').addEventListener('click', function () { hadamardQ0(); render(); });
    root.querySelector('[data-cnot]').addEventListener('click', function () { cnot(); render(); });
    root.querySelector('[data-reset]').addEventListener('click', function () { init0(sel.value); render(); });
    sel.addEventListener('change', function () { init0(sel.value); render(); });
    init0(sel.value);
    render();
  }
  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('[data-widget="cnot-bell"]'), build);
  });
})();
