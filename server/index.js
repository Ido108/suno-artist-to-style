require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increase limit for large JSON uploads
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Helper function to normalize artist names (removes diacritics/accents)
// This makes "Beyoncé" === "Beyonce", "Motörhead" === "Motorhead", etc.
function normalizeArtistName(name) {
  return name
    .normalize('NFD') // Decompose combined characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase()
    .trim();
}

// Helper function to get provider name from model ID
function getProviderName(modelId) {
  if (!modelId) return 'unknown';
  if (modelId.startsWith('gemini')) return 'google';
  if (modelId.startsWith('claude')) return 'anthropic';
  if (modelId.startsWith('gpt') || modelId.startsWith('o')) return 'openai';
  if (modelId.startsWith('grok')) return 'xai';
  return 'unknown';
}

// Path to artist styles JSON file
// Use Railway volume if available, otherwise use local file
const VOLUME_PATH = process.env.RAILWAY_VOLUME_MOUNT_PATH || __dirname;
const ARTISTS_FILE = path.join(VOLUME_PATH, 'artist_styles.json');
const FALLBACK_FILE = path.join(__dirname, '../artist_styles.json');

// Initialize: Copy from fallback if volume file doesn't exist
if (process.env.RAILWAY_VOLUME_MOUNT_PATH && !fsSync.existsSync(ARTISTS_FILE)) {
  console.log('Initializing artist_styles.json in Railway volume...');
  try {
    if (fsSync.existsSync(FALLBACK_FILE)) {
      fsSync.copyFileSync(FALLBACK_FILE, ARTISTS_FILE);
      console.log('Copied artist_styles.json to volume');
    }
  } catch (error) {
    console.error('Error copying to volume:', error.message);
  }
}

// Path to the API keys directory
const API_KEYS_DIR = path.join(__dirname, '../api_keys');

// Create the api_keys directory if it doesn't exist
if (!fsSync.existsSync(API_KEYS_DIR)) {
  fsSync.mkdirSync(API_KEYS_DIR, { recursive: true });
  console.log('Created api_keys directory');
}

// Function to get the API key file path for a provider
function getApiKeyFilePath(provider) {
  let providerName = 'default';
  if (provider.startsWith('gemini')) {
    providerName = 'google';
  } else if (provider.startsWith('claude')) {
    providerName = 'anthropic';
  } else if (provider.startsWith('gpt') || provider.startsWith('o')) {
    providerName = 'openai';
  } else if (provider.startsWith('grok')) {
    providerName = 'xai';
  }

  return path.join(API_KEYS_DIR, `${providerName}_api_key.txt`);
}

// Function to load an API key for a provider from file system
function loadApiKey(provider) {
  const apiKeyFile = getApiKeyFilePath(provider);
  try {
    if (fsSync.existsSync(apiKeyFile)) {
      const apiKey = fsSync.readFileSync(apiKeyFile, 'utf8').trim();
      console.log(`API key loaded from file for ${provider}`);
      return apiKey;
    }
  } catch (error) {
    console.error(`Error loading API key from file for ${provider}:`, error.message);
  }

  return '';
}

// Helper function to read artists data
async function readArtists() {
  try {
    const data = await fs.readFile(ARTISTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading artists file:', error.message);
    return { enabled: true, artists: {} };
  }
}

// Helper function to write artists data
async function writeArtists(data) {
  try {
    await fs.writeFile(ARTISTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing artists file:', error.message);
    return false;
  }
}

// Function to call the Gemini API
async function callGeminiAPI(model, apiKey, prompt, temperature = 0.7, maxTokens = 500) {
  const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const geminiPayload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt }
        ]
      }
    ],
    generationConfig: {
      temperature: temperature,
      maxOutputTokens: maxTokens
    }
  };

  console.log(`--- Sending Prompt to Gemini (${model}) ---`);

  const response = await axios.post(
    geminiEndpoint,
    geminiPayload,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.candidates?.[0]?.content?.parts?.[0]?.text || "Error: No content generated.";
}

