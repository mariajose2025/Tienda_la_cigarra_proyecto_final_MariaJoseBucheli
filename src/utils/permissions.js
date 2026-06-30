const ADMIN_EMAIL = 'admin@cinar.com';

const ROLE_PERMISSIONS = {
  'Administrador': ['products', 'categories', 'suppliers', 'purchases', 'sales', 'users', 'roles', 'settings'],
  'Vendedor': ['products', 'categories', 'suppliers', 'purchases', 'sales'],
  'Inspector': []
};

function hasPermission(user, module) {
  if (!user) return false;
  if (user.email === ADMIN_EMAIL) return true;
  const rolePerms = ROLE_PERMISSIONS[user.roleName];
  if (rolePerms) return rolePerms.includes(module);
  return user?.permissions?.[module] === true;
}

export function isAdmin(user) {
  if (!user) return false;
  if (user.email === ADMIN_EMAIL) return true;
  return user?.roleName === 'Administrador';
}

export function isInspector(user) {
  if (!user) return false;
  return user?.roleName === 'Inspector';
}

export function canView(user, module) {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (isInspector(user)) return true;
  return hasPermission(user, module);
}

export function canCreate(user, module) {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (isInspector(user)) return false;
  return hasPermission(user, module);
}

export function canEdit(user, module) {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (isInspector(user)) return false;
  return hasPermission(user, module);
}

export function canDelete(user) {
  if (!user) return false;
  return isAdmin(user);
}
