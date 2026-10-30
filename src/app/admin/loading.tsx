import { AdminPageSkeleton } from "@/components/admin/admin-skeletons";
import { SkeletonExit } from "@/components/page-transition";

export default function AdminLoading() {
  return (
    <SkeletonExit>
      <AdminPageSkeleton />
    </SkeletonExit>
  );
}
