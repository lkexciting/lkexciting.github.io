// 侧边栏收起 / 展开状态管理
// 状态记录在 <html> 的 class 上：Quartz 的 SPA 导航只会替换 body，
// 因此页面切换后状态不丢失；localStorage 保证刷新后仍保持上次的选择。

const SIDEBAR_STORAGE_KEY = "sidebarCollapsed"

const isSidebarCollapsed = () => document.documentElement.classList.contains("sidebar-collapsed")

const syncToggleButtons = () => {
  const collapsed = isSidebarCollapsed()
  for (const button of document.getElementsByClassName("sidebar-toggle")) {
    // 侧边栏内的按钮在展开时有效，浮动按钮在收起时有效
    const isFloatButton = button.classList.contains("sidebar-toggle-float")
    button.setAttribute("aria-expanded", String(isFloatButton ? collapsed : !collapsed))
  }
}

const setSidebarCollapsed = (collapsed: boolean) => {
  document.documentElement.classList.toggle("sidebar-collapsed", collapsed)
  localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed))
  syncToggleButtons()
}

const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed())

// 首屏绘制前恢复状态，避免页面加载时闪烁
if (localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true") {
  document.documentElement.classList.add("sidebar-collapsed")
}

document.addEventListener("nav", () => {
  for (const button of document.getElementsByClassName("sidebar-toggle")) {
    button.addEventListener("click", toggleSidebar)
    window.addCleanup(() => button.removeEventListener("click", toggleSidebar))
  }
  syncToggleButtons()

  // 快捷键 [ 收起 / 展开侧边栏（在输入框等位置输入时不触发）
  const onKeydown = (evt: KeyboardEvent) => {
    if (evt.key !== "[" || evt.ctrlKey || evt.metaKey || evt.altKey) return
    const target = evt.target as HTMLElement | null
    const tagName = target?.tagName
    if (tagName === "INPUT" || tagName === "TEXTAREA" || target?.isContentEditable) return
    evt.preventDefault()
    toggleSidebar()
  }
  document.addEventListener("keydown", onKeydown)
  window.addCleanup(() => document.removeEventListener("keydown", onKeydown))
})
