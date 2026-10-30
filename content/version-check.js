/*!
 * version-check.js — 自动检测站点新版本并静默刷新，免去手动 Ctrl+F5
 *
 * 原理：
 *   浏览器（以及 GitHub Pages 的 max-age=600）会缓存 HTML 页面本身，
 *   部署新版本后用户仍可能拿到旧副本。本脚本在页面加载后拉取站点根的
 *   version.txt（cache: no-store，绕过缓存），与 localStorage 中记录的
 *   版本号比对；不一致说明线上已更新，于是带上新的查询串重新加载本页，
 *   查询串会让浏览器视作新 URL 从而回源拿到最新内容。
 *
 * 安全约束：
 *   - 同一会话（标签页）内最多自动刷新一次，绝不循环刷新
 *   - 首次访问只记录版本，不刷新
 *   - 取不到 version.txt（如本地预览）时静默退出
 *   - 已有 ?_v= 查询串时不重复处理
 */
(function () {
  var VERSION_KEY = "site_build_version";
  var RELOADED_KEY = "site_build_reloaded";

  function run() {
    if (!window.fetch || !window.sessionStorage || !window.localStorage) return;

    // 同一会话已自动刷新过，不再刷新，避免死循环
    if (sessionStorage.getItem(RELOADED_KEY)) return;

    fetch("/version.txt", { cache: "no-store", credentials: "omit" })
      .then(function (res) {
        return res.ok ? res.text() : null;
      })
      .then(function (text) {
        if (!text) return;
        var current = text.trim();
        if (!current) return;

        var previous = localStorage.getItem(VERSION_KEY);
        localStorage.setItem(VERSION_KEY, current);

        // 首次访问：只记录版本
        if (!previous || previous === current) return;

        // 线上版本已更新：带新查询串重载一次（绕过缓存）
        sessionStorage.setItem(RELOADED_KEY, "1");
        var url = new URL(window.location.href);
        url.searchParams.set("_v", current);
        window.location.replace(url.href);
      })
      .catch(function () {
        /* 离线或取不到版本号时不做任何事 */
      });
  }

  if (document.readyState === "complete") {
    setTimeout(run, 50);
  } else {
    window.addEventListener("load", function () {
      setTimeout(run, 50);
    });
  }
})();
