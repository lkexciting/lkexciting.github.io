/* Deutsch 相位推导交互：选函数 f:{0,1}→{0,1}，展示相位反冲后第一寄存器及
   最后 H 后的判定结果。对应课件 01 · P60–P63，结论 |0⟩→常数、|1⟩→平衡
   （课件 p64 写反，以推导为准）。
   用法：<div class="tool" data-widget="deutsch-phase"></div> */
(function () {
  var funcs = {
    'c0':  { name: '常数 f(x)=0',     f0: 0, f1: 0 },
    'c1':  { name: '常数 f(x)=1',     f0: 1, f1: 1 },
    'id':  { name: '平衡 f(x)=x',     f0: 0, f1: 1 },
    'not': { name: '平衡 f(x)=1⊕x',   f0: 1, f1: 0 }
  };
  function build(root) {
    root.innerHTML = [
      '<h4>Deutsch 相位推导</h4>',
      '<p style="font-size:0.9rem;color:var(--ink-soft);margin:0 0 0.9rem">选一个函数 ' + MQ('f:{0,1}→{0,1}') + '，看 U_f 在叠加态上留下的相位反冲（' + MQ('(−1)^{f(x)}') + '），以及最后 H 后第一比特的判定结果（课件 01 · P60–P63）。</p>',
      '<div class="row">',
      '  <div class="field"><label>函数 f</label><select data-f><option value="c0">常数 f=0</option><option value="c1">常数 f=1</option><option value="id">平衡 f(x)=x</option><option value="not">平衡 f(x)=1⊕x</option></select></div>',
      '</div>',
      '<output></output>'
    ].join('');
    MQTypeset(root);
    var out = root.querySelector('output');
    var sel = root.querySelector('[data-f]');
    function render() {
      var f = funcs[sel.value];
      var s = f.f0 ^ f.f1; // s = f(0) ⊕ f(1)
      var first = (s === 0) ? '|+⟩ = (|0⟩+|1⟩)/√2' : '|−⟩ = (|0⟩−|1⟩)/√2';
      var result = (s === 0) ? '|0⟩ → 常数函数' : '|1⟩ → 平衡函数';
      var lines = [];
      lines.push('f(0)=' + f.f0 + ', f(1)=' + f.f1 + ',  s = ' + MQ('f(0)⊕f(1)') + ' = ' + s);
      lines.push('相位反冲后第一寄存器：' + MQ(first));
      lines.push('H 作用后（' + MQ('H|+⟩=|0⟩, H|−⟩=|1⟩') + '）：' + MQ(result));
      lines.push('<span class="' + (s === 0 ? 'ok' : 'no') + '">判定：' + (s === 0 ? '常数函数' : '平衡函数') + '（注意课件 p64 结论写反，以此推导为准）</span>');
      out.innerHTML = lines.join('\n');
      MQTypeset(out);
    }
    sel.addEventListener('change', render);
    render();
  }
  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('[data-widget="deutsch-phase"]'), build);
  });
})();
