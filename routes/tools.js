const express = require('express');
const { query, validationResult } = require('express-validator');
const Tool = require('../models/Tool');

const router = express.Router();

// Fallback data for when database is not available
const fallbackTools = [
    {
        id: '1',
        name: "Google Dorking",
        category: "search-engines",
        description: "Advanced Google search operators for finding specific information and exposed files",
        url: "https://google.com",
        pricing: "free",
        opsecRisk: "low",
        tags: ["google", "search", "operators"],
        averageRating: 4.5,
        totalUses: 1250
    },
    {
        id: '2',
        name: "Shodan",
        category: "domain-ip",
        description: "Search engine for Internet-connected devices and services",
        url: "https://shodan.io",
        pricing: "freemium",
        opsecRisk: "medium",
        tags: ["iot", "network", "scanning"],
        averageRating: 4.8,
        totalUses: 890
    },
    {
        id: '3',
        name: "Have I Been Pwned",
        category: "email-investigation",
        description: "Check if email addresses have been compromised in data breaches",
        url: "https://haveibeenpwned.com",
        pricing: "freemium",
        opsecRisk: "low",
        tags: ["email", "breach", "security"],
        averageRating: 4.9,
        totalUses: 2100
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
        totalUses: 567
    },
    {
        id: '5',
        name: "TinEye",
        category: "image-analysis",
        description: "Reverse image search engine to find where images appear online",
        url: "https://tineye.com",
        pricing: "freemium",
        opsecRisk: "low",
        tags: ["image", "reverse-search"],
        averageRating: 4.1,
        totalUses: 345
    }
];

const fallbackCategories = [
    { category: "search-engines", toolCount: 3, averageRating: 4.2, totalUses: 450 },
    { category: "domain-ip", toolCount: 4, averageRating: 4.5, totalUses: 890 },
    { category: "email-investigation", toolCount: 5, averageRating: 4.6, totalUses: 1200 },
    { category: "image-analysis", toolCount: 3, averageRating: 4.0, totalUses: 345 },
    { category: "social-media", toolCount: 6, averageRating: 4.1, totalUses: 678 }
];

// Helper function to check if database is available
const isDatabaseAvailable = () => {
    const mongoose = require('mongoose');
    return mongoose.connection.readyState === 1;
};

