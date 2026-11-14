
require('dotenv').config();

const express = require('express');
const pool = require('./src/config/db');
const db = require('./src/config/firebase');

const chatRoutes=require("./src/routes/chat.routes")

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Chat Backend API is running'
    });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await pool.query('SELECT 1');

        console.log('MySQL connected successfully');
        console.log('Firebase initialized successfully');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }
}

app.use("/chat", chatRoutes)

startServer();
