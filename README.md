# 🎵 Suno Artist Style Replacer

Auto-replace artist names with detailed style descriptions in Suno AI, with full admin panel and AI generator.

## ✨ Features

- 🔄 **Manual Replacement** - Button to replace artist names with detailed styles
- 🎨 **Admin Panel** - Easy-to-use interface for managing artists
- 🌐 **Backend API** - Node.js server deployable on Railway
- 🤖 **AI Generator** - Auto-generate style descriptions using Gemini/Claude/GPT
- 🔌 **Two Modes**:
  - Chrome Extension (Recommended)
  - Userscript (Tampermonkey/Greasemonkey)

## 📁 Project Structure

```
suno-extension/
├── server/              # Backend API
│   └── index.js        # Express server
├── public/             # Admin panel
│   └── admin.html      # Management interface
├── extension/          # Chrome Extension
│   ├── manifest.json
│   ├── content.js
│   ├── popup.html
│   ├── popup.js
│   ├── options.html
│   └── options.js
├── userscript/         # Userscript version
│   └── suno-artist-replacer.user.js
├── artist_styles.json  # Artist database
├── package.json
└── railway.json        # Railway config
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure

Edit `.env`:
```env
PORT=3000
ADMIN_PASSWORD=your_password_here
```

### 3. Run

```bash
npm start
# Access at http://localhost:3000
```

## 🌐 Deploy to Railway

1. **Create Railway Account**: [Railway.app](https://railway.app)
2. **Connect GitHub**: Deploy from `https://github.com/Ido108/suno-artist-to-style`
3. **Add Variables**:
   ```
   PORT=3000
   ADMIN_PASSWORD=your_secure_password
   ```
4. **Deploy**: Railway auto-deploys to `suno.up.railway.app`

## 🔌 Install Extension

### Chrome Extension

1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Drag and drop `suno-extension.zip`
   OR
   Click "Load unpacked" → Select `extension/` folder

### Configure Extension

1. Click extension icon
2. Click "⚙️ Settings"
3. API URL: `https://suno.up.railway.app`
4. Select AI Model (e.g., Gemini 2.0 Flash)
5. Enter API Key
6. Save

## 🎯 Usage

### Admin Panel

1. **Go to**: `https://suno.up.railway.app`
2. **Enter password**
3. **Add Artist**:
   - Select AI model
   - Enter API key (saved in browser)
   - Enter artist name: "Radiohead"
   - Click "🤖 AI Generator"
   - AI generates detailed style
   - Save!

### In Suno

1. Go to [Suno](https://app.suno.ai/)
2. Click "Create" → "Styles"
3. Type artist name: "Billy Joel"
4. Click "🎨 Replace with Style" button
5. Name replaced with detailed style!

## 🤖 AI Models

### Google Gemini (Recommended! 🌟)
- **Gemini 2.5 Flash** - Newest, fast
- **Gemini 2.0 Flash** - ⭐ Default, free tier
- **Gemini 1.5 Pro** - Advanced
- **Get API Key**: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

**Why Gemini?**
- ✅ **Free tier** - 15 requests/min free!
- ✅ Fast
- ✅ Good for music

### Anthropic Claude
- **Claude 4.5 Sonnet** - Newest
- **Claude 3.5 Sonnet** - Reliable
- **Claude 3.5 Haiku** - Fast & cheap
- **Get API Key**: [console.anthropic.com](https://console.anthropic.com/)

### OpenAI
- **GPT-5 Chat Latest** - Newest
- **GPT-4o** - Optimized
- **GPT-4.1-mini** - Balanced
- **Get API Key**: [platform.openai.com](https://platform.openai.com/api-keys)

## 📝 API Endpoints

### GET `/api/artists`
Get all artists.

**Response:**
```json
{
  "enabled": true,
  "artists": {
    "Billy Joel": "Pop, Rock, Storytelling, male vocals",
    "Adele": "Soul, Emotional, Torch-Lounge, female vocals"
  }
}
```

### POST `/api/generate-style`
Generate artist style with AI.

**Body:**
```json
{
  "artistName": "Artist Name",
  "password": "admin_password",
  "llmProvider": "gemini-2.0-flash",
  "apiKey": "your_api_key"
}
```

### POST `/api/artists`
Add/update artist.

**Body:**
```json
{
  "name": "Artist Name",
  "style": "Genre, Style, Description",
  "password": "admin_password"
}
```

### DELETE `/api/artists/:name`
Delete artist (requires password).

## 🔒 Security

### API Key Storage

**3 Methods:**

1. **Browser localStorage** (Extension):
   - ✅ Convenient
   - ✅ Secure - only on your device
   - 💡 **Recommended for personal use**

2. **File system** (`api_keys/`):
   - Files: `api_keys/google_api_key.txt`
   - ✅ Good for development
   - ⚠️ Don't commit to Git!

3. **Environment variables**:
   - Railway Variables or `.env`
   - ✅ Most secure
   - 💡 **Recommended for production**

## 💰 Costs (per artist)

| Provider | Model | Cost | Notes |
|---------|-------|------|-------|
| Google | Gemini 2.0 Flash | **FREE!** | 15/min free tier |
| Google | Gemini 1.5 Pro | ~$0.001 | More advanced |
| Anthropic | Claude 3.5 Haiku | ~$0.001 | Fast & cheap |
| Anthropic | Claude 4.5 Sonnet | ~$0.003 | Newest |
| OpenAI | GPT-4o | ~$0.002 | Fast |
| OpenAI | GPT-4.1-mini | ~$0.0005 | Balanced |

**Recommendation**: Start with **Gemini 2.0 Flash** - free and good! 🌟

## 🛠️ Development

```bash
# Install
npm install

# Run dev server
npm run dev

# Test API
npm test

# Backup database
npm run backup
```

## 📦 Files

- **Backend**: `server/index.js` - Express API with AI integration
- **Admin**: `public/admin.html` - Management interface
- **Extension**: `extension/` - Chrome extension source
- **Database**: `artist_styles.json` - Artists database (hundreds included!)
- **Userscript**: `userscript/` - Tampermonkey version
- **ZIP**: `suno-extension.zip` - Ready-to-install extension

## 🐛 Troubleshooting

### Button doesn't appear in Suno

1. Refresh Suno (F5)
2. Open Console (F12) - Look for: "[Suno Extension] Replace button created"
3. If missing - reload extension: `chrome://extensions/`

### "No API key available"

**Solutions:**
1. Enter API key in admin panel
2. Check "Save in browser"
3. Or add to Railway variables: `GEMINI_API_KEY=your_key`

### AI doesn't generate well

- Try different model (Claude 4.5 Sonnet is excellent!)
- Edit results manually
- Add specific details

## 📜 License

MIT License

## 🤝 Contributing

Issues and PRs welcome!

## 🔗 Links

- **GitHub**: https://github.com/Ido108/suno-artist-to-style
- **Railway**: Deploy at [railway.app](https://railway.app)
- **Suno**: Use at [suno.ai](https://app.suno.ai/)

---

**Made for Suno musicians and creators ❤️**