// Function to call the Claude API
async function callClaudeAPI(model, apiKey, prompt, temperature = 0.7, maxTokens = 500) {
  const claudeEndpoint = 'https://api.anthropic.com/v1/messages';

  const claudePayload = {
    model: model,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: maxTokens,
    temperature: temperature
  };

  console.log(`--- Sending Prompt to Claude (${model}) ---`);

  const response = await axios.post(
    claudeEndpoint,
    claudePayload,
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    }
  );

  return response.data.content?.[0]?.text || "Error: No content generated.";
}

// Function to call the OpenAI API
async function callOpenAIAPI(model, apiKey, prompt, temperature = 0.7, maxTokens = 500) {
  const openaiEndpoint = 'https://api.openai.com/v1/chat/completions';

  const openaiPayload = {
    model: model,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: maxTokens,
    temperature: temperature
  };

  console.log(`--- Sending Prompt to OpenAI (${model}) ---`);

  const response = await axios.post(
    openaiEndpoint,
    openaiPayload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    }
  );

  return response.data.choices?.[0]?.message?.content || "Error: No content generated.";
}

// Function to call the X.AI Grok API (OpenAI-compatible)
async function callGrokAPI(model, apiKey, prompt, temperature = 0.7, maxTokens = 500) {
  const grokEndpoint = 'https://api.x.ai/v1/chat/completions';

  const grokPayload = {
    model: model,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: maxTokens,
    temperature: temperature
  };

  console.log(`--- Sending Prompt to Grok (${model}) ---`);

  const response = await axios.post(
    grokEndpoint,
    grokPayload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    }
  );

  return response.data.choices?.[0]?.message?.content || "Error: No content generated.";
}

// Function to call the appropriate LLM API based on the provider
async function callLLMAPI(provider, apiKey, prompt, temperature = 0.7, maxTokens = 500) {
  if (provider.startsWith('gemini')) {
    return await callGeminiAPI(provider, apiKey, prompt, temperature, maxTokens);
  } else if (provider.startsWith('claude')) {
    return await callClaudeAPI(provider, apiKey, prompt, temperature, maxTokens);
  } else if (provider.startsWith('gpt') || provider.startsWith('o')) {
    return await callOpenAIAPI(provider, apiKey, prompt, temperature, maxTokens);
  } else if (provider.startsWith('grok')) {
    return await callGrokAPI(provider, apiKey, prompt, temperature, maxTokens);
  } else {
    throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

// API Routes

// ⚠️ SECURITY NOTE FOR USERS:
// This server NEVER saves or logs API keys from extension users!
// - Extension users' API keys are stored ONLY in their browser (chrome.storage.local)
// - API keys are sent with each request but used ONLY in-memory for the API call
// - API keys are NEVER logged, saved to disk, or accessible to the admin
// - The server acts as a pass-through proxy to Google/Anthropic/OpenAI/X.AI
// - You can verify this in the open-source code
// - The /save-api-key endpoint below is ONLY for admin use (requires admin password)

// Admin-only endpoint to save API keys to file (NOT used by extension)
// This is ONLY for the admin panel and requires admin password
app.post('/save-api-key', async (req, res) => {
  try {
    const { provider, apiKey, password } = req.body;

    // Requires admin password - extensions don't use this
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'Provider and API key are required' });
    }

    const apiKeyFile = getApiKeyFilePath(provider);
    fsSync.writeFileSync(apiKeyFile, apiKey, 'utf8');

    console.log(`[Admin] API key saved to file for ${provider}`);
    res.json({ message: 'API key saved successfully' });

  } catch (error) {
    console.error('[Admin] Error saving API key:', error.message);
    res.status(500).json({ error: 'Failed to save API key' });
  }
});

