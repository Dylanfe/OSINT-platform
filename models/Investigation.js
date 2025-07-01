const mongoose = require('mongoose');

const InvestigationSchema = new mongoose.Schema({
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
    category: {
        type: String,
        enum: [
            'cybersecurity',
            'fraud',
            'identity',
            'corporate',
            'geolocation',
            'social-media',
            'digital-forensics',
            'threat-intelligence',
            'compliance',
            'other'
        ],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'paused', 'archived'],
        default: 'active'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    tags: [{
        type: String,
        trim: true
    }],
    targets: [{
        type: {
            type: String,
            enum: [
                'email',
                'domain',
                'ip',
                'username',
                'phone',
                'person',
                'company',
                'hash',
                'url',
                'social-profile',
                'other'
            ],
            required: true
        },
        value: {
            type: String,
            required: true,
            trim: true
        },
        notes: {
            type: String,
            trim: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    findings: [{
        tool: {
            type: String,
            required: true
        },
        target: {
            type: String,
            required: true
        },
        result: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },
        confidence: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        verified: {
            type: Boolean,
            default: false
        },
        notes: {
            type: String,
            trim: true
        }
    }],
    timeline: [{
        event: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    }],
    collaborators: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['owner', 'editor', 'viewer'],
            default: 'viewer'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    attachments: [{
        filename: {
            type: String,
            required: true
        },
        originalName: {
            type: String,
            required: true
        },
        mimetype: {
            type: String,
            required: true
        },
        size: {
            type: Number,
            required: true
        },
        path: {
            type: String,
            required: true
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    notes: [{
        content: {
            type: String,
            required: true,
            trim: true
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        isPrivate: {
            type: Boolean,
            default: false
        }
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    isTemplate: {
        type: Boolean,
        default: false
    },
    templateOf: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Investigation'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    metadata: {
        totalFindings: {
            type: Number,
            default: 0
        },
        lastActivity: {
            type: Date,
            default: Date.now
        },
        toolsUsed: [{
            type: String
        }],
        timeSpent: {
            type: Number, // in minutes
            default: 0
        }
    }
}, {
    timestamps: true
});

// Indexes for better performance
InvestigationSchema.index({ owner: 1, status: 1 });
InvestigationSchema.index({ 'collaborators.user': 1 });
InvestigationSchema.index({ category: 1, status: 1 });
InvestigationSchema.index({ tags: 1 });
InvestigationSchema.index({ 'targets.type': 1, 'targets.value': 1 });
InvestigationSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Pre-save middleware to update metadata
InvestigationSchema.pre('save', function(next) {
    if (this.isModified('findings')) {
        this.metadata.totalFindings = this.findings.length;
        this.metadata.lastActivity = new Date();
        
        // Update tools used
        const toolsUsed = [...new Set(this.findings.map(f => f.tool))];
        this.metadata.toolsUsed = toolsUsed;
    }
    
    next();
});

// Method to add a finding
InvestigationSchema.methods.addFinding = function(tool, target, result, confidence = 'medium', notes = '') {
    this.findings.push({
        tool,
        target,
        result,
        confidence,
        notes,
        timestamp: new Date()
    });
    
    this.addTimelineEvent('finding_added', `New finding added from ${tool} for target ${target}`);
    return this.save();
};

// Method to add a timeline event
InvestigationSchema.methods.addTimelineEvent = function(event, description, user = null) {
    this.timeline.push({
        event,
        description,
        timestamp: new Date(),
        user: user || this.owner
    });
    
    return this.save();
};

// Method to add a note
InvestigationSchema.methods.addNote = function(content, author, isPrivate = false) {
    this.notes.push({
        content,
        author,
        isPrivate,
        createdAt: new Date()
    });
    
    this.addTimelineEvent('note_added', 'New note added to investigation', author);
    return this.save();
};

// Method to add a target
InvestigationSchema.methods.addTarget = function(type, value, notes = '') {
    // Check if target already exists
    const existingTarget = this.targets.find(t => t.type === type && t.value === value);
    if (existingTarget) {
        return Promise.resolve(this);
    }
    
    this.targets.push({
        type,
        value,
        notes,
        addedAt: new Date()
    });
    
    this.addTimelineEvent('target_added', `New target added: ${type} - ${value}`);
    return this.save();
};

// Method to check if user has access
InvestigationSchema.methods.hasAccess = function(userId, requiredRole = 'viewer') {
    // Owner always has access
    if (this.owner.toString() === userId.toString()) {
        return true;
    }
    
    // Check if user is a collaborator with sufficient role
    const collaborator = this.collaborators.find(c => c.user.toString() === userId.toString());
    if (!collaborator) {
        return this.isPublic;
    }
    
    const roleHierarchy = { viewer: 0, editor: 1, owner: 2 };
    return roleHierarchy[collaborator.role] >= roleHierarchy[requiredRole];
};

// Method to get investigation summary
InvestigationSchema.methods.getSummary = function() {
    return {
        id: this._id,
        title: this.title,
        category: this.category,
        status: this.status,
        priority: this.priority,
        totalTargets: this.targets.length,
        totalFindings: this.metadata.totalFindings,
        lastActivity: this.metadata.lastActivity,
        timeSpent: this.metadata.timeSpent,
        collaborators: this.collaborators.length,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

// Static method to find investigations by user
InvestigationSchema.statics.findByUser = function(userId, options = {}) {
    const query = {
        $or: [
            { owner: userId },
            { 'collaborators.user': userId },
            { isPublic: true }
        ]
    };
    
    if (options.status) {
        query.status = options.status;
    }
    
    if (options.category) {
        query.category = options.category;
    }
    
    return this.find(query)
        .populate('owner', 'username firstName lastName')
        .populate('collaborators.user', 'username firstName lastName')
        .sort({ updatedAt: -1 });
};

// Virtual for investigation progress
InvestigationSchema.virtual('progress').get(function() {
    if (this.status === 'completed') return 100;
    if (this.status === 'paused') return 50;
    if (this.metadata.totalFindings === 0) return 0;
    
    // Calculate progress based on findings and targets
    const targetProgress = Math.min(this.metadata.totalFindings / this.targets.length * 100, 90);
    return Math.round(targetProgress);
});

module.exports = mongoose.model('Investigation', InvestigationSchema);
