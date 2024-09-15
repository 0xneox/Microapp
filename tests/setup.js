// Mock MongoDB
jest.mock('mongoose', () => ({
    connect: jest.fn(),
    connection: {
      on: jest.fn(),
      once: jest.fn(),
    },
    model: jest.fn().mockReturnValue({}),
    Schema: jest.fn(),
  }));
  
  // Mock jsonwebtoken
  jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('mocked_token'),
    verify: jest.fn().mockImplementation((token, secret, callback) => {
      if (token === 'valid_token') {
        callback(null, { id: 'user_id', username: 'test_user' });
      } else {
        callback(new Error('Invalid token'));
      }
    }),
  }));
  
  // Mock node-telegram-bot-api
  jest.mock('node-telegram-bot-api', () => {
    return jest.fn().mockImplementation(() => {
      return {
        on: jest.fn(),
        sendMessage: jest.fn(),
      };
    });
  });
  
  // Add any other global mocks or setup needed for your tests
  
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