// Get system prompt for AI generation (without exposing full implementation details)
// Returns the prompt template that extensions can use to call AI APIs directly
app.get('/api/get-prompt', async (req, res) => {
  try {
    const { artistName, type } = req.query;

    if (!artistName) {
      return res.status(400).json({ error: 'Artist/song name is required' });
    }

    const isArtist = !type || type === 'artist';

    // Return the system prompt - extensions will use this to call AI APIs directly
    // This way API keys NEVER pass through our server!
    let systemPrompt;

    if (isArtist) {
      systemPrompt = `You are an expert music analyst and Suno AI style descriptor. Your job is to analyze artists and create detailed, accurate style descriptions for music generation.

CRITICAL INSTRUCTIONS:
1. Create a comma-separated description that captures the EXACT musical characteristics
2. Focus on: Genre, Sub-genre, Tempo feel, Instrumentation, Vocal style, Mood, Production style
3. Be SPECIFIC and DETAILED - avoid generic terms
4. Include technical music terms when relevant
5. Keep it concise but comprehensive (aim for 6-11 descriptive elements)
6. Do NOT include the artist name in the output
7. Do NOT use phrases like "in the style of" or "similar to"
8. Output ONLY the comma-separated style description, no quotes, no explanations
9. MAKE SURE you state the artist decade that defines the kind of music (like "90's [genre]")

FORMAT RULES:
- Comma-separated list
- Start with main genre(s)
- Include specific instruments
- Describe vocal characteristics (if applicable)
- Include tempo indicators (e.g., upbeat, slow, moderate)
- Mention production style (e.g., polished, raw, lo-fi, orchestral)
- DO NOT INCLUDE ANY sub-element that not PERFECTLY matched the majority of this artist repertiore
- NEVER USE general description, "rock" can mean 1000 different sub-genres that not matching the same for different artist, be PERCISE.

EXAMPLES OF GOOD settings for outputs (just inspirational, USE correct settings):
Piano-driven pop, Joyful Gospel with choir vocals, clapping, and uplifting organ melody, Male vocals, 80s production, Melodic, Catchy hooks, Anthemic choruses
Soul, Emotional, Torch-Lounge, Powerful female vocals, Gospel influences, Choir background vocals, Melancholic, Piano and strings
Alternative Rock, Grunge, Dark, Melodic, Heavy guitar riffs, Baritone male vocals, 90s Seattle sound, Introspective
EDM, Melodic, Euphoric, Build-ups and drops, Synth-heavy, Festival anthems, Emotional vocal samples, Progressive house
happy choir, energetic soul, gospel, jazz, Christian choir, worship, rhythmical, blues, motown piano, funk pop, brass energetic section, eurodance 80's, disco soul, epic disco, funk, energetic trombones, strings stabs, energetic strings, syncopated piano, brass hits
EXAMPLES OF BAD OUTPUT:
Like Billy Joel ❌
Similar to Adele's style ❌
Pop music ❌ (too vague)
Great artist with amazing voice ❌ (not descriptive)

MAKE SURE IT PERFECTLY REPRESENT THE PROVIDED ARTIST/BAND/COMPOSER WITH NO IRRELEVANT INFO THAT IS NOT PERFECTLY MATCHES THE SPECIFIC DETAILED STYLE.

Artist: ${artistName}

Generate ONLY the detailed, comma-separated style description:`;
    } else {
      // Song-specific prompt
      systemPrompt = `You are an expert music analyst and Suno AI style descriptor. Your job is to analyze SPECIFIC SONGS and create detailed, accurate style descriptions for music generation.

CRITICAL INSTRUCTIONS:
1. Create a comma-separated description that captures the EXACT characteristics of THIS SPECIFIC SONG
2. Focus on: Genre, Sub-genre, Song structure, Key musical elements, Vocal delivery, Mood, Specific instrumentation, Production style
3. Be SPECIFIC and DETAILED - describe what makes THIS SONG unique
4. Include technical music terms when relevant
5. Keep it concise but comprehensive (aim for 8-15 descriptive elements)
6. Do NOT include the song name or artist name in the output
7. Do NOT use phrases like "in the style of" or "similar to"
8. Output ONLY the comma-separated style description, no quotes, no explanations
9. Focus on the SPECIFIC characteristics of this particular song, not the artist's general style
10. MAKE SURE you state the exact year of this song (or decade) (like "1993's [genre])

FORMAT RULES:
- Comma-separated list
- Start with main genre(s)
- Include specific instruments and sounds used in THIS song
- Describe vocal characteristics and delivery in THIS song
- Add mood/feeling descriptors specific to THIS song
- Include tempo and rhythm patterns
- Mention production style and sonic qualities
- Highlight unique elements that define THIS song
- DO NOT INCLUDE ANY sub-element that not PERFECTLY matching this song, and can confuse the prompt
- NEVER USE general description, "rock" can mean 1000 different sub-genres that not matching the same for different artist, be PERCISE.

EXAMPLES OF GOOD settings for outputs (just inspirational, USE correct settings):
Piano-driven pop, Joyful Gospel with choir vocals, clapping, and uplifting organ melody, Male vocals, 80s production, Melodic, Catchy hooks, Anthemic choruses
Soul, Emotional, Torch-Lounge, Powerful female vocals, Gospel influences, Choir background vocals, Melancholic, Piano and strings
Alternative Rock, Grunge, Dark, Melodic, Heavy guitar riffs, Baritone male vocals, 90s Seattle sound, Introspective
EDM, Melodic, Euphoric, Build-ups and drops, Synth-heavy, Festival anthems, Emotional vocal samples, Progressive house
happy choir, energetic soul, gospel, jazz, Christian choir, worship, rhythmical, blues, motown piano, funk pop, brass energetic section, eurodance 80's, disco soul, epic disco, funk, energetic trombones, strings stabs, energetic strings, syncopated piano, brass hits

EXAMPLES OF BAD OUTPUT:
Like Queen ❌
Bohemian Rhapsody style ❌
Rock ❌ (too vague)
Great song ❌ (not descriptive)

MAKE SURE IT PERFECTLY REPRESENTS THIS SPECIFIC SONG'S UNIQUE CHARACTERISTICS, NOT THE ARTIST'S GENERAL STYLE.

Song: ${artistName}

Generate ONLY the detailed, comma-separated style description for this specific song:`;
    }

    res.json({ prompt: systemPrompt });

  } catch (error) {
    console.error('[Get Prompt] Error:', error.message);
    res.status(500).json({ error: 'Failed to generate prompt' });
  }
});

