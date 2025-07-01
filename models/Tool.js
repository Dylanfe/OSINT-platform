const mongoose = require('mongoose');

const ToolSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            'search-engines',
            'social-media',
            'people-search',
            'email-investigation',
            'domain-ip',
            'image-analysis',
            'metadata',
            'geolocation',
            'username-search',
            'phone-investigation',
            'breach-data',
            'corporate-research',
            'dark-web',
            'threat-intelligence',
            'code-search',
            'transportation',
            'cryptocurrency',
            'academic',
            'news-media',
            'government',
            'archives',
            'encoding-decoding',
            'network-analysis',
            'malware-analysis',
            'password-security',
            'vpn-privacy',
            'browser-extensions',
            'mobile-forensics',
            'other'
        ]
    },
    subcategory: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    url: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['website', 'api', 'tool', 'extension', 'software', 'script'],
        default: 'website'
    },
    pricing: {
        type: String,
        enum: ['free', 'freemium', 'paid', 'subscription'],
        default: 'free'
    },
    requiresRegistration: {
        type: Boolean,
        default: false
    },
    requiresApiKey: {
        type: Boolean,
        default: false
    },
    tags: [{
        type: String,
        trim: true
    }],
    features: [{
        type: String,
        trim: true
    }],
    limitations: [{
        type: String,
        trim: true
    }],
    apiEndpoint: {
        type: String,
        trim: true
    },
    documentation: {
        type: String,
        trim: true
    },
    rateLimit: {
        requests: Number,
        period: String,
        description: String
    },
    inputTypes: [{
        type: String,
        enum: [
            'email',
            'domain',
            'ip',
            'username',
            'phone',
            'name',
            'company',
            'hash',
            'url',
            'image',
            'coordinates',
            'social-profile',
            'cryptocurrency-address',
            'file',
            'text',
            'other'
        ]
    }],
    outputTypes: [{
        type: String,
        enum: [
            'json',
            'xml',
            'csv',
            'html',
            'text',
            'image',
            'pdf',
            'report',
            'visualization',
            'other'
        ]
    }],
    accuracy: {
        type: String,
        enum: ['low', 'medium', 'high', 'variable'],
        default: 'medium'
    },
    reliability: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    lastVerified: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isOfficial: {
        type: Boolean,
        default: false
    },
    region: [{
        type: String,
        enum: ['global', 'us', 'eu', 'asia', 'africa', 'oceania', 'americas'],
        default: 'global'
    }],
    language: [{
        type: String,
        default: 'en'
    }],
    methodology: {
        type: String,
        enum: ['passive', 'active', 'both'],
        default: 'passive'
    },
    opsecRisk: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low'
    },
    legalConsiderations: [{
        type: String,
        trim: true
    }],
    usageExamples: [{
        scenario: String,
        input: String,
        expectedOutput: String
    }],
    relatedTools: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tool'
    }],
    alternatives: [{
        name: String,
        url: String,
        reason: String
    }],
    screenshots: [{
        url: String,
        description: String
    }],
    tutorials: [{
        title: String,
        url: String,
        type: String // video, article, documentation
    }],
    reviews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    statistics: {
        totalUses: {
            type: Number,
            default: 0
        },
        successRate: {
            type: Number,
            default: 0
        },
        averageRating: {
            type: Number,
            default: 0
        },
        totalReviews: {
            type: Number,
            default: 0
        },
        lastUsed: {
            type: Date,
            default: Date.now
        }
    },
    metadata: {
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        verifiedBy: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            verifiedAt: {
                type: Date,
                default: Date.now
            }
        }],
        source: {
            type: String,
            enum: ['manual', 'import', 'api', 'community'],
            default: 'manual'
        }
    }
}, {
    timestamps: true
});

// Indexes for better search performance
ToolSchema.index({ name: 'text', description: 'text', tags: 'text' });
ToolSchema.index({ category: 1, subcategory: 1 });
ToolSchema.index({ pricing: 1, isActive: 1 });
ToolSchema.index({ inputTypes: 1 });
ToolSchema.index({ 'statistics.averageRating': -1 });
ToolSchema.index({ 'statistics.totalUses': -1 });
ToolSchema.index({ lastVerified: -1 });

