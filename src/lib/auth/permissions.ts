export const PERMISSIONS = {
  LISTING_READ: "listing.read",
  LISTING_CREATE: "listing.create",
  LISTING_UPDATE: "listing.update",
  LISTING_DELETE: "listing.delete",
  LISTING_PUBLISH: "listing.publish",
  LISTING_MODERATE: "listing.moderate",
  LISTING_IMPORT: "listing.import",
  CATEGORY_MANAGE: "category.manage",
  CLAIM_MANAGE: "claim.manage",
  MEDIA_MANAGE: "media.manage",
  ANALYTICS_READ: "analytics.read",
  ADS_MANAGE: "ads.manage",
  TEAM_MANAGE: "team.manage",
  SETTINGS_MANAGE: "settings.manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_DEFAULT_PERMISSIONS: Record<string, Permission[]> = {
  tenant_owner: Object.values(PERMISSIONS),
  tenant_staff: [
    PERMISSIONS.LISTING_READ,
    PERMISSIONS.LISTING_CREATE,
    PERMISSIONS.LISTING_UPDATE,
    PERMISSIONS.LISTING_MODERATE,
    PERMISSIONS.LISTING_IMPORT,
    PERMISSIONS.CATEGORY_MANAGE,
    PERMISSIONS.CLAIM_MANAGE,
    PERMISSIONS.MEDIA_MANAGE,
    PERMISSIONS.ANALYTICS_READ,
  ],
  business_owner: [
    PERMISSIONS.LISTING_READ,
    PERMISSIONS.LISTING_UPDATE,
    PERMISSIONS.MEDIA_MANAGE,
  ],
};

export type MembershipWithPermissions = {
  role: string | null;
  permissions_json?: Record<string, boolean> | null;
};

/**
 * Check if a tenant membership has a specific permission.
 * Tenant owners always have all permissions.
 * Other roles check explicit permissions_json overrides first, then role defaults.
 */
export function hasPermission(
  membership: MembershipWithPermissions | null | undefined,
  permission: Permission
): boolean {
  if (!membership || !membership.role) return false;

  // Tenant owner has full access
  if (membership.role === "tenant_owner") return true;

  // Check explicit permission override if present in permissions_json
  if (membership.permissions_json && typeof membership.permissions_json === "object") {
    if (membership.permissions_json[permission] === true) return true;
    if (membership.permissions_json[permission] === false) return false;
  }

  // Fallback to role defaults
  const defaults = ROLE_DEFAULT_PERMISSIONS[membership.role] ?? [];
  return defaults.includes(permission);
}

/**
 * Asserts permission, throwing an error if unauthorized.
 */
export function assertPermission(
  membership: MembershipWithPermissions | null | undefined,
  permission: Permission
): void {
  if (!hasPermission(membership, permission)) {
    throw new Error(`Unauthorized: Missing required '${permission}' permission.`);
  }
}
