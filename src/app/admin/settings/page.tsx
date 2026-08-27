import { logout } from "@/app/auth/actions";
import { requireTenantContext } from "@/lib/auth/tenant-context";

export default async function SettingsPage() {
  const { tenant, user, membership } = await requireTenantContext();

  return (
    <div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--coral)]">Workspace</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.06em]">Settings</h1>
        <p className="mt-3 text-[var(--ink-muted)]">Manage your workspace details and account settings.</p>
      </div>

      <div className="mt-8 grid gap-6 max-w-3xl">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6">
          <h2 className="font-display text-xl font-bold">Workspace Details</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between border-b border-[var(--line)] py-2.5">
              <span className="text-[var(--ink-muted)]">Workspace Name</span>
              <span className="font-semibold">{tenant.name}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--line)] py-2.5">
              <span className="text-[var(--ink-muted)]">Slug</span>
              <span className="font-mono">{tenant.slug}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--line)] py-2.5">
              <span className="text-[var(--ink-muted)]">Status</span>
              <span className="rounded-full bg-[var(--leaf)] px-2.5 py-0.5 text-xs font-semibold">{tenant.status}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[var(--ink-muted)]">Your Role</span>
              <span className="font-semibold capitalize">{membership.role?.replace("_", " ")}</span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6">
          <h2 className="font-display text-xl font-bold">Account</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between border-b border-[var(--line)] py-2.5">
              <span className="text-[var(--ink-muted)]">Signed in as</span>
              <span className="font-semibold">{user.email}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--line)] py-2.5">
              <span className="text-[var(--ink-muted)]">User ID</span>
              <span className="font-mono text-xs text-[var(--ink-muted)]">{user.id}</span>
            </div>
          </div>
          <form action={logout} className="mt-6">
            <button className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--coral)] hover:bg-[var(--coral)]/10 transition-colors">
              Sign out
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

