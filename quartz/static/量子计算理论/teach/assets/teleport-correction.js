/* 隐形传态修正表交互：选 Alice 的 Bell 测量结果，显示 Bob 需要施加的修正门。
   对应课件 01 · P50–P51：00→I、01→X、10→Z、11→先 X 再 Z。
   用法：<div class="tool" data-widget="teleport-correction"></div> */
(function () {
  var table = {
    '00': { gate: 'I（什么都不做）', pre: 'α|0⟩ + β|1⟩', note: 'Alice 测到 |Φ⁺⟩，Bob 端已正好是 |ψ⟩，无需修正。' },
    '01': { gate: 'X 门', pre: 'α|1⟩ + β|0⟩', note: 'Alice 测到 |Φ⁻⟩，Bob 端是 |ψ⟩ 的 bit-flip，施加 X 翻转回 |ψ⟩。' },
    '10': { gate: 'Z 门', pre: 'α|0⟩ − β|1⟩', note: 'Alice 测到 |Ψ⁺⟩，Bob 端是 |ψ⟩ 的 phase-flip，施加 Z 修正相位。' },
    '11': { gate: '先 X 再 Z', pre: 'α|1⟩ − β|0⟩（或等价形式）', note: 'Alice 测到 |Ψ⁻⟩，Bob 端同时有 bit-flip 与 phase-flip，先 X 后 Z 复原。' }
  };
  function build(root) {
    root.innerHTML = [
      '<h4>隐形传态修正表</h4>',
      '<p style="font-size:0.9rem;color:var(--ink-soft);margin:0 0 0.9rem">Alice 对自己的两个比特做 Bell 测量，得到 2 个经典比特。选一个结果，看 Bob 必须施加什么修正门才能复原 ' + MQ('|ψ⟩ = α|0⟩ + β|1⟩') + '（课件 01 · P50–P51）。</p>',
      '<div class="row">',
      '  <div class="field"><label>Alice 测量结果</label><select data-m><option value="00">00</option><option value="01">01</option><option value="10">10</option><option value="11">11</option></select></div>',
      '</div>',
      '<output></output>'
    ].join('');
    MQTypeset(root);
    var out = root.querySelector('output');
    var sel = root.querySelector('[data-m]');
    function render() {
      var t = table[sel.value];
      var lines = [];
      lines.push('Alice 测得 <strong>' + sel.value + '</strong>');
      lines.push('Bob 当前态（修正前）：' + MQ(t.pre));
      lines.push('Bob 需施加：<strong>' + t.gate + '</strong>');
      lines.push(MQ(t.note));
      out.innerHTML = lines.join('\n');
      MQTypeset(out);
    }
    sel.addEventListener('change', render);
    render();
  }
  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('[data-widget="teleport-correction"]'), build);
  });
})();
