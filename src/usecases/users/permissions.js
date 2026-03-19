import { ROLES } from '../../config/constants.js';

export const canManageUserScope = (actor, target) => {
  if (actor.id === target.id) {
    return true;
  }

  if (actor.role.toString() === ROLES.ADMIN) {
    return true;
  }

  if (actor.role.toString() === ROLES.OWNER) {
    return target.createdById === actor.id;
  }

  return actor.id === target.id;
};

export const canOwnerAssignRole = (nextRole) => {
  return [ROLES.MANAGER, ROLES.STUDENT].includes(nextRole);
};

export const canOwnerTouchTarget = (target) => {
  return [ROLES.MANAGER, ROLES.STUDENT].includes(target.role.toString());
};

