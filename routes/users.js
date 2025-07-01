const express = require('express');
const { query, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin)
router.get('/', protect, authorize('admin'), [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
    query('role').optional().isIn(['user', 'analyst', 'admin']),
    query('status').optional().isIn(['active', 'inactive'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { page = 1, limit = 20, search, role, status } = req.query;
        
        let query = {};
        
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (role) query.role = role;
        if (status === 'active') query.isActive = true;
        if (status === 'inactive') query.isActive = false;
        
        const startIndex = (page - 1) * limit;
        
        const users = await User.find(query)
            .select('-password -apiKeys -resetPasswordToken -resetPasswordExpire -verificationToken')
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(parseInt(limit));
            
        const total = await User.countDocuments(query);
        
        const pagination = {};
        if (startIndex + limit < total) {
            pagination.next = { page: parseInt(page) + 1, limit };
        }
        if (startIndex > 0) {
            pagination.prev = { page: parseInt(page) - 1, limit };
        }

        res.json({
            success: true,
            count: users.length,
            total,
            pagination,
            data: users
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin or own profile)
router.get('/:id', protect, async (req, res) => {
    try {
        // Users can view their own profile, admins can view any profile
        if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
            return res.status(403).json({ message: 'Not authorized to view this profile' });
        }

        const user = await User.findById(req.params.id)
            .select('-password -apiKeys -resetPasswordToken -resetPasswordExpire -verificationToken')
            .populate('investigations', 'title status category updatedAt');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Update user role (Admin only)
// @route   PUT /api/users/:id/role
// @access  Private (Admin)
router.put('/:id/role', protect, authorize('admin'), async (req, res) => {
    try {
        const { role } = req.body;

        if (!['user', 'analyst', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        // Prevent admin from changing their own role
        if (req.user.id === req.params.id) {
            return res.status(400).json({ message: 'Cannot change your own role' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.role = role;
        await user.save();

        res.json({
            success: true,
            message: 'User role updated successfully',
            data: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Activate/Deactivate user (Admin only)
// @route   PUT /api/users/:id/status
// @access  Private (Admin)
router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
    try {
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ message: 'isActive must be a boolean' });
        }

        // Prevent admin from deactivating their own account
        if (req.user.id === req.params.id && !isActive) {
            return res.status(400).json({ message: 'Cannot deactivate your own account' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isActive = isActive;
        await user.save();

        res.json({
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: {
                id: user._id,
                username: user.username,
                isActive: user.isActive
            }
        });

    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get user statistics (Admin only)
// @route   GET /api/users/stats/overview
// @access  Private (Admin)
router.get('/stats/overview', protect, authorize('admin'), async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const inactiveUsers = await User.countDocuments({ isActive: false });
        const verifiedUsers = await User.countDocuments({ isVerified: true });
        
        const usersByRole = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        const recentUsers = await User.find()
            .select('username email role createdAt isActive')
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    activeUsers,
                    inactiveUsers,
                    verifiedUsers
                },
                usersByRole: usersByRole.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
                recentUsers
            }
        });

    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        // Prevent admin from deleting their own account
        if (req.user.id === req.params.id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Soft delete by deactivating instead of hard delete
        user.isActive = false;
        user.email = `deleted_${Date.now()}_${user.email}`;
        user.username = `deleted_${Date.now()}_${user.username}`;
        await user.save();

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
