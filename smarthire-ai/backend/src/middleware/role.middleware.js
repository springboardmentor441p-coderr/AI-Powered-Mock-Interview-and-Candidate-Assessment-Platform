/**
 * Usage: router.get('/admin-only', authMiddleware, requireRole('admin'), handler)
 * requireRole('recruiter', 'admin') allows either role.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role privileges' });
    }
    next();
  };
}

module.exports = requireRole;
