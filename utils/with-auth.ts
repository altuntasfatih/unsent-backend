import { logger } from './logger.js';

export function withAuth(handler: (req: any, res: any) => Promise<void>) {
  return async (req: any, res: any) => {
    const authHeader = req.headers['authorization'];
    const expectedKey = process.env.BACKEND_API_KEY;
    if (!authHeader || !expectedKey || authHeader !== expectedKey) {
      logger.warn('Unauthorized request', { 
        authHeader: authHeader ? 'present' : 'missing',
        ip: req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress
      });
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    await handler(req, res);
  };
} 