const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Initialize Express app
const app = express();

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:5000',
        'https://osint-platform.web.app',
        'https://osint-platform.firebaseapp.com',
        'https://osint-platform.web.app',
        'https://osint-platform.firebaseapp.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// MongoDB connection
let MONGODB_URI;
let isMongoConnected = false;

try {
    MONGODB_URI = functions.config().mongodb?.uri || process.env.MONGODB_URI;
    if (!MONGODB_URI || !MONGODB_URI.startsWith('mongodb')) {
        console.log('MongoDB URI not found in Firebase config, using fallback');
        MONGODB_URI = 'mongodb://localhost:27017/osint-hub';
    }
} catch (error) {
    console.log('Error getting Firebase config, using fallback MongoDB URI');
    MONGODB_URI = 'mongodb://localhost:27017/osint-hub';
}

if (MONGODB_URI.startsWith('mongodb')) {
    mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('Connected to MongoDB');
        isMongoConnected = true;
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        isMongoConnected = false;
    });
} else {
    console.log('Invalid MongoDB URI format, skipping connection');
    isMongoConnected = false;
}

// Models
const toolSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    url: { type: String, required: true },
    pricing: { type: String, enum: ['free', 'freemium', 'paid'], default: 'free' },
    opsecRisk: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    tags: [String],
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalUses: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Tool = mongoose.model('Tool', toolSchema);

