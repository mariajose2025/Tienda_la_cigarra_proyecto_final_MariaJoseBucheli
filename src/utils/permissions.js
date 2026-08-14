const ADMIN_EMAIL = 'admin@cinar.com';

const ALL_MODULES = ['products', 'categories', 'suppliers', 'purchases', 'sales', 'clients', 'credits', 'cash', 'users', 'roles', 'settings'];

// Qué módulos puede VER cada rol (lectura)
const ROLE_VIEW_PERMISSIONS = {
  'Administrador': ALL_MODULES,
  'Cajero': ['products', 'categories', 'suppliers', 'purchases', 'sales', 'clients', 'credits'],
  'Inspector': ALL_MODULES
};

// Qué módulos puede CREAR/EDITAR cada rol (escritura)
const ROLE_MANAGE_PERMISSIONS = {
  'Administrador': ALL_MODULES,
  'Cajero': ['sales', 'clients', 'credits'],
  'Inspector': []
};

function getModulePermission(user, module, map) {
  if (!user) return false;
  const rolePerms = map[user.roleName];
  if (rolePerms) return rolePerms.includes(module);
  return user?.permissions?.[module] === true;
}

function hasPermission(user, module) {
  if (!user) return false;
  if (user.email === ADMIN_EMAIL) return true;
  return getModulePermission(user, module, ROLE_VIEW_PERMISSIONS);
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
  return getModulePermission(user, module, ROLE_MANAGE_PERMISSIONS);
}

export function canEdit(user, module) {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (isInspector(user)) return false;
  return getModulePermission(user, module, ROLE_MANAGE_PERMISSIONS);
}

export function canDelete(user) {
  if (!user) return false;
  return isAdmin(user);
}
