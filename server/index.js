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
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

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
    console.error('Error copying to volume:', error);
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
    console.error('Error reading artists file:', error);
    return { enabled: true, artists: {} };
  }
}

// Helper function to write artists data
async function writeArtists(data) {
  try {
    await fs.writeFile(ARTISTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing artists file:', error);
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

// Function to call the appropriate LLM API based on the provider
async function callLLMAPI(provider, apiKey, prompt, temperature = 0.7, maxTokens = 500) {
  if (provider.startsWith('gemini')) {
    return await callGeminiAPI(provider, apiKey, prompt, temperature, maxTokens);
  } else if (provider.startsWith('claude')) {
    return await callClaudeAPI(provider, apiKey, prompt, temperature, maxTokens);
  } else if (provider.startsWith('gpt') || provider.startsWith('o')) {
    return await callOpenAIAPI(provider, apiKey, prompt, temperature, maxTokens);
  } else {
    throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

// API Routes

// Endpoint to save API key to file (for browser to call)
app.post('/save-api-key', async (req, res) => {
  try {
    const { provider, apiKey, password } = req.body;

    // Simple password authentication
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'Provider and API key are required' });
    }

    const apiKeyFile = getApiKeyFilePath(provider);
    fsSync.writeFileSync(apiKeyFile, apiKey, 'utf8');

    console.log(`API key saved to file for ${provider}`);
    res.json({ message: 'API key saved successfully' });

  } catch (error) {
    console.error('Error saving API key:', error);
    res.status(500).json({ error: 'Failed to save API key' });
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
    data.artists[name] = style;

    const success = await writeArtists(data);

    if (success) {
      res.json({ message: 'Artist added/updated successfully', name, style });
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

// AI Style Generator - Generate artist style description using LLM
app.post('/api/generate-style', async (req, res) => {
  try {
    const { artistName, password, llmProvider: llmProviderFromReq, apiKey: apiKeyFromReq } = req.body;

    // Password optional - only check if provided (for admin panel use)
    // If no password provided, it's from extension popup (read-only generation)
    if (password && password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!artistName) {
      return res.status(400).json({ error: 'Artist name is required' });
    }

    const llmProvider = llmProviderFromReq || 'gemini-2.0-flash'; // Default model
    let apiKey = apiKeyFromReq;

    // API key is required from the client
    if (!apiKey) {
      return res.status(400).json({
        error: `API key is required. Please enter your API key in the admin panel.`
      });
    }

    console.log(`Using API key provided in request for ${llmProvider}`);

    // Detailed prompt for generating artist style
    const systemPrompt = `You are an expert music analyst and Suno AI style descriptor. Your job is to analyze artists and create detailed, accurate style descriptions for music generation.

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

Artist: ${artistName}

Generate ONLY the detailed, comma-separated style description:`;

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
      console.error('[AI Generator] Error:', error);
      let errorMessage = error.message || 'Failed to generate style';

      if (error.response) {
        console.error('API Error Response:', error.response.data);
        errorMessage = error.response.data?.error?.message || errorMessage;
      }

      res.status(500).json({ error: errorMessage });
    }

  } catch (error) {
    console.error('[AI Generator] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate style' });
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
