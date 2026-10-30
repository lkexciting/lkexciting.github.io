/* 兼容垫片（不是 MathJax 本体）
   早期版本的课件页用 <script async src="../assets/mathjax/tex-svg.js"> 加载 MathJax。
   那个 2.1MB 的脚本在国内网络下经常加载过慢/失败，公式会长时间（甚至一直）显示为裸源码。
   现在课件已改用本地 KaTeX 渲染，但浏览器里**缓存的旧页面**仍会请求这个路径。
   为了不让旧缓存页面继续显示裸 LaTeX，这里接管该路径：改为加载本地 KaTeX 并渲染页面公式。
   新页面不再引用本文件，可安全保留作为过渡兼容。 */
(function () {
  function base() {
    var s = document.currentScript;
    if (s && s.src) return s.src.replace(/assets\/mathjax\/tex-svg\.js.*$/, '');
    return '../';
  }
  var b = base();

  function loadCss(href) {
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    document.head.appendChild(l);
  }

  function loadJs(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = cb || null;
    document.head.appendChild(s);
  }

  function render() {
    // 页面自己的 KaTeX 已经渲染过就跳过，避免重复排版
    if (!window.renderMathInElement) return;
    if (document.querySelector('.katex')) return;
    try {
      renderMathInElement(document.body, {
        delimiters: [
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
    } catch (e) {}
  }

  loadCss(b + 'assets/katex/katex.min.css');
  loadJs(b + 'assets/katex/katex.min.js', function () {
    loadJs(b + 'assets/katex/auto-render.min.js', render);
  });
})();
