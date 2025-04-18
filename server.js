// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./db/database');
const authRoutes = require('./routes/authRoutes'); // ✅ import routes

const app = express();

// ✅ Connect to MongoDB
connectDB();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Use routes
app.use('/api/auth', authRoutes); // ✅ all routes will be prefixed with /api/auth

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
