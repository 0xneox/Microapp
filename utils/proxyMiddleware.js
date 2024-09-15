const { createProxyMiddleware } = require('http-proxy-middleware');
const logger = require('./logger');

const proxyMiddleware = createProxyMiddleware({
  target: 'https://api.telegram.org',
  changeOrigin: true,
  pathRewrite: {
    '^/bot': `/bot${process.env.TELEGRAM_BOT_TOKEN}`
  },
  logLevel: 'warn',
  onError: (err, req, res) => {
    logger.error(`Proxy Error: ${err.message}`);
    res.status(500).json({ error: 'Proxy Error', message: 'Unable to reach Telegram API' });
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info(`Proxied ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
  },
  onProxyReq: (proxyReq, req, res) => {
    // You can modify headers here if needed
    // proxyReq.setHeader('X-Special-Proxy-Header', 'foobar');
  }
});

module.exports = proxyMiddleware;