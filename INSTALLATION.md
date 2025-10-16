# 📖 מדריך התקנה מפורט

## תוכן עניינים
1. [הכנת הסביבה](#הכנת-הסביבה)
2. [התקנת השרת](#התקנת-השרת)
3. [התקנת האקסטנשן](#התקנת-האקסטנשן)
4. [בדיקה ראשונית](#בדיקה-ראשונית)

---

## הכנת הסביבה

### דרישות מקדימות

1. **Node.js** (גרסה 16 ומעלה)
   - הורד מ-[nodejs.org](https://nodejs.org/)
   - בדוק התקנה: `node --version`

2. **Git** (אופציונלי, למי שמשתמש ב-GitHub)
   - הורד מ-[git-scm.com](https://git-scm.com/)

3. **חשבון Railway**
   - הירשם ב-[Railway.app](https://railway.app)

4. **דפדפן Chrome/Edge** (לאקסטנשן)
   או
   **Tampermonkey** (ל-Userscript)

---

## התקנת השרת

### אופציה 1: פריסה ב-Railway (מומלץ)

#### שלב 1: העלה את הפרויקט ל-GitHub

```bash
cd suno-extension

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create repo on GitHub and push
git remote add origin https://github.com/YOUR_USERNAME/suno-extension.git
git push -u origin main
```

#### שלב 2: חבר ל-Railway

1. התחבר ל-[Railway](https://railway.app)
2. לחץ **"New Project"**
3. בחר **"Deploy from GitHub repo"**
4. אשר את החיבור ל-GitHub
5. בחר את הריפו `suno-extension`

#### שלב 3: הגדר משתני סביבה

1. לחץ על הפרויקט שנוצר
2. עבור ל-**"Variables"**
3. לחץ **"+ Add Variables"**
4. הוסף את המשתנים הבאים:

```
PORT = 3000
NODE_ENV = production
ADMIN_PASSWORD = YOUR_SECURE_PASSWORD_HERE
```

⚠️ **חשוב**: החלף את `YOUR_SECURE_PASSWORD_HERE` בסיסמה חזקה!

#### שלב 4: פרוס

1. Railway יתחיל לפרוס אוטומטית
2. המתן כ-2-3 דקות
3. לאחר הפריסה, לחץ על **"Settings"**
4. גלול ל-**"Networking"**
5. העתק את ה-**URL** (לדוגמה: `https://suno-extension-production-xxxx.up.railway.app`)

✅ **השרת מוכן!**

---

### אופציה 2: הרצה מקומית (לבדיקות)

```bash
# Install dependencies
npm install

# Create .env file
echo "PORT=3000" > .env
echo "NODE_ENV=development" >> .env
echo "ADMIN_PASSWORD=test123" >> .env

# Start server
npm start
```

השרת יעלה ב-`http://localhost:3000`

---

## התקנת האקסטנשן

### Chrome Extension

#### שלב 1: הכן את האייקונים

1. גש ל-`extension/icons/`
2. צור 3 קבצי PNG:
   - `icon16.png` (16x16)
   - `icon48.png` (48x48)
   - `icon128.png` (128x128)

או השתמש באייקון emoji:
```bash
# Go to https://emoji.aranja.com/
# Type: 🎵
# Download all sizes
```

#### שלב 2: טען את האקסטנשן

1. פתח Chrome/Edge
2. גש ל-`chrome://extensions/`
3. הפעל **"Developer mode"** (למעלה מימין)
4. לחץ **"Load unpacked"**
5. בחר את התיקייה `extension/`

✅ **האקסטנשן הותקן!**

#### שלב 3: הגדר את ה-API

1. לחץ על אייקון האקסטנשן (ליד סרגל הכתובת)
2. לחץ **"⚙️ הגדרות"**
3. הדבק את ה-URL מ-Railway
4. לחץ **"💾 שמור הגדרות"**
5. המתן לאישור: "ההגדרות נשמרו בהצלחה!"

---

### Userscript (Tampermonkey)

#### שלב 1: התקן Tampermonkey

1. התקן את ההרחבה:
   - [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/)
   - [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/)

#### שלב 2: הוסף את הסקריפט

1. לחץ על אייקון Tampermonkey
2. בחר **"Create a new script..."**
3. מחק את כל התוכן
4. העתק את התוכן מ-`userscript/suno-artist-replacer.user.js`
5. הדבק
6. שמור (Ctrl+S)

#### שלב 3: הגדר את ה-API URL

1. גש ל-[Suno](https://app.suno.ai/)
2. פתח Developer Console (F12)
3. הרץ:
```javascript
GM_setValue('apiUrl', 'https://your-railway-app.up.railway.app')
```
4. החלף את ה-URL ב-URL שלך מ-Railway

✅ **ה-Userscript מוכן!**

---

## בדיקה ראשונית

### 1. בדוק את השרת

1. פתח דפדפן
2. גש ל-URL של השרת שלך
3. אמור לראות את דף הניהול
4. הזן את הסיסמה
5. אמור לראות את רשימת האמנים

### 2. בדוק את האקסטנשן

1. פתח את [Suno](https://app.suno.ai/)
2. לחץ על **"Create"** או **"Cover"**
3. גלול לשדה **"Styles"**
4. הקלד שם אמן: "Billy Joel"
5. האקסטנשן אמור להחליף אוטומטית ל-סטייל המפורט

### 3. בדוק הוספת אמן חדש

1. גש לדף הניהול
2. הזן:
   - **סיסמה**: הסיסמה שלך
   - **שם האמן**: "Test Artist"
   - **סטייל**: "Test Genre, Test Style"
3. לחץ **"שמור"**
4. האמן אמור להופיע ברשימה
5. נסה להשתמש בו ב-Suno

---

## פתרון בעיות נפוצות

### השרת לא עולה ב-Railway

**בעיה**: "Application failed to deploy"

**פתרון**:
1. בדוק את הלוגים ב-Railway
2. ודא ש-`package.json` קיים
3. ודא שמשתני הסביבה מוגדרים
4. נסה לפרוס מחדש (Redeploy)

### האקסטנשן לא מחליף טקסט

**בעיה**: האקסטנשן לא עובד ב-Suno

**פתרון**:
1. פתח Developer Tools (F12)
2. עבור ל-Console
3. חפש שגיאות
4. ודא שה-API URL נכון בהגדרות
5. רענן את הדף (F5)
6. לחץ על האקסטנשן ובחר "🔄 רענן מאגר"

### שגיאת CORS

**בעיה**: "CORS policy blocked"

**פתרון**:
זה לא אמור לקרות כי השרת מגדיר CORS. אם זה קורה:
1. ודא שה-URL נכון
2. נסה להוסיף `https://` לפני ה-URL

### סיסמה לא עובדת

**בעיה**: "Unauthorized"

**פתרון**:
1. ודא שהסיסמה זהה למה שב-`ADMIN_PASSWORD` ב-Railway
2. בדוק אם יש רווחים מיותרים
3. נסה לשנות את המשתנה ב-Railway ולפרוס מחדש

---

## עדכון המערכת

### עדכון קוד

```bash
# Pull latest changes
git pull origin main

# Push to GitHub
git add .
git commit -m "Update"
git push

# Railway will auto-deploy
```

### עדכון האקסטנשן

1. שמור שינויים ב-`extension/`
2. גש ל-`chrome://extensions/`
3. לחץ על כפתור הרענון של האקסטנשן
4. או: הסר והתקן מחדש

---

## צור קשר ותמיכה

נתקלת בבעיה? פתח issue ב-GitHub!

**נוצר במיוחד למוזיקאים ויוצרי Suno ❤️**
