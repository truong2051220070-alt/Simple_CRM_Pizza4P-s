# Simple CRM Backend - Pizza 4P's

Node.js + Express + MongoDB API Server

## Setup

```bash
npm install
npm start
```

## Environment Variables

- `PORT` - Server port (default: 5000)
- `DB_URL` - MongoDB connection string
- `NODE_ENV` - Environment (production/development)
- `LOG_LEVEL` - Log level (info/debug/error)

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/customers` - List all customers
- `GET /api/customers/:id` - Get customer by ID
- `GET /api/customers/search/:keyword` - Search customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
