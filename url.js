const crypto = require('crypto');

function createTestInitData(botToken) {
  // Sample user data
  const user = {
    id: 433026815,
    first_name: "neohex",
    last_name: "neo",
    username: "binarybodhi",
    language_code: "en"
  };

  // Current timestamp
  const authDate = Math.floor(Date.now() / 1000);

  // Create the data string
  let dataString = `query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=${encodeURIComponent(JSON.stringify(user))}&auth_date=${authDate}`;

  // Generate hash
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = crypto.createHmac('sha256', secretKey).update(dataString).digest('hex');

  // Append hash to the data string
  dataString += `&hash=${hash}`;

  return dataString;
}

// Usage
const botToken = '7498025356:AAF50Vd2lYx3YqopGg_3VMM0kxg_x_Ptro0';
const initData = createTestInitData(botToken);
console.log(initData);