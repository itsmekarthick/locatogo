import { ModuleCard } from "@/components/detail/module-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { MessageIcon, ShieldCheckIcon, StarIcon } from "@/components/ui/icons";
import type { GooglePlaceReview } from "@/lib/media/google-places";
import { cn } from "@/lib/utils/cn";

type Props = {
  reviews?: GooglePlaceReview[];
  rating?: number;
  userRatingCount?: number;
  placeTitle: string;
  /** Kept for call-site compatibility; reviews are never synthesised from these. */
  categoryName?: string;
  locality?: string;
  /** Anchor id for the section nav. */
  id?: string;
};

function Stars({ value }: { value: number }) {
  return (
    <span role="img" aria-label={`${value} out of 5 stars`} className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon key={star} className={cn("size-3.5", star <= Math.round(value) ? "fill-current text-warning" : "text-line-strong")} />
      ))}
    </span>
  );
}

export function PlaceGoogleReviews({ reviews, rating, userRatingCount, placeTitle, id = "reviews" }: Props) {
  const list = reviews ?? [];
  const hasRating = typeof rating === "number" && rating > 0;

  return (
    <ModuleCard
      id={id}
      icon={<MessageIcon />}
      title="Visitor reviews"
      description={`What people say about ${placeTitle}`}
      action={
        hasRating ? (
          <Badge variant="warning" icon={<StarIcon className="size-3.5 fill-current" />}>
            {rating.toFixed(1)}
            {userRatingCount ? <span className="opacity-70">({userRatingCount.toLocaleString("en-US")})</span> : null}
          </Badge>
        ) : undefined
      }
    >
      {list.length === 0 ? (
        <EmptyState
          className="py-8"
          icon={<MessageIcon />}
          title="No Google reviews yet"
          description="Reviews from Google Maps appear here once the place has some."
        />
      ) : (
        <ul role="list" className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {list.map((review, index) => (
            <li key={`${review.author}-${index}`} className="flex flex-col justify-between rounded-xl border border-line bg-surface-2/50 p-4">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={review.author} src={review.authorPhoto} size="sm" />
                    <span className="truncate text-sm font-medium text-fg">{review.author}</span>
                  </div>
                  <Stars value={review.rating} />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">{review.text}</p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-fg-subtle">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheckIcon className="size-3.5 text-success" />
                  Google Maps
                </span>
                <span>{review.relativeTime}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </ModuleCard>
  );
}

export default PlaceGoogleReviews;
