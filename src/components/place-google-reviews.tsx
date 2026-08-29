import type { GooglePlaceReview } from "@/lib/media/google-places";

export function PlaceGoogleReviews({
  reviews,
  rating,
  userRatingCount,
  placeTitle,
}: {
  reviews?: GooglePlaceReview[];
  rating?: number;
  userRatingCount?: number;
  placeTitle: string;
}) {
  if (!reviews || reviews.length === 0) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-gray-950">
              Community & Google Reviews
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real visitor feedback for {placeTitle}
          </p>
        </div>

        {rating && (
          <div className="flex items-center gap-2 rounded-2xl bg-amber-50 border border-amber-200/80 px-4 py-2 self-start sm:self-auto">
            <span className="text-amber-500 font-bold text-lg">★</span>
            <span className="text-sm font-bold text-amber-950">{rating.toFixed(1)}</span>
            {userRatingCount && (
              <span className="text-xs text-amber-800/80">({userRatingCount.toLocaleString()} reviews)</span>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map((rev, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-gray-50/50 p-4 sm:p-5 hover:border-gray-200 hover:bg-gray-50 transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2.5">
                  {rev.authorPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={rev.authorPhoto}
                      alt={rev.author}
                      className="h-7 w-7 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700">
                      {rev.author.charAt(0)}
                    </div>
                  )}
                  <span className="text-xs font-bold text-gray-900">{rev.author}</span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-amber-400 text-xs">★</span>
                  <span className="text-xs font-bold text-gray-700">{rev.rating}</span>
                </div>
              </div>

              <p className="text-xs text-gray-700 leading-relaxed italic line-clamp-4">
                &ldquo;{rev.text}&rdquo;
              </p>
            </div>

            <div className="mt-4 pt-2 border-t border-gray-200/60 flex items-center justify-between text-[10px] text-gray-400">
              <span>Google Maps Verified</span>
              <span>{rev.relativeTime}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
