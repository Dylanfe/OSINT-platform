// OSINT Nexus Public Platform - No Authentication Required
class OSINTNexus {
    constructor() {
        this.apiBaseUrl = window.location.origin + '/api';
        this.currentSection = 'home';
        this.tools = [];
        this.filteredTools = [];
        this.categories = [];
        
        this.init();
    }

    async init() {
        // Load initial data
        await this.loadTools();
        await this.loadCategories();
        this.setupEventListeners();
        
        // Show home section by default
        this.showSection('home');
    }

    setupEventListeners() {
        // Navigation event listeners
        document.addEventListener('click', (e) => {
            // Handle navigation links
            if (e.target.hasAttribute('data-section') || e.target.closest('[data-section]')) {
                e.preventDefault();
                const section = e.target.getAttribute('data-section') || e.target.closest('[data-section]').getAttribute('data-section');
                this.showSection(section);
                return false;
            }

            // Handle tool cards
            if (e.target.classList.contains('tool-card') || e.target.closest('.tool-card')) {
                const card = e.target.classList.contains('tool-card') ? e.target : e.target.closest('.tool-card');
                const category = card.getAttribute('data-category');
                if (category) {
                    this.filterByCategory(category);
                }
            }

            // Handle open tool buttons
            if (e.target.classList.contains('open-tool-btn') || e.target.closest('.open-tool-btn')) {
                e.stopPropagation();
                const btn = e.target.classList.contains('open-tool-btn') ? e.target : e.target.closest('.open-tool-btn');
                const url = btn.getAttribute('data-url');
                if (url) {
                    this.openTool(url);
                }
            }
        });

        // Search functionality
        document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        document.getElementById('performSearchBtn')?.addEventListener('click', () => {
            this.performSearch();
        });

        // Tool search and filters
        document.getElementById('toolSearchInput')?.addEventListener('input', 
            this.debounce(this.searchTools.bind(this), 300)
        );

        document.getElementById('toolCategoryFilter')?.addEventListener('change', () => {
            this.filterTools();
        });

        document.getElementById('toolPricingFilter')?.addEventListener('change', () => {
            this.filterTools();
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    async apiCall(endpoint, method = 'GET', data = null) {
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (data && method !== 'GET') {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(this.apiBaseUrl + endpoint, config);
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Network error' }));
                throw new Error(error.message || 'API call failed');
            }

            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        document.body.appendChild(notification);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    showSection(sectionName) {
        // Hide all sections
        const sections = ['homeSection', 'toolsSection', 'searchSection', 'categoriesSection', 'aboutSection'];
        
        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element) {
                element.style.display = 'none';
            }
        });

        // Show requested section
        const targetSection = document.getElementById(sectionName + 'Section');
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('fade-in');
        }

        // Update active nav links
        this.updateActiveNavLinks(sectionName);

        // Load section-specific data
        this.loadSectionData(sectionName);

        this.currentSection = sectionName;
    }

