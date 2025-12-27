"""
AI News Backend API - REAL-TIME AI ONLY
Scrapes ONLY AI-related news from multiple sources
Filters for 24-hour news and detects urgent breaking news
No external paid APIs required - completely self-hosted
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import feedparser
import requests
from bs4 import BeautifulSoup
from newspaper import Article
import json
from datetime import datetime, timedelta
import time
from threading import Thread, Lock
import re

app = Flask(__name__)
CORS(app)  # Allow requests from your frontend

# Global cache
news_cache = []
urgent_news_cache = []  # Separate cache for urgent news
cache_lock = Lock()
last_update = None
CACHE_DURATION = 5  # minutes - Check every 5 minutes for urgent news!

# AI-SPECIFIC News RSS Feeds (Only AI content)
AI_RSS_FEEDS = [
    'https://www.artificialintelligence-news.com/feed/',
    'https://venturebeat.com/category/ai/feed/',
    'https://www.unite.ai/feed/',
    'https://techcrunch.com/category/artificial-intelligence/feed/',
    'https://openai.com/blog/rss/',
    'https://ai.googleblog.com/feeds/posts/default',
    'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml',
    'https://deepmind.google/blog/rss.xml',
    'https://blog.anthropic.com/rss/',
    'https://www.technologyreview.com/topic/artificial-intelligence/feed',
]

# Keywords that indicate AI-related content (for filtering)
AI_KEYWORDS = [
    'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
    'neural network', 'chatgpt', 'gpt', 'llm', 'large language model',
    'openai', 'anthropic', 'claude', 'gemini', 'copilot', 
    'generative ai', 'gen ai', 'computer vision', 'nlp',
    'natural language processing', 'transformer', 'diffusion',
    'stable diffusion', 'midjourney', 'dalle', 'gpt-4', 'gpt-5',
    'agi', 'artificial general intelligence', 'robotics ai',
    'autonomous', 'self-driving', 'deepmind', 'hugging face',
    'ai model', 'ai agent', 'ai assistant', 'voice ai',
    'ai safety', 'alignment', 'ai regulation', 'ai ethics'
]

# Urgent keywords that indicate breaking/important news
URGENT_KEYWORDS = [
    'breaking', 'urgent', 'just announced', 'launches', 'releases',
    'new model', 'gpt-5', 'breakthrough', 'major announcement',
    'just released', 'unveils', 'announces', 'leak', 'exclusive',
    'confirms', 'shuts down', 'acquires', 'acquisition', 'funding',
    'raises', 'lawsuit', 'ban', 'regulation', 'congress', 'senate'
]

# Backup scraping targets if RSS fails
BACKUP_SITES = [
    {
        'url': 'https://www.artificialintelligence-news.com/',
        'selector': 'article h2 a'
    },
    {
        'url': 'https://www.unite.ai/',
        'selector': 'article .entry-title a'
    }
]


def is_ai_related(title, summary):
    """Check if article is AI-related using keywords"""
    text = f"{title} {summary}".lower()
    return any(keyword in text for keyword in AI_KEYWORDS)


def is_urgent_news(title, summary):
    """Check if article contains urgent/breaking news keywords"""
    text = f"{title} {summary}".lower()
    return any(keyword in text for keyword in URGENT_KEYWORDS)


def is_recent(published_date, hours=24):
    """Check if article is within the last X hours"""
    if not published_date:
        return True  # If no date, include it (might be new)
    
    try:
        if isinstance(published_date, str):
            # Try multiple date formats
            for fmt in ['%a, %d %b %Y %H:%M:%S %z', '%Y-%m-%dT%H:%M:%S%z', '%Y-%m-%d %H:%M:%S']:
                try:
                    article_date = datetime.strptime(published_date.split('.')[0], fmt)
                    break
                except:
                    continue
            else:
                return True  # Can't parse, include it
        else:
            article_date = published_date
        
        # Remove timezone info for comparison
        if article_date.tzinfo:
            article_date = article_date.replace(tzinfo=None)
        
        now = datetime.now()
        time_diff = now - article_date
        
        return time_diff.total_seconds() / 3600 <= hours
        
    except Exception as e:
        print(f"Error parsing date: {e}")
        return True  # Include if we can't determine


def parse_rss_feeds():
    """Parse all RSS feeds and return AI-related articles from last 24 hours"""
    articles = []
    urgent_articles = []
    
    for feed_url in AI_RSS_FEEDS:
        try:
            print(f"Parsing feed: {feed_url}")
            feed = feedparser.parse(feed_url)
            
            for entry in feed.entries[:15]:  # Check 15 articles per feed
                try:
                    # Extract image from various possible locations
                    image = None
                    if hasattr(entry, 'media_content'):
                        image = entry.media_content[0]['url']
                    elif hasattr(entry, 'media_thumbnail'):
                        image = entry.media_thumbnail[0]['url']
                    elif 'image' in entry:
                        image = entry.image.get('href', None)
                    
                    # Clean summary
                    summary = entry.get('summary', entry.get('description', ''))
                    if summary:
                        soup = BeautifulSoup(summary, 'html.parser')
                        summary = soup.get_text()[:400]
                    
                    title = entry.get('title', '')
                    
                    # Filter 1: Must be AI-related
                    if not is_ai_related(title, summary):
                        continue
                    
                    # Filter 2: Must be within last 24 hours
                    published = entry.get('published', '')
                    if not is_recent(published, hours=24):
                        continue
                    
                    # Determine timestamp
                    try:
                        timestamp = time.mktime(entry.get('published_parsed', time.gmtime()))
                    except:
                        timestamp = time.time()
                    
                    article = {
                        'title': title,
                        'link': entry.get('link', ''),
                        'published': published,
                        'summary': summary,
                        'source': feed.feed.get('title', 'Unknown'),
                        'image': image,
                        'timestamp': timestamp,
                        'is_urgent': is_urgent_news(title, summary)
                    }
                    
                    # Separate urgent news
                    if article['is_urgent']:
                        urgent_articles.append(article)
                    
                    articles.append(article)
                    
                except Exception as e:
                    print(f"Error parsing entry: {e}")
                    continue
                    
        except Exception as e:
            print(f"Error parsing feed {feed_url}: {e}")
            continue
    
    return articles, urgent_articles


def scrape_backup_sites():
    """Scrape websites as backup if RSS fails"""
    articles = []
    
    for site in BACKUP_SITES:
        try:
            print(f"Scraping backup site: {site['url']}")
            response = requests.get(site['url'], timeout=10, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            soup = BeautifulSoup(response.content, 'html.parser')
            links = soup.select(site['selector'])
            
            for link in links[:5]:
                try:
                    article_url = link.get('href', '')
                    if not article_url.startswith('http'):
                        article_url = site['url'].rstrip('/') + '/' + article_url.lstrip('/')
                    
                    # Use Newspaper3k to extract full article
                    article = Article(article_url)
                    article.download()
                    article.parse()
                    
                    articles.append({
                        'title': article.title,
                        'link': article_url,
                        'published': str(article.publish_date) if article.publish_date else '',
                        'summary': article.text[:300] if article.text else '',
                        'source': site['url'],
                        'image': article.top_image,
                        'timestamp': time.time()
                    })
                except Exception as e:
                    print(f"Error scraping article: {e}")
                    continue
                    
        except Exception as e:
            print(f"Error scraping site {site['url']}: {e}")
            continue
    
    return articles


def fetch_fresh_news():
    """Fetch AI news from last 24 hours with urgent news priority"""
    print("Fetching fresh AI news (last 24 hours only)...")
    
    # Try RSS first (most reliable)
    articles, urgent_articles = parse_rss_feeds()
    
    print(f"Found {len(articles)} AI articles from last 24 hours")
    print(f"Found {len(urgent_articles)} urgent articles")
    
    # Remove duplicates based on title
    seen = set()
    unique_articles = []
    unique_urgent = []
    
    for article in articles:
        title = article['title'].lower().strip()
        if title not in seen and title:
            seen.add(title)
            unique_articles.append(article)
    
    for article in urgent_articles:
        title = article['title'].lower().strip()
        if title not in seen and title:
            seen.add(title)
            unique_urgent.append(article)
    
    # Sort by timestamp (newest first)
    unique_articles.sort(key=lambda x: x.get('timestamp', 0), reverse=True)
    unique_urgent.sort(key=lambda x: x.get('timestamp', 0), reverse=True)
    
    print(f"Returning {len(unique_articles)} unique AI articles")
    print(f"Returning {len(unique_urgent)} unique urgent articles")
    
    return unique_articles[:100], unique_urgent[:20]  # Return top 100 regular, 20 urgent


def update_cache_background():
    """Background thread to update cache every 5 minutes for urgent news"""
    global news_cache, urgent_news_cache, last_update
    
    while True:
        try:
            fresh_news, urgent_news = fetch_fresh_news()
            
            with cache_lock:
                news_cache = fresh_news
                urgent_news_cache = urgent_news
                last_update = datetime.now()
            
            print(f"Cache updated at {last_update}")
            print(f"Regular articles: {len(fresh_news)}")
            print(f"Urgent articles: {len(urgent_news)}")
            
        except Exception as e:
            print(f"Error updating cache: {e}")
        
        # Wait 5 minutes before next update (for urgent news detection)
        time.sleep(CACHE_DURATION * 60)


@app.route('/api/ai-news', methods=['GET'])
def get_ai_news():
    """API endpoint to get AI news (last 24 hours only, urgent news first)"""
    global news_cache, urgent_news_cache, last_update
    
    # Get query parameters
    limit = request.args.get('limit', default=20, type=int)
    offset = request.args.get('offset', default=0, type=int)
    urgent_only = request.args.get('urgent', default='false', type=str).lower() == 'true'
    
    # If cache is empty or too old, fetch immediately
    if not news_cache or not last_update or \
       datetime.now() - last_update > timedelta(minutes=CACHE_DURATION):
        try:
            fresh_news, urgent_news = fetch_fresh_news()
            with cache_lock:
                news_cache = fresh_news
                urgent_news_cache = urgent_news
                last_update = datetime.now()
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    # Return results
    with cache_lock:
        # If urgent only requested
        if urgent_only:
            paginated = urgent_news_cache[offset:offset + limit]
            total = len(urgent_news_cache)
        else:
            # Combine urgent news first, then regular news
            combined = urgent_news_cache + [a for a in news_cache if not a.get('is_urgent')]
            paginated = combined[offset:offset + limit]
            total = len(combined)
        
        response = {
            'articles': paginated,
            'total': total,
            'limit': limit,
            'offset': offset,
            'urgent_count': len(urgent_news_cache),
            'last_updated': last_update.isoformat() if last_update else None,
            'cache_duration_minutes': CACHE_DURATION,
            'filter': '24 hours, AI-related only'
        }
    
    return jsonify(response)


@app.route('/api/urgent-news', methods=['GET'])
def get_urgent_news():
    """API endpoint to get ONLY urgent/breaking AI news"""
    global urgent_news_cache, last_update
    
    with cache_lock:
        response = {
            'articles': urgent_news_cache,
            'total': len(urgent_news_cache),
            'last_updated': last_update.isoformat() if last_update else None,
            'note': 'Breaking and urgent AI news only'
        }
    
    return jsonify(response)


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'cached_articles': len(news_cache),
        'urgent_articles': len(urgent_news_cache),
        'last_update': last_update.isoformat() if last_update else None,
        'cache_duration_minutes': CACHE_DURATION,
        'filter': 'AI-related news from last 24 hours only',
        'update_frequency': f'Every {CACHE_DURATION} minutes'
    })


@app.route('/', methods=['GET'])
def index():
    """Root endpoint"""
    return jsonify({
        'message': 'AI News API Server - Real-Time AI News Only',
        'filter': 'Only AI-related news from last 24 hours',
        'update_frequency': f'Every {CACHE_DURATION} minutes',
        'endpoints': {
            '/api/ai-news': 'Get AI news (urgent first, supports ?limit=N&offset=N&urgent=true)',
            '/api/urgent-news': 'Get ONLY urgent/breaking AI news',
            '/api/health': 'Health check'
        }
    })


if __name__ == '__main__':
    print("Starting AI News Backend Server (Real-Time AI Only)...")
    print("=" * 60)
    print("Filter: Only AI-related news from last 24 hours")
    print(f"Update frequency: Every {CACHE_DURATION} minutes")
    print("Urgent news detection: Enabled")
    print("=" * 60)
    print("\nFetching initial news cache...")
    
    # Fetch initial cache
    try:
        news_cache, urgent_news_cache = fetch_fresh_news()
        last_update = datetime.now()
        print(f"✓ Initial cache loaded:")
        print(f"  - {len(news_cache)} AI articles (last 24 hours)")
        print(f"  - {len(urgent_news_cache)} urgent articles")
    except Exception as e:
        print(f"✗ Error loading initial cache: {e}")
    
    # Start background update thread
    update_thread = Thread(target=update_cache_background, daemon=True)
    update_thread.start()
    print(f"\n✓ Background cache update thread started (checks every {CACHE_DURATION} min)")
    
    # Start Flask server
    print("\n" + "=" * 60)
    print("Server starting on http://localhost:5000")
    print("API endpoints:")
    print("  - http://localhost:5000/api/ai-news (all AI news, urgent first)")
    print("  - http://localhost:5000/api/urgent-news (breaking news only)")
    print("  - http://localhost:5000/api/health (health check)")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)
