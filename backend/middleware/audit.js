import { createAuditLog } from '../services/auditService.js';

export const auditMiddleware = (action, resource) => async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (res.statusCode < 400) {
      createAuditLog({
        user: req.user,
        action,
        resource,
        resourceId: req.params.id || body?._id || body?.id,
        details: {
          method: req.method,
          path: req.originalUrl,
          query: req.query,
          body: sanitizeBody(req.body),
        },
        req,
      });
    }
    return originalJson(body);
  };

  next();
};

const sanitizeBody = (body = {}) => {
  const copy = { ...body };
  if (copy.password) copy.password = '[REDACTED]';
  return copy;
};
