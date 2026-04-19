class TorrentSearchApp {
    constructor() {
        this.searchForm = document.getElementById('search-form');
        this.searchInput = document.getElementById('search-input');
        this.searchBtn = document.getElementById('search-btn');
        this.resultsSection = document.getElementById('results-section');
        this.resultsGrid = document.getElementById('results-grid');
        this.resultsTitle = document.getElementById('results-title');
        this.resultsInfo = document.getElementById('results-info');
        this.statusBar = document.getElementById('status-bar');
        this.statusText = document.getElementById('status-text');
        this.statusClose = document.getElementById('status-close');
        this.trackersList = document.getElementById('trackers-list');

        this.currentQuery = '';
        this.isSearching = false;

        this.init();
    }

    init() {
        // Event listeners
        this.searchForm.addEventListener('submit', (e) => this.handleSearch(e));
        this.statusClose.addEventListener('click', () => this.hideStatus());

        // Load trackers status on page load
        this.loadTrackersStatus();
    }

    async handleSearch(e) {
        e.preventDefault();
        
        const query = this.searchInput.value.trim();
        if (query.length < 2) {
            this.showStatus('Please enter at least 2 characters', 'error');
            return;
        }

        if (this.isSearching) return;

        this.currentQuery = query;
        this.isSearching = true;
        this.updateSearchButton(true);
        this.showStatus(`Searching for "${query}"...`, 'info');
        this.hideResults();

        try {
            await this.performSearch(query);
        } catch (error) {
            console.error('Search error:', error);
            this.showStatus('Search failed. Please try again.', 'error');
            this.showEmptyState();
        } finally {
            this.isSearching = false;
            this.updateSearchButton(false);
        }
    }

    async performSearch(query) {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Search failed');
        }

        const data = await response.json();
        
        this.hideStatus();
        
        if (data.results.length === 0) {
            this.showEmptyState();
            return;
        }

        this.showResults(data);
    }

    showResults(data) {
        this.resultsTitle.textContent = `Results for "${this.currentQuery}"`;
        this.resultsInfo.textContent = `${data.results.length} torrent(s) found`;
        this.resultsGrid.innerHTML = '';

        data.results.forEach(result => {
            const card = this.createResultCard(result);
            this.resultsGrid.innerHTML += card;
        });

        this.resultsSection.style.display = 'block';
    }

    createResultCard(result) {
        const seedersClass = this.getSeedersClass(result.seeders);
        const seedersLabel = this.getSeedersLabel(result.seeders);

        return `
            <article class="result-card">
                <span class="result-badge">${result.source}</span>
                <h3 class="result-title">${this.escapeHtml(result.title)}</h3>
                <div class="result-meta">
                    <div class="meta-row">
                        <span class="meta-label">Size:</span>
                        <span class="meta-value">${this.escapeHtml(result.size)}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Seeders:</span>
                        <span class="stat-value ${seedersClass}">${this.formatNumber(result.seeders)}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Leechers:</span>
                        <span class="stat-value">${this.formatNumber(result.leechers)}</span>
                    </div>
                </div>
                <div class="result-actions">
                    <a href="${result.magnet}" class="magnet-button" target="_blank" rel="noopener noreferrer">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.75 3.75l6.03 6.03-.587.587-4.693-4.693v11.08a6.5 6.5 0 01-12.604 1.875l.966-.25a5.5 5.5 0 0010.638-1.625V5.667l-4.694 4.693-.586-.586L11.25 3.75h1.5z"/>
                        </svg>
                        Magnet Link
                    </a>
                </div>
            </article>
        `;
    }

    showEmptyState() {
        this.resultsTitle.textContent = 'No results';
        this.resultsInfo.textContent = '';
        this.resultsGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <p>No torrents found for "${this.escapeHtml(this.currentQuery)}"</p>
                <p>Try a different search term or check spelling</p>
            </div>
        `;
        this.resultsSection.style.display = 'block';
    }

    hideResults() {
        this.resultsSection.style.display = 'none';
    }

    updateSearchButton(isSearching) {
        this.searchBtn.disabled = isSearching;
        if (isSearching) {
            this.searchBtn.innerHTML = '<span class="loading"></span> Searching...';
        } else {
            this.searchBtn.innerHTML = 'Search';
        }
    }

    showStatus(message, type) {
        this.statusText.textContent = message;
        this.statusBar.className = `status-bar ${type}`;
        this.statusBar.style.display = 'flex';
    }

    hideStatus() {
        this.statusBar.style.display = 'none';
    }

    async loadTrackersStatus() {
        try {
            const response = await fetch('/api/trackers');
            const data = await response.json();
            
            this.trackersList.innerHTML = '';
            data.trackers.forEach(tracker => {
                const badge = document.createElement('span');
                badge.className = `tracker-badge ${tracker.available ? 'available' : 'unavailable'}`;
                badge.textContent = tracker.name;
                this.trackersList.appendChild(badge);
            });
        } catch (error) {
            console.error('Failed to load trackers status:', error);
        }
    }

    getSeedersClass(seeders) {
        if (seeders > 50) return 'high';
        if (seeders > 10) return 'medium';
        return 'low';
    }

    getSeedersLabel(seeders) {
        if (seeders > 50) return 'Good';
        if (seeders > 10) return 'Fair';
        return 'Low';
    }

    formatNumber(num) {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new TorrentSearchApp());
} else {
    new TorrentSearchApp();
}
