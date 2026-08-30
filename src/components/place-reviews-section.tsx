"use client";

import { useState, useActionState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange?: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={`text-2xl leading-none transition-colors ${
            star <= (hovered || value) ? "text-amber-400" : "text-gray-200"
          } ${onChange ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function PlaceReviews({ listingId, initialReviews }: PlaceReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/auth/login?next=" + encodeURIComponent(window.location.pathname);
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
      setError("Could not submit review. Please try again.");
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
    <section className="mt-10 border-t border-gray-100 pt-8">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="font-serif text-2xl font-bold text-gray-900">Reviews</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(avgRating)} />
            <span className="text-sm font-semibold text-gray-700">
              {avgRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Submit form */}
      <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-gray-100 bg-gray-50 p-5 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Leave a Review</p>
        <StarRating value={rating} onChange={setRating} />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share your experience (optional)..."
          rows={3}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none resize-none"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        {success && <p className="text-xs text-emerald-700 font-semibold">✓ Review submitted!</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-gray-900 px-5 py-2 text-xs font-bold text-white hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
        >
          {submitting ? "Submitting..." : "Submit Review →"}
        </button>
      </form>

      {/* Review list */}
      {reviews.length === 0 ? (
        <p className="text-sm text-gray-400">No reviews yet. Be the first to review!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-3 mb-2">
                <StarRating value={rev.rating} />
                <span className="text-xs text-gray-400">
                  {new Date(rev.created_at).toLocaleDateString("en-IN", {
                    year: "numeric", month: "short", day: "numeric",
                  })}
                </span>
              </div>
              {rev.body && <p className="text-sm text-gray-700 leading-relaxed">{rev.body}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
