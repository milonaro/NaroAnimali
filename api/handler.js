module.exports = async function handler(req, res) {
  try {
    const serverModule = require('../dist/server.cjs');
    const app = serverModule.default || serverModule;
    if (typeof app !== 'function') {
      return res.status(500).json({ 
        VERCEL_WRAPPER_ERROR: "Loaded module is not an Express app function", 
        keys: Object.keys(serverModule) 
      });
    }
    return app(req, res);
  } catch (err) {
    res.status(500).json({ VERCEL_WRAPPER_ERROR: err.message, stack: err.stack });
  }
};

