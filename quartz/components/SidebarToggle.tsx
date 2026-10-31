// @ts-ignore
import sidebarScript from "./scripts/sidebar.inline"
import styles from "./styles/sidebar.scss"
import { QuartzComponent, QuartzComponentConstructor } from "./types"

const SidebarToggle: QuartzComponent = () => {
  return (
    <>
      {/* 侧边栏内的收起按钮（展开状态显示） */}
      <button
        class="sidebar-toggle sidebar-toggle-inline"
        aria-expanded="true"
        aria-label="收起侧边栏"
        title="收起侧边栏（[）"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M9 3v18" />
          <path d="m16 15-3-3 3-3" />
        </svg>
      </button>
      {/* 收起后左上角的浮动展开按钮 */}
      <button
        class="sidebar-toggle sidebar-toggle-float"
        aria-expanded="false"
        aria-label="展开侧边栏"
        title="展开侧边栏（[）"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M9 3v18" />
          <path d="m14 9 3 3-3 3" />
        </svg>
      </button>
    </>
  )
}

SidebarToggle.beforeDOMLoaded = sidebarScript
SidebarToggle.css = styles

export default (() => SidebarToggle) satisfies QuartzComponentConstructor
