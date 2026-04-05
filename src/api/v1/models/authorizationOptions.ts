/**
 * Authorization options interface for RBAC
 * Path: src/api/v1/models/authorizationOptions.ts
 */

export interface AuthorizationOptions {
  /**
   * Array of allowed roles
   * Valid roles: "admin", "enforcer", "organizer", "officer"
   */
  hasRole: Array<"admin" | "enforcer" | "organizer" | "officer">;

  /**
   * Allow user to access their own resources
   * If true and req.params.id matches user uid, access is granted
   */
  allowSameUser?: boolean;

  /**
   * Allow users from same organization to access resources
   * If true, checks if user.organization matches player.organization
   */
  allowSameOrganization?: boolean;
}