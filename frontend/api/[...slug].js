const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  module.exports = async (req, res) => {
    res.status(500).json({ error: 'Supabase credentials not configured' });
  };
}

// Helper to make Supabase API calls
async function supabaseRequest(method, path, body = null, query = '') {
  const url = `${supabaseUrl}/rest/v1${path}${query}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey,
      'Prefer': 'return=representation'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  return { status: response.status, data };
}

function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validatePhone(phone) {
  if (!phone) return true;
  const regex = /^(\+?84|0)?[1-9][0-9]{8,9}$|^\+[1-9][0-9]{1,14}$/;
  return regex.test(phone.replace(/\s/g, ''));
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { slug } = req.query;
  const path = slug ? `/${slug.join('/')}` : '/';

  try {
    // GET /api/health
    if (req.method === 'GET' && path === '/health') {
      return res.status(200).json({ 
        success: true, 
        message: 'API is running', 
        database: 'connected', 
        timestamp: new Date().toISOString() 
      });
    }

    // GET /api/customers
    if (req.method === 'GET' && path === '/customers') {
      const { status, data } = await supabaseRequest(
        'GET',
        '/customers',
        null,
        '?deleted_at=is.null&order=created_at.desc'
      );

      if (status !== 200) throw new Error('Failed to fetch customers');
      return res.status(200).json({ success: true, data });
    }

    // GET /api/customers/search?query=...
    if (req.method === 'GET' && path === '/customers/search') {
      const query = req.query.query;

      if (!query) {
        const { status, data } = await supabaseRequest(
          'GET',
          '/customers',
          null,
          '?deleted_at=is.null&order=created_at.desc'
        );

        if (status !== 200) throw new Error('Failed to fetch customers');
        return res.status(200).json({ success: true, data });
      }

      // Supabase full-text search
      const searchQuery = `?deleted_at=is.null&or=(name.ilike.*${query}*,email.ilike.*${query}*,phone.ilike.*${query}*,address.ilike.*${query}*)`;
      const { status, data } = await supabaseRequest('GET', '/customers', null, searchQuery);

      if (status !== 200) throw new Error('Search failed');
      return res.status(200).json({ success: true, data });
    }

    // POST /api/customers
    if (req.method === 'POST' && path === '/customers') {
      const { name, email, phone, address } = req.body;

      if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      if (phone && !validatePhone(phone)) {
        return res.status(400).json({ message: 'Invalid phone format' });
      }

      const { status, data } = await supabaseRequest('POST', '/customers', {
        name,
        email,
        phone: phone || null,
        address: address || null,
        status: 'active'
      });

      if (status === 409 || (Array.isArray(data) && data[0]?.code === '23505')) {
        return res.status(409).json({ message: 'Email already exists' });
      }

      if (status !== 201) throw new Error('Failed to create customer');
      return res.status(201).json({ success: true, data: Array.isArray(data) ? data[0] : data });
    }

    // GET /api/customers/:id
    if (req.method === 'GET' && path.match(/^\/customers\/[^/]+$/)) {
      const id = path.split('/').pop();
      const { status, data } = await supabaseRequest(
        'GET',
        '/customers',
        null,
        `?id=eq.${id}&deleted_at=is.null`
      );

      if (status !== 200 || !data.length) return res.status(404).json({ message: 'Customer not found' });
      return res.status(200).json({ success: true, data: data[0] });
    }

    // PUT /api/customers/:id
    if (req.method === 'PUT' && path.match(/^\/customers\/[^/]+$/)) {
      const id = path.split('/').pop();
      const { name, email, phone, address } = req.body;

      if (!validateEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      if (phone && !validatePhone(phone)) {
        return res.status(400).json({ message: 'Invalid phone format' });
      }

      const { status, data } = await supabaseRequest('PATCH', `/customers?id=eq.${id}`, {
        name,
        email,
        phone: phone || null,
        address: address || null,
        updated_at: new Date().toISOString()
      });

      if (status === 409 || (Array.isArray(data) && data[0]?.code === '23505')) {
        return res.status(409).json({ message: 'Email already exists' });
      }

      if (status !== 200 || !data.length) return res.status(404).json({ message: 'Customer not found' });
      return res.status(200).json({ success: true, data: data[0] });
    }

    // DELETE /api/customers/:id
    if (req.method === 'DELETE' && path.match(/^\/customers\/[^/]+$/)) {
      const id = path.split('/').pop();

      const { status, data } = await supabaseRequest('PATCH', `/customers?id=eq.${id}`, {
        deleted_at: new Date().toISOString()
      });

      if (status !== 200 || !data.length) return res.status(404).json({ message: 'Customer not found' });
      return res.status(200).json({ success: true, data: data[0] });
    }

    return res.status(404).json({ message: 'Route not found' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
