/**
 * Admin role middleware
 * Checks if the authenticated user has admin role
 */
export function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Admin role required.",
    });
  }
  next();
}
