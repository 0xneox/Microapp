const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config');

beforeAll(async () => {
  await mongoose.connect(config.mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('User Routes', () => {
  let token;

  beforeEach(async () => {
    await User.deleteMany({});
    const user = new User({ telegramId: '123', username: 'testuser' });
    await user.save();
    token = jwt.sign({ id: user.telegramId, username: user.username }, config.jwtSecret);
  });

  test('GET /api/users/profile should return user profile', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe('testuser');
  });

  // Add more tests for other user routes
});
