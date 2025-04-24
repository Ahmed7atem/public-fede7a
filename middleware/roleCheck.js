const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.employee) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.employee.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
};

const isAdmin = checkRole(['admin']);

module.exports = {
  checkRole,
  isAdmin
}; 