// @desc    Get all tools
// @route   GET /api/tools
// @access  Public
router.get('/', [
    query('category').optional().isString(),
    query('pricing').optional().isIn(['free', 'freemium', 'paid', 'subscription']),
    query('inputType').optional().isString(),
    query('opsecRisk').optional().isIn(['low', 'medium', 'high']),
    query('search').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { category, pricing, inputType, opsecRisk, search, page = 1, limit = 20 } = req.query;

        // If database is not available, use fallback data
        if (!isDatabaseAvailable()) {
            let filteredTools = [...fallbackTools];
            
            // Apply filters to fallback data
            if (category) filteredTools = filteredTools.filter(tool => tool.category === category);
            if (pricing) filteredTools = filteredTools.filter(tool => tool.pricing === pricing);
            if (opsecRisk) filteredTools = filteredTools.filter(tool => tool.opsecRisk === opsecRisk);
            if (search) {
                const searchLower = search.toLowerCase();
                filteredTools = filteredTools.filter(tool => 
                    tool.name.toLowerCase().includes(searchLower) ||
                    tool.description.toLowerCase().includes(searchLower) ||
                    tool.tags.some(tag => tag.toLowerCase().includes(searchLower))
                );
            }

            // Pagination
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            const total = filteredTools.length;
            const paginatedTools = filteredTools.slice(startIndex, endIndex);

            return res.json({
                success: true,
                count: paginatedTools.length,
                total,
                data: paginatedTools,
                fallback: true
            });
        }

        // Use database if available
        let query = { isActive: true };
        
        // Apply filters
        if (category) query.category = category;
        if (pricing) query.pricing = pricing;
        if (inputType) query.inputTypes = inputType;
        if (opsecRisk) query.opsecRisk = opsecRisk;
        
        let tools;
        
        if (search) {
            // Text search using MongoDB text index
            tools = await Tool.find({
                ...query,
                $text: { $search: search }
            }).sort({ score: { $meta: 'textScore' } });
        } else {
            tools = await Tool.find(query)
                .sort({ 'statistics.averageRating': -1, 'statistics.totalUses': -1 });
        }
        
        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = tools.length;
        
        const paginatedTools = tools.slice(startIndex, endIndex);
        
        // Pagination info
        const pagination = {};
        if (endIndex < total) {
            pagination.next = { page: page + 1, limit };
        }
        if (startIndex > 0) {
            pagination.prev = { page: page - 1, limit };
        }
        
        res.json({
            success: true,
            count: paginatedTools.length,
            total,
            pagination,
            data: paginatedTools.map(tool => ({
                id: tool._id,
                name: tool.name,
                category: tool.category,
                subcategory: tool.subcategory,
                description: tool.description,
                url: tool.url,
                type: tool.type,
                pricing: tool.pricing,
                requiresRegistration: tool.requiresRegistration,
                requiresApiKey: tool.requiresApiKey,
                tags: tool.tags,
                features: tool.features,
                inputTypes: tool.inputTypes,
                outputTypes: tool.outputTypes,
                accuracy: tool.accuracy,
                reliability: tool.reliability,
                opsecRisk: tool.opsecRisk,
                methodology: tool.methodology,
                averageRating: tool.statistics?.averageRating || 0,
                totalUses: tool.statistics?.totalUses || 0,
                totalReviews: tool.statistics?.totalReviews || 0,
                lastVerified: tool.lastVerified,
                createdAt: tool.createdAt
            }))
        });

    } catch (error) {
        console.error('Get tools error:', error);
        
        // Return fallback data on error
        res.json({
            success: true,
            count: fallbackTools.length,
            total: fallbackTools.length,
            data: fallbackTools,
            fallback: true,
            note: "Using fallback data due to database connection issues"
        });
    }
});