// Pre-save middleware to update statistics
ToolSchema.pre('save', function(next) {
    if (this.isModified('reviews')) {
        const reviews = this.reviews;
        if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            this.statistics.averageRating = totalRating / reviews.length;
            this.statistics.totalReviews = reviews.length;
        }
    }
    next();
});

// Method to add a review
ToolSchema.methods.addReview = function(userId, rating, comment) {
    // Check if user already reviewed this tool
    const existingReview = this.reviews.find(r => r.user.toString() === userId.toString());
    
    if (existingReview) {
        existingReview.rating = rating;
        existingReview.comment = comment;
        existingReview.createdAt = new Date();
    } else {
        this.reviews.push({
            user: userId,
            rating,
            comment,
            createdAt: new Date()
        });
    }
    
    return this.save();
};

// Method to increment usage statistics
ToolSchema.methods.incrementUsage = function(success = true) {
    this.statistics.totalUses += 1;
    this.statistics.lastUsed = new Date();
    
    if (success) {
        // Update success rate (simple moving average)
        const currentSuccessRate = this.statistics.successRate || 0;
        const totalUses = this.statistics.totalUses;
        this.statistics.successRate = ((currentSuccessRate * (totalUses - 1)) + 1) / totalUses;
    }
    
    return this.save();
};

// Method to check if tool is suitable for input type
ToolSchema.methods.supportsInput = function(inputType) {
    return this.inputTypes.includes(inputType);
};

// Method to get tool summary
ToolSchema.methods.getSummary = function() {
    return {
        id: this._id,
        name: this.name,
        category: this.category,
        subcategory: this.subcategory,
        description: this.description,
        url: this.url,
        type: this.type,
        pricing: this.pricing,
        requiresRegistration: this.requiresRegistration,
        requiresApiKey: this.requiresApiKey,
        tags: this.tags,
        inputTypes: this.inputTypes,
        outputTypes: this.outputTypes,
        accuracy: this.accuracy,
        reliability: this.reliability,
        opsecRisk: this.opsecRisk,
        averageRating: this.statistics.averageRating,
        totalUses: this.statistics.totalUses,
        isActive: this.isActive
    };
};

// Static method to find tools by category
ToolSchema.statics.findByCategory = function(category, options = {}) {
    const query = { category, isActive: true };
    
    if (options.pricing) {
        query.pricing = options.pricing;
    }
    
    if (options.inputType) {
        query.inputTypes = options.inputType;
    }
    
    return this.find(query).sort({ 'statistics.averageRating': -1, 'statistics.totalUses': -1 });
};

// Static method to search tools
ToolSchema.statics.searchTools = function(searchTerm, filters = {}) {
    const query = {
        $and: [
            { isActive: true },
            {
                $or: [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { description: { $regex: searchTerm, $options: 'i' } },
                    { tags: { $regex: searchTerm, $options: 'i' } }
                ]
            }
        ]
    };
    
    if (filters.category) {
        query.$and.push({ category: filters.category });
    }
    
    if (filters.pricing) {
        query.$and.push({ pricing: filters.pricing });
    }
    
    if (filters.inputType) {
        query.$and.push({ inputTypes: filters.inputType });
    }
    
    if (filters.opsecRisk) {
        query.$and.push({ opsecRisk: filters.opsecRisk });
    }
    
    return this.find(query).sort({ 'statistics.averageRating': -1, 'statistics.totalUses': -1 });
};

// Static method to get recommended tools
ToolSchema.statics.getRecommended = function(limit = 10) {
    return this.find({ isActive: true })
        .sort({ 'statistics.averageRating': -1, 'statistics.totalUses': -1 })
        .limit(limit);
};

// Virtual for tool status
ToolSchema.virtual('status').get(function() {
    const daysSinceVerified = (Date.now() - this.lastVerified) / (1000 * 60 * 60 * 24);
    
    if (!this.isActive) return 'inactive';
    if (daysSinceVerified > 90) return 'needs-verification';
    if (daysSinceVerified > 30) return 'verification-due';
    return 'verified';
});

module.exports = mongoose.model('Tool', ToolSchema);
