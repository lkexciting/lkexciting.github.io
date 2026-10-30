/* mq.js — 把交互工具输出的“类 LaTeX Unicode 文本”转成 KaTeX 可渲染的 \(...\)。
   与 lessons 中使用的转换器同源：只把“数学字符连续段”包进 \(...\)，中文/全角标点/空格留在数学模式外，
   因此 “Alice 测到 |Φ⁺⟩” 会变成 “Alice 测到 \(|\Phi^{+}\rangle\)”，渲染正确。
   依赖：KaTeX + auto-render（已注入各课 <head>）。 */
(function () {
  var MAP = {
    '⟨': '\\langle ', '⟩': '\\rangle ', '⊗': '\\otimes ', '⊕': '\\oplus ',
    '→': '\\to ', '−': '-', '±': '\\pm', '·': '\\cdot', '×': '\\times', '÷': '\\div',
    'α': '\\alpha', 'β': '\\beta', 'γ': '\\gamma', 'δ': '\\delta', 'ε': '\\epsilon',
    'ζ': '\\zeta', 'η': '\\eta', 'θ': '\\theta', 'ι': '\\iota', 'κ': '\\kappa',
    'λ': '\\lambda', 'μ': '\\mu', 'ν': '\\nu', 'ξ': '\\xi', 'π': '\\pi', 'ρ': '\\rho',
    'σ': '\\sigma', 'τ': '\\tau', 'υ': '\\upsilon', 'φ': '\\phi', 'χ': '\\chi',
    'ψ': '\\psi', 'ω': '\\omega', 'Φ': '\\Phi', 'Ψ': '\\Psi', 'Λ': '\\Lambda',
    'Σ': '\\sum', 'Δ': '\\Delta', 'Θ': '\\Theta', 'Ω': '\\Omega',
    '²': '^{2}', '³': '^{3}', '⁴': '^{4}', '⁵': '^{5}', '⁶': '^{6}', '⁷': '^{7}',
    '⁸': '^{8}', '⁹': '^{9}', '⁰': '^{0}', 'ⁿ': '^{n}', '⁺': '^{+}', '⁻': '^{-}', '⁼': '^{=}',
    '₀': '_{0}', '₁': '_{1}', '₂': '_{2}', '₃': '_{3}', '₄': '_{4}', '₅': '_{5}',
    '₆': '_{6}', '₇': '_{7}', '₈': '_{8}', '₉': '_{9}', 'ᵢ': '_{i}', 'ⱼ': '_{j}', 'ₙ': '_{n}',
    '≤': '\\le', '≥': '\\ge', '≠': '\\neq', '≈': '\\approx', '≡': '\\equiv',
    '∈': '\\in', '∞': '\\infty', '∂': '\\partial', '∇': '\\nabla', '∀': '\\forall',
    '∃': '\\exists', '∅': '\\emptyset', '∪': '\\cup', '∩': '\\cap', '∠': '\\angle',
    '∗': '\\ast', '†': '\\dagger', '′': "'", '…': '\\ldots', '°': '^{\\circ}'
  };

  var CMDS = [];
  for (var k in MAP) {
    if (!MAP.hasOwnProperty(k)) continue;
    var v = MAP[k];
    if (v.charAt(0) === '\\') {
      var name = v.substring(1).replace(/\s+$/, '');
      if (name) CMDS.push(name);
    }
  }

  function isCJK(c) {
    return /[一-鿿　-〿＀-￯—]/.test(c);
  }
  function isStrong(c) {
    if (/[|⟨⟩⊗⊕√→−±·×^_={}()\[\]/+*.,:!?%#@~;0-9]/.test(c)) return true;
    if (/[αβγδεζηθικλμνξπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ²³⁴⁵⁶⁷⁸⁹⁰ⁿ⁺⁻⁼₀₁₂₃₄₅₆₇₈₉ᵢⱼₙ]/.test(c)) return true;
    return false;
  }
  function hasStrong(s) {
    for (var i = 0; i < s.length; i++) if (isStrong(s[i])) return true;
    return false;
  }

  function convert(t) {
    t = t.replace(/([{}])/g, function (m) { return (m === '{') ? '\\{' : '\\}'; });
    for (var k in MAP) {
      if (MAP.hasOwnProperty(k)) t = t.split(k).join(MAP[k]);
    }
    // √ 处理：√{...} / √(...) / √X
    t = t.replace(/√\{([^}]*)\}/g, '\\sqrt{$1}')
         .replace(/√\(([^)]*)\)/g, '\\sqrt{$1}')
         .replace(/√([A-Za-z0-9])/g, '\\sqrt{$1}');
    // 反斜杠命令后紧跟字母时补空格（避免 \oplus f 被吸成 \oplusf）
    for (var i = 0; i < CMDS.length; i++) {
      var c = CMDS[i];
      t = t.replace(new RegExp('\\\\' + c + '(?=[a-zA-Z])', 'g'), '\\\\' + c + ' ');
    }
    return t;
  }

  // 只把“含强数学符号的连续段”包进 \(...\)；纯字母（如 Alice）留在数学模式外
  window.MQ = function (s) {
    var out = [], buf = '', inRun = false;
    function flush() {
      if (buf) { out.push(hasStrong(buf) ? '\\(' + convert(buf) + '\\)' : buf); buf = ''; }
      inRun = false;
    }
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (c === ' ' || isCJK(c)) { if (inRun) flush(); out.push(c); }
      else { if (!inRun) inRun = true; buf += c; }
    }
    if (inRun) flush();
    return out.join('');
  };

  window.MQTypeset = function (el) {
    if (window.renderMathInElement) {
      try {
        renderMathInElement(el, {
          delimiters: [
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true },
          ],
          throwOnError: false,
        });
      } catch (e) {}
    }
  };
})();
