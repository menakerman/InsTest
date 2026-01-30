export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'גישה נדחתה - נדרשת התחברות' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'אין לך הרשאה לביצוע פעולה זו' });
    }

    next();
  };
};

// Role hierarchy for checking permissions
export const roleHierarchy = {
  admin: ['admin', 'madar', 'instructor', 'tester', 'student'],
  madar: ['madar', 'instructor', 'tester', 'student'],
  instructor: ['instructor', 'tester', 'student'],
  tester: ['tester', 'student'],
  student: ['student']
};

// Check if user can manage another user based on role hierarchy
export const canManageRole = (managerRole, targetRole) => {
  const hierarchy = roleHierarchy[managerRole];
  if (!hierarchy) return false;
  return hierarchy.includes(targetRole) && managerRole !== targetRole;
};

export default { requireRole, roleHierarchy, canManageRole };
