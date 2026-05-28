const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Validate email format
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Validate phone format (Vietnamese + international)
function validatePhone(phone) {
  if (!phone) return true; // Phone is optional
  const regex = /^(\+?84|0)?[1-9][0-9]{8,9}$|^\+[1-9][0-9]{1,14}$/;
  return regex.test(phone.replace(/\s/g, ''));
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // GET /api/customers
    if (req.method === 'GET' && req.url === '/api/customers') {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    // POST /api/customers
    if (req.method === 'POST' && req.url === '/api/customers') {
      const { name, email, phone, address } = req.body;

      if (!validateEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      if (!validatePhone(phone)) {
        return res.status(400).json({ message: 'Invalid phone format' });
      }

      const { data, error } = await supabase
        .from('customers')
        .insert([{ name, email, phone, address, status: 'active' }])
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

    // PUT /api/customers/:id
    if (req.method === 'PUT' && req.url.match(/^\/api\/customers\/[^/]+$/)) {
      const id = req.url.split('/').pop();
      const { name, email, phone, address } = req.body;

      if (!validateEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      if (!validatePhone(phone)) {
        return res.status(400).json({ message: 'Invalid phone format' });
      }

      const { data, error } = await supabase
        .from('customers')
        .update({ name, email, phone, address, updated_at: new Date() })
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
    if (req.method === 'DELETE' && req.url.match(/^\/api\/customers\/[^/]+$/)) {
      const id = req.url.split('/').pop();

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

    // GET /api/customers/search
    if (req.method === 'GET' && req.url.includes('/api/customers/search')) {
      const query = new URL(req.url, 'http://localhost').searchParams.get('query');

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

    return res.status(404).json({ message: 'Route not found' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
