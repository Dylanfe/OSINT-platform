const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const AnalysisSession = require('../models/AnalysisSession');
const Tool = require('../models/Tool');

// @desc    Get all analysis sessions for user
// @route   GET /api/analysis-sessions
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const sessions = await AnalysisSession.find({ user: req.user.id })
            .populate('dataPoints.source.tool', 'name category')
            .sort({ updatedAt: -1 });
        
        res.json(sessions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Get single analysis session
// @route   GET /api/analysis-sessions/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const session = await AnalysisSession.findById(req.params.id)
            .populate('dataPoints.source.tool', 'name category reliability')
            .populate('user', 'name email');

        if (!session) {
            return res.status(404).json({ msg: 'Analysis session not found' });
        }

        // Check if user owns this session or has access
        if (session.user._id.toString() !== req.user.id && 
            !session.collaboration.sharedWith.some(share => share.user.toString() === req.user.id)) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        res.json(session);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Analysis session not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @desc    Create new analysis session
// @route   POST /api/analysis-sessions
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { title, description, targetType, priority } = req.body;

        const newSession = new AnalysisSession({
            title,
            description,
            targetType,
            priority,
            user: req.user.id
        });

        const session = await newSession.save();
        res.json(session);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Update analysis session
// @route   PUT /api/analysis-sessions/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const { title, description, targetType, priority, status } = req.body;

        let session = await AnalysisSession.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ msg: 'Analysis session not found' });
        }

        // Check if user owns this session
        if (session.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Update fields
        const updateFields = {};
        if (title) updateFields.title = title;
        if (description) updateFields.description = description;
        if (targetType) updateFields.targetType = targetType;
        if (priority) updateFields.priority = priority;
        if (status) updateFields.status = status;

        session = await AnalysisSession.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true }
        ).populate('dataPoints.source.tool', 'name category');

        res.json(session);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Delete analysis session
