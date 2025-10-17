// Suno Artist Style Replacer - Content Script
// This script adds a "Replace with Style" button to the Suno styles textarea

(async function() {
  'use strict';

  const CONFIG = {
    API_URL: 'https://suno.up.railway.app',
    CHECK_INTERVAL: 1000 // Check every second for textarea
  };

  let artistsData = null;
  let replaceButton = null;
  let autoReplaceEnabled = true; // Auto-replace on Create button click

  // Fetch artists data from API
  async function fetchArtistsData() {
    try {
      // First try to get from chrome storage
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const stored = await chrome.storage.local.get(['apiUrl', 'artistsCache']);

        if (stored.apiUrl) {
          CONFIG.API_URL = stored.apiUrl;
        }

        // Use cache if available and recent (less than 5 minutes old)
        if (stored.artistsCache && stored.artistsCache.timestamp) {
          const cacheAge = Date.now() - stored.artistsCache.timestamp;
          if (cacheAge < 5 * 60 * 1000) {
            console.log('[Suno Extension] Using cached artists data');
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

      console.log('[Suno Extension] Artists data loaded:', Object.keys(data.artists).length, 'artists');
      return data;
    } catch (error) {
      console.error('[Suno Extension] Error fetching artists data:', error);
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
        console.log('[Suno Extension] Found styles textarea with selector:', selector);
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

    // Sort artists by name length (longest first) to avoid partial replacements
    const sortedArtists = Object.entries(artistsData.artists).sort((a, b) => b[0].length - a[0].length);

    for (const [artistName, style] of sortedArtists) {
      // Case-insensitive exact match or match with comma/space boundaries
      const regex = new RegExp(`\\b${escapeRegex(artistName)}\\b`, 'gi');

      if (regex.test(modifiedText)) {
        modifiedText = modifiedText.replace(regex, style);
        replacements.push(artistName);
      }
    }

    return { text: modifiedText, replacements };
  }

  // Escape special regex characters
  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Handle replace button click
  function handleReplace(textarea) {
    const originalValue = textarea.value;
    const result = replaceArtistNames(originalValue);

    if (result.replacements.length > 0) {
      // Update value
      textarea.value = result.text;

      // Trigger input event to update React state
      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);

      // Update button text temporarily
      const originalText = replaceButton.innerHTML;
      replaceButton.innerHTML = `✅ הוחלפו ${result.replacements.length} אמנים!`;
      replaceButton.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';

      console.log('[Suno Extension] Replaced artists:', result.replacements);

      setTimeout(() => {
        replaceButton.innerHTML = originalText;
        replaceButton.style.background = '';
      }, 2000);
    } else {
      // No replacements
      const originalText = replaceButton.innerHTML;
      replaceButton.innerHTML = '❌ לא נמצאו אמנים';
      replaceButton.style.background = 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)';

      setTimeout(() => {
        replaceButton.innerHTML = originalText;
        replaceButton.style.background = '';
      }, 2000);
    }
  }

  // Create and inject the replace button
  function createReplaceButton(textarea) {
    // Check if button already exists
    if (document.getElementById('suno-replace-btn')) {
      return;
    }

    // Create button
    replaceButton = document.createElement('button');
    replaceButton.id = 'suno-replace-btn';
    replaceButton.innerHTML = '🎨 Replace with Style';
    replaceButton.type = 'button';

    // Style the button
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

    // Add hover effect
    replaceButton.addEventListener('mouseenter', () => {
      replaceButton.style.transform = 'translateY(-2px)';
      replaceButton.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
    });

    replaceButton.addEventListener('mouseleave', () => {
      replaceButton.style.transform = 'translateY(0)';
      replaceButton.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
    });

    // Add click handler
    replaceButton.addEventListener('click', () => handleReplace(textarea));

    // Find parent container and insert button
    const parent = textarea.parentElement;
    if (parent) {
      // Try to insert after textarea
      const nextSibling = textarea.nextSibling;
      if (nextSibling) {
        parent.insertBefore(replaceButton, nextSibling);
      } else {
        parent.appendChild(replaceButton);
      }

      console.log('[Suno Extension] Replace button created');
    }
  }

  // Find and monitor the Create button
  function findCreateButton() {
    const selectors = [
      'button[aria-label*="Create"]',
      'button:has(svg) span:contains("Create")',
      'button.btn-primary:contains("Create")',
      'button[type="button"]'
    ];

    // Try to find the create button
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
    if (!autoReplaceEnabled) {
      return;
    }

    const textarea = findStylesTextarea();
    if (!textarea) {
      return;
    }

    const originalValue = textarea.value;
    const result = replaceArtistNames(originalValue);

    if (result.replacements.length > 0) {
      // Replace the text
      textarea.value = result.text;

      // Trigger input event
      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);

      console.log('[Suno Extension] Auto-replaced on Create:', result.replacements);

      // Show notification
      showNotification(`✅ Replaced ${result.replacements.length} artist${result.replacements.length > 1 ? 's' : ''}!`);
    }
  }

  // Show temporary notification
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

    // Add animation
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

    if (!createButton) {
      return;
    }

    if (createButton.dataset.sunoCreateMonitored) {
      return;
    }

    createButton.dataset.sunoCreateMonitored = 'true';

    // Add click listener
    createButton.addEventListener('click', handleCreateClick);

    console.log('[Suno Extension] Monitoring Create button for auto-replace');
  }

  // Monitor for textarea and add button
  function monitorTextarea() {
    const textarea = findStylesTextarea();

    if (!textarea) {
      return;
    }

    // Check if already monitored
    if (textarea.dataset.sunoMonitored) {
      return;
    }

    // Mark as monitored
    textarea.dataset.sunoMonitored = 'true';

    console.log('[Suno Extension] Monitoring styles textarea');

    // Create the replace button
    createReplaceButton(textarea);
  }

  // Initialize
  async function init() {
    console.log('[Suno Extension] Initializing...');

    // Load auto-replace setting from storage
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const stored = await chrome.storage.local.get(['autoReplaceEnabled']);
      if (stored.autoReplaceEnabled !== undefined) {
        autoReplaceEnabled = stored.autoReplaceEnabled;
      }
    }

    console.log('[Suno Extension] Auto-replace on Create:', autoReplaceEnabled);

    // Load artists data
    artistsData = await fetchArtistsData();

    if (!artistsData) {
      console.error('[Suno Extension] Failed to load artists data');
      return;
    }

    // Start monitoring
    setInterval(() => {
      monitorTextarea();
      monitorCreateButton();
    }, CONFIG.CHECK_INTERVAL);

    monitorTextarea(); // Initial check
    monitorCreateButton(); // Initial check
  }

  // Wait for page to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
