import React, { useState, useEffect } from 'react';
import './AINews.css';

const AINews = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [urgentCount, setUrgentCount] = useState(0);

  const ARTICLES_PER_PAGE = 12;
  const API_URL = 'http://localhost:5000/api/ai-news';

  useEffect(() => {
    fetchNews();
    
    // Auto-refresh every 5 minutes for urgent news
    const refreshInterval = setInterval(fetchNews, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [page]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const offset = page * ARTICLES_PER_PAGE;
      const response = await fetch(
        `${API_URL}?limit=${ARTICLES_PER_PAGE}&offset=${offset}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const data = await response.json();
      
      if (page === 0) {
        setArticles(data.articles);
      } else {
        setArticles(prev => [...prev, ...data.articles]);
      }
      
      setHasMore(offset + data.articles.length < data.total);
      setLastUpdate(data.last_updated);
      setUrgentCount(data.urgent_count || 0);
      setError(null);
    } catch (err) {
      setError('Failed to load AI news. Please try again later.');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return date.toLocaleDateString();
  };

  const getPlaceholderImage = () => {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect fill="%23667eea" width="400" height="200"/%3E%3Ctext fill="white" font-family="sans-serif" font-size="24" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EAI News%3C/text%3E%3C/svg%3E';
  };

  const getTimeAgo = (lastUpdateStr) => {
    if (!lastUpdateStr) return '';
    const lastUpdateTime = new Date(lastUpdateStr);
    const now = new Date();
    const diffMinutes = Math.floor((now - lastUpdateTime) / (1000 * 60));
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    return `${Math.floor(diffMinutes / 60)} hours ago`;
  };

  if (error && articles.length === 0) {
    return (
      <div className="ai-news-container">
        <div className="error-message">
          <h2>Unable to Load News</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-news-container">
      <div className="ai-news-header">
        <h1>Latest AI News</h1>
        <p>Real-time AI news from the last 24 hours</p>
        {lastUpdate && (
          <div className="update-info">
            <span className="live-indicator">● LIVE</span>
            <span>Updated {getTimeAgo(lastUpdate)}</span>
            {urgentCount > 0 && (
              <span className="urgent-badge">
                🔥 {urgentCount} Breaking {urgentCount === 1 ? 'Story' : 'Stories'}
              </span>
            )}
          </div>
        )}
      </div>

      {articles.length === 0 && loading ? (
        <div className="loading-skeleton">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-image"></div>
              <div className="skeleton-content">
                <div className="skeleton-title"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-text short"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="news-grid">
            {articles.map((article, index) => (
              <article 
                key={index} 
                className={`news-card ${article.is_urgent ? 'urgent-news' : ''}`}
              >
                {article.is_urgent && (
                  <div className="urgent-flag">
                    <span>🔥 BREAKING</span>
                  </div>
                )}
                
                <div className="news-image-container">
                  <img
                    src={article.image || getPlaceholderImage()}
                    alt={article.title}
                    onError={(e) => {
                      e.target.src = getPlaceholderImage();
                    }}
                    loading="lazy"
                  />
                  <div className="news-source-badge">{article.source}</div>
                </div>
                
                <div className="news-content">
                  <div className="news-meta">
                    <span className="news-date">{formatDate(article.published)}</span>
                  </div>
                  
                  <h2 className="news-title">
                    <a href={article.link} target="_blank" rel="noopener noreferrer">
                      {article.title}
                    </a>
                  </h2>
                  
                  {article.summary && (
                    <p className="news-summary">{article.summary}</p>
                  )}
                  
                  <a 
                    href={article.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="read-more"
                  >
                    Read Full Article →
                  </a>
                </div>
              </article>
            ))}
          </div>

          {hasMore && (
            <div className="load-more-container">
              <button 
                onClick={loadMore} 
                disabled={loading}
                className="load-more-button"
              >
                {loading ? 'Loading...' : 'Load More Articles'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AINews;
