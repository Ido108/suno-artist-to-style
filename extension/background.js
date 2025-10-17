// Background script for handling prompt generation

// Helper function to call LLM API
async function callLLMAPI(provider, apiKey, artistName, apiUrl) {
  try {
    const response = await fetch(`${apiUrl}/api/generate-style`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artistName,
        password: '', // No password needed for generation only
        llmProvider: provider,
        apiKey: apiKey
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Generation failed');
    }

    const data = await response.json();
    return data.generatedStyle;
  } catch (error) {
    console.error(`Failed to generate for ${artistName}:`, error);
    return null;
  }
}

// Extract potential artist names from prompt (words/phrases separated by commas or "and")
function extractPotentialArtists(prompt) {
  // Split by comma, "and", or newlines
  const parts = prompt.split(/[,\n]|(?:\s+and\s+)/i);

  return parts
    .map(part => part.trim())
    .filter(part => part.length > 0)
    .filter(part => {
      // Filter out common non-artist words
      const lowerPart = part.toLowerCase();
      return !['the', 'a', 'an', 'with', 'featuring', 'ft', 'feat'].includes(lowerPart);
    });
}

// Handle message from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GENERATE_PROMPT') {
    handleGeneratePrompt(request.data).then(sendResponse);
    return true; // Keep channel open for async response
  }
});

async function handleGeneratePrompt(data) {
  const { prompt, llmProvider, apiKey, apiUrl } = data;

  try {
    // Extract potential artist names
    const potentialArtists = extractPotentialArtists(prompt);

    if (potentialArtists.length === 0) {
      return {
        success: false,
        error: 'No artists detected in prompt'
      };
    }

    console.log('Detected potential artists:', potentialArtists);

    let modifiedPrompt = prompt;
    const successfulReplacements = [];

    // Generate for each potential artist
    for (const artistName of potentialArtists) {
      try {
        const generatedStyle = await callLLMAPI(llmProvider, apiKey, artistName, apiUrl);

        if (generatedStyle) {
          // Replace in prompt (case-insensitive, whole word)
          const regex = new RegExp(`\\b${artistName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');

          if (regex.test(modifiedPrompt)) {
            modifiedPrompt = modifiedPrompt.replace(regex, generatedStyle);
            successfulReplacements.push(artistName);
            console.log(`Replaced: ${artistName}`);
          }
        }
      } catch (error) {
        console.error(`Error processing ${artistName}:`, error);
        // Continue with other artists
      }
    }

    if (successfulReplacements.length === 0) {
      return {
        success: false,
        error: 'No artists could be generated. Check API key and artist names.'
      };
    }

    return {
      success: true,
      result: modifiedPrompt,
      replacedCount: successfulReplacements.length,
      replaced: successfulReplacements
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
