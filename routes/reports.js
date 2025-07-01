const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const Investigation = require('../models/Investigation');
const User = require('../models/User');

const router = express.Router();

// @desc    Get investigations (user's own and public)
// @route   GET /api/reports/investigations
// @access  Private
router.get('/investigations', protect, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['active', 'completed', 'paused', 'archived']),
    query('category').optional().isString(),
    query('search').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { page = 1, limit = 20, status, category, search } = req.query;

        const investigations = await Investigation.findByUser(req.user.id, {
            status,
            category
        });

        // Apply search filter if provided
        let filteredInvestigations = investigations;
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filteredInvestigations = investigations.filter(inv => 
                searchRegex.test(inv.title) || 
                searchRegex.test(inv.description) ||
                inv.tags.some(tag => searchRegex.test(tag))
            );
        }

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = filteredInvestigations.length;
        
        const paginatedInvestigations = filteredInvestigations.slice(startIndex, endIndex);
        
        const pagination = {};
        if (endIndex < total) {
            pagination.next = { page: page + 1, limit };
        }
        if (startIndex > 0) {
            pagination.prev = { page: page - 1, limit };
        }

        res.json({
            success: true,
            count: paginatedInvestigations.length,
            total,
            pagination,
            data: paginatedInvestigations.map(inv => inv.getSummary())
        });

    } catch (error) {
        console.error('Get investigations error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get investigation by ID
// @route   GET /api/reports/investigations/:id
// @access  Private
router.get('/investigations/:id', protect, async (req, res) => {
    try {
        const investigation = await Investigation.findById(req.params.id)
            .populate('owner', 'username firstName lastName')
            .populate('collaborators.user', 'username firstName lastName')
            .populate('notes.author', 'username firstName lastName');

        if (!investigation) {
            return res.status(404).json({ message: 'Investigation not found' });
        }

        // Check if user has access
        if (!investigation.hasAccess(req.user.id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json({
            success: true,
            data: investigation
        });

    } catch (error) {
        console.error('Get investigation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Create new investigation
// @route   POST /api/reports/investigations
// @access  Private
router.post('/investigations', protect, [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('category').isIn([
        'cybersecurity', 'fraud', 'identity', 'corporate', 'geolocation',
        'social-media', 'digital-forensics', 'threat-intelligence', 'compliance', 'other'
    ]).withMessage('Invalid category'),
    body('description').optional().trim(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('tags').optional().isArray()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const investigation = await Investigation.create({
            ...req.body,
            owner: req.user.id
        });

        await investigation.addTimelineEvent(
            'investigation_created',
            'Investigation created',
            req.user.id
        );

        res.status(201).json({
            success: true,
            message: 'Investigation created successfully',
            data: investigation.getSummary()
        });

    } catch (error) {
        console.error('Create investigation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Update investigation
// @route   PUT /api/reports/investigations/:id
// @access  Private
router.put('/investigations/:id', protect, [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().trim(),
    body('status').optional().isIn(['active', 'completed', 'paused', 'archived']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const investigation = await Investigation.findById(req.params.id);

        if (!investigation) {
            return res.status(404).json({ message: 'Investigation not found' });
        }

        // Check if user has edit access
        if (!investigation.hasAccess(req.user.id, 'editor')) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Track status changes
        const oldStatus = investigation.status;
        
        // Update fields
        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined) {
                investigation[key] = req.body[key];
            }
        });

        await investigation.save();

        // Add timeline event if status changed
        if (req.body.status && req.body.status !== oldStatus) {
            await investigation.addTimelineEvent(
                'status_changed',
                `Status changed from ${oldStatus} to ${req.body.status}`,
                req.user.id
            );
        }

        res.json({
            success: true,
            message: 'Investigation updated successfully',
            data: investigation.getSummary()
        });

    } catch (error) {
        console.error('Update investigation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Add target to investigation
// @route   POST /api/reports/investigations/:id/targets
// @access  Private
router.post('/investigations/:id/targets', protect, [
    body('type').isIn([
        'email', 'domain', 'ip', 'username', 'phone', 'person',
        'company', 'hash', 'url', 'social-profile', 'other'
    ]).withMessage('Invalid target type'),
    body('value').trim().notEmpty().withMessage('Target value is required'),
    body('notes').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const investigation = await Investigation.findById(req.params.id);

        if (!investigation) {
            return res.status(404).json({ message: 'Investigation not found' });
        }

        if (!investigation.hasAccess(req.user.id, 'editor')) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { type, value, notes } = req.body;
        await investigation.addTarget(type, value, notes);

        res.json({
            success: true,
            message: 'Target added successfully',
            data: investigation.targets
        });

    } catch (error) {
        console.error('Add target error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Add note to investigation
// @route   POST /api/reports/investigations/:id/notes
// @access  Private
router.post('/investigations/:id/notes', protect, [
    body('content').trim().notEmpty().withMessage('Note content is required'),
    body('isPrivate').optional().isBoolean()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const investigation = await Investigation.findById(req.params.id);

        if (!investigation) {
            return res.status(404).json({ message: 'Investigation not found' });
        }

        if (!investigation.hasAccess(req.user.id, 'viewer')) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { content, isPrivate = false } = req.body;
        await investigation.addNote(content, req.user.id, isPrivate);

        res.json({
            success: true,
            message: 'Note added successfully'
        });

    } catch (error) {
        console.error('Add note error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Add finding to investigation
// @route   POST /api/reports/investigations/:id/findings
// @access  Private
router.post('/investigations/:id/findings', protect, [
    body('tool').trim().notEmpty().withMessage('Tool name is required'),
    body('target').trim().notEmpty().withMessage('Target is required'),
    body('result').notEmpty().withMessage('Result is required'),
    body('confidence').optional().isIn(['low', 'medium', 'high']),
    body('notes').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const investigation = await Investigation.findById(req.params.id);

        if (!investigation) {
            return res.status(404).json({ message: 'Investigation not found' });
        }

        if (!investigation.hasAccess(req.user.id, 'editor')) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { tool, target, result, confidence, notes } = req.body;
        await investigation.addFinding(tool, target, result, confidence, notes);

        res.json({
            success: true,
            message: 'Finding added successfully'
        });

    } catch (error) {
        console.error('Add finding error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Delete investigation
// @route   DELETE /api/reports/investigations/:id
// @access  Private
router.delete('/investigations/:id', protect, async (req, res) => {
    try {
        const investigation = await Investigation.findById(req.params.id);

        if (!investigation) {
            return res.status(404).json({ message: 'Investigation not found' });
        }

        // Only owner can delete
        if (investigation.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only the owner can delete this investigation' });
        }

        await Investigation.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Investigation deleted successfully'
        });

    } catch (error) {
        console.error('Delete investigation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Generate investigation report
// @route   GET /api/reports/investigations/:id/export
// @access  Private
router.get('/investigations/:id/export', protect, async (req, res) => {
    try {
        const investigation = await Investigation.findById(req.params.id)
            .populate('owner', 'username firstName lastName')
            .populate('collaborators.user', 'username firstName lastName')
            .populate('notes.author', 'username firstName lastName');

        if (!investigation) {
            return res.status(404).json({ message: 'Investigation not found' });
        }

        if (!investigation.hasAccess(req.user.id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Generate report data
        const report = {
            investigation: {
                title: investigation.title,
                description: investigation.description,
                category: investigation.category,
                status: investigation.status,
                priority: investigation.priority,
                tags: investigation.tags,
                owner: investigation.owner,
                createdAt: investigation.createdAt,
                updatedAt: investigation.updatedAt
            },
            targets: investigation.targets,
            findings: investigation.findings,
            timeline: investigation.timeline,
            notes: investigation.notes.filter(note => !note.isPrivate || note.author.toString() === req.user.id),
            statistics: {
                totalTargets: investigation.targets.length,
                totalFindings: investigation.findings.length,
                totalNotes: investigation.notes.length,
                timeSpent: investigation.metadata.timeSpent,
                toolsUsed: investigation.metadata.toolsUsed
            }
        };

        res.json({
            success: true,
            data: report
        });

    } catch (error) {
        console.error('Export investigation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
