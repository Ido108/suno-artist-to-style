// Options script
document.addEventListener('DOMContentLoaded', async function() {
  const apiUrlInput = document.getElementById('apiUrl');
  const llmProviderSelect = document.getElementById('llmProvider');
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const alertContainer = document.getElementById('alertContainer');
  const apiKeyNote = document.getElementById('apiKeyNote');

  function getProviderName(modelId) {
    if (!modelId) return 'unknown';
    if (modelId.startsWith('gemini')) { return 'google'; }
    else if (modelId.startsWith('claude')) { return 'anthropic'; }
    else if (modelId.startsWith('gpt') || modelId.startsWith('o')) { return 'openai'; }
    return 'unknown';
  }

  const stored = await chrome.storage.local.get(['apiUrl', 'llmProvider', 'apiKey_google', 'apiKey_anthropic', 'apiKey_openai']);

  if (stored.apiUrl) {
    apiUrlInput.value = stored.apiUrl;
  }

  if (stored.llmProvider) {
    llmProviderSelect.value = stored.llmProvider;
  }

  function loadApiKeyForProvider() {
    const provider = getProviderName(llmProviderSelect.value);
    const savedKey = stored[`apiKey_${provider}`];

    if (savedKey) {
      apiKeyInput.value = savedKey;
    } else {
      apiKeyInput.value = '';
    }

    const links = {
      'google': 'https://aistudio.google.com/apikey',
      'anthropic': 'https://console.anthropic.com/',
      'openai': 'https://platform.openai.com/api-keys'
    };

    if (links[provider]) {
      apiKeyNote.innerHTML = `Enter API key for ${provider}. <a href="${links[provider]}" target="_blank" style="color: #667eea;">Get key</a>`;
    }
  }

  loadApiKeyForProvider();

  llmProviderSelect.addEventListener('change', loadApiKeyForProvider);

  saveBtn.addEventListener('click', async function() {
    const apiUrl = apiUrlInput.value.trim();
    const llmProvider = llmProviderSelect.value;
    const apiKey = apiKeyInput.value.trim();

    if (!apiUrl) {
      showAlert('Please enter API URL', 'error');
      return;
    }

    if (!apiKey) {
      showAlert('Please enter API Key', 'error');
      return;
    }

    try {
      new URL(apiUrl);
    } catch (error) {
      showAlert('Invalid URL', 'error');
      return;
    }

    saveBtn.textContent = '⏳ Checking connection...';

    try {
      const response = await fetch(`${apiUrl}/api/artists`);

      if (!response.ok) {
        throw new Error('Connection failed');
      }

      const data = await response.json();

      const provider = getProviderName(llmProvider);

      await chrome.storage.local.set({
        apiUrl: apiUrl,
        llmProvider: llmProvider,
        [`apiKey_${provider}`]: apiKey,
        artistsCache: {
          data: data,
          timestamp: Date.now()
        }
      });

      showAlert('Settings saved! Found ' + Object.keys(data.artists).length + ' artists', 'success');
      saveBtn.textContent = '✅ Saved!';

      setTimeout(() => {
        saveBtn.textContent = '💾 Save Settings';
      }, 2000);
    } catch (error) {
      showAlert('Connection error. Check URL and try again', 'error');
      saveBtn.textContent = '❌ Error';

      setTimeout(() => {
        saveBtn.textContent = '💾 Save Settings';
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
