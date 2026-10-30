/**
 * 构建后处理：
 *   1. 在 public/ 根写入 version.txt（内容 = 本次构建版本号）
 *   2. 给 public/ 下所有 .html 页面注入 <script src="/version-check.js" defer>
 *
 * 用法：
 *   node scripts/inject-version-check.js [输出目录]
 * 版本号来源（按优先级）：
 *   环境变量 BUILD_VERSION > git HEAD sha > 当前时间戳
 */
import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"

const outDir = process.argv[2] || "public"
const root = path.resolve(process.cwd(), outDir)

if (!fs.existsSync(root)) {
  console.error(`[version] 输出目录不存在：${root}`)
  process.exit(1)
}

// ---------- 1. 确定版本号 ----------
function resolveVersion() {
  if (process.env.BUILD_VERSION && process.env.BUILD_VERSION.trim()) {
    return process.env.BUILD_VERSION.trim()
  }
  try {
    const sha = execSync("git rev-parse --short=12 HEAD", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()
    if (sha) return sha
  } catch {
    /* 非 git 环境则忽略 */
  }
  return String(Date.now())
}

const version = resolveVersion()

// ---------- 2. 写 version.txt ----------
fs.writeFileSync(path.join(root, "version.txt"), version + "\n", "utf8")

// ---------- 3. 注入脚本到所有 html ----------
const SNIPPET = '<script src="/version-check.js" defer></script>'
let injected = 0
let skipped = 0

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
      continue
    }
    if (!entry.name.endsWith(".html")) continue

    let html = fs.readFileSync(full, "utf8")
    if (html.includes("/version-check.js")) {
      skipped++
      continue
    }

    if (html.includes("</body>")) {
      html = html.replace("</body>", `${SNIPPET}\n</body>`)
    } else if (html.includes("</html>")) {
      html = html.replace("</html>", `${SNIPPET}\n</html>`)
    } else {
      html += `\n${SNIPPET}\n`
    }

    fs.writeFileSync(full, html, "utf8")
    injected++
  }
}

walk(root)

console.log(`[version] version.txt = ${version}`)
console.log(`[version] 注入 ${injected} 个页面，跳过（已注入）${skipped} 个`)
