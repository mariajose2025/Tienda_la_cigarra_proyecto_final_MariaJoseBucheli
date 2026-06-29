export const PERMISSIONS = {
  ADMIN: 'Administrador',
  SELLER: 'Vendedor'
};

export function isAdmin(user) {
  return user?.roleName === PERMISSIONS.ADMIN;
}

export function isSeller(user) {
  return user?.roleName === PERMISSIONS.SELLER;
}

export function canAccess(user, module) {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (user.permissions) return user.permissions[module] === true;
  return false;
}

export function canCreate(user, module) {
  return canAccess(user, module);
}

export function canEdit(user, module) {
  return canAccess(user, module);
}

export function canDelete(user, module) {
  return isAdmin(user);
}

export function canView(user, module) {
  return canAccess(user, module);
}
