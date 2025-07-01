const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    role: {
        type: String,
        enum: ['user', 'analyst', 'admin'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    avatar: {
        type: String,
        default: ''
    },
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'auto'
        },
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            push: {
                type: Boolean,
                default: true
            },
            reports: {
                type: Boolean,
                default: true
            }
        },
        defaultSearchEngine: {
            type: String,
            default: 'google'
        },
        autoSaveResults: {
            type: Boolean,
            default: true
        }
    },
    apiKeys: {
        shodan: { type: String, default: '' },
        haveibeenpwned: { type: String, default: '' },
        hunter: { type: String, default: '' },
        censys: { type: String, default: '' },
        securitytrails: { type: String, default: '' },
        virustotal: { type: String, default: '' },
        opencorporates: { type: String, default: '' },
        tineye: { type: String, default: '' },
        serpapi: { type: String, default: '' },
        pipl: { type: String, default: '' },
        criminalip: { type: String, default: '' },
        greynoise: { type: String, default: '' },
        abuseipdb: { type: String, default: '' }
    },
    investigations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Investigation'
    }],
    favoriteTools: [{
        type: String
    }],
    searchHistory: [{
        query: String,
        type: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        results: Number
    }],
    lastLogin: {
        type: Date,
        default: Date.now
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    verificationToken: String
}, {
    timestamps: true
});

// Virtual for user's full name
UserSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for account locked
UserSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Index for text search
UserSchema.index({ username: 'text', email: 'text', firstName: 'text', lastName: 'text' });

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        // Hash password with cost of 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to check password
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method to increment login attempts
UserSchema.methods.incLoginAttempts = function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Lock account after 5 failed attempts for 2 hours
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = {
            lockUntil: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
        };
    }
    
    return this.updateOne(updates);
};

// Method to reset login attempts
UserSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

// Method to add to search history
UserSchema.methods.addToSearchHistory = function(query, type, results) {
    this.searchHistory.unshift({
        query,
        type,
        results,
        timestamp: new Date()
    });
    
    // Keep only last 100 searches
    if (this.searchHistory.length > 100) {
        this.searchHistory = this.searchHistory.slice(0, 100);
    }
    
    return this.save();
};

// Method to update last login
UserSchema.methods.updateLastLogin = function() {
    this.lastLogin = new Date();
    return this.save();
};

// Static method to find by email or username
UserSchema.statics.findByLogin = function(login) {
    return this.findOne({
        $or: [
            { email: login.toLowerCase() },
            { username: login }
        ]
    });
};

// Method to get safe user object (without sensitive data)
UserSchema.methods.toSafeObject = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.apiKeys;
    delete userObject.resetPasswordToken;
    delete userObject.resetPasswordExpire;
    delete userObject.verificationToken;
    delete userObject.loginAttempts;
    delete userObject.lockUntil;
    return userObject;
};

module.exports = mongoose.model('User', UserSchema);
