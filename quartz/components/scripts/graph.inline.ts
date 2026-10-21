import {
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceLink,
  forceCollide,
  select,
  drag,
  zoom,
  zoomIdentity,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3"
import type { ContentDetails } from "../../plugins/emitters/contentIndex"
import { registerEscapeHandler, removeAllChildren } from "./util"
import {
  type FullSlug,
  type SimpleSlug,
  getFullSlug,
  resolveRelative,
  simplifySlug,
} from "../../util/path"
import type { D3Config } from "../Graph"

type Node = SimulationNodeDatum & { id: string; title: string }
type Link = SimulationLinkDatum<Node> & { source: string | Node; target: string | Node }
const key = "graph-visited"
function visited(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) ?? "[]"))
  } catch {
    return new Set()
  }
}
const canonical = (slug: string) => simplifySlug(slug as FullSlug)

async function renderGraph(graph: HTMLElement, fullSlug: FullSlug) {
  removeAllChildren(graph)
  const cfg: D3Config = JSON.parse(graph.dataset.cfg!)
  const current = canonical(fullSlug)
  const data = new Map(
    Object.entries<ContentDetails>(await fetchData).map(([slug, details]) => [
      canonical(slug),
      details,
    ]),
  )
  const links: Link[] = []
  const titles = new Map<string, string>([...data].map(([slug, details]) => [slug, details.title]))
  titles.set("/", "笔记首页")
  const unique = new Set<string>()
  function connect(source: string, target: string) {
    if (source === target || !titles.has(source) || !titles.has(target)) return
    const id = [source, target].sort().join("\0")
    if (!unique.has(id)) {
      unique.add(id)
      links.push({ source, target })
    }
  }
  for (const [source, details] of data) {
    for (const target of details.links ?? []) connect(source, canonical(target))
    // Course membership is a real structural relationship, including notes that
    // have no hand-written links. Folder indexes are otherwise absent from it.
    const parts = source.replace(/\/$/, "").split("/")
    if (source !== "/") {
      const parent = parts.length > 1 ? parts.slice(0, -1).join("/") + "/" : "/"
      connect(parent, source)
    }
    if (cfg.showTags) {
      for (const tag of details.tags ?? []) {
        if (cfg.removeTags.includes(tag)) continue
        const id = canonical("tags/" + tag)
        titles.set(id, "#" + tag)
        connect(source, id)
      }
    }
  }
  const visible = new Set<string>([current])
  if (cfg.depth < 0) titles.forEach((_, id) => visible.add(id))
  else
    for (let depth = 0; depth < cfg.depth; depth++) {
      const next = new Set(visible)
      for (const link of links) {
        if (visible.has(link.source as string)) next.add(link.target as string)
        if (visible.has(link.target as string)) next.add(link.source as string)
      }
      next.forEach((id) => visible.add(id))
    }
  const nodes: Node[] = [...visible].map((id) => ({ id, title: titles.get(id) ?? id }))
  const edges = links.filter(
    (link) => visible.has(link.source as string) && visible.has(link.target as string),
  )
  const width = Math.max(graph.clientWidth, 220),
    height = Math.max(graph.clientHeight, 250)
  const svg = select(graph)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .attr("height", height)
    .attr("role", "group")
    .attr("aria-label", "笔记关系图谱，可点击节点打开笔记")
    .style("touch-action", "none")
  graph.dataset.nodes = String(nodes.length)
  graph.dataset.edges = String(edges.length)
  const scene = svg.append("g")
  const lines = scene
    .append("g")
    .attr("stroke", "var(--gray)")
    .attr("stroke-opacity", 0.5)
    .selectAll("line")
    .data(edges)
    .join("line")
  const history = visited()
  const groups = scene
    .append("g")
    .selectAll<SVGGElement, Node>("g")
    .data(nodes)
    .join("g")
    .attr("class", "graph-node")
  const anchors = groups
    .append("a")
    .attr("href", (node) => resolveRelative(fullSlug, node.id as SimpleSlug))
    .attr("aria-label", (node) => node.title)
  anchors
    .append("circle")
    .attr("r", (node) => (node.id === current ? 6 : node.id.endsWith("/") ? 5 : 4))
    .attr("fill", (node) =>
      node.id === current
        ? "var(--secondary)"
        : history.has(node.id)
          ? "var(--tertiary)"
          : "var(--gray)",
    )
    .attr("stroke", "var(--light)")
    .attr("stroke-width", 1.5)
  anchors
    .append("text")
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .attr("fill", "var(--darkgray)")
    .attr("font-size", 9)
    .style("font-family", "var(--bodyFont)")
    .text((node) => (node.title.length > 13 ? node.title.slice(0, 12) + "…" : node.title))
  anchors.append("title").text((node) => node.title)
  anchors.on("click", (event: MouseEvent, node) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
      return
    event.preventDefault()
    window.spaNavigate(
      new URL(resolveRelative(fullSlug, node.id as SimpleSlug), window.location.href),
    )
  })
  const simulation = forceSimulation(nodes)
    .force("charge", forceManyBody().strength(-55 * cfg.repelForce))
    .force("center", forceCenter(0, 0))
    .force(
      "link",
      forceLink<Node, Link>(edges)
        .id((node) => node.id)
        .distance(Math.min(width / 3, 60)),
    )
    .force("collide", forceCollide<Node>(17))
  // Pre-settle and fit the entire graph into its viewport before the first paint.
  simulation.stop()
  for (let tick = 0; tick < 180; tick++) simulation.tick()
  const extentX = Math.max(40, ...nodes.map((node) => Math.abs(node.x ?? 0)))
  const extentY = Math.max(40, ...nodes.map((node) => Math.abs(node.y ?? 0)))
  const fit = Math.min(1.2, (width - 65) / (extentX * 2), (height - 45) / (extentY * 2))
  const initial = zoomIdentity.translate(width / 2, height / 2).scale(fit)
  scene.attr("transform", initial.toString())
  const zoomBehavior = zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.15, 5])
    .on("zoom", (event) => scene.attr("transform", event.transform.toString()))
  if (cfg.zoom) svg.call(zoomBehavior).call(zoomBehavior.transform, initial)
  function draw() {
    lines
      .attr("x1", (link) => (link.source as Node).x ?? 0)
      .attr("y1", (link) => (link.source as Node).y ?? 0)
      .attr("x2", (link) => (link.target as Node).x ?? 0)
      .attr("y2", (link) => (link.target as Node).y ?? 0)
    groups.attr("transform", (node) => `translate(${node.x ?? 0},${node.y ?? 0})`)
  }
  draw()
  simulation.on("tick", draw)
  if (cfg.drag)
    groups.call(
      drag<SVGGElement, Node>()
        .on("start", (event, node) => {
          if (!event.active) simulation.alphaTarget(0.15).restart()
          node.fx = node.x
          node.fy = node.y
        })
        .on("drag", (event, node) => {
          node.fx = event.x
          node.fy = event.y
        })
        .on("end", (event, node) => {
          if (!event.active) simulation.alphaTarget(0)
          node.fx = null
          node.fy = null
        }),
    )
  return () => {
    simulation.stop()
    svg.remove()
  }
}

