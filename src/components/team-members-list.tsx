"use client";

import { useState, useTransition } from "react";
import { inviteTeamMember, updateMemberRole, removeTeamMember, revokeInvitation } from "@/app/admin/actions";

type Member = {
  id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
};

type Props = {
  members: Member[];
  invitations: Invitation[];
  currentUserId: string;
  isOwner: boolean;
};

export function TeamMembersList({ members, invitations, currentUserId, isOwner }: Props) {
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("tenant_staff");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("email", inviteEmail);
        fd.set("role", inviteRole);
        await inviteTeamMember(fd);
        setInviteEmail("");
        setIsInviting(false);
        setFeedback({ type: "success", message: "Invitation sent successfully." });
      } catch (err) {
        setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to invite." });
      }
    });
  }

  function handleRoleChange(memberId: string, role: string) {
    setFeedback(null);
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("memberId", memberId);
        fd.set("role", role);
        await updateMemberRole(fd);
        setFeedback({ type: "success", message: "Role updated." });
      } catch (err) {
        setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to update role." });
      }
    });
  }

  function handleRemove(memberId: string) {
    if (!confirm("Are you sure you want to remove this team member?")) return;
    setFeedback(null);
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("memberId", memberId);
        await removeTeamMember(fd);
        setFeedback({ type: "success", message: "Member removed." });
      } catch (err) {
        setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to remove member." });
      }
    });
  }

  function handleRevoke(invitationId: string) {
    setFeedback(null);
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("invitationId", invitationId);
        await revokeInvitation(fd);
        setFeedback({ type: "success", message: "Invitation revoked." });
      } catch (err) {
        setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to revoke invitation." });
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`rounded-2xl p-4 text-xs font-semibold flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-sm font-bold">✕</button>
        </div>
      )}

      {/* Invite Member Drawer / Form */}
      {isOwner && (
        <div className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-[var(--foreground)]">Invite Team Member</h2>
              <p className="text-xs text-[var(--ink-muted)]">Send an invitation link to collaborate on this workspace</p>
            </div>
            {!isInviting && (
              <button
                onClick={() => setIsInviting(true)}
                className="rounded-full bg-[var(--foreground)] px-5 py-2 text-xs font-bold text-[var(--paper)] hover:bg-[var(--foreground)]/85 transition-ui shadow-xs"
              >
                + Invite Person
              </button>
            )}
          </div>

          {isInviting && (
            <form onSubmit={handleInvite} className="mt-5 space-y-4 border-t border-[var(--line)] pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                    Email Address <span className="text-[var(--coral)]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                    Role & Permissions
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-2.5 text-sm focus:outline-none"
                  >
                    <option value="tenant_staff">Staff Admin (Manage listings, categories, claims)</option>
                    <option value="tenant_owner">Workspace Co-Owner (Full access)</option>
                    <option value="business_owner">Business Contributor (Assigned listings only)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviting(false)}
                  className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold text-[var(--ink-muted)] hover:bg-[var(--background)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-[var(--coral)] px-6 py-2 text-xs font-bold text-white hover:bg-[var(--coral-dark)] shadow-sm disabled:opacity-50"
                >
                  {isPending ? "Sending..." : "Send Invitation"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Active Team Members List */}
      <section className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-[var(--foreground)]">Active Members ({members.length})</h2>
            <p className="text-xs text-[var(--ink-muted)]">People with active access to this directory workspace</p>
          </div>
        </div>

        <div className="mt-4 divide-y divide-[var(--line)]">
          {members.map((member) => {
            const isSelf = member.user_id === currentUserId;
            return (
              <div key={member.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[var(--coral)] to-amber-400 text-sm font-bold text-white shadow-2xs">
                    {member.profile?.display_name?.charAt(0) || "👤"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-[var(--foreground)]">
                        {member.profile?.display_name || "Workspace Member"}
                      </p>
                      {isSelf && (
                        <span className="rounded-full bg-[var(--leaf)] px-2 py-0.5 text-[9px] font-bold text-[var(--leaf-dark)] uppercase">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--ink-muted)] font-mono">
                      User ID: {member.user_id.slice(0, 8)}... · Joined {new Date(member.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {isOwner && !isSelf ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      disabled={isPending}
                      className="rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-1.5 text-xs font-semibold focus:outline-none capitalize"
                    >
                      <option value="tenant_owner">Owner</option>
                      <option value="tenant_staff">Staff Admin</option>
                      <option value="business_owner">Business Contributor</option>
                    </select>
                  ) : (
                    <span className="rounded-full bg-[var(--background)] px-3 py-1 text-xs font-semibold capitalize text-[var(--ink-muted)] border border-[var(--line)]">
                      {member.role.replace("_", " ")}
                    </span>
                  )}

                  {isOwner && !isSelf && (
                    <button
                      onClick={() => handleRemove(member.id)}
                      disabled={isPending}
                      className="rounded-lg px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                      title="Remove member"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pending Invitations Section */}
      {invitations.length > 0 && (
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-7 shadow-xs">
          <div className="border-b border-[var(--line)] pb-4">
            <h2 className="font-display text-xl font-bold text-[var(--foreground)]">
              Pending Invitations ({invitations.filter((i) => i.status === "pending").length})
            </h2>
            <p className="text-xs text-[var(--ink-muted)]">Outstanding invitations awaiting user signup</p>
          </div>

          <div className="mt-4 divide-y divide-[var(--line)]">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-xs font-semibold text-[var(--foreground)]">{inv.email}</p>
                  <p className="text-[11px] text-[var(--ink-muted)]">
                    Role: <span className="capitalize">{inv.role.replace("_", " ")}</span> · Sent {new Date(inv.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      inv.status === "pending"
                        ? "bg-amber-50 text-amber-800"
                        : inv.status === "accepted"
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {inv.status}
                  </span>
                  {isOwner && inv.status === "pending" && (
                    <button
                      onClick={() => handleRevoke(inv.id)}
                      disabled={isPending}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
