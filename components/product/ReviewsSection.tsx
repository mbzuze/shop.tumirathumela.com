// Mock review data — replace with real Sanity data when review schema is added
const MOCK_REVIEWS = [
  {
    id: "r1",
    author: "Sipho M.",
    location: "Johannesburg, ZA",
    rating: 5,
    title: "Excellent product, fast delivery!",
    body:
      "Very happy with my purchase. The quality is outstanding and delivery was faster than expected. Will definitely order again from TumiraThumela.",
    date: "15 April 2025",
    verified: true,
  },
  {
    id: "r2",
    author: "Tendai N.",
    location: "Harare, ZW",
    rating: 4,
    title: "Great value for money",
    body:
      "Solid product. Packaging was secure and arrived in perfect condition. Minor issue with sizing but overall very satisfied with the purchase experience.",
    date: "2 March 2025",
    verified: true,
  },
  {
    id: "r3",
    author: "Amahle D.",
    location: "Cape Town, ZA",
    rating: 5,
    title: "Exactly as described",
    body:
      "Product matched the description perfectly. Customer service was responsive when I had a question. Highly recommended for anyone in Southern Africa.",
    date: "18 January 2025",
    verified: false,
  },
];

const DISTRIBUTION = [
  { stars: 5, pct: 68 },
  { stars: 4, pct: 18 },
  { stars: 3, pct: 8 },
  { stars: 2, pct: 4 },
  { stars: 1, pct: 2 },
];

function StarBar({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <div className="flex gap-0.5" aria-hidden>
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill={i < filled ? "#FFA41C" : "#FFA41C"}
          fillOpacity={i < filled ? 1 : 0.25}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

interface ReviewsSectionProps {
  rating?: number | null;
  reviewCount?: number | null;
}

export default function ReviewsSection({ rating, reviewCount }: ReviewsSectionProps) {
  const displayRating = rating ?? 4.4;
  const displayCount = reviewCount ?? MOCK_REVIEWS.length;

  return (
    <section
      id="reviews-section"
      className="border-t border-[#ddd] pt-8 mt-8"
    >
      <h2 className="text-xl font-normal text-[#0F1111] mb-6">
        Customer reviews
      </h2>

      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {/* Overall score */}
        <div className="text-center md:w-48 shrink-0">
          <div className="text-5xl font-normal text-[#0F1111] mb-1">
            {displayRating.toFixed(1)}
          </div>
          <StarBar rating={displayRating} />
          <p className="text-sm text-[#565959] mt-1">
            {displayCount.toLocaleString()} global ratings
          </p>
        </div>

        {/* Distribution bars */}
        <div className="flex-1 space-y-2">
          {DISTRIBUTION.map(({ stars, pct }) => (
            <div key={stars} className="flex items-center gap-3 text-sm">
              <span className="text-[#007185] hover:text-[#C7511F] cursor-pointer w-10 shrink-0 text-right">
                {stars} star
              </span>
              <div className="flex-1 h-4 bg-[#f0f0f0] rounded-sm overflow-hidden">
                <div
                  className="h-full bg-[#FFA41C] rounded-sm"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[#007185] hover:text-[#C7511F] cursor-pointer w-8 shrink-0">
                {pct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Individual reviews */}
      <div className="space-y-6">
        {MOCK_REVIEWS.map((review) => (
          <div key={review.id} className="border-b border-[#ddd] pb-6 last:border-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-[#131921] text-white text-xs flex items-center justify-center font-bold">
                {review.author.charAt(0)}
              </div>
              <span className="text-sm font-bold text-[#0F1111]">{review.author}</span>
            </div>
            <StarBar rating={review.rating} />
            <p className="font-bold text-sm text-[#0F1111] mt-2">{review.title}</p>
            <p className="text-xs text-[#565959] mt-0.5">
              Reviewed in {review.location} on {review.date}
              {review.verified && (
                <span className="ml-2 text-[#C7511F]">Verified Purchase</span>
              )}
            </p>
            <p className="text-sm text-[#0F1111] mt-2 leading-relaxed">{review.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
