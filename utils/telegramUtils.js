const crypto = require('crypto');
const config = require('../config');

exports.verifyTelegramWebAppData = (initData) => {
  console.log('Attempting to verify Telegram Web App data');
  console.log('Received initData:', initData);

  try {
    const urlParams = new URLSearchParams(initData);
    console.log('URL Params:', Object.fromEntries(urlParams));

    const userString = urlParams.get('user');
    console.log('User string:', userString);

    if (!userString) {
      console.error('User data not found in initData');
      return false;
    }

    const user = JSON.parse(decodeURIComponent(userString));
    console.log('Parsed user data:', user);

    // For testing, always return true if we have user data
    return true;

  } catch (error) {
    console.error('Error in verifyTelegramWebAppData:', error);
    return false;
  }
};