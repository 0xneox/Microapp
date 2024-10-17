const NodeCache = require('node-cache');
const userCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

exports.getCachedUser = async (userId, fetchFunction) => {
  let user = userCache.get(userId);
  if (user === undefined) {
    user = await fetchFunction(userId);
    userCache.set(userId, user);
  }
  return user;
};

exports.updateCachedUser = (userId, userData) => {
  userCache.set(userId, userData);
};
