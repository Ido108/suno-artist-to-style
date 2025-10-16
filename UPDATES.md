# 🎉 עדכונים גדולים! v2.0

## ⭐ מה חדש

### 1. ✨ החלפה ידנית במקום אוטומטית
**לפני:** האקסטנשן החליף אוטומטית בזמן כתיבה (יכול היה להפריע)
**עכשיו:** כפתור "🎨 Replace with Style" שמופיע ליד שדה Styles

**איך זה עובד:**
1. כתוב שם אמן בשדה Styles (לדוגמה: "Billy Joel")
2. לחץ על הכפתור "Replace with Style"
3. השם יוחלף בתיאור המפורט!

**יתרונות:**
- ✅ שליטה מלאה מתי להחליף
- ✅ לא מפריע בזמן כתיבה
- ✅ אפשר לערוך לפני ההחלפה
- ✅ משוב ויזואלי (מראה כמה אמנים הוחלפו)

---

### 2. 🤖 AI Style Generator
**פיצ'ר חדש ומדהים!** עכשיו אפשר לייצר תיאורי סטייל אוטומטית עם AI!

**איך זה עובד:**
1. גש לדף הניהול
2. הזן שם אמן בשדה "שם האמן"
3. לחץ על "🤖 AI Generator"
4. ה-AI ייצר תיאור מפורט אוטומטית!
5. ערוך אם צריך ושמור

**תומך ב:**
- OpenAI (GPT-4, GPT-4o-mini)
- Anthropic Claude (Claude 3.5 Sonnet)

**דרישות:**
- API Key של OpenAI או Anthropic
- הוספה למשתני סביבה ב-Railway

---

## 📝 הגדרת AI Generator

### 1. השג API Key

**OpenAI (מומלץ למתחילים):**
1. גש ל-[platform.openai.com](https://platform.openai.com/)
2. צור חשבון
3. לך ל-API Keys
4. צור key חדש
5. העתק את ה-key

**Anthropic Claude (אלטרנטיבה):**
1. גש ל-[console.anthropic.com](https://console.anthropic.com/)
2. צור חשבון
3. צור API key
4. העתק

### 2. הוסף ל-Railway

1. גש לפרויקט ב-Railway
2. לחץ על Variables
3. הוסף:

**עבור OpenAI:**
```
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini
```

**עבור Claude:**
```
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-key-here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

4. Redeploy (Railway יעשה זאת אוטומטית)

### 3. בדוק שזה עובד

1. גש לדף הניהול
2. הזן אמן: "Radiohead"
3. לחץ "AI Generator"
4. אמור לקבל משהו כמו:
   ```
   Alternative Rock, Experimental, Atmospheric, Melancholic,
   Ethereal vocals, Complex arrangements, Electronic elements,
   Guitar-driven, Innovative production, Art rock influences
   ```

---

## 💰 עלויות

**OpenAI:**
- GPT-4o-mini: ~$0.0001 לאמן (זול מאוד!)
- GPT-4: ~$0.01 לאמן (יקר יותר, מדויק יותר)

**Anthropic:**
- Claude 3.5 Sonnet: ~$0.003 לאמן (מאוזן)

**המלצה:** התחל עם GPT-4o-mini, זול ומספיק טוב!

---

## 🔄 איך לעדכן

### Extension
1. גש ל-`chrome://extensions/`
2. לחץ על כפתור הרענון של האקסטנשן
3. או: הסר והתקן מחדש

### Userscript
1. פתח Tampermonkey
2. ערוך את הסקריפט
3. העתק את הגרסה החדשה
4. שמור

### Server
```bash
git pull origin main
git push
# Railway יעשה redeploy אוטומטית
```

---

## 🎯 דוגמאות שימוש

### דוגמה 1: עם AI Generator
```
1. דף ניהול → הזן "Taylor Swift"
2. לחץ AI Generator
3. קיבלת: "Pop, Country-pop influences, Catchy melodies,
   Confessional lyrics, Female vocals, Modern production"
4. שמור!
```

### דוגמה 2: ב-Suno
```
1. פתח Suno → Create
2. בשדה Styles הקלד: "Taylor Swift, Adele"
3. לחץ "Replace with Style"
4. מקבל: "Pop, Country-pop influences, Catchy melodies...,
   Soul, Emotional, Torch-Lounge, female vocals..."
```

---

## 🐛 בעיות נפוצות

### הכפתור לא מופיע ב-Suno
**פתרון:**
1. רענן את הדף (F5)
2. פתח Console (F12) - אמור לראות: "[Suno Extension] Replace button created"
3. אם לא - נסה להעלות את האקסטנשן מחדש

### AI Generator לא עובד
**פתרון:**
1. בדוק שה-API key נכון
2. ודא ש-LLM_PROVIDER מוגדר
3. בדוק את הלוגים ב-Railway
4. נסה עם provider אחר

### "LLM API key not configured"
**פתרון:**
הוסף את המשתנים ל-Railway:
```
OPENAI_API_KEY=your-key
LLM_PROVIDER=openai
```

---

## 📖 תיעוד מעודכן

- [README.md](README.md) - תיעוד עדכני
- [INSTALLATION.md](INSTALLATION.md) - הוראות התקנה
- [QUICKSTART.md](QUICKSTART.md) - התחלה מהירה

---

**זקוק לעזרה?** פתח Issue ב-GitHub!

**אהבת את העדכון?** תן ⭐ לפרויקט!
