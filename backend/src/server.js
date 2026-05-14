const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const app = express();

// ============ MIDDLEWARE ============
app.use(cors());
app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============ DATABASE CONNECTION ============
const DB_URL = process.env.DB_URL || 'mongodb://localhost:27017/crm-db';
const PORT = process.env.PORT || 5000;

mongoose.connect(DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('[✓] MongoDB connected successfully');
  })
  .catch(err => {
    console.error('[✗] MongoDB connection error:', err.message);
    process.exit(1);
  });

// ============ SCHEMA & MODELS ============
const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Customer = mongoose.model('Customer', customerSchema);

// ============ ERROR HANDLER ============
const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err.message);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  });
};

// ============ ROUTES ============

// Health Check Endpoint (BẮTBUỘC)
app.get('/api/health', (req, res) => {
  try {
    console.log('[✓] Health check requested');
    res.status(200).json({
      status: 'ok',
      message: 'Simple CRM API is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('[✗] Health check error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// GET all customers
app.get('/api/customers', async (req, res, next) => {
  try {
    console.log('[→] GET /api/customers');
    const customers = await Customer.find().sort({ createdAt: -1 });
    console.log(`[✓] Retrieved ${customers.length} customers`);
    res.status(200).json({
      success: true,
      data: customers,
      count: customers.length,
      message: 'Customers retrieved successfully'
    });
  } catch (error) {
    console.error('[✗] GET /api/customers error:', error.message);
    next(error);
  }
});

// GET customer by ID
app.get('/api/customers/:id', async (req, res, next) => {
  try {
    console.log(`[→] GET /api/customers/${req.params.id}`);
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      console.warn('[!] Customer not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    console.log('[✓] Customer found:', customer._id);
    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('[✗] GET /api/customers/:id error:', error.message);
    next(error);
  }
});

// CREATE customer (POST)
app.post('/api/customers', async (req, res, next) => {
  try {
    const { name, email, phone, address } = req.body;
    
    console.log('[→] POST /api/customers', { name, email });
    
    if (!name || !email) {
      console.warn('[!] Missing required fields: name or email');
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }
    
    const customer = new Customer({
      name,
      email,
      phone: phone || '',
      address: address || ''
    });
    
    await customer.save();
    console.log('[✓] Customer created:', customer._id);
    
    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      console.warn('[!] Email already exists:', error.message);
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    console.error('[✗] POST /api/customers error:', error.message);
    next(error);
  }
});

// UPDATE customer (PUT)
app.put('/api/customers/:id', async (req, res, next) => {
  try {
    console.log(`[→] PUT /api/customers/${req.params.id}`, req.body);
    
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!customer) {
      console.warn('[!] Customer not found for update:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    console.log('[✓] Customer updated:', customer._id);
    res.status(200).json({
      success: true,
      data: customer,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    console.error('[✗] PUT /api/customers/:id error:', error.message);
    next(error);
  }
});

// DELETE customer (DELETE)
app.delete('/api/customers/:id', async (req, res, next) => {
  try {
    console.log(`[→] DELETE /api/customers/${req.params.id}`);
    
    const customer = await Customer.findByIdAndDelete(req.params.id);
    
    if (!customer) {
      console.warn('[!] Customer not found for delete:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    console.log('[✓] Customer deleted:', req.params.id);
    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('[✗] DELETE /api/customers/:id error:', error.message);
    next(error);
  }
});

// SEARCH customers
app.get('/api/customers/search/:keyword', async (req, res, next) => {
  try {
    const { keyword } = req.params;
    console.log(`[→] GET /api/customers/search/${keyword}`);
    
    const customers = await Customer.find({
      $or: [
        { name: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } },
        { phone: { $regex: keyword, $options: 'i' } }
      ]
    });
    
    console.log(`[✓] Search found ${customers.length} results`);
    res.status(200).json({
      success: true,
      data: customers,
      count: customers.length,
      keyword: keyword
    });
  } catch (error) {
    console.error('[✗] Search error:', error.message);
    next(error);
  }
});

// 404 Handler
app.use((req, res) => {
  console.warn('[!] 404 Not Found:', req.path);
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.path
  });
});

// Global Error Handler
app.use(errorHandler);

// ============ START SERVER ============
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   Simple CRM Backend - Pizza 4P's      ║
║   Server running on port ${PORT}           ║
║   Database: Connected                  ║
╚════════════════════════════════════════╝
  `);
});

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('\n[!] Server shutting down...');
  mongoose.connection.close();
  process.exit(0);
});

module.exports = app;
