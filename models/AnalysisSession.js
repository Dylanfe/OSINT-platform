const mongoose = require('mongoose');

const DataPointSchema = new mongoose.Schema({
    source: {
        tool: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tool',
            required: true
        },
        toolName: String,
        category: String,
        reliability: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    type: {
        type: String,
        enum: [
            'email', 'domain', 'ip', 'username', 'phone', 'name', 'company',
            'hash', 'url', 'image', 'coordinates', 'social-profile',
            'cryptocurrency-address', 'file', 'text', 'breach-data',
            'network-data', 'metadata', 'geolocation', 'temporal', 'other'
        ],
        required: true
    },
    key: {
        type: String,
        required: true,
        trim: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    confidence: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
    },
    tags: [{
        type: String,
        trim: true
    }],
    relationships: [{
        relatedTo: String,
        relationshipType: String,
        strength: Number
    }],
    enrichment: {
        verified: Boolean,
        verificationSource: String,
        additionalContext: String,
        riskScore: Number,
        lastUpdated: Date
    }
});

const AnalysisSessionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetType: {
        type: String,
        enum: ['person', 'organization', 'domain', 'ip', 'incident', 'investigation', 'threat', 'other'],
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'archived', 'suspended'],
        default: 'active'
    },
    dataPoints: [DataPointSchema],
    analytics: {
        totalDataPoints: {
            type: Number,
            default: 0
        },
        toolsUsed: {
            type: Number,
            default: 0
        },
        confidenceScore: {
            type: Number,
            default: 0
        },
        riskAssessment: {
            level: {
                type: String,
                enum: ['low', 'medium', 'high', 'critical'],
                default: 'low'
            },
            factors: [String],
            score: Number
        },
        patterns: [{
            type: { type: String },
            description: String,
            strength: Number,
            evidence: [String]
        }],
        correlations: [{
            field1: String,
            field2: String,
            strength: Number,
            type: String
        }],
        timeline: [{
            date: Date,
            event: String,
            source: String,
            significance: String
        }],
        geolocations: [{
            latitude: Number,
            longitude: Number,
            address: String,
            confidence: Number,
            source: String
        }],
        networks: [{
            type: String, // social, technical, organizational
            nodes: [String],
            connections: [{
                from: String,
                to: String,
                weight: Number,
                type: String
            }]
        }]
    },
    visualizations: [{
        type: {
            type: String,
            enum: ['network', 'timeline', 'heatmap', 'chart', 'map', 'graph', 'tree'],
            required: true
        },
        title: String,
        data: mongoose.Schema.Types.Mixed,
        config: mongoose.Schema.Types.Mixed,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    reports: [{
        type: {
            type: String,
            enum: ['summary', 'detailed', 'technical', 'executive', 'timeline'],
            required: true
        },
        format: {
            type: String,
            enum: ['html', 'pdf', 'json', 'csv'],
            default: 'html'
        },
        content: String,
        generatedAt: {
            type: Date,
            default: Date.now
        },
        downloadUrl: String
    }],
    collaboration: {
        shared: {
            type: Boolean,
            default: false
        },
        sharedWith: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            permission: {
                type: String,
                enum: ['view', 'edit', 'admin'],
                default: 'view'
            },
            sharedAt: {
                type: Date,
                default: Date.now
            }
        }],
        comments: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            message: String,
            timestamp: {
                type: Date,
                default: Date.now
            },
            attachments: [String]
        }]
    },
    settings: {
        autoAnalysis: {
            type: Boolean,
            default: true
        },
        notifications: {
            type: Boolean,
            default: true
        },
        dataRetention: {
            type: Number,
            default: 365 // days
        },
        exportFormat: {
            type: String,
            enum: ['json', 'csv', 'xml'],
            default: 'json'
        }
    },
    metadata: {
        lastAnalyzed: Date,
        dataSourceCount: {
            type: Number,
            default: 0
        },
        qualityScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        completenessScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Indexes for better performance
AnalysisSessionSchema.index({ user: 1, status: 1 });
AnalysisSessionSchema.index({ targetType: 1, priority: 1 });
AnalysisSessionSchema.index({ 'dataPoints.type': 1 });
AnalysisSessionSchema.index({ 'dataPoints.source.tool': 1 });
AnalysisSessionSchema.index({ createdAt: -1 });

// Pre-save middleware to update analytics
AnalysisSessionSchema.pre('save', function(next) {
    if (this.isModified('dataPoints')) {
        this.analytics.totalDataPoints = this.dataPoints.length;
        
        // Calculate unique tools used
        const uniqueTools = new Set(this.dataPoints.map(dp => dp.source.tool.toString()));
        this.analytics.toolsUsed = uniqueTools.size;
        
        // Calculate average confidence score
        if (this.dataPoints.length > 0) {
            const totalConfidence = this.dataPoints.reduce((sum, dp) => sum + (dp.confidence || 50), 0);
            this.analytics.confidenceScore = Math.round(totalConfidence / this.dataPoints.length);
        }
        
        // Update metadata
        this.metadata.lastAnalyzed = new Date();
        this.metadata.dataSourceCount = uniqueTools.size;
    }
    next();
});

// Method to add data point
AnalysisSessionSchema.methods.addDataPoint = function(dataPoint) {
    this.dataPoints.push(dataPoint);
    return this.save();
};

// Method to analyze patterns
AnalysisSessionSchema.methods.analyzePatterns = function() {
    const patterns = [];
    const dataByType = {};
    
    // Group data by type
    this.dataPoints.forEach(dp => {
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
    if (this.dataPoints.length > 1) {
        // Check for correlation between different data types
        const ipData = this.dataPoints.filter(dp => dp.type === 'ip');
        const domainData = this.dataPoints.filter(dp => dp.type === 'domain');
        
        if (ipData.length > 0 && domainData.length > 0) {
            patterns.push({
                type: 'cross_correlation',
                description: 'IP and domain data correlation potential',
                strength: 75,
                evidence: ['IP addresses and domains found in same session']
            });
        }
    }
    
    this.analytics.patterns = patterns;
    return this.save();
};

// Method to generate timeline
AnalysisSessionSchema.methods.generateTimeline = function() {
    const timeline = [];
    
    this.dataPoints.forEach(dp => {
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
    
    this.analytics.timeline = timeline;
    return this.save();
};

// Method to calculate risk assessment
AnalysisSessionSchema.methods.calculateRisk = function() {
    let riskScore = 0;
    const factors = [];
    
    // Check for high-risk indicators
    this.dataPoints.forEach(dp => {
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
    const uniqueTypes = new Set(this.dataPoints.map(dp => dp.type));
    if (uniqueTypes.size > 3) {
        riskScore += 8;
        factors.push('Multiple data types collected');
    }
    
    // Determine risk level
    let level = 'low';
    if (riskScore > 75) level = 'critical';
    else if (riskScore > 50) level = 'high';
    else if (riskScore > 25) level = 'medium';
    
    this.analytics.riskAssessment = {
        level,
        factors,
        score: Math.min(riskScore, 100)
    };
    
    return this.save();
};

// Static method to get analysis statistics
AnalysisSessionSchema.statics.getStatistics = function(userId) {
    return this.aggregate([
        { $match: { user: mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: null,
                totalSessions: { $sum: 1 },
                totalDataPoints: { $sum: '$analytics.totalDataPoints' },
                avgConfidence: { $avg: '$analytics.confidenceScore' },
                activeSessions: {
                    $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                },
                completedSessions: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                }
            }
        }
    ]);
};

module.exports = mongoose.model('AnalysisSession', AnalysisSessionSchema);
