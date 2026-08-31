import { requireTenantContext } from "@/lib/auth/tenant-context";
import { TeamMembersList } from "@/components/team-members-list";

export default async function TeamAdminPage() {
  const { supabase, tenant, user, membership } = await requireTenantContext();

  const [{ data: members }, { data: invitations }] = await Promise.all([
    supabase
      .from("tenant_users")
      .select("id, user_id, role, status, created_at, profile:profiles(display_name, avatar_url)")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("team_invitations")
      .select("id, email, role, status, expires_at, created_at")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false }),
  ]);

  const isOwner = membership.role === "tenant_owner";

  // Clean member data format
  const formattedMembers = (members ?? []).map((m: any) => ({
    id: m.id,
    user_id: m.user_id,
    role: m.role,
    status: m.status,
    created_at: m.created_at,
    profile: Array.isArray(m.profile) ? m.profile[0] : m.profile,
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Access Control</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-[-0.05em] text-[var(--foreground)]">
          Team & Permissions
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Manage workspace members, assign role-based capabilities, and track invitations.
        </p>
      </div>

      <TeamMembersList
        members={formattedMembers}
        invitations={invitations ?? []}
        currentUserId={user.id}
        isOwner={isOwner}
      />
    </div>
  );
}
