# Arc Browser Favorites / Zen Essential Tabs 产品调研与 PRD

## 1. 产品定位总结

Arc 的 **Favorites** 和 Zen 的 **Essential Tabs** 本质上都在解决同一个问题：

> **传统浏览器 Tab 是“临时工作流”，Bookmark 是“长期收藏”，但用户存在一批每天反复访问、跨任务持续存在的“基础设施网站”。**

例如：

- Gmail
- Notion
- Calendar
- GitHub
- Slack
- ChatGPT
- YouTube Music

这些页面：

- 不应该每天重新打开；
- 不应该污染当前任务 Tab；
- 不应该隐藏在 Bookmark 里；
- 应该随时可访问。

因此它们创造了一层新的浏览状态：

```
Bookmark
   ↓
长期保存（未来可能访问）

Essential / Favorite
   ↓
每天使用的数字基础设施

Pinned Tab
   ↓
当前项目固定资源

Normal Tab
   ↓
临时任务

```

---

# 2. Arc Favorites 产品分析

## 2.1 官方定义

Arc 将 Favorites 定义为：

> Top Tabs Across Every Space

即：

**位于所有 Space 顶部共享的 Tab。**

Favorites 最大特点：

- 跨 Space
- 永久存在
- 位于 Sidebar 最顶部
- 使用 favicon 图标形式展示

官方限制：

