<!-- source-commit: 648ded9fb2f613c022a437bc2e1bb350116bad5b -->
以下是翻译后的中文README内容：


## 快速开始

适用于[Vivaldi 8.0+](./Vivaldi8.0Stable)。检查您的版本为`vivaldi:about`。  

**Windows**（PowerShell）：  
```powershell
irm https://raw.githubusercontent.com/PaRr0tBoY/Awesome-Vivaldi/main/install.ps1 | iex
```  

**macOS**（bash）：  
```bash
curl -fsSL https://raw.githubusercontent.com/PaRr0tBoY/Awesome-Vivaldi/main/install.sh | bash
```  

**Linux**（bash）：  
```bash
curl -fsSL https://raw.githubusercontent.com/PaRr0tBoY/Awesome-Vivaldi/main/install.sh | sudo bash
```  

卸载时，同样运行该脚本。  

⚠️ 偏好手动配置？查看 **[Installation Guide](./Vivaldi8.0Stable/README.md)**。  
⚠️ 有编程助手？询问它：`Install https://github.com/PaRr0tBoY/Awesome-Vivaldi 为我。`  


---

## 功能展示

![PATH_018 width="100%" alt="功能展示"]  

| 功能 | 组件文件 | 实现功能 |
| :----------------------------------------------------------------------- | :--------------------------------------- | :------------------------------------------------------------------------------------------ |
| ![VividPeek](./Others/assets/ArcPeek.gif)                             | `VividPeek.css` + `VividPeek.js`        | Arc风格的预览面板 — 在浮层中预览标签页而不离开当前页面 |
| ![VividPlayer](./Others/assets/VividPlayer.gif)                             | `VividPlayer.css` + `VividPlayer.js`    | 媒体播放器浮层（带进度条、封面和播放控制） |
| ![PeekTabbar](./Others/assets/PeekTabbar.gif)                             | `PeekTabbar.css`                        | 鼠标悬停自动隐藏的导航栏（带两层堆叠） |

---

## Vivaldi MAX AI功能

需要启用[OpenAI-compatible API key](https://github.com/cheahjs/free-llm-api-resources?tab=readme-ov-file#opencode-zen)。在 `vivaldi:settings/appearance/` → Volante 设置中配置。  

| 功能 | 组件文件 | 实现功能 |
| :----------------------------------------------------------------------- | :--------------------------------------- | :---------------------------------------------------------------------- |
| ![TidyTabs](./Others/assets/VivaldiMax.gif)                             | `TidyTabs.js` + `TidyTitles.js`          | AI智能分组与标题清理 |
| ![TidyDownloads](./Others/assets/TidyDownloads.gif)                             | `TidyDownloads.js`                       | 将混乱的下载文件名整理为可读命名 |
| ![TidyAddress](./Others/assets/tidyaddress.gif)                             | `TidyAddress.js`                         | 将URL后缀重写为易读片段 |
| ![AskOnPage](./Others/assets/AskInPage.png)                             | `AskOnPage.js` + `AskOnPage.css`         | Ctrl+F AI网页搜索（带引用标注的内联搜索） |

---

## 模块列表

### CSS模块

| 文件 | 说明 |
| :------------------------- | :------------------------------------------------------- |
| `VividToast.css`           | 通知主题样式 |
| `VividPeek.css`            | Arc预览面板样式（需`VividPeek.js`） |
| `PeekTabbar.css`           | 悬停自动隐藏导航栏（多层堆叠） |
| `VividPlayer.css`          | 媒体播放器浮层样式 |
| `TidyTabs.css`             | AI分组的可视效果（需`TidyTabs.js`） |

### JavaScript模块

| 文件 | 说明 |
| :-------------------- | :------------------------------------------------------------------ |
| `VividPeek.js`         | [Arc peek dialog](./Doc/mod/VividPeek.md) — 在不切换页面的情况下预览标签页 |
| `TidyTabs.js`          | [AI tab grouping](./Doc/mod/TidyTabs.md)                                                           |

---

## 文档

访问完整文档 **[parr0tboy.github.io/docs](https://parr0tboy.github.io/docs/)**：设计理念、模块架构深度解析、API参考及Vivaldi内部反向工程。  

---

## 社区模块

以下模块来自[Vivaldi Forum](https://forum.vivaldi.net/)社区，已包含在项目中：  

| 模块 | 源码 |
| :------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| Element Capture ✨                  | [Forum](https://forum.vivaldi.net/topic/103686/element-capture) — 自动选择截图区域 |
| Colorful Tabs                       | [Forum](https://forum.vivaldi.net/topic/96586/colorful-tabs) — 基于图标的标签彩色 |

---

## 小技巧

<details>
  <summary>创建一键重启按钮（适用于开发者）</summary>
  1. 访问 `vivaldi://vivaldi-urls/` → 启用**内部调试页面**  
  2. 在快速命令（`vivaldi:settings/qc/`）添加“**在当前标签页打开链接**”：`chrome://restart`  
  3. 通过工具栏自定义添加该按钮  
  4. 可选：在主题设置中修改图标 `vivaldi:settings/themes/`  
</details>

---

## 致谢  

感谢[LINUX DO](https://linux.do)社区对开发的支持。
