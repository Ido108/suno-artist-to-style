# 📂 Project Structure

מבנה מפורט של הפרויקט והסבר על כל קובץ.

```
suno-extension/
│
├── 📁 server/                    # Backend Server
│   └── index.js                  # Express server, API routes, file operations
│
├── 📁 public/                    # Frontend Admin Panel
│   └── admin.html                # Single-page admin interface
│
├── 📁 extension/                 # Chrome Extension
│   ├── manifest.json             # Extension configuration
│   ├── content.js                # Main script - monitors Suno and replaces text
│   ├── popup.html                # Extension popup UI
│   ├── popup.js                  # Popup functionality
│   ├── options.html              # Settings page UI
│   ├── options.js                # Settings functionality
│   └── 📁 icons/                 # Extension icons (16x16, 48x48, 128x128)
│       └── README.md             # Instructions for creating icons
│
├── 📁 userscript/                # Tampermonkey/Greasemonkey Script
│   └── suno-artist-replacer.user.js  # Standalone userscript version
│
├── 📁 scripts/                   # Utility Scripts
│   ├── test-api.js               # API testing script
│   └── backup-artists.js         # Backup utility for artist database
│
├── 📁 backups/                   # Auto-generated backups (gitignored)
│   └── artist_styles_*.json      # Timestamped backups
│
├── 📄 artist_styles.json         # Main database - artist names and styles
│
├── 📄 package.json               # Node.js dependencies and scripts
├── 📄 .env                       # Environment variables (gitignored)
├── 📄 .env.example               # Example environment variables
├── 📄 .gitignore                 # Git ignore rules
├── 📄 .gitattributes             # Git attributes
│
├── 📄 railway.json               # Railway deployment config
├── 📄 Procfile                   # Process file for deployment
│
├── 📄 README.md                  # Main documentation
├── 📄 QUICKSTART.md              # Quick start guide
├── 📄 INSTALLATION.md            # Detailed installation guide
├── 📄 CHANGELOG.md               # Version history
├── 📄 CONTRIBUTING.md            # Contribution guidelines
├── 📄 LICENSE                    # MIT License
└── 📄 PROJECT_STRUCTURE.md       # This file
```

---

## 📝 File Descriptions

### Backend (server/)

#### `server/index.js`
Express server המספק:
- **API Endpoints**: GET, POST, DELETE עבור ניהול אמנים
- **Static Files**: מגיש את ה-admin panel
- **CORS**: מאפשר גישה מה-extension
- **File Operations**: קורא וכותב ל-`artist_styles.json`
- **Authentication**: בדיקת סיסמה למשתני סביבה

**Main Routes:**
- `GET /` - Admin panel
- `GET /api/artists` - Get all artists
- `GET /api/artists/:name` - Get specific artist
- `POST /api/artists` - Add/update artist
- `DELETE /api/artists/:name` - Delete artist
- `POST /api/toggle` - Enable/disable system
- `GET /health` - Health check

---

### Frontend (public/)

#### `public/admin.html`
Single-page application לניהול המאגר:
- **Stats Dashboard**: סטטיסטיקות בזמן אמת
- **Toggle Switch**: הפעלה/כיבוי של המערכת
- **Artist Form**: הוספה/עריכה של אמנים
- **Search**: חיפוש ברשימת האמנים
- **Artist Cards**: תצוגה של כל האמנים עם אפשרות עריכה/מחיקה

**Features:**
- Responsive design
- RTL support (Hebrew)
- Real-time updates
- Client-side filtering
- Error handling

---

### Extension (extension/)

#### `manifest.json`
הגדרות ה-Chrome Extension:
- Version: 3 (Manifest V3)
- Permissions: storage, host access to Suno
- Content scripts: runs on Suno pages
- Action: popup and options pages

#### `content.js`
הסקריפט הראשי:
- **Monitoring**: בודק כל שנייה אם יש textarea של styles
- **Replacement**: מחליף שמות אמנים בסטיילים
- **Debouncing**: ממתין 500ms אחרי קלט לפני החלפה
- **Caching**: שומר את המאגר ב-chrome.storage למהירות
- **Event Handling**: מטפל ב-input ו-paste events

