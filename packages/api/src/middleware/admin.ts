import { createMiddleware } from 'hono/factory';

export const adminMiddleware = createMiddleware(async (c, next) => {
  const user = c.get('user');
  if (!user?.is_admin) {
    return c.json({ error: 'Admin access required' }, 403);
  }
  await next();
});
