export default async function handler(req: any, res: any) {
  try {
    const { default: app } = await import('../server.js'); // Use dynamic import to catch errors
    return app(req, res);
  } catch (err: any) {
    res.status(500).json({ VERCEL_WRAPPER_ERROR: err.message, stack: err.stack });
  }
}
