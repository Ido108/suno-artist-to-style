// SunoMate - Content Script
// Auto-replaces artist names with styles when Create button is clicked

(async function() {
  'use strict';

  const CONFIG = {
    API_URL: 'https://suno.up.railway.app',
    CHECK_INTERVAL: 1000
  };

  let artistsData = null;
  let toggleButton = null;
  let isEnabled = true; // SunoMate ON/OFF

  // Fetch artists data from API
  async function fetchArtistsData() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const stored = await chrome.storage.local.get(['apiUrl', 'artistsCache']);

        if (stored.apiUrl) {
          CONFIG.API_URL = stored.apiUrl;
        }

        // Use cache if available and recent
        if (stored.artistsCache && stored.artistsCache.timestamp) {
          const cacheAge = Date.now() - stored.artistsCache.timestamp;
          if (cacheAge < 5 * 60 * 1000) {
            console.log('[SunoMate] Using cached artists data');
            return stored.artistsCache.data;
          }
        }
      }

      const response = await fetch(`${CONFIG.API_URL}/api/artists`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Cache the data
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({
          artistsCache: {
            data: data,
            timestamp: Date.now()
          }
        });
      }

      console.log('[SunoMate] Artists data loaded:', Object.keys(data.artists).length, 'artists');
      return data;
    } catch (error) {
      console.error('[SunoMate] Error fetching artists data:', error);
      return null;
    }
  }

  // Find the styles textarea
  function findStylesTextarea() {
    const selectors = [
      'textarea[placeholder*="indie"]',
      'textarea[placeholder*="electronic"]',
      'textarea[placeholder*="Billy Joel"]',
      'div.css-fm20ov textarea',
      'div.css-zq13z6 textarea',
      'div.css-1k3rzs textarea',
      'div[class*="styles"] textarea'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log('[SunoMate] Found styles textarea');
        return element;
      }
    }

    return null;
  }

  // Replace artist names in text
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

  // Create toggle button
  function createToggleButton(textarea) {
    if (document.getElementById('sunomate-toggle')) {
      return;
    }

    toggleButton = document.createElement('button');
    toggleButton.id = 'sunomate-toggle';
    toggleButton.type = 'button';

    function updateToggleButton() {
      if (isEnabled) {
        toggleButton.innerHTML = '✅ SunoMate ON';
        toggleButton.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
      } else {
        toggleButton.innerHTML = '❌ SunoMate OFF';
        toggleButton.style.background = 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)';
      }
    }

    Object.assign(toggleButton.style, {
      position: 'relative',
      display: 'inline-block',
      padding: '10px 20px',
      margin: '10px 0',
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

    toggleButton.addEventListener('mouseenter', () => {
      toggleButton.style.transform = 'translateY(-2px)';
      toggleButton.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
    });

    toggleButton.addEventListener('mouseleave', () => {
      toggleButton.style.transform = 'translateY(0)';
      toggleButton.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
    });

    toggleButton.addEventListener('click', async () => {
      isEnabled = !isEnabled;
      updateToggleButton();

      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ sunoMateEnabled: isEnabled });
      }

      console.log('[SunoMate] Toggled:', isEnabled);
    });

    updateToggleButton();

    const parent = textarea.parentElement;
    if (parent) {
      const nextSibling = textarea.nextSibling;
      if (nextSibling) {
        parent.insertBefore(toggleButton, nextSibling);
      } else {
        parent.appendChild(toggleButton);
      }

      console.log('[SunoMate] Toggle button created');
    }
  }

  // Find Create button
  function findCreateButton() {
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      const text = button.textContent || button.getAttribute('aria-label') || '';
      if (text.toLowerCase().includes('create') && !button.dataset.sunoCreateMonitored) {
        return button;
      }
    }
    return null;
  }

  // Handle Create button click
  function handleCreateClick(e) {
    if (!isEnabled) {
      return;
    }

    const textarea = findStylesTextarea();
    if (!textarea) {
      return;
    }

    const originalValue = textarea.value;
    const result = replaceArtistNames(originalValue);

    if (result.replacements.length > 0) {
      textarea.value = result.text;

      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);

      console.log('[SunoMate] Auto-replaced on Create:', result.replacements);

      showNotification(`✅ Replaced ${result.replacements.length} artist${result.replacements.length > 1 ? 's' : ''}!`);
    }
  }

  // Show notification
  function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;

    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
      color: 'white',
      padding: '15px 25px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: '999999',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px',
      fontWeight: '600',
      animation: 'slideIn 0.3s ease'
    });

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  // Monitor Create button
  function monitorCreateButton() {
    const createButton = findCreateButton();

    if (!createButton || createButton.dataset.sunoCreateMonitored) {
      return;
    }

    createButton.dataset.sunoCreateMonitored = 'true';
    createButton.addEventListener('click', handleCreateClick);

    console.log('[SunoMate] Monitoring Create button');
  }

  // Monitor textarea and add toggle
  function monitorTextarea() {
    const textarea = findStylesTextarea();

    if (!textarea || textarea.dataset.sunoMonitored) {
      return;
    }

    textarea.dataset.sunoMonitored = 'true';

    console.log('[SunoMate] Monitoring styles textarea');

    createToggleButton(textarea);
  }

  // Initialize
  async function init() {
    console.log('[SunoMate] Initializing...');

    // Load enabled state
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const stored = await chrome.storage.local.get(['sunoMateEnabled']);
      if (stored.sunoMateEnabled !== undefined) {
        isEnabled = stored.sunoMateEnabled;
      }
    }

    console.log('[SunoMate] Enabled:', isEnabled);

    artistsData = await fetchArtistsData();

    if (!artistsData) {
      console.error('[SunoMate] Failed to load artists data');
      return;
    }

    setInterval(() => {
      monitorTextarea();
      monitorCreateButton();
    }, CONFIG.CHECK_INTERVAL);

    monitorTextarea();
    monitorCreateButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
