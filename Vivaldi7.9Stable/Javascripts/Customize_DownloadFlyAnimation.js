// ==UserScript==
// @name         DownloadFlyAnimation
// @description  Creates a flying animation from click position to download panel when downloads start
// @version      2026.5.1
// @author       PaRr0tBoY
// ==/UserScript==

/*
 * Usage:
 * 1. Copy to <Vivaldi Dir>/Application/<Version>/resources/vivaldi/
 * 2. Include in window.html: <script src="DownloadFlyAnimation.js"></script>
 * 3. Enable DownloadFlyAnimation.css in Import.css
 * 4. Restart Vivaldi
 */

(() => {
  "use strict";

  const CONFIG = {
    // Animation duration in milliseconds
    animationDuration: 800,

    // Icon size
    iconSize: 32,

    // Enable debug logging
    debug: true,
  };

  const LOG_PREFIX = "[DownloadFlyAnimation]";

  const log = {
    info: (...args) => CONFIG.debug && console.log(`${LOG_PREFIX} [INFO]`, ...args),
    warn: (...args) => console.warn(`${LOG_PREFIX} [WARN]`, ...args),
    error: (...args) => console.error(`${LOG_PREFIX} [ERROR]`, ...args),
  };

  // Store last click position
  let lastClickPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  // Track click positions globally
  function trackClickPosition(event) {
    // Track both left and right clicks
    if (event.button === 0 || event.button === 2) {
      lastClickPosition = {
        x: event.clientX,
        y: event.clientY,
      };
      log.info("Click tracked at:", lastClickPosition);
    }
  }

  // Get download panel button position
  function getDownloadPanelPosition() {
    // Try multiple selectors to find download button
    const selectors = [
      '.toolbar > .button-toolbar > .ToolbarButton-Button[data-name="PanelDownloads"]',
      '.button-toolbar > .ToolbarButton-Button[data-name="PanelDownloads"]',
      'button.ToolbarButton-Button[data-name="PanelDownloads"]',
      '.button-toolbar > button[data-name="PanelDownloads"]',
      '.button-toolbar > button[title="Downloads"]',
      '.button-toolbar > button[title*="下载"]',
      '#panels button[data-name="PanelDownloads"]',
      'button[id*="panel"][title*="下载"]'
    ];

    for (const selector of selectors) {
      const downloadButton = document.querySelector(selector);
      if (downloadButton) {
        const rect = downloadButton.getBoundingClientRect();
        const pos = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
        log.info("Download button found with selector:", selector, "at position:", pos);
        return pos;
      }
    }

    log.warn("Download button not found, using fallback position");
    // Fallback to left side of screen
    return {
      x: 30,
      y: window.innerHeight / 2,
    };
  }

  // Create and animate download icon
  function createFlyingIcon(startPos, endPos) {
    const icon = document.createElement("div");
    icon.className = "download-fly-icon";

    // Create SVG download icon
    icon.innerHTML = `
      <svg width="${CONFIG.iconSize}" height="${CONFIG.iconSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3V16M12 16L7 11M12 16L17 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 17V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;

    // Set initial position
    icon.style.left = `${startPos.x}px`;
    icon.style.top = `${startPos.y}px`;

    // Calculate trajectory
    const deltaX = endPos.x - startPos.x;
    const deltaY = endPos.y - startPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Add curve control point (arc effect)
    const controlPointOffset = Math.min(distance * 0.3, 150);
    const midX = (startPos.x + endPos.x) / 2;
    const midY = (startPos.y + endPos.y) / 2 - controlPointOffset;

    // Set CSS custom properties for animation
    icon.style.setProperty("--start-x", `${startPos.x}px`);
    icon.style.setProperty("--start-y", `${startPos.y}px`);
    icon.style.setProperty("--mid-x", `${midX}px`);
    icon.style.setProperty("--mid-y", `${midY}px`);
    icon.style.setProperty("--end-x", `${endPos.x}px`);
    icon.style.setProperty("--end-y", `${endPos.y}px`);
    icon.style.setProperty("--duration", `${CONFIG.animationDuration}ms`);

    document.body.appendChild(icon);

    // Trigger animation
    requestAnimationFrame(() => {
      icon.classList.add("flying");
    });

    // Remove after animation
    setTimeout(() => {
      icon.remove();
      log.info("Flying icon removed");
    }, CONFIG.animationDuration + 100);

    log.info("Flying icon created from", startPos, "to", endPos);
  }

  // Trigger flying animation
  function triggerDownloadAnimation() {
    const startPos = { ...lastClickPosition };
    const endPos = getDownloadPanelPosition();

    createFlyingIcon(startPos, endPos);
  }

  // Monitor downloads using chrome.downloads API
  function initDownloadMonitor() {
    if (!chrome?.downloads) {
      log.error("chrome.downloads API not available");
      return;
    }

    chrome.downloads.onCreated.addListener((downloadItem) => {
      log.info("Download created:", downloadItem);

      // Small delay to ensure click position is captured
      setTimeout(() => {
        triggerDownloadAnimation();
      }, 50);
    });

    log.info("Download monitor initialized");
  }

  // Initialize
  function init() {
    // Track all clicks
    document.addEventListener("mousedown", trackClickPosition, true);

    // Wait for Vivaldi UI to be ready
    const checkReady = setInterval(() => {
      if (document.querySelector(".button-toolbar")) {
        clearInterval(checkReady);
        initDownloadMonitor();
        log.info("Initialized successfully");
      }
    }, 500);

    // Cleanup after 30 seconds if not ready
    setTimeout(() => clearInterval(checkReady), 30000);
  }

  // Start when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
