const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://localhost:443',
      changeOrigin: true,
      secure: false, // because it's self-signed
    })
  );
};