- 最多 12 个 Favorites。 ([Arc 帮助中心](https://resources.arc.net/hc/en-us/articles/19230755904151-Favorites-Top-Tabs-Across-Every-Space?utm_source=chatgpt.com "Favorites: Top Tabs Across Every Space – Arc Help Center"))

---

## 2.2 Arc 信息架构

Arc Sidebar：

```
Sidebar

┌─────────────────┐
│ ⭐ Favorites     │
│ Gmail            │
│ Calendar         │
│ Github           │
│                  │
├─────────────────┤
│ Space A          │
│                  │
│ 📌 Pinned Tabs   │
│ Project Docs     │
│ Figma            │
│                  │
│ Tabs             │
│ Search Result    │
│                  │
├─────────────────┤
│ Space B          │
└─────────────────┘

```

三层结构：


| 层级          | 生命周期  | 作用     |
| ----------- | ----- | ------ |
| Favorites   | 长期    | 个人基础工具 |
| Pinned Tabs | 项目周期  | 固定工作资源 |
| Tabs        | 分钟~小时 | 临时浏览   |


([Arc 帮助中心](https://resources.arc.net/hc/en-us/articles/19231060187159-Pinned-Tabs-Tabs-you-want-to-stick-around?utm_source=chatgpt.com "Pinned Tabs: Tabs you want to stick around – Arc Help Center"))

---

# 3. Favorites 的核心交互

## 3.1 添加

三种方式：

### 拖动

```
Tab
 ↓
Sidebar 顶部
 ↓
Favorite

```

### Command Palette

macOS:

```
⌘ + T

Move To Favorite Tab

```

### Context Menu

```
Right Click

Move To → Favorites

```

([Arc 帮助中心](https://resources.arc.net/hc/en-us/articles/19230755904151-Favorites-Top-Tabs-Across-Every-Space?utm_source=chatgpt.com "Favorites: Top Tabs Across Every Space – Arc Help Center"))

---

## 3.2 点击行为

Favorite 不是打开新页面。

它类似：

```
永久存在的浏览实例

```

点击：

```
Favorite Icon
       |
       v
恢复已有页面状态

```

例如：

打开 Gmail:

```
https://mail.google.com

```

状态：

```
Inbox
登录状态
当前滚动位置
未读邮件

```

保持。

---

# 4. Arc Favorites 的产品洞察

## 4.1 它解决的是“认知成本”

传统浏览器：

```
我要打开 Gmail

思考:
在哪里？
Bookmark?
历史记录?
输入网址?

```

Arc:

```
看到 Gmail 图标

点击

```

减少：

- 搜索成本
- 决策成本
- 页面寻找成本

---

## 4.2 它实际上是“浏览器 Dock”

类比：

macOS Dock：

```
App
 ↓
固定入口

```

Arc Favorites：

```
Web App
 ↓
固定入口

```

所以：

Favorites ≈ Web Dock

---

# 5. Zen Browser Essential Tabs 分析

Zen 的设计来源类似 Arc，但实现理念略不同。

Zen 在 v1.0.1-a.18 引入 Essentials：

> Essentials are pinned tabs that are not workspace specific.

即：

**Essential Tabs 是全 Workspace 共享的 Pinned Tabs。**

([Zen Browser](https://zen-browser.app/release-notes/?utm_source=chatgpt.com "Release notes - Zen"))

---

## 5.1 Zen 信息架构

```
Workspace

├── Essentials
│
│ Gmail
│ Github
│ ChatGPT
│
├── Pinned Tabs
│
│ Project A
│ Docs
│ Figma
│
└── Normal Tabs

```

---

## 5.2 Arc vs Zen


|             | Arc Favorites | Zen Essentials |
| ----------- | ------------- | -------------- |
| 定位          | 全球收藏入口        | 全局固定 Tab       |
| 显示          | 顶部 Icon       | Tab            |
| 来源          | Pinned Tab 特化 | Pinned Tab 全局化 |
| Workspace关系 | 跨 Space       | 跨 Workspace    |
| 视觉密度        | 低             | 高              |
| 强调          | 快速进入          | 持续存在           |


---

# 6. 两者产品哲学差异

## Arc：

核心：

> Reduce visual clutter

所以：

```
Favorite
= 一个入口

```

设计：

- favicon
- 小尺寸
- 极简

类似：

```
Dock

```

---

## Zen：

核心：

> Preserve browser workflow

所以：

```
Essential
= 一个特殊 Tab

```

设计：

- 保留 Tab 属性
- 更接近 Firefox 原生逻辑

类似：

```
Pinned App Tab

```

---

# 7. 用户模型分析

## 用户类型 A：工具型用户

每天：

```
Gmail
Slack
Calendar
GitHub
ChatGPT

```

需求：

固定入口。

适合：

Arc Favorites

---

## 用户类型 B：项目型用户

例如：

开发：

```
Project A Workspace

├ Github repo
├ Documentation
├ Figma
├ Jira

```

需求：

项目隔离。

适合：

Pinned Tabs

---

## 用户类型 C：研究型用户

大量：

```
论文
网页
资料
搜索结果

```

需求：

临时空间。

适合：

普通 Tabs

---

# 8. 如果复现这个功能，需要哪些模块？

## 产品目标

创建：

> 一个跨 Workspace 的永久 Web App 快捷层。

---

# PRD：Universal Favorite Tabs

## 1. 产品名称

Favorite Layer

---

# 2. 用户故事

## Story 1

作为用户：

我每天打开 Gmail。

我希望：

不用搜索、不用 Bookmark。

直接点击即可。

---

## Story 2

作为用户：

我切换项目空间。

我希望：

我的基础工具仍然存在。

---

# 3. 功能需求

## F1：Favorite Tab 管理

优先级：P0

支持：

添加：

```
Tab
 ↓
Favorite Zone

```

删除：

```
右键
Remove Favorite

```

排序：

```
Drag & Drop

```

---

## F2：跨 Workspace

数据模型：

```typescript
FavoriteTab {
 id:string

 url:string

 title:string

 favicon:string

 createdAt:number

 workspace:"global"
}

```

核心：

workspace=null

表示：

```
所有 workspace 可见

```

---

## F3：状态保持

打开：

```
Favorite

```

恢复：

- URL
- cookies
- session
- scroll position

---

## F4：快速访问

快捷键：

```
Cmd + 1
Cmd + 2
Cmd + 3

```

例如：

```
Cmd+1

打开 Gmail

```

---

# 9. UI设计

## Sidebar

```
┌─────────────┐
│ ● ● ● ● ●  │
│             │
├─────────────┤
│ Workspace A │
│             │
│ Tabs        │
└─────────────┘

```

---

Hover:

```
favicon

↓

tooltip:

"Gmail"

```

---

# 10. 增强版设计（超越 Arc）

## Feature 1：AI 自动推荐 Favorite

检测：

用户行为：

```
每天访问 Gmail 20次
每天访问 Github 15次

```

AI：

```
是否加入 Favorite?

```

---

## Feature 2：动态 Favorite

例如：

开发者：

```
GitHub Repo

```

自动：

```
Favorite
↓
当前项目 Repo

```

---

## Feature 3：Favorite 分组

Arc 最大问题：

12 个限制。

改进：

```
Favorites

Work
 ├ Gmail
 ├ Slack

Personal
 ├ Youtube
 ├ Reddit

```

---

# 11. 技术实现方案

## Chromium

可利用：

```
chrome.tabs API

```

保存：

```
chrome.storage.local

```

结构：

```json
{
favorites:[
 {
  url:"https://github.com",
  tabId:123,
  title:"Github"
 }
]
}

```

---

监听：

```javascript
chrome.tabs.onActivated
chrome.tabs.onUpdated

```

同步状态。

---

# 12. 最小可行版本 MVP

周期：

1-2 周

实现：

✅ Favorite 区域

✅ 添加 Tab

✅ 删除 Tab

✅ 点击恢复

✅ 排序

✅ favicon

不实现：

❌ AI推荐

❌ 云同步

❌ 分组

❌ 自动管理

---

# 13. 最终产品定位

如果做一个类似 Arc/Zen 的功能：

最佳定位不是：

> 收藏夹增强

而是：

> 浏览器里的 Web 应用启动器（Web App Dock）

产品结构：

```
Browser OS Layer


Favorite Layer
        |
Workspace Layer
        |
Tab Layer

```

Arc 做到了：

**把网页从“文档”提升成“应用”。**

Zen 做到了：

**把这个概念融合进传统浏览器工作流。**

如果继续扩展，可以进一步研究 **Arc Spaces + Favorites + Little Arc + Air Traffic Control 如何组成完整的“浏览器操作系统”模型**，这对于设计类似 Polaris 这类 AI 浏览器助手会更有参考价值。