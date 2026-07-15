export default async function handler(req: any, res: any) {
  try {
    // @ts-ignore - Compiled dynamically at build time
    const serverModule = await import('../dist/server.cjs');
    const app = serverModule.default || serverModule;
    return app(req, res);
  } catch (err: any) {
    res.status(500).json({ VERCEL_WRAPPER_ERROR: err.message, stack: err.stack });
  }
}
