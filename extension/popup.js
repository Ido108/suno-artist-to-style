// Popup script
document.addEventListener('DOMContentLoaded', async function() {
  const statusEl = document.getElementById('status');
  const artistCountEl = document.getElementById('artistCount');
  const refreshBtn = document.getElementById('refreshBtn');
  const optionsBtn = document.getElementById('optionsBtn');
  const adminLink = document.getElementById('adminLink');

  // Load settings
  const stored = await chrome.storage.local.get(['apiUrl', 'artistsCache']);
  const apiUrl = stored.apiUrl || 'https://suno.up.railway.app';

  // Update admin link
  adminLink.href = apiUrl;

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
          artistCountEl.textContent += ` (לפני ${minutes} דק׳)`;
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

  // Options button
  optionsBtn.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });

  // Initial status
  updateStatus();
});
