// Test environment setup
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/instest_test';
process.env.SENDGRID_API_KEY = 'test-api-key';
process.env.FRONTEND_URL = 'http://localhost:5173';
