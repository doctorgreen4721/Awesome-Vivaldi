(function () {
    "use strict";

    // ========== SVG Icons ==========

    var SVG_STAR = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594zM20 2v4m2-2h-4"/><circle cx="4" cy="20" r="2"/></svg>';

    var SVG_LAYERS = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/></svg>';

    var SVG_DEV = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>';

    var SVG_RESTART = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>';

    // ========== Restart Logic (preserved from Customize_QuickOpen.js) ==========

    function setInputValue(input, value) {
        var descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
        if (descriptor && descriptor.set) {
            descriptor.set.call(input, value);
        } else {
            input.value = value;
        }
    }

    function submitUrlThroughAddressBar(url) {
        var input = document.querySelector('#urlFieldInput');
        if (!input) return false;

        try {
            input.focus();
            if (typeof input.select === 'function') {
                input.select();
            }
            setInputValue(input, url);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));

            var eventInit = {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true,
                composed: true,
            };

            input.dispatchEvent(new KeyboardEvent('keydown', eventInit));
            input.dispatchEvent(new KeyboardEvent('keypress', eventInit));
            input.dispatchEvent(new KeyboardEvent('keyup', eventInit));
            return true;
        } catch (e) { /* ignore */ }

        return false;
    }

    function openRestartTab(url) {
        try {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs && tabs[0]) {
                    chrome.tabs.update(tabs[0].id, { url: url, active: true }, function () {
                        if (chrome.runtime.lastError) {
                            try {
                                chrome.tabs.create({ url: url, active: true });
                            } catch (e) { /* ignore */ }
                        }
                    });
                    return;
                }

                chrome.tabs.create({ url: url, active: true });
            });
            return true;
        } catch (e) {
            try {
                chrome.tabs.create({ url: url, active: true });
                return true;
            } catch (err) { /* ignore */ }
        }

        return false;
    }

    function doRestart() {
        var restartHandled = false;

        function markRestartHandled() {
            restartHandled = true;
        }

        window.addEventListener('beforeunload', markRestartHandled, { once: true });

        try {
            if (window.vivaldi && vivaldi.utilities && typeof vivaldi.utilities.restart === 'function') {
                vivaldi.utilities.restart();
            }
        } catch (e) { /* ignore */ }

        setTimeout(function () {
            if (restartHandled) return;

            if (submitUrlThroughAddressBar('vivaldi://restart/')) {
                setTimeout(function () {
                    if (!restartHandled) {
                        submitUrlThroughAddressBar('chrome://restart/');
                    }
                }, 200);
            }
        }, 120);

        setTimeout(function () {
            if (!restartHandled) {
                openRestartTab('vivaldi://restart/');
            }
        }, 420);

        setTimeout(function () {
            if (!restartHandled) {
                openRestartTab('chrome://restart/');
            }
        }, 720);
    }

    // ========== Dropdown Menu Creation ==========

    var clickOutsideListener = null;

    // URL validation helper
    function isSafeURL(url) {
        try {
            var parsed = new URL(url);
            var allowedSchemes = ['http:', 'https:', 'vivaldi:', 'chrome:', 'chrome-extension:'];
            return allowedSchemes.indexOf(parsed.protocol) !== -1;
        } catch (e) {
            return false;
        }
    }

    function createDropdownMenu() {
        var dropdown = document.createElement('div');
        dropdown.className = 'vivaldi-toolbar-dropdown-menu';
        dropdown.dataset.visible = 'false';
        dropdown.style.cssText =
            'position: absolute;' +
            'right: 0;' +
            'top: 100%;' +
            'margin-top: 4px;' +
            'min-width: 200px;' +
            'background: var(--colorBg);' +
            'border: 1px solid var(--colorBorder);' +
            'border-radius: 6px;' +
            'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);' +
            'z-index: 10000;' +
            'display: none;' +
            'overflow: hidden;';

        var items = [
            { label: '扩展管理', svg: SVG_LAYERS, action: 'extensions', url: 'vivaldi://extensions' },
            { label: '前端诊断', svg: SVG_DEV, action: 'diagnostics', url: 'vivaldi://inspect/#apps' },
            { label: '重启 Vivaldi', svg: SVG_RESTART, action: 'restart' }
        ];

        // Use event delegation for hover effects to prevent memory leaks
        dropdown.addEventListener('mouseover', function(e) {
            var item = e.target.closest('.vivaldi-toolbar-dropdown-item');
            if (item) {
                item.style.background = 'var(--colorBgIntense)';
            }
        });

        dropdown.addEventListener('mouseout', function(e) {
            var item = e.target.closest('.vivaldi-toolbar-dropdown-item');
            if (item) {
                item.style.background = '';
            }
        });

        items.forEach(function(item) {
            var menuItem = document.createElement('div');
            menuItem.className = 'vivaldi-toolbar-dropdown-item';
            menuItem.dataset.action = item.action;
            menuItem.style.cssText =
                'display: flex;' +
                'align-items: center;' +
                'padding: 12px 16px;' +
                'cursor: pointer;' +
                'color: var(--colorFg);' +
                'transition: background 0.15s ease;';

            var iconSpan = document.createElement('span');
            iconSpan.className = 'vivaldi-toolbar-dropdown-icon';
            iconSpan.innerHTML = item.svg;
            iconSpan.style.cssText =
                'width: 20px;' +
                'height: 20px;' +
                'margin-right: 12px;' +
                'display: inline-flex;' +
                'align-items: center;' +
                'justify-content: center;';

            var labelSpan = document.createElement('span');
            labelSpan.className = 'vivaldi-toolbar-dropdown-label';
            labelSpan.textContent = item.label;

            menuItem.appendChild(iconSpan);
            menuItem.appendChild(labelSpan);
            dropdown.appendChild(menuItem);

            // Click handler with error handling
            menuItem.addEventListener('click', function() {
                if (item.action === 'restart') {
                    doRestart();
                } else {
                    // Validate URL before navigation
                    if (!isSafeURL(item.url)) {
                        console.error('[ToolbarQuickOpen] Blocked unsafe URL:', item.url);
                        return;
                    }

                    chrome.tabs.create({ url: item.url }, function(tab) {
                        if (chrome.runtime.lastError) {
                            console.error('[ToolbarQuickOpen] Failed to open tab:', chrome.runtime.lastError.message);
                        }
                    });
                }
                closeDropdown(dropdown);
            });
        });

        return dropdown;
    }

    // ========== Dropdown Toggle Logic ==========

    function toggleDropdown(dropdown, button) {
        var isVisible = dropdown.dataset.visible === 'true';
        if (isVisible) {
            closeDropdown(dropdown);
        } else {
            openDropdown(dropdown, button);
        }
    }

    function openDropdown(dropdown, button) {
        dropdown.style.display = 'block';
        dropdown.dataset.visible = 'true';

        // 锁定工具栏，防止自动隐藏
        lockToolbar();

        // Use requestAnimationFrame to avoid race condition
        // Store button/dropdown references in closure to avoid stale DOM queries
        requestAnimationFrame(function() {
            clickOutsideListener = function(e) {
                if (!button || !dropdown) return;

                if (!button.contains(e.target) && !dropdown.contains(e.target)) {
                    closeDropdown(dropdown);
                }
            };
            document.addEventListener('click', clickOutsideListener, true);
        });
    }

    function closeDropdown(dropdown) {
        dropdown.style.display = 'none';
        dropdown.dataset.visible = 'false';

        // 解锁工具栏，恢复自动隐藏
        unlockToolbar();

        // Remove click-outside listener
        if (clickOutsideListener) {
            document.removeEventListener('click', clickOutsideListener, true);
            clickOutsideListener = null;
        }
    }

    // ========== Toolbar Lock/Unlock for Auto-hide Prevention ==========

    var toolbarLockObserver = null;
    var isToolbarLocked = false;

    function lockToolbar() {
        var toolbar = document.querySelector('.toolbar-mainbar');
        if (!toolbar) return;

        // Find the auto-hide-wrapper container (this is what Vivaldi actually animates)
        var autoHideWrapper = toolbar.closest('.auto-hide-wrapper');
        if (!autoHideWrapper) {
            console.warn('[ToolbarQuickOpen] .auto-hide-wrapper not found');
            return;
        }

        isToolbarLocked = true;
        toolbar.classList.add('toolbar-locked-by-dropdown');
        toolbar.setAttribute('data-dropdown-open', 'true');

        // Force the auto-hide-wrapper to be visible
        forceWrapperVisible(autoHideWrapper);

        // Create MutationObserver to prevent Vivaldi from hiding the wrapper
        if (!toolbarLockObserver) {
            toolbarLockObserver = new MutationObserver(function(mutations) {
                if (!isToolbarLocked) return;

                mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        // Re-force visibility if Vivaldi tries to hide it
                        forceWrapperVisible(autoHideWrapper);
                    }
                });
            });

            toolbarLockObserver.observe(autoHideWrapper, {
                attributes: true,
                attributeFilter: ['style']
            });
        }

        // Also use setInterval as a backup to continuously enforce visibility
        if (!window.toolbarLockInterval) {
            window.toolbarLockInterval = setInterval(function() {
                if (isToolbarLocked) {
                    var tb = document.querySelector('.toolbar-mainbar');
                    if (tb) {
                        var wrapper = tb.closest('.auto-hide-wrapper');
                        if (wrapper) forceWrapperVisible(wrapper);
                    }
                }
            }, 50); // Check every 50ms
        }
    }

    function unlockToolbar() {
        var toolbar = document.querySelector('.toolbar-mainbar');
        if (toolbar) {
            toolbar.classList.remove('toolbar-locked-by-dropdown');
            toolbar.removeAttribute('data-dropdown-open');

            // Remove forced styles from wrapper
            var autoHideWrapper = toolbar.closest('.auto-hide-wrapper');
            if (autoHideWrapper) {
                autoHideWrapper.style.removeProperty('transform');
            }
        }

        isToolbarLocked = false;

        // Disconnect observer
        if (toolbarLockObserver) {
            toolbarLockObserver.disconnect();
            toolbarLockObserver = null;
        }

        // Clear interval
        if (window.toolbarLockInterval) {
            clearInterval(window.toolbarLockInterval);
            window.toolbarLockInterval = null;
        }
    }

    function forceWrapperVisible(wrapper) {
        // Force transform to 0 to keep the toolbar visible
        // Vivaldi uses transform: translateY(-87px) to hide it
        wrapper.style.setProperty('transform', 'translateY(0)', 'important');
    }

    // ========== Toolbar Button Injection ==========

    function injectToolbarButton() {
        // Target: .toolbar-mainbar or .toolbar-extensions
        var toolbar = document.querySelector('.toolbar-mainbar');
        if (!toolbar) return;

        // Prevent duplicate injection
        if (toolbar.querySelector('[data-custom-toolbar-button="quick-open"]')) return;

        // Create button wrapper (matches Vivaldi structure)
        var buttonWrapper = document.createElement('div');
        buttonWrapper.className = 'button-toolbar';
        buttonWrapper.style.position = 'relative';

        // Create button
        var button = document.createElement('button');
        button.className = 'ToolbarButton-Button vivaldi-toolbar-custom-button';
        button.dataset.customToolbarButton = 'quick-open';
        button.title = '快捷打开';

        // Add star icon
        var iconSpan = document.createElement('span');
        iconSpan.className = 'vivaldi-toolbar-button-icon';
        iconSpan.innerHTML = SVG_STAR;
        iconSpan.style.cssText =
            'width: 16px;' +
            'height: 16px;' +
            'display: inline-flex;' +
            'align-items: center;' +
            'justify-content: center;';

        // Ensure SVG match the icon size
        var svg = iconSpan.querySelector('svg');
        if (svg) {
           svg.style.cssText = 'width: 16px; height: 16px;';
        }

        button.appendChild(iconSpan);

        buttonWrapper.appendChild(button);

        // Create dropdown menu
        var dropdown = createDropdownMenu();
        buttonWrapper.appendChild(dropdown);

        // Append to toolbar
        toolbar.appendChild(buttonWrapper);

        // Attach event handler with button reference
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleDropdown(dropdown, button);
        });
    }

    // ========== Initialization ==========

    function waitForReady(callback) {
        var count = 0;
        var interval = setInterval(function() {
            count++;
            if (document.getElementById('browser') && document.querySelector('.toolbar-mainbar')) {
                clearInterval(interval);
                callback();
            } else if (count > 200) {
                clearInterval(interval);
            }
        }, 100);
    }

    var observer = null;
    var injectionInProgress = false;

    function init() {
        injectToolbarButton();

        // Watch for toolbar rebuilds with loop protection
        var toolbar = document.querySelector('.toolbar-mainbar') || document.getElementById('browser');
        if (toolbar) {
            observer = new MutationObserver(function() {
                if (injectionInProgress) return;
                injectionInProgress = true;
                setTimeout(function() {
                    injectToolbarButton();
                    injectionInProgress = false;
                }, 0);
            });
            observer.observe(toolbar, {
                childList: true,
                subtree: true
            });
        }
    }

    // Cleanup on unload
    window.addEventListener('beforeunload', function() {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
    });

    waitForReady(init);

})();
