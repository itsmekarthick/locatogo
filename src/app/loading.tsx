import { SkeletonExit } from "@/components/page-transition";
import { TechAtlasSkeleton } from "@/components/tech-atlas-skeleton";

export default function Loading() {
  return (
    <SkeletonExit>
      <TechAtlasSkeleton />
    </SkeletonExit>
  );
}
