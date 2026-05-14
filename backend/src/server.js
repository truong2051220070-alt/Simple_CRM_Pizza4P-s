const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');

const app = express();

// ============ MIDDLEWARE ============
app.use(cors());
app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============ SUPABASE CONNECTION ============
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const PORT = process.env.PORT || 5000;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[✗] Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('[✓] Supabase initialized successfully');

// ============ API ROUTES ============

// 1. Health Check
app.get('/api/health', async (req, res) => {
  try {
    const { error } = await supabase
      .from('customers')
      .select('count()', { count: 'exact', head: true });

    if (error) throw error;

    res.json({
      success: true,
      message: 'API is running',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: err.message
    });
  }
});

// 2. Lấy tất cả khách hàng
app.get('/api/customers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (err) {
    console.error('[ERROR] Get customers:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: err.message
    });
  }
});

// 3. Tìm kiếm khách hàng
app.get('/api/customers/search', async (req, res) => {
  try {
    const { query = '', status = null, limit = 20, offset = 0 } = req.query;

    let queryBuilder = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .is('deleted_at', null);

    if (status) {
      queryBuilder = queryBuilder.eq('status', status);
    }

    if (query) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%,address.ilike.%${query}%`
      );
    }

    const { data, error, count } = await queryBuilder
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      total_count: count || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('[ERROR] Search customers:', err.message);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: err.message
    });
  }
});

// 4. Lấy chi tiết khách hàng
app.get('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error('[ERROR] Get customer:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
      error: err.message
    });
  }
});

// 5. Thêm khách hàng mới
app.post('/api/customers', async (req, res) => {
  try {
    const { name, email, phone, address, notes } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    const { data, error } = await supabase
      .from('customers')
      .insert([
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone?.trim() || null,
          address: address?.trim() || null,
          notes: notes?.trim() || null,
          status: 'active'
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data
    });
  } catch (err) {
    console.error('[ERROR] Create customer:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
      error: err.message
    });
  }
});

// 6. Cập nhật khách hàng
app.put('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, notes, status } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    const { data, error } = await supabase
      .from('customers')
      .update({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
        status: status || 'active'
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error || !data) {
      if (error?.code === '23505') {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data
    });
  } catch (err) {
    console.error('[ERROR] Update customer:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      error: err.message
    });
  }
});

// 7. Xóa khách hàng (Soft Delete)
app.delete('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('customers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (err) {
    console.error('[ERROR] Delete customer:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
      error: err.message
    });
  }
});

// ============ ERROR HANDLER ============
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============ 404 HANDLER ============
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ============ SERVER START ============
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🍕 SIMPLE CRM - PIZZA 4P'S BACKEND   ║
║  Server: http://localhost:${PORT}        ║
║  Status: ✓ Running                     ║
╚════════════════════════════════════════╝
  `);
  console.log('Available endpoints:');
  console.log('  GET    /api/health');
  console.log('  GET    /api/customers');
  console.log('  GET    /api/customers/search');
  console.log('  GET    /api/customers/:id');
  console.log('  POST   /api/customers');
  console.log('  PUT    /api/customers/:id');
  console.log('  DELETE /api/customers/:id');
});

module.exports = app;
