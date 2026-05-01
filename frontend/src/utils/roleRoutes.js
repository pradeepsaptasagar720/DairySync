import { ROLES } from "./constants";

export const roleRoutes = {
  [ROLES.ADMIN]: "/admin",
  [ROLES.FARMER]: "/farmer",
  [ROLES.BUYER]: "/buyer",
  [ROLES.EMPLOYEE]: "/employee",
};

/**
 * Utility to get dashboard route by role
 */
export function getRouteByRole(role) {
  return roleRoutes[role] || "/";
}
