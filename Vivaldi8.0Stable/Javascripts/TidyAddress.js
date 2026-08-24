// ==UserScript==
// @name         Vivid Address
// @description  Rewrites the visible URL suffix into an AI-generated slug while preserving the real address.
// @version      2026.7.21
// @author       PaRr0tBoY
// ==/UserScript==

(function vivid_address() {
  "use strict";

  // ==================== AI Configuration ====================
  // Uses shared VividAI module for AI config + API calls.
  // apiKey and other settings are loaded from OPFS config.json via VividAI.
  VividAI.loadConfig({ modKey: "tidyAddress" });
  window.addEventListener("vivaldi-mod-ai-config-updated", (event) => {
    VividAI.applyConfig(event.detail || {});
  });

  const STYLE_ID = "vivid-address-styles";
  const SLUG_NODE_CLASS = "VividAddress-Slug";
  const STORAGE_KEY = "vivid-address-cache-v1";
  const CACHE_LIMIT = 600;
  const LOADING_STATE = "loading";
  const READY_STATE = "ready";
  const FALLBACK_STATE = "fallback";
  const SKIP_STATE = "skip";
  const SYNC_INTERVAL_MS = 400;

  const STYLE = `
    .UrlBar-AddressField[data-vivid-address-state="loading"] .UrlFragment-LinkWrapper > :not(:first-child),
    .UrlBar-AddressField[data-vivid-address-state="ready"] .UrlFragment-LinkWrapper > :not(:first-child) {
      display: none;
    }

    .UrlBar-AddressField[data-vivid-address-state="ready"] .${SLUG_NODE_CLASS} {
      display: inline-flex;
    }

    .UrlBar-AddressField .${SLUG_NODE_CLASS} {
      display: none;
      align-items: center;
      color: var(--LowlightColor);
      pointer-events: none;
      white-space: nowrap;
      max-width: min(48vw, 520px);
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .UrlBar-AddressField .${SLUG_NODE_CLASS} > bdi {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .UrlBar-UrlObfuscationWarning {
      display: none;
    }
  `;

  class VividAddress {
    constructor() {
      this.slugCache = this.loadCache();
      this.syncScheduled = false;
      this.pendingRequests = new Set();
      this.syncTimer = null;
      this.browserObserver = null;
      this.browserObserverTarget = null;
      this.urlFieldObserver = null;
      this.urlFieldObserverTarget = null;
      this.titleObserver = null;
      this.titleObserverTarget = null;
      this.autoHideObserver = null;
      this.autoHideObserverTarget = null;
      this.configUpdateHandler = () => this.scheduleSync();
      this.init();
    }

    init() {
      this.injectStyle();
      this.attachObservers();
      window.addEventListener(
        "vivaldi-mod-ai-config-updated",
        this.configUpdateHandler
      );
      this.scheduleSync();
      this.syncTimer = window.setInterval(() => this.sync(), SYNC_INTERVAL_MS);
    }

    injectStyle() {
      if (document.getElementById(STYLE_ID)) {
        return;
      }
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE;
      document.head.appendChild(style);
    }

    attachObservers() {
      const browser = document.querySelector("#browser");
      if (browser && browser !== this.browserObserverTarget) {
        this.browserObserver?.disconnect();
        this.browserObserver = new MutationObserver(() => this.scheduleSync());
        this.browserObserver.observe(browser, {
          childList: true,
          subtree: true,
        });
        this.browserObserverTarget = browser;
      }

      const urlFieldInput = document.querySelector("#urlFieldInput");
      if (urlFieldInput && urlFieldInput !== this.urlFieldObserverTarget) {
        this.urlFieldObserver?.disconnect();
        this.urlFieldObserver = new MutationObserver(() => this.scheduleSync());
        this.urlFieldObserver.observe(urlFieldInput, {
          attributes: true,
          attributeFilter: ["value"],
        });
        urlFieldInput.addEventListener("input", () => this.scheduleSync(), true);
        this.urlFieldObserverTarget = urlFieldInput;
      }

      const titleNode = document.querySelector("title");
      if (titleNode && titleNode !== this.titleObserverTarget) {
        this.titleObserver?.disconnect();
        this.titleObserver = new MutationObserver(() => this.scheduleSync());
        this.titleObserver.observe(titleNode, {
          childList: true,
          subtree: true,
        });
        this.titleObserverTarget = titleNode;
      }

      const autoHideWrapper = document.querySelector(
        ".auto-hide-wrapper:has(.mainbar)"
      );
      if (autoHideWrapper && autoHideWrapper !== this.autoHideObserverTarget) {
        this.autoHideObserver?.disconnect();
        this.autoHideObserver = new MutationObserver(() => this.scheduleSync());
        this.autoHideObserver.observe(autoHideWrapper, {
          attributes: true,
          attributeFilter: ["class"],
        });
        this.autoHideObserverTarget = autoHideWrapper;
      }
    }

    scheduleSync() {
      if (this.syncScheduled) {
        return;
      }
      this.syncScheduled = true;
      window.requestAnimationFrame(() => {
        this.syncScheduled = false;
        this.sync();
      });
    }

    sync() {
      this.attachObservers();

      // Skip when mainbar auto-hide is active and address bar is hidden
      const autoHideWrapper = document.querySelector(
        ".auto-hide-wrapper:has(.mainbar)"
      );
      if (autoHideWrapper && !autoHideWrapper.classList.contains("show")) {
        return;
      }

      const addressField = document.querySelector(".UrlBar-AddressField");
      const wrapper = document.querySelector(
        ".UrlBar-AddressField .UrlFragment-Wrapper"
      );
      if (!addressField || !wrapper) {
        return;
      }

      const context = this.getCurrentContext();
      if (!context) {
        this.resetToOriginal(addressField, wrapper);
        return;
      }

      const slugNode = this.ensureSlugNode(wrapper);
      const entry = this.slugCache[context.urlKey];

      if (entry?.state === READY_STATE && entry.slug) {
        addressField.dataset.vividAddressState = READY_STATE;
        slugNode.querySelector("bdi").textContent = `\u00a0/\u00a0${entry.slug}`;
      } else if (entry?.state === FALLBACK_STATE) {
        this.resetToOriginal(addressField, wrapper);
      } else if (entry?.state === SKIP_STATE) {
        this.resetToOriginal(addressField, wrapper);
      } else if (!VividAI.config.apiKey) {
        this.resetToOriginal(addressField, wrapper);
      } else {
        addressField.dataset.vividAddressState = LOADING_STATE;
        slugNode.querySelector("bdi").textContent = "";
        this.requestSlug(context);
      }
    }

    getCurrentContext() {
      const rawUrl =
        document.querySelector("#urlFieldInput")?.value?.trim() ||
        document
          .querySelector(".webpageview.active.visible webview")
          ?.getAttribute("src")
          ?.trim() ||
        "";

      if (!rawUrl) {
        return null;
      }

      try {
        const parsed = new URL(rawUrl);
        if (!/^https?:$/.test(parsed.protocol)) {
          return null;
        }
        return {
          url: parsed.href,
          urlKey: parsed.href,
          domain: parsed.host,
          originalPath:
            parsed.pathname +
            (parsed.search || "") +
            (parsed.hash || ""),
        };
      } catch (error) {
        return null;
      }
    }

    ensureSlugNode(wrapper) {
      let slugNode = wrapper.querySelector(`.${SLUG_NODE_CLASS}`);
      if (slugNode && slugNode.parentNode !== wrapper) {
        slugNode.remove();
        slugNode = null;
      }
      if (slugNode) {
        return slugNode;
      }

      slugNode = document.createElement("span");
      slugNode.className = `UrlFragment--Lowlight UrlFragment-Link ${SLUG_NODE_CLASS}`;
      const textNode = document.createElement("bdi");
      slugNode.appendChild(textNode);
      wrapper.appendChild(slugNode);
      return slugNode;
    }

    resetToOriginal(addressField, wrapper) {
      delete addressField.dataset.vividAddressState;
      const slugNode = wrapper.querySelector(`.${SLUG_NODE_CLASS}`);
      if (slugNode) {
        slugNode.remove();
      }
    }

    requestSlug(context) {
      if (this.pendingRequests.has(context.urlKey)) {
        return;
      }

      const existingEntry = this.slugCache[context.urlKey];
      if (
        existingEntry?.state === READY_STATE ||
        existingEntry?.state === FALLBACK_STATE ||
        existingEntry?.state === SKIP_STATE
      ) {
        return;
      }

      this.pendingRequests.add(context.urlKey);

      this.generateSlug(context)
        .then((slug) => {
          if (slug) {
            this.slugCache[context.urlKey] = {
              state: READY_STATE,
              slug,
              savedAt: Date.now(),
            };
            this.pruneCache();
            this.saveCache();
          } else {
            this.slugCache[context.urlKey] = {
              state: context.originalPath && context.originalPath !== "/"
                ? FALLBACK_STATE
                : SKIP_STATE,
            };
          }
          this.scheduleSync();
        })
        .catch((error) => {
          console.error("[VividAddress] Failed to generate slug:", error);
          this.slugCache[context.urlKey] = {
            state: context.originalPath && context.originalPath !== "/"
              ? FALLBACK_STATE
              : SKIP_STATE,
          };
          this.scheduleSync();
        })
        .finally(() => {
          this.pendingRequests.delete(context.urlKey);
        });
    }

    async generateSlug(context) {
      if (!VividAI.config.apiKey) {
        return null;
      }

      const title = await this.getActiveTabTitle(context.url);
      const prompt = this.buildPrompt(title, context.url);

      try {
        const data = await VividAI.fetchJSON({
          messages: [{ role: "user", content: prompt }],
          temperature: VividAI.config.temperature,
          maxTokens: VividAI.config.maxTokens,
          extra: {
            response_format: { type: "json_object" },
            thinking: { type: "disabled" },
          },
        });

        const rawContent = this.extractResponseContent(data);
        const parsed = this.parseJsonPayload(rawContent);
        const slug = this.sanitizeSlug(parsed?.slug || rawContent);
        return slug || null;
      } catch (error) {
        console.error("[VividAddress] API error:", error?.message || error);
        return null;
      }
    }

    async getActiveTabTitle(fallbackUrl) {
      const fallbackTitle =
        document.querySelector(".tab.active .title")?.textContent?.trim() ||
        document.querySelector("title")?.textContent?.trim() ||
        fallbackUrl;

      if (!chrome?.tabs?.query) {
        return fallbackTitle;
      }

      try {
        const tabs = await new Promise((resolve) => {
          chrome.tabs.query(
            { active: true, currentWindow: true },
            (result) => resolve(Array.isArray(result) ? result : [])
          );
        });
        const activeTab = tabs[0];
        return activeTab?.title?.trim() || fallbackTitle;
      } catch (error) {
        return fallbackTitle;
      }
    }

    buildPrompt(title, url) {
      const safeTitle = String(title || "")
        .replace(/`/g, "\\`")
        .replace(/\${/g, "\\${");
      const safeUrl = String(url || "")
        .replace(/`/g, "\\`")
        .replace(/\${/g, "\\${");

      return `You rewrite the visible suffix of a browser URL for display only.

Page title: \`${safeTitle}\`
Page URL: \`${safeUrl}\`

Rules:
- The browser UI will render this as \`domain / slug\`.
- Return only the slug text. Do not include the domain name.
- Do not include any slash, protocol, query string, quotes, code fences, or explanation.
- Prefer a concise human-readable slug, usually 1 to 4 words.
- If the URL already has a strong, specific, readable slug, reuse that URL slug directly instead of inventing a new one.
- Use the title and URL together to judge what best identifies the page.
- Keep important proper nouns when they matter.

Return JSON:
\`\`\`json
{"slug":"string"}
\`\`\``;
    }

    extractResponseContent(data) {
      const choice = data?.choices?.[0];
      if (!choice) {
        return "";
      }

      if (typeof choice.message?.content === "string") {
        return choice.message.content;
      }

      if (Array.isArray(choice.message?.content)) {
        return choice.message.content
          .map((part) => {
            if (typeof part === "string") {
              return part;
            }
            if (typeof part?.text === "string") {
              return part.text;
            }
            return "";
          })
          .join("")
          .trim();
      }

      if (typeof choice.text === "string") {
        return choice.text;
      }

      return "";
    }

    parseJsonPayload(content) {
      if (!content) {
        return null;
      }

      let text = String(content).trim();
      const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (fencedMatch) {
        text = fencedMatch[1].trim();
      }

      const firstBrace = text.indexOf("{");
      const lastBrace = text.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1) {
        text = text.slice(firstBrace, lastBrace + 1);
      }

      try {
        return JSON.parse(text);
      } catch (error) {
        return null;
      }
    }

    sanitizeSlug(input) {
      if (!input) {
        return "";
      }

      return String(input)
        .replace(/<(thought|reasoning)>[\s\S]*?<\/\1>/gi, "")
        .replace(/^['"`]+|['"`]+$/g, "")
        .replace(/^\/+|\/+$/g, "")
        .replace(/\s*\/\s*/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
    }

    loadCache() {
      try {
        const raw =
          window.localStorage.getItem(STORAGE_KEY) ||
          window.sessionStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        if (!parsed || typeof parsed !== "object") {
          return {};
        }

        const filtered = {};
        for (const [urlKey, entry] of Object.entries(parsed)) {
          if (
            entry &&
            typeof entry === "object" &&
            entry.state === READY_STATE &&
            typeof entry.slug === "string" &&
            entry.slug.trim()
          ) {
            filtered[urlKey] = {
              state: READY_STATE,
              slug: entry.slug.trim(),
              savedAt: Number.isFinite(entry.savedAt) ? entry.savedAt : 0,
            };
          }
        }
        return filtered;
      } catch (error) {
        return {};
      }
    }

    pruneCache() {
      const entries = Object.entries(this.slugCache);
      if (entries.length <= CACHE_LIMIT) {
        return;
      }

      const keep = entries
        .filter(([, entry]) => entry?.state === READY_STATE && entry.slug)
        .sort(([, a], [, b]) => (b.savedAt || 0) - (a.savedAt || 0))
        .slice(0, CACHE_LIMIT);
      this.slugCache = Object.fromEntries(keep);
    }

    saveCache() {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(
            Object.fromEntries(
              Object.entries(this.slugCache).filter(
                ([, entry]) => entry?.state === READY_STATE && entry.slug
              )
            )
          )
        );
      } catch (error) {
        console.warn("[VividAddress] Failed to persist cache:", error);
      }
    }
  }

  const interval = window.setInterval(() => {
    if (!document.querySelector("#browser")) {
      return;
    }
    window.clearInterval(interval);
    window.vividAddress = new VividAddress();
  }, 100);
})();