// @route   DELETE /api/analysis-sessions/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const session = await AnalysisSession.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ msg: 'Analysis session not found' });
        }

        // Check if user owns this session
        if (session.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await AnalysisSession.findByIdAndRemove(req.params.id);

        res.json({ msg: 'Analysis session removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Add data point to analysis session
// @route   POST /api/analysis-sessions/:id/data-points
// @access  Private
router.post('/:id/data-points', protect, async (req, res) => {
    try {
        const session = await AnalysisSession.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ msg: 'Analysis session not found' });
        }

        // Check if user owns this session or has edit access
        if (session.user.toString() !== req.user.id && 
            !session.collaboration.sharedWith.some(share => 
                share.user.toString() === req.user.id && 
                ['edit', 'admin'].includes(share.permission)
            )) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const { type, key, value, confidence, tags, source, relationships, enrichment } = req.body;

        // Validate tool exists
        if (source.tool) {
            const tool = await Tool.findById(source.tool);
            if (!tool) {
                return res.status(400).json({ msg: 'Invalid tool ID' });
            }
        }

        const dataPoint = {
            type,
            key,
            value,
            confidence: confidence || 50,
            tags: tags || [],
            relationships: relationships || [],
            enrichment: enrichment || {},
            source: {
                tool: source.tool,
                toolName: source.toolName,
                category: source.category,
                reliability: source.reliability,
                timestamp: new Date()
            }
        };

        await session.addDataPoint(dataPoint);

        // Trigger analysis updates
        await session.analyzePatterns();
        await session.generateTimeline();
        await session.calculateRisk();

        const updatedSession = await AnalysisSession.findById(req.params.id)
            .populate('dataPoints.source.tool', 'name category reliability');

        res.json(updatedSession);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Update data point in analysis session
// @route   PUT /api/analysis-sessions/:id/data-points/:dataPointId
// @access  Private
router.put('/:id/data-points/:dataPointId', protect, async (req, res) => {
    try {
        const session = await AnalysisSession.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ msg: 'Analysis session not found' });
        }

        // Check if user owns this session or has edit access
        if (session.user.toString() !== req.user.id && 
            !session.collaboration.sharedWith.some(share => 
                share.user.toString() === req.user.id && 
                ['edit', 'admin'].includes(share.permission)
            )) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const dataPoint = session.dataPoints.id(req.params.dataPointId);
        if (!dataPoint) {
            return res.status(404).json({ msg: 'Data point not found' });
        }

        // Update data point fields
        const { key, value, confidence, tags, enrichment } = req.body;
        
        if (key) dataPoint.key = key;
        if (value) dataPoint.value = value;
        if (confidence !== undefined) dataPoint.confidence = confidence;
        if (tags) dataPoint.tags = tags;
        if (enrichment) dataPoint.enrichment = { ...dataPoint.enrichment, ...enrichment };

        await session.save();

        // Trigger analysis updates
        await session.analyzePatterns();
        await session.calculateRisk();

        const updatedSession = await AnalysisSession.findById(req.params.id)
            .populate('dataPoints.source.tool', 'name category reliability');

        res.json(updatedSession);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Delete data point from analysis session
// @route   DELETE /api/analysis-sessions/:id/data-points/:dataPointId
// @access  Private
router.delete('/:id/data-points/:dataPointId', protect, async (req, res) => {
    try {
        const session = await AnalysisSession.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ msg: 'Analysis session not found' });
        }

        // Check if user owns this session or has edit access
        if (session.user.toString() !== req.user.id && 
            !session.collaboration.sharedWith.some(share => 
                share.user.toString() === req.user.id && 
                ['edit', 'admin'].includes(share.permission)
            )) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const dataPoint = session.dataPoints.id(req.params.dataPointId);
        if (!dataPoint) {
            return res.status(404).json({ msg: 'Data point not found' });
        }

        dataPoint.remove();
        await session.save();

        // Trigger analysis updates
        await session.analyzePatterns();
        await session.calculateRisk();

        const updatedSession = await AnalysisSession.findById(req.params.id)
            .populate('dataPoints.source.tool', 'name category reliability');

        res.json(updatedSession);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Run analysis on session
// @route   POST /api/analysis-sessions/:id/analyze
// @access  Private
router.post('/:id/analyze', protect, async (req, res) => {
    try {
        const session = await AnalysisSession.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ msg: 'Analysis session not found' });
        }

        // Check if user owns this session or has access
        if (session.user.toString() !== req.user.id && 
            !session.collaboration.sharedWith.some(share => share.user.toString() === req.user.id)) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Run comprehensive analysis
        await session.analyzePatterns();
        await session.generateTimeline();
        await session.calculateRisk();

        // Advanced analytics could go here
        // - Correlation analysis
        // - Network analysis
        // - Geographic clustering
        // - Temporal pattern detection

        const updatedSession = await AnalysisSession.findById(req.params.id)
            .populate('dataPoints.source.tool', 'name category reliability');

        res.json({
            session: updatedSession,
            analysis: {
                patterns: updatedSession.analytics.patterns,
                timeline: updatedSession.analytics.timeline,
                riskAssessment: updatedSession.analytics.riskAssessment,
                suggestions: generateAnalysisSuggestions(updatedSession)
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Generate report for analysis session
// @route   POST /api/analysis-sessions/:id/report
// @access  Private
router.post('/:id/report', protect, async (req, res) => {
    try {
        const session = await AnalysisSession.findById(req.params.id)
            .populate('dataPoints.source.tool', 'name category reliability')
            .populate('user', 'name email');

        if (!session) {
            return res.status(404).json({ msg: 'Analysis session not found' });
        }

        // Check if user owns this session or has access
        if (session.user._id.toString() !== req.user.id && 
            !session.collaboration.sharedWith.some(share => share.user.toString() === req.user.id)) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const { type = 'summary', format = 'html' } = req.body;

        const report = generateReport(session, type, format);

        // Save report to session
        const reportEntry = {
            type,
            format,
            content: report.content,
            generatedAt: new Date()
        };

        session.reports.push(reportEntry);
        await session.save();

        res.json({
            report: reportEntry,
            downloadUrl: `/api/analysis-sessions/${session._id}/reports/${reportEntry._id}/download`
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Get analysis session statistics
// @route   GET /api/analysis-sessions/statistics
// @access  Private
router.get('/statistics/overview', protect, async (req, res) => {
    try {
        const stats = await AnalysisSession.getStatistics(req.user.id);
        res.json(stats[0] || {
            totalSessions: 0,
            totalDataPoints: 0,
            avgConfidence: 0,
            activeSessions: 0,
            completedSessions: 0
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @desc    Share analysis session
// @route   POST /api/analysis-sessions/:id/share
// @access  Private
router.post('/:id/share', protect, async (req, res) => {
    try {
        const session = await AnalysisSession.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ msg: 'Analysis session not found' });
        }

        // Check if user owns this session
        if (session.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const { userEmail, permission = 'view' } = req.body;

        // Find user by email
        const User = require('../models/User');
        const sharedUser = await User.findOne({ email: userEmail });

        if (!sharedUser) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if already shared
        const existingShare = session.collaboration.sharedWith.find(
            share => share.user.toString() === sharedUser._id.toString()
        );

        if (existingShare) {
            existingShare.permission = permission;
            existingShare.sharedAt = new Date();
        } else {
            session.collaboration.sharedWith.push({
                user: sharedUser._id,
                permission,
                sharedAt: new Date()
            });
        }

        session.collaboration.shared = true;
        await session.save();

        res.json({ msg: 'Session shared successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Helper function to generate analysis suggestions
function generateAnalysisSuggestions(session) {
    const suggestions = [];
    const dataPoints = session.dataPoints || [];
    const dataTypes = [...new Set(dataPoints.map(dp => dp.type))];

    // Suggest additional data collection
    if (dataTypes.includes('email') && !dataTypes.includes('social-profile')) {
        suggestions.push({
            type: 'data_collection',
            priority: 'medium',
            suggestion: 'Consider searching for social media profiles associated with the email addresses found.',
            tools: ['Social Searcher', 'Pipl', 'Sherlock']
        });
    }

    if (dataTypes.includes('domain') && !dataTypes.includes('ip')) {
        suggestions.push({
            type: 'data_collection',
            priority: 'medium',
            suggestion: 'Consider performing DNS resolution to find IP addresses for the domains.',
            tools: ['nslookup', 'dig', 'WhoisXML API']
        });
    }

    // Suggest correlation analysis
    if (dataPoints.length > 10) {
        suggestions.push({
            type: 'analysis',
            priority: 'high',
            suggestion: 'With this amount of data, consider running correlation analysis to find hidden relationships.',
            tools: ['Built-in Analytics']
        });
    }

    // Suggest risk mitigation
    if (session.analytics?.riskAssessment?.level === 'high' || session.analytics?.riskAssessment?.level === 'critical') {
        suggestions.push({
            type: 'security',
            priority: 'critical',
            suggestion: 'High risk level detected. Consider implementing additional security measures and monitoring.',
            tools: ['Threat Intelligence Platforms', 'SIEM Solutions']
        });
    }

    return suggestions;
}

// Helper function to generate reports
function generateReport(session, type, format) {
    const reportData = {
        title: `OSINT Analysis Report: ${session.title}`,
        generatedAt: new Date().toISOString(),
        session: {
            id: session._id,
            title: session.title,
            targetType: session.targetType,
            priority: session.priority,
            status: session.status,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt
        },
        summary: {
            totalDataPoints: session.analytics?.totalDataPoints || 0,
            toolsUsed: session.analytics?.toolsUsed || 0,
            confidenceScore: session.analytics?.confidenceScore || 0,
            riskLevel: session.analytics?.riskAssessment?.level || 'low'
        },
        dataPoints: session.dataPoints || [],
        analytics: session.analytics || {},
        findings: session.analytics?.patterns || [],
        timeline: session.analytics?.timeline || [],
        riskAssessment: session.analytics?.riskAssessment || {}
    };

    let content;
    
    switch (format) {
        case 'json':
            content = JSON.stringify(reportData, null, 2);
            break;
        case 'html':
            content = generateHTMLReport(reportData);
            break;
        case 'csv':
            content = generateCSVReport(reportData);
            break;
        default:
            content = JSON.stringify(reportData, null, 2);
    }

    return { content, data: reportData };
}

function generateHTMLReport(data) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>${data.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; }
        .section { margin: 30px 0; }
        .data-point { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .risk-${data.riskAssessment.level} { color: ${data.riskAssessment.level === 'low' ? 'green' : data.riskAssessment.level === 'medium' ? 'orange' : 'red'}; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${data.title}</h1>
        <p>Generated: ${new Date(data.generatedAt).toLocaleString()}</p>
        <p>Session: ${data.session.title} (${data.session.targetType})</p>
    </div>
    
    <div class="section">
        <h2>Executive Summary</h2>
        <ul>
            <li>Total Data Points: ${data.summary.totalDataPoints}</li>
            <li>Tools Used: ${data.summary.toolsUsed}</li>
            <li>Average Confidence: ${data.summary.confidenceScore}%</li>
            <li>Risk Level: <span class="risk-${data.riskAssessment.level}">${data.riskAssessment.level?.toUpperCase()}</span></li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Data Points</h2>
        ${data.dataPoints.map(dp => `
            <div class="data-point">
                <strong>${dp.key}:</strong> ${dp.value}<br>
                <small>Type: ${dp.type} | Confidence: ${dp.confidence}% | Source: ${dp.source?.toolName}</small>
            </div>
        `).join('')}
    </div>
    
    ${data.findings.length > 0 ? `
    <div class="section">
        <h2>Key Findings</h2>
        <ul>
            ${data.findings.map(finding => `<li>${finding.description} (${Math.round(finding.strength)}% strength)</li>`).join('')}
        </ul>
    </div>
    ` : ''}
    
    ${data.timeline.length > 0 ? `
    <div class="section">
        <h2>Timeline</h2>
        <table>
            <tr><th>Date</th><th>Event</th><th>Source</th></tr>
            ${data.timeline.map(item => `
                <tr>
                    <td>${new Date(item.date).toLocaleDateString()}</td>
                    <td>${item.event}</td>
                    <td>${item.source}</td>
                </tr>
            `).join('')}
        </table>
    </div>
    ` : ''}
</body>
</html>
    `;
}

function generateCSVReport(data) {
    const headers = ['Type', 'Key', 'Value', 'Confidence', 'Source Tool', 'Category', 'Timestamp'];
    const rows = data.dataPoints.map(dp => [
        dp.type,
        dp.key,
        dp.value,
        dp.confidence,
        dp.source?.toolName || '',
        dp.source?.category || '',
        dp.source?.timestamp || ''
    ]);
    
    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
}

module.exports = router;
