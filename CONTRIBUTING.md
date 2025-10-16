# 🤝 Contributing to Suno Artist Extension

תודה על העניין בתרומה לפרויקט! כל תרומה מתקבלת בברכה.

## דרכים לתרום

### 1. דיווח על באגים

נמצא באג? פתח Issue עם:
- תיאור הבעיה
- צעדים לשחזור
- התנהגות צפויה מול התנהגות בפועל
- צילומי מסך (אם רלוונטי)
- פרטי סביבה (דפדפן, מערכת הפעלה, וכו')

### 2. הצעות לפיצ'רים

יש רעיון? פתח Issue עם:
- תיאור הפיצ'ר המוצע
- מקרי שימוש
- דוגמאות (אם יש)

### 3. תרומת קוד

#### Fork & Clone

```bash
# Fork the repo on GitHub
git clone https://github.com/YOUR_USERNAME/suno-extension.git
cd suno-extension
npm install
```

#### צור Branch חדש

```bash
git checkout -b feature/your-feature-name
# או
git checkout -b fix/bug-description
```

#### כתוב קוד

- עקוב אחר סגנון הקוד הקיים
- הוסף הערות למשמעותיות
- בדוק שהקוד עובד

#### Commit

```bash
git add .
git commit -m "Add: your feature description"
# או
git commit -m "Fix: bug description"
```

סגנון Commit Messages:
- `Add:` - פיצ'ר חדש
- `Fix:` - תיקון באג
- `Update:` - עדכון קוד קיים
- `Docs:` - שינויים בתיעוד
- `Refactor:` - שינוי מבני בקוד
- `Test:` - הוספת/עדכון בדיקות

#### Push & Pull Request

```bash
git push origin feature/your-feature-name
```

פתח Pull Request עם:
- תיאור השינויים
- קישור ל-Issue קשור (אם יש)
- צילומי מסך (אם רלוונטי)

## 📝 Guidelines

### קוד

- JavaScript: השתמש ב-ES6+
- Format: 2 spaces indentation
- Comments: באנגלית או עברית
- Variables: שמות תיאוריים

### תיעוד

- עדכן README אם צריך
- הוסף הערות לפונקציות מורכבות
- עדכן CHANGELOG

### בדיקות

לפני שליחת PR:

```bash
# Test the server
npm start
# Visit http://localhost:3000

# Test the extension
# Load in Chrome and test on Suno

# Test the API
npm test
```

## 🎯 Priority Areas

אזורים שצריכים עזרה:

1. **בדיקות** - הוספת unit tests
2. **תיעוד** - שיפור התיעוד
3. **UI/UX** - שיפור העיצוב
4. **Performance** - אופטימיזציות
5. **אמנים** - הוספת אמנים למאגר

## 📧 שאלות?

פתח Issue או שלח אימייל.

---

**תודה על התרומה! 🎵**
