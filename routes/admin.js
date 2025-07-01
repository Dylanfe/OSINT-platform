const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Tool = require('../models/Tool');
const Investigation = require('../models/Investigation');

const router = express.Router();

// @desc    Get admin dashboard data
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
router.get('/dashboard', protect, authorize('admin'), async (req, res) => {
    try {
        // Get user statistics
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const newUsersThisMonth = await User.countDocuments({
            createdAt: { $gte: new Date(new Date().setDate(1)) }
        });

        // Get tool statistics
        const totalTools = await Tool.countDocuments({ isActive: true });
        const toolsByCategory = await Tool.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Get investigation statistics
        const totalInvestigations = await Investigation.countDocuments();
        const activeInvestigations = await Investigation.countDocuments({ status: 'active' });
        const investigationsByCategory = await Investigation.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Get recent activity
        const recentUsers = await User.find()
            .select('username email role createdAt')
            .sort({ createdAt: -1 })
            .limit(5);

        const recentInvestigations = await Investigation.find()
            .select('title category status createdAt owner')
            .populate('owner', 'username')
            .sort({ createdAt: -1 })
            .limit(5);

        // System health metrics
        const systemHealth = {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            nodeVersion: process.version,
            platform: process.platform
        };

        res.json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    newThisMonth: newUsersThisMonth,
                    recent: recentUsers
                },
                tools: {
                    total: totalTools,
                    byCategory: toolsByCategory
                },
                investigations: {
                    total: totalInvestigations,
                    active: activeInvestigations,
                    byCategory: investigationsByCategory,
                    recent: recentInvestigations
                },
                system: systemHealth
            }
        });

    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get system logs (Admin)
// @route   GET /api/admin/logs
// @access  Private (Admin)
router.get('/logs', protect, authorize('admin'), async (req, res) => {
    try {
        // This would typically read from log files
        // For now, return sample log data
        const logs = [
            {
                timestamp: new Date(),
                level: 'info',
                message: 'User login successful',
                userId: req.user.id
            },
            {
                timestamp: new Date(Date.now() - 300000),
                level: 'warning',
                message: 'Rate limit exceeded for IP',
                ip: '192.168.1.1'
            },
            {
                timestamp: new Date(Date.now() - 600000),
                level: 'error',
                message: 'Database connection timeout',
                error: 'Connection timeout after 5000ms'
            }
        ];

        res.json({
            success: true,
            data: logs
        });

    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get API usage statistics
// @route   GET /api/admin/api-usage
// @access  Private (Admin)
router.get('/api-usage', protect, authorize('admin'), async (req, res) => {
    try {
        // Get API usage from user search history
        const apiUsage = await User.aggregate([
            { $unwind: '$searchHistory' },
            {
                $group: {
                    _id: '$searchHistory.type',
                    count: { $sum: 1 },
                    totalResults: { $sum: '$searchHistory.results' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Get most active users
        const activeUsers = await User.aggregate([
            {
                $project: {
                    username: 1,
                    searchCount: { $size: '$searchHistory' }
                }
            },
            { $sort: { searchCount: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            success: true,
            data: {
                apiUsage,
                activeUsers
            }
        });

    } catch (error) {
        console.error('Get API usage error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Bulk import tools
// @route   POST /api/admin/tools/bulk-import
// @access  Private (Admin)
router.post('/tools/bulk-import', protect, authorize('admin'), async (req, res) => {
    try {
        const { tools } = req.body;

        if (!Array.isArray(tools)) {
            return res.status(400).json({ message: 'Tools must be an array' });
        }

        const importResults = {
            success: 0,
            failed: 0,
            errors: []
        };

        for (const toolData of tools) {
            try {
                // Check if tool already exists
                const existingTool = await Tool.findOne({ name: toolData.name });
                if (existingTool) {
                    importResults.errors.push(`Tool "${toolData.name}" already exists`);
                    importResults.failed++;
                    continue;
                }

                await Tool.create({
                    ...toolData,
                    metadata: {
                        addedBy: req.user.id,
                        source: 'bulk-import'
                    }
                });

                importResults.success++;
            } catch (error) {
                importResults.errors.push(`Failed to import "${toolData.name}": ${error.message}`);
                importResults.failed++;
            }
        }

        res.json({
            success: true,
            message: 'Bulk import completed',
            data: importResults
        });

    } catch (error) {
        console.error('Bulk import error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get system configuration
// @route   GET /api/admin/config
// @access  Private (Admin)
router.get('/config', protect, authorize('admin'), async (req, res) => {
    try {
        const config = {
            database: {
                connected: require('mongoose').connection.readyState === 1,
                name: process.env.MONGODB_URI ? 'Configured' : 'Not configured'
            },
            apiKeys: {
                shodan: !!process.env.SHODAN_API_KEY,
                haveibeenpwned: !!process.env.HAVE_I_BEEN_PWNED_API_KEY,
                hunter: !!process.env.HUNTER_IO_API_KEY,
                virustotal: !!process.env.VIRUSTOTAL_API_KEY,
                opencorporates: !!process.env.OPENCORPORATES_API_KEY
            },
            environment: process.env.NODE_ENV || 'development',
            version: require('../package.json').version
        };

        res.json({
            success: true,
            data: config
        });

    } catch (error) {
        console.error('Get config error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
