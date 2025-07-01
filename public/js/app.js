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
        const sections = ['homeSection', 'toolsSection', 'searchSection', 'aboutSection'];
        
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
        }
    }

    async loadTools() {
        // Force use of fallback data to ensure all 45+ tools are loaded
        console.log('Loading fallback tools data...');
        this.tools = this.getFallbackTools();
        this.filteredTools = [...this.tools];
        console.log(`Loaded ${this.tools.length} tools`);
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
            }
        ];
    }

    getFallbackCategories() {
        return [
            { category: "domain-ip", toolCount: 8, averageRating: 4.6, icon: "fas fa-globe" },
            { category: "email-investigation", toolCount: 7, averageRating: 4.3, icon: "fas fa-envelope" },
            { category: "username-search", toolCount: 3, averageRating: 4.6, icon: "fas fa-user-search" },
            { category: "frameworks", toolCount: 6, averageRating: 4.4, icon: "fas fa-tools" },
            { category: "social-media", toolCount: 4, averageRating: 4.2, icon: "fas fa-share-alt" },
            { category: "geolocation", toolCount: 3, averageRating: 4.5, icon: "fas fa-map-marker-alt" },
            { category: "metadata", toolCount: 3, averageRating: 4.4, icon: "fas fa-file-code" },
            { category: "breach-data", toolCount: 2, averageRating: 4.4, icon: "fas fa-shield-alt" },
            { category: "code-search", toolCount: 2, averageRating: 4.8, icon: "fas fa-code" },
            { category: "transportation", toolCount: 2, averageRating: 4.5, icon: "fas fa-plane" },
            { category: "visualization", toolCount: 1, averageRating: 4.7, icon: "fas fa-project-diagram" },
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
                    <span>★ ${(category.averageRating || 4.0).toFixed(1)}</span>
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
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.osintHub = new OSINTHub();
});
