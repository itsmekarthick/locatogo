"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ModuleCard } from "@/components/detail/module-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { controlClasses } from "@/components/ui/input";
import { CheckCircleIcon, MessageSquareIcon, StarIcon } from "@/components/ui/icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

interface Review {
  id: string;
  user_id: string;
  rating: number;
  body: string | null;
  created_at: string;
}

interface PlaceReviewsProps {
  listingId: string;
  initialReviews: Review[];
  /** Anchor id for the section nav. */
  id?: string;
}

const dateFormat = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span role="img" aria-label={`${value} out of 5 stars`} className={cn("inline-flex gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon key={star} className={cn("size-4", star <= value ? "fill-current text-warning" : "text-line-strong")} />
      ))}
    </span>
  );
}

function RatingInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;

  return (
    <div role="radiogroup" aria-label="Your rating" className="inline-flex gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          className="focus-ring grid size-9 place-items-center rounded-lg transition-transform duration-150 motion-safe:active:scale-90 pointer-coarse:size-11"
        >
          <StarIcon className={cn("size-6 transition-colors", star <= shown ? "fill-current text-warning" : "text-line-strong")} />
        </button>
      ))}
    </div>
  );
}

export function PlaceReviews({ listingId, initialReviews, id = "community-reviews" }: PlaceReviewsProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login?next=" + encodeURIComponent(window.location.pathname));
      return;
    }
    const { data, error: dbError } = await supabase
      .from("place_reviews")
      .upsert(
        { listing_id: listingId, user_id: user.id, rating, body: body || null },
        { onConflict: "user_id,listing_id" }
      )
      .select()
      .single();
    if (dbError) {
      setError("Could not submit your review. Please try again.");
    } else if (data) {
      setReviews((prev) => {
        const without = prev.filter((r) => r.user_id !== user.id);
        return [data as Review, ...without];
      });
      setSuccess(true);
      setBody("");
      setRating(0);
    }
    setSubmitting(false);
  };

  return (
    <ModuleCard
      id={id}
      icon={<MessageSquareIcon />}
      title="Community reviews"
      description={
        reviews.length > 0 ? (
          <span className="inline-flex items-center gap-2">
            <Stars value={Math.round(avgRating)} />
            {avgRating.toFixed(1)} · {reviews.length.toLocaleString("en-US")} {reviews.length === 1 ? "review" : "reviews"}
          </span>
        ) : (
          "Be the first to share your experience"
        )
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-line bg-surface-2/60 p-4">
        <p className="text-sm font-medium text-fg">Leave a review</p>
        <RatingInput value={rating} onChange={setRating} />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share your experience (optional)"
          aria-label="Your review"
          rows={3}
          className={cn(controlClasses, "h-auto resize-none py-2.5")}
        />
        <div aria-live="polite" className="min-h-5 text-sm">
          {error && <p className="text-danger">{error}</p>}
          {success && (
            <p className="inline-flex items-center gap-1.5 font-medium text-success">
              <CheckCircleIcon className="size-4" /> Thanks, your review is live.
            </p>
          )}
        </div>
        <Button type="submit" loading={submitting}>
          {submitting ? "Submitting" : "Submit review"}
        </Button>
      </form>

      {reviews.length === 0 ? (
        <EmptyState
          className="py-8"
          icon={<MessageSquareIcon />}
          title="No reviews yet"
          description="Your rating helps others decide. It only takes a few seconds."
        />
      ) : (
        <ul role="list" className="mt-5 space-y-3">
          {reviews.map((rev) => (
            <li key={rev.id} className="rounded-xl border border-line bg-surface-1 p-4">
              <div className="flex items-center justify-between gap-3">
                <Stars value={rev.rating} />
                <Badge size="sm">{dateFormat.format(new Date(rev.created_at))}</Badge>
              </div>
              {rev.body && <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">{rev.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </ModuleCard>
  );
}
