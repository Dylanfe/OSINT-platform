// OSINT Nexus - Professional Intelligence Tools Directory
class OSINTHub {
    constructor() {
        this.apiBaseUrl = window.location.origin + '/api';
        this.currentSection = 'home';
        this.tools = [];
        this.filteredTools = [];
        this.categories = [];
        this.currentTheme = localStorage.getItem('osint-hub-theme') || 'light';
        
        this.init();
    }

    async init() {
        // Initialize theme
        this.initializeTheme();
        
        // Load initial data
        await this.loadTools();
        await this.loadCategories();
        this.setupEventListeners();
        this.renderCategories();
        
        // Show home section by default
        this.showSection('home');
    }

    initializeTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.updateThemeIcon();
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('osint-hub-theme', this.currentTheme);
        this.updateThemeIcon();
        
        // Add smooth transition
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }

    updateThemeIcon() {
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            themeIcon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Navigation links
        document.addEventListener('click', (e) => {
            if (e.target.hasAttribute('data-section') || e.target.closest('[data-section]')) {
                e.preventDefault();
                const section = e.target.getAttribute('data-section') || e.target.closest('[data-section]').getAttribute('data-section');
                this.showSection(section);
                return false;
            }

            // Handle category cards
            if (e.target.classList.contains('category-card') || e.target.closest('.category-card')) {
                e.preventDefault();
                const card = e.target.classList.contains('category-card') ? e.target : e.target.closest('.category-card');
                const category = card.getAttribute('data-category');
                if (category) {
                    this.filterByCategory(category);
                }
                return false;
            }

            // Handle tool cards (open tool link)
            if (e.target.classList.contains('open-tool-btn') || e.target.closest('.open-tool-btn')) {
                e.stopPropagation();
                const btn = e.target.classList.contains('open-tool-btn') ? e.target : e.target.closest('.open-tool-btn');
                const url = btn.getAttribute('data-url');
                if (url) {
                    this.openTool(url);
                }
                return false;
            }
        });

        // Search functionality
        document.getElementById('heroSearchBtn')?.addEventListener('click', () => {
            this.performHeroSearch();
        });

        document.getElementById('heroSearchInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performHeroSearch();
            }
        });

        document.getElementById('performSearchBtn')?.addEventListener('click', () => {
            this.performSearch();
        });

        document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // Tool filters
        document.getElementById('categoryFilter')?.addEventListener('change', () => {
            this.filterTools();
        });

        document.getElementById('riskFilter')?.addEventListener('change', () => {
            this.filterTools();
        });

        document.getElementById('toolSearchInput')?.addEventListener('input', 
            this.debounce(() => this.filterTools(), 300)
        );
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

    showSection(sectionName) {
        // Hide all sections
        const sections = ['homeSection', 'toolsSection', 'searchSection', 'aboutSection', 'dashboardSection'];
        
        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element) {
                element.style.display = 'none';
                element.classList.remove('active');
            }
        });

        // Show requested section
        const targetSection = document.getElementById(sectionName + 'Section');
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('active');
        }

        // Update active nav links
        this.updateActiveNavLinks(sectionName);

        // Load section-specific data
        this.loadSectionData(sectionName);

        this.currentSection = sectionName;
    }

    updateActiveNavLinks(activeSection) {
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Add active class to current section
        const activeLink = document.querySelector(`.nav-link[data-section="${activeSection}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    async loadSectionData(sectionName) {
        switch (sectionName) {
            case 'tools':
                this.renderTools();
                break;
            case 'search':
                // Clear previous search results
                document.getElementById('searchResults')?.classList.add('hidden');
                break;
            case 'dashboard':
                this.initializeDashboard();
                break;
        }
    }

    async loadTools() {
        try {
            console.log('Loading tools from database...');
            
            // Try to load from API first, fallback to static data
            const response = await fetch(`${this.apiBaseUrl}/tools`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data && data.data.length > 0) {
                    this.tools = data.data;
                    this.filteredTools = [...this.tools];
                    console.log(`Successfully loaded ${this.tools.length} tools from database`);
                } else {
                    throw new Error('No tools data received');
                }
            } else {
                throw new Error('API not available');
            }
        } catch (error) {
            console.log('Database unavailable, loading fallback tools data...');
            this.tools = this.getFallbackTools();
            this.filteredTools = [...this.tools];
            console.log(`Loaded ${this.tools.length} tools from fallback`);
        }
        
        this.populateToolFilters();
        this.updateToolCount();
    }

    async loadCategories() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/tools/meta/categories`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.categories = data.data || [];
                }
            }
        } catch (error) {
            console.log('Using fallback categories');
        }
        
        // Use fallback if no categories loaded
        if (this.categories.length === 0) {
            this.categories = this.getFallbackCategories();
        }
    }

    getFallbackTools() {
        return [
            // Username & Social Media Tools
            {
                id: '1',
                name: "WhatsMyName",
                category: "username-search",
                description: "Web-based tool that enumerates a username across hundreds of websites and services, categorizing hits by platform type",
                url: "https://whatsmyname.app/",
                pricing: "free",
                opsecRisk: "low",
                tags: ["username", "enumeration", "social-media"],
                averageRating: 4.6,
                totalUses: 1250
            },
            {
                id: '2',
                name: "Sherlock",
                category: "username-search",
                description: "Powerful command-line tool to hunt for social media accounts by username across a vast number of sites",
                url: "https://github.com/sherlock-project/sherlock",
                pricing: "free",
                opsecRisk: "low",
                tags: ["username", "cli", "python"],
                averageRating: 4.8,
                totalUses: 2100
            },
            // Email Investigation
            {
                id: '3',
                name: "Have I Been Pwned",
                category: "email-investigation",
                description: "Check if email addresses have been compromised in data breaches",
                url: "https://haveibeenpwned.com",
                pricing: "free",
                opsecRisk: "low",
                tags: ["email", "breach", "security"],
                averageRating: 4.9,
                totalUses: 3200
            },
            {
                id: '4',
                name: "Hunter.io",
                category: "email-investigation",
                description: "Find and verify email addresses associated with domains",
                url: "https://hunter.io",
                pricing: "freemium",
                opsecRisk: "medium",
                tags: ["email", "finder", "verification"],
                averageRating: 4.3,
                totalUses: 1890
            },
            {
                id: '5',
                name: "Holehe",
                category: "email-investigation",
                description: "Check if an email is used to register on sites like Twitter, Instagram using password reset functions",
                url: "https://github.com/megadose/holehe",
                pricing: "free",
                opsecRisk: "medium",
                tags: ["email", "cli", "python"],
                averageRating: 4.2,
                totalUses: 780
            },
            // Domain & IP Investigation
            {
                id: '6',
                name: "Shodan",
                category: "domain-ip",
                description: "Search engine for internet-connected devices, servers, webcams, and industrial control systems",
                url: "https://shodan.io",
                pricing: "freemium",
                opsecRisk: "medium",
                tags: ["iot", "network", "scanning"],
                averageRating: 4.8,
                totalUses: 2890
            },
            {
                id: '7',
                name: "urlscan.io",
                category: "domain-ip",
                description: "Browses submitted URLs and records all activity, domains contacted, resources requested, and technologies used",
                url: "https://urlscan.io/",
                pricing: "freemium",
                opsecRisk: "low",
                tags: ["url", "analysis", "api"],
                averageRating: 4.7,
                totalUses: 1560
            },
            {
                id: '8',
                name: "Censys",
                category: "domain-ip",
                description: "Continuously scans the internet to discover devices, networks, and certificates",
                url: "https://search.censys.io/",
                pricing: "freemium",
                opsecRisk: "medium",
                tags: ["scanning", "certificates", "api"],
                averageRating: 4.5,
                totalUses: 1200
            },
            {
                id: '9',
                name: "BGPView",
                category: "network-analysis",
                description: "Explores internet structure via ASNs, IP prefixes, and BGP peering data",
                url: "https://bgpview.io/",
                pricing: "free",
                opsecRisk: "low",
                tags: ["bgp", "asn", "network"],
                averageRating: 4.4,
                totalUses: 890
            },
            // Subdomain & DNS Tools
            {
                id: '10',
                name: "theHarvester",
                category: "domain-ip",
                description: "Gathers emails, subdomains, hosts, employee names from public sources like search engines",
                url: "https://github.com/laramies/theHarvester",
                pricing: "free",
                opsecRisk: "medium",
                tags: ["subdomains", "cli", "python"],
                averageRating: 4.6,
                totalUses: 1340
            },
            // More tools would follow the same pattern...
            {
                id: '11',
                name: "OWASP Amass",
                category: "domain-ip",
                description: "Comprehensive network mapping using passive and active reconnaissance techniques",
                url: "https://github.com/owasp-amass/amass",
                pricing: "free",
                opsecRisk: "medium",
                tags: ["reconnaissance", "cli", "go"],
                averageRating: 4.7,
                totalUses: 980
            },
            {
                id: '12',
                name: "Maltego",
                category: "visualization",
                description: "Interactive data mining tool for link analysis, information gathering and forensic investigation",
                url: "https://maltego.com/",
                pricing: "freemium",
                opsecRisk: "low",
                tags: ["visualization", "link-analysis", "gui"],
                averageRating: 4.7,
                totalUses: 2340
            },
            {
                id: '13',
                name: "SpiderFoot",
                category: "frameworks",
                description: "Open-source automation tool integrating with 200+ data sources for target mapping",
                url: "https://github.com/smicallef/spiderfoot",
                pricing: "free",
                opsecRisk: "medium",
                tags: ["automation", "framework", "python"],
                averageRating: 4.6,
                totalUses: 1100
            }
        ];
    }

    getFallbackCategories() {
        return [
            { category: "domain-ip", toolCount: 5, averageRating: 4.6, icon: "fas fa-globe" },
            { category: "email-investigation", toolCount: 3, averageRating: 4.5, icon: "fas fa-envelope" },
            { category: "username-search", toolCount: 2, averageRating: 4.7, icon: "fas fa-user-search" },
            { category: "frameworks", toolCount: 1, averageRating: 4.6, icon: "fas fa-tools" },
            { category: "visualization", toolCount: 1, averageRating: 4.7, icon: "fas fa-project-diagram" },
            { category: "network-analysis", toolCount: 1, averageRating: 4.4, icon: "fas fa-network-wired" }
        ];
    }

    getCategoryIcon(category) {
        const icons = {
            'domain-ip': 'fas fa-globe',
            'email-investigation': 'fas fa-envelope',
            'username-search': 'fas fa-user-search',
            'frameworks': 'fas fa-tools',
            'visualization': 'fas fa-project-diagram',
            'network-analysis': 'fas fa-network-wired',
            'geolocation': 'fas fa-map-marker-alt',
            'metadata': 'fas fa-file-code',
            'social-media': 'fas fa-share-alt'
        };
        return icons[category] || 'fas fa-tools';
    }

    updateToolCount() {
        const totalCount = this.tools.length;
        document.getElementById('totalToolsCount').textContent = totalCount + '+';
        const toolsCountEl = document.getElementById('toolsCount');
        if (toolsCountEl) {
            toolsCountEl.textContent = `${this.filteredTools.length} of ${totalCount} tools`;
        }
    }

    populateToolFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;

        const categories = [...new Set(this.tools.map(tool => tool.category))];
        categoryFilter.innerHTML = '<option value="">All Categories</option>' +
            categories.map(cat => `<option value="${cat}">${this.formatCategory(cat)}</option>`).join('');
    }

    formatCategory(category) {
        return category.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' & ');
    }

    renderCategories() {
        const grid = document.getElementById('categoriesGrid');
        if (!grid) return;

        if (this.categories.length === 0) {
            this.categories = this.getFallbackCategories();
        }

        grid.innerHTML = this.categories.map(category => `
            <div class="category-card" data-category="${category.category}">
                <div class="category-icon">
                    <i class="${this.getCategoryIcon(category.category)}"></i>
                </div>
                <div class="category-name">${this.formatCategory(category.category)}</div>
                <div class="category-description">
                    Professional tools for ${this.formatCategory(category.category).toLowerCase()} investigations
                </div>
                <div class="category-meta">
                    <span>${category.toolCount || 0} tools</span>
<span>${(category.averageRating || 4.0).toFixed(1)}</span>
                </div>
            </div>
        `).join('');
    }

    renderTools() {
        const grid = document.getElementById('toolsGrid');
        if (!grid) return;

        this.updateToolCount();

        if (this.filteredTools.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-search" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">No tools found</h3>
                    <p style="color: var(--text-secondary);">Try adjusting your filters or search terms</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.filteredTools.map(tool => this.createToolCard(tool)).join('');
    }

    createToolCard(tool) {
        const pricingClass = {
            free: 'badge-free',
            freemium: 'badge-freemium',
            paid: 'badge-paid',
            subscription: 'badge-paid'
        };

        const riskClass = {
            low: 'badge-low',
            medium: 'badge-medium',
            high: 'badge-high'
        };

        return `
            <div class="tool-card">
                <div class="tool-header">
                    <div>
                        <div class="tool-name">${tool.name}</div>
                        <div class="tool-category">${this.formatCategory(tool.category)}</div>
                    </div>
                    <div class="tool-badges">
                        <span class="badge ${pricingClass[tool.pricing] || 'badge-free'}">${tool.pricing || 'free'}</span>
                        ${tool.opsecRisk ? `<span class="badge ${riskClass[tool.opsecRisk]}">Risk: ${tool.opsecRisk}</span>` : ''}
                    </div>
                </div>
                
                <div class="tool-description">
                    ${tool.description || 'No description available'}
                </div>
                
                <div class="tool-meta">
                    <div class="tool-rating">
                        <i class="fas fa-star" style="color: #fbbf24;"></i>
                        <span>${(tool.averageRating || 0).toFixed(1)}</span>
                    </div>
                    <div>${tool.totalUses || 0} uses</div>
                </div>
                
                <div class="tool-actions">
                    <button class="btn btn-primary open-tool-btn" data-url="${tool.url}">
                        <i class="fas fa-external-link-alt"></i>
                        Open Tool
                    </button>
                </div>
            </div>
        `;
    }

    filterTools() {
        const categoryFilter = document.getElementById('categoryFilter')?.value;
        const riskFilter = document.getElementById('riskFilter')?.value;
        const searchTerm = document.getElementById('toolSearchInput')?.value.toLowerCase();

        this.filteredTools = this.tools.filter(tool => {
            const matchesCategory = !categoryFilter || tool.category === categoryFilter;
            const matchesRisk = !riskFilter || tool.opsecRisk === riskFilter;
            const matchesSearch = !searchTerm || 
                tool.name.toLowerCase().includes(searchTerm) ||
                tool.description.toLowerCase().includes(searchTerm) ||
                (tool.tags && tool.tags.some(tag => tag.toLowerCase().includes(searchTerm)));

            return matchesCategory && matchesRisk && matchesSearch;
        });

        this.renderTools();
    }

    filterByCategory(category) {
        this.showSection('tools');
        setTimeout(() => {
            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter) {
                categoryFilter.value = category;
                this.filterTools();
            }
        }, 100);
    }

    performHeroSearch() {
        const searchType = document.getElementById('heroSearchType').value;
        const searchTerm = document.getElementById('heroSearchInput').value.trim();

        if (!searchTerm) {
            this.showNotification('Please enter a search term', 'warning');
            return;
        }

        if (searchType === 'general') {
            this.showSection('tools');
            setTimeout(() => {
                document.getElementById('toolSearchInput').value = searchTerm;
                this.filterTools();
            }, 100);
        } else {
            this.showSection('search');
            setTimeout(() => {
                document.getElementById('searchType').value = searchType;
                document.getElementById('searchInput').value = searchTerm;
                this.performSearch();
            }, 100);
        }
    }

    async performSearch() {
        const searchType = document.getElementById('searchType').value;
        const searchInput = document.getElementById('searchInput').value.trim();

        if (!searchInput) {
            this.showNotification('Please enter a search target', 'warning');
            return;
        }

        // Show results container and loading
        const resultsContainer = document.getElementById('searchResults');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const resultContainer = document.getElementById('resultContainer');

        resultsContainer.classList.remove('hidden');
        loadingSpinner.classList.remove('hidden');
        resultContainer.innerHTML = '';

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            let results;
            switch (searchType) {
                case 'domain':
                    results = this.createDomainResults(searchInput);
                    break;
                case 'ip':
                    results = this.createIPResults(searchInput);
                    break;
                case 'email':
                    results = this.createEmailResults(searchInput);
                    break;
                default:
                    results = this.createGeneralResults(searchInput);
            }

            this.displaySearchResults(results);

        } catch (error) {
            console.error('Search error:', error);
            resultContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: var(--danger-color); margin-bottom: 1rem;"></i>
                    <h4>Search Failed</h4>
                    <p style="color: var(--text-secondary);">An error occurred while performing the search.</p>
                </div>
            `;
        } finally {
            loadingSpinner.classList.add('hidden');
        }
    }

    createDomainResults(domain) {
        return {
            target: domain,
            type: 'domain',
            suggestions: [
                "Perform WHOIS lookup to find registration information",
                "Check DNS records using DNS analysis tools",
                "Scan for subdomains using enumeration tools",
                "Analyze SSL/TLS certificate information",
                "Search for exposed directories and files",
                "Check domain reputation and threat intelligence"
            ],
            recommendedTools: [
                { name: "Shodan", description: "Find services and open ports" },
                { name: "urlscan.io", description: "URL analysis and screening" },
                { name: "Censys", description: "Internet-wide scan data" },
                { name: "BGPView", description: "BGP and ASN information" }
            ]
        };
    }

    createIPResults(ip) {
        return {
            target: ip,
            type: 'ip',
            suggestions: [
                "Perform IP geolocation lookup",
                "Check for open ports and services",
                "Analyze IP reputation and blacklist status",
                "Search for SSL certificates on this IP",
                "Look up ASN and network information",
                "Check for related domains and subdomains"
            ],
            recommendedTools: [
                { name: "Shodan", description: "Internet-connected device search" },
                { name: "Censys", description: "Internet-wide scan data" },
                { name: "BGPView", description: "IP and ASN information" },
                { name: "urlscan.io", description: "URL and IP analysis" }
            ]
        };
    }

    createEmailResults(email) {
        return {
            target: email,
            type: 'email',
            suggestions: [
                "Check if email appears in data breaches",
                "Verify email address validity",
                "Find associated social media profiles",
                "Search for email in leaked databases",
                "Analyze email header information",
                "Look for related accounts and services"
            ],
            recommendedTools: [
                { name: "Have I Been Pwned", description: "Data breach checker" },
                { name: "Hunter.io", description: "Email finder and verifier" },
                { name: "Holehe", description: "Email account detection" },
                { name: "WhatsMyName", description: "Username enumeration" }
            ]
        };
    }

    createGeneralResults(query) {
        return {
            target: query,
            type: 'general',
            suggestions: [
                "Start with Google dorking and advanced operators",
                "Check social media platforms for mentions",
                "Search specialized databases and archives",
                "Use people search engines",
                "Check news articles and press releases",
                "Look for academic papers and publications"
            ],
            searchStrategies: [
                `"${query}" site:linkedin.com`,
                `"${query}" filetype:pdf`,
                `"${query}" site:github.com`,
                `"${query}" -site:google.com -site:bing.com`
            ]
        };
    }

    displaySearchResults(results) {
        const container = document.getElementById('resultContainer');
        
        let html = `
            <div style="margin-bottom: 2rem;">
                <h4>Investigation Results for: <span style="color: var(--accent-color);">${results.target}</span></h4>
                <p style="color: var(--text-secondary);">Type: ${results.type.toUpperCase()} Analysis</p>
            </div>
        `;

        if (results.suggestions) {
            html += `
                <div style="margin-bottom: 2rem;">
                    <h5 style="color: var(--text-primary); margin-bottom: 1rem;">
                        <i class="fas fa-lightbulb" style="color: var(--warning-color);"></i>
                        Investigation Suggestions
                    </h5>
                    <ul style="color: var(--text-secondary); line-height: 1.8;">
                        ${results.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (results.recommendedTools) {
            html += `
                <div style="margin-bottom: 2rem;">
                    <h5 style="color: var(--text-primary); margin-bottom: 1rem;">
                        <i class="fas fa-tools" style="color: var(--accent-color);"></i>
                        Recommended Tools
                    </h5>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                        ${results.recommendedTools.map(tool => `
                            <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 0.5rem; padding: 1rem;">
                                <h6 style="color: var(--text-primary); margin-bottom: 0.5rem;">${tool.name}</h6>
                                <p style="color: var(--text-secondary); font-size: 0.875rem; margin: 0;">${tool.description}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        if (results.searchStrategies) {
            html += `
                <div style="margin-bottom: 2rem;">
                    <h5 style="color: var(--text-primary); margin-bottom: 1rem;">
                        <i class="fas fa-search" style="color: var(--info-color);"></i>
                        Search Strategies
                    </h5>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                        ${results.searchStrategies.map(strategy => `
                            <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 0.5rem; padding: 1rem;">
                                <code style="color: var(--accent-color); font-family: var(--font-mono);">${strategy}</code>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        html += `
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 0.5rem; padding: 1rem; color: var(--text-secondary);">
                <i class="fas fa-info-circle" style="color: var(--info-color);"></i>
                <strong>Note:</strong> This is a demonstration of OSINT methodology. Use the Tools Directory to access real OSINT resources.
            </div>
        `;

        container.innerHTML = html;
    }

    openTool(url) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 1000;
            background: var(--bg-primary); border: 1px solid var(--border-color);
            border-radius: 0.5rem; padding: 1rem; box-shadow: var(--shadow-lg);
            color: var(--text-primary); max-width: 300px;
        `;
        
        const iconClass = {
            info: 'fas fa-info-circle',
            warning: 'fas fa-exclamation-triangle',
            error: 'fas fa-times-circle',
            success: 'fas fa-check-circle'
        };

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="${iconClass[type] || iconClass.info}" style="color: var(--accent-color);"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 4000);
    }

    // Dashboard functionality
    initializeDashboard() {
        console.log('Initializing OSINT Dashboard...');
        this.dashboardData = {
            globalCyberAttacks: 2847,
            newMalwareSamples: 432,
            dataBreachRecords: 1200000,
            darkWebMentions: 3156,
            charts: {}
        };

        this.setupDashboardControls();
        this.initializeCharts();
        this.startLiveDataSimulation();
    }

    setupDashboardControls() {
        document.getElementById('updateFrequency')?.addEventListener('change', (e) => {
            this.updateDashboardFrequency(parseInt(e.target.value) * 1000);
        });
    }

    initializeCharts() {
        this.createThreatChart();
        this.createSentimentChart();
        this.createNetworkChart();
        this.createSourceChart();
        this.initializeInteractiveMap();
        this.initializeAlertsFeed();
        this.initializeEventLog();
    }

    createThreatChart() {
        const ctx = document.getElementById('threatChart');
        if (!ctx) return;

        this.dashboardData.charts.threat = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'High Severity',
                    data: [],
                    borderColor: '#e53e3e',
                    backgroundColor: 'rgba(229, 62, 62, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Medium Severity',
                    data: [],
                    borderColor: '#ed8936',
                    backgroundColor: 'rgba(237, 137, 54, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Low Severity',
                    data: [],
                    borderColor: '#3182ce',
                    backgroundColor: 'rgba(49, 130, 206, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'var(--text-primary)'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'var(--text-secondary)'
                        },
                        grid: {
                            color: 'var(--border-color)'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'var(--text-secondary)'
                        },
                        grid: {
                            color: 'var(--border-color)'
                        }
                    }
                }
            }
        });
    }

    createSentimentChart() {
        const ctx = document.getElementById('sentimentChart');
        if (!ctx) return;

        this.dashboardData.charts.sentiment = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Positive', 'Neutral', 'Negative'],
                datasets: [{
                    data: [45, 30, 25],
                    backgroundColor: ['#38a169', '#ed8936', '#e53e3e'],
                    borderWidth: 2,
                    borderColor: 'var(--bg-primary)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'var(--text-primary)'
                        }
                    }
                }
            }
        });
    }

    createNetworkChart() {
        const ctx = document.getElementById('networkChart');
        if (!ctx) return;

        this.dashboardData.charts.network = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['HTTP', 'HTTPS', 'FTP', 'SSH', 'DNS', 'SMTP'],
                datasets: [{
                    label: 'Active Connections',
                    data: [120, 340, 25, 45, 89, 23],
                    backgroundColor: [
                        '#3182ce', '#38a169', '#ed8936', 
                        '#e53e3e', '#805ad5', '#38b2ac'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'var(--text-primary)'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'var(--text-secondary)'
                        },
                        grid: {
                            color: 'var(--border-color)'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'var(--text-secondary)'
                        },
                        grid: {
                            color: 'var(--border-color)'
                        }
                    }
                }
            }
        });
    }

    createSourceChart() {
        const ctx = document.getElementById('sourceChart');
        if (!ctx) return;

        this.dashboardData.charts.source = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: ['Social Media', 'News APIs', 'Threat Feeds', 'Public Records', 'Dark Web'],
                datasets: [{
                    data: [23, 19, 15, 31, 12],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.7)',
                        'rgba(16, 185, 129, 0.7)',
                        'rgba(245, 101, 101, 0.7)',
                        'rgba(251, 191, 36, 0.7)',
                        'rgba(139, 92, 246, 0.7)'
                    ],
                    borderColor: [
                        'rgb(59, 130, 246)',
                        'rgb(16, 185, 129)',
                        'rgb(245, 101, 101)',
                        'rgb(251, 191, 36)',
                        'rgb(139, 92, 246)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'var(--text-primary)'
                        }
                    }
                }
            }
        });
    }

    initializeInteractiveMap() {
        const mapContainer = document.getElementById('osintMap');
        if (!mapContainer) {
            console.error('Map container #osintMap not found');
            return;
        }

        // Create a simple animated background map
        mapContainer.innerHTML = `
            <div style="width: 100%; height: 400px; background: linear-gradient(135deg, #1a365d 0%, #2d3748 50%, #1a202c 100%); 
                        border-radius: 8px; position: relative; overflow: hidden;">
                <div style="position: absolute; top: 10px; left: 10px; color: white; font-size: 12px; opacity: 0.8;">
                    <i class="fas fa-globe-americas"></i> Live Global OSINT Activity
                </div>
                <div style="position: absolute; top: 10px; right: 10px; color: white; font-size: 10px; opacity: 0.6;">
                    <span class="live-indicator"></span> SIMULATED
                </div>
                <div id="mapMarkers" style="position: relative; width: 100%; height: 100%;"></div>
                <div style="position: absolute; bottom: 10px; left: 10px; color: white; font-size: 10px; opacity: 0.8;">
                    Active Threats: <span id="activeThreatCount">12</span> | Data Sources: <span id="activeSourceCount">6</span>
                </div>
            </div>
        `;

        this.addMapMarkers();
        this.startMapUpdates();
    }

    addMapMarkers() {
        const markersContainer = document.getElementById('mapMarkers');
        if (!markersContainer) return;

        const locations = [
            {name: 'New York', x: '25%', y: '30%', type: 'threat'},
            {name: 'London', x: '50%', y: '25%', type: 'source'},
            {name: 'Tokyo', x: '85%', y: '35%', type: 'threat'},
            {name: 'Sydney', x: '90%', y: '70%', type: 'source'},
            {name: 'Berlin', x: '52%', y: '28%', type: 'neutral'},
            {name: 'Moscow', x: '60%', y: '22%', type: 'threat'}
        ];

        locations.forEach((location, index) => {
            const marker = document.createElement('div');
            marker.style.cssText = `
                position: absolute; left: ${location.x}; top: ${location.y};
                width: 10px; height: 10px; border-radius: 50%;
                background: ${location.type === 'threat' ? '#e53e3e' : location.type === 'source' ? '#38a169' : '#3182ce'};
                box-shadow: 0 0 15px ${location.type === 'threat' ? 'rgba(229,62,62,0.8)' : location.type === 'source' ? 'rgba(56,161,105,0.8)' : 'rgba(49,130,206,0.8)'};
                cursor: pointer; transform: translate(-50%, -50%);
                transition: all 0.5s ease; z-index: 5;
            `;
            
            marker.title = `${location.name} - ${location.type}`;
            
            marker.addEventListener('mouseover', () => {
                marker.style.transform = 'translate(-50%, -50%) scale(2)';
            });
            
            marker.addEventListener('mouseout', () => {
                marker.style.transform = 'translate(-50%, -50%) scale(1)';
            });
            
            markersContainer.appendChild(marker);
        });
    }

    startMapUpdates() {
        setInterval(() => {
            const markers = document.querySelectorAll('#mapMarkers > div');
            markers.forEach(marker => {
                if (Math.random() < 0.3) {
                    marker.style.animation = 'pulse 2s ease-in-out';
                    setTimeout(() => {
                        marker.style.animation = '';
                    }, 2000);
                }
            });
        }, 3000);
    }

    initializeAlertsFeed() {
        const alertsFeed = document.getElementById('alertsFeed');
        if (!alertsFeed) return;

        this.addAlert('High', 'New threat detected in network traffic');
        this.addAlert('Medium', 'Suspicious domain registration detected');
        this.addAlert('Low', 'Normal activity threshold exceeded');
    }

    addAlert(severity, message) {
        const alertsFeed = document.getElementById('alertsFeed');
        if (!alertsFeed) return;

        const timestamp = new Date().toLocaleTimeString();
        const alertHtml = `
            <div class="alert-item alert-severity-${severity.toLowerCase()}">
                <span class="alert-timestamp">${timestamp}</span>
                <strong>${severity}:</strong> ${message}
            </div>
        `;

        alertsFeed.insertAdjacentHTML('afterbegin', alertHtml);

        const alerts = alertsFeed.children;
        if (alerts.length > 10) {
            alertsFeed.removeChild(alerts[alerts.length - 1]);
        }
    }

    initializeEventLog() {
        const eventLog = document.getElementById('eventLog');
        if (!eventLog) return;

        this.addLogEvent('System initialized', 'INFO');
        this.addLogEvent('Dashboard started', 'INFO');
        this.addLogEvent('Data sources connected', 'SUCCESS');
    }

    addLogEvent(message, type = 'INFO') {
        const eventLog = document.getElementById('eventLog');
        if (!eventLog) return;

        const timestamp = new Date().toLocaleTimeString();
        const logHtml = `
            <div class="event-log-entry">
                <span class="event-timestamp">${timestamp}</span>
                [${type}] ${message}
            </div>
        `;

        eventLog.insertAdjacentHTML('afterbegin', logHtml);

        const events = eventLog.children;
        if (events.length > 50) {
            eventLog.removeChild(events[events.length - 1]);
        }

        eventLog.scrollTop = 0;
    }

    startLiveDataSimulation() {
        this.updateLiveStats();
        
        this.dashboardInterval = setInterval(() => {
            this.updateLiveStats();
            this.updateCharts();
            this.simulateNewEvents();
        }, 5000);
    }

    updateLiveStats() {
        this.dashboardData.globalCyberAttacks += Math.floor(Math.random() * 20) - 10;
        this.dashboardData.newMalwareSamples += Math.floor(Math.random() * 8) - 4;
        this.dashboardData.dataBreachRecords += Math.floor(Math.random() * 50000) - 25000;
        this.dashboardData.darkWebMentions += Math.floor(Math.random() * 50) - 25;

        this.dashboardData.globalCyberAttacks = Math.max(2000, Math.min(4000, this.dashboardData.globalCyberAttacks));
        this.dashboardData.newMalwareSamples = Math.max(300, Math.min(600, this.dashboardData.newMalwareSamples));
        this.dashboardData.dataBreachRecords = Math.max(800000, Math.min(2000000, this.dashboardData.dataBreachRecords));
        this.dashboardData.darkWebMentions = Math.max(2500, Math.min(4000, this.dashboardData.darkWebMentions));

        const globalAttacksEl = document.getElementById('globalCyberAttacks');
        const malwareSamplesEl = document.getElementById('newMalwareSamples');
        const breachRecordsEl = document.getElementById('dataBreachRecords');
        const darkWebEl = document.getElementById('darkWebMentions');

        if (globalAttacksEl) globalAttacksEl.textContent = this.dashboardData.globalCyberAttacks.toLocaleString();
        if (malwareSamplesEl) malwareSamplesEl.textContent = this.dashboardData.newMalwareSamples.toLocaleString();
        if (breachRecordsEl) breachRecordsEl.textContent = (this.dashboardData.dataBreachRecords / 1000000).toFixed(1) + 'M';
        if (darkWebEl) darkWebEl.textContent = this.dashboardData.darkWebMentions.toLocaleString();

        this.updateChangeIndicators();
    }

    updateChangeIndicators() {
        const changes = [
            { id: 'attacksChange', value: Math.floor(Math.random() * 150) - 75 },
            { id: 'malwareChange', value: Math.floor(Math.random() * 30) - 15 },
            { id: 'breachChange', value: Math.floor(Math.random() * 100000) - 50000 },
            { id: 'darkwebChange', value: Math.floor(Math.random() * 100) - 50 }
        ];

        changes.forEach(change => {
            const element = document.getElementById(change.id);
            if (element) {
                let displayValue;
                if (change.id === 'breachChange') {
                    displayValue = change.value > 0 ? `+${Math.abs(change.value/1000).toFixed(0)}K` : `-${Math.abs(change.value/1000).toFixed(0)}K`;
                } else {
                    displayValue = change.value > 0 ? `+${change.value}` : change.value;
                }
                element.textContent = displayValue;
                element.className = `stat-change ${change.value >= 0 ? 'positive' : 'negative'}`;
            }
        });
    }

    updateCharts() {
        const now = new Date().toLocaleTimeString();

        if (this.dashboardData.charts.threat) {
            const chart = this.dashboardData.charts.threat;
            chart.data.labels.push(now);
            chart.data.datasets[0].data.push(Math.floor(Math.random() * 5) + 1);
            chart.data.datasets[1].data.push(Math.floor(Math.random() * 10) + 2);
            chart.data.datasets[2].data.push(Math.floor(Math.random() * 15) + 5);

            if (chart.data.labels.length > 10) {
                chart.data.labels.shift();
                chart.data.datasets.forEach(dataset => dataset.data.shift());
            }
            chart.update('none');
        }

        if (this.dashboardData.charts.sentiment) {
            const chart = this.dashboardData.charts.sentiment;
            chart.data.datasets[0].data = [
                Math.floor(Math.random() * 30) + 30,
                Math.floor(Math.random() * 20) + 25,
                Math.floor(Math.random() * 25) + 15
            ];
            chart.update('none');
        }

        if (this.dashboardData.charts.network) {
            const chart = this.dashboardData.charts.network;
            chart.data.datasets[0].data = chart.data.datasets[0].data.map(() => 
                Math.floor(Math.random() * 200) + 50
            );
            chart.update('none');
        }
    }

    simulateNewEvents() {
        if (Math.random() < 0.3) {
            const severities = ['High', 'Medium', 'Low'];
            const messages = [
                'Malicious domain detected in traffic analysis',
                'Unusual social media activity pattern identified',
                'New threat intelligence feed update available',
                'Anomalous network behavior detected',
                'Data breach notification received',
                'Suspicious email campaign identified'
            ];
            
            const severity = severities[Math.floor(Math.random() * severities.length)];
            const message = messages[Math.floor(Math.random() * messages.length)];
            
            this.addAlert(severity, message);
            this.addLogEvent(`Alert generated: ${severity} - ${message}`, 'ALERT');
        }

        if (Math.random() < 0.5) {
            const logMessages = [
                'Data source synchronization completed',
                'Cache updated with new intelligence data',
                'Automated scan initiated for new targets',
                'Social media monitoring refreshed',
                'Threat feed updated with latest IOCs'
            ];
            
            const message = logMessages[Math.floor(Math.random() * logMessages.length)];
            this.addLogEvent(message, 'INFO');
        }
    }

    updateDashboardFrequency(milliseconds) {
        if (this.dashboardInterval) {
            clearInterval(this.dashboardInterval);
        }
        
        this.dashboardInterval = setInterval(() => {
            this.updateLiveStats();
            this.updateCharts();
            this.simulateNewEvents();
        }, milliseconds);

        this.addLogEvent(`Dashboard update frequency changed to ${milliseconds/1000} seconds`, 'CONFIG');
    }
}

// Global functions for dashboard buttons
window.clearEventLog = function() {
    const eventLog = document.getElementById('eventLog');
    if (eventLog) {
        eventLog.innerHTML = '';
        window.osintHub.addLogEvent('Event log cleared by user', 'ACTION');
    }
};

window.exportEventLog = function() {
    const eventLog = document.getElementById('eventLog');
    if (eventLog) {
        const events = Array.from(eventLog.children).map(entry => entry.textContent).join('\n');
        const blob = new Blob([events], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `osint-event-log-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        window.osintHub.addLogEvent('Event log exported by user', 'ACTION');
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.osintHub = new OSINTHub();
});
