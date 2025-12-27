# AI News Integration Guide

Complete guide to integrate AI news into your website without relying on external APIs.

## 🚀 Quick Start

### Option 1: Vanilla JavaScript (Works with ANY website)

1. **Set up the Backend:**
```bash
# Install dependencies
pip install flask flask-cors feedparser beautifulsoup4 newspaper3k requests lxml

# Run the backend server
python ai_news_backend.py
```

2. **Add to your HTML:**
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="AINews.css">
</head>
<body>
  <!-- AI News will load here -->
  <div id="ai-news-widget"></div>

  <script src="ai-news-widget.js"></script>
</body>
</html>
```

That's it! The news will automatically load.

---

### Option 2: React Integration

1. **Set up the Backend** (same as above)

2. **Add to your React app:**
```jsx
import AINews from './AINews';
import './AINews.css';

function App() {
  return (
    <div className="App">
      <AINews />
    </div>
  );
}
```

---

## 📦 Files You Need

### For ANY Website (HTML/WordPress/Wix/etc):
- `ai_news_backend.py` - Backend server
- `AINews.css` - Styling
- `ai-news-widget.js` - JavaScript widget
- `index.html` - Example HTML page

### For React Apps:
- `ai_news_backend.py` - Backend server
- `AINews.jsx` - React component
- `AINews.css` - Styling

---

## 🔧 Configuration

### Change API URL

**Vanilla JavaScript:**
Edit `ai-news-widget.js`:
```javascript
new AINewsWidget('ai-news-widget', {
  apiUrl: 'https://your-domain.com/api/ai-news', // Your backend URL
  articlesPerPage: 12
});
```

**React:**
Edit `AINews.jsx`:
```javascript
const API_URL = 'https://your-domain.com/api/ai-news';
```

### Customize Styling

Edit `AINews.css` to match your brand:
```css
.ai-news-header h1 {
  background: linear-gradient(135deg, #YOUR-COLOR-1, #YOUR-COLOR-2);
  /* ... */
}

.load-more-button {
  background: linear-gradient(135deg, #YOUR-COLOR-1, #YOUR-COLOR-2);
  /* ... */
}
```

---

## 🌐 Deployment Options

### Option 1: Deploy Backend on Same Server (Recommended)

If your website is on a VPS or dedicated server:

1. **Install Python on your server**
2. **Upload backend files**
3. **Run with a process manager:**

```bash
# Install PM2 (Node.js) or use systemd
npm install -g pm2

# Start the backend
pm2 start ai_news_backend.py --interpreter python3
pm2 save
pm2 startup
```

4. **Update API URL in frontend to:**
```javascript
apiUrl: 'http://localhost:5000/api/ai-news'
```

---

### Option 2: Deploy Backend on Separate Server

**Free Options:**
- **Render.com** (Free tier)
- **Railway.app** (Free tier)
- **PythonAnywhere** (Free tier)
- **Fly.io** (Free tier)

**Steps for Render.com:**

1. Create a free account at https://render.com
2. Create a new Web Service
3. Connect your GitHub repository (or upload code)
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `python ai_news_backend.py`
6. Deploy!
7. You'll get a URL like: `https://your-app.onrender.com`

8. Update your frontend:
```javascript
apiUrl: 'https://your-app.onrender.com/api/ai-news'
```

---

### Option 3: Serverless (AWS Lambda, Google Cloud Functions)

For high traffic, deploy as serverless function. Contact me if you need help with this.

---

## 📝 Requirements File

Create `requirements.txt` for easy deployment:

```text
Flask==3.0.0
flask-cors==4.0.0
feedparser==6.0.10
beautifulsoup4==4.12.2
newspaper3k==0.2.8
requests==2.31.0
lxml==4.9.3
```

---

## 🔐 CORS Configuration

If your backend is on a different domain, update `ai_news_backend.py`:

```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=['https://your-website.com'])  # Your website domain
```

---

## 🎨 Customization Examples

### Change Number of Articles

**Vanilla JS:**
```javascript
new AINewsWidget('ai-news-widget', {
  articlesPerPage: 20  // Show 20 instead of 12
});
```

**React:**
```jsx
const ARTICLES_PER_PAGE = 20;
```

### Change Cache Duration

Edit `ai_news_backend.py`:
```python
CACHE_DURATION = 60  # Update every 60 minutes instead of 30
```

### Add More News Sources

Edit `ai_news_backend.py`:
```python
AI_RSS_FEEDS = [
    'https://www.artificialintelligence-news.com/feed/',
    'https://your-favorite-ai-blog.com/feed/',  # Add your own!
    # ... more feeds
]
```

---

## 🐛 Troubleshooting

### "Unable to Load News"

**Check:**
1. Is the backend running? Visit `http://localhost:5000/api/health`
2. CORS errors? Check browser console, update CORS settings
3. Firewall blocking port 5000? Use port 80 or 443

### Articles not loading

**Check:**
1. RSS feeds may be temporarily down
2. Check backend logs for errors
3. Try adding more RSS feeds

### Images not showing

This is normal - some news sites don't provide images. The widget shows a placeholder.

---

## 📊 Performance Tips

### 1. Enable Caching
The backend automatically caches news for 30 minutes. Adjust as needed.

### 2. Use CDN for Static Files
Host CSS/JS files on a CDN like Cloudflare for faster loading.

### 3. Lazy Loading
Images are already set to `loading="lazy"` for better performance.

### 4. Add Redis (Advanced)
For high traffic, use Redis instead of in-memory caching:

```bash
pip install redis
```

```python
import redis
r = redis.Redis(host='localhost', port=6379, db=0)
```

---

## 🔄 Updates & Maintenance

### Update News Sources

Just edit `AI_RSS_FEEDS` in `ai_news_backend.py` and restart the server.

### Backup

The system doesn't store data permanently. All news is fetched fresh every 30 minutes.

---

## 💡 Advanced Features

### Add Search Functionality

Add to frontend:
```javascript
const searchNews = (query) => {
  const filtered = articles.filter(article => 
    article.title.toLowerCase().includes(query.toLowerCase())
  );
  // Render filtered articles
};
```

### Add Categories/Filters

Update backend to accept category parameter:
```python
@app.route('/api/ai-news/<category>')
def get_category_news(category):
    # Filter by category
    pass
```

### Add Newsletter Feature

Collect emails and send weekly digests using the cached news data.

---

## 🆘 Support

If you need help:
1. Check backend logs: `python ai_news_backend.py` shows all errors
2. Check browser console: F12 → Console tab
3. Test API directly: Visit `http://localhost:5000/api/ai-news` in browser

---

## ✅ Checklist

- [ ] Backend is running
- [ ] Frontend files are uploaded
- [ ] API URL is correct
- [ ] CORS is configured
- [ ] Tested on your website
- [ ] Customized colors to match brand
- [ ] Tested on mobile devices

---

## 🎉 You're Done!

Your website now has a beautiful, self-hosted AI news feed that:
- ✅ Works without external paid APIs
- ✅ Updates automatically every 30 minutes
- ✅ Looks great on all devices
- ✅ Is fully customizable
- ✅ Loads fast with caching

Enjoy your new AI news feed! 🚀
