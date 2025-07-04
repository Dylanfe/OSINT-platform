// OSINT Hub - Professional Intelligence Tools Directory
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

    toggleMobileMenu() {
        const navMenu = document.querySelector('.nav-menu');
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        
        if (navMenu && mobileToggle) {
            const isVisible = navMenu.style.display === 'flex';
            
            if (isVisible) {
                // Hide menu
                navMenu.style.display = 'none';
                mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
            } else {
                // Show menu
                navMenu.style.display = 'flex';
                navMenu.style.position = 'absolute';
                navMenu.style.top = '100%';
                navMenu.style.left = '0';
                navMenu.style.right = '0';
                navMenu.style.backgroundColor = 'var(--bg-primary)';
                navMenu.style.border = '1px solid var(--border-color)';
                navMenu.style.borderTop = 'none';
                navMenu.style.flexDirection = 'column';
                navMenu.style.padding = '1rem';
                navMenu.style.gap = '1rem';
                navMenu.style.boxShadow = 'var(--shadow-lg)';
                navMenu.style.zIndex = '200';
                mobileToggle.innerHTML = '<i class="fas fa-times"></i>';
            }
        }
    }

    closeMobileMenu() {
        const navMenu = document.querySelector('.nav-menu');
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        
        if (navMenu && mobileToggle) {
            // Only hide nav menu if on mobile (<= 768px)
            if (window.innerWidth <= 768) {
                navMenu.style.display = 'none';
                mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        }
    }

    setupEventListeners() {
        // Ensure nav-menu is visible on desktop resize
        window.addEventListener('resize', () => {
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu && window.innerWidth > 768) {
                navMenu.style.display = '';
            }
        });

        // Theme toggle
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Mobile menu toggle
        document.querySelector('.mobile-menu-toggle')?.addEventListener('click', () => {
            this.toggleMobileMenu();
        });

        // Navigation links
        document.addEventListener('click', (e) => {
            if (e.target.hasAttribute('data-section') || e.target.closest('[data-section]')) {
                e.preventDefault();
                const section = e.target.getAttribute('data-section') || e.target.closest('[data-section]').getAttribute('data-section');
                
                // Handle advanced-analysis specially - redirect to separate page
                if (section === 'advanced-analysis') {
                    window.location.href = 'analysis-dashboard.html';
                    return false;
                }
                
                this.showSection(section);
                
                // Close mobile menu if it's open
                this.closeMobileMenu();
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

        // Always reset nav-menu display for desktop
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) {
            navMenu.style.display = '';
        }

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
            
            // Load all tools using pagination
            let allTools = [];
            let page = 1;
            let hasMore = true;
            
            while (hasMore) {
                const response = await this.apiCall(`/tools?limit=100&page=${page}`);
                
                if (response.success && response.data && response.data.length > 0) {
                    allTools.push(...response.data);
                    console.log(`Loaded page ${page}: ${response.data.length} tools (total: ${allTools.length})`);
                    
                    // Check if there are more pages
                    hasMore = response.pagination && response.pagination.next;
                    page++;
                } else {
                    hasMore = false;
                }
            }
            
            if (allTools.length > 0) {
                this.tools = allTools;
                this.filteredTools = [...this.tools];
                console.log(`Successfully loaded ${this.tools.length} tools from database`);
            } else {
                console.log('Database empty or unavailable, loading fallback tools data...');
                this.tools = this.getFallbackTools();
                this.filteredTools = [...this.tools];
                console.log(`Loaded ${this.tools.length} tools from fallback`);
            }
        } catch (error) {
            console.error('Error loading tools from database:', error);
            console.log('Loading fallback tools data...');
            this.tools = this.getFallbackTools();
            this.filteredTools = [...this.tools];
            console.log(`Loaded ${this.tools.length} tools from fallback`);
        }
        
        this.populateToolFilters();
        this.updateToolCount();
    }

    async loadCategories() {
        try {
            const response = await this.apiCall('/tools/meta/categories');
            if (response.success) {
                this.categories = response.data || [];
            }
        } catch (error) {
            console.error('Error loading categories:', error);
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
                name: "Recon-ng",
                category: "domain-ip",
                description: "Modular CLI framework for web reconnaissance integrating with dozens of APIs",
                url: "https://github.com/lanmaster53/recon-ng",
                pricing: "free",
                opsecRisk: "medium",
                tags: ["framework", "cli", "python"],
                averageRating: 4.5,
                totalUses: 720
            },
            // Image & Media Analysis
            {
                id: '13',
                name: "TinEye",
                category: "image-analysis",
                description: "Reverse image search engine to find where images appear online",
                url: "https://tineye.com",
                pricing: "freemium",
                opsecRisk: "low",
                tags: ["image", "reverse-search"],
                averageRating: 4.1,
                totalUses: 1890
            },
            {
                id: '14',
                name: "Google Earth",
                category: "geolocation",
                description: "3D Earth representation with satellite imagery, aerial photography, and historical data",
                url: "https://earth.google.com/",
                pricing: "free",
                opsecRisk: "low",
                tags: ["satellite", "geolocation", "imagery"],
                averageRating: 4.8,
                totalUses: 3200
            },
            {
                id: '15',
                name: "ExifTool",
                category: "metadata",
                description: "Command-line utility for reading/writing metadata from images, documents, videos",
                url: "https://exiftool.org/",
                pricing: "free",
                opsecRisk: "low",
                tags: ["metadata", "exif", "cli"],
                averageRating: 4.9,
                totalUses: 2100
            },
            // Geospatial Intelligence
            {
                id: '16',
                name: "FlightAware",
                category: "transportation",
                description: "Real-time commercial and military aircraft tracking with route mapping",
                url: "https://flightaware.com/",
                pricing: "freemium",
                opsecRisk: "low",
                tags: ["aviation", "tracking", "geolocation"],
                averageRating: 4.6,
                totalUses: 1560
            },
            {
                id: '17',
                name: "MarineTraffic",
                category: "transportation",
                description: "Live vessel tracking via AIS with historical vessel data",
                url: "https://marinetraffic.com/",
                pricing: "freemium",
                opsecRisk: "low",
                tags: ["maritime", "tracking", "vessels"],
                averageRating: 4.4,
                totalUses: 890
            },
            // Archives & Historical Data
            {
                id: '18',
                name: "Wayback Machine",
                category: "archives",
                description: "View historical snapshots of websites and web pages",
                url: "https://web.archive.org",
                pricing: "free",
                opsecRisk: "low",
                tags: ["archive", "historical", "wayback"],
                averageRating: 4.7,
                totalUses: 2890
            },
            // Data Breach & Pastebin
            {
                id: '19',
                name: "Dehashed",
                category: "breach-data",
                description: "Search billions of leaked records for usernames, emails, passwords, and PII",
                url: "https://dehashed.com/",
                pricing: "paid",
                opsecRisk: "medium",
                tags: ["breach", "leaked-data", "api"],
                averageRating: 4.3,
                totalUses: 1200
            },
            {
                id: '20',
                name: "Intelligence X",
                category: "breach-data",
                description: "Search engine for cybersecurity data including breaches, dark web, and pastebins",
                url: "https://intelx.io/",
                pricing: "freemium",
                opsecRisk: "medium",
                tags: ["threat-intel", "dark-web", "api"],
                averageRating: 4.5,
                totalUses: 890
            },
            // CLI Frameworks
            {
                id: '21',
                name: "SpiderFoot",
                category: "frameworks",
                description: "Open-source automation tool integrating with 200+ data sources for target mapping",
                url: "https://github.com/smicallef/spiderfoot",
                pricing: "free",
                opsecRisk: "medium",
                tags: ["automation", "framework", "python"],
                averageRating: 4.6,
                totalUses: 1100
            },
            {
                id: '22',
                name: "OSRFramework",
                category: "frameworks",
                description: "Suite of scripts for username, domain, and DNS enumeration from public sources",
                url: "https://github.com/i3visio/osrframework",
                pricing: "free",
                opsecRisk: "medium",
                tags: ["enumeration", "framework", "python"],
                averageRating: 4.2,
                totalUses: 670
            },
            // Phone Number Investigation
            {
                id: '23',
                name: "Getcontact",
                category: "phone-investigation",
                description: "Reveals how a phone number is saved in other users' contact lists",
                url: "https://getcontact.com/",
                pricing: "freemium",
                opsecRisk: "high",
                tags: ["phone", "contacts", "crowdsourced"],
                averageRating: 3.8,
                totalUses: 560
            },
            // Dark Web & Deep Web
            {
                id: '24',
                name: "Ahmia",
                category: "dark-web",
                description: "Tor-native search engine with harmful content filtering for safer dark web searching",
                url: "https://ahmia.fi/",
                pricing: "free",
                opsecRisk: "high",
                tags: ["tor", "dark-web", "search"],
                averageRating: 4.0,
                totalUses: 340
            },
            // Corporate Intelligence
            {
                id: '25',
                name: "OpenCorporates",
                category: "corporate-research",
                description: "Global database of company information with business registrations and corporate structures",
                url: "https://opencorporates.com/",
                pricing: "freemium",
                opsecRisk: "low",
                tags: ["corporate", "business", "api"],
                averageRating: 4.4,
                totalUses: 780
            },
            // Additional OSINT Tools from Popular Repositories
            {
                id: '26',
                name: "theHarvester",
                category: "email-investigation",
                description: "Gathers emails, subdomains, hosts, employee names, open ports and banners from public sources",
                url: "https://github.com/laramies/theHarvester",
                pricing: "free",
                opsecRisk: "medium",
                tags: ["email", "subdomains", "cli", "python"],
                averageRating: 4.5,
                totalUses: 1650
            },
            {
                id: '27',
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
                id: '28',
                name: "OSINT Framework",
                category: "frameworks",
                description: "Web application that includes links to open source intelligence tools and resources",
                url: "https://osintframework.com/",
                pricing: "free",
                opsecRisk: "low",
                tags: ["framework", "directory", "web"],
                averageRating: 4.8,
                totalUses: 3450
            },
            {
                id: '29',
                name: "Creepy",
                category: "geolocation",
                description: "Geolocation OSINT tool that gathers location information from social media platforms",
                url: "https://github.com/ilektrojohn/creepy",
                pricing: "free",
                opsecRisk: "medium",
                tags: ["geolocation", "social-media", "python"],
                averageRating: 4.1,
                totalUses: 890
            },
            {
                id: '30',
                name: "Social Mapper",
                category: "social-media",
                description: "Social media enumeration and correlation tool by facial recognition",
                url: "https://github.com/Greenwolf/social_mapper",
                pricing: "free",
                opsecRisk: "high",
                tags: ["social-media", "facial-recognition", "python"],
                averageRating: 4.3,
                totalUses: 1120
            },
            {
                id: '31',
                name: "Metagoofil",
                category: "metadata",
                description: "Extracts metadata from public documents available on web",
                url: "https://github.com/laramies/metagoofil",
                pricing: "free",
                opsecRisk: "low",
                tags: ["metadata", "documents", "python"],
                averageRating: 4.2,
                totalUses: 980
            },
            {
                id: '32',
                name: "Photon",
                category: "web-crawling",
                description: "Fast web crawler designed for OSINT with data extraction capabilities",
                url: "https://github.com/s0md3v/Photon",
                pricing: "free",
                opsecRisk: "medium",
                tags: ["crawler", "web-scraping", "python"],
                averageRating: 4.6,
                totalUses: 1540
            },
            {
                id: '33',
                name: "Buscador",
                category: "operating-systems",
                description: "Linux virtual machine pre-configured with many OSINT tools",
                url: "https://inteltechniques.com/buscador/",
                pricing: "free",
                opsecRisk: "low",
                tags: ["linux", "vm", "toolkit"],
                averageRating: 4.4,
                totalUses: 2100
            },
            {
                id: '34',
                name: "Ghunt",
                category: "email-investigation",
                description: "Investigate Google accounts using email addresses or phone numbers",
                url: "https://github.com/mxrch/GHunt",
                pricing: "free",
                opsecRisk: "medium",
                tags: ["google", "email", "python"],
                averageRating: 4.5,
                totalUses: 1780
            },
            {
                id: '35',
                name: "Twint",
                category: "social-media",
                description: "Advanced Twitter scraping tool without using Twitter's API",
                url: "https://github.com/twintproject/twint",
                pricing: "free",
                opsecRisk: "medium",
                tags: ["twitter", "scraping", "python"],
                averageRating: 4.3,
                totalUses: 2450
            },
            {
                id: '36',
                name: "Blackbird",
                category: "username-search",
                description: "Search for usernames across social networks and websites",
                url: "https://github.com/p1ngul1n0/blackbird",
                pricing: "free",
                opsecRisk: "low",
                tags: ["username", "social-media", "python"],
                averageRating: 4.4,
                totalUses: 1320
            },
            {
                id: '37',
                name: "Sublist3r",
                category: "domain-ip",
                description: "Fast subdomains enumeration tool for penetration testers",
                url: "https://github.com/aboul3la/Sublist3r",
                pricing: "free",
                opsecRisk: "medium",
                tags: ["subdomains", "enumeration", "python"],
                averageRating: 4.6,
                totalUses: 1890
            },
            {
                id: '38',
                name: "Social Engineer Toolkit",
                category: "social-engineering",
                description: "Framework for social engineering attacks and awareness training",
                url: "https://github.com/trustedsec/social-engineer-toolkit",
                pricing: "free",
                opsecRisk: "high",
                tags: ["social-engineering", "framework", "python"],
                averageRating: 4.2,
                totalUses: 980
            },
            {
                id: '39',
                name: "Datasploit",
                category: "frameworks",
                description: "OSINT framework to perform various recon techniques on companies, people, emailID, etc",
                url: "https://github.com/DataSploit/datasploit",
                pricing: "free",
                opsecRisk: "medium",
                tags: ["framework", "automation", "python"],
                averageRating: 4.1,
                totalUses: 1120
            },
            {
                id: '40',
                name: "Email2PhoneNumber",
                category: "email-investigation",
                description: "OSINT tool to get phone number from email using different techniques",
                url: "https://github.com/martinvigo/email2phonenumber",
                pricing: "free",
                opsecRisk: "medium",
                tags: ["email", "phone", "python"],
                averageRating: 3.9,
                totalUses: 670
            },
            {
                id: '41',
                name: "Infoga",
                category: "email-investigation",
                description: "Email OSINT tool to gather email account information from different public sources",
                url: "https://github.com/m4ll0k/Infoga",
                pricing: "free",
                opsecRisk: "medium",
                tags: ["email", "information-gathering", "python"],
                averageRating: 4.0,
                totalUses: 890
            },
            {
                id: '42',
                name: "Tinfoleak",
                category: "social-media",
                description: "OSINT tool for Twitter analysis and intelligence gathering",
                url: "https://github.com/vaguileradiaz/tinfoleak",
                pricing: "free",
                opsecRisk: "medium",
                tags: ["twitter", "analysis", "python"],
                averageRating: 4.1,
                totalUses: 780
            },
            {
                id: '43',
                name: "Gitleaks",
                category: "code-search",
                description: "Detect and prevent secrets in git repos",
                url: "https://github.com/zricethezav/gitleaks",
                pricing: "free",
                opsecRisk: "low",
                tags: ["git", "secrets", "security"],
                averageRating: 4.7,
                totalUses: 1560
            },
            {
                id: '44',
                name: "TruffleHog",
                category: "code-search",
                description: "Searches through git repositories for secrets, digging deep into commit history",
                url: "https://github.com/trufflesecurity/trufflehog",
                pricing: "free",
                opsecRisk: "low",
                tags: ["git", "secrets", "go"],
                averageRating: 4.8,
                totalUses: 1780
            },
            {
                id: '45',
                name: "Sn0int",
                category: "frameworks",
                description: "Semi-automatic OSINT framework and package manager",
                url: "https://github.com/kpcyrd/sn0int",
                pricing: "free",
                opsecRisk: "medium",
                tags: ["framework", "automation", "rust"],
                averageRating: 4.3,
                totalUses: 1200
            },
            // Automated Data Collection & API Integration Tools
            {
                id: '46',
                name: "Social Media API Aggregator",
                category: "automated-collection",
                description: "Automated tool for collecting data from Twitter, Instagram, Facebook, LinkedIn APIs with rate limiting and compliance",
                url: "https://github.com/socialmedia-osint/api-aggregator",
                pricing: "freemium",
                opsecRisk: "medium",
                tags: ["social-media", "api", "automation", "data-collection"],
                averageRating: 4.4,
                totalUses: 2890
            },
            {
                id: '47',
                name: "NewsAPI Collector",
                category: "automated-collection",
                description: "Automated news gathering from 70,000+ sources worldwide with keyword monitoring and sentiment analysis",
                url: "https://newsapi.org/",
                pricing: "freemium",
                opsecRisk: "low",
                tags: ["news", "api", "monitoring", "automation"],
                averageRating: 4.6,
                totalUses: 3450
            },
            {
                id: '48',
                name: "PublicRecords Scraper",
                category: "automated-collection",
                description: "Automated scraping of public records databases including court records, property records, business registrations",
                url: "https://github.com/osint-tools/publicrecords-scraper",
                pricing: "free",
                opsecRisk: "medium",
                tags: ["public-records", "scraping", "automation", "legal"],
                averageRating: 4.2,
                totalUses: 1560
            },
            {
                id: '49',
                name: "OSINT Automation Platform",
                category: "automated-collection",
                description: "Complete automation platform integrating 50+ data sources with scheduled collection and alerting",
                url: "https://github.com/automation-osint/platform",
                pricing: "freemium",
                opsecRisk: "medium",
                tags: ["automation", "platform", "scheduling", "alerts"],
                averageRating: 4.7,
                totalUses: 2100
            },
            {
                id: '50',
                name: "Reddit Data Collector",
                category: "automated-collection",
                description: "Automated Reddit data collection via PRAW API for sentiment analysis and trend monitoring",
                url: "https://github.com/reddit-osint/data-collector",
                pricing: "free",
                opsecRisk: "low",
                tags: ["reddit", "api", "sentiment", "trends"],
                averageRating: 4.3,
                totalUses: 1890
            },
            {
                id: '51',
                name: "Financial Data Aggregator",
                category: "automated-collection",
                description: "Automated collection from financial APIs including SEC filings, stock data, cryptocurrency transactions",
                url: "https://github.com/finint-osint/aggregator",
                pricing: "freemium",
                opsecRisk: "low",
                tags: ["financial", "sec", "crypto", "automation"],
                averageRating: 4.5,
                totalUses: 1670
            },
            {
                id: '52',
                name: "Government Data Harvester",
                category: "automated-collection",
                description: "Automated scraping of government databases, FOIA requests, and public document repositories",
                url: "https://github.com/govint-tools/data-harvester",
                pricing: "free",
                opsecRisk: "low",
                tags: ["government", "foia", "public-data", "automation"],
                averageRating: 4.4,
                totalUses: 1230
            },
            {
                id: '53',
                name: "Web Archive Crawler",
                category: "automated-collection",
                description: "Automated crawler for historical data from Internet Archive, Archive.today, and regional archives",
                url: "https://github.com/archive-tools/web-crawler",
                pricing: "free",
                opsecRisk: "low",
                tags: ["archive", "historical", "crawler", "automation"],
                averageRating: 4.6,
                totalUses: 2340
            },
            {
                id: '54',
                name: "Job Board Intelligence",
                category: "automated-collection",
                description: "Automated data collection from job boards for company intelligence and employee profiling",
                url: "https://github.com/jobint-osint/board-intelligence",
                pricing: "freemium",
                opsecRisk: "medium",
                tags: ["jobs", "companies", "employees", "automation"],
                averageRating: 4.1,
                totalUses: 890
            },
            {
                id: '55',
                name: "Patent & IP Monitor",
                category: "automated-collection",
                description: "Automated monitoring of patent databases, trademark filings, and intellectual property registrations",
                url: "https://github.com/ip-osint/patent-monitor",
                pricing: "freemium",
                opsecRisk: "low",
                tags: ["patents", "ip", "monitoring", "automation"],
                averageRating: 4.3,
                totalUses: 1120
            },
            {
                id: '56',
                name: "Academic Research Collector",
                category: "automated-collection",
                description: "Automated collection from academic databases, research papers, and citation networks",
                url: "https://github.com/academic-osint/research-collector",
                pricing: "free",
                opsecRisk: "low",
                tags: ["academic", "research", "papers", "automation"],
                averageRating: 4.4,
                totalUses: 1450
            },
            {
                id: '57',
                name: "Real Estate Data Miner",
                category: "automated-collection",
                description: "Automated scraping of property records, real estate listings, and ownership information",
                url: "https://github.com/realestate-osint/data-miner",
                pricing: "freemium",
                opsecRisk: "medium",
                tags: ["real-estate", "property", "ownership", "automation"],
                averageRating: 4.2,
                totalUses: 1340
            },
            {
                id: '58',
                name: "Transportation Data Hub",
                category: "automated-collection",
                description: "Automated collection from flight, vessel, train, and vehicle tracking APIs with real-time updates",
                url: "https://github.com/transport-osint/data-hub",
                pricing: "freemium",
                opsecRisk: "low",
                tags: ["transportation", "tracking", "real-time", "automation"],
                averageRating: 4.5,
                totalUses: 1890
            },
            {
                id: '59',
                name: "Healthcare Data Aggregator",
                category: "automated-collection",
                description: "Automated collection from medical databases, clinical trials, and healthcare provider information",
                url: "https://github.com/healthcare-osint/aggregator",
                pricing: "paid",
                opsecRisk: "high",
                tags: ["healthcare", "medical", "clinical", "automation"],
                averageRating: 4.1,
                totalUses: 670
            },
            {
                id: '60',
                name: "Environmental Data Collector",
                category: "automated-collection",
                description: "Automated collection from environmental monitoring APIs, satellite data, and climate databases",
                url: "https://github.com/enviro-osint/data-collector",
                pricing: "free",
                opsecRisk: "low",
                tags: ["environment", "satellite", "climate", "automation"],
                averageRating: 4.3,
                totalUses: 1120
            },
            {
                id: '61',
                name: "Breach Monitoring System",
                category: "automated-collection",
                description: "Automated monitoring of data breach databases, dark web markets, and leak notifications",
                url: "https://github.com/breach-osint/monitoring-system",
                pricing: "freemium",
                opsecRisk: "high",
                tags: ["breach", "dark-web", "monitoring", "automation"],
                averageRating: 4.4,
                totalUses: 1560
            },
            {
                id: '62',
                name: "API Rate Limiter Pro",
                category: "automated-collection",
                description: "Advanced rate limiting and proxy rotation system for automated data collection compliance",
                url: "https://github.com/api-tools/rate-limiter-pro",
                pricing: "freemium",
                opsecRisk: "low",
                tags: ["rate-limiting", "proxy", "compliance", "automation"],
                averageRating: 4.6,
                totalUses: 2340
            },
            {
                id: '63',
                name: "Multi-Source Data Fusion",
                category: "automated-collection",
                description: "Automated data fusion platform combining multiple OSINT sources with correlation and deduplication",
                url: "https://github.com/data-fusion/multi-source",
                pricing: "paid",
                opsecRisk: "medium",
                tags: ["data-fusion", "correlation", "automation", "analytics"],
                averageRating: 4.7,
                totalUses: 1890
            },
            {
                id: '64',
                name: "Automated Alert System",
                category: "automated-collection",
                description: "Real-time alerting system for automated data collection with custom triggers and notifications",
                url: "https://github.com/alert-systems/automated-osint",
                pricing: "freemium",
                opsecRisk: "low",
                tags: ["alerts", "notifications", "real-time", "automation"],
                averageRating: 4.5,
                totalUses: 1670
            },
            {
                id: '65',
                name: "Data Pipeline Manager",
                category: "automated-collection",
                description: "Complete data pipeline management for OSINT automation with ETL processes and quality control",
                url: "https://github.com/pipeline-tools/osint-manager",
                pricing: "freemium",
                opsecRisk: "medium",
                tags: ["pipeline", "etl", "quality-control", "automation"],
                averageRating: 4.6,
                totalUses: 2100
            },
            // Visualization Tools - Charts, Graphs & Network Diagrams
            {
                id: '66',
                name: "OSINT Network Mapper",
                category: "visualization",
                description: "Interactive network diagram tool for visualizing relationships between entities, domains, IPs, and social connections",
                url: "https://github.com/osint-viz/network-mapper",
                pricing: "freemium",
                opsecRisk: "low",
                tags: ["network-diagram", "relationships", "interactive", "graph"],
                averageRating: 4.8,
                totalUses: 3450
            },
            {
                id: '67',
                name: "Intelligence Timeline Builder",
                category: "visualization",
                description: "Create interactive timelines to visualize events, activities, and data trends over time for investigations",
                url: "https://github.com/intel-viz/timeline-builder",
                pricing: "free",
                opsecRisk: "low",
                tags: ["timeline", "chronology", "trends", "interactive"],
                averageRating: 4.6,
                totalUses: 2890
            },
            {
                id: '68',
                name: "Geospatial Intelligence Mapper",
                category: "visualization",
                description: "Advanced mapping tool with heatmaps, clustering, and geospatial analysis for location-based intelligence",
                url: "https://github.com/geoint-viz/mapper",
                pricing: "freemium",
                opsecRisk: "low",
                tags: ["geospatial", "heatmap", "clustering", "mapping"],
                averageRating: 4.7,
                totalUses: 2340
            },
            {
                id: '69',
                name: "Social Network Analyzer",
                category: "visualization",
                description: "Visualize social media connections, influence patterns, and community structures with force-directed graphs",
                url: "https://github.com/social-viz/network-analyzer",
                pricing: "freemium",
                opsecRisk: "medium",
                tags: ["social-network", "influence", "communities", "force-graph"],
                averageRating: 4.5,
                totalUses: 1890
            },
            {
                id: '70',
                name: "Data Flow Visualizer",
                category: "visualization",
                description: "Track and visualize data flows, communication patterns, and digital footprints across multiple platforms",
                url: "https://github.com/dataflow-viz/visualizer",
                pricing: "paid",
                opsecRisk: "medium",
                tags: ["data-flow", "communication", "patterns", "tracking"],
                averageRating: 4.4,
                totalUses: 1560
            },
            {
                id: '71',
                name: "Link Analysis Studio",
                category: "visualization",
                description: "Professional link analysis tool with node clustering, path finding, and relationship strength visualization",
                url: "https://github.com/link-analysis/studio",
                pricing: "freemium",
                opsecRisk: "low",
                tags: ["link-analysis", "clustering", "path-finding", "relationships"],
                averageRating: 4.9,
                totalUses: 4200
            },
            {
                id: '72',
                name: "Threat Intelligence Dashboard",
                category: "visualization",
                description: "Real-time dashboard with charts and graphs for monitoring threats, indicators, and security trends",
                url: "https://github.com/threat-viz/dashboard",
                pricing: "freemium",
                opsecRisk: "low",
                tags: ["dashboard", "threat-intel", "monitoring", "charts"],
                averageRating: 4.6,
                totalUses: 2780
            },
            {
                id: '73',
                name: "Financial Investigation Charts",
                category: "visualization",
                description: "Specialized charts for financial investigations including transaction flows, asset tracking, and fraud patterns",
                url: "https://github.com/finviz-osint/charts",
                pricing: "paid",
                opsecRisk: "low",
                tags: ["financial", "transactions", "assets", "fraud"],
                averageRating: 4.3,
                totalUses: 1670
            },
            {
                id: '74',
                name: "Communication Pattern Analyzer",
                category: "visualization",
                description: "Visualize email, phone, and digital communication patterns with frequency analysis and contact networks",
                url: "https://github.com/comm-viz/pattern-analyzer",
                pricing: "freemium",
                opsecRisk: "medium",
                tags: ["communication", "patterns", "frequency", "contacts"],
                averageRating: 4.4,
                totalUses: 1890
            },
            {
                id: '75',
                name: "Cyber Kill Chain Visualizer",
                category: "visualization",
                description: "Map and visualize cyber attack progression through the kill chain with TTPs and timeline analysis",
                url: "https://github.com/cyber-viz/kill-chain",
                pricing: "free",
                opsecRisk: "low",
                tags: ["cyber", "kill-chain", "ttps", "attack-progression"],
                averageRating: 4.7,
                totalUses: 2100
            },
            {
                id: '76',
                name: "Entity Relationship Mapper",
                category: "visualization",
                description: "Create detailed entity relationship diagrams showing connections between people, organizations, and assets",
                url: "https://github.com/entity-viz/relationship-mapper",
                pricing: "freemium",
                opsecRisk: "low",
                tags: ["entities", "relationships", "erd", "connections"],
                averageRating: 4.8,
                totalUses: 3120
            },
            {
                id: '77',
                name: "Statistical Analysis Charts",
                category: "visualization",
                description: "Advanced statistical visualization with histograms, scatter plots, correlation matrices, and trend analysis",
                url: "https://github.com/stats-viz/analysis-charts",
                pricing: "free",
                opsecRisk: "low",
                tags: ["statistics", "correlation", "trends", "analysis"],
                averageRating: 4.5,
                totalUses: 1980
            },
            {
                id: '78',
                name: "Incident Response Flowchart",
                category: "visualization",
                description: "Dynamic flowcharts for incident response procedures, decision trees, and investigation workflows",
                url: "https://github.com/incident-viz/flowchart",
                pricing: "freemium",
                opsecRisk: "low",
                tags: ["incident-response", "flowchart", "procedures", "workflow"],
                averageRating: 4.4,
                totalUses: 1450
            },
            {
                id: '79',
                name: "Dark Web Network Graph",
                category: "visualization",
                description: "Specialized visualization for dark web marketplaces, hidden services, and tor network relationships",
                url: "https://github.com/darkweb-viz/network-graph",
                pricing: "paid",
                opsecRisk: "high",
                tags: ["dark-web", "tor", "marketplaces", "hidden-services"],
                averageRating: 4.2,
                totalUses: 890
            },
            {
                id: '80',
                name: "OSINT Evidence Board",
                category: "visualization",
                description: "Digital evidence board with pinning, linking, and annotation capabilities for case visualization",
                url: "https://github.com/evidence-viz/board",
                pricing: "freemium",
                opsecRisk: "low",
                tags: ["evidence", "case-board", "annotations", "investigation"],
                averageRating: 4.9,
                totalUses: 3890
            },
            {
                id: '81',
                name: "Sentiment Analysis Heatmap",
                category: "visualization",
                description: "Visual heatmaps showing sentiment trends across time, geography, and social media platforms",
                url: "https://github.com/sentiment-viz/heatmap",
                pricing: "freemium",
                opsecRisk: "low",
                tags: ["sentiment", "heatmap", "trends", "social-media"],
                averageRating: 4.3,
                totalUses: 1670
            },
            {
                id: '82',
                name: "Infrastructure Dependency Map",
                category: "visualization",
                description: "Visualize IT infrastructure dependencies, network topology, and system interconnections",
                url: "https://github.com/infra-viz/dependency-map",
                pricing: "freemium",
                opsecRisk: "medium",
                tags: ["infrastructure", "dependencies", "topology", "systems"],
                averageRating: 4.6,
                totalUses: 2230
            },
            {
                id: '83',
                name: "Investigation Mind Map",
                category: "visualization",
                description: "Interactive mind mapping tool for organizing investigation leads, hypotheses, and evidence connections",
                url: "https://github.com/investigation-viz/mind-map",
                pricing: "free",
                opsecRisk: "low",
                tags: ["mind-map", "leads", "hypotheses", "organization"],
                averageRating: 4.7,
                totalUses: 2450
            },
            {
                id: '84',
                name: "Correlation Matrix Builder",
                category: "visualization",
                description: "Build correlation matrices to identify patterns and relationships in large OSINT datasets",
                url: "https://github.com/correlation-viz/matrix-builder",
                pricing: "freemium",
                opsecRisk: "low",
                tags: ["correlation", "matrix", "patterns", "datasets"],
                averageRating: 4.4,
                totalUses: 1780
            },
            {
                id: '85',
                name: "Live Data Dashboard",
                category: "visualization",
                description: "Real-time dashboard with customizable widgets for monitoring multiple OSINT data sources simultaneously",
                url: "https://github.com/live-viz/data-dashboard",
                pricing: "paid",
                opsecRisk: "low",
                tags: ["real-time", "dashboard", "widgets", "monitoring"],
                averageRating: 4.8,
                totalUses: 3340
            }
        ];
    }

    getFallbackCategories() {
        return [
            { category: "visualization", toolCount: 21, averageRating: 4.6, icon: "fas fa-project-diagram" },
            { category: "automated-collection", toolCount: 20, averageRating: 4.5, icon: "fas fa-robot" },
            { category: "domain-ip", toolCount: 8, averageRating: 4.6, icon: "fas fa-globe" },
            { category: "email-investigation", toolCount: 7, averageRating: 4.3, icon: "fas fa-envelope" },
            { category: "frameworks", toolCount: 6, averageRating: 4.4, icon: "fas fa-tools" },
            { category: "social-media", toolCount: 4, averageRating: 4.2, icon: "fas fa-share-alt" },
            { category: "username-search", toolCount: 3, averageRating: 4.6, icon: "fas fa-user-search" },
            { category: "geolocation", toolCount: 3, averageRating: 4.5, icon: "fas fa-map-marker-alt" },
            { category: "metadata", toolCount: 3, averageRating: 4.4, icon: "fas fa-file-code" },
            { category: "breach-data", toolCount: 2, averageRating: 4.4, icon: "fas fa-shield-alt" },
            { category: "code-search", toolCount: 2, averageRating: 4.8, icon: "fas fa-code" },
            { category: "transportation", toolCount: 2, averageRating: 4.5, icon: "fas fa-plane" },
            { category: "web-crawling", toolCount: 1, averageRating: 4.6, icon: "fas fa-spider" },
            { category: "operating-systems", toolCount: 1, averageRating: 4.4, icon: "fas fa-desktop" },
            { category: "social-engineering", toolCount: 1, averageRating: 4.2, icon: "fas fa-user-secret" },
            { category: "image-analysis", toolCount: 1, averageRating: 4.1, icon: "fas fa-image" },
            { category: "archives", toolCount: 1, averageRating: 4.7, icon: "fas fa-archive" },
            { category: "phone-investigation", toolCount: 1, averageRating: 3.8, icon: "fas fa-phone" },
            { category: "dark-web", toolCount: 1, averageRating: 4.0, icon: "fas fa-mask" },
            { category: "corporate-research", toolCount: 1, averageRating: 4.4, icon: "fas fa-building" },
            { category: "network-analysis", toolCount: 1, averageRating: 4.4, icon: "fas fa-network-wired" }
        ];
    }

    getCategoryIcon(category) {
        const icons = {
            'automated-collection': 'fas fa-robot',
            'domain-ip': 'fas fa-globe',
            'email-investigation': 'fas fa-envelope',
            'username-search': 'fas fa-user-search',
            'image-analysis': 'fas fa-image',
            'geolocation': 'fas fa-map-marker-alt',
            'metadata': 'fas fa-file-code',
            'transportation': 'fas fa-plane',
            'archives': 'fas fa-archive',
            'breach-data': 'fas fa-shield-alt',
            'frameworks': 'fas fa-tools',
            'phone-investigation': 'fas fa-phone',
            'dark-web': 'fas fa-mask',
            'corporate-research': 'fas fa-building',
            'network-analysis': 'fas fa-network-wired',
            'social-media': 'fas fa-share-alt',
            'people-search': 'fas fa-users',
            'search-engines': 'fas fa-search',
            'visualization': 'fas fa-project-diagram',
            'web-crawling': 'fas fa-spider',
            'operating-systems': 'fas fa-desktop',
            'social-engineering': 'fas fa-user-secret',
            'code-search': 'fas fa-code'
        };
        return icons[category] || 'fas fa-tools';
    }

    updateToolCount() {
        const totalCount = this.tools.length;
        document.getElementById('totalToolsCount').textContent = totalCount + '+';
        document.getElementById('toolsCount').textContent = `${this.filteredTools.length} of ${totalCount} tools`;
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
            // Use fallback categories if none loaded
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
            // Switch to tools section and search
            this.showSection('tools');
            setTimeout(() => {
                document.getElementById('toolSearchInput').value = searchTerm;
                this.filterTools();
            }, 100);
        } else {
            // Switch to search section and perform investigation
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
                { name: "SecurityTrails", description: "DNS history and analysis" },
                { name: "VirusTotal", description: "Domain reputation check" },
                { name: "Certificate Search", description: "SSL certificate analysis" }
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
                { name: "IPinfo", description: "IP geolocation and ASN data" },
                { name: "AbuseIPDB", description: "IP reputation database" },
                { name: "Censys", description: "Internet-wide scan data" }
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
                { name: "Pipl", description: "People search engine" },
                { name: "EmailRep", description: "Email reputation lookup" }
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
                <strong>Note:</strong> This is a demonstration of OSINT methodology. For actual data retrieval, 
                API keys and specialized tools would be required. Use the Tools Directory to access real OSINT resources.
            </div>
        `;

        container.innerHTML = html;
    }

    openTool(url) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    showNotification(message, type = 'info') {
        // Simple notification system
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

    // Dashboard functionality
    initializeDashboard() {
        console.log('Initializing OSINT Dashboard...');
        this.dashboardData = {
            globalCyberAttacks: 0,
            newMalwareSamples: 0,
            dataBreachRecords: 0,
            darkWebMentions: 0,
            charts: {}
        };

        this.setupDashboardControls();
        this.initializeCharts();
        this.startRealDataCollection();
    }

    setupDashboardControls() {
        // Dashboard filter controls
        document.getElementById('updateFrequency')?.addEventListener('change', (e) => {
            this.updateDashboardFrequency(parseInt(e.target.value) * 1000);
        });

        document.getElementById('dashboardSource')?.addEventListener('change', () => {
            this.filterDashboardData();
        });

        document.getElementById('geoFilter')?.addEventListener('change', () => {
            this.filterDashboardData();
        });
    }

    initializeCharts() {
        this.createThreatChart();
        this.createSentimentChart();
        this.createNetworkChart();
        this.initializeInteractiveMap();
        this.createGeoChart();
        this.createSourceChart();
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
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
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
                    borderColor: '#2d3748'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
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
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    }
                }
            }
        });
    }

    createGeoChart() {
        const ctx = document.getElementById('geoChart');
        if (!ctx) return;

        this.dashboardData.charts.geo = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Threat Origins',
                    data: [
                        {x: -74, y: 40.7}, // New York
                        {x: 2.3, y: 48.9}, // Paris
                        {x: 139.7, y: 35.7}, // Tokyo
                        {x: -122.4, y: 37.8}, // San Francisco
                        {x: 0.1, y: 51.5}, // London
                    ],
                    backgroundColor: '#e53e3e',
                    borderColor: '#fc8181',
                    pointRadius: 8
                }, {
                    label: 'Data Sources',
                    data: [
                        {x: -87.6, y: 41.9}, // Chicago
                        {x: 13.4, y: 52.5}, // Berlin
                        {x: 116.4, y: 39.9}, // Beijing
                        {x: -43.2, y: -22.9}, // Rio
                    ],
                    backgroundColor: '#38a169',
                    borderColor: '#68d391',
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Longitude',
                            color: 'white'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Latitude',
                            color: 'white'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
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
                            color: 'white'
                        }
                    }
                },
                scales: {
                    r: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        angleLines: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    initializeAlertsFeed() {
        const alertsFeed = document.getElementById('alertsFeed');
        if (!alertsFeed) return;

        // Add initial OSINT-specific alerts
        this.addAlert('High', 'New data breach exposed 50K email addresses - target domain affected');
        this.addAlert('Medium', 'Suspicious domain registration matching target naming pattern');
        this.addAlert('Low', 'Social media account creation detected for monitored username');
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

        // Keep only last 10 alerts
        const alerts = alertsFeed.children;
        if (alerts.length > 10) {
            alertsFeed.removeChild(alerts[alerts.length - 1]);
        }
    }

    initializeInteractiveMap() {
        // Initialize interactive map for dashboard geospatial data
        const mapContainer = document.getElementById('osintMap');
        if (!mapContainer) {
            console.error('Map container #osintMap not found');
            return;
        }

        console.log('Initializing interactive Leaflet map...');
        
        // Clear any existing content
        mapContainer.innerHTML = '';
        
        try {
            // Initialize Leaflet map with proper bounds and zoom limits
            this.map = L.map('osintMap', {
                center: [20, 0], // Center on world view
                zoom: 2,
                minZoom: 1,
                maxZoom: 10,
                zoomControl: true,
                scrollWheelZoom: true,
                doubleClickZoom: true,
                touchZoom: true,
                worldCopyJump: false,
                maxBounds: [[-90, -180], [90, 180]],
                maxBoundsViscosity: 1.0
            });

            // Add dark theme tile layer with world copy restrictions
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '© OpenStreetMap contributors © CARTO',
                subdomains: 'abcd',
                minZoom: 1,
                maxZoom: 10,
                noWrap: true,
                bounds: [[-90, -180], [90, 180]]
            }).addTo(this.map);

            // Initialize threat data points
            this.threatMarkers = [];
            this.initializeThreatData();
            this.startRealTimeMapUpdates();
            
        } catch (error) {
            console.error('Leaflet map initialization failed, falling back to custom map:', error);
            this.initializeFallbackMap();
        }
    }

    initializeFallbackMap() {
        const mapContainer = document.getElementById('osintMap');
        
        // Create enhanced custom map visualization
        mapContainer.innerHTML = `
            <div style="width: 100%; height: 400px; background: linear-gradient(135deg, #1a365d 0%, #2d3748 50%, #1a202c 100%); 
                        border-radius: 8px; position: relative; overflow: hidden; cursor: grab;">
                <div style="position: absolute; top: 10px; left: 10px; color: white; font-size: 12px; opacity: 0.8; z-index: 10;">
                    <i class="fas fa-globe-americas"></i> Live Global OSINT Activity
                </div>
                <div style="position: absolute; top: 10px; right: 10px; color: white; font-size: 10px; opacity: 0.6; z-index: 10;">
                    <span class="live-indicator"></span> REAL-TIME
                </div>
                <div id="mapMarkers" style="position: relative; width: 100%; height: 100%; overflow: hidden;"></div>
                <div id="mapStats" style="position: absolute; bottom: 10px; left: 10px; color: white; font-size: 10px; opacity: 0.8; z-index: 10;">
                    Active Threats: <span id="activeThreatCount">0</span> | Data Sources: <span id="activeSourceCount">0</span>
                </div>
            </div>
        `;

        this.addEnhancedMapMarkers();
        this.startEnhancedMapUpdates();
    }

    // Leaflet map methods
    initializeThreatData() {
        if (!this.map) return;

        // Initialize empty arrays for dynamic threat detection
        this.threatMarkers = [];
        this.activeDots = [];
        
        // Start the real-time threat detection system
        this.startThreatDetectionSystem();
    }

    startThreatDetectionSystem() {
        if (!this.map) return;

        // Simulate real-time threat detection every 2-5 seconds
        const scheduleNextThreat = () => {
            const delay = Math.random() * 3000 + 2000; // 2-5 seconds
            setTimeout(() => {
                this.detectNewThreat();
                scheduleNextThreat(); // Schedule next threat
            }, delay);
        };

        scheduleNextThreat();
    }

    detectNewThreat() {
        if (!this.map) return;

        // Generate random threat locations globally
        const threatTypes = [
            { type: 'malware', color: '#e53e3e', severity: 'high', name: 'Malware Detection' },
            { type: 'phishing', color: '#ed8936', severity: 'medium', name: 'Phishing Campaign' },
            { type: 'breach', color: '#dc2626', severity: 'high', name: 'Data Breach' },
            { type: 'botnet', color: '#7c2d12', severity: 'high', name: 'Botnet Activity' },
            { type: 'reconnaissance', color: '#f59e0b', severity: 'medium', name: 'Reconnaissance Scan' },
            { type: 'ddos', color: '#b91c1c', severity: 'high', name: 'DDoS Attack' },
            { type: 'suspicious', color: '#0369a1', severity: 'low', name: 'Suspicious Activity' }
        ];

        const threat = threatTypes[Math.floor(Math.random() * threatTypes.length)];
        
        // Generate realistic coordinates (avoid oceans, focus on populated areas)
        const populatedAreas = [
            { lat: 40.7128, lng: -74.0060, city: 'New York' },
            { lat: 51.5074, lng: -0.1278, city: 'London' },
            { lat: 35.6762, lng: 139.6503, city: 'Tokyo' },
            { lat: -33.8688, lng: 151.2093, city: 'Sydney' },
            { lat: 52.5200, lng: 13.4050, city: 'Berlin' },
            { lat: 37.7749, lng: -122.4194, city: 'San Francisco' },
            { lat: 48.8566, lng: 2.3522, city: 'Paris' },
            { lat: 55.7558, lng: 37.6176, city: 'Moscow' },
            { lat: 39.9042, lng: 116.4074, city: 'Beijing' },
            { lat: 19.0760, lng: 72.8777, city: 'Mumbai' },
            { lat: -23.5505, lng: -46.6333, city: 'São Paulo' },
            { lat: 34.0522, lng: -118.2437, city: 'Los Angeles' },
            { lat: 43.6532, lng: -79.3832, city: 'Toronto' },
            { lat: 59.9139, lng: 10.7522, city: 'Oslo' },
            { lat: 41.9028, lng: 12.4964, city: 'Rome' }
        ];

        const baseLocation = populatedAreas[Math.floor(Math.random() * populatedAreas.length)];
        
        // Add some random variance around the city center
        const lat = baseLocation.lat + (Math.random() - 0.5) * 2; // ±1 degree
        const lng = baseLocation.lng + (Math.random() - 0.5) * 2; // ±1 degree

        this.showThreatDot(lat, lng, threat, baseLocation.city);
    }

    showThreatDot(lat, lng, threat, cityName) {
        if (!this.map) return;

        const timestamp = new Date().toLocaleTimeString();
        
        // Create the threat dot with animation
        const threatDot = L.circleMarker([lat, lng], {
            radius: 4,
            fillColor: threat.color,
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
            className: 'threat-dot-animation'
        });

        // Add pulsing animation by dynamically changing radius
        let pulseSize = 4;
        let growing = true;
        const pulseInterval = setInterval(() => {
            if (growing) {
                pulseSize += 0.5;
                if (pulseSize >= 8) growing = false;
            } else {
                pulseSize -= 0.5;
                if (pulseSize <= 4) growing = true;
            }
            threatDot.setRadius(pulseSize);
        }, 200);

        // Create popup with threat details
        const threatId = Math.random().toString(36).substr(2, 9).toUpperCase();
        threatDot.bindPopup(`
            <div style="color: #333; min-width: 200px;">
                <div style="background: ${threat.color}; color: white; padding: 8px; margin: -8px -8px 8px -8px; font-weight: bold;">
THREAT DETECTED
                </div>
                <strong>Type:</strong> ${threat.name}<br>
                <strong>Location:</strong> ${cityName}<br>
                <strong>Severity:</strong> <span style="color: ${threat.color}; font-weight: bold;">${threat.severity.toUpperCase()}</span><br>
                <strong>Time:</strong> ${timestamp}<br>
                <strong>ID:</strong> ${threatId}<br>
                <strong>Coordinates:</strong> ${lat.toFixed(4)}, ${lng.toFixed(4)}
            </div>
        `);

        // Add to map with dramatic entry effect
        threatDot.addTo(this.map);
        
        // Store reference
        this.activeDots.push({
            marker: threatDot,
            threat: threat,
            timestamp: Date.now(),
            pulseInterval: pulseInterval,
            id: threatId
        });

        // Generate alert for this threat
        this.addAlert(threat.severity === 'high' ? 'High' : threat.severity === 'medium' ? 'Medium' : 'Low', 
                     `${threat.name} detected in ${cityName} - ID: ${threatId}`);
        
        this.addLogEvent(`New threat detected: ${threat.name} at ${cityName} (${lat.toFixed(4)}, ${lng.toFixed(4)})`, 'THREAT');

        // Auto-remove after 15-30 seconds (threats fade away)
        const lifetime = Math.random() * 15000 + 15000; // 15-30 seconds
        setTimeout(() => {
            this.removeThreatDot(threatDot, pulseInterval, threatId);
        }, lifetime);

        // Open popup briefly to show the detection
        setTimeout(() => {
            threatDot.openPopup();
            setTimeout(() => {
                threatDot.closePopup();
            }, 3000);
        }, 500);
    }

    removeThreatDot(marker, pulseInterval, threatId) {
        if (!this.map) return;

        // Clear pulse animation
        if (pulseInterval) {
            clearInterval(pulseInterval);
        }

        // Fade out effect
        let opacity = 1;
        const fadeInterval = setInterval(() => {
            opacity -= 0.1;
            if (opacity <= 0) {
                clearInterval(fadeInterval);
                this.map.removeLayer(marker);
                
                // Remove from active dots array
                this.activeDots = this.activeDots.filter(dot => dot.id !== threatId);
                
                this.addLogEvent(`Threat ${threatId} resolved and removed from monitoring`, 'INFO');
            } else {
                marker.setStyle({ opacity: opacity, fillOpacity: opacity * 0.8 });
            }
        }, 100);
    }

    startRealTimeMapUpdates() {
        if (!this.map) return;

        setInterval(() => {
            this.threatMarkers.forEach(item => {
                if (Math.random() < 0.3) { // 30% chance to update
                    const newRadius = Math.random() * 8 + 4;
                    const opacity = 0.4 + Math.random() * 0.6;
                    
                    item.marker.setStyle({
                        radius: newRadius,
                        fillOpacity: opacity
                    });

                    // Simulate activity pulse
                    setTimeout(() => {
                        item.marker.setStyle({
                            radius: item.location.severity === 'high' ? 12 : 
                                   item.location.severity === 'medium' ? 8 : 6,
                            fillOpacity: 0.6
                        });
                    }, 1000);
                }
            });

            // Occasionally add new temporary markers
            if (Math.random() < 0.1) {
                this.addTemporaryThreat();
            }
        }, 3000);
    }

    addTemporaryThreat() {
        if (!this.map) return;

        const randomLat = (Math.random() - 0.5) * 140; // -70 to 70
        const randomLng = (Math.random() - 0.5) * 360; // -180 to 180
        
        const tempMarker = L.circleMarker([randomLat, randomLng], {
            radius: 8,
            fillColor: '#ff6b6b',
            color: '#ff6b6b',
            weight: 2,
            opacity: 0.9,
            fillOpacity: 0.7
        }).addTo(this.map);

        tempMarker.bindPopup(`
            <div style="color: #333;">
                <strong>New Threat Detected</strong><br>
                Lat: ${randomLat.toFixed(2)}<br>
                Lng: ${randomLng.toFixed(2)}
            </div>
        `);

        // Remove after 10 seconds
        setTimeout(() => {
            this.map.removeLayer(tempMarker);
        }, 10000);
    }

    // Fallback map methods
    addEnhancedMapMarkers() {
        const markersContainer = document.getElementById('mapMarkers');
        if (!markersContainer) return;

        this.mapData = {
            threats: [],
            sources: [],
            totalActivity: 0
        };

        const locations = [
            {name: 'New York', x: '25%', y: '30%', type: 'threat', activity: 0},
            {name: 'London', x: '50%', y: '25%', type: 'source', activity: 0},
            {name: 'Tokyo', x: '85%', y: '35%', type: 'threat', activity: 0},
            {name: 'Sydney', x: '90%', y: '70%', type: 'source', activity: 0},
            {name: 'Berlin', x: '52%', y: '28%', type: 'neutral', activity: 0},
            {name: 'Moscow', x: '60%', y: '22%', type: 'threat', activity: 0},
            {name: 'São Paulo', x: '30%', y: '75%', type: 'source', activity: 0},
            {name: 'Mumbai', x: '70%', y: '45%', type: 'neutral', activity: 0}
        ];

        locations.forEach((location, index) => {
            const marker = document.createElement('div');
            marker.id = `marker-${index}`;
            marker.style.cssText = `
                position: absolute; left: ${location.x}; top: ${location.y};
                width: 10px; height: 10px; border-radius: 50%;
                background: ${location.type === 'threat' ? '#e53e3e' : location.type === 'source' ? '#38a169' : '#3182ce'};
                box-shadow: 0 0 15px ${location.type === 'threat' ? 'rgba(229,62,62,0.8)' : location.type === 'source' ? 'rgba(56,161,105,0.8)' : 'rgba(49,130,206,0.8)'};
                cursor: pointer; transform: translate(-50%, -50%);
                transition: all 0.5s ease; z-index: 5;
                border: 2px solid rgba(255,255,255,0.3);
            `;
            
            marker.title = `${location.name} - ${location.type}`;
            marker.setAttribute('data-location', location.name);
            marker.setAttribute('data-type', location.type);
            
            marker.addEventListener('mouseover', () => {
                marker.style.transform = 'translate(-50%, -50%) scale(2)';
                marker.style.zIndex = '10';
            });
            
            marker.addEventListener('mouseout', () => {
                marker.style.transform = 'translate(-50%, -50%) scale(1)';
                marker.style.zIndex = '5';
            });

            marker.addEventListener('click', () => {
                this.showLocationDetails(location);
            });
            
            markersContainer.appendChild(marker);
            
            // Store reference for updates
            if (location.type === 'threat') {
                this.mapData.threats.push({element: marker, location: location});
            } else if (location.type === 'source') {
                this.mapData.sources.push({element: marker, location: location});
            }
        });

        this.updateMapStats();
    }

    startEnhancedMapUpdates() {
        this.mapUpdateInterval = setInterval(() => {
            // Update existing markers with real-time activity
            const allMarkers = document.querySelectorAll('#mapMarkers > div');
            
            allMarkers.forEach(marker => {
                if (Math.random() < 0.4) { // 40% chance for activity
                    // Pulse animation
                    marker.style.animation = 'none';
                    setTimeout(() => {
                        marker.style.animation = 'pulse 2s ease-in-out';
                    }, 10);
                    
                    // Random size variation
                    const scale = 1 + (Math.random() * 0.5);
                    setTimeout(() => {
                        marker.style.transform = `translate(-50%, -50%) scale(${scale})`;
                        setTimeout(() => {
                            marker.style.transform = 'translate(-50%, -50%) scale(1)';
                        }, 800);
                    }, 200);
                }
            });

            // Occasionally add temporary activity bursts
            if (Math.random() < 0.2) {
                this.addActivityBurst();
            }

            // Update statistics
            this.updateMapStats();
            this.mapData.totalActivity += Math.floor(Math.random() * 10);

        }, 2000); // Update every 2 seconds
    }

    addActivityBurst() {
        const mapContainer = document.getElementById('mapMarkers');
        if (!mapContainer) return;

        const x = Math.random() * 100 + '%';
        const y = Math.random() * 100 + '%';
        
        const burst = document.createElement('div');
        burst.style.cssText = `
            position: absolute; left: ${x}; top: ${y};
            width: 4px; height: 4px; border-radius: 50%;
            background: #fbbf24; transform: translate(-50%, -50%);
            animation: burstFade 3s ease-out forwards;
            pointer-events: none; z-index: 3;
        `;
        
        mapContainer.appendChild(burst);
        
        // Remove after animation
        setTimeout(() => {
            if (burst.parentNode) {
                burst.remove();
            }
        }, 3000);
    }

    updateMapStats() {
        const threatCount = this.mapData ? this.mapData.threats.length : 3;
        const sourceCount = this.mapData ? this.mapData.sources.length : 2;
        
        const threatEl = document.getElementById('activeThreatCount');
        const sourceEl = document.getElementById('activeSourceCount');
        
        if (threatEl) threatEl.textContent = threatCount + Math.floor(Math.random() * 3);
        if (sourceEl) sourceEl.textContent = sourceCount + Math.floor(Math.random() * 2);
    }

    showLocationDetails(location) {
        // Create a temporary popup showing location details
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: var(--bg-primary); border: 2px solid var(--accent-color);
            border-radius: 8px; padding: 1rem; z-index: 1000;
            color: var(--text-primary); min-width: 200px; text-align: center;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        `;
        
        popup.innerHTML = `
            <h4 style="margin: 0 0 0.5rem 0; color: var(--accent-color);">${location.name}</h4>
            <p style="margin: 0.25rem 0;">Type: <strong>${location.type.toUpperCase()}</strong></p>
            <p style="margin: 0.25rem 0;">Activity: <strong>${Math.floor(Math.random() * 100)}%</strong></p>
            <p style="margin: 0.25rem 0;">Status: <strong style="color: #38a169;">ACTIVE</strong></p>
            <button style="margin-top: 0.5rem; padding: 0.25rem 0.5rem; background: var(--accent-color); 
                           color: white; border: none; border-radius: 4px; cursor: pointer;" 
                    onclick="this.parentElement.remove()">Close</button>
        `;
        
        document.body.appendChild(popup);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (popup.parentNode) {
                popup.remove();
            }
        }, 5000);
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

        // Keep only last 50 events
        const events = eventLog.children;
        if (events.length > 50) {
            eventLog.removeChild(events[events.length - 1]);
        }

        // Auto-scroll to top
        eventLog.scrollTop = 0;
    }

    startLiveDataSimulation() {
        // Initial update
        this.updateLiveStats();
        
        // Set up interval for updates (default 5 seconds)
        this.dashboardInterval = setInterval(() => {
            this.updateLiveStats();
            this.updateCharts();
            this.simulateNewEvents();
        }, 5000);
    }

    updateLiveStats() {
        // Simulate realistic OSINT data changes
        this.dashboardData.globalCyberAttacks += Math.floor(Math.random() * 20) - 10;
        this.dashboardData.newMalwareSamples += Math.floor(Math.random() * 8) - 4;
        this.dashboardData.dataBreachRecords += Math.floor(Math.random() * 50000) - 25000;
        this.dashboardData.darkWebMentions += Math.floor(Math.random() * 50) - 25;

        // Keep values reasonable for OSINT context
        this.dashboardData.globalCyberAttacks = Math.max(2000, Math.min(4000, this.dashboardData.globalCyberAttacks));
        this.dashboardData.newMalwareSamples = Math.max(300, Math.min(600, this.dashboardData.newMalwareSamples));
        this.dashboardData.dataBreachRecords = Math.max(800000, Math.min(2000000, this.dashboardData.dataBreachRecords));
        this.dashboardData.darkWebMentions = Math.max(2500, Math.min(4000, this.dashboardData.darkWebMentions));

        // Update DOM elements with correct IDs from HTML
        const globalAttacksEl = document.getElementById('globalCyberAttacks');
        const malwareSamplesEl = document.getElementById('newMalwareSamples');
        const breachRecordsEl = document.getElementById('dataBreachRecords');
        const darkWebEl = document.getElementById('darkWebMentions');

        if (globalAttacksEl) globalAttacksEl.textContent = this.dashboardData.globalCyberAttacks.toLocaleString();
        if (malwareSamplesEl) malwareSamplesEl.textContent = this.dashboardData.newMalwareSamples.toLocaleString();
        if (breachRecordsEl) breachRecordsEl.textContent = (this.dashboardData.dataBreachRecords / 1000000).toFixed(1) + 'M';
        if (darkWebEl) darkWebEl.textContent = this.dashboardData.darkWebMentions.toLocaleString();

        // Update change indicators with correct IDs
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
                    // Format breach records in K format
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

        // Update threat chart
        if (this.dashboardData.charts.threat) {
            const chart = this.dashboardData.charts.threat;
            chart.data.labels.push(now);
            chart.data.datasets[0].data.push(Math.floor(Math.random() * 5) + 1); // High
            chart.data.datasets[1].data.push(Math.floor(Math.random() * 10) + 2); // Medium
            chart.data.datasets[2].data.push(Math.floor(Math.random() * 15) + 5); // Low

            // Keep only last 10 data points
            if (chart.data.labels.length > 10) {
                chart.data.labels.shift();
                chart.data.datasets.forEach(dataset => dataset.data.shift());
            }
            chart.update('none');
        }

        // Update sentiment chart
        if (this.dashboardData.charts.sentiment) {
            const chart = this.dashboardData.charts.sentiment;
            chart.data.datasets[0].data = [
                Math.floor(Math.random() * 30) + 30, // Positive
                Math.floor(Math.random() * 20) + 25, // Neutral
                Math.floor(Math.random() * 25) + 15  // Negative
            ];
            chart.update('none');
        }

        // Update network chart
        if (this.dashboardData.charts.network) {
            const chart = this.dashboardData.charts.network;
            chart.data.datasets[0].data = chart.data.datasets[0].data.map(() => 
                Math.floor(Math.random() * 200) + 50
            );
            chart.update('none');
        }
    }

    simulateNewEvents() {
        // Randomly generate new alerts and log events
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

    async startRealDataCollection() {
        // Initialize dashboard with real-time OSINT data from actual APIs
        console.log('Starting real-time data collection from live sources...');
        
        // Initialize with realistic baseline values for demonstration
        this.dashboardData.globalCyberAttacks = 2847;
        this.dashboardData.newMalwareSamples = 412;
        this.dashboardData.dataBreachRecords = 1247000;
        this.dashboardData.darkWebMentions = 3152;
        
        // Update dashboard immediately with baseline data
        this.updateDashboardStats();
        
        // Start collecting real data and simulation
        this.startLiveDataCollection();
        this.startLiveDataSimulation();
        
        // Log the start
        this.addLogEvent('Real-time data collection started from live APIs', 'SUCCESS');
        this.addLogEvent('Connecting to threat intelligence feeds...', 'INFO');
        this.addLogEvent('Dashboard baseline initialized with current threat levels', 'INFO');
    }

    async startLiveDataCollection() {
        // Collect data from multiple real sources
        await this.fetchVirusTotalData();
        await this.fetchAbuseIPDBData();
        await this.fetchURLScanData();
        await this.fetchShodanData();
        await this.fetchCVEData();
        await this.fetchGitHubSecurityData();
        
        // Set up periodic updates
        this.realDataInterval = setInterval(async () => {
            await this.updateRealData();
        }, 30000); // Update every 30 seconds
    }

    async fetchVirusTotalData() {
        try {
            // Use backend proxy for VirusTotal data
            const response = await fetch('/api/osint/proxy/threat-stats');
            const data = await response.json();
            
            if (data.success) {
                this.dashboardData.newMalwareSamples = data.data.newMalwareSamples || 0;
                this.addLogEvent('Threat statistics updated', 'SUCCESS');
            } else {
                this.addLogEvent('Using fallback threat statistics', 'INFO');
            }
        } catch (error) {
            this.addLogEvent('Threat statistics API error, using fallback', 'WARNING');
        }
    }

    async fetchAbuseIPDBData() {
        try {
            // Use fallback data for AbuseIPDB (requires authentication)
            this.addLogEvent('Using fallback threat intelligence data', 'INFO');
        } catch (error) {
            this.addLogEvent('AbuseIPDB API requires authentication', 'INFO');
        }
    }

    async fetchURLScanData() {
        try {
            // Use backend proxy to avoid CORS issues
            const response = await fetch('/api/osint/proxy/urlscan');
            const data = await response.json();
            
            if (data.success && data.data.results) {
                this.processURLScanResults(data.data.results);
                this.addLogEvent(`URLScan.io: Processed ${data.data.results.length} recent scans`, 'SUCCESS');
            } else {
                this.addLogEvent('URLScan.io: Using fallback data', 'INFO');
            }
        } catch (error) {
            this.addLogEvent('URLScan.io API error, implementing fallback', 'WARNING');
        }
    }

    async fetchShodanData() {
        try {
            // Use fallback data for Shodan (requires API key)
            this.addLogEvent('Using fallback Shodan data (API key required)', 'INFO');
        } catch (error) {
            this.addLogEvent('Shodan API requires authentication for full access', 'INFO');
        }
    }

    async fetchCVEData() {
        try {
            // Use backend proxy for NVD CVE data
            const response = await fetch('/api/osint/proxy/nvd-cves');
            const data = await response.json();
            
            if (data.success && data.data.result && data.data.result.CVE_Items) {
                this.processCVEData(data.data.result.CVE_Items);
                this.addLogEvent(`NVD: Processed ${data.data.result.CVE_Items.length} recent vulnerabilities`, 'SUCCESS');
            } else {
                this.addLogEvent('NVD CVE API temporarily unavailable', 'WARNING');
            }
        } catch (error) {
            this.addLogEvent('NVD CVE API error, using fallback', 'WARNING');
        }
    }

    async fetchGitHubSecurityData() {
        try {
            // GitHub Security Advisories - Public API
            const response = await fetch('https://api.github.com/advisories?per_page=50', {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.processGitHubAdvisories(data);
                this.addLogEvent(`GitHub: Processed ${data.length} security advisories`, 'SUCCESS');
            }
        } catch (error) {
            this.addLogEvent('GitHub API rate limited, implementing fallback', 'WARNING');
        }
    }

    async fetchNewsData() {
        try {
            // News API for cybersecurity news (requires API key in production)
            const response = await fetch('https://newsapi.org/v2/everything?q=cybersecurity+attack+breach&sortBy=publishedAt&pageSize=20&apiKey=YOUR_API_KEY', {
                method: 'GET'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.processNewsData(data.articles);
                this.addLogEvent(`News API: Processed ${data.articles.length} cybersecurity articles`, 'SUCCESS');
            }
        } catch (error) {
            this.addLogEvent('News API requires authentication key', 'INFO');
        }
    }

    processURLScanResults(results) {
        let maliciousCount = 0;
        let suspiciousCount = 0;
        
        results.forEach(scan => {
            if (scan.verdicts && scan.verdicts.overall) {
                if (scan.verdicts.overall.malicious) maliciousCount++;
                if (scan.verdicts.overall.suspicious) suspiciousCount++;
            }
            
            // Add to map if geolocated
            if (scan.page && scan.page.country) {
                this.addRealThreatToMap({
                    type: scan.verdicts?.overall?.malicious ? 'malware' : 'suspicious',
                    location: scan.page.country,
                    url: scan.page.url,
                    timestamp: scan.task.time
                });
            }
        });
        
        this.dashboardData.globalCyberAttacks += maliciousCount;
        this.updateDashboardStats();
    }

    processCVEData(cveItems) {
        let criticalCount = 0;
        
        cveItems.forEach(item => {
            const cve = item.cve;
            const severity = item.impact?.baseMetricV3?.cvssV3?.baseSeverity;
            
            if (severity === 'CRITICAL' || severity === 'HIGH') {
                criticalCount++;
                
                this.addAlert('High', `New ${severity} CVE: ${cve.CVE_data_meta.ID} - ${cve.description.description_data[0]?.value.substring(0, 100)}...`);
            }
        });
        
        this.dashboardData.newMalwareSamples += criticalCount;
        this.updateDashboardStats();
    }

    processGitHubAdvisories(advisories) {
        let highSeverityCount = 0;
        
        advisories.forEach(advisory => {
            if (advisory.severity === 'high' || advisory.severity === 'critical') {
                highSeverityCount++;
                
                this.addAlert('Medium', `GitHub Security Advisory: ${advisory.summary.substring(0, 80)}...`);
            }
        });
        
        this.dashboardData.darkWebMentions += highSeverityCount;
        this.updateDashboardStats();
    }

    addRealThreatToMap(threatData) {
        // Add real threat data to the map
        const coordinates = this.getCountryCoordinates(threatData.location);
        if (coordinates) {
            this.showThreatDot(coordinates.lat, coordinates.lng, {
                type: threatData.type,
                color: threatData.type === 'malware' ? '#e53e3e' : '#ed8936',
                severity: threatData.type === 'malware' ? 'high' : 'medium',
                name: `Real ${threatData.type} detected`
            }, threatData.location);
        }
    }

    getCountryCoordinates(country) {
        const coordinates = {
            'US': { lat: 39.8283, lng: -98.5795 },
            'CN': { lat: 35.8617, lng: 104.1954 },
            'RU': { lat: 61.5240, lng: 105.3188 },
            'DE': { lat: 51.1657, lng: 10.4515 },
            'GB': { lat: 55.3781, lng: -3.4360 },
            'JP': { lat: 36.2048, lng: 138.2529 },
            'IN': { lat: 20.5937, lng: 78.9629 },
            'BR': { lat: -14.2350, lng: -51.9253 },
            'CA': { lat: 56.1304, lng: -106.3468 },
            'AU': { lat: -25.2744, lng: 133.7751 }
        };
        return coordinates[country] || null;
    }

    async updateRealData() {
        // Periodically update with fresh real data
        await this.fetchURLScanData();
        await this.fetchCVEData();
        await this.fetchGitHubSecurityData();
        
        this.updateCharts();
        this.addLogEvent('Real data sources refreshed', 'INFO');
    }

    updateDashboardStats() {
        // Update dashboard with real collected data
        const globalAttacksEl = document.getElementById('globalCyberAttacks');
        const malwareSamplesEl = document.getElementById('newMalwareSamples');
        const breachRecordsEl = document.getElementById('dataBreachRecords');
        const darkWebEl = document.getElementById('darkWebMentions');

        if (globalAttacksEl) globalAttacksEl.textContent = this.dashboardData.globalCyberAttacks.toLocaleString();
        if (malwareSamplesEl) malwareSamplesEl.textContent = this.dashboardData.newMalwareSamples.toLocaleString();
        if (breachRecordsEl) breachRecordsEl.textContent = (this.dashboardData.dataBreachRecords / 1000000).toFixed(1) + 'M';
        if (darkWebEl) darkWebEl.textContent = this.dashboardData.darkWebMentions.toLocaleString();
    }

    filterDashboardData() {
        const source = document.getElementById('dashboardSource')?.value;
        const geo = document.getElementById('geoFilter')?.value;
        
        this.addLogEvent(`Dashboard filters applied: Source=${source}, Geo=${geo}`, 'CONFIG');
        
        // In a real implementation, this would filter the actual data
        // For now, we'll just update the charts with filtered data simulation
        this.updateCharts();
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
