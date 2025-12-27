# ✅ UPDATED: AI-Only, 24-Hour, Real-Time Urgent News

## What Changed

Your requirements have been implemented:

### 1. ✅ **ONLY AI-Related News**
- Added 40+ AI-specific keywords filter
- Articles must contain AI-related terms like:
  - AI, artificial intelligence, machine learning, LLM
  - ChatGPT, Claude, GPT, Gemini, OpenAI, Anthropic
  - Deep learning, neural networks, computer vision
  - And many more...

### 2. ✅ **Last 24 Hours ONLY**
- Strict 24-hour filter on all news
- Articles older than 24 hours are automatically excluded
- Fresh news only!

### 3. ✅ **Urgent/Breaking News Detection**
- Detects urgent keywords like:
  - "breaking", "just announced", "launches", "releases"
  - "new model", "GPT-5", "breakthrough"
  - "unveils", "confirms", "exclusive"
  - And more...

### 4. ✅ **Real-Time Updates**
- Updates every **5 minutes** (changed from 30 minutes)
- Urgent news polled every **2 minutes** on frontend
- Immediate reflection of important news

---

## New Features

### 🔴 Urgent News Section
- Separate "BREAKING" section at the top
- Red highlighting with pulsing animation
- Shows only urgent/breaking AI news
- Updates every 2 minutes

### ⚡ Fast Updates
- Backend checks every 5 minutes (was 30)
- Frontend auto-refreshes urgent news every 2 minutes
- Critical news appears immediately

### 🎯 AI-Only Filter
- 10 AI-specific RSS feeds (added 3 more sources)
- Intelligent keyword matching
- Non-AI articles automatically filtered out

### ⏰ 24-Hour Window
- Only shows news from last 24 hours
- Older news automatically removed
- Always fresh and relevant

---

## New API Endpoints

### 1. `/api/ai-news` (Enhanced)
Get all AI news with urgent articles first

**Example:**
```bash
GET http://localhost:5000/api/ai-news?limit=20
```

**Response includes:**
```json
{
  "articles": [...],
  "total": 45,
  "urgent_count": 5,
  "filter": "24 hours, AI-related only",
  "last_updated": "2025-11-10T20:45:00"
}
```

### 2. `/api/urgent-news` (NEW)
Get ONLY urgent/breaking AI news

**Example:**
```bash
GET http://localhost:5000/api/urgent-news
```

**Response:**
```json
{
  "articles": [...],
  "total": 5,
  "note": "Breaking and urgent AI news only"
}
```

---

## Visual Changes

### Urgent News Indicators

1. **Red Badge**: "URGENT" label on breaking news
2. **Pulsing Animation**: Draws attention to important news
3. **Separate Section**: Breaking news at the top
4. **Red Border**: Urgent cards have red highlight
5. **🔴 Icon**: "BREAKING" section header with red dot

### Updated Header
- Shows "Real-time AI developments from the last 24 hours"
- Displays last update time
- Clear filtering information

---

## How It Works

```
1. Backend scrapes 10 AI news sources every 5 minutes
        ↓
2. Filters for AI-related keywords (40+ terms)
        ↓
3. Filters for last 24 hours only
        ↓
4. Detects urgent keywords (20+ terms)
        ↓
5. Separates into:
   - Urgent news (breaking/important)
   - Regular AI news
        ↓
6. Caches for fast delivery
        ↓
7. Frontend displays:
   - Urgent section at top (red, animated)
   - Regular news below
        ↓
8. Frontend polls urgent news every 2 minutes
        ↓
9. Breaking news appears immediately!
```

---

## Testing the Updates

### 1. Start the Backend
```bash
python ai_news_backend.py
```

You should see:
```
Filter: Only AI-related news from last 24 hours
Update frequency: Every 5 minutes
Urgent news detection: Enabled
```

### 2. Check Health Endpoint
```bash
curl http://localhost:5000/api/health
```

Response shows:
```json
{
  "filter": "AI-related news from last 24 hours only",
  "urgent_articles": 5,
  "update_frequency": "Every 5 minutes"
}
```

