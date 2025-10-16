# 🎵 Suno Artist Style Replacer

אקסטנשן לסונו שמחליף אוטומטית שמות של אמנים בתיאור מפורט של הסטייל המוזיקלי שלהם, עם ממשק ניהול מלא.

## ✨ תכונות

- 🔄 **החלפה אוטומטית** - מחליף שמות אמנים בסטייל המפורט שלהם בזמן אמת
- 🎨 **ממשק ניהול** - דף ניהול נוח להוספה, עריכה ומחיקה של אמנים
- 🌐 **Backend API** - שרת Node.js שניתן לפרוס ב-Railway
- 🔌 **שני אופני שימוש**:
  - Chrome Extension (המלצה)
  - Userscript (Tampermonkey/Greasemonkey)

## 📁 מבנה הפרויקט

```
suno-extension/
├── server/              # Backend API
│   └── index.js        # Express server
├── public/             # Admin panel
│   └── admin.html      # דף ניהול
├── extension/          # Chrome Extension
│   ├── manifest.json
│   ├── content.js
│   ├── popup.html
│   ├── popup.js
│   ├── options.html
│   └── options.js
├── userscript/         # Userscript version
│   └── suno-artist-replacer.user.js
├── artist_styles.json  # מאגר האמנים
├── package.json
├── railway.json        # Railway config
└── README.md
```

## 🚀 התקנה והפעלה

### שלב 1: הכנת הפרויקט

```bash
cd suno-extension
npm install
```

### שלב 2: פריסה ב-Railway

1. **צור חשבון ב-Railway**
   - גש ל-[Railway.app](https://railway.app)
   - התחבר עם GitHub

2. **צור פרויקט חדש**
   - לחץ על "New Project"
   - בחר "Deploy from GitHub repo"
   - בחר את הריפו שלך

3. **הגדר משתני סביבה**
   - לחץ על ה-Service שנוצר
   - עבור ל-"Variables"
   - הוסף:
     ```
     PORT=3000
     NODE_ENV=production
     ADMIN_PASSWORD=your_secure_password_here
     ```

4. **פרוס**
   - Railway יפרוס אוטומטית
   - העתק את ה-URL שמתקבל (לדוגמה: `https://your-app.up.railway.app`)

### שלב 3: התקנת האקסטנשן

#### אופציה 1: Chrome Extension (מומלץ)

1. פתח Chrome/Edge וגש ל-`chrome://extensions/`
2. הפעל "Developer mode" (למעלה מימין)
3. לחץ על "Load unpacked"
4. בחר את התיקייה `extension/`
5. האקסטנשן יופיע ברשימת ההרחבות

6. **הגדרת האקסטנשן**:
   - לחץ על אייקון האקסטנשן
   - לחץ על "⚙️ הגדרות"
   - הדבק את ה-URL מ-Railway
   - לחץ "💾 שמור הגדרות"

#### אופציה 2: Userscript

1. התקן [Tampermonkey](https://www.tampermonkey.net/) או [Greasemonkey](https://www.greasespot.net/)
2. לחץ על אייקון Tampermonkey
3. בחר "Create a new script"
4. העתק את התוכן מ-`userscript/suno-artist-replacer.user.js`
5. שמור (Ctrl+S)

6. **הגדרת ה-API URL**:
   - פתח קונסול ב-Suno (F12)
   - הרץ:
     ```javascript
     GM_setValue('apiUrl', 'https://your-railway-app.up.railway.app')
     ```

## 🎯 שימוש

### ניהול אמנים

1. **גש לדף הניהול**:
   - URL: `https://your-railway-app.up.railway.app`
   - או: לחץ על האקסטנשן ובחר "📊 דף ניהול"

2. **הוסף אמן חדש**:
   - הזן סיסמת ניהול
   - הזן שם האמן (לדוגמה: "Billy Joel")
   - הזן תיאור הסטייל: "Pop, Rock, Storytelling, piano-driven, male vocals"
   - לחץ "💾 שמור/עדכן אמן"

3. **ערוך אמן קיים**:
   - חפש את האמן ברשימה
   - לחץ "✏️ ערוך"
   - שנה את הסטייל
   - לחץ "💾 שמור/עדכן אמן"

4. **מחק אמן**:
   - חפש את האמן ברשימה
   - לחץ "🗑️ מחק"
   - אשר את המחיקה

### שימוש ב-Suno

1. גש ל-[Suno](https://app.suno.ai/)
2. לחץ על "Create" או "Cover"
3. בשדה "Styles", התחל להקליד שם של אמן:
   - הקלד: "Billy Joel"
   - האקסטנשן יחליף אוטומטית ל: "Pop, Rock, Storytelling, piano-driven, male vocals"

## 🔧 API Endpoints

### GET `/api/artists`
מחזיר את כל האמנים במאגר.

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

### GET `/api/artists/:name`
מחזיר אמן ספציפי.

### POST `/api/artists`
מוסיף או מעדכן אמן.

**Body:**
```json
{
  "name": "Artist Name",
  "style": "Genre, Style, Description",
  "password": "your_admin_password"
}
```

### DELETE `/api/artists/:name`
מוחק אמן.

**Body:**
```json
{
  "password": "your_admin_password"
}
```

### POST `/api/toggle`
מפעיל/מכבה את המערכת.

**Body:**
```json
{
  "password": "your_admin_password"
}
```

## 📝 עריכת המאגר ידנית

אם תרצה לערוך את `artist_styles.json` ישירות:

```json
{
  "enabled": true,
  "artists": {
    "Artist Name": "Detailed style description",
    "Another Artist": "Another style description"
  }
}
```

## 🔒 אבטחה

- כל פעולות הניהול דורשות סיסמה
- הסיסמה נשמרת במשתנה סביבה `ADMIN_PASSWORD`
- **חובה לשנות את הסיסמה לאחר ההתקנה!**

## 🐛 פתרון בעיות

### האקסטנשן לא עובד

1. ודא שה-API URL נכון בהגדרות
2. בדוק שהשרת ב-Railway פועל
3. פתח Developer Tools (F12) ובדוק אם יש שגיאות
4. רענן את המאגר מתוך popup האקסטנשן

### השרת לא עובד

1. בדוק את הלוגים ב-Railway
2. ודא שמשתני הסביבה מוגדרים נכון
3. בדוק שהקובץ `artist_styles.json` קיים

### החלפה לא מתבצעת

1. ודא שהאמן קיים במאגר (אותיות גדולות/קטנות חשובות!)
2. בדוק שהמערכת מופעלת (toggle ב-admin panel)
3. נסה לרענן את הדף

## 📜 רישיון

MIT License

## 🤝 תרומה

רוצה לתרום? פתח Issue או Pull Request!

## 📞 תמיכה

יש בעיה? פתח Issue ב-GitHub.

---

**נוצר עם ❤️ למוזיקאים ויוצרי Suno**