// @desc    Get tool by ID
// @route   GET /api/tools/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        // If database is not available, use fallback data
        if (!isDatabaseAvailable()) {
            const tool = fallbackTools.find(t => t.id === req.params.id);
            if (!tool) {
                return res.status(404).json({ message: 'Tool not found' });
            }
            return res.json({
                success: true,
                data: tool,
                fallback: true
            });
        }

        const tool = await Tool.findById(req.params.id);

        if (!tool) {
            return res.status(404).json({ message: 'Tool not found' });
        }

        if (!tool.isActive) {
            return res.status(404).json({ message: 'Tool not available' });
        }

        res.json({
            success: true,
            data: {
                id: tool._id,
                name: tool.name,
                category: tool.category,
                subcategory: tool.subcategory,
                description: tool.description,
                url: tool.url,
                type: tool.type,
                pricing: tool.pricing,
                requiresRegistration: tool.requiresRegistration,
                requiresApiKey: tool.requiresApiKey,
                tags: tool.tags,
                features: tool.features,
                inputTypes: tool.inputTypes,
                outputTypes: tool.outputTypes,
                accuracy: tool.accuracy,
                reliability: tool.reliability,
                opsecRisk: tool.opsecRisk,
                methodology: tool.methodology,
                usageExamples: tool.usageExamples,
                apiEndpoint: tool.apiEndpoint,
                documentation: tool.documentation,
                statistics: tool.statistics,
                lastVerified: tool.lastVerified,
                createdAt: tool.createdAt,
                updatedAt: tool.updatedAt
            }
        });

    } catch (error) {
        console.error('Get tool error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get tool categories
// @route   GET /api/tools/meta/categories
// @access  Public
router.get('/meta/categories', async (req, res) => {
    try {
        // If database is not available, use fallback data
        if (!isDatabaseAvailable()) {
            return res.json({
                success: true,
                count: fallbackCategories.length,
                data: fallbackCategories,
                fallback: true
            });
        }

        const categories = await Tool.aggregate([
            { $match: { isActive: true } },
            { 
                $group: { 
                    _id: '$category',
                    count: { $sum: 1 },
                    avgRating: { $avg: '$statistics.averageRating' },
                    totalUses: { $sum: '$statistics.totalUses' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            count: categories.length,
            data: categories.map(cat => ({
                category: cat._id,
                toolCount: cat.count,
                averageRating: cat.avgRating || 0,
                totalUses: cat.totalUses || 0
            }))
        });

    } catch (error) {
        console.error('Get categories error:', error);
        
        // Return fallback data on error
        res.json({
            success: true,
            count: fallbackCategories.length,
            data: fallbackCategories,
            fallback: true,
            note: "Using fallback data due to database connection issues"
        });
    }
});

// @desc    Get tool statistics
// @route   GET /api/tools/meta/statistics
// @access  Public
router.get('/meta/statistics', async (req, res) => {
    try {
        // If database is not available, use fallback data
        if (!isDatabaseAvailable()) {
            return res.json({
                success: true,
                data: {
                    overview: {
                        totalTools: fallbackTools.length,
                        totalUses: 5000,
                        averageRating: 4.4,
                        freeTools: 2,
                        paidTools: 3
                    },
                    topCategories: fallbackCategories,
                    fallback: true
                }
            });
        }

        const stats = await Tool.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: null,
                    totalTools: { $sum: 1 },
                    totalUses: { $sum: '$statistics.totalUses' },
                    averageRating: { $avg: '$statistics.averageRating' },
                    freeTools: {
                        $sum: {
                            $cond: [{ $eq: ['$pricing', 'free'] }, 1, 0]
                        }
                    },
                    paidTools: {
                        $sum: {
                            $cond: [{ $ne: ['$pricing', 'free'] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        const topCategories = await Tool.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalUses: { $sum: '$statistics.totalUses' }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            success: true,
            data: {
                overview: stats[0] || {
                    totalTools: 0,
                    totalUses: 0,
                    averageRating: 0,
                    freeTools: 0,
                    paidTools: 0
                },
                topCategories
            }
        });

    } catch (error) {
        console.error('Get statistics error:', error);
        
        // Return fallback data on error
        res.json({
            success: true,
            data: {
                overview: {
                    totalTools: fallbackTools.length,
                    totalUses: 5000,
                    averageRating: 4.4,
                    freeTools: 2,
                    paidTools: 3
                },
                topCategories: fallbackCategories,
                fallback: true,
                note: "Using fallback data due to database connection issues"
            }
        });
    }
});

// @desc    Get recommended tools
// @route   GET /api/tools/featured/recommended
// @access  Public
router.get('/featured/recommended', [
    query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        // If database is not available, use fallback data
        if (!isDatabaseAvailable()) {
            const limitedTools = fallbackTools.slice(0, parseInt(limit));
            return res.json({
                success: true,
                count: limitedTools.length,
                data: limitedTools,
                fallback: true
            });
        }

        const tools = await Tool.find({ isActive: true })
            .sort({ 
                'statistics.averageRating': -1, 
                'statistics.totalUses': -1,
                'statistics.totalReviews': -1 
            })
            .limit(parseInt(limit));

        res.json({
            success: true,
            count: tools.length,
            data: tools.map(tool => ({
                id: tool._id,
                name: tool.name,
                category: tool.category,
                description: tool.description,
                url: tool.url,
                pricing: tool.pricing,
                opsecRisk: tool.opsecRisk,
                averageRating: tool.statistics?.averageRating || 0,
                totalUses: tool.statistics?.totalUses || 0
            }))
        });

    } catch (error) {
        console.error('Get recommended tools error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
