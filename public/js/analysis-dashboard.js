class AnalysisDashboard {
    constructor() {
        this.currentSession = null;
        this.sessions = [];
        this.tools = [];
        this.charts = {};
        this.currentTheme = localStorage.getItem('osint-hub-theme') || 'light';
        this.init();
    }

    async init() {
        this.initializeTheme();
        this.setupEventListeners();
        await this.loadTools();
        await this.loadSessions();
        this.updateStatistics();
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

        // Mobile menu toggle
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (mobileMenuToggle && navMenu) {
            mobileMenuToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });

            // Close mobile menu when clicking on nav links
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('active');
                });
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.header-container')) {
                    navMenu.classList.remove('active');
                }
            });
        }

        // Navigation links
        document.addEventListener('click', (e) => {
            if (e.target.hasAttribute('data-section') || e.target.closest('[data-section]')) {
                const section = e.target.getAttribute('data-section') || e.target.closest('[data-section]').getAttribute('data-section');
                
                // Handle navigation to different pages
                if (section === 'home' || section === 'tools' || section === 'search' || section === 'dashboard' || section === 'about') {
                    window.location.href = 'index.html';
                }
            }
        });

        // Modal controls
        const newSessionBtn = document.getElementById('newSessionBtn');
        const newSessionModal = document.getElementById('newSessionModal');
        const addDataPointBtn = document.getElementById('addDataPointBtn');
        const addDataPointModal = document.getElementById('addDataPointModal');
        const closeButtons = document.querySelectorAll('.close');

        newSessionBtn?.addEventListener('click', () => {
            newSessionModal.style.display = 'block';
        });

        addDataPointBtn?.addEventListener('click', () => {
            if (!this.currentSession) {
                alert('Please select or create a session first');
                return;
            }
            addDataPointModal.style.display = 'block';
        });

        closeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // Form submissions
        document.getElementById('newSessionForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createNewSession();
        });

        document.getElementById('addDataPointForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addDataPoint();
        });

        // Tab navigation
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });

        // Confidence slider
        const confidenceSlider = document.getElementById('confidence');
        const confidenceValue = document.getElementById('confidenceValue');
        if (confidenceSlider && confidenceValue) {
            confidenceSlider.addEventListener('input', (e) => {
                confidenceValue.textContent = `${e.target.value}%`;
            });
        }

        // Import/Export buttons
        document.getElementById('importDataBtn')?.addEventListener('click', () => {
            if (window.dataImporter) {
                window.dataImporter.openImportModal();
            } else {
                this.importData();
            }
        });

        document.getElementById('exportReportBtn')?.addEventListener('click', () => {
            this.exportReport();
        });

        document.getElementById('cleanupBtn')?.addEventListener('click', () => {
            this.cleanupTestSessions();
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    async loadTools() {
        try {
            const response = await fetch('/api/tools');
            if (response.ok) {
                const data = await response.json();
                // Handle different response formats
                if (data.success && Array.isArray(data.data)) {
                    this.tools = data.data;
                } else if (Array.isArray(data)) {
                    this.tools = data;
                } else {
                    throw new Error('Invalid response format');
                }
                this.populateToolsDropdown();
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('Error loading tools:', error);
            // Fallback with mock data
            this.tools = [
                { _id: '1', name: 'WhoisXML API', category: 'domain-ip' },
                { _id: '2', name: 'Shodan', category: 'network-analysis' },
                { _id: '3', name: 'VirusTotal', category: 'threat-intelligence' },
                { _id: '4', name: 'Have I Been Pwned', category: 'breach-data' },
                { _id: '5', name: 'Google Dorking', category: 'search-engines' }
            ];
            this.populateToolsDropdown();
        }
    }

    populateToolsDropdown() {
        const dropdown = document.getElementById('sourceTool');
        if (!dropdown) return;

        dropdown.innerHTML = '<option value="">Select source tool</option>';
        
        // Ensure tools is an array before using forEach
        if (Array.isArray(this.tools)) {
            this.tools.forEach(tool => {
                const option = document.createElement('option');
                option.value = tool._id || tool.id;
                option.textContent = `${tool.name} (${tool.category})`;
                dropdown.appendChild(option);
            });
        }
    }

    async loadSessions() {
        try {
            const response = await fetch('/api/analysis-sessions');
            if (response.ok) {
                const data = await response.json();
                console.log('API response data:', data);
                // Handle different response formats
                if (data.success && Array.isArray(data.data)) {
                    this.sessions = data.data;
                } else if (Array.isArray(data)) {
                    this.sessions = data;
                } else {
                    throw new Error('Invalid response format');
                }
                console.log('Sessions loaded:', this.sessions);
            } else {
                console.warn(`API returned ${response.status}, using mock data`);
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
            // Start with empty sessions array - users need to create their own
            this.sessions = [];
        }
        this.renderSessions();
        
        // Auto-select the demo session only if it's the only session available
        const demoSession = this.sessions.find(s => s._id === 'demo-session-1');
        const nonDemoSessions = this.sessions.filter(s => 
            s._id !== 'demo-session-1' && 
            !s.title.includes('Test') && 
            !s.title.includes('test') &&
            !s.title.includes('Demo')
        );
        
        if (demoSession && nonDemoSessions.length === 0) {
            console.log('Auto-selecting demo session (only session available)');
            this.selectSession('demo-session-1');
        } else if (nonDemoSessions.length > 0) {
            console.log('Auto-selecting first non-demo session');
            this.selectSession(nonDemoSessions[0]._id);
        }
    }

    renderSessions() {
        const container = document.getElementById('sessionsList');
        if (!container) return;

        // Filter out test sessions (sessions with "Test" in title or non-demo sessions in development)
        const displaySessions = this.sessions.filter(session => {
            // Always show demo session
            if (session._id === 'demo-session-1') return true;
            
            // In development, only show real sessions if they don't have "Test" or "Demo" in the title
            const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            if (isDevelopment) {
                // Only show real sessions if they don't have "Test" or "Demo" in the title
                return !session.title.includes('Test') && !session.title.includes('test') && !session.title.includes('Demo');
            }
            
            // In production, show all sessions except test ones
            return !session.title.includes('Test') && !session.title.includes('test') && !session.title.includes('Demo');
        });

        if (displaySessions.length === 0) {
            container.innerHTML = '<p>No analysis sessions found. Create your first session to get started.</p>';
            return;
        }

        // Check if demo session exists to show/hide demo note
        const demoSessionExists = this.sessions.some(s => s._id === 'demo-session-1');
        const demoNote = document.querySelector('.demo-note');
        if (demoNote) {
            demoNote.style.display = demoSessionExists ? 'block' : 'none';
        }

        container.innerHTML = displaySessions.map(session => `
            <div class="session-card ${session._id === 'demo-session-1' ? 'demo-session' : ''}" data-session-id="${session._id}">
                <div class="session-header">
                    <h4>${session.title}${session._id === 'demo-session-1' ? ' <span class="demo-badge">DEMO</span>' : ''}</h4>
                    <div class="session-actions">
                        <span class="priority-badge priority-${session.priority}">${session.priority}</span>
                        <button class="delete-session-btn" data-session-id="${session._id}" title="Delete session">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="session-meta">
                    <span><i class="fas fa-target"></i> ${session.targetType}</span>
                    <span><i class="fas fa-clock"></i> ${this.formatDate(session.createdAt)}</span>
                </div>
                <div class="session-stats">
                    <span>${session.analytics?.totalDataPoints || 0} data points</span>
                    <span>${session.analytics?.toolsUsed || 0} tools used</span>
                </div>
                <div class="session-click-area" data-session-id="${session._id}"></div>
            </div>
        `).join('');

        // Add event listeners for session interactions
        container.addEventListener('click', (e) => {
            console.log('Session container clicked:', e.target);
            const sessionId = e.target.closest('[data-session-id]')?.dataset.sessionId;
            console.log('Session ID found:', sessionId);
            
            if (!sessionId) return;

            if (e.target.closest('.delete-session-btn')) {
                console.log('Delete button clicked for session:', sessionId);
                e.stopPropagation();
                this.deleteSession(sessionId);
            } else if (e.target.closest('.session-click-area')) {
                console.log('Session clicked:', sessionId);
                this.selectSession(sessionId);
            }
        });

        // Add CSS for session cards
        if (!document.getElementById('session-card-styles')) {
            const style = document.createElement('style');
            style.id = 'session-card-styles';
            style.textContent = `
                .session-card {
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 1rem;
                    margin-bottom: 1rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .session-card:hover {
                    border-color: var(--accent-color);
                    transform: translateY(-2px);
                }
                .session-card.active {
                    border-color: var(--accent-color);
                    background: rgba(var(--accent-color-rgb), 0.1);
                }
                .session-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }
                .session-header h4 {
                    margin: 0;
                    color: var(--text-primary);
                    font-size: 1rem;
                }
                .priority-badge {
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    text-transform: uppercase;
                }
                .priority-low { background: #10b981; color: white; }
                .priority-medium { background: #f59e0b; color: white; }
                .priority-high { background: #ef4444; color: white; }
                .priority-critical { background: #991b1b; color: white; }
                .session-meta {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 0.5rem;
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                }
                .session-meta i {
                    margin-right: 0.25rem;
                }
                .session-stats {
                    display: flex;
                    gap: 1rem;
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }
                .session-actions {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .delete-session-btn {
                    background: none;
                    border: none;
                    color: var(--danger-color);
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                    z-index: 10;
                    position: relative;
                }
                .delete-session-btn:hover {
                    background: var(--danger-color);
                    color: white;
                }
                .session-click-area {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    cursor: pointer;
                    z-index: 1;
                }
                .session-card {
                    position: relative;
                }
                .demo-session {
                    border: 2px dashed var(--accent-color);
                    background: rgba(var(--accent-color-rgb), 0.05);
                }
                .demo-session:hover {
                    border-color: var(--accent-color);
                    background: rgba(var(--accent-color-rgb), 0.1);
                }
                .demo-badge {
                    background: var(--accent-color);
                    color: white;
                    font-size: 0.7rem;
                    padding: 0.2rem 0.4rem;
                    border-radius: 4px;
                    margin-left: 0.5rem;
                    font-weight: bold;
                    text-transform: uppercase;
                }
            `;
            document.head.appendChild(style);
        }
    }

    selectSession(sessionId) {
        console.log('Selecting session:', sessionId);
        console.log('Available sessions:', this.sessions);
        this.currentSession = this.sessions.find(s => s._id === sessionId);
        console.log('Selected session:', this.currentSession);
        if (!this.currentSession) return;

        // Update active session styling
        document.querySelectorAll('.session-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelector(`[data-session-id="${sessionId}"]`)?.classList.add('active');

        // Update session title
        document.getElementById('activeSessionTitle').textContent = this.currentSession.title;

        // Ensure tab structure is present
        this.ensureTabStructure();

        // Show tabs when a session is selected
        const tabsContainer = document.querySelector('.tabs');
        if (tabsContainer) {
            tabsContainer.style.display = 'flex';
        }

        // Update content based on current tab
        // Add a small delay to ensure DOM is ready
        setTimeout(() => {
            // Recalculate analytics for the selected session
            this.recalculateAnalytics();
            this.updateSessionContent();
        }, 100);
    }

    ensureTabStructure() {
        console.log('ensureTabStructure called');
        const sessionContent = document.getElementById('sessionContent');
        console.log('sessionContent found:', !!sessionContent);
        if (!sessionContent) return;

        // Check if tab structure exists
        const tabsContainer = sessionContent.querySelector('.tabs');
        console.log('tabsContainer found:', !!tabsContainer);
        if (!tabsContainer) {
            console.log('Restoring tab structure...');
            // Restore the tab structure
            sessionContent.innerHTML = `
                <div class="tabs">
                    <button class="tab active" data-tab="overview">Overview</button>
                    <button class="tab" data-tab="data">Data Points</button>
                    <button class="tab" data-tab="analytics">Analytics</button>
                    <button class="tab" data-tab="visualizations">Visualizations</button>
                </div>
                
                <!-- Overview Tab -->
                <div class="tab-content active" id="overview-tab">
                    <div id="sessionOverview">
                        <p>Loading session overview...</p>
                    </div>
                </div>
                
                <!-- Data Points Tab -->
                <div class="tab-content" id="data-tab">
                    <div class="form-group">
                        <button class="btn btn-primary" id="addDataPointBtn">
                            <i class="fas fa-plus"></i> Add Data Point
                        </button>
                    </div>
                    <div class="data-points-container" id="dataPointsContainer">
                        <!-- Data points will be displayed here -->
                    </div>
                </div>
                
                <!-- Analytics Tab -->
                <div class="tab-content" id="analytics-tab">
                    <div id="analyticsContent">
                        <!-- Analytics content will be displayed here -->
                    </div>
                </div>
                
                <!-- Visualizations Tab -->
                <div class="tab-content" id="visualizations-tab">
                    <div class="visualization-container">
                        <h4>Timeline</h4>
                        <div class="timeline-container" id="timelineContainer">
                            <!-- Timeline will be displayed here -->
                        </div>
                    </div>
                    
                    <div class="visualization-container">
                        <h4>Data Distribution</h4>
                        <div class="chart-container">
                            <canvas id="dataDistributionChart"></canvas>
                        </div>
                    </div>
                    
                    <div class="visualization-container">
                        <h4>Network Graph</h4>
                        <div class="network-graph" id="networkGraph">
                            <!-- Network visualization will be displayed here -->
                        </div>
                    </div>
                </div>
            `;
            console.log('Tab structure restored');
        }
    }

    recalculateAnalytics() {
        if (!this.currentSession) return;
        
        console.log('Recalculating analytics for session:', this.currentSession._id);
        
        // Basic analytics
        this.currentSession.analytics.totalDataPoints = this.currentSession.dataPoints.length;
        
        // Calculate unique tools used
        const uniqueTools = new Set(this.currentSession.dataPoints.map(dp => dp.source.toolName));
        this.currentSession.analytics.toolsUsed = uniqueTools.size;
        
        // Calculate average confidence score
        if (this.currentSession.dataPoints.length > 0) {
            const totalConfidence = this.currentSession.dataPoints.reduce((sum, dp) => sum + dp.confidence, 0);
            this.currentSession.analytics.confidenceScore = Math.round(totalConfidence / this.currentSession.dataPoints.length);
        }
        
        // Generate patterns
        this.currentSession.analytics.patterns = this.generatePatterns();
        
        // Generate timeline
        this.currentSession.analytics.timeline = this.generateTimeline();
        
        // Calculate risk assessment
        this.currentSession.analytics.riskAssessment = this.calculateRiskAssessment();
        
        // Update metadata
        this.currentSession.metadata.lastAnalyzed = new Date().toISOString();
        this.currentSession.metadata.dataSourceCount = uniqueTools.size;
        this.currentSession.metadata.qualityScore = this.calculateQualityScore();
        this.currentSession.metadata.completenessScore = this.calculateCompletenessScore();
        
        console.log('Analytics recalculated:', this.currentSession.analytics);
    }
    
    generatePatterns() {
        const patterns = [];
        const dataByType = {};
        
        // Group data by type
        this.currentSession.dataPoints.forEach(dp => {
            if (!dataByType[dp.type]) {
                dataByType[dp.type] = [];
            }
            dataByType[dp.type].push(dp);
        });
        
        // Look for patterns in each type
        Object.keys(dataByType).forEach(type => {
            const typeData = dataByType[type];
            if (typeData.length > 1) {
                // Check for duplicates or similar values
                const values = typeData.map(dp => dp.value);
                const duplicates = values.filter((item, index) => values.indexOf(item) !== index);
                
                if (duplicates.length > 0) {
                    patterns.push({
                        type: 'duplicate_values',
                        description: `Duplicate ${type} values found`,
                        strength: duplicates.length / values.length * 100,
                        evidence: duplicates
                    });
                }
            }
            
            // Check for data quality patterns
            if (typeData.length > 0) {
                const lowConfidenceData = typeData.filter(dp => dp.confidence < 50);
                if (lowConfidenceData.length > 0) {
                    patterns.push({
                        type: 'low_confidence',
                        description: `${lowConfidenceData.length} ${type} entries with low confidence`,
                        strength: (lowConfidenceData.length / typeData.length) * 100,
                        evidence: lowConfidenceData.map(dp => dp.value)
                    });
                }
            }
        });
        
        // Cross-type pattern analysis
        if (this.currentSession.dataPoints.length > 1) {
            // Check for correlation between different data types
            const ipData = this.currentSession.dataPoints.filter(dp => dp.type === 'ip');
            const domainData = this.currentSession.dataPoints.filter(dp => dp.type === 'domain');
            
            if (ipData.length > 0 && domainData.length > 0) {
                patterns.push({
                    type: 'cross_correlation',
                    description: 'IP and domain data correlation potential',
                    strength: 75,
                    evidence: ['IP addresses and domains found in same session']
                });
            }
            
            // Check for email and domain correlation
            const emailData = this.currentSession.dataPoints.filter(dp => dp.type === 'email');
            if (emailData.length > 0 && domainData.length > 0) {
                patterns.push({
                    type: 'email_domain_correlation',
                    description: 'Email and domain correlation potential',
                    strength: 80,
                    evidence: ['Email addresses and domains found in same session']
                });
            }
        }
        
        return patterns;
    }
    
    generateTimeline() {
        const timeline = [];
        
        this.currentSession.dataPoints.forEach(dp => {
            if (dp.source.timestamp) {
                timeline.push({
                    date: dp.source.timestamp,
                    event: `${dp.key}: ${dp.value}`,
                    source: dp.source.toolName,
                    significance: dp.confidence > 75 ? 'high' : dp.confidence > 50 ? 'medium' : 'low'
                });
            }
        });
        
        // Sort by date
        timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        return timeline;
    }
    
    calculateRiskAssessment() {
        let riskScore = 0;
        const factors = [];
        
        // Check for high-risk indicators
        this.currentSession.dataPoints.forEach(dp => {
            if (dp.enrichment && dp.enrichment.riskScore) {
                riskScore += dp.enrichment.riskScore;
            }
            
            // Check for specific risk factors
            if (dp.type === 'breach-data') {
                riskScore += 20;
                factors.push('Data breach involvement');
            }
            
            if (dp.key.toLowerCase().includes('password') || dp.key.toLowerCase().includes('hash')) {
                riskScore += 15;
                factors.push('Password-related data');
            }
            
            if (dp.type === 'cryptocurrency-address') {
                riskScore += 10;
                factors.push('Cryptocurrency involvement');
            }
            
            // Check for low confidence data
            if (dp.confidence < 50) {
                riskScore += 5;
                factors.push('Low confidence data');
            }
            
            // Check for suspicious patterns in values
            if (dp.value && typeof dp.value === 'string') {
                if (dp.value.includes('@') && dp.value.includes('gmail')) {
                    riskScore += 3;
                    factors.push('Common email pattern detected');
                }
                
                if (dp.value.match(/^\d+$/) && dp.value.length > 10) {
                    riskScore += 5;
                    factors.push('Long numeric identifier');
                }
            }
        });
        
        // Add risk based on data diversity
        const uniqueTypes = new Set(this.currentSession.dataPoints.map(dp => dp.type));
        if (uniqueTypes.size > 3) {
            riskScore += 8;
            factors.push('Multiple data types collected');
        }
        
        // Determine risk level
        let level = 'low';
        if (riskScore > 75) level = 'critical';
        else if (riskScore > 50) level = 'high';
        else if (riskScore > 25) level = 'medium';
        
        return {
            level,
            factors,
            score: Math.min(riskScore, 100)
        };
    }
    
    calculateQualityScore() {
        if (this.currentSession.dataPoints.length === 0) return 0;
        
        const totalConfidence = this.currentSession.dataPoints.reduce((sum, dp) => sum + dp.confidence, 0);
        const avgConfidence = totalConfidence / this.currentSession.dataPoints.length;
        
        // Quality score based on confidence and data completeness
        let qualityScore = avgConfidence;
        
        // Bonus for verified data
        const verifiedData = this.currentSession.dataPoints.filter(dp => dp.enrichment && dp.enrichment.verified);
        if (verifiedData.length > 0) {
            qualityScore += (verifiedData.length / this.currentSession.dataPoints.length) * 20;
        }
        
        return Math.min(qualityScore, 100);
    }
    
    calculateCompletenessScore() {
        if (this.currentSession.dataPoints.length === 0) return 0;
        
        // Completeness based on data diversity and coverage
        const uniqueTypes = new Set(this.currentSession.dataPoints.map(dp => dp.type));
        const typeScore = (uniqueTypes.size / 10) * 40; // Max 40 points for type diversity
        
        const coverageScore = Math.min(this.currentSession.dataPoints.length * 10, 60); // Max 60 points for data volume
        
        return Math.min(typeScore + coverageScore, 100);
    }

    showNoSessionMessage() {
        const sessionContent = document.getElementById('sessionContent');
        if (!sessionContent) return;

        // Ensure tab structure exists first
        this.ensureTabStructure();
        
        // Show message in the overview tab
        const overviewContainer = document.getElementById('sessionOverview');
        if (overviewContainer) {
            overviewContainer.innerHTML = '<p>Select an existing session or create a new one to begin analysis.</p>';
        }
        
        // Hide tabs when no session is selected
        const tabsContainer = sessionContent.querySelector('.tabs');
        if (tabsContainer) {
            tabsContainer.style.display = 'none';
        }
        
        // Show only the overview tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const overviewTab = document.getElementById('overview-tab');
        if (overviewTab) {
            overviewTab.classList.add('active');
        }
    }

    updateSessionContent() {
        if (!this.currentSession) return;

        const activeTab = document.querySelector('.tab.active')?.dataset.tab || 'overview';
        this.switchTab(activeTab);
    }

    switchTab(tabName) {
        console.log('Switching to tab:', tabName);
        
        // Update tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`)?.classList.add('active');

        // Load content based on tab
        switch (tabName) {
            case 'overview':
                console.log('Rendering overview');
                this.renderOverview();
                break;
            case 'data':
                console.log('Rendering data points');
                this.renderDataPoints();
                break;
            case 'analytics':
                console.log('Rendering analytics');
                this.renderAnalytics();
                break;
            case 'visualizations':
                console.log('Rendering visualizations');
                this.renderVisualizations();
                break;
        }
    }

    renderOverview() {
        console.log('renderOverview called');
        let container = document.getElementById('sessionOverview');
        console.log('Container found:', !!container);
        console.log('Container element:', container);
        console.log('Current session:', this.currentSession);
        
        if (!container || !this.currentSession) {
            console.log('Early return - missing container or session');
            console.log('Container missing:', !container);
            console.log('Session missing:', !this.currentSession);
            
            // Try to ensure tab structure exists
            if (!container) {
                console.log('Attempting to restore tab structure...');
                this.ensureTabStructure();
                container = document.getElementById('sessionOverview');
                console.log('Container after restore:', !!container);
                
                if (!container) {
                    console.log('Still no container found, cannot render overview');
                    return;
                }
            }
            
            if (!this.currentSession) {
                console.log('No session available, cannot render overview');
                return;
            }
        }

        console.log('Session analytics:', this.currentSession.analytics);
        
        // Ensure analytics are up to date
        this.recalculateAnalytics();
        
        // Ensure analytics field exists with default values
        if (!this.currentSession.analytics) {
            this.currentSession.analytics = {
                totalDataPoints: 0,
                toolsUsed: 0,
                confidenceScore: 0,
                riskAssessment: {
                    level: 'low',
                    score: 0,
                    factors: []
                }
            };
        }
        
        const riskLevel = this.currentSession.analytics?.riskAssessment?.level || 'low';
        const riskClass = `risk-${riskLevel}`;
        const riskIcon = this.getRiskIcon(riskLevel);

        container.innerHTML = `
            <div class="overview-content">
                <div class="session-info">
                    <h4>Session Information</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Target Type:</label>
                            <span>${this.currentSession.targetType}</span>
                        </div>
                        <div class="info-item">
                            <label>Priority:</label>
                            <span class="priority-badge priority-${this.currentSession.priority}">${this.currentSession.priority}</span>
                        </div>
                        <div class="info-item">
                            <label>Status:</label>
                            <span>${this.currentSession.status}</span>
                        </div>
                        <div class="info-item">
                            <label>Created:</label>
                            <span>${this.formatDate(this.currentSession.createdAt)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="risk-assessment ${riskClass}">
                    <div class="risk-icon">
                        <i class="fas ${riskIcon}"></i>
                    </div>
                    <div>
                        <h5>Risk Assessment: ${riskLevel.toUpperCase()}</h5>
                        <p>Based on ${this.currentSession.analytics?.totalDataPoints || 0} data points from ${this.currentSession.analytics?.toolsUsed || 0} tools.</p>
                    </div>
                </div>
                
                <div class="quick-stats">
                    <h4>Quick Statistics</h4>
                    <div class="stats-row">
                        <div class="stat">
                            <span class="stat-number">${this.currentSession.analytics?.totalDataPoints || 0}</span>
                            <span class="stat-label">Data Points</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">${this.currentSession.analytics?.toolsUsed || 0}</span>
                            <span class="stat-label">Tools Used</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">${this.currentSession.analytics?.confidenceScore || this.currentSession.analytics?.averageConfidence || 0}%</span>
                            <span class="stat-label">Avg Confidence</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add CSS for overview content
        if (!document.getElementById('overview-styles')) {
            const style = document.createElement('style');
            style.id = 'overview-styles';
            style.textContent = `
                .overview-content > div {
                    margin-bottom: 2rem;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                    margin-top: 1rem;
                }
                .info-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.5rem;
                    background: var(--bg-primary);
                    border-radius: 4px;
                }
                .info-item label {
                    font-weight: 500;
                    color: var(--text-secondary);
                }
                .quick-stats h4 {
                    margin-bottom: 1rem;
                }
                .stats-row {
                    display: flex;
                    gap: 2rem;
                }
                .stat {
                    text-align: center;
                }
                .stat-number {
                    display: block;
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--accent-color);
                }
                .stat-label {
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                }
            `;
            document.head.appendChild(style);
        }
    }

    renderDataPoints() {
        const container = document.getElementById('dataPointsContainer');
        if (!container || !this.currentSession) return;

        // Ensure analytics are up to date
        this.recalculateAnalytics();

        const dataPoints = this.currentSession.dataPoints || [];

        if (dataPoints.length === 0) {
            container.innerHTML = '<p>No data points added yet. Click "Add Data Point" to get started.</p>';
            return;
        }

        container.innerHTML = dataPoints.map(dp => `
            <div class="data-point">
                <div class="data-point-header">
                    <span class="data-point-type">${dp.type}</span>
                    <span class="confidence-badge ${this.getConfidenceClass(dp.confidence)}">${dp.confidence}%</span>
                </div>
                <div class="data-point-content">
                    <strong>${dp.key}:</strong> ${dp.value}
                </div>
                <div class="data-point-meta">
                    <small><i class="fas fa-tool"></i> ${dp.source?.toolName || 'Unknown'}</small>
                    <small><i class="fas fa-clock"></i> ${this.formatDate(dp.source?.timestamp)}</small>
                </div>
                ${dp.tags && dp.tags.length > 0 ? `
                    <div class="data-point-tags">
                        ${dp.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');

        // Add CSS for data point tags
        if (!document.getElementById('data-point-styles')) {
            const style = document.createElement('style');
            style.id = 'data-point-styles';
            style.textContent = `
                .data-point-content {
                    margin: 0.5rem 0;
                    color: var(--text-primary);
                }
                .data-point-meta {
                    display: flex;
                    gap: 1rem;
                    margin-top: 0.5rem;
                    color: var(--text-secondary);
                    font-size: 0.75rem;
                }
                .data-point-meta i {
                    margin-right: 0.25rem;
                }
                .data-point-tags {
                    margin-top: 0.5rem;
                    display: flex;
                    gap: 0.25rem;
                    flex-wrap: wrap;
                }
                .tag {
                    background: var(--accent-color);
                    color: white;
                    padding: 0.125rem 0.375rem;
                    border-radius: 12px;
                    font-size: 0.625rem;
                    font-weight: 500;
                }
            `;
            document.head.appendChild(style);
        }
    }

    renderAnalytics() {
        const container = document.getElementById('analyticsContent');
        if (!container || !this.currentSession) return;

        console.log('Rendering analytics for session:', this.currentSession);
        console.log('Analytics data:', this.currentSession.analytics);
        
        // Ensure analytics are up to date
        this.recalculateAnalytics();
        
        const analytics = this.currentSession.analytics || {};
        const patterns = analytics.patterns || [];
        const timeline = analytics.timeline || [];
        const riskFactors = analytics.riskAssessment?.factors || [];

        console.log('Full analytics object:', analytics);
        console.log('Patterns:', patterns);
        console.log('Risk factors:', riskFactors);
        console.log('Risk assessment:', analytics.riskAssessment);

        container.innerHTML = `
            <div class="analytics-grid">
                <div class="analytics-section">
                    <h4>Pattern Analysis</h4>
                    ${patterns.length > 0 ? `
                        <ul class="patterns-list">
                            ${patterns.map(pattern => `
                                <li>
                                    <strong>${pattern.description}</strong>
                                    <span class="pattern-strength">${Math.round(pattern.strength)}% strength</span>
                                </li>
                            `).join('')}
                        </ul>
                    ` : '<p>No patterns detected yet. Add more data points to see pattern analysis.</p>'}
                </div>
                
                <div class="analytics-section">
                    <h4>Risk Factors</h4>
                    ${riskFactors.length > 0 ? `
                        <ul class="risk-factors-list">
                            ${riskFactors.map(factor => `<li>${factor}</li>`).join('')}
                        </ul>
                    ` : '<p>No risk factors identified. Add more data points to see risk assessment.</p>'}
                </div>
                
                <div class="analytics-section">
                    <h4>Data Quality</h4>
                    <div class="quality-metrics">
                        <div class="metric">
                            <label>Completeness:</label>
                            <div class="progress-bar">
                                <div class="progress" style="width: ${this.currentSession.metadata?.completenessScore || 0}%"></div>
                            </div>
                            <span>${this.currentSession.metadata?.completenessScore || 0}%</span>
                        </div>
                        <div class="metric">
                            <label>Quality Score:</label>
                            <div class="progress-bar">
                                <div class="progress" style="width: ${this.currentSession.metadata?.qualityScore || 0}%"></div>
                            </div>
                            <span>${this.currentSession.metadata?.qualityScore || 0}%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add CSS for analytics content
        if (!document.getElementById('analytics-styles')) {
            const style = document.createElement('style');
            style.id = 'analytics-styles';
            style.textContent = `
                .analytics-grid {
                    display: grid;
                    gap: 2rem;
                }
                .analytics-section {
                    background: var(--bg-primary);
                    padding: 1.5rem;
                    border-radius: 8px;
                    border: 1px solid var(--border-color);
                }
                .analytics-section h4 {
                    margin-bottom: 1rem;
                    color: var(--text-primary);
                }
                .patterns-list, .risk-factors-list {
                    list-style: none;
                    padding: 0;
                }
                .patterns-list li {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.5rem 0;
                    border-bottom: 1px solid var(--border-color);
                }
                .pattern-strength {
                    color: var(--accent-color);
                    font-weight: 500;
                }
                .risk-factors-list li {
                    padding: 0.25rem 0;
                    color: var(--text-primary);
                }
                .quality-metrics {
                    display: grid;
                    gap: 1rem;
                }
                .metric {
                    display: grid;
                    grid-template-columns: auto 1fr auto;
                    gap: 1rem;
                    align-items: center;
                }
                .progress-bar {
                    background: var(--border-color);
                    border-radius: 4px;
                    height: 8px;
                    overflow: hidden;
                }
                .progress {
                    background: var(--accent-color);
                    height: 100%;
                    transition: width 0.3s ease;
                }
            `;
            document.head.appendChild(style);
        }
    }

    renderVisualizations() {
        if (!this.currentSession) return;

        // Ensure analytics are up to date
        this.recalculateAnalytics();

        this.renderTimeline();
        this.renderDataDistributionChart();
        this.renderNetworkGraph();
    }

    renderTimeline() {
        const container = document.getElementById('timelineContainer');
        if (!container || !this.currentSession) return;

        console.log('Rendering timeline for session:', this.currentSession);
        
        // Ensure analytics are up to date
        this.recalculateAnalytics();
        
        const timeline = this.currentSession.analytics?.timeline || [];
        console.log('Timeline data:', timeline);

        if (timeline.length === 0) {
            container.innerHTML = '<p>No timeline data available. Add data points to see timeline events.</p>';
            return;
        }

        container.innerHTML = timeline.map(item => `
            <div class="timeline-item">
                <div class="timeline-date">${this.formatDate(item.date)}</div>
                <div class="timeline-content">
                    <div>${item.event}</div>
                    <div class="timeline-source">Source: ${item.source}</div>
                </div>
            </div>
        `).join('');
    }

    renderDataDistributionChart() {
        const canvas = document.getElementById('dataDistributionChart');
        if (!canvas || !this.currentSession) return;

        console.log('Rendering data distribution chart for session:', this.currentSession);
        
        // Ensure analytics are up to date
        this.recalculateAnalytics();
        
        const ctx = canvas.getContext('2d');
        const dataPoints = this.currentSession.dataPoints || [];
        console.log('Data points:', dataPoints);

        // Count data types
        const typeCounts = {};
        dataPoints.forEach(dp => {
            typeCounts[dp.type] = (typeCounts[dp.type] || 0) + 1;
        });
        console.log('Type counts:', typeCounts);

        if (Object.keys(typeCounts).length === 0) {
            canvas.parentElement.innerHTML = '<p>No data points available for chart visualization.</p>';
            return;
        }

        if (this.charts.dataDistribution) {
            this.charts.dataDistribution.destroy();
        }

        try {
            this.charts.dataDistribution = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(typeCounts),
                    datasets: [{
                        data: Object.values(typeCounts),
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
            console.log('Chart created successfully');
        } catch (error) {
            console.error('Error creating chart:', error);
            canvas.parentElement.innerHTML = '<p>Chart could not be rendered. Chart.js may not be available.</p>';
        }
    }

    renderNetworkGraph() {
        const container = document.getElementById('networkGraph');
        if (!container || !this.currentSession) return;

        // Simple network visualization using D3.js
        container.innerHTML = '';

        const width = container.clientWidth;
        const height = 400;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Create sample network data from data points
        const nodes = [];
        const links = [];
        const dataPoints = this.currentSession.dataPoints || [];

        // Add central node
        nodes.push({ id: 'center', name: this.currentSession.title, type: 'center', x: width/2, y: height/2 });

        // Add data point nodes
        dataPoints.forEach((dp, index) => {
            const nodeId = `dp_${index}`;
            nodes.push({
                id: nodeId,
                name: `${dp.key}: ${dp.value}`,
                type: dp.type,
                confidence: dp.confidence
            });
            links.push({ source: 'center', target: nodeId });
        });

        if (nodes.length <= 1) {
            container.innerHTML = '<p>No data available for network visualization.</p>';
            return;
        }

        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2));

        const link = svg.append('g')
            .selectAll('line')
            .data(links)
            .enter().append('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', 2);

        const node = svg.append('g')
            .selectAll('circle')
            .data(nodes)
            .enter().append('circle')
            .attr('r', d => d.type === 'center' ? 20 : 10)
            .attr('fill', d => d.type === 'center' ? '#FF6384' : '#36A2EB')
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        const label = svg.append('g')
            .selectAll('text')
            .data(nodes)
            .enter().append('text')
            .text(d => d.name.length > 20 ? d.name.substring(0, 20) + '...' : d.name)
            .attr('font-size', '12px')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em');

        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);

            label
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        });

        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    }

    async createNewSession() {
        console.log('createNewSession called');
        
        const form = document.getElementById('newSessionForm');
        if (!form) {
            console.error('Form not found!');
            alert('Error: Form not found');
            return;
        }

        const formData = new FormData(form);
        const sessionData = {
            title: formData.get('sessionTitle'),
            targetType: formData.get('targetType'),
            priority: formData.get('priority'),
            description: formData.get('sessionDescription')
        };

        console.log('Form data:', sessionData);

        // Validate required fields
        if (!sessionData.title || !sessionData.targetType) {
            alert('Please fill in all required fields (Title and Target Type are required)');
            return;
        }

        console.log('Validation passed, creating session...');

        try {
            // Try API call with retry mechanism
            let response;
            let retryCount = 0;
            const maxRetries = 2;
            
            while (retryCount <= maxRetries) {
                try {
                    response = await fetch('/api/analysis-sessions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(sessionData)
                    });
                    
                    if (response.ok) {
                        break; // Success, exit retry loop
                    } else {
                        throw new Error(`HTTP ${response.status}`);
                    }
                } catch (fetchError) {
                    retryCount++;
                    console.log(`API attempt ${retryCount} failed:`, fetchError);
                    
                    if (retryCount > maxRetries) {
                        throw fetchError; // Give up after max retries
                    }
                    
                    // Wait before retrying
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }
            }

            if (response && response.ok) {
                const newSession = await response.json();
                this.sessions.push(newSession);
                console.log('Session created via API:', newSession);
                console.log('Session analytics field:', newSession.analytics);
                console.log('Full session object:', JSON.stringify(newSession, null, 2));
                
                this.renderSessions();
                this.selectSession(newSession._id);
                this.updateStatistics();
                
                // Close modal and reset form
                const modal = document.getElementById('newSessionModal');
                if (modal) {
                    modal.style.display = 'none';
                }
                
                form.reset();
                
                alert('Session created successfully!');
                console.log('Session creation completed');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('Error creating session:', error);
            // Fallback to mock session creation
            const mockSession = {
                _id: Date.now().toString(),
                ...sessionData,
                status: 'active',
                dataPoints: [],
                analytics: {
                    totalDataPoints: 0,
                    toolsUsed: 0,
                    confidenceScore: 0,
                    riskAssessment: {
                        level: 'low',
                        score: 0,
                        factors: []
                    },
                    patterns: [],
                    correlations: [],
                    timeline: [],
                    geolocations: [],
                    networks: []
                },
                visualizations: [],
                reports: [],
                collaboration: {
                    shared: false,
                    sharedWith: [],
                    comments: []
                },
                settings: {
                    autoAnalysis: true,
                    notifications: true,
                    dataRetention: 365,
                    exportFormat: 'json'
                },
                metadata: {
                    lastAnalyzed: null,
                    dataSourceCount: 0,
                    qualityScore: 0,
                    completenessScore: 0
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            console.log('Mock session created:', mockSession);
            this.sessions.push(mockSession);
            this.renderSessions();
            this.selectSession(mockSession._id);
            this.updateStatistics();
            
            // Close modal and reset form
            const modal = document.getElementById('newSessionModal');
            if (modal) {
                modal.style.display = 'none';
            }
            
            form.reset();
            
            alert('Session created successfully!');
            console.log('Session creation completed');
        }
    }

    async deleteSession(sessionId) {
        console.log('Delete session called with ID:', sessionId);
        
        let confirmMessage = 'Are you sure you want to delete this session? This action cannot be undone.';
        
        if (sessionId === 'demo-session-1') {
            confirmMessage = 'Are you sure you want to delete the demo session? This will remove the demonstration data. You can always refresh the page to restore it.';
        }

        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            // Handle demo session deletion (no API call needed)
            if (sessionId === 'demo-session-1') {
                // Remove demo session from local array
                this.sessions = this.sessions.filter(s => s._id !== sessionId);
                
                // If the demo session was selected, clear the selection
                if (this.currentSession && this.currentSession._id === sessionId) {
                    this.currentSession = null;
                    document.getElementById('activeSessionTitle').textContent = 'Select or Create a Session';
                    this.showNoSessionMessage();
                }
                
                // Hide demo note
                const demoNote = document.querySelector('.demo-note');
                if (demoNote) {
                    demoNote.style.display = 'none';
                }
                
                this.renderSessions();
                this.updateStatistics();
                alert('Demo session deleted successfully! You can refresh the page to restore it.');
                return;
            }

            // Handle real session deletion
            const response = await fetch(`/api/analysis-sessions/${sessionId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Remove session from local array
                this.sessions = this.sessions.filter(s => s._id !== sessionId);
                
                // If the deleted session was selected, clear the selection
                if (this.currentSession && this.currentSession._id === sessionId) {
                    this.currentSession = null;
                    document.getElementById('activeSessionTitle').textContent = 'Select or Create a Session';
                    this.showNoSessionMessage();
                }
                
                this.renderSessions();
                this.updateStatistics();
                alert('Session deleted successfully!');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('Error deleting session:', error);
            alert('Failed to delete session. Please try again.');
        }
    }

    async cleanupTestSessions() {
        const includeDemo = confirm('Do you want to also delete the demo session? Click "OK" to include it, or "Cancel" to keep it.');
        
        if (!confirm('This will delete all test sessions from the database. This action cannot be undone. Continue?')) {
            return;
        }

        try {
            // Get all sessions (include demo if user confirmed)
            const testSessions = includeDemo ? this.sessions : this.sessions.filter(s => s._id !== 'demo-session-1');
            
            if (testSessions.length === 0) {
                alert('No test sessions to clean up.');
                return;
            }

            // Delete each test session
            for (const session of testSessions) {
                try {
                    if (session._id === 'demo-session-1') {
                        // Demo session doesn't need API call
                        console.log('Removing demo session from local array');
                    } else {
                        const response = await fetch(`/api/analysis-sessions/${session._id}`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });

                        if (!response.ok) {
                            console.error(`Failed to delete session ${session._id}: ${response.status}`);
                        }
                    }
                } catch (error) {
                    console.error(`Error deleting session ${session._id}:`, error);
                }
            }

            // Clear local sessions (keep demo only if not included in cleanup)
            this.sessions = includeDemo ? [] : this.sessions.filter(s => s._id === 'demo-session-1');
            
            // Clear current session if it was deleted
            if (this.currentSession && testSessions.some(s => s._id === this.currentSession._id)) {
                this.currentSession = null;
                document.getElementById('activeSessionTitle').textContent = 'Select or Create a Session';
                this.showNoSessionMessage();
            }
            
            // Hide demo note if demo session was included in cleanup
            if (includeDemo) {
                const demoNote = document.querySelector('.demo-note');
                if (demoNote) {
                    demoNote.style.display = 'none';
                }
            }
            
            this.renderSessions();
            this.updateStatistics();
            alert(`Successfully cleaned up ${testSessions.length} test session(s).`);
        } catch (error) {
            console.error('Error during cleanup:', error);
            alert('Error during cleanup. Please try again.');
        }
    }

    async addDataPoint() {
        if (!this.currentSession) return;

        const formData = new FormData(document.getElementById('addDataPointForm'));
        const toolId = formData.get('sourceTool');
        const tool = this.tools.find(t => (t._id || t.id) === toolId);

        // Validate required fields
        const dataType = formData.get('dataType');
        const dataKey = formData.get('dataKey');
        const dataValue = formData.get('dataValue');
        
        if (!dataType || !dataKey || !dataValue || !toolId) {
            alert('Please fill in all required fields');
            return;
        }

        const dataPoint = {
            type: dataType,
            key: dataKey,
            value: dataValue,
            confidence: parseInt(formData.get('confidence')),
            tags: formData.get('tags').split(',').map(t => t.trim()).filter(t => t),
            enrichment: {
                riskScore: 0, // Default risk score
                verificationSource: 'manual',
                additionalContext: ''
            },
            source: {
                tool: toolId,
                toolName: tool?.name || 'Unknown',
                category: tool?.category || 'unknown',
                reliability: tool?.reliability || 0.8,
                timestamp: new Date()
            }
        };

        try {
            const response = await fetch(`/api/analysis-sessions/${this.currentSession._id}/data-points`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataPoint)
            });

            if (response.ok) {
                const updatedSession = await response.json();
                console.log('Updated session from backend:', updatedSession);
                
                const sessionIndex = this.sessions.findIndex(s => s._id === this.currentSession._id);
                if (sessionIndex !== -1) {
                    this.sessions[sessionIndex] = updatedSession;
                    this.currentSession = updatedSession;
                }
                
                // Force refresh the analytics display
                this.updateSessionContent();
                alert('Data point added successfully!');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('Error adding data point:', error);
            // Mock data point addition for development (since backend is not available)
            this.currentSession.dataPoints.push(dataPoint);
            
            // Recalculate analytics
            this.recalculateAnalytics();
            
            // Update the session in the sessions array
            const sessionIndex = this.sessions.findIndex(s => s._id === this.currentSession._id);
            if (sessionIndex !== -1) {
                this.sessions[sessionIndex] = this.currentSession;
            }
            
            alert('Data point added successfully!');
        }

        // Force refresh all views to show updated analytics
        this.updateSessionContent();
        this.updateStatistics();
        
        // Force refresh the current tab to show updated data
        const activeTab = document.querySelector('.tab.active')?.dataset.tab || 'overview';
        this.switchTab(activeTab);
        document.getElementById('addDataPointModal').style.display = 'none';
        document.getElementById('addDataPointForm').reset();
        document.getElementById('confidenceValue').textContent = '50%';
        document.getElementById('confidence').value = 50;
    }

    updateStatistics() {
        // Filter out demo session and test sessions from statistics
        const nonDemoSessions = this.sessions.filter(s => 
            s._id !== 'demo-session-1' && 
            !s.title.includes('Test') && 
            !s.title.includes('test') &&
            !s.title.includes('Demo')
        );
        
        console.log('All sessions:', this.sessions.map(s => ({ id: s._id, title: s.title, status: s.status })));
        console.log('Non-demo sessions:', nonDemoSessions.map(s => ({ id: s._id, title: s.title, status: s.status })));
        
        const totalSessions = nonDemoSessions.filter(s => s.status === 'active').length;
        const totalDataPoints = nonDemoSessions.reduce((sum, s) => sum + (s.analytics?.totalDataPoints || 0), 0);
        const toolsUsed = new Set();
        nonDemoSessions.forEach(s => {
            (s.dataPoints || []).forEach(dp => {
                if (dp.source?.tool) toolsUsed.add(dp.source.tool);
            });
        });

        let avgConfidence = 0;
        if (totalDataPoints > 0) {
            const totalConfidence = nonDemoSessions.reduce((sum, s) => {
                return sum + (s.dataPoints || []).reduce((dpSum, dp) => dpSum + (dp.confidence || 0), 0);
            }, 0);
            avgConfidence = Math.round(totalConfidence / totalDataPoints);
        }

        console.log('Statistics calculated:', { totalSessions, totalDataPoints, toolsUsed: toolsUsed.size, avgConfidence });

        document.getElementById('totalSessions').textContent = totalSessions;
        document.getElementById('totalDataPoints').textContent = totalDataPoints;
        document.getElementById('toolsUsed').textContent = toolsUsed.size;
        document.getElementById('avgConfidence').textContent = `${avgConfidence}%`;
        
        // Show/hide demo exclusion notes based on whether demo session exists
        const demoSessionExists = this.sessions.some(s => s._id === 'demo-session-1');
        const statNotes = document.querySelectorAll('.stat-note');
        statNotes.forEach(note => {
            note.style.display = demoSessionExists ? 'block' : 'none';
        });
    }

    getConfidenceClass(confidence) {
        if (confidence >= 75) return 'confidence-high';
        if (confidence >= 50) return 'confidence-medium';
        return 'confidence-low';
    }

    getRiskIcon(level) {
        switch (level) {
            case 'low': return 'fa-shield-alt';
            case 'medium': return 'fa-exclamation-triangle';
            case 'high': return 'fa-exclamation-circle';
            case 'critical': return 'fa-skull-crossbones';
            default: return 'fa-question-circle';
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.csv';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    // Process imported data
                    console.log('Imported data:', data);
                    alert('Data import functionality coming soon!');
                } catch (error) {
                    alert('Invalid file format. Please use JSON or CSV.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    exportReport() {
        if (!this.currentSession) {
            alert('Please select a session to export');
            return;
        }

        const reportData = {
            session: this.currentSession,
            generatedAt: new Date().toISOString(),
            summary: {
                totalDataPoints: this.currentSession.analytics?.totalDataPoints || 0,
                toolsUsed: this.currentSession.analytics?.toolsUsed || 0,
                confidenceScore: this.currentSession.analytics?.confidenceScore || 0,
                riskLevel: this.currentSession.analytics?.riskAssessment?.level || 'low'
            }
        };

        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentSession.title.replace(/\s+/g, '_')}_report.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize dashboard when DOM is loaded
let dashboard;

console.log('Analysis Dashboard script loaded');

// Initialize immediately if DOM is already loaded, otherwise wait for DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
    initializeDashboard();
}

function initializeDashboard() {
    console.log('Initializing Analysis Dashboard...');
    dashboard = new AnalysisDashboard();
    console.log('Dashboard initialized:', dashboard);
}

// Also expose dashboard globally for debugging
window.dashboard = dashboard;
