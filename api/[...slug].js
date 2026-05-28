const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  return (req, res) => {
    res.status(500).json({ error: 'Supabase not configured' });
  };
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
      const { data: connectionTest } = await supabase.from('customers').select('count()', { count: 'exact', head: true });
      return res.status(200).json({ success: true, message: 'API is running', database: 'connected', timestamp: new Date().toISOString() });
    }

    // GET /api/customers
    if (req.method === 'GET' && path === '/customers') {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    // GET /api/customers/search?query=...
    if (req.method === 'GET' && path === '/customers/search') {
      const query = req.query.query;

      if (!query) {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return res.status(200).json({ success: true, data });
      }

      const searchTerm = `%${query}%`;
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .is('deleted_at', null)
        .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},address.ilike.${searchTerm}`);

      if (error) throw error;
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

      const { data, error } = await supabase
        .from('customers')
        .insert([{ name, email, phone: phone || null, address: address || null, status: 'active' }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return res.status(409).json({ message: 'Email already exists' });
        }
        throw error;
      }

      return res.status(201).json({ success: true, data });
    }

    // GET /api/customers/:id
    if (req.method === 'GET' && path.match(/^\/customers\/[^/]+$/)) {
      const id = path.split('/').pop();
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) throw error;
      if (!data) return res.status(404).json({ message: 'Customer not found' });
      return res.status(200).json({ success: true, data });
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

      const { data, error } = await supabase
        .from('customers')
        .update({ name, email, phone: phone || null, address: address || null, updated_at: new Date() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return res.status(409).json({ message: 'Email already exists' });
        }
        throw error;
      }

      if (!data) return res.status(404).json({ message: 'Customer not found' });
      return res.status(200).json({ success: true, data });
    }

    // DELETE /api/customers/:id
    if (req.method === 'DELETE' && path.match(/^\/customers\/[^/]+$/)) {
      const id = path.split('/').pop();

      const { data, error } = await supabase
        .from('customers')
        .update({ deleted_at: new Date() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) return res.status(404).json({ message: 'Customer not found' });
      return res.status(200).json({ success: true, data });
    }

    return res.status(404).json({ message: 'Route not found' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
