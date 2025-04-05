const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Sequelize instance
const sequelize = new Sequelize(
    process.env.DB_NAME || 'ebms_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        port: process.env.DB_PORT || 3306,
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: true,
            freezeTableName: true
        },
        timezone: '+07:00' // Indonesia timezone
    }
);

// Test the connection
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

// Create tables if they don't exist
async function syncDatabase() {
    try {
        await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
        console.log('Database synchronized successfully.');
    } catch (error) {
        console.error('Error synchronizing database:', error);
    }
}

// Export the connection and utility functions
module.exports = {
    sequelize,
    testConnection,
    syncDatabase,
    Sequelize
};