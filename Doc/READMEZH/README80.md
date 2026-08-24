<!-- source-commit: 37061dad0cd3d7711e067aad0362ef1179d01439 -->
[English](../../Vivaldi8.0Stable/README.md) | **简体中文**

<p align="center"><img src="../Others/assets/hero-80.svg" width="100%" alt="Volante — Vivaldi 8.0 稳定版安装指南"></p>

<div align="center">

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/PaRr0tBoY/Awesome-Vivaldi)
[![Vivaldi Forum](https://img.shields.io/badge/Vivaldi-Forum-red)](https://forum.vivaldi.net/topic/112064/modpack-community-essentials-mods-collection?_=1761221602450)
![GitHub Repo stars](https://img.shields.io/github/stars/PaRr0tBoY/Awesome-Vivaldi)

**英语** | [简体中文](../Doc/READMEZH/README80.md)

</div>

---

## 目录

- [Prerequisites](#prerequisites)
- [Install CSS Mods](#install-css-mods)
- [Install JavaScript Mods](#install-javascript-mods)
- [Settings Panel](#settings-panel)
- [Update](#update)
- [Development](#development)
- [FAQ](#faq)

---

## 前提条件

Open `vivaldi:about` to check your version. Then apply these settings:

| Setting | Path | Value |
|:---|:---|:---|
| UI Auto-hide | `vivaldi:settings/appearance/` → UI Auto-Hide | **启用** |
| Tab Stacking | `vivaldi:settings/tabs/` → Tab Stacking | **两层 (非紧凑)** |
| New Tab Position | `vivaldi:settings/tabs/` → New Tab Position | **与相关标签页关联的标签栈** |
| Quick Commands | `vivaldi:settings/qc/` → Quick Command Options | **在新标签页中打开链接** |

---

## 安装 CSS 模块

1. 打开 `vivaldi://flags/#vivaldi-css-mods` → **启用** → 重启
2. 前往 **设置 → 外观 → 自定义 UI 修改**
3. 选择包含 `Import.css` 的文件夹（此文件夹：`Vivaldi8.0Stable/`）
4. 重启 Vivaldi

> **7.7+**: CSS 模块旗帜移至 `vivaldi://flags/` —  — 搜索 "vivaldi-" 或前往 `chrome://flags/#vivaldi-css-mods`。

> **文件命名**：CSS 文件名中不能有空格。目录路径没问题。验证扩展在 Windows 上可见。

---

## 安装 JavaScript 模块

### 自动

| Platform | Tool |
|:---|:---|
| Windows | [Vivaldi Mod Manager](https://github.com/eximido/vivaldimodmanager) |
| Linux | [vivaldi-autoinject-custom-js-ui (AUR)](https://aur.archlinux.org/vivaldi-autoinject-custom-js-ui.git) |
| 所有 | [Patching Vivaldi with batch scripts](https://forum.vivaldi.net/topic/10592/patching-vivaldi-with-batch-scripts/21?page=2) |
| macOS | [upviv patch script](https://github.com/PaRr0tBoY/Vivaldi-Mods/blob/8a1e9f8a63f195f67f27ab2e5b86c4aff0081096/MacOSPatchScripts/upviv) |

### 手动

> ⚠️ 在编辑之前备份 `window.html`。损坏的文件可能导致 Vivaldi 无法启动。

1. 复制 [`Javascripts/`](./Javascripts/) 中的所有文件到：
   ```
   <VIVALDI>/Application/<VERSION>/resources/vivaldi/
   ```

2. 已包含的 `window.html` 已引用所有模块 —  — 替换原始文件
3. 重启 Vivaldi
4. 在 `vivaldi:inspect/#apps` → 检查 `window.html` → 在 Elements 标签页查看 `<script>` 标签

<details>
<summary>What window.html looks like</summary>

```html
<!-- Vivaldi 窗口文档 -->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Vivaldi</title>
    <link rel="stylesheet" href="style/common.css" />
    <link rel="stylesheet" href="chrome://vivaldi-data/css-mods/css" />
  </head>

  <body>
    <script src="TidyTitles.js"></script>
    <script src="TidyTabs.js"></script>
    <script src="TidyDownloads.js"></script>
    <script src="Diabar.js"></script>
    <script src="AskOnPage.js"></script>
    <script src="TabScroll.js"></script>
    <script src="MonochromeIcons.js"></script>
    <script src="VividAddress.js"></script>
    <script src="QuickCapture.js"></script>
    <script src="GlobalMediaControls.js"></script>
    <script src="EasyFiles.js"></script>
    <script src="ModConfig.js"></script>
    <script src="VividPeek.js"></script>
  </body>
</html>
```

</details>

> **AI 功能**: 可在 [cheahjs/free-llm-api-resources](https://github.com/cheahjs/free-llm-api-resources?tab=readme-ov-file#opencode-zen) 处获取免费兼容 OpenAI 的 API 密钥。

## 设置面板

`ModConfig.js` 在 `vivaldi:settings/appearance/` 中添加了 **Volante** 部分：

1. 与其他 JS 模块一起安装 `ModConfig.js` → 重启
2. 打开 `vivaldi:settings/appearance/` → 找到 **Volante**
3. 配置：
   - **AI 配置** — 端点、API 密钥、模型、每个模块的覆盖
   - **Arc Peek** — 点击修饰符、长按按钮、保持时间、自动打开模式
   - **Quick Capture** / **Auto Hide Panel** — 行为切换
4. 更改后 **保存**。使用 **Import** / **Export** 同步所有配置文件

设置存储在 `.askonpage/config.json`（Origin 私有文件系统）中。支持的模块会自动加载已保存的值。

## 更新

```bash
cd path/to/Awesome-Vivaldi
git pull

# 复制 CSS 模块文件夹内容到 Vivaldi CSS 模块文件夹
# 复制 Javascripts/ 到 <VIVALDI>/Application/<VERSION>/resources/vivaldi/
# 如果添加了新的脚本引用，请更新 window.html
```

## 开发

### 架构

- **CSS** — 通过 `Import.css` 中的 `@import` 引用。将新的 `.css` 文件添加到 `CSS/` 并在此文件中导入。
- **JavaScript** — 通过 `window.html` 中的 `<script>` 引用。将新的 `.js` 文件添加到 `Javascripts/` 并在此添加 `<script>` 标签

### 文件元数据

<details>
<summary>CSS — UserStyle 格式</summary>

```css
/* ==UserStyle==
 * @name         你的模块名称
 * @description  简要描述
 * @version      YYYY.MM.DD
 * @author       你的姓名
 * @website      https://github.com/PaRr0tBoY/Awesome-Vivaldi
 * ==/UserStyle==
 */
```

</details>

<details>
<summary>JavaScript — UserScript 格式</summary>

```javascript
// ==UserScript==
// @name         你的Mod
// @description  简要描述
// @version      YYYY.MM.DD
// @author       你的姓名
// ==/UserScript==
```

</details>

### 检查 Vivaldi UI

使用 `vivaldi:inspect/#apps` → 点击 `window.html` 的 **inspect** 以打开浏览器壳的 DevTools。参见 [Vivaldi UI Inspect Tutorial](https://forum.vivaldi.net/post/135732)。

### CSS 陷阱

| Issue | Solution |
|:---|:---|
| 变量在不同版本间失效 | 验证与 Computed Styles；倾向于使用硬编码 `px` |
| CSS 锚点定位不可靠 | 使用 `left: 50%; transform: translateX(-50%)` 替代 |
| 需要在较早的 DOM 元素上进行样式设置 | 使用 `:has()` 在公共父元素上进行样式设置 |
| Vivaldi 通过 JS 设置内联样式 | 使用 `position: fixed !important` 或 `!important` |

### JavaScript 陷阱

| Issue | Solution |
|:---|:---|
| MV3 脚本执行 | 使用 `chrome.scripting.executeScript`，而不是 `chrome.tabs.executeScript` |
| 工作区重建 `.tab-strip` | 在 `#browser` 上挂载 MutationObserver，重建时重新绑定内部观察者 |
| `chrome://` / `vivaldi://` 标签页 | 在执行 `executeScript` 前始终检查 `tab.url` — 在内部页面会抛出错误 |

### 资源

- [PrettyBundle.js](../Others/UsefulResources/Source/source/pretty-bundle.js) 与 [common.css](../Others/UsefulResources/Source/source/common.css) — Vivaldi 核心 bundle 文件
- [Docs portal](https://parr0tboy.github.io/docs/) — JavaScript 模块 API 参考
- [Vivaldi Browser Source](https://github.com/ric2b/Vivaldi-browser) | [DeepWiki](https://deepwiki.com/ric2b/Vivaldi-browser)
- [Lonm's API Reference](https://lonmcgregor.github.io/VivaldiModdersAPI/OfficialApi/everything.html)

### Vivaldi CSS 变量

| 类别 | 关键变量 |
|:---|:---|
| **背景** | `--colorBg`, `--colorBgAlpha`, `--colorBgDark`/`Darker`, `--colorBgLight`/`Lighter`, `--colorBgIntense`/`Intenser`, `--colorBgInverse`, `--colorBgFaded` |
| **前景** | `--colorFg`, `--colorFgIntense`, `--colorFgFaded`/`FadedMore`/`FadedMost` |
| **高亮** | `--colorHighlightBg`, `--colorHighlightFg`, `--colorHighlightBgDark`, `--colorHighlightBgAlpha` |
| **点缀** | `--colorAccentBg`, `--colorAccentFg`, `--colorAccentBorder`, `--colorAccentBgDark`/`Darker` |
| **边框** | `--colorBorder`, `--colorBorderSubtle`, `--colorBorderIntense`, `--colorBorderDisabled` |
| **语义** | `--colorSuccessBg`/`Fg`, `--colorWarningBg`/`Fg`, `--colorErrorBg`/`Fg` |

## 常见问题

### 安装后没有任何变化

- [ ] CSS 模块已在 `vivaldi://flags/#vivaldi-css-mods` 中启用？
- [ ] 在 **设置 → 外观 → 自定义 UI 修改** 中选择了正确的文件夹？路径应为 `Awesome-Vivaldi/Vivaldi8.0Stable`
- [ ] JS 文件已复制到 `<VIVALDI>/Application/<VERSION>/resources/vivaldi/`？

### AI 功能不工作

AI 模块需要 API 密钥。请在 **设置 → 外观 → Volante → AI 配置** 中配置，或直接在脚本文件的前几行进行编辑。

### FavouriteTabs 不显示

仅前 9 个 **固定** 标签页会显示为网格。至少固定一个标签页即可看到。注意：此模块可能会破坏标签弹出缩略图。

### 我没有看到任何可见变化

许多模块在后台运行。请查看 [Mod List](../README.md#mod-list) 了解每个模块的功能及其效果出现的时间。

### 某些功能似乎被禁用

某些模块是故意关闭的（有 bug 或未完成）。请手动启用：
- CSS → 编辑 [Import.css](./Import.css) — 取消注释 `@import`
- JS → 编辑 [window.html](./Javascripts/window.html) — 添加 `<script>` 标签

### 为什么我无法展开标签栏？

如果启用了 **更好动画**，且标签栏设置为自动隐藏（仅支持左侧或右侧垂直布局），标签栏仅在您将鼠标悬停至屏幕边缘时显示一条细约 8px 的条带。这是设计之初，旨在防止鼠标经过屏幕边缘时误触展开。

要完全展开标签栏，请使用以下方法：

| Method | How |
|:---|:---|
| **Click** | 点击出现在屏幕边缘的细条带 |
| **Hover 1 second** | 在出现的细条带上停留 1 秒，期间不要移开鼠标 |
| **Double-tap edge** | 将鼠标移至屏幕边缘，稍微后退，然后在 500ms 内再次点击边缘 |

如果标签栏根本不展开，请确认您的标签栏设置为 **左侧** 或 **右侧** — 此模块不适用于 **顶部** 或 **底部** 标签栏位置。

### 仍然不工作

1. 重启 Vivaldi
2. 再次检查文件路径（最常见问题）
3. 确认文件已被替换，而非与原文件并列复制