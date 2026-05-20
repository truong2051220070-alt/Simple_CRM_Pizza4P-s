/**
 * Test Suite - Simple CRM Pizza 4P's API
 * QA/SRE Engineer Test Cases
 */

const request = require('supertest');
const app = require('../server');

// ============================================================
// TC-001: Health Check
// ============================================================
describe('TC-001: Health Check Endpoint', () => {
  test('GET /api/health - should return 200 with success', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('API is running');
    expect(res.body.database).toBe('connected');
    expect(res.body.timestamp).toBeDefined();
  });
});

// ============================================================
// TC-002: GET /api/customers
// ============================================================
describe('TC-002: Get All Customers', () => {
  test('should return 200 with data array', async () => {
    const res = await request(app).get('/api/customers');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(typeof res.body.count).toBe('number');
  });

  test('each customer should have required fields', async () => {
    const res = await request(app).get('/api/customers');
    if (res.body.data.length > 0) {
      const customer = res.body.data[0];
      expect(customer).toHaveProperty('id');
      expect(customer).toHaveProperty('name');
      expect(customer).toHaveProperty('email');
      expect(customer).toHaveProperty('status');
    }
  });
});

// ============================================================
// TC-003: POST /api/customers - Tạo customer mới
// ============================================================
describe('TC-003: Create Customer', () => {
  let createdId;

  test('should create customer with valid data', async () => {
    const newCustomer = {
      name: 'Test User QA',
      email: `qa.test.${Date.now()}@example.com`,
      phone: '0901234567',
      address: '123 Test Street'
    };

    const res = await request(app)
      .post('/api/customers')
      .send(newCustomer);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(newCustomer.name);
    expect(res.body.data.email).toBe(newCustomer.email.toLowerCase());
    expect(res.body.data.status).toBe('active');

    createdId = res.body.data.id;
  });

  test('should return 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/customers')
      .send({ email: 'test@example.com' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Name and email are required');
  });

  test('should return 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/customers')
      .send({ name: 'Test User' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Name and email are required');
  });

  test('should return 400 when email already exists', async () => {
    const duplicate = {
      name: 'Duplicate User',
      email: 'hoang.d@example.com' // email đã có trong DB
    };

    const res = await request(app)
      .post('/api/customers')
      .send(duplicate);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Email already exists');
  });

  // Cleanup: xóa customer vừa tạo
  afterAll(async () => {
    if (createdId) {
      await request(app).delete(`/api/customers/${createdId}`);
    }
  });
});

// ============================================================
// TC-004: GET /api/customers/search
// ============================================================
describe('TC-004: Search Customers', () => {
  test('should return results when searching by name', async () => {
    const res = await request(app)
      .get('/api/customers/search?query=Hoang');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('should return empty array for non-existent keyword', async () => {
    const res = await request(app)
      .get('/api/customers/search?query=xyznonexistent999');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  test('should filter by status=active', async () => {
    const res = await request(app)
      .get('/api/customers/search?status=active');

    expect(res.statusCode).toBe(200);
    res.body.data.forEach(c => {
      expect(c.status).toBe('active');
    });
  });
});

// ============================================================
// TC-005: PUT /api/customers/:id - Cập nhật customer
// ============================================================
describe('TC-005: Update Customer', () => {
  let testId;

  beforeAll(async () => {
    // Tạo customer để test update
    const res = await request(app)
      .post('/api/customers')
      .send({
        name: 'Update Test User',
        email: `update.test.${Date.now()}@example.com`
      });
    testId = res.body.data?.id;
  });

  test('should update customer successfully', async () => {
    if (!testId) return;

    const res = await request(app)
      .put(`/api/customers/${testId}`)
      .send({
        name: 'Updated Name',
        email: `updated.${Date.now()}@example.com`,
        phone: '0999999999',
        status: 'inactive'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Updated Name');
    expect(res.body.data.status).toBe('inactive');
  });

  test('should return 404 for non-existent ID', async () => {
    const res = await request(app)
      .put('/api/customers/00000000-0000-0000-0000-000000000000')
      .send({ name: 'Ghost', email: 'ghost@example.com' });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  afterAll(async () => {
    if (testId) {
      await request(app).delete(`/api/customers/${testId}`);
    }
  });
});

// ============================================================
// TC-006: DELETE /api/customers/:id
// ============================================================
describe('TC-006: Delete Customer', () => {
  let testId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/customers')
      .send({
        name: 'Delete Test User',
        email: `delete.test.${Date.now()}@example.com`
      });
    testId = res.body.data?.id;
  });

  test('should delete customer successfully', async () => {
    if (!testId) return;

    const res = await request(app)
      .delete(`/api/customers/${testId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Customer deleted successfully');
  });

  test('should return 404 when deleting non-existent customer', async () => {
    const res = await request(app)
      .delete('/api/customers/00000000-0000-0000-0000-000000000000');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ============================================================
// TC-007: 404 Route Not Found
// ============================================================
describe('TC-007: Unknown Routes', () => {
  test('should return 404 for unknown route', async () => {
    const res = await request(app).get('/api/unknown-route');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Route not found');
  });
});
