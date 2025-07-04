const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Analysis = require('../models/Analysis');

// @desc    Get analysis dashboard
// @route   GET /api/analysis
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const analyses = await Analysis.find({ user: req.user.id });
        res.json(analyses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Create new analysis
// @route   POST /api/analysis
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { title, data } = req.body;
        const newAnalysis = new Analysis({
            title,
            data,
            user: req.user.id
        });

        const analysis = await newAnalysis.save();
        res.json(analysis);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