let cleanups: (() => void)[] = []
document.addEventListener("nav", async (event: CustomEventMap["nav"]) => {
  cleanups.forEach((cleanup) => cleanup())
  cleanups = []
  const slug = event.detail.url
  const history = visited()
  history.add(canonical(slug))
  try {
    localStorage.setItem(key, JSON.stringify([...history]))
  } catch {
    /* Private storage may be unavailable. */
  }
  for (const graph of document.querySelectorAll<HTMLElement>(".graph-container"))
    cleanups.push(await renderGraph(graph, slug))
  const overlays = [...document.querySelectorAll<HTMLElement>(".global-graph-outer")]
  let globalCleanups: (() => void)[] = []
  function hide() {
    globalCleanups.forEach((cleanup) => cleanup())
    globalCleanups = []
    overlays.forEach((overlay) => {
      overlay.classList.remove("active")
      const sidebar = overlay.closest<HTMLElement>(".sidebar")
      if (sidebar) sidebar.style.zIndex = ""
    })
  }
  async function show() {
    hide()
    for (const overlay of overlays) {
      overlay.classList.add("active")
      const sidebar = overlay.closest<HTMLElement>(".sidebar")
      if (sidebar) sidebar.style.zIndex = "1"
      registerEscapeHandler(overlay, hide)
      const graph = overlay.querySelector<HTMLElement>(".global-graph-container")
      if (graph) globalCleanups.push(await renderGraph(graph, getFullSlug(window)))
    }
  }
  const shortcut = (e: KeyboardEvent) => {
    if (e.key === "g" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      e.preventDefault()
      overlays.some((overlay) => overlay.classList.contains("active")) ? hide() : void show()
    }
  }
  const icons = document.querySelectorAll<HTMLElement>(".global-graph-icon")
  icons.forEach((icon) => icon.addEventListener("click", show))
  document.addEventListener("keydown", shortcut)
  window.addCleanup(() => {
    hide()
    icons.forEach((icon) => icon.removeEventListener("click", show))
    document.removeEventListener("keydown", shortcut)
    cleanups.forEach((cleanup) => cleanup())
    cleanups = []
  })
})
