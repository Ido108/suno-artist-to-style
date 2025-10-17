// Popup script
document.addEventListener('DOMContentLoaded', async function() {
  const statusEl = document.getElementById('status');
  const artistCountEl = document.getElementById('artistCount');
  const refreshBtn = document.getElementById('refreshBtn');
  const llmProviderSelect = document.getElementById('llmProvider');
  const apiKeyInput = document.getElementById('apiKey');
  const saveApiKeyCheckbox = document.getElementById('saveApiKey');
  const promptInput = document.getElementById('promptInput');
  const generatePromptBtn = document.getElementById('generatePromptBtn');
  const sunoMateEnabledCheckbox = document.getElementById('sunoMateEnabled');

  function getProviderName(modelId) {
    if (!modelId) return 'unknown';
    if (modelId.startsWith('gemini')) { return 'google'; }
    else if (modelId.startsWith('claude')) { return 'anthropic'; }
    else if (modelId.startsWith('gpt') || modelId.startsWith('o')) { return 'openai'; }
    return 'unknown';
  }

  const stored = await chrome.storage.local.get(['apiUrl', 'artistsCache', 'llmProvider', 'apiKey_google', 'apiKey_anthropic', 'apiKey_openai', 'sunoMateEnabled']);
  const apiUrl = stored.apiUrl || 'https://suno.up.railway.app';

  // Load enabled setting
  if (stored.sunoMateEnabled !== undefined) {
    sunoMateEnabledCheckbox.checked = stored.sunoMateEnabled;
  }

  // Load LLM provider
  if (stored.llmProvider) {
    llmProviderSelect.value = stored.llmProvider;
  }

  // Load API key for current provider
  function loadApiKeyForProvider() {
    const provider = getProviderName(llmProviderSelect.value);
    const savedKey = stored[`apiKey_${provider}`];
    if (savedKey) {
      apiKeyInput.value = savedKey;
      saveApiKeyCheckbox.checked = true;
    } else {
      apiKeyInput.value = '';
      saveApiKeyCheckbox.checked = false;
    }
  }

  loadApiKeyForProvider();

  llmProviderSelect.addEventListener('change', loadApiKeyForProvider);

  // Save API key
  apiKeyInput.addEventListener('blur', async function() {
    if (saveApiKeyCheckbox.checked && this.value.trim()) {
      const provider = getProviderName(llmProviderSelect.value);
      const updateData = {
        llmProvider: llmProviderSelect.value,
        [`apiKey_${provider}`]: this.value.trim()
      };
      await chrome.storage.local.set(updateData);
    }
  });

  // Generate Prompt
  generatePromptBtn.addEventListener('click', async function() {
    const prompt = promptInput.value.trim();
    const llmProvider = llmProviderSelect.value;
    const apiKey = apiKeyInput.value.trim();

    if (!prompt) {
      alert('נא להזין פרומפט');
      return;
    }

    if (!apiKey) {
      alert('נא להזין API key');
      return;
    }

    generatePromptBtn.textContent = '⏳ מייצר...';
    generatePromptBtn.disabled = true;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GENERATE_PROMPT',
        data: {
          prompt,
          llmProvider,
          apiKey,
          apiUrl
        }
      });

      if (response.success) {
        promptInput.value = response.result;
        generatePromptBtn.textContent = '✅ נוצר!';
        setTimeout(() => {
          generatePromptBtn.textContent = '✨ Generate Styles';
          generatePromptBtn.disabled = false;
        }, 2000);
      } else {
        throw new Error(response.error || 'Generation failed');
      }
    } catch (error) {
      alert('שגיאה: ' + error.message);
      generatePromptBtn.textContent = '✨ Generate Styles';
      generatePromptBtn.disabled = false;
    }
  });

  // Load status
  async function updateStatus() {
    try {
      if (stored.artistsCache && stored.artistsCache.data) {
        const data = stored.artistsCache.data;
        statusEl.textContent = data.enabled ? '✅ פעיל' : '❌ כבוי';
        artistCountEl.textContent = Object.keys(data.artists || {}).length;

        const cacheAge = Date.now() - (stored.artistsCache.timestamp || 0);
        const minutes = Math.floor(cacheAge / 60000);

        if (minutes > 0) {
          artistCountEl.textContent += ` (${minutes}m ago)`;
        }
      } else {
        statusEl.textContent = 'לא נטען';
        artistCountEl.textContent = '0';
      }
    } catch (error) {
      statusEl.textContent = 'שגיאה';
      artistCountEl.textContent = '-';
    }
  }

  // Refresh data
  refreshBtn.addEventListener('click', async function() {
    refreshBtn.textContent = '⏳ טוען...';

    try {
      const response = await fetch(`${apiUrl}/api/artists`);
      const data = await response.json();

      await chrome.storage.local.set({
        artistsCache: {
          data: data,
          timestamp: Date.now()
        }
      });

      await updateStatus();
      refreshBtn.textContent = '✅ עודכן!';

      setTimeout(() => {
        refreshBtn.textContent = '🔄 רענן מאגר';
      }, 2000);
    } catch (error) {
      refreshBtn.textContent = '❌ שגיאה';

      setTimeout(() => {
        refreshBtn.textContent = '🔄 רענן מאגר';
      }, 2000);
    }
  });

  // SunoMate toggle
  sunoMateEnabledCheckbox.addEventListener('change', async function() {
    await chrome.storage.local.set({
      sunoMateEnabled: this.checked
    });
    console.log('SunoMate enabled:', this.checked);
  });

  updateStatus();
});
