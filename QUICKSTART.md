# ⚡ התחלה מהירה

## 3 שלבים פשוטים להתקנה

### 1️⃣ התקן Dependencies

```bash
npm install
```

### 2️⃣ פרוס ב-Railway

1. עלה ל-[Railway.app](https://railway.app)
2. חבר את הריפו שלך
3. הוסף משתני סביבה:
   ```
   PORT=3000
   NODE_ENV=production
   ADMIN_PASSWORD=your_password
   ```
4. העתק את ה-URL שמתקבל

### 3️⃣ התקן את האקסטנשן

**Chrome Extension:**
1. גש ל-`chrome://extensions/`
2. הפעל "Developer mode"
3. "Load unpacked" → בחר תיקיית `extension/`
4. לחץ על האקסטנשן → הגדרות → הדבק URL מ-Railway

**או Userscript:**
1. התקן [Tampermonkey](https://www.tampermonkey.net/)
2. צור סקריפט חדש
3. העתק מ-`userscript/suno-artist-replacer.user.js`

---

## ✅ בדיקה

1. גש ל-[Suno](https://app.suno.ai/)
2. לחץ "Create" → "Styles"
3. הקלד "Billy Joel"
4. זה אמור להחליף אוטומטית!

---

## 🎯 שימוש בדף הניהול

1. גש ל-URL של Railway
2. הזן סיסמה
3. הוסף אמנים:
   - **שם**: "Artist Name"
   - **סטייל**: "Genre, Style, Description"
4. שמור!

---

## 📚 מדריכים מלאים

- [README.md](README.md) - תיעוד מלא
- [INSTALLATION.md](INSTALLATION.md) - מדריך התקנה מפורט

---

**זקוק לעזרה?** פתח Issue ב-GitHub!