// Data Point Schema
const DataPointSchema = new mongoose.Schema({
    source: {
        tool: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tool',
            required: false
        },
        toolName: String,
        category: String,
        reliability: {
            type: Number,
            min: 0,
            max: 1,
            default: 0.8
        },
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

// Analysis Session Schema
const analysisSessionSchema = new mongoose.Schema({
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
        required: false // Optional for demo purposes
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
            type: String,
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
            default: 365
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

const AnalysisSession = mongoose.model('AnalysisSession', analysisSessionSchema);

// Development mode - use optional auth for demo purposes
const isDevelopment = process.env.NODE_ENV !== 'production';

// Simple auth middleware for demo
const optionalAuth = (req, res, next) => {
    // In development, allow requests without authentication
    req.user = { id: 'demo-user' };
    next();
};

// Analysis Session Routes

// @desc    Get all analysis sessions for user
// @route   GET /api/analysis-sessions
// @access  Private (or public in development)
app.get('/api/analysis-sessions', optionalAuth, async (req, res) => {
    try {
        let query = {};
        
        // Always return demo session in production when MongoDB is not connected
        const demoSession = {
            _id: 'demo-session-1',
            title: 'Demo Analysis Session',
            description: 'This is a demo session for testing purposes',
            targetType: 'person',
            priority: 'medium',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            dataPoints: [
                {
                    _id: 'dp-1',
                    type: 'email',
                    key: 'Email Address',
                    value: 'john.doe@example.com',
                    confidence: 85,
                    tags: ['verified', 'primary'],
                    relationships: [],
                    enrichment: {
                        verified: true,
                        verificationSource: 'Email Finder',
                        additionalContext: 'Primary email address',
                        riskScore: 5,
                        lastUpdated: new Date()
                    },
                    source: {
                        tool: null,
                        toolName: 'Email Finder',
                        category: 'reconnaissance',
                        reliability: 0.9,
                        timestamp: new Date()
                    }
                },
                {
                    _id: 'dp-2',
                    type: 'domain',
                    key: 'Domain',
                    value: 'example.com',
                    confidence: 95,
                    tags: ['registered', 'active'],
                    relationships: [],
                    enrichment: {
                        verified: true,
                        verificationSource: 'Domain Lookup',
                        additionalContext: 'Registered domain',
                        riskScore: 3,
                        lastUpdated: new Date()
                    },
                    source: {
                        tool: null,
                        toolName: 'Domain Lookup',
                        category: 'reconnaissance',
                        reliability: 0.95,
                        timestamp: new Date()
                    }
                },
                {
                    _id: 'dp-3',
                    type: 'social-profile',
                    key: 'LinkedIn Profile',
                    value: 'linkedin.com/in/johndoe',
                    confidence: 70,
                    tags: ['professional', 'public'],
                    relationships: [],
                    enrichment: {
                        verified: false,
                        verificationSource: 'Social Media Scanner',
                        additionalContext: 'Professional social profile',
                        riskScore: 2,
                        lastUpdated: new Date()
                    },
                    source: {
                        tool: null,
                        toolName: 'Social Media Scanner',
                        category: 'social',
                        reliability: 0.8,
                        timestamp: new Date()
                    }
                }
            ],
            analytics: {
                totalDataPoints: 3,
                toolsUsed: 3,
                confidenceScore: 83,
                patterns: [
                    {
                        type: 'correlation',
                        description: 'Email domain matches company domain',
                        strength: 85,
                        evidence: ['Email domain matches company domain']
                    },
                    {
                        type: 'social',
                        description: 'Professional social media presence',
                        strength: 70,
                        evidence: ['LinkedIn profile found']
                    }
                ],
                correlations: [],
                timeline: [
                    {
                        date: new Date().toISOString(),
                        event: 'Email address discovered',
                        source: 'Email Finder',
                        significance: 'high'
                    },
                    {
                        date: new Date().toISOString(),
                        event: 'Domain registration verified',
                        source: 'Domain Lookup',
                        significance: 'high'
                    },
                    {
                        date: new Date().toISOString(),
                        event: 'LinkedIn profile found',
                        source: 'Social Media Scanner',
                        significance: 'medium'
                    }
                ],
                geolocations: [],
                networks: [],
                riskAssessment: {
                    level: 'low',
                    score: 15,
                    factors: [
                        'Public social media presence',
                        'Professional email domain',
                        'No suspicious activity detected'
                    ]
                }
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
                lastAnalyzed: new Date().toISOString(),
                dataSourceCount: 3,
                qualityScore: 85,
                completenessScore: 75
            }
        };

        // If MongoDB is connected, get real sessions from database
        if (isMongoConnected) {
            try {
                const realSessions = await AnalysisSession.find({})
                    .populate('dataPoints.source.tool', 'name category')
                    .sort({ updatedAt: -1 });

                // Combine demo session with real sessions
                return res.json([demoSession, ...realSessions]);
            } catch (dbError) {
                console.error('Database error:', dbError);
                // Fall back to demo session only
                return res.json([demoSession]);
            }
        } else {
            // Return demo session only when MongoDB is not connected
            return res.json([demoSession]);
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Get single analysis session
// @route   GET /api/analysis-sessions/:id
// @access  Private (or public in development)
app.get('/api/analysis-sessions/:id', optionalAuth, async (req, res) => {
    try {
        // In development mode, if no user is authenticated, return mock data
        if (isDevelopment && !req.user) {
            if (req.params.id === 'demo-session-1') {
                return res.json({
                    _id: 'demo-session-1',
                    title: 'Demo Analysis Session',
                    description: 'This is a demo session for testing purposes',
                    targetType: 'person',
                    priority: 'medium',
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    dataPoints: [
                        {
                            _id: 'dp-1',
                            type: 'email',
                            key: 'Email Address',
                            value: 'john.doe@example.com',
                            confidence: 85,
                            tags: ['verified', 'primary'],
                            source: {
                                toolName: 'Email Finder',
                                category: 'reconnaissance',
                                reliability: 0.9,
                                timestamp: new Date().toISOString()
                            }
                        },
                        {
                            _id: 'dp-2',
                            type: 'domain',
                            key: 'Domain',
                            value: 'example.com',
                            confidence: 95,
                            tags: ['registered', 'active'],
                            source: {
                                toolName: 'Domain Lookup',
                                category: 'reconnaissance',
                                reliability: 0.95,
                                timestamp: new Date().toISOString()
                            }
                        },
                        {
                            _id: 'dp-3',
                            type: 'social-profile',
                            key: 'LinkedIn Profile',
                            value: 'linkedin.com/in/johndoe',
                            confidence: 70,
                            tags: ['professional', 'public'],
                            source: {
                                toolName: 'Social Media Scanner',
                                category: 'social',
                                reliability: 0.8,
                                timestamp: new Date().toISOString()
                            }
                        }
                    ],
                    analytics: {
                        totalDataPoints: 3,
                        toolsUsed: 3,
                        averageConfidence: 83,
                        patterns: [
                            {
                                type: 'correlation',
                                description: 'Email domain matches company domain',
                                strength: 85,
                                evidence: ['Email domain matches company domain']
                            },
                            {
                                type: 'social',
                                description: 'Professional social media presence',
                                strength: 70,
                                evidence: ['LinkedIn profile found']
                            }
                        ],
                        timeline: [
                            {
                                date: new Date().toISOString(),
                                event: 'Email address discovered',
                                source: 'Email Finder'
                            },
                            {
                                date: new Date().toISOString(),
                                event: 'Domain registration verified',
                                source: 'Domain Lookup'
                            },
                            {
                                date: new Date().toISOString(),
                                event: 'LinkedIn profile found',
                                source: 'Social Media Scanner'
                            }
                        ],
                        riskAssessment: {
                            level: 'low',
                            score: 15,
                            factors: [
                                'Public social media presence',
                                'Professional email domain',
                                'No suspicious activity detected'
                            ]
                        }
                    },
                    metadata: {
                        completenessScore: 75,
                        qualityScore: 85
                    }
                });
            }
        }

        const session = await AnalysisSession.findById(req.params.id)
            .populate('dataPoints.source.tool', 'name category');

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        res.json(session);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Create new analysis session
// @route   POST /api/analysis-sessions
// @access  Private (or public in development)
app.post('/api/analysis-sessions', optionalAuth, async (req, res) => {
    try {
        console.log('POST /api/analysis-sessions called');
        console.log('Request body:', req.body);
        console.log('Request headers:', req.headers);
        
        const { title, description, targetType, priority, status } = req.body;

        console.log('Extracted data:', { title, description, targetType, priority, status });

        // If MongoDB is not connected, return a mock session
        if (!isMongoConnected) {
            console.log('MongoDB not connected, returning mock session');
            const mockSession = {
                _id: Date.now().toString(),
                title: title || 'New Session',
                description: description || 'Session created without database',
                targetType: targetType || 'person',
                priority: priority || 'medium',
                status: status || 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
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
                }
            };
            console.log('Returning mock session:', mockSession);
            return res.status(201).json(mockSession);
        }

        const sessionData = {
            title,
            description,
            targetType: targetType || 'person',
            priority: priority || 'medium',
            status: status || 'active',
            user: req.user ? req.user.id : null,
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
            }
        };

        const session = new AnalysisSession(sessionData);
        await session.save();

        res.status(201).json(session);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Add data point to session
// @route   POST /api/analysis-sessions/:id/data-points
// @access  Private (or public in development)
app.post('/api/analysis-sessions/:id/data-points', optionalAuth, async (req, res) => {
    try {
        console.log('POST /api/analysis-sessions/:id/data-points called');
        console.log('Session ID:', req.params.id);
        console.log('Request body:', req.body);
        
        const { type, key, value, confidence, tags, notes, source } = req.body;

        console.log('Extracted data point:', { type, key, value, confidence, tags, notes, source });

        // If MongoDB is not connected, return a mock response
        if (!isMongoConnected) {
            console.log('MongoDB not connected, returning mock response');
            return res.json({
                _id: req.params.id,
                title: 'Mock Session',
                description: 'Session without database connection',
                targetType: 'person',
                priority: 'medium',
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                dataPoints: [
                    {
                        _id: Date.now().toString(),
                        type,
                        key,
                        value,
                        confidence: confidence || 50,
                        tags: tags || [],
                        relationships: [],
                        enrichment: {
                            verified: false,
                            verificationSource: source?.toolName || 'Manual Entry',
                            additionalContext: notes || '',
                            riskScore: 0,
                            lastUpdated: new Date()
                        },
                        source: {
                            tool: null,
                            toolName: source?.toolName || 'Manual Entry',
                            category: source?.category || 'manual',
                            reliability: source?.reliability || 0.5,
                            timestamp: new Date()
                        }
                    }
                ],
                analytics: {
                    totalDataPoints: 1,
                    toolsUsed: 1,
                    confidenceScore: confidence || 50,
                    patterns: [
                        {
                            type: 'trend',
                            description: 'Data point added',
                            strength: confidence || 50,
                            evidence: [`${key}: ${value}`]
                        }
                    ],
                    correlations: [],
                    timeline: [
                        {
                            date: new Date(),
                            event: `Added ${type} data point`,
                            source: source?.toolName || 'Manual Entry',
                            significance: 'medium'
                        }
                    ],
                    geolocations: [],
                    networks: [],
                    riskAssessment: {
                        level: 'low',
                        score: 10,
                        factors: ['Data point added']
                    }
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
                    lastAnalyzed: new Date().toISOString(),
                    dataSourceCount: 1,
                    qualityScore: 50,
                    completenessScore: 25
                }
            });
        }

        const session = await AnalysisSession.findById(req.params.id);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        const dataPoint = {
            type,
            key,
            value,
            confidence: confidence || 50,
            tags: tags || [],
            relationships: [],
            enrichment: {
                verified: false,
                verificationSource: source?.toolName || 'Manual Entry',
                additionalContext: notes || '',
                riskScore: 0,
                lastUpdated: new Date()
            },
            source: {
                tool: null,
                toolName: source?.toolName || 'Manual Entry',
                category: source?.category || 'manual',
                reliability: source?.reliability || 0.5,
                timestamp: new Date()
            }
        };

        session.dataPoints.push(dataPoint);

        // Update analytics
        session.analytics.totalDataPoints = session.dataPoints.length;
        session.analytics.toolsUsed = new Set(session.dataPoints.map(dp => dp.source.toolName)).size;
        session.analytics.confidenceScore = session.dataPoints.reduce((sum, dp) => sum + dp.confidence, 0) / session.dataPoints.length;

        // Generate patterns and risk assessment
        const patterns = generatePatterns(session);
        const riskAssessment = generateRiskAssessment(session);

        session.analytics.patterns = patterns;
        session.analytics.riskAssessment = riskAssessment;

        // Update timeline
        session.analytics.timeline.push({
            date: new Date(),
            event: `Added ${type} data point`,
            source: source?.toolName || 'Manual Entry',
            significance: confidence > 75 ? 'high' : confidence > 50 ? 'medium' : 'low'
        });

        await session.save();

        res.json(session);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Helper functions for analytics
function generatePatterns(session) {
    const patterns = [];
    const dataPoints = session.dataPoints;

    // Email domain correlation
    const emails = dataPoints.filter(dp => dp.type === 'email');
    const domains = dataPoints.filter(dp => dp.type === 'domain');
    
    if (emails.length > 0 && domains.length > 0) {
        const emailDomains = emails.map(email => email.value.split('@')[1]);
        const domainValues = domains.map(domain => domain.value);
        
        const matchingDomains = emailDomains.filter(emailDomain => 
            domainValues.some(domain => domain.includes(emailDomain))
        );
        
        if (matchingDomains.length > 0) {
            patterns.push({
                type: 'correlation',
                description: 'Email domains match discovered domains',
                strength: 85,
                evidence: matchingDomains
            });
        }
    }

    // Social media presence
    const socialProfiles = dataPoints.filter(dp => dp.type === 'social-profile');
    if (socialProfiles.length > 0) {
        patterns.push({
            type: 'social',
            description: 'Social media presence detected',
            strength: 70,
            evidence: socialProfiles.map(sp => sp.value)
        });
    }

    // High confidence data points
    const highConfidence = dataPoints.filter(dp => dp.confidence >= 80);
    if (highConfidence.length > 0) {
        patterns.push({
            type: 'trend',
            description: 'High confidence data points identified',
            strength: 90,
            evidence: highConfidence.map(dp => `${dp.key}: ${dp.value}`)
        });
    }

    return patterns;
}

function generateRiskAssessment(session) {
    const dataPoints = session.dataPoints;
    let riskScore = 0;
    const factors = [];

    // Check for suspicious patterns
    const emails = dataPoints.filter(dp => dp.type === 'email');
    const domains = dataPoints.filter(dp => dp.type === 'domain');
    
    // Domain age check (simplified)
    if (domains.length > 0) {
        factors.push('Domain information available');
        riskScore += 10;
    }

    // Email patterns
    if (emails.length > 0) {
        factors.push('Email addresses discovered');
        riskScore += 15;
    }

    // Social media presence
    const socialProfiles = dataPoints.filter(dp => dp.type === 'social-profile');
    if (socialProfiles.length > 0) {
        factors.push('Social media presence detected');
        riskScore += 20;
    }

    // Determine risk level
    let level = 'low';
    if (riskScore >= 60) level = 'high';
    else if (riskScore >= 30) level = 'medium';

    return {
        level,
        score: Math.min(riskScore, 100),
        factors
    };
}

// Routes

// Get all tools with pagination and filtering
app.get('/api/tools', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            category,
            pricing,
            opsecRisk,
            search,
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        // Build filter object
        const filter = { isActive: true };
        
        if (category) filter.category = category;
        if (pricing) filter.pricing = pricing;
        if (opsecRisk) filter.opsecRisk = opsecRisk;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const [tools, total] = await Promise.all([
            Tool.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Tool.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(total / parseInt(limit));
        const hasNext = parseInt(page) < totalPages;
        const hasPrev = parseInt(page) > 1;

        res.json({
            success: true,
            data: tools,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems: total,
                itemsPerPage: parseInt(limit),
                hasNext,
                hasPrev,
                next: hasNext ? parseInt(page) + 1 : null,
                prev: hasPrev ? parseInt(page) - 1 : null
            }
        });
    } catch (error) {
        console.error('Error fetching tools:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tools',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get single tool by ID
app.get('/api/tools/:id', async (req, res) => {
    try {
        const tool = await Tool.findById(req.params.id);
        
        if (!tool || !tool.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Tool not found'
            });
        }

        res.json({
            success: true,
            data: tool
        });
    } catch (error) {
        console.error('Error fetching tool:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tool',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get tool categories with counts
app.get('/api/tools/meta/categories', async (req, res) => {
    try {
        const categories = await Tool.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$category',
                    toolCount: { $sum: 1 },
                    averageRating: { $avg: '$averageRating' }
                }
            },
            {
                $project: {
                    category: '$_id',
                    toolCount: 1,
                    averageRating: { $round: ['$averageRating', 1] },
                    _id: 0
                }
            },
            { $sort: { toolCount: -1 } }
        ]);

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get tool statistics
app.get('/api/tools/meta/stats', async (req, res) => {
    try {
        const [totalTools, categoryStats, pricingStats, riskStats] = await Promise.all([
            Tool.countDocuments({ isActive: true }),
            Tool.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            Tool.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$pricing', count: { $sum: 1 } } }
            ]),
            Tool.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$opsecRisk', count: { $sum: 1 } } }
            ])
        ]);

        res.json({
            success: true,
            data: {
                totalTools,
                categoryStats,
                pricingStats,
                riskStats,
                lastUpdated: new Date()
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Create new tool (if you want to allow adding tools)
app.post('/api/tools', async (req, res) => {
    try {
        const tool = new Tool(req.body);
        await tool.save();
        
        res.status(201).json({
            success: true,
            data: tool,
            message: 'Tool created successfully'
        });
    } catch (error) {
        console.error('Error creating tool:', error);
        res.status(400).json({
            success: false,
            message: 'Error creating tool',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Validation error'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
});

// Export the Express app as a Cloud Function
exports.api = functions.https.onRequest(app);
