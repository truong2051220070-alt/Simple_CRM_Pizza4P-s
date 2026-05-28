import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// Use Vite environment variable or fallback for different environments
const API_URL = import.meta.env.VITE_API_URL || '';

function App() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Fetch customers
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/customers`);
      setCustomers(response.data.data);
      setError('');
    } catch (err) {
      setError(`Error loading customers: ${err.message}`);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load customers on mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Create or update customer
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required');
      return;
    }

    setLoading(true);
    try {
      let response;
      if (editingId) {
        // Update
        response = await axios.put(`${API_URL}/api/customers/${editingId}`, form);
        setCustomers(customers.map(c => c.id === editingId ? response.data.data : c));
        setSuccess('Customer updated successfully');
      } else {
        // Create
        response = await axios.post(`${API_URL}/api/customers`, form);
        setCustomers([response.data.data, ...customers]);
        setSuccess('Customer created successfully');
      }

      setForm({ name: '', email: '', phone: '', address: '' });
      setEditingId(null);
      setError('');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(`Error: ${errorMsg}`);
      console.error('Submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Edit customer
  const handleEdit = (customer) => {
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address
    });
    setEditingId(customer.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel edit
  const handleCancel = () => {
    setForm({ name: '', email: '', phone: '', address: '' });
    setEditingId(null);
  };

  // Delete customer
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;

    setLoading(true);
    try {
      await axios.delete(`${API_URL}/api/customers/${id}`);
      setCustomers(customers.filter(c => c.id !== id));
      setSuccess('Customer deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Error deleting customer: ${err.message}`);
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Search customers (called by button click)
  const handleSearchClick = async () => {
    if (!search.trim()) {
      fetchCustomers();
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/customers/search`, {
        params: { query: search.trim() }
      });
      setCustomers(response.data.data);
      setError('');
    } catch (err) {
      setError(`Error searching: ${err.message}`);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Clear search and show all
  const handleClearSearch = () => {
    setSearch('');
    fetchCustomers();
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🍕 Simple CRM - Pizza 4P's</h1>
        <p>Customer Management System</p>
      </header>

      <div className="container">
        {/* Error Message */}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Success Message */}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Form Section */}
        <section className="form-section">
          <h2>{editingId ? 'Update Customer' : 'Add New Customer'}</h2>
          <form onSubmit={handleSubmit} className="form">
            <input
              type="text"
              placeholder="Customer Name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={loading}
              required
            />
            <input
              type="email"
              placeholder="Email *"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={loading}
              required
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              disabled={loading}
            />
            <input
              type="text"
              placeholder="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              disabled={loading}
            />
            <div className="button-group">
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Processing...' : editingId ? 'Update Customer' : 'Add Customer'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Search Section */}
        <section className="search-section">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
              disabled={loading}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchClick()}
            />
            <button
              onClick={handleSearchClick}
              disabled={loading}
              className="btn btn-search"
              title="Search"
            >
              🔍
            </button>
            {search && (
              <button
                onClick={handleClearSearch}
                disabled={loading}
                className="btn btn-clear"
                title="Clear"
              >
                ✕
              </button>
            )}
          </div>
        </section>

        {/* Customers Table */}
        <section className="table-section">
          <h2>Customers ({customers.length})</h2>
          {loading && <p className="loading">Loading...</p>}
          {customers.length === 0 && !loading && (
            <p className="empty">No customers found. Add one to get started!</p>
          )}
          {customers.length > 0 && (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td><strong>{customer.name}</strong></td>
                      <td>{customer.email}</td>
                      <td>{customer.phone || '-'}</td>
                      <td>{customer.address || '-'}</td>
                      <td>
                        <span className={`badge badge-${customer.status}`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="actions">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="btn btn-sm btn-edit"
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="btn btn-sm btn-delete"
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <footer className="footer">
        <p>Simple CRM © 2024 | API: {API_URL}</p>
      </footer>
    </div>
  );
}

export default App;
