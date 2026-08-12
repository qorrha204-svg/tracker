// Pure, framework-agnostic permission helpers — safe to import from both
// Server Components (lib/dal.js) and Client Components (no server-only deps).

export const ADMIN_ROLES = ["admin", "ceo"];

export function isAdminLevel(role) {
  return ADMIN_ROLES.includes(role);
}

// Every signed-in role — including the default "viewer" tier — can create
// tasks. Editing someone else's task still requires admin/ceo (see
// canEditTask below).
export function canCreateTask(role) {
  return Boolean(role);
}

// A task can only be edited by the person who created it, or by admin/ceo —
// other editors can view but not modify tasks they don't own.
export function canEditTask(profile, task) {
  if (!profile || !task) return false;
  if (isAdminLevel(profile.role)) return true;
  return Boolean(task.created_by) && task.created_by === profile.id;
}
