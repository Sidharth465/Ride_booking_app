import UnauthenticatedError from "../errors/unauthenticated.js";

/**
 * Restrict a route to one or more roles (customer | rider).
 * Must run after authentication middleware so req.user.role exists.
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      throw new UnauthenticatedError(
        `Access denied. Required role: ${roles.join(" or ")}`
      );
    }
    next();
  };
};

export default authorizeRoles;
