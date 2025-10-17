// Options script
document.addEventListener('DOMContentLoaded', async function() {
  const apiUrlInput = document.getElementById('apiUrl');
  const llmProviderSelect = document.getElementById('llmProvider');
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const alertContainer = document.getElementById('alertContainer');
  const apiKeyNote = document.getElementById('apiKeyNote');

  // Helper function
  function getProviderName(modelId) {
    if (!modelId) return 'unknown';
    if (modelId.startsWith('gemini')) { return 'google'; }
    else if (modelId.startsWith('claude')) { return 'anthropic'; }
    else if (modelId.startsWith('gpt') || modelId.startsWith('o')) { return 'openai'; }
    return 'unknown';
  }

  // Load saved settings
  const stored = await chrome.storage.local.get(['apiUrl', 'llmProvider', 'apiKey_google', 'apiKey_anthropic', 'apiKey_openai', 'autoReplaceEnabled']);

  if (stored.apiUrl) {
    apiUrlInput.value = stored.apiUrl;
  }

  if (stored.llmProvider) {
    llmProviderSelect.value = stored.llmProvider;
  }

  // Load auto-replace setting
  const autoReplaceCheckbox = document.getElementById('autoReplaceEnabled');
  if (stored.autoReplaceEnabled !== undefined) {
    autoReplaceCheckbox.checked = stored.autoReplaceEnabled;
  } else {
    autoReplaceCheckbox.checked = true; // Default to enabled
  }

  // Load API key based on selected provider
  function loadApiKeyForProvider() {
    const provider = getProviderName(llmProviderSelect.value);
    const savedKey = stored[`apiKey_${provider}`];

    if (savedKey) {
      apiKeyInput.value = savedKey;
    } else {
      apiKeyInput.value = '';
    }

    // Update note with link
    const links = {
      'google': 'https://aistudio.google.com/apikey',
      'anthropic': 'https://console.anthropic.com/',
      'openai': 'https://platform.openai.com/api-keys'
    };

    if (links[provider]) {
      apiKeyNote.innerHTML = `הזן API key עבור ${provider}. <a href="${links[provider]}" target="_blank" style="color: #667eea;">קבל מפתח</a>`;
    }
  }

  loadApiKeyForProvider();

  // Update API key when provider changes
  llmProviderSelect.addEventListener('change', loadApiKeyForProvider);

  // Save settings
  saveBtn.addEventListener('click', async function() {
    const apiUrl = apiUrlInput.value.trim();
    const llmProvider = llmProviderSelect.value;
    const apiKey = apiKeyInput.value.trim();

    if (!apiUrl) {
      showAlert('נא להזין כתובת API', 'error');
      return;
    }

    if (!apiKey) {
      showAlert('נא להזין API Key', 'error');
      return;
    }

    // Validate URL
    try {
      new URL(apiUrl);
    } catch (error) {
      showAlert('כתובת URL לא תקינה', 'error');
      return;
    }

    // Test connection
    saveBtn.textContent = '⏳ בודק חיבור...';

    try {
      const response = await fetch(`${apiUrl}/api/artists`);

      if (!response.ok) {
        throw new Error('Connection failed');
      }

      const data = await response.json();

      // Save to storage
      const provider = getProviderName(llmProvider);
      const autoReplaceEnabled = document.getElementById('autoReplaceEnabled').checked;

      await chrome.storage.local.set({
        apiUrl: apiUrl,
        llmProvider: llmProvider,
        [`apiKey_${provider}`]: apiKey,
        autoReplaceEnabled: autoReplaceEnabled,
        artistsCache: {
          data: data,
          timestamp: Date.now()
        }
      });

      showAlert('ההגדרות נשמרו בהצלחה! נמצאו ' + Object.keys(data.artists).length + ' אמנים', 'success');
      saveBtn.textContent = '✅ נשמר!';

      setTimeout(() => {
        saveBtn.textContent = '💾 שמור הגדרות';
      }, 2000);
    } catch (error) {
      showAlert('שגיאה בחיבור ל-API. בדוק את הכתובת ונסה שוב', 'error');
      saveBtn.textContent = '❌ שגיאה';

      setTimeout(() => {
        saveBtn.textContent = '💾 שמור הגדרות';
      }, 2000);
    }
  });

  function showAlert(message, type) {
    const alertClass = type === 'error' ? 'alert-error' : 'alert-success';
    alertContainer.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;

    setTimeout(() => {
      alertContainer.innerHTML = '';
    }, 5000);
  }
});