    updateActiveNavLinks(activeSection) {
        // Remove active class from all nav links
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Add active class to current section
        const activeLink = document.querySelector(`.sidebar .nav-link[data-section="${activeSection}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    async loadSectionData(sectionName) {
        switch (sectionName) {
            case 'home':
                await this.loadHomeData();
                break;
            case 'tools':
                await this.loadToolsData();
                break;
            case 'categories':
                await this.loadCategoriesData();
                break;
        }
    }

    async loadHomeData() {
        try {
            // Update tool count on home page
            if (this.tools.length > 0) {
                document.getElementById('totalTools').textContent = this.tools.length;
            }
        } catch (error) {
            console.error('Error loading home data:', error);
        }
    }

    async loadTools() {
        try {
            const response = await this.apiCall('/tools');
            if (response.success) {
                this.tools = response.data;
                this.filteredTools = [...this.tools];
                this.populateToolFilters();
            }
        } catch (error) {
            console.error('Error loading tools:', error);
            // Show placeholder data if API fails
            this.tools = [];
            this.filteredTools = [];
        }
    }

    async loadCategories() {
        try {
            const response = await this.apiCall('/tools/meta/categories');
            if (response.success) {
                this.categories = response.data;
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            this.categories = [];
        }
    }

    populateToolFilters() {
        const categoryFilter = document.getElementById('toolCategoryFilter');
        if (!categoryFilter) return;

        const categories = [...new Set(this.tools.map(tool => tool.category))];
        categoryFilter.innerHTML = '<option value="">All Categories</option>' +
            categories.map(cat => `<option value="${cat}">${this.formatCategory(cat)}</option>`).join('');
    }

    formatCategory(category) {
        return category.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    async loadToolsData() {
        this.renderTools();
    }

    async loadCategoriesData() {
        this.renderCategories();
    }

    renderTools() {
        const grid = document.getElementById('toolsGrid');
        if (!grid) return;

        if (this.filteredTools.length === 0) {
            grid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h4>No tools found</h4>
                    <p class="text-muted">Try adjusting your filters or search terms</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.filteredTools.map(tool => this.createToolCard(tool)).join('');
    }

    renderCategories() {
        const grid = document.getElementById('categoriesGrid');
        if (!grid) return;

        if (this.categories.length === 0) {
            grid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-layer-group fa-3x text-muted mb-3"></i>
                    <h4>Categories Loading...</h4>
                    <p class="text-muted">Loading tool categories...</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.categories.map(category => this.createCategoryCard(category)).join('');
    }

    createCategoryCard(category) {
        return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card tool-card h-100" data-category="${category.category}">
                    <div class="card-body text-center">
                        <i class="fas fa-layer-group fa-2x text-primary mb-3"></i>
                        <h5>${this.formatCategory(category.category)}</h5>
                        <p class="text-muted mb-3">${category.toolCount} tools available</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">Avg Rating: ${category.averageRating ? category.averageRating.toFixed(1) : 'N/A'}</small>
                            <small class="text-muted">${category.totalUses} uses</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createToolCard(tool) {
        const pricingColor = {
            free: 'success',
            freemium: 'warning',
            paid: 'danger',
            subscription: 'info'
        };

        const riskColor = {
            low: 'success',
            medium: 'warning',
            high: 'danger'
        };

        return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card tool-card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">${tool.name}</h6>
                        <div>
                            <span class="badge bg-${pricingColor[tool.pricing] || 'secondary'}">${tool.pricing}</span>
                            ${tool.opsecRisk ? `<span class="badge bg-${riskColor[tool.opsecRisk]} ms-1">OPSEC: ${tool.opsecRisk}</span>` : ''}
                        </div>
                    </div>
                    <div class="card-body">
                        <p class="card-text small">${tool.description.substring(0, 100)}${tool.description.length > 100 ? '...' : ''}</p>
                        <div class="mb-2">
                            <small class="text-muted">Category: ${this.formatCategory(tool.category)}</small>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div class="small">
                                <i class="fas fa-star text-warning"></i>
                                ${tool.averageRating ? tool.averageRating.toFixed(1) : 'N/A'}
                            </div>
                            <div class="small text-muted">
                                ${tool.totalUses || 0} uses
                            </div>
                        </div>
                        ${tool.tags && tool.tags.length > 0 ? `
                            <div class="mb-2">
                                ${tool.tags.slice(0, 3).map(tag => `<span class="badge bg-secondary me-1">${tag}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-sm btn-primary open-tool-btn" data-url="${tool.url}">
                            <i class="fas fa-external-link-alt me-1"></i>Open Tool
                        </button>
                        ${tool.requiresApiKey ? '<span class="badge bg-warning ms-2">API Key Required</span>' : ''}
                        ${tool.requiresRegistration ? '<span class="badge bg-info ms-2">Registration Required</span>' : ''}
                    </div>
                </div>
            </div>
        `;
    }

    filterTools() {
        const categoryFilter = document.getElementById('toolCategoryFilter')?.value;
        const pricingFilter = document.getElementById('toolPricingFilter')?.value;
        const searchTerm = document.getElementById('toolSearchInput')?.value.toLowerCase();

        this.filteredTools = this.tools.filter(tool => {
            const matchesCategory = !categoryFilter || tool.category === categoryFilter;
            const matchesPricing = !pricingFilter || tool.pricing === pricingFilter;
            const matchesSearch = !searchTerm || 
                tool.name.toLowerCase().includes(searchTerm) ||
                tool.description.toLowerCase().includes(searchTerm) ||
                (tool.tags && tool.tags.some(tag => tag.toLowerCase().includes(searchTerm)));

            return matchesCategory && matchesPricing && matchesSearch;
        });

        this.renderTools();
    }

    searchTools() {
        this.filterTools();
    }

    async performSearch() {
        const searchType = document.getElementById('searchType').value;
        const searchInput = document.getElementById('searchInput').value.trim();

        if (!searchInput) {
            this.showNotification('Please enter a search term', 'warning');
            return;
        }

        // Show loading
        document.getElementById('searchResults').style.display = 'block';
        document.getElementById('loadingSpinner').style.display = 'block';
        document.getElementById('resultContainer').innerHTML = '';

        try {
            let results;
            
            switch (searchType) {
                case 'domain':
                    results = await this.searchDomain(searchInput);
                    break;
                case 'ip':
                    results = await this.searchIP(searchInput);
                    break;
                case 'general':
                    results = await this.searchGeneral(searchInput);
                    break;
                default:
                    throw new Error('Search type not supported');
            }

            this.displaySearchResults(results, searchType, searchInput);

        } catch (error) {
            console.error('Search error:', error);
            this.showNotification(error.message, 'danger');
            document.getElementById('resultContainer').innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-exclamation-triangle fa-2x text-warning mb-3"></i>
                    <h5>Search Failed</h5>
                    <p class="text-muted">${error.message}</p>
                    <small class="text-muted">This feature requires API keys. Some searches may be limited in the public version.</small>
                </div>
            `;
        } finally {
            document.getElementById('loadingSpinner').style.display = 'none';
        }
    }

    async searchDomain(domain) {
        return this.createMockDomainResults(domain);
    }

    async searchIP(ip) {
        return this.createMockIPResults(ip);
    }

    async searchGeneral(query) {
        return this.createGeneralSearchResults(query);
    }

    createMockDomainResults(domain) {
        return {
            success: true,
            domain: domain,
            data: {
                message: `Analysis for domain: ${domain}`,
                suggestions: [
                    "Use Whois lookup tools to find registration information",
                    "Check DNS records using dig or nslookup",
                    "Scan subdomains with tools like Sublist3r",
                    "Check SSL certificate information",
                    "Look for exposed directories and files"
                ],
                tools: [
                    { name: "Whois Lookup", description: "Domain registration information" },
                    { name: "DNS Tools", description: "DNS record analysis" },
                    { name: "SSL Labs", description: "SSL certificate analysis" },
                    { name: "Shodan", description: "Internet-connected devices" }
                ]
            }
        };
    }

    createMockIPResults(ip) {
        return {
            success: true,
            ip: ip,
            data: {
                message: `Analysis for IP address: ${ip}`,
                suggestions: [
                    "Check IP geolocation and ISP information",
                    "Scan for open ports and services",
                    "Look up IP reputation and blacklist status",
                    "Check for SSL certificates on this IP",
                    "Search for related domains and subdomains"
                ],
                tools: [
                    { name: "IP Geolocation", description: "Find approximate location" },
                    { name: "Port Scanner", description: "Discover open services" },
                    { name: "IP Reputation", description: "Check blacklist status" },
                    { name: "Reverse DNS", description: "Find associated domains" }
                ]
            }
        };
    }

    createGeneralSearchResults(query) {
        return {
            success: true,
            query: query,
            data: {
                message: `OSINT investigation guidance for: ${query}`,
                suggestions: [
                    "Start with Google dorking and advanced search operators",
                    "Check social media platforms for relevant information",
                    "Use specialized search engines for specific content types",
                    "Look for leaked databases and data breaches",
                    "Cross-reference information across multiple sources"
                ],
                searchStrategies: [
                    `"${query}" site:linkedin.com`,
                    `"${query}" filetype:pdf`,
                    `"${query}" site:pastebin.com`,
                    `"${query}" -site:google.com -site:bing.com`
                ]
            }
        };
    }

    displaySearchResults(results, searchType, query) {
        const container = document.getElementById('resultContainer');
        
        if (!results.success) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-times-circle fa-2x text-danger mb-3"></i>
                    <h5>No Results Found</h5>
                    <p class="text-muted">No data found for the specified query</p>
                </div>
            `;
            return;
        }

        const { data } = results;
        
        container.innerHTML = `
            <div class="mb-4">
                <h6>${data.message}</h6>
            </div>
            
            ${data.suggestions ? `
                <div class="mb-4">
                    <h6><i class="fas fa-lightbulb text-warning me-2"></i>Investigation Suggestions</h6>
                    <ul class="list-group list-group-flush">
                        ${data.suggestions.map(suggestion => `
                            <li class="list-group-item bg-transparent text-light border-secondary">${suggestion}</li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${data.tools ? `
                <div class="mb-4">
                    <h6><i class="fas fa-tools text-primary me-2"></i>Recommended Tools</h6>
                    <div class="row">
                        ${data.tools.map(tool => `
                            <div class="col-md-6 mb-2">
                                <div class="card">
                                    <div class="card-body py-2">
                                        <h6 class="card-title mb-1">${tool.name}</h6>
                                        <p class="card-text small text-muted mb-0">${tool.description}</p>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${data.searchStrategies ? `
                <div class="mb-4">
                    <h6><i class="fas fa-search text-info me-2"></i>Search Strategies</h6>
                    <div class="row">
                        ${data.searchStrategies.map(strategy => `
                            <div class="col-md-6 mb-2">
                                <div class="card">
                                    <div class="card-body py-2">
                                        <code class="text-light">${strategy}</code>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Note:</strong> This is a demonstration of OSINT methodology. For actual data retrieval, API keys for various services would be required. 
                Check the Tools Directory for direct links to OSINT resources.
            </div>
        `;
    }

    filterByCategory(category) {
        // Switch to tools section and filter by category
        this.showSection('tools');
        setTimeout(() => {
            const categoryFilter = document.getElementById('toolCategoryFilter');
            if (categoryFilter) {
                categoryFilter.value = category;
                this.filterTools();
            }
        }, 100);
    }

    openTool(url) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new OSINTNexus();
});