// Get all artists
app.get('/api/artists', async (req, res) => {
  try {
    const data = await readArtists();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch artists' });
  }
});

// Public endpoint for syncing data between apps (read-only, no auth required)
// Returns the raw artist_styles.json file with proper CORS headers
app.get('/api/sync/artist_styles', async (req, res) => {
  try {
    const data = await readArtists();

    // Set cache control headers to allow clients to cache for a short time
    res.set('Cache-Control', 'public, max-age=60'); // Cache for 1 minute
    res.set('Last-Modified', new Date().toUTCString());

    // Return the full data
    res.json({
      success: true,
      lastUpdated: new Date().toISOString(),
      data: data
    });
  } catch (error) {
    console.error('[Sync] Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch data'
    });
  }
});

// Get single artist
app.get('/api/artists/:name', async (req, res) => {
  try {
    const data = await readArtists();
    const artistName = decodeURIComponent(req.params.name);

    if (data.artists[artistName]) {
      res.json({ name: artistName, style: data.artists[artistName] });
    } else {
      res.status(404).json({ error: 'Artist not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch artist' });
  }
});

// Add or update artist (requires password)
app.post('/api/artists', async (req, res) => {
  try {
    const { name, style, password } = req.body;

    // Simple password authentication
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!name || !style) {
      return res.status(400).json({ error: 'Name and style are required' });
    }

    const data = await readArtists();

    // Check for case-insensitive + diacritic-insensitive duplicates
    const existingArtists = Object.keys(data.artists);
    const nameNormalized = normalizeArtistName(name);
    let actualKey = name; // The key to use (preserve original case if updating)

    for (const existingName of existingArtists) {
      if (normalizeArtistName(existingName) === nameNormalized) {
        // Found a match (normalized comparison)
        // Use the existing key to update it (preserve original capitalization)
        actualKey = existingName;
        console.log(`[Update] Updating existing artist: "${existingName}" (matched "${name}")`);
        break;
      }
    }

    // Save with the actual key (either original or found match)
    data.artists[actualKey] = style;

    // Add timestamp metadata
    if (!data.metadata) {
      data.metadata = {};
    }
    data.metadata[actualKey] = {
      timestamp: Date.now(),
      lastModified: new Date().toISOString()
    };

    const success = await writeArtists(data);

    if (success) {
      res.json({ message: 'Artist added/updated successfully', name: actualKey, style });
    } else {
      res.status(500).json({ error: 'Failed to save artist' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to add/update artist' });
  }
});

// Delete artist (requires password)
app.delete('/api/artists/:name', async (req, res) => {
  try {
    const { password } = req.body;

    // Simple password authentication
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const artistName = decodeURIComponent(req.params.name);
    const data = await readArtists();

    if (data.artists[artistName]) {
      delete data.artists[artistName];
      const success = await writeArtists(data);

      if (success) {
        res.json({ message: 'Artist deleted successfully' });
      } else {
        res.status(500).json({ error: 'Failed to delete artist' });
      }
    } else {
      res.status(404).json({ error: 'Artist not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete artist' });
  }
});

// ========== SONGS API ENDPOINTS ==========

// Add or update song (requires password)
app.post('/api/songs', async (req, res) => {
  try {
    const { name, style, password } = req.body;

    // Simple password authentication
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!name || !style) {
      return res.status(400).json({ error: 'Name and style are required' });
    }

    const data = await readArtists();

    // Initialize songs object if it doesn't exist
    if (!data.songs) {
      data.songs = {};
    }

    // Check for case-insensitive + diacritic-insensitive duplicates
    const existingSongs = Object.keys(data.songs);
    const nameNormalized = normalizeArtistName(name);
    let actualKey = name; // The key to use (preserve original case if updating)

    for (const existingName of existingSongs) {
      if (normalizeArtistName(existingName) === nameNormalized) {
        // Found a match (normalized comparison)
        // Use the existing key to update it (preserve original capitalization)
        actualKey = existingName;
        console.log(`[Update] Updating existing song: "${existingName}" (matched "${name}")`);
        break;
      }
    }

    // Save with the actual key (either original or found match)
    data.songs[actualKey] = style;

    // Add timestamp metadata
    if (!data.metadata) {
      data.metadata = {};
    }
    if (!data.metadata.songs) {
      data.metadata.songs = {};
    }
    data.metadata.songs[actualKey] = {
      timestamp: Date.now(),
      lastModified: new Date().toISOString()
    };

    const success = await writeArtists(data);

    if (success) {
      res.json({ message: 'Song added/updated successfully', name: actualKey, style });
    } else {
      res.status(500).json({ error: 'Failed to save song' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to add/update song' });
  }
});

// Delete song (requires password)
app.delete('/api/songs/:name', async (req, res) => {
  try {
    const { password } = req.body;

    // Simple password authentication
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const songName = decodeURIComponent(req.params.name);
    const data = await readArtists();

    if (!data.songs) {
      data.songs = {};
    }

    if (data.songs[songName]) {
      delete data.songs[songName];
      const success = await writeArtists(data);

      if (success) {
        res.json({ message: 'Song deleted successfully' });
      } else {
        res.status(500).json({ error: 'Failed to delete song' });
      }
    } else {
      res.status(404).json({ error: 'Song not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete song' });
  }
});

// Toggle enabled status
app.post('/api/toggle', async (req, res) => {
  try {
    const { password } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = await readArtists();
    data.enabled = !data.enabled;

    const success = await writeArtists(data);

    if (success) {
      res.json({ enabled: data.enabled });
    } else {
      res.status(500).json({ error: 'Failed to toggle status' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle status' });
  }
});

// Contribute endpoint - allows users to submit new artists or songs
app.post('/api/contribute', async (req, res) => {
  try {
    const { type, artist, song, style } = req.body;
    const isArtist = type === 'artist';
    const entryName = isArtist ? artist : song;

    if (!entryName || !style) {
      return res.status(400).json({ error: `${isArtist ? 'Artist' : 'Song'} name and style are required` });
    }

    // Read current data
    const data = await readArtists();

    // Ensure songs object exists
    if (!data.songs) {
      data.songs = {};
    }

    // Check if entry already exists (case-insensitive + diacritic-insensitive)
    const entryNormalized = normalizeArtistName(entryName);
    const collection = isArtist ? data.artists : data.songs;
    const existingEntries = Object.keys(collection);

    for (const existingName of existingEntries) {
      if (normalizeArtistName(existingName) === entryNormalized) {
        console.log(`[Contribute] Blocked duplicate ${type}: "${entryName}" (exists as "${existingName}")`);
        return res.status(409).json({
          error: `${isArtist ? 'Artist' : 'Song'} already exists in database as "${existingName}"`
        });
      }
    }

    // Add the new entry
    if (isArtist) {
      data.artists[entryName] = style;
    } else {
      data.songs[entryName] = style;
    }

    // Add timestamp metadata
    if (!data.metadata) {
      data.metadata = {};
    }
    if (!isArtist && !data.metadata.songs) {
      data.metadata.songs = {};
    }

    const metadataKey = isArtist ? entryName : `songs.${entryName}`;
    if (isArtist) {
      data.metadata[entryName] = {
        timestamp: Date.now(),
        lastModified: new Date().toISOString()
      };
    } else {
      data.metadata.songs[entryName] = {
        timestamp: Date.now(),
        lastModified: new Date().toISOString()
      };
    }

    // Save to file
    const success = await writeArtists(data);

    if (success) {
      console.log(`[Contribute] New ${type} added: ${entryName}`);
      res.json({
        success: true,
        message: 'Thank you for contributing!',
        name: entryName,
        style
      });
    } else {
      res.status(500).json({ error: `Failed to save ${type}` });
    }

  } catch (error) {
    console.error('[Contribute] Error:', error.message);
    res.status(500).json({ error: 'Failed to submit artist' });
  }
});

// Generate endpoint - for extension popup (simpler version)
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, llmProvider, apiKey } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    const provider = llmProvider || 'gemini-2.0-flash';

    console.log(`[Generate] Processing request with ${provider} (API key provided by user)`);

    // SECURITY: API key is used here but NEVER logged or saved
    const result = await callLLMAPI(provider, apiKey, prompt, 0.7, 500);

    res.json({
      success: true,
      result: result.trim()
    });

  } catch (error) {
    console.error('[Generate] Error:', error.message || 'Generation failed');
    let errorMessage = error.message || 'Generation failed';
    let detailedError = null;

    if (error.response) {
      // SECURITY: Don't log full response.data as it may contain sensitive info
      console.error(`[Generate] API Error: Status ${error.response.status}`);
      const apiError = error.response.data;

      // Google Gemini errors
      if (apiError.error?.message) {
        errorMessage = apiError.error.message;
      }
      // Anthropic errors
      else if (apiError.error?.type) {
        errorMessage = `${apiError.error.type}: ${apiError.error.message || 'Unknown error'}`;
      }
      // OpenAI errors
      else if (apiError.error) {
        errorMessage = apiError.error.message || 'API error';
      }

      // Add status code if available
      if (error.response.status) {
        detailedError = `[${error.response.status}] ${errorMessage}`;
      }
    }

    res.status(500).json({
      error: detailedError || errorMessage
      // SECURITY: Don't send full error.response.data to client
    });
  }
});

// AI Style Generator - Generate artist or song style description using LLM
app.post('/api/generate-style', async (req, res) => {
  try {
    const { artistName, password, llmProvider: llmProviderFromReq, apiKey: apiKeyFromReq, type } = req.body;

    // Password optional - only check if provided (for admin panel use)
    // If no password provided, it's from extension popup (read-only generation)
    if (password && password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!artistName) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const llmProvider = llmProviderFromReq || 'gemini-2.0-flash'; // Default model
    let apiKey = apiKeyFromReq;
    const isArtist = !type || type === 'artist';

    // API key is required from the client
    if (!apiKey) {
      return res.status(400).json({
        error: `API key is required. Please enter your API key in the admin panel.`
      });
    }

    console.log(`[Generate-Style] Processing request for ${isArtist ? 'artist' : 'song'} "${artistName}" using ${llmProvider}`);

    // Get the appropriate prompt based on type
    let systemPrompt;

    if (isArtist) {
      systemPrompt = `You are an expert music analyst and Suno AI style descriptor. Your job is to analyze artists and create detailed, accurate style descriptions for music generation.

CRITICAL INSTRUCTIONS:
1. Create a comma-separated description that captures the EXACT musical characteristics
2. Focus on: Genre, Sub-genre, Tempo feel, Instrumentation, Vocal style, Mood, Production style
3. Be SPECIFIC and DETAILED - avoid generic terms
4. Include technical music terms when relevant
5. Keep it concise but comprehensive (aim for 8-15 descriptive elements)
6. Do NOT include the artist name in the output
7. Do NOT use phrases like "in the style of" or "similar to"
8. Output ONLY the comma-separated style description, no quotes, no explanations
9. This can be used for a single artist or as part of processing multiple artists in a prompt

FORMAT RULES:
- Comma-separated list
- Start with main genre(s)
- Include specific instruments
- Describe vocal characteristics (if applicable)
- Add mood/feeling descriptors
- Include tempo indicators (e.g., upbeat, slow, moderate)
- Mention production style (e.g., polished, raw, lo-fi, orchestral)

EXAMPLES OF GOOD OUTPUT:
Pop Rock, Piano-driven, Storytelling lyrics, Upbeat, Male vocals, 80s production, Melodic, Catchy hooks, Anthemic choruses
Soul, Emotional, Torch-Lounge, Powerful female vocals, Gospel influences, R&B elements, Melancholic, Piano and strings
Alternative Rock, Grunge, Dark, Melodic, Heavy guitar riffs, Baritone male vocals, 90s Seattle sound, Introspective
EDM, Melodic, Euphoric, Build-ups and drops, Synth-heavy, Festival anthems, Emotional vocal samples, Progressive house

EXAMPLES OF BAD OUTPUT:
Like Billy Joel ❌
Similar to Adele's style ❌
Pop music ❌ (too vague)
Great artist with amazing voice ❌ (not descriptive)

MAKE SURE IT PERFECTLY REPRESENT THE PROVIDED ARTIST/BAND/COMPOSER WITH NO IRRELEVANT INFO THAT IS NOT PERFECTLY MATCHES THE SPECIFIC DETAILED STYLE.

Artist: ${artistName}

Generate ONLY the detailed, comma-separated style description:`;
    } else {
      // Song-specific prompt
      systemPrompt = `You are an expert music analyst and Suno AI style descriptor. Your job is to analyze SPECIFIC SONGS and create detailed, accurate style descriptions for music generation.

CRITICAL INSTRUCTIONS:
1. Create a comma-separated description that captures the EXACT characteristics of THIS SPECIFIC SONG
2. Focus on: Genre, Sub-genre, Song structure, Key musical elements, Vocal delivery, Mood, Specific instrumentation, Production style
3. Be SPECIFIC and DETAILED - describe what makes THIS SONG unique
4. Include technical music terms when relevant
5. Keep it concise but comprehensive (aim for 10-20 descriptive elements)
6. Do NOT include the song name or artist name in the output
7. Do NOT use phrases like "in the style of" or "similar to"
8. Output ONLY the comma-separated style description, no quotes, no explanations
9. Focus on the SPECIFIC characteristics of this particular song, not the artist's general style

FORMAT RULES:
- Comma-separated list
- Start with main genre(s)
- Include specific instruments and sounds used in THIS song
- Describe vocal characteristics and delivery in THIS song
- Add mood/feeling descriptors specific to THIS song
- Include tempo and rhythm patterns
- Mention production style and sonic qualities
- Highlight unique elements that define THIS song

EXAMPLES OF GOOD OUTPUT (for specific songs):
Rock opera, Multi-section structure, Piano ballad intro, Guitar-driven middle section, Operatic vocals, Harmonized backing vocals, Dramatic dynamics, Tempo changes, British rock, Theatrical, Epic, Six-minute composition
Grunge, Dark, Heavy distorted guitars, Drop-D tuning, Quiet verse loud chorus dynamic, Apathetic vocal delivery, Nihilistic mood, Slow tempo, Raw production, Iconic opening riff
Ballad, Piano-driven, Powerful emotional female vocals, Gospel-influenced, Slow to moderate tempo, Orchestral strings, Dynamic build-up, Melancholic to triumphant, Modern production, Vocal runs, Heartbreak theme

EXAMPLES OF BAD OUTPUT:
Like Queen ❌
Bohemian Rhapsody style ❌
Rock ❌ (too vague)
Great song ❌ (not descriptive)

MAKE SURE IT PERFECTLY REPRESENTS THIS SPECIFIC SONG'S UNIQUE CHARACTERISTICS, NOT THE ARTIST'S GENERAL STYLE.

Song: ${artistName}

Generate ONLY the detailed, comma-separated style description for this specific song:`;
    }

    let generatedStyle = '';

    try {
      generatedStyle = await callLLMAPI(llmProvider, apiKey, systemPrompt, 0.7, 500);

      // Clean up the generated style (remove quotes, extra whitespace)
      generatedStyle = generatedStyle.replace(/^["']|["']$/g, '').trim();

      console.log(`[AI Generator] Generated style for ${artistName}: ${generatedStyle}`);

      res.json({
        artistName,
        generatedStyle,
        provider: llmProvider
      });

    } catch (error) {
      console.error('[AI Generator] Error:', error.message || 'Failed to generate style');
      let errorMessage = error.message || 'Failed to generate style';
      let detailedError = null;

      if (error.response) {
        // SECURITY: Don't log full response.data as it may contain sensitive info
        console.error(`[AI Generator] API Error: Status ${error.response.status}`);
        const apiError = error.response.data;

        // Google Gemini errors
        if (apiError.error?.message) {
          errorMessage = apiError.error.message;
        }
        // Anthropic errors
        else if (apiError.error?.type) {
          errorMessage = `${apiError.error.type}: ${apiError.error.message || 'Unknown error'}`;
        }
        // OpenAI errors
        else if (apiError.error) {
          errorMessage = apiError.error.message || 'API error';
        }

        // Add status code
        if (error.response.status) {
          detailedError = `[${error.response.status}] ${errorMessage}`;
        }
      }

      res.status(500).json({
        error: detailedError || errorMessage
        // SECURITY: Don't send full error.response.data
      });
    }

  } catch (error) {
    console.error('[AI Generator] Error:', error.message || 'Failed to generate style');
    res.status(500).json({ error: error.message || 'Failed to generate style' });
  }
});

// JSON Management Endpoints (requires password)

// Get raw JSON file for editing
app.get('/api/json/raw', async (req, res) => {
  try {
    const data = await readArtists();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read JSON' });
  }
});

// Upload/Replace entire JSON file (requires password)
app.post('/api/json/upload', async (req, res) => {
  try {
    const { password, jsonData } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!jsonData || typeof jsonData !== 'object') {
      return res.status(400).json({ error: 'Invalid JSON data' });
    }

    // Validate structure
    if (!jsonData.artists || typeof jsonData.artists !== 'object') {
      return res.status(400).json({ error: 'Invalid JSON structure - missing artists object' });
    }

    // Create backup before replacing
    const currentData = await readArtists();
    const backupFile = path.join(VOLUME_PATH, `artist_styles_backup_${Date.now()}.json`);
    await fs.writeFile(backupFile, JSON.stringify(currentData, null, 2), 'utf-8');
    console.log('[JSON Upload] Backup created:', backupFile);

    // Write new data
    const success = await writeArtists(jsonData);

    if (success) {
      res.json({
        message: 'JSON uploaded successfully',
        artistCount: Object.keys(jsonData.artists).length,
        backupFile: backupFile
      });
    } else {
      res.status(500).json({ error: 'Failed to write JSON' });
    }
  } catch (error) {
    console.error('[JSON Upload] Error:', error.message);
    res.status(500).json({ error: 'Failed to upload JSON' });
  }
});

// Clear all artists (requires password and confirmation)
app.post('/api/json/clear', async (req, res) => {
  try {
    const { password, confirm } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (confirm !== 'DELETE_ALL_ARTISTS') {
      return res.status(400).json({ error: 'Confirmation required' });
    }

    // Create backup before clearing
    const currentData = await readArtists();
    const backupFile = path.join(VOLUME_PATH, `artist_styles_backup_${Date.now()}.json`);
    await fs.writeFile(backupFile, JSON.stringify(currentData, null, 2), 'utf-8');
    console.log('[JSON Clear] Backup created:', backupFile);

    // Clear all artists
    const clearedData = {
      enabled: currentData.enabled,
      artists: {},
      metadata: {}
    };

    const success = await writeArtists(clearedData);

    if (success) {
      res.json({
        message: 'All artists cleared',
        backupFile: backupFile
      });
    } else {
      res.status(500).json({ error: 'Failed to clear artists' });
    }
  } catch (error) {
    console.error('[JSON Clear] Error:', error.message);
    res.status(500).json({ error: 'Failed to clear artists' });
  }
});

// Serve admin panel
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/artists`);
});
