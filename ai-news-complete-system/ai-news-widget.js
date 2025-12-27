/**
 * AI News Widget - Vanilla JavaScript Version
 * Drop this into any HTML page to display AI news
 * No framework required!
 */

class AINewsWidget {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.apiUrl = options.apiUrl || 'http://localhost:5000/api/ai-news';
    this.urgentApiUrl = options.urgentApiUrl || 'http://localhost:5000/api/urgent-news';
    this.articlesPerPage = options.articlesPerPage || 12;
    this.page = 0;
    this.articles = [];
    this.urgentNews = [];
    this.loading = false;
    this.hasMore = true;
    this.lastUpdated = null;

    this.init();
    this.startUrgentPolling();
  }

  init() {
    this.renderHeader();
    this.renderLoadingState();
    this.fetchNews();
    this.fetchUrgentNews();
  }

  startUrgentPolling() {
    // Poll for urgent news every 2 minutes
    setInterval(() => {
      this.fetchUrgentNews();
    }, 2 * 60 * 1000);
  }

  async fetchUrgentNews() {
    try {
      const response = await fetch(this.urgentApiUrl);
      if (!response.ok) return;
      
      const data = await response.json();
      this.urgentNews = data.articles || [];
      
      // Update urgent section if it exists
      const urgentSection = document.getElementById('urgent-news-section');
      if (urgentSection) {
        urgentSection.remove();
      }
      
      if (this.urgentNews.length > 0) {
        this.renderUrgentNews();
      }
    } catch (error) {
      console.error('Error fetching urgent news:', error);
    }
  }

  renderHeader() {
    const header = document.createElement('div');
    header.className = 'ai-news-header';
    header.innerHTML = `
      <h1>Latest AI News</h1>
      <p>Real-time AI developments from the last 24 hours</p>
      <span class="last-updated" id="last-updated-time"></span>
    `;
    this.container.appendChild(header);
  }

  updateLastUpdated(timestamp) {
    const elem = document.getElementById('last-updated-time');
    if (elem && timestamp) {
      const time = new Date(timestamp).toLocaleTimeString();
      elem.textContent = `Updated: ${time}`;
    }
  }

  renderUrgentNews() {
    const skeleton = document.getElementById('loading-skeleton');
    if (skeleton) skeleton.remove();

    let urgentSection = document.getElementById('urgent-news-section');
    if (!urgentSection) {
      urgentSection = document.createElement('div');
      urgentSection.className = 'urgent-news-section';
      urgentSection.id = 'urgent-news-section';
      
      const grid = document.getElementById('news-grid');
      if (grid) {
        this.container.insertBefore(urgentSection, grid);
      } else {
        this.container.appendChild(urgentSection);
      }
    }

    urgentSection.innerHTML = `
      <h2 class="urgent-title">
        <span class="urgent-badge">🔴 BREAKING</span>
        Urgent AI News
      </h2>
      <div class="urgent-news-grid" id="urgent-news-grid"></div>
    `;

    const urgentGrid = document.getElementById('urgent-news-grid');
    this.urgentNews.forEach(article => {
      const card = this.createArticleCard(article, true);
      urgentGrid.appendChild(card);
    });
  }

  renderLoadingState() {
    const skeleton = document.createElement('div');
    skeleton.className = 'loading-skeleton';
    skeleton.id = 'loading-skeleton';
    skeleton.innerHTML = Array(6).fill(`
      <div class="skeleton-card">
        <div class="skeleton-image"></div>
        <div class="skeleton-content">
          <div class="skeleton-title"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text short"></div>
        </div>
      </div>
    `).join('');
    this.container.appendChild(skeleton);
  }

  async fetchNews() {
    if (this.loading) return;
    
    this.loading = true;
    const offset = this.page * this.articlesPerPage;

    try {
      const response = await fetch(
        `${this.apiUrl}?limit=${this.articlesPerPage}&offset=${offset}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const data = await response.json();
      
      // Remove loading skeleton on first load
      if (this.page === 0) {
        const skeleton = document.getElementById('loading-skeleton');
        if (skeleton) skeleton.remove();
        this.renderNewsGrid();
      }

      this.articles.push(...data.articles);
      this.hasMore = offset + data.articles.length < data.total;
      this.lastUpdated = data.last_updated;
      
      this.updateLastUpdated(this.lastUpdated);
      this.renderArticles(data.articles);
      this.updateLoadMoreButton();

    } catch (error) {
      console.error('Error fetching news:', error);
      this.renderError();
    } finally {
      this.loading = false;
    }
  }

  renderNewsGrid() {
    const grid = document.createElement('div');
    grid.className = 'news-grid';
    grid.id = 'news-grid';
    this.container.appendChild(grid);

    const loadMoreContainer = document.createElement('div');
    loadMoreContainer.className = 'load-more-container';
    loadMoreContainer.id = 'load-more-container';
    loadMoreContainer.innerHTML = `
      <button class="load-more-button" id="load-more-btn">
        Load More Articles
      </button>
    `;
    this.container.appendChild(loadMoreContainer);

    document.getElementById('load-more-btn').addEventListener('click', () => {
      this.page++;
      this.fetchNews();
    });
  }

  renderArticles(articles) {
    const grid = document.getElementById('news-grid');
    
    articles.forEach(article => {
      const card = this.createArticleCard(article);
      grid.appendChild(card);
    });
  }

  createArticleCard(article, isUrgent = false) {
    const card = document.createElement('article');
    card.className = `news-card ${isUrgent || article.is_urgent ? 'urgent-card' : ''}`;

    const imageUrl = article.image || this.getPlaceholderImage();
    const date = this.formatDate(article.published);

    const urgentIndicator = (isUrgent || article.is_urgent) ? 
      '<div class="urgent-indicator">URGENT</div>' : '';

    const sourceClass = (isUrgent || article.is_urgent) ? 'urgent-source' : '';
    const linkClass = (isUrgent || article.is_urgent) ? 'urgent-link' : '';

    card.innerHTML = `
      ${urgentIndicator}
      <div class="news-image-container">
        <img
          src="${imageUrl}"
          alt="${this.escapeHtml(article.title)}"
          onerror="this.src='${this.getPlaceholderImage()}'"
          loading="lazy"
        />
        <div class="news-source-badge ${sourceClass}">${this.escapeHtml(article.source)}</div>
      </div>
      
      <div class="news-content">
        <div class="news-meta">
          <span class="news-date">${date}</span>
        </div>
        
        <h2 class="news-title">
          <a href="${article.link}" target="_blank" rel="noopener noreferrer">
            ${this.escapeHtml(article.title)}
          </a>
        </h2>
        
        ${article.summary ? `<p class="news-summary">${this.escapeHtml(article.summary)}</p>` : ''}
        
        <a 
          href="${article.link}" 
          target="_blank" 
          rel="noopener noreferrer"
          class="read-more ${linkClass}"
        >
          Read Full Article →
        </a>
      </div>
    `;

    return card;
  }

  updateLoadMoreButton() {
    const button = document.getElementById('load-more-btn');
    if (!button) return;

    if (!this.hasMore) {
      button.style.display = 'none';
    } else {
      button.disabled = this.loading;
      button.textContent = this.loading ? 'Loading...' : 'Load More Articles';
    }
  }

  formatDate(dateString) {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  getPlaceholderImage() {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect fill="%23f0f0f0" width="400" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="24" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EAI News%3C/text%3E%3C/svg%3E';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  renderError() {
    const skeleton = document.getElementById('loading-skeleton');
    if (skeleton) skeleton.remove();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
      <h2>Unable to Load News</h2>
      <p>Failed to load AI news. Please try again later.</p>
      <button class="retry-button" onclick="window.location.reload()">
        Retry
      </button>
    `;
    this.container.appendChild(errorDiv);
  }
}

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('ai-news-widget');
  if (container) {
    new AINewsWidget('ai-news-widget', {
      apiUrl: 'http://localhost:5000/api/ai-news', // Change to your backend URL
      articlesPerPage: 12
    });
  }
});
