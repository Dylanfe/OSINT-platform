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
                this.tools = await response.json();
                this.populateToolsDropdown();
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
        this.tools.forEach(tool => {
            const option = document.createElement('option');
            option.value = tool._id;
            option.textContent = `${tool.name} (${tool.category})`;
            dropdown.appendChild(option);
        });
    }

    async loadSessions() {
        try {
            const response = await fetch('/api/analysis-sessions');
            if (response.ok) {
                this.sessions = await response.json();
            } else {
                // Mock data for development
                this.sessions = [
                    {
                        _id: '1',
                        title: 'Sample Investigation',
                        targetType: 'person',
                        priority: 'medium',
                        status: 'active',
                        dataPoints: [],
                        analytics: {
                            totalDataPoints: 0,
                            toolsUsed: 0,
                            confidenceScore: 0
                        },
                        createdAt: new Date().toISOString()
                    }
                ];
            }
            this.renderSessions();
        } catch (error) {
            console.error('Error loading sessions:', error);
            this.sessions = [];
            this.renderSessions();
        }
    }

    renderSessions() {
        const container = document.getElementById('sessionsList');
        if (!container) return;

        if (this.sessions.length === 0) {
            container.innerHTML = '<p>No analysis sessions found. Create your first session to get started.</p>';
            return;
        }

        container.innerHTML = this.sessions.map(session => `
            <div class="session-card" data-session-id="${session._id}" onclick="dashboard.selectSession('${session._id}')">
                <div class="session-header">
                    <h4>${session.title}</h4>
                    <span class="priority-badge priority-${session.priority}">${session.priority}</span>
                </div>
                <div class="session-meta">
                    <span><i class="fas fa-target"></i> ${session.targetType}</span>
                    <span><i class="fas fa-clock"></i> ${this.formatDate(session.createdAt)}</span>
                </div>
                <div class="session-stats">
                    <span>${session.analytics?.totalDataPoints || 0} data points</span>
                    <span>${session.analytics?.toolsUsed || 0} tools used</span>
                </div>
            </div>
        `).join('');

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
            `;
            document.head.appendChild(style);
        }
    }

    selectSession(sessionId) {
        this.currentSession = this.sessions.find(s => s._id === sessionId);
        if (!this.currentSession) return;

        // Update active session styling
        document.querySelectorAll('.session-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelector(`[data-session-id="${sessionId}"]`)?.classList.add('active');

        // Update session title
        document.getElementById('activeSessionTitle').textContent = this.currentSession.title;

        // Update content based on current tab
        this.updateSessionContent();
    }

    updateSessionContent() {
        if (!this.currentSession) return;

        const activeTab = document.querySelector('.tab.active')?.dataset.tab || 'overview';
        this.switchTab(activeTab);
    }

    switchTab(tabName) {
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
                this.renderOverview();
                break;
            case 'data':
                this.renderDataPoints();
                break;
            case 'analytics':
                this.renderAnalytics();
                break;
            case 'visualizations':
                this.renderVisualizations();
                break;
        }
    }

    renderOverview() {
        const container = document.getElementById('sessionOverview');
        if (!container || !this.currentSession) return;

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
                            <span class="stat-number">${this.currentSession.analytics?.confidenceScore || 0}%</span>
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

        const analytics = this.currentSession.analytics || {};
        const patterns = analytics.patterns || [];
        const timeline = analytics.timeline || [];
        const riskFactors = analytics.riskAssessment?.factors || [];

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
                    ` : '<p>No patterns detected yet.</p>'}
                </div>
                
                <div class="analytics-section">
                    <h4>Risk Factors</h4>
                    ${riskFactors.length > 0 ? `
                        <ul class="risk-factors-list">
                            ${riskFactors.map(factor => `<li>${factor}</li>`).join('')}
                        </ul>
                    ` : '<p>No risk factors identified.</p>'}
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

        this.renderTimeline();
        this.renderDataDistributionChart();
        this.renderNetworkGraph();
    }

    renderTimeline() {
        const container = document.getElementById('timelineContainer');
        if (!container || !this.currentSession) return;

        const timeline = this.currentSession.analytics?.timeline || [];

        if (timeline.length === 0) {
            container.innerHTML = '<p>No timeline data available.</p>';
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

        const ctx = canvas.getContext('2d');
        const dataPoints = this.currentSession.dataPoints || [];

        // Count data types
        const typeCounts = {};
        dataPoints.forEach(dp => {
            typeCounts[dp.type] = (typeCounts[dp.type] || 0) + 1;
        });

        if (this.charts.dataDistribution) {
            this.charts.dataDistribution.destroy();
        }

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
        const formData = new FormData(document.getElementById('newSessionForm'));
        const sessionData = {
            title: formData.get('sessionTitle'),
            targetType: formData.get('targetType'),
            priority: formData.get('priority'),
            description: formData.get('sessionDescription')
        };

        try {
            const response = await fetch('/api/analysis-sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sessionData)
            });

            if (response.ok) {
                const newSession = await response.json();
                this.sessions.push(newSession);
                this.renderSessions();
                this.selectSession(newSession._id);
                document.getElementById('newSessionModal').style.display = 'none';
                document.getElementById('newSessionForm').reset();
            } else {
                alert('Failed to create session');
            }
        } catch (error) {
            console.error('Error creating session:', error);
            // Mock session creation for development
            const mockSession = {
                _id: Date.now().toString(),
                ...sessionData,
                status: 'active',
                dataPoints: [],
                analytics: {
                    totalDataPoints: 0,
                    toolsUsed: 0,
                    confidenceScore: 0
                },
                createdAt: new Date().toISOString()
            };
            this.sessions.push(mockSession);
            this.renderSessions();
            this.selectSession(mockSession._id);
            document.getElementById('newSessionModal').style.display = 'none';
            document.getElementById('newSessionForm').reset();
        }
    }

    async addDataPoint() {
        if (!this.currentSession) return;

        const formData = new FormData(document.getElementById('addDataPointForm'));
        const toolId = formData.get('sourceTool');
        const tool = this.tools.find(t => t._id === toolId);

        const dataPoint = {
            type: formData.get('dataType'),
            key: formData.get('dataKey'),
            value: formData.get('dataValue'),
            confidence: parseInt(formData.get('confidence')),
            tags: formData.get('tags').split(',').map(t => t.trim()).filter(t => t),
            source: {
                tool: toolId,
                toolName: tool?.name || 'Unknown',
                category: tool?.category || 'unknown',
                reliability: tool?.reliability || 'medium',
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
                const sessionIndex = this.sessions.findIndex(s => s._id === this.currentSession._id);
                if (sessionIndex !== -1) {
                    this.sessions[sessionIndex] = updatedSession;
                    this.currentSession = updatedSession;
                }
            } else {
                // Mock data point addition for development
                this.currentSession.dataPoints.push(dataPoint);
                this.currentSession.analytics.totalDataPoints = this.currentSession.dataPoints.length;
                
                // Update tools used count
                const uniqueTools = new Set(this.currentSession.dataPoints.map(dp => dp.source.tool));
                this.currentSession.analytics.toolsUsed = uniqueTools.size;
                
                // Update confidence score
                const totalConfidence = this.currentSession.dataPoints.reduce((sum, dp) => sum + dp.confidence, 0);
                this.currentSession.analytics.confidenceScore = Math.round(totalConfidence / this.currentSession.dataPoints.length);
            }

            this.updateSessionContent();
            this.updateStatistics();
            document.getElementById('addDataPointModal').style.display = 'none';
            document.getElementById('addDataPointForm').reset();
            document.getElementById('confidenceValue').textContent = '50%';
            document.getElementById('confidence').value = 50;

        } catch (error) {
            console.error('Error adding data point:', error);
            alert('Failed to add data point');
        }
    }

    updateStatistics() {
        const totalSessions = this.sessions.filter(s => s.status === 'active').length;
        const totalDataPoints = this.sessions.reduce((sum, s) => sum + (s.analytics?.totalDataPoints || 0), 0);
        const toolsUsed = new Set();
        this.sessions.forEach(s => {
            (s.dataPoints || []).forEach(dp => {
                if (dp.source?.tool) toolsUsed.add(dp.source.tool);
            });
        });

        let avgConfidence = 0;
        if (totalDataPoints > 0) {
            const totalConfidence = this.sessions.reduce((sum, s) => {
                return sum + (s.dataPoints || []).reduce((dpSum, dp) => dpSum + (dp.confidence || 0), 0);
            }, 0);
            avgConfidence = Math.round(totalConfidence / totalDataPoints);
        }

        document.getElementById('totalSessions').textContent = totalSessions;
        document.getElementById('totalDataPoints').textContent = totalDataPoints;
        document.getElementById('toolsUsed').textContent = toolsUsed.size;
        document.getElementById('avgConfidence').textContent = `${avgConfidence}%`;
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
