const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Basic CORS setup - NO HELMET to avoid CSP issues
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
}));

app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/osint-nexus';
mongoose.connect(mongoUri)
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
console.error('MongoDB connection error:', err);
console.log('Continuing without database - some features may not work');
});

// Socket.io connection handling
io.on('connection', (socket) => {
console.log('User connected:', socket.id);
    
    socket.on('disconnect', () => {
console.log('User disconnected:', socket.id);
    });
});

// Make io accessible to routes
app.set('socketio', io);

// Routes
app.use('/api/tools', require('./routes/tools'));
app.use('/api/osint', require('./routes/osint'));
app.use('/api/analysis', require('./routes/analysis'));
app.use('/api/analysis-sessions', require('./routes/analysis-sessions'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reports', require('./routes/reports'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Serve static files for development
app.use(express.static(path.join(__dirname, 'public')));

// Development route - serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Favicon
app.get('/favicon.ico', (req, res) => {
    res.status(204).send();
});

// API info route
app.get('/api', (req, res) => {
    res.json({ 
        message: 'OSINT Nexus API Server Running',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            tools: '/api/tools',
            osint: '/api/osint'
        }
    });
});

// Global error handler
app.use((err, req, res, next) => {
console.error('Error:', err.stack);
    res.status(500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
console.log('\nOSINT Nexus server started successfully!');
console.log(`Server running on port ${PORT}`);
console.log(`Access URL: http://localhost:${PORT}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log('MongoDB:', mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...');
console.log('\nReady for OSINT operations!\n');
});

module.exports = app;
