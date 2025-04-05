const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const winston = require('winston');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize express
const app = express();

// Configure Winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    next();
});

// Routes
app.use('/api/accounting', require('./routes/accountingRoutes'));
app.use('/api/financial', require('./routes/financialRoutes'));
app.use('/api/frontdesk', require('./routes/frontdeskRoutes'));
app.use('/api/purchasing', require('./routes/purchasingRoutes'));
app.use('/api/logistics', require('./routes/logisticsRoutes'));
app.use('/api/personnel', require('./routes/personnelRoutes'));
app.use('/api/parking', require('./routes/parkingRoutes'));
app.use('/api/setup', require('./routes/setupRoutes'));
app.use('/api/paket', require('./routes/paketRoutes'));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    });
}

// Global error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled Error:', {
        error: err.message,
        stack: err.stack
    });

    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'An unexpected error occurred' 
            : err.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', {
        reason: reason,
        promise: promise
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', {
        error: error.message,
        stack: error.stack
    });
    process.exit(1);
});

// Database connection
const db = require('./config/database');

// Test database connection
db.authenticate()
    .then(() => {
        logger.info('Database connection established successfully.');
    })
    .catch(err => {
        logger.error('Unable to connect to the database:', err);
    });

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app; // For testing purposes