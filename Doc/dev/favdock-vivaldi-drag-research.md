# FavDock: Vivaldi 拖拽系统研究与 Zen 对照

> 2026-08-07 跟进。目标：让 FavDock 的固定标签"完全不占标签栏 DOM 空间"，并尽可能复用/修复 Vivaldi 原生拖拽，实现 Zen 式体验。

## 1. Vivaldi 拖拽系统现状（逆向结论）

- **事件层**：HTML5 DnD 与 C++ 原生拖拽并存。C++ 路径（多数拖拽）不派发 `dragstart`/`drop`，只派发鼠标事件；JS 路径派发完整 HTML5 事件链。
- **布局层**：`.tab-position` 是 `position: absolute`，坐标由内联 CSS 变量 `--PositionX/Y` 驱动（`transform: translate`）。变量值来自 **yoga 布局引擎**（React 内部，按窗口全部标签连续分配 0/33/66…），**CSS 无法影响**。
- **弹窗机制**：`windowDropHandler`（document bubble）在 `"add" === dndMode` 时对落点标签执行 `detachPage`。`dndMode="move"` 只在 JS 层 `maybeStartDragging` 设置；C++ 路径下 dndMode 非 "move" → **dock 落点必 detachPage**。
- **无原生 tab 隐藏**：bundle 搜索 `setTabHidden`/`hideTab`/`hiddenTabs` 全部不存在。固定标签绕过 workspace 过滤（`filter(e => ws(e)===cur && !e.pinned)`），假 workspaceId 方案不适用。

## 2. 已落地的对抗方案（v8 系）

- **v7**：dock 落点"先补 flag 再拦截"——`dispatchEvent(合成 drop)` 让 `windowDropHandler` 设 `dropHandlerFired=true`（空 DataTransfer → 只设标志不移动），再 `stopImmediatePropagation` 掐掉真实 drop → `onDragEnd` 不再 detachPage。**弹窗根除**。
- **v8**：Dock 与 strip 落点统一为"记录 pendingDrop → 拖拽结束信号（tabsPrivate.onDragEnd，可订阅已确认）→ 150ms 静默窗 → reconcile"。
- **v8.3/8.4**：`applyHiddenPins`（`.tab-strip .tab-position.favdock-hidden`，后代选择器，`.tab-wrapper[data-id]` 双向查找）+ `reflowStrip()` 重排可见 tab 的 `--PositionY`（含 `.separate`）。

## 3. 未解决：拖拽中空白

`display:none` 只去掉渲染，yoga 槽位不释放 → 平时靠 `reflowStrip` 维持连续；**拖拽中 React 持续重渲染重写 `--PositionY`**（yoga 原值）→ 空白重现。拖拽中 reflow 会被下一次 React 渲染覆盖（且 style 属性不在 observer 的 attributeFilter 里，无法即时补丁）。**CSS/HTML5 事件层无解**。

## 4. Zen 对照（src/zen/tabs/ZenPinnedTabManager.mjs）

- **Essential 标签 = 用户要的 fav tab**，`maxEssentialTabs` 默认 **12**（与需求一致）。
- **隐藏机制**：`section.appendChild(tab)` —— **物理移动 DOM 节点出标签栏**（Firefox XUL 允许；Vivaldi React 会恢复，不能直接照搬）。
- **拖拽**：落点容器判定（essentials/pinned/normal 三区）+ `#zen-drag-indicator` 插入指示器（无让位动画）——与 v8 目标槽高亮理念一致。
- **workspace 语义**：`addToEssentials` 剥掉 `zen-workspace-id` → essential 全局可见（与我们的 `favdockWs` 相反的维度，可对照）。

## 5. 候选根治路径

| 方案 | 做法 | 可行性 |
|---|---|---|
| **A. React fiber 注入**（推荐） | 定位 TabStrip fiber，拦截/改写其 pages 数据流，让 favorites 像"其他 workspace 标签"一样**原生不进入渲染列表**（无槽位、无空白、拖拽天然正常） | 需继续逆向 TabStrip 组件数据流（AGENTS.md 已记录 fiber 遍历技术，`setAwaitingEdit` 可达验证过）。React 内部结构跨版本有风险 |
| B. DOM 物理移出 | 把 favorites 的 `.tab-position` 移入 dock 容器 | React 在下一次该 tab 渲染时移回（激活/标题/favicon 变化都触发）→ 闪烁。不稳 |
| C. 维持现状 | CSS 隐藏 + reflowStrip，拖拽中空白可接受 | 已上线；UX 妥协 |

**下一步**：沿方案 A 逆向——在 bundle 中定位 TabStrip 渲染入口（`is-pinned` 已定位 @2961591），追踪其 pages 数据源与 workspace 过滤路径，评估 fiber 注入可行性。