### 3. Test Urgent News
```bash
curl http://localhost:5000/api/urgent-news
```

Should return breaking AI news only.

### 4. Open Frontend
Open `index.html` or your website.

You should see:
- 🔴 **BREAKING** section at top (if urgent news exists)
- Red-bordered urgent articles
- "Real-time AI developments from last 24 hours" header
- Update timestamp

---

## Configuration

### Adjust Update Frequency

Edit `ai_news_backend.py` line 23:
```python
CACHE_DURATION = 5  # Check every 5 minutes (was 30)
```

Change to 3 for even faster updates (every 3 minutes).

### Add More AI Keywords

Edit `ai_news_backend.py` around line 36:
```python
AI_KEYWORDS = [
    'ai', 'artificial intelligence',
    # Add your own keywords here
    'your-ai-company-name',
    'your-ai-product',
]
```

### Add More Urgent Keywords

Edit `ai_news_backend.py` around line 53:
```python
URGENT_KEYWORDS = [
    'breaking', 'urgent', 'launches',
    # Add your own urgent terms
    'scandal', 'fires', 'resigns',
]
```

### Adjust 24-Hour Window

Edit `ai_news_backend.py`, find the `is_recent()` function:
```python
def is_recent(published_date, hours=24):  # Change 24 to your preference
```

Change `24` to:
- `12` for last 12 hours
- `48` for last 2 days
- `6` for last 6 hours only

---

## RSS Feed Sources (10 Total)

1. AI News (artificialintelligence-news.com)
2. VentureBeat AI
3. Unite.AI
4. TechCrunch AI
5. OpenAI Blog ⭐ (for urgent OpenAI news)
6. Google AI Blog
7. The Verge AI
8. DeepMind Blog ⭐ (NEW)
9. Anthropic Blog ⭐ (NEW)
10. MIT Tech Review AI ⭐ (NEW)

All sources are AI-focused and update frequently.

---

## Example Urgent News

The system will catch articles like:

✅ "OpenAI Just Released GPT-5"
✅ "Breaking: ChatGPT Launches New Feature"
✅ "Anthropic Unveils Claude 4"
✅ "Google Announces Major AI Breakthrough"
✅ "OpenAI CEO Confirms AGI Timeline"
✅ "Microsoft Acquires AI Startup for $1B"

---

## Performance

| Metric | Before | After |
|--------|--------|-------|
| Update Frequency | 30 min | 5 min |
| Urgent Poll | None | 2 min |
| Article Filter | None | AI + 24hr |
| Sources | 7 | 10 |
| Urgent Detection | No | Yes |
| Response Time | Same | Same (cached) |

---

## Troubleshooting

### Not seeing urgent news?

**Check:**
1. Are there any breaking AI news today?
2. Visit `/api/urgent-news` to see if backend detected any
3. Check console for errors

### Old news showing?

**Check:**
1. Backend logs - should say "last 24 hours only"
2. Restart backend to clear old cache
3. Check system clock is correct

### Updates too slow?

**Change:**
- `CACHE_DURATION = 5` to `CACHE_DURATION = 3` (3 minutes)
- Frontend polling to 1 minute

### Too many/few urgent articles?

**Adjust:**
- Add/remove keywords in `URGENT_KEYWORDS`
- Make filtering more/less strict

---

## What's Next?

All your requirements are now implemented:
- ✅ Only AI-related news
- ✅ Last 24 hours only  
- ✅ Urgent news detection
- ✅ Real-time updates (5 min backend, 2 min urgent)
- ✅ Visual urgent indicators

**Ready to deploy!**

Test it locally, then follow the deployment guide in `INTEGRATION_GUIDE.md`.

---

## Quick Test Commands

```bash
# Start backend
python ai_news_backend.py

# Check health
curl http://localhost:5000/api/health

# Get all AI news (24hr, urgent first)
curl http://localhost:5000/api/ai-news

# Get only urgent news
curl http://localhost:5000/api/urgent-news

# Open frontend
# Just open index.html in browser
```

**All features are now live!** 🚀