**Algorithm:**
1. מוצא את ה-textarea (מספר selectors)
2. מאזין לאירועי input
3. מחכה 500ms (debounce)
4. עובר על כל האמנים (ממוין לפי אורך)
5. מחפש exact match (word boundaries)
6. מחליף ומעדכן את ה-textarea
7. שומר על מיקום הסמן

#### `popup.html/js`
Popup של האקסטנשן:
- הצגת סטטוס
- מספר אמנים
- כפתור רענון
- קישור להגדרות
- קישור לדף ניהול

#### `options.html/js`
דף הגדרות:
- הגדרת API URL
- בדיקת חיבור
- שמירת הגדרות ב-storage

---

### Userscript (userscript/)

#### `suno-artist-replacer.user.js`
גרסת Tampermonkey:
- **@match**: runs on Suno domains
- **@grant**: GM_xmlhttpRequest, GM_getValue, GM_setValue
- **Same logic**: כמו content.js אבל עם GM functions
- **Settings**: דרך console או Tampermonkey UI

---

### Database

#### `artist_styles.json`
```json
{
  "enabled": true,
  "artists": {
    "Artist Name": "Style Description"
  }
}
```

**Format:**
- `enabled`: boolean - האם המערכת פעילה
- `artists`: object - key=artist name, value=style description

**Guidelines:**
- Artist names: exact match, case-sensitive
- Style descriptions: detailed, comma-separated
- Include: genre, mood, instruments, vocals

---

### Configuration

#### `package.json`
- Dependencies: express, cors, body-parser, dotenv
- Scripts: start, dev, test, backup
- Engines: Node >=16

#### `.env`
```
PORT=3000
NODE_ENV=production
ADMIN_PASSWORD=your_password
```

#### `railway.json`
- Builder: NIXPACKS
- Start command: npm start
- Restart policy: ON_FAILURE

---

### Documentation

#### `README.md`
מדריך ראשי:
- Overview
- Features
- Installation
- Usage
- API documentation
- Troubleshooting

#### `INSTALLATION.md`
מדריך התקנה מפורט:
- Step-by-step instructions
- Railway deployment
- Extension installation
- Testing
- Troubleshooting

#### `QUICKSTART.md`
התחלה מהירה:
- 3 simple steps
- Minimal instructions
- Links to full docs

---

## 🔧 How It Works

### Flow Diagram

```
User types in Suno
       ↓
Content Script detects input
       ↓
Waits 500ms (debounce)
       ↓
Checks artist_styles cache
       ↓
Finds matching artist name
       ↓
Replaces with detailed style
       ↓
Updates textarea
       ↓
User sees replacement
```

### API Flow

```
Browser → Extension → API Server → artist_styles.json
                ↑
                └── Admin Panel
```

---

## 🚀 Deployment

### Development
```bash
npm install
npm run dev
# Server on http://localhost:3000
```

### Production (Railway)
```bash
git push origin main
# Railway auto-deploys
# Server on https://your-app.up.railway.app
```

---

## 📊 Data Flow

1. **Initial Load**: Extension fetches artists from API
2. **Cache**: Stores in chrome.storage (5min TTL)
3. **User Input**: Types artist name in Suno
4. **Replacement**: Extension replaces with style
5. **Admin Update**: Changes saved to JSON file
6. **Sync**: Extension refreshes cache

---

## 🔒 Security

- **Password Protection**: All write operations require password
- **Environment Variables**: Sensitive data in .env
- **No Database**: Simple JSON file storage
- **CORS**: Configured for extension access
- **Input Validation**: Server validates all inputs

---

## 📈 Performance

- **Caching**: 5-minute client-side cache
- **Debouncing**: 500ms input delay
- **Selective Monitoring**: Only monitors textarea, not entire page
- **Sorted Search**: Longest artist names first (prevents partial matches)

---

## 🔮 Future Improvements

1. Database (MongoDB/PostgreSQL)
2. User authentication
3. Analytics
4. Bulk operations
5. API rate limiting
6. WebSocket for real-time updates
7. Mobile app

---

**Questions?** Check the main [README.md](README.md) or open an issue!
