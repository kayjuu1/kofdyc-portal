export const ADMIN_ROLES = [
  "system_admin",
  "youth_chaplain",
  "diocesan_executive",
  "coordinator",
] as const

export type UserRole = (typeof ADMIN_ROLES)[number]

export type Permission =
  | "viewDashboard"
  | "manageNews"
  | "manageDocuments"
  | "manageSettings"
  | "manageAdminUsers"
  | "manageChaplainInbox"

const LEGACY_ROLE_MAP = {
  diocesan_youth_chaplain: "youth_chaplain",
  dyc_executive: "diocesan_executive",
} as const

export const ROLE_LABELS: Record<UserRole, string> = {
  system_admin: "System Admin",
  youth_chaplain: "Youth Chaplain",
  diocesan_executive: "Diocesan Executive",
  coordinator: "Coordinator",
}

export const PERMISSIONS: Record<Permission, readonly UserRole[]> = {
  viewDashboard: ADMIN_ROLES,
  manageNews: ADMIN_ROLES,
  manageDocuments: ADMIN_ROLES,
  manageSettings: ["system_admin", "youth_chaplain", "diocesan_executive"],
  manageAdminUsers: ["system_admin", "youth_chaplain", "diocesan_executive"],
  manageChaplainInbox: ["youth_chaplain"],
}

export function canonicalizeRole(role: string | null | undefined): UserRole | null {
  if (!role) return null
  if ((ADMIN_ROLES as readonly string[]).includes(role)) {
    return role as UserRole
  }

  return LEGACY_ROLE_MAP[role as keyof typeof LEGACY_ROLE_MAP] ?? null
}

export function isAdminRole(role: string | null | undefined): role is UserRole {
  return canonicalizeRole(role) !== null
}

export function hasPermission(
  role: UserRole | null | undefined,
  permission: Permission,
): boolean {
  if (!role) return false
  return PERMISSIONS[permission].includes(role)
}

export function getRoleLabel(role: string | null | undefined): string {
  const canonicalRole = canonicalizeRole(role)
  if (!canonicalRole) return role ?? "Unknown"
  return ROLE_LABELS[canonicalRole]
}
