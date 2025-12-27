# 🚀 GETTING STARTED - 5 Minute Setup

## What You're Getting

A complete, self-hosted AI news system that works on **any website** without depending on unreliable free APIs.

**Total Lines of Code:** 665 lines  
**Setup Time:** 5 minutes  
**Cost:** $0 (completely free)

---

## Step 1: Start the Backend (2 minutes)

### On Mac/Linux:
```bash
chmod +x start.sh
./start.sh
```

### On Windows:
```bash
start.bat
```

### Or Manually:
```bash
pip install -r requirements.txt
python ai_news_backend.py
```

✅ **Backend is now running on http://localhost:5000**

---

## Step 2: Test It Works (1 minute)

Open your browser and visit:
```
http://localhost:5000/api/ai-news
```

You should see JSON data with AI news articles! 🎉

---

## Step 3: Add to Your Website (2 minutes)

### Option A: HTML Website (Copy-Paste Solution)

Add this to your HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Add the CSS -->
  <link rel="stylesheet" href="AINews.css">
</head>
<body>
  
  <!-- Add this div where you want news to appear -->
  <div id="ai-news-widget"></div>

  <!-- Add the JavaScript -->
  <script src="ai-news-widget.js"></script>

</body>
</html>
```

**That's it!** News will load automatically.

---

### Option B: React Website

```jsx
// 1. Import the component
import AINews from './AINews';
import './AINews.css';

// 2. Use it anywhere
function App() {
  return (
    <div>
      <AINews />
    </div>
  );
}
```

Done! 🎉

---

## Step 4: Customize (Optional)

### Change Colors

Edit `AINews.css`:
```css
/* Line 15 - Change the gradient colors */
.ai-news-header h1 {
  background: linear-gradient(135deg, #YOUR-COLOR-1, #YOUR-COLOR-2);
}
```

### Change Number of Articles

**JavaScript:** Edit `ai-news-widget.js` line 5:
```javascript
this.articlesPerPage = 20; // Change from 12 to 20
```

**React:** Edit `AINews.jsx` line 9:
```javascript
const ARTICLES_PER_PAGE = 20; // Change from 12 to 20
```

### Add More News Sources

Edit `ai_news_backend.py` line 28:
```python
AI_RSS_FEEDS = [
    'https://www.artificialintelligence-news.com/feed/',
    'https://your-favorite-ai-blog.com/feed/',  # Add here!
]
```

Restart the backend and you're done!

---

## Deployment to Production

### Free Options (Choose One):

1. **Render.com** (Easiest)
   - Sign up at https://render.com
   - Create new "Web Service"
   - Connect your code
   - Deploy!
   - Get URL like: https://your-app.onrender.com

2. **Railway.app**
   - Sign up at https://railway.app
   - New Project
   - Deploy from GitHub
   - Done!

3. **Your Own Server**
   - Upload files to your server
   - Run `./start.sh`
   - Done!

### Update Frontend URL

Change the API URL to your production backend:

**JavaScript:** Edit `ai-news-widget.js`:
```javascript
apiUrl: 'https://your-backend-url.com/api/ai-news'
```

**React:** Edit `AINews.jsx`:
```javascript
const API_URL = 'https://your-backend-url.com/api/ai-news';
```

---

## That's It! 🎉

You now have:
- ✅ A working backend server
- ✅ Beautiful news widget
- ✅ Completely free solution
- ✅ No API dependencies
- ✅ Full control

---

## Need Help?

### Backend not starting?
```bash
# Check Python version (need 3.7+)
python --version

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### News not showing?
1. Check backend is running: http://localhost:5000/api/health
2. Check browser console (F12) for errors
3. Make sure API URL matches in frontend

### Want to customize more?
- Read `INTEGRATION_GUIDE.md` for detailed customization
- Read `ARCHITECTURE.md` to understand how it works
- Check `README.md` for full documentation

---

## Quick Reference

| File | Purpose |
|------|---------|
| `ai_news_backend.py` | Backend server (Python) |
| `AINews.jsx` | React component |
| `ai-news-widget.js` | Vanilla JavaScript widget |
| `AINews.css` | Styling |
| `index.html` | Example HTML page |
| `requirements.txt` | Python dependencies |
| `README.md` | Full documentation |
| `INTEGRATION_GUIDE.md` | Detailed setup guide |
| `ARCHITECTURE.md` | Technical details |

---

## Test Checklist

- [ ] Backend starts without errors
- [ ] Can access http://localhost:5000/api/ai-news
- [ ] `index.html` shows news when opened
- [ ] Articles load properly
- [ ] Images display (or show placeholder)
- [ ] "Load More" button works
- [ ] Links open in new tab
- [ ] Mobile responsive (test on phone)

---

**All working? You're done! Time to deploy! 🚀**

For detailed deployment instructions, see `INTEGRATION_GUIDE.md`
