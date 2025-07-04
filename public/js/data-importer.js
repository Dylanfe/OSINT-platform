class OSINTDataImporter {
    constructor() {
        this.supportedFormats = ['json', 'csv', 'xml', 'txt'];
        this.dataProcessors = {
            shodan: this.processShodanData.bind(this),
            virustotal: this.processVirusTotalData.bind(this),
            whois: this.processWhoisData.bind(this),
            maltego: this.processMaltegoData.bind(this),
            spiderfoot: this.processSpiderFootData.bind(this),
            theHarvester: this.processHarvesterData.bind(this),
            amass: this.processAmassData.bind(this),
            nmap: this.processNmapData.bind(this),
            custom: this.processCustomData.bind(this)
        };
        this.init();
    }

    init() {
        this.setupImportUI();
        this.setupEventListeners();
    }

    setupImportUI() {
        // Check if import modal already exists
        if (document.getElementById('dataImportModal')) return;

        const modalHTML = `
            <div id="dataImportModal" class="modal">
                <div class="modal-content" style="max-width: 900px;">
                    <span class="close" onclick="this.closest('.modal').style.display='none'">&times;</span>
                    <h3><i class="fas fa-upload"></i> Import OSINT Data</h3>
                    
                    <div class="import-tabs">
                        <button class="import-tab active" data-tab="upload">File Upload</button>
                        <button class="import-tab" data-tab="paste">Paste Data</button>
                        <button class="import-tab" data-tab="api">API Import</button>
                        <button class="import-tab" data-tab="bulk">Bulk Import</button>
                    </div>
                    
                    <!-- File Upload Tab -->
                    <div id="upload-tab" class="import-tab-content active">
                        <div class="form-group">
                            <label class="form-label">Select Data Source</label>
                            <select id="dataSource" class="form-select">
                                <option value="custom">Custom/Generic Data</option>
                                <option value="shodan">Shodan Export</option>
                                <option value="virustotal">VirusTotal Report</option>
                                <option value="whois">WHOIS Data</option>
                                <option value="maltego">Maltego Export</option>
                                <option value="spiderfoot">SpiderFoot Results</option>
                                <option value="theHarvester">theHarvester Output</option>
                                <option value="amass">OWASP Amass Results</option>
                                <option value="nmap">Nmap Scan Results</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Upload Files</label>
                            <div class="file-drop-zone" id="fileDropZone">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <p>Drag and drop files here or click to browse</p>
                                <p class="file-types">Supported: JSON, CSV, XML, TXT</p>
                                <input type="file" id="fileInput" multiple accept=".json,.csv,.xml,.txt" style="display: none;">
                            </div>
                        </div>
                        
                        <div id="fileList" class="file-list"></div>
                    </div>
                    
                    <!-- Paste Data Tab -->
                    <div id="paste-tab" class="import-tab-content">
                        <div class="form-group">
                            <label class="form-label">Data Format</label>
                            <select id="pasteFormat" class="form-select">
                                <option value="json">JSON</option>
                                <option value="csv">CSV</option>
                                <option value="xml">XML</option>
                                <option value="txt">Plain Text</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Paste Your Data</label>
                            <textarea id="pasteData" class="form-textarea" rows="15" 
                                placeholder="Paste your OSINT data here..."></textarea>
                        </div>
                    </div>
                    
                    <!-- API Import Tab -->
                    <div id="api-tab" class="import-tab-content">
                        <div class="form-group">
                            <label class="form-label">API Endpoint</label>
                            <input type="url" id="apiEndpoint" class="form-input" 
                                placeholder="https://api.example.com/data">
                        </div>
                        
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label">API Key (if required)</label>
                                <input type="password" id="apiKey" class="form-input" 
                                    placeholder="Your API key">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Request Method</label>
                                <select id="apiMethod" class="form-select">
                                    <option value="GET">GET</option>
                                    <option value="POST">POST</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Headers (JSON format)</label>
                            <textarea id="apiHeaders" class="form-textarea" rows="4" 
                                placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'></textarea>
                        </div>
                    </div>
                    
                    <!-- Bulk Import Tab -->
                    <div id="bulk-tab" class="import-tab-content">
                        <div class="form-group">
                            <label class="form-label">Bulk Import Type</label>
                            <select id="bulkType" class="form-select">
                                <option value="domains">Domain List</option>
                                <option value="ips">IP Address List</option>
                                <option value="emails">Email List</option>
                                <option value="urls">URL List</option>
                                <option value="hashes">Hash List</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Bulk Data (one per line)</label>
                            <textarea id="bulkData" class="form-textarea" rows="15" 
                                placeholder="Enter one item per line...
example.com
test.domain.com
another.site.org"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Auto-assign to Tools</label>
                            <div class="checkbox-group">
                                <label><input type="checkbox" id="autoAssignTools"> Automatically suggest appropriate tools</label>
                                <label><input type="checkbox" id="autoConfidence"> Set confidence based on source reliability</label>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Import Settings -->
                    <div class="import-settings">
                        <h4>Import Settings</h4>
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label">Default Confidence Level</label>
                                <input type="range" id="defaultConfidence" min="0" max="100" value="50" class="form-input">
                                <span id="confidenceDisplay">50%</span>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Import to Session</label>
                                <select id="targetSession" class="form-select">
                                    <option value="">Select session...</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Default Tags (comma-separated)</label>
                            <input type="text" id="defaultTags" class="form-input" 
                                placeholder="imported, bulk-data, automated">
                        </div>
                    </div>
                    
                    <div class="import-actions">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').style.display='none'">Cancel</button>
                        <button type="button" class="btn btn-primary" id="processImportBtn">
                            <i class="fas fa-cogs"></i> Process Import
                        </button>
                    </div>
                    
                    <div id="importProgress" class="import-progress" style="display: none;">
                        <div class="progress-bar">
                            <div class="progress" id="progressBar"></div>
                        </div>
                        <div id="progressText">Processing...</div>
                    </div>
                    
                    <div id="importResults" class="import-results" style="display: none;">
                        <h4>Import Results</h4>
                        <div id="resultsContent"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.addImportStyles();
    }

    addImportStyles() {
        if (document.getElementById('import-styles')) return;

        const style = document.createElement('style');
        style.id = 'import-styles';
        style.textContent = `
            .import-tabs {
                display: flex;
                border-bottom: 1px solid var(--border-color);
                margin-bottom: 2rem;
            }
            
            .import-tab {
                background: none;
                border: none;
                padding: 1rem 1.5rem;
                color: var(--text-secondary);
                cursor: pointer;
                font-weight: 500;
                transition: all 0.3s ease;
                border-bottom: 2px solid transparent;
            }
            
            .import-tab.active {
                color: var(--accent-color);
                border-bottom-color: var(--accent-color);
            }
            
            .import-tab-content {
                display: none;
            }
            
            .import-tab-content.active {
                display: block;
            }
            
            .file-drop-zone {
                border: 2px dashed var(--border-color);
                border-radius: 8px;
                padding: 3rem 2rem;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                background: var(--bg-primary);
            }
            
            .file-drop-zone:hover,
            .file-drop-zone.dragover {
                border-color: var(--accent-color);
                background: rgba(var(--accent-color-rgb), 0.05);
            }
            
            .file-drop-zone i {
                font-size: 3rem;
                color: var(--accent-color);
                margin-bottom: 1rem;
            }
            
            .file-drop-zone p {
                margin: 0.5rem 0;
                color: var(--text-primary);
            }
            
            .file-types {
                font-size: 0.875rem;
                color: var(--text-secondary);
            }
            
            .file-list {
                margin-top: 1rem;
            }
            
            .file-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem;
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                margin-bottom: 0.5rem;
            }
            
            .file-info {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .file-icon {
                color: var(--accent-color);
            }
            
            .file-actions {
                display: flex;
                gap: 0.5rem;
            }
            
            .import-settings {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                padding: 1.5rem;
                margin: 2rem 0;
            }
            
            .import-settings h4 {
                margin-bottom: 1rem;
                color: var(--text-primary);
            }
            
            .checkbox-group {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .checkbox-group label {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: var(--text-primary);
            }
            
            .import-actions {
                display: flex;
                justify-content: flex-end;
                gap: 1rem;
                margin-top: 2rem;
            }
            
            .import-progress {
                margin-top: 2rem;
                padding: 1rem;
                background: var(--bg-secondary);
                border-radius: 8px;
            }
            
            .progress-bar {
                width: 100%;
                height: 8px;
                background: var(--border-color);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 1rem;
            }
            
            .progress {
                height: 100%;
                background: var(--accent-color);
                transition: width 0.3s ease;
                width: 0%;
            }
            
            .import-results {
                margin-top: 2rem;
                padding: 1rem;
                background: var(--bg-secondary);
                border-radius: 8px;
                border: 1px solid var(--border-color);
            }
            
            .result-summary {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 1rem;
                margin-bottom: 1rem;
            }
            
            .result-stat {
                text-align: center;
                padding: 1rem;
                background: var(--bg-primary);
                border-radius: 4px;
            }
            
            .result-stat-value {
                font-size: 1.5rem;
                font-weight: bold;
                color: var(--accent-color);
            }
            
            .result-stat-label {
                font-size: 0.875rem;
                color: var(--text-secondary);
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('import-tab')) {
                this.switchTab(e.target.dataset.tab);
            }
        });

        // File drop zone
        const dropZone = document.getElementById('fileDropZone');
        const fileInput = document.getElementById('fileInput');

        if (dropZone && fileInput) {
            dropZone.addEventListener('click', () => fileInput.click());
            dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
            dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
            dropZone.addEventListener('drop', this.handleDrop.bind(this));
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }

        // Confidence slider
        const confidenceSlider = document.getElementById('defaultConfidence');
        const confidenceDisplay = document.getElementById('confidenceDisplay');
        if (confidenceSlider && confidenceDisplay) {
            confidenceSlider.addEventListener('input', (e) => {
                confidenceDisplay.textContent = `${e.target.value}%`;
            });
        }

        // Process import button
        document.getElementById('processImportBtn')?.addEventListener('click', () => {
            this.processImport();
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.import-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

        // Update tab content
        document.querySelectorAll('.import-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`)?.classList.add('active');
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        this.handleFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.handleFiles(files);
    }

    handleFiles(files) {
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';

        files.forEach((file, index) => {
            if (this.isValidFileType(file)) {
                this.addFileToList(file, index);
            } else {
                this.showNotification(`Unsupported file type: ${file.name}`, 'warning');
            }
        });
    }

    isValidFileType(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        return this.supportedFormats.includes(extension);
    }

    addFileToList(file, index) {
        const fileList = document.getElementById('fileList');
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-info">
                <i class="fas fa-file file-icon"></i>
                <div>
                    <div>${file.name}</div>
                    <small>${this.formatFileSize(file.size)} • ${file.type || 'Unknown type'}</small>
                </div>
            </div>
            <div class="file-actions">
                <button class="btn btn-sm btn-secondary" onclick="this.closest('.file-item').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        fileList.appendChild(fileItem);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async processImport() {
        const activeTab = document.querySelector('.import-tab.active').dataset.tab;
        
        this.showProgress(true);
        this.updateProgress(0, 'Initializing import...');

        try {
            let data;
            switch (activeTab) {
                case 'upload':
                    data = await this.processFileUpload();
                    break;
                case 'paste':
                    data = await this.processPasteData();
                    break;
                case 'api':
                    data = await this.processApiImport();
                    break;
                case 'bulk':
                    data = await this.processBulkImport();
                    break;
                default:
                    throw new Error('Invalid import method');
            }

            this.updateProgress(50, 'Processing data...');
            const processedData = await this.processData(data);

            this.updateProgress(75, 'Importing to session...');
            const results = await this.importToSession(processedData);

            this.updateProgress(100, 'Import completed!');
            this.showResults(results);

        } catch (error) {
            console.error('Import error:', error);
            this.showNotification(`Import failed: ${error.message}`, 'error');
        } finally {
            setTimeout(() => this.showProgress(false), 1000);
        }
    }

    async processFileUpload() {
        const files = document.querySelectorAll('.file-item');
        const dataSource = document.getElementById('dataSource').value;
        const allData = [];

        for (let i = 0; i < files.length; i++) {
            const fileName = files[i].querySelector('.file-info div div').textContent;
            const fileInput = document.getElementById('fileInput');
            const file = Array.from(fileInput.files).find(f => f.name === fileName);
            
            if (file) {
                const content = await this.readFile(file);
                const parsed = this.parseFileContent(content, file.name);
                const processed = this.dataProcessors[dataSource](parsed, fileName);
                allData.push(...processed);
            }
        }

        return allData;
    }

    async processPasteData() {
        const format = document.getElementById('pasteFormat').value;
        const content = document.getElementById('pasteData').value.trim();
        
        if (!content) {
            throw new Error('No data provided');
        }

        const parsed = this.parseContent(content, format);
        return this.dataProcessors.custom(parsed, 'pasted-data');
    }

    async processApiImport() {
        const endpoint = document.getElementById('apiEndpoint').value;
        const apiKey = document.getElementById('apiKey').value;
        const method = document.getElementById('apiMethod').value;
        const headersText = document.getElementById('apiHeaders').value;

        let headers = {};
        if (headersText) {
            try {
                headers = JSON.parse(headersText);
            } catch (e) {
                throw new Error('Invalid headers JSON format');
            }
        }

        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const response = await fetch(endpoint, {
            method,
            headers
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        return this.dataProcessors.custom(data, 'api-import');
    }

    async processBulkImport() {
        const bulkType = document.getElementById('bulkType').value;
        const bulkData = document.getElementById('bulkData').value.trim();
        const autoAssignTools = document.getElementById('autoAssignTools').checked;
        const autoConfidence = document.getElementById('autoConfidence').checked;

        if (!bulkData) {
            throw new Error('No bulk data provided');
        }

        const items = bulkData.split('\n').filter(item => item.trim());
        const processed = items.map(item => {
            const trimmedItem = item.trim();
            const dataPoint = {
                type: bulkType.slice(0, -1), // Remove 's' from plural
                key: this.getBulkKeyName(bulkType),
                value: trimmedItem,
                confidence: autoConfidence ? this.calculateAutoConfidence(trimmedItem, bulkType) : 50,
                tags: ['bulk-import', bulkType],
                source: {
                    toolName: 'Bulk Import',
                    category: 'data-import',
                    reliability: 'medium',
                    timestamp: new Date()
                }
            };

            if (autoAssignTools) {
                dataPoint.suggestedTools = this.suggestToolsForType(bulkType);
            }

            return dataPoint;
        });

        return processed;
    }

    getBulkKeyName(type) {
        const keyNames = {
            domains: 'Domain Name',
            ips: 'IP Address',
            emails: 'Email Address',
            urls: 'URL',
            hashes: 'File Hash'
        };
        return keyNames[type] || 'Value';
    }

    calculateAutoConfidence(value, type) {
        // Simple heuristics for auto-confidence
        switch (type) {
            case 'domains':
                return this.isValidDomain(value) ? 80 : 30;
            case 'ips':
                return this.isValidIP(value) ? 90 : 20;
            case 'emails':
                return this.isValidEmail(value) ? 85 : 25;
            case 'urls':
                return this.isValidURL(value) ? 75 : 35;
            default:
                return 50;
        }
    }

    suggestToolsForType(type) {
        const suggestions = {
            domains: ['Shodan', 'WhoisXML API', 'urlscan.io', 'Censys'],
            ips: ['Shodan', 'Censys', 'BGPView', 'IPinfo'],
            emails: ['Have I Been Pwned', 'Hunter.io', 'Holehe'],
            urls: ['urlscan.io', 'VirusTotal', 'WebPageTest'],
            hashes: ['VirusTotal', 'Hybrid Analysis', 'Malware Bazaar']
        };
        return suggestions[type] || [];
    }

    isValidDomain(domain) {
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
        return domainRegex.test(domain);
    }

    isValidIP(ip) {
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        return ipRegex.test(ip) && ip.split('.').every(num => parseInt(num) <= 255);
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(e);
            reader.readAsText(file);
        });
    }

    parseFileContent(content, filename) {
        const extension = filename.split('.').pop().toLowerCase();
        return this.parseContent(content, extension);
    }

    parseContent(content, format) {
        switch (format) {
            case 'json':
                return JSON.parse(content);
            case 'csv':
                return this.parseCSV(content);
            case 'xml':
                return this.parseXML(content);
            case 'txt':
                return { raw: content, lines: content.split('\n') };
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    parseCSV(content) {
        const lines = content.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',').map(v => v.trim());
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                data.push(row);
            }
        }

        return { headers, data };
    }

    parseXML(content) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/xml');
        return this.xmlToObject(doc.documentElement);
    }

    xmlToObject(node) {
        const result = {};
        
        if (node.attributes) {
            for (let attr of node.attributes) {
                result[`@${attr.name}`] = attr.value;
            }
        }
        
        if (node.children.length === 0) {
            result.value = node.textContent;
        } else {
            for (let child of node.children) {
                const childObj = this.xmlToObject(child);
                if (result[child.tagName]) {
                    if (!Array.isArray(result[child.tagName])) {
                        result[child.tagName] = [result[child.tagName]];
                    }
                    result[child.tagName].push(childObj);
                } else {
                    result[child.tagName] = childObj;
                }
            }
        }
        
        return result;
    }

    // Data processor methods for different tools
    processShodanData(data, filename) {
        // Process Shodan export format
        const results = [];
        if (data.matches || data.results) {
            const matches = data.matches || data.results;
            matches.forEach(match => {
                results.push({
                    type: 'ip',
                    key: 'IP Address',
                    value: match.ip_str || match.ip,
                    confidence: 85,
                    tags: ['shodan', 'network-scan'],
                    source: {
                        toolName: 'Shodan',
                        category: 'network-analysis',
                        reliability: 'high',
                        timestamp: new Date(match.timestamp || Date.now())
                    },
                    enrichment: {
                        port: match.port,
                        service: match.product,
                        version: match.version,
                        location: match.location
                    }
                });
            });
        }
        return results;
    }

    processVirusTotalData(data, filename) {
        const results = [];
        // Process VirusTotal report format
        if (data.data) {
            const report = data.data;
            results.push({
                type: report.type === 'domain' ? 'domain' : 'hash',
                key: report.type === 'domain' ? 'Domain Name' : 'File Hash',
                value: report.id,
                confidence: 90,
                tags: ['virustotal', 'threat-intel'],
                source: {
                    toolName: 'VirusTotal',
                    category: 'threat-intelligence',
                    reliability: 'high',
                    timestamp: new Date()
                },
                enrichment: {
                    malicious: report.attributes?.last_analysis_stats?.malicious || 0,
                    suspicious: report.attributes?.last_analysis_stats?.suspicious || 0,
                    reputation: report.attributes?.reputation || 0
                }
            });
        }
        return results;
    }

    processWhoisData(data, filename) {
        const results = [];
        // Process WHOIS data
        if (typeof data === 'object' && data.domain) {
            results.push({
                type: 'domain',
                key: 'Domain Name',
                value: data.domain,
                confidence: 95,
                tags: ['whois', 'domain-info'],
                source: {
                    toolName: 'WHOIS',
                    category: 'domain-ip',
                    reliability: 'high',
                    timestamp: new Date()
                },
                enrichment: {
                    registrar: data.registrar,
                    creation_date: data.creation_date,
                    expiry_date: data.expiry_date,
                    nameservers: data.nameservers
                }
            });
        }
        return results;
    }

    processMaltegoData(data, filename) {
        const results = [];
        // Process Maltego export (typically XML or CSV)
        if (data.data && Array.isArray(data.data)) {
            data.data.forEach(entity => {
                const type = this.mapMaltegoEntityType(entity.type || entity.entityType);
                results.push({
                    type: type,
                    key: this.getMaltegoKeyName(type),
                    value: entity.value || entity.displayName,
                    confidence: 75,
                    tags: ['maltego', 'link-analysis'],
                    source: {
                        toolName: 'Maltego',
                        category: 'visualization',
                        reliability: 'medium',
                        timestamp: new Date()
                    },
                    relationships: entity.links || []
                });
            });
        }
        return results;
    }

    processSpiderFootData(data, filename) {
        const results = [];
        // Process SpiderFoot results
        if (Array.isArray(data)) {
            data.forEach(result => {
                results.push({
                    type: this.mapSpiderFootType(result.type),
                    key: result.type,
                    value: result.data,
                    confidence: 70,
                    tags: ['spiderfoot', 'automated'],
                    source: {
                        toolName: 'SpiderFoot',
                        category: 'frameworks',
                        reliability: 'medium',
                        timestamp: new Date(result.generated)
                    }
                });
            });
        }
        return results;
    }

    processHarvesterData(data, filename) {
        const results = [];
        // Process theHarvester output
        if (data.lines) {
            data.lines.forEach(line => {
                if (line.includes('@')) {
                    results.push({
                        type: 'email',
                        key: 'Email Address',
                        value: line.trim(),
                        confidence: 65,
                        tags: ['harvester', 'enumeration'],
                        source: {
                            toolName: 'theHarvester',
                            category: 'email-investigation',
                            reliability: 'medium',
                            timestamp: new Date()
                        }
                    });
                } else if (line.includes('.')) {
                    results.push({
                        type: 'domain',
                        key: 'Subdomain',
                        value: line.trim(),
                        confidence: 60,
                        tags: ['harvester', 'subdomain'],
                        source: {
                            toolName: 'theHarvester',
                            category: 'domain-ip',
                            reliability: 'medium',
                            timestamp: new Date()
                        }
                    });
                }
            });
        }
        return results;
    }

    processAmassData(data, filename) {
        const results = [];
        // Process OWASP Amass results
        if (data.lines) {
            data.lines.forEach(line => {
                const trimmed = line.trim();
                if (trimmed && this.isValidDomain(trimmed)) {
                    results.push({
                        type: 'domain',
                        key: 'Subdomain',
                        value: trimmed,
                        confidence: 80,
                        tags: ['amass', 'subdomain-enum'],
                        source: {
                            toolName: 'OWASP Amass',
                            category: 'domain-ip',
                            reliability: 'high',
                            timestamp: new Date()
                        }
                    });
                }
            });
        }
        return results;
    }

    processNmapData(data, filename) {
        const results = [];
        // Process Nmap scan results (simplified)
        if (data.hosts || (data.nmaprun && data.nmaprun.host)) {
            const hosts = data.hosts || (Array.isArray(data.nmaprun.host) ? data.nmaprun.host : [data.nmaprun.host]);
            hosts.forEach(host => {
                const ip = host.address || host['@addr'];
                if (ip) {
                    results.push({
                        type: 'ip',
                        key: 'IP Address',
                        value: ip,
                        confidence: 95,
                        tags: ['nmap', 'network-scan'],
                        source: {
                            toolName: 'Nmap',
                            category: 'network-analysis',
                            reliability: 'high',
                            timestamp: new Date()
                        },
                        enrichment: {
                            status: host.status || host['@state'],
                            ports: host.ports,
                            os: host.os
                        }
                    });
                }
            });
        }
        return results;
    }

    processCustomData(data, filename) {
        const results = [];
        // Generic processor for custom data
        if (Array.isArray(data)) {
            data.forEach(item => {
                if (typeof item === 'object') {
                    Object.entries(item).forEach(([key, value]) => {
                        results.push({
                            type: 'other',
                            key: key,
                            value: String(value),
                            confidence: 50,
                            tags: ['custom-import', filename],
                            source: {
                                toolName: 'Custom Import',
                                category: 'data-import',
                                reliability: 'medium',
                                timestamp: new Date()
                            }
                        });
                    });
                } else {
                    results.push({
                        type: 'text',
                        key: 'Custom Data',
                        value: String(item),
                        confidence: 50,
                        tags: ['custom-import', filename],
                        source: {
                            toolName: 'Custom Import',
                            category: 'data-import',
                            reliability: 'medium',
                            timestamp: new Date()
                        }
                    });
                }
            });
        } else if (data.data && Array.isArray(data.data)) {
            return this.processCustomData(data.data, filename);
        } else if (data.lines) {
            data.lines.forEach(line => {
                if (line.trim()) {
                    results.push({
                        type: 'text',
                        key: 'Line Data',
                        value: line.trim(),
                        confidence: 50,
                        tags: ['custom-import', filename],
                        source: {
                            toolName: 'Custom Import',
                            category: 'data-import',
                            reliability: 'medium',
                            timestamp: new Date()
                        }
                    });
                }
            });
        }
        return results;
    }

    mapMaltegoEntityType(entityType) {
        const typeMap = {
            'maltego.Domain': 'domain',
            'maltego.IPv4Address': 'ip',
            'maltego.EmailAddress': 'email',
            'maltego.Person': 'name',
            'maltego.PhoneNumber': 'phone',
            'maltego.URL': 'url'
        };
        return typeMap[entityType] || 'other';
    }

    getMaltegoKeyName(type) {
        const keyMap = {
            domain: 'Domain Name',
            ip: 'IP Address',
            email: 'Email Address',
            name: 'Person Name',
            phone: 'Phone Number',
            url: 'URL'
        };
        return keyMap[type] || 'Value';
    }

    mapSpiderFootType(spiderFootType) {
        const typeMap = {
            'IP_ADDRESS': 'ip',
            'DOMAIN_NAME': 'domain',
            'EMAILADDR': 'email',
            'URL': 'url',
            'HASH': 'hash'
        };
        return typeMap[spiderFootType] || 'other';
    }

    async processData(rawData) {
        const defaultConfidence = parseInt(document.getElementById('defaultConfidence').value);
        const defaultTags = document.getElementById('defaultTags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);

        return rawData.map(item => ({
            ...item,
            confidence: item.confidence || defaultConfidence,
            tags: [...(item.tags || []), ...defaultTags].filter((tag, index, arr) => arr.indexOf(tag) === index)
        }));
    }

    async importToSession(processedData) {
        const targetSessionId = document.getElementById('targetSession').value;
        
        if (!targetSessionId) {
            throw new Error('Please select a target session');
        }

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const dataPoint of processedData) {
            try {
                const response = await fetch(`/api/analysis-sessions/${targetSessionId}/data-points`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dataPoint)
                });

                if (response.ok) {
                    successCount++;
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (error) {
                errorCount++;
                errors.push(`${dataPoint.key}: ${error.message}`);
            }
        }

        return {
            total: processedData.length,
            successful: successCount,
            failed: errorCount,
            errors: errors.slice(0, 10) // Show only first 10 errors
        };
    }

    showProgress(show) {
        const progressDiv = document.getElementById('importProgress');
        progressDiv.style.display = show ? 'block' : 'none';
    }

    updateProgress(percent, text) {
        document.getElementById('progressBar').style.width = `${percent}%`;
        document.getElementById('progressText').textContent = text;
    }

    showResults(results) {
        const resultsDiv = document.getElementById('importResults');
        const resultsContent = document.getElementById('resultsContent');
        
        resultsContent.innerHTML = `
            <div class="result-summary">
                <div class="result-stat">
                    <div class="result-stat-value">${results.total}</div>
                    <div class="result-stat-label">Total Items</div>
                </div>
                <div class="result-stat">
                    <div class="result-stat-value">${results.successful}</div>
                    <div class="result-stat-label">Successful</div>
                </div>
                <div class="result-stat">
                    <div class="result-stat-value">${results.failed}</div>
                    <div class="result-stat-label">Failed</div>
                </div>
                <div class="result-stat">
                    <div class="result-stat-value">${Math.round((results.successful / results.total) * 100)}%</div>
                    <div class="result-stat-label">Success Rate</div>
                </div>
            </div>
            
            ${results.errors.length > 0 ? `
                <div style="margin-top: 1rem;">
                    <h5>Errors (showing first 10):</h5>
                    <ul style="color: var(--text-secondary); font-size: 0.875rem;">
                        ${results.errors.map(error => `<li>${error}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
        
        resultsDiv.style.display = 'block';
    }

    showNotification(message, type = 'info') {
        // Use the existing notification system from the main app
        if (window.osintHub && window.osintHub.showNotification) {
            window.osintHub.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    // Public method to open the import modal
    openImportModal() {
        document.getElementById('dataImportModal').style.display = 'block';
        this.loadAvailableSessions();
    }

    loadAvailableSessions() {
        // Load available sessions for the dropdown
        const sessionSelect = document.getElementById('targetSession');
        
        // Mock sessions for now - replace with actual API call
        const mockSessions = [
            { id: '1', title: 'Sample Investigation' },
            { id: '2', title: 'Network Analysis' },
            { id: '3', title: 'Threat Assessment' }
        ];

        sessionSelect.innerHTML = '<option value="">Select session...</option>' +
            mockSessions.map(session => 
                `<option value="${session.id}">${session.title}</option>`
            ).join('');
    }
}

// Initialize the data importer
window.dataImporter = new OSINTDataImporter();

// Export the class for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OSINTDataImporter;
}
