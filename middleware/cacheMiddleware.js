const createRedisClient = require('../utils/redisClient');
const redis = createRedisClient();

const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    const key = '__express__' + req.originalUrl || req.url;
    redis.get(key, (err, reply) => {
      if (err) {
        console.error('Redis error:', err);
        return next();
      }
      if (reply) {
        res.send(JSON.parse(reply));
      } else {
        res.sendResponse = res.send;
        res.send = (body) => {
          redis.set(key, JSON.stringify(body), 'EX', duration);
          res.sendResponse(body);
        };
        next();
      }
    });
  };
};

module.exports = cacheMiddleware;
