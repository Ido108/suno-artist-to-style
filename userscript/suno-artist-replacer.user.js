// ==UserScript==
// @name         Suno Artist Style Replacer
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  מחליף אוטומטית שמות אמנים בתיאור מפורט של הסטייל שלהם ב-Suno
// @author       You
// @match        https://suno.com/*
// @match        https://app.suno.ai/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      *.railway.app
// @connect      *
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        API_URL: GM_getValue('apiUrl', 'https://your-railway-app.up.railway.app'),
        CHECK_INTERVAL: 1000,
        DEBOUNCE_DELAY: 500
    };

    let artistsData = null;
    let debounceTimer = null;
    let lastValue = '';

    // Fetch artists data from API
    async function fetchArtistsData() {
        return new Promise((resolve, reject) => {
            // Check cache first
            const cache = GM_getValue('artistsCache');
            if (cache) {
                const parsed = JSON.parse(cache);
                const cacheAge = Date.now() - parsed.timestamp;

                // Use cache if less than 5 minutes old
                if (cacheAge < 5 * 60 * 1000) {
                    console.log('[Suno Userscript] Using cached data');
                    resolve(parsed.data);
                    return;
                }
            }

            // Fetch fresh data
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${CONFIG.API_URL}/api/artists`,
                onload: function(response) {
                    try {
                        const data = JSON.parse(response.responseText);

                        // Cache the data
                        GM_setValue('artistsCache', JSON.stringify({
                            data: data,
                            timestamp: Date.now()
                        }));

                        console.log('[Suno Userscript] Artists loaded:', Object.keys(data.artists).length);
                        resolve(data);
                    } catch (error) {
                        reject(error);
                    }
                },
                onerror: function(error) {
                    reject(error);
                }
            });
        });
    }

    // Find the styles textarea
    function findStylesTextarea() {
        const selectors = [
            'textarea[placeholder*="indie"]',
            'textarea[placeholder*="electronic"]',
            'textarea[placeholder*="Billy Joel"]',
            'div.css-fm20ov textarea',
            'div.css-zq13z6 textarea',
            'div[class*="styles"] textarea'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                console.log('[Suno Userscript] Found textarea:', selector);
                return element;
            }
        }

        return null;
    }

    // Replace artist names
    function replaceArtistNames(text) {
        if (!artistsData || !artistsData.enabled || !artistsData.artists) {
            return { text: text, replacements: [] };
        }

        let modifiedText = text;
        let replacements = [];
        const sortedArtists = Object.entries(artistsData.artists).sort((a, b) => b[0].length - a[0].length);

        for (const [artistName, style] of sortedArtists) {
            const regex = new RegExp(`\\b${escapeRegex(artistName)}\\b`, 'gi');

            if (regex.test(modifiedText)) {
                modifiedText = modifiedText.replace(regex, style);
                replacements.push(artistName);
            }
        }

        return { text: modifiedText, replacements };
    }

    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Handle replace button click
    function handleReplace(textarea) {
        const originalValue = textarea.value;
        const result = replaceArtistNames(originalValue);

        if (result.replacements.length > 0) {
            textarea.value = result.text;

            const event = new Event('input', { bubbles: true });
            textarea.dispatchEvent(event);

            const originalText = replaceButton.innerHTML;
            replaceButton.innerHTML = `✅ הוחלפו ${result.replacements.length} אמנים!`;
            replaceButton.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';

            console.log('[Suno Userscript] Replaced:', result.replacements);

            setTimeout(() => {
                replaceButton.innerHTML = originalText;
                replaceButton.style.background = '';
            }, 2000);
        } else {
            const originalText = replaceButton.innerHTML;
            replaceButton.innerHTML = '❌ לא נמצאו אמנים';
            replaceButton.style.background = 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)';

            setTimeout(() => {
                replaceButton.innerHTML = originalText;
                replaceButton.style.background = '';
            }, 2000);
        }
    }

    // Create and inject replace button
    function createReplaceButton(textarea) {
        if (document.getElementById('suno-replace-btn')) {
            return;
        }

        replaceButton = document.createElement('button');
        replaceButton.id = 'suno-replace-btn';
        replaceButton.innerHTML = '🎨 Replace with Style';
        replaceButton.type = 'button';

        Object.assign(replaceButton.style, {
            position: 'relative',
            display: 'inline-block',
            padding: '10px 20px',
            margin: '10px 0',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        });

        replaceButton.addEventListener('mouseenter', () => {
            replaceButton.style.transform = 'translateY(-2px)';
            replaceButton.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
        });

        replaceButton.addEventListener('mouseleave', () => {
            replaceButton.style.transform = 'translateY(0)';
            replaceButton.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
        });

        replaceButton.addEventListener('click', () => handleReplace(textarea));

        const parent = textarea.parentElement;
        if (parent) {
            const nextSibling = textarea.nextSibling;
            if (nextSibling) {
                parent.insertBefore(replaceButton, nextSibling);
            } else {
                parent.appendChild(replaceButton);
            }
            console.log('[Suno Userscript] Replace button created');
        }
    }

    // Monitor textarea
    function monitorTextarea() {
        const textarea = findStylesTextarea();

        if (!textarea || textarea.dataset.sunoMonitored) {
            return;
        }

        textarea.dataset.sunoMonitored = 'true';
        console.log('[Suno Userscript] Monitoring textarea');

        createReplaceButton(textarea);
    }

    // Initialize
    async function init() {
        console.log('[Suno Userscript] Initializing...');

        try {
            artistsData = await fetchArtistsData();

            if (!artistsData) {
                console.error('[Suno Userscript] Failed to load data');
                return;
            }

            setInterval(monitorTextarea, CONFIG.CHECK_INTERVAL);
            monitorTextarea();
        } catch (error) {
            console.error('[Suno Userscript] Init error:', error);
        }
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Add settings UI in console
    console.log(`
╔════════════════════════════════════════════════╗
║   Suno Artist Style Replacer - Userscript     ║
╠════════════════════════════════════════════════╣
║ To change API URL, run in console:            ║
║ GM_setValue('apiUrl', 'https://your-url.com') ║
║                                                ║
║ To clear cache:                                ║
║ GM_setValue('artistsCache', null)              ║
╚════════════════════════════════════════════════╝
    `);
})();
