export const validateBody = (schema) => (req, res, next) => {
  req.body = req.body || {};

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return next(result.error);
  }

  req.validatedBody = result.data;
  req.body = result.data;
  return next();
};
