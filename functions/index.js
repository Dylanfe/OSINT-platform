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
        'https://osint-platform.firebaseapp.com'
    ],
    credentials: true
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
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
} else {
    console.log('Invalid MongoDB URI format, skipping connection');
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
