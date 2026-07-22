/**
 * Unit tests for the auth controller logic.
 * Uses an in-memory approach: we directly test the register/login/refresh functions
 * by mocking Express req/res objects so no live MongoDB is needed.
 *
 * For full integration tests, add supertest + an in-memory MongoDB helper.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Set up JWT secrets for the tests
process.env.JWT_ACCESS_SECRET = 'test-access-secret-abc123';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-xyz789';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';

// Mock the User model
jest.mock('../src/models/User', () => {
  const users = [];
  return {
    findOne: jest.fn(({ email }) => {
      return Promise.resolve(users.find((u) => u.email === email) || null);
    }),
    findById: jest.fn((id) => {
      const user = users.find((u) => u._id === id);
      return {
        select: jest.fn().mockResolvedValue(user || null),
      };
    }),
    create: jest.fn((data) => {
      const user = {
        _id: 'user_' + Math.random().toString(36).slice(2, 8),
        ...data,
      };
      users.push(user);
      return Promise.resolve(user);
    }),
    _clearAll: () => {
      users.length = 0;
    },
    _getAll: () => users,
  };
});

const authController = require('../src/controllers/auth.controller');
const User = require('../src/models/User');

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

beforeEach(() => {
  User._clearAll();
  jest.clearAllMocks();
});

describe('auth.controller — register', () => {
  it('returns 400 if name, email, or password are missing', async () => {
    const res = mockRes();
    await authController.register({ body: { email: 'a@b.com' } }, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it('creates a candidate user and returns tokens', async () => {
    const res = mockRes();
    await authController.register(
      { body: { name: 'Jane', email: 'jane@example.com', password: 'secret123' } },
      res
    );
    expect(res.statusCode).toBe(201);
    expect(res.body.user.name).toBe('Jane');
    expect(res.body.user.role).toBe('candidate');
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('allows recruiter role registration', async () => {
    const res = mockRes();
    await authController.register(
      { body: { name: 'Bob', email: 'bob@example.com', password: 'pass', role: 'recruiter' } },
      res
    );
    expect(res.statusCode).toBe(201);
    expect(res.body.user.role).toBe('recruiter');
  });

  it('returns 409 for duplicate email', async () => {
    const res1 = mockRes();
    await authController.register(
      { body: { name: 'A', email: 'dup@test.com', password: 'p' } },
      res1
    );
    expect(res1.statusCode).toBe(201);

    // Mock findOne to return the existing user
    User.findOne.mockResolvedValueOnce({ _id: 'x', email: 'dup@test.com' });

    const res2 = mockRes();
    await authController.register(
      { body: { name: 'B', email: 'dup@test.com', password: 'p' } },
      res2
    );
    expect(res2.statusCode).toBe(409);
  });
});

describe('auth.controller — login', () => {
  it('returns 400 if email or password are missing', async () => {
    const res = mockRes();
    await authController.login({ body: {} }, res);
    expect(res.statusCode).toBe(400);
  });

  it('returns 401 for non-existent user', async () => {
    const res = mockRes();
    await authController.login({ body: { email: 'nope@test.com', password: 'x' } }, res);
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 for wrong password', async () => {
    const hash = await bcrypt.hash('correct', 10);
    User.findOne.mockResolvedValueOnce({ _id: 'u1', email: 'test@test.com', passwordHash: hash, role: 'candidate' });

    const res = mockRes();
    await authController.login({ body: { email: 'test@test.com', password: 'wrong' } }, res);
    expect(res.statusCode).toBe(401);
  });

  it('returns tokens for correct credentials', async () => {
    const hash = await bcrypt.hash('correct', 10);
    User.findOne.mockResolvedValueOnce({
      _id: 'u1', name: 'Test', email: 'test@test.com', passwordHash: hash, role: 'candidate',
    });

    const res = mockRes();
    await authController.login({ body: { email: 'test@test.com', password: 'correct' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });
});

describe('auth.controller — refresh', () => {
  it('returns 400 if refreshToken is missing', async () => {
    const res = mockRes();
    await authController.refresh({ body: {} }, res);
    expect(res.statusCode).toBe(400);
  });

  it('returns a new accessToken for a valid refresh token', async () => {
    const token = jwt.sign({ sub: 'u1' }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    User.findById.mockReturnValueOnce(Promise.resolve({ _id: 'u1', role: 'candidate' }));

    const res = mockRes();
    await authController.refresh({ body: { refreshToken: token } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('returns 401 for an expired or invalid token', async () => {
    const res = mockRes();
    await authController.refresh({ body: { refreshToken: 'garbage-token' } }, res);
    expect(res.statusCode).toBe(401);
  });
});
