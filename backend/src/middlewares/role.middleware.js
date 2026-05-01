/**
 * Role guard middleware
 * Usage: roleMiddleware("admin")
 */
export function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied for this role",
      });
    }
    next();
  };
}
