(function () {
    "use strict";

    // ========== Icons ==========

    // Gray stroke favicon for webpanel registration (visible in toolbar editor on any theme)
    var ICON_FAVICON = 'data:image/svg+xml;base64,' + btoa(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594zM20 2v4m2-2h-4"/>' +
        '<circle cx="4" cy="20" r="2"/></svg>'
    );

    // Inline SVGs with currentColor for theme-adaptive rendering
    var SVG_SPARKLES =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594zM20 2v4m2-2h-4"/>' +
        '<circle cx="4" cy="20" r="2"/></svg>';

    var SVG_LAYERS =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/>' +
        '<path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/>' +
        '<path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/></svg>';

    var SVG_DEV =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4"/>' +
        '<path d="M9 18c-4.51 2-5-2-7-2"/></svg>';

    // ========== Constants ==========
    var name = '\u5feb\u6377\u6253\u5f00';
    var webPanelId = 'WEBPANEL_quick-opena1b2c3d4e';
    var code = 'data:text/html;charset=utf-8,' + encodeURIComponent(
        '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + name + '</title></head><body></body></html>'
    );

    // ========== React Props Utility (same pattern as AskInPage.js) ==========
    var reactPropsKey = null;

    function getReactProps(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (!element || element.ownerDocument !== document) {
            return;
        }
        if (!reactPropsKey) {
            reactPropsKey = Object.keys(element).find(function (key) {
                return key.startsWith('__reactProps');
            });
        }
        return element[reactPropsKey];
    }

    // ========== WebPanel Registration (same pattern as AskInPage.js) ==========
    function createWebPanel() {
        vivaldi.prefs.get('vivaldi.panels.web.elements', function (elements) {
            var elementsArr = (elements && elements.value !== undefined) ? elements.value : elements;
            if (!elementsArr) return;

            var element = elementsArr.find(function (item) { return item.id === webPanelId; });
            if (!element) {
                element = {
                    activeUrl: code,
                    faviconUrl: ICON_FAVICON,
                    faviconUrlValid: true,
                    id: webPanelId,
                    mobileMode: false,
                    origin: 'user',
                    resizable: false,
                    title: name,
                    url: code,
                    width: -1,
                    zoom: 1,
                };
                elementsArr.unshift(element);
            } else {
                element.activeUrl = code;
                element.faviconUrl = ICON_FAVICON;
                element.faviconUrlValid = true;
                element.url = code;
                element.title = name;
            }

            vivaldi.prefs.set({
                path: 'vivaldi.panels.web.elements',
                value: elementsArr,
            });

            // Add to panel toolbar if not already present in any toolbar
            Promise.all([
                'vivaldi.toolbars.panel',
                'vivaldi.toolbars.navigation',
                'vivaldi.toolbars.status',
                'vivaldi.toolbars.mail',
                'vivaldi.toolbars.mail_message',
                'vivaldi.toolbars.mail_composer',
            ].map(function (path) { return vivaldi.prefs.get(path); })).then(function (toolbars) {
                var hasPanel = toolbars.some(function (toolbar) {
                    var arr = (toolbar && toolbar.value !== undefined) ? toolbar.value : toolbar;
                    return arr && arr.some && arr.some(function (entry) { return entry === webPanelId; });
                });
                if (!hasPanel) {
                    var panels = toolbars[0];
                    var panelsArr = (panels && panels.value !== undefined) ? panels.value : panels;
                    if (Array.isArray(panelsArr)) {
                        var panelIndex = panelsArr.findIndex(function (entry) {
                            return entry.startsWith('WEBPANEL_');
                        });
                        if (panelIndex >= 0) {
                            panelsArr.splice(panelIndex, 0, webPanelId);
                        } else {
                            panelsArr.push(webPanelId);
                        }
                        vivaldi.prefs.set({
                            path: 'vivaldi.toolbars.panel',
                            value: panelsArr,
                        });
                    }
                }
            });
        });
    }

    // ========== Panel UI (renders inside the sidebar panel area) ==========
    var panelRoot = null;

    function createPanelRoot() {
        panelRoot = document.createElement('div');
        panelRoot.className = 'quick-open-panel';

        var items = [
            { url: 'vivaldi://extensions', label: '\u6269\u5c55\u7ba1\u7406', svg: SVG_LAYERS },
            { url: 'vivaldi://inspect/#apps', label: '\u524d\u7aef\u8bca\u65ad', svg: SVG_DEV },
        ];

        items.forEach(function (item) {
            var div = document.createElement('div');
            div.className = 'quick-open-panel-item';

            var iconSpan = document.createElement('span');
            iconSpan.className = 'quick-open-panel-icon';
            iconSpan.innerHTML = item.svg;

            var labelSpan = document.createElement('span');
            labelSpan.className = 'quick-open-panel-label';
            labelSpan.textContent = item.label;

            div.appendChild(iconSpan);
            div.appendChild(labelSpan);
            panelRoot.appendChild(div);

            div.addEventListener('click', function () {
                chrome.tabs.create({ url: item.url });
            });
        });

        return panelRoot;
    }

    function ensurePanelUI(panel) {
        // Clean up stale roots (from React re-renders)
        panel.querySelectorAll(':scope > .quick-open-panel').forEach(function (node) {
            if (node !== panelRoot) {
                node.remove();
            }
        });

        if (!panelRoot) {
            createPanelRoot();
        }

        // Append root into panel if not already there
        if (panelRoot.parentNode !== panel) {
            panel.appendChild(panelRoot);
        }

        // Hide the webview content safely via CSS (data attribute)
        var webview = panel.querySelector('webview');
        if (webview) {
            webview.tabIndex = -1;
        }

        panel.dataset.quickOpen = 'true';
    }

    // ========== Update Loop (same debounce pattern as AskInPage.js) ==========
    var updateQueued = false;

    function scheduleUpdate() {
        if (updateQueued) return;
        updateQueued = true;
        requestAnimationFrame(function () {
            updateQueued = false;
            runUpdate();
        });
    }

    function runUpdate() {
        // --- Part 1: Replace toolbar button icons with inline SVG ---
        var btnSelector = '.toolbar > .button-toolbar > .ToolbarButton-Button[data-name*="' + webPanelId + '"]';
        var buttons = document.querySelectorAll(btnSelector);

        buttons.forEach(function (btn) {
            if (btn.dataset.quickOpenIcon) return;
            btn.dataset.quickOpenIcon = 'true';

            var img = btn.querySelector('img');
            if (img) {
                var iconSpan = document.createElement('span');
                iconSpan.className = 'quick-open-toolbar-icon';
                iconSpan.innerHTML = SVG_SPARKLES;
                img.style.display = 'none';
                img.parentNode.insertBefore(iconSpan, img);
            }
            btn.title = name;
        });

        // --- Part 2: Inject custom UI into the sidebar panel ---
        var props = getReactProps('.panel-group .webpanel-stack');
        if (!props || !props.children) return;

        var children = Array.isArray(props.children)
            ? props.children.filter(Boolean)
            : [props.children].filter(Boolean);

        var webPanelIndex = -1;
        for (var i = 0; i < children.length; i++) {
            if (children[i] && children[i].key === webPanelId) {
                webPanelIndex = i + 1; // 1-based for CSS :nth-child
                break;
            }
        }
        if (webPanelIndex <= 0) return;

        var panel = document.querySelector(
            '.panel-group .webpanel-stack .panel.webpanel:nth-child(' + webPanelIndex + ')'
        );

        if (panel) {
            ensurePanelUI(panel);
        }
    }

    // ========== Init ==========
    function waitForReady(callback) {
        var count = 0;
        var interval = setInterval(function () {
            count++;
            if (document.getElementById('browser') && window.vivaldi && window.vivaldi.prefs) {
                clearInterval(interval);
                callback();
            } else if (count > 200) {
                clearInterval(interval);
            }
        }, 100);
    }

    waitForReady(function () {
        createWebPanel();
        scheduleUpdate();

        var observerRoot = document.querySelector('#panels-container .webpanel-stack') ||
                           document.querySelector('#panels-container') ||
                           document.getElementById('browser') ||
                           document.body;

        new MutationObserver(function () {
            scheduleUpdate();
        }).observe(observerRoot, {
            childList: true,
            subtree: true,
        });
    });

})();
