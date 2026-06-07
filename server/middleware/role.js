export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Missing token" });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: "Access denied" });
  }

  next();
};

export const allowRoles = requireRole;
export const adminOnly = requireRole("developer");
