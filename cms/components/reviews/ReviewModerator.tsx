'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Star, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Review {
  id: string
  authorName: string
  rating: number
  title: string | null
  body: string
  isApproved: boolean
  isVerifiedPurchase: boolean
  helpfulVotes: number
  clerkUserId: string
  createdAt: string
  product: { id: string; name: string; slug: string } | null
}

export function ReviewModerator({ reviews: initial }: { reviews: Review[] }) {
  const router = useRouter()
  const [reviews, setReviews] = useState(initial)

  const updateReview = async (id: string, data: { isApproved?: boolean }) => {
    const res = await fetch(`/api/cms/v1/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) { toast.error('Update failed'); return }
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, ...data } : r))
    toast.success(data.isApproved ? 'Review approved' : 'Review rejected')
    router.refresh()
  }

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review?')) return
    const res = await fetch(`/api/cms/v1/admin/reviews/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Delete failed'); return }
    setReviews((prev) => prev.filter((r) => r.id !== id))
    toast.success('Review deleted')
  }

  if (reviews.length === 0) {
    return <div className="bg-white rounded-xl border border-slate-200 py-12 text-center text-slate-400 text-sm">No reviews found.</div>
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <div key={review.id} className={cn('bg-white rounded-xl border p-4', review.isApproved ? 'border-slate-200' : 'border-yellow-200 bg-yellow-50/30')}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn('w-3.5 h-3.5', i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 fill-slate-200')} />
                  ))}
                </div>
                <span className="text-sm font-medium text-slate-700">{review.authorName}</span>
                {review.isVerifiedPurchase && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Verified</span>}
                {!review.isApproved && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">Pending</span>}
              </div>
              {review.title && <p className="text-sm font-semibold text-slate-800 mb-1">{review.title}</p>}
              <p className="text-sm text-slate-600 leading-relaxed">{review.body}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                {review.product && <span>Product: <span className="text-slate-600">{review.product.name}</span></span>}
                <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                <span>{review.helpfulVotes} helpful votes</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!review.isApproved ? (
                <button
                  onClick={() => updateReview(review.id, { isApproved: true })}
                  className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                  title="Approve"
                >
                  <Check className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => updateReview(review.id, { isApproved: false })}
                  className="p-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg transition-colors"
                  title="Reject"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => deleteReview(review.id)}
                className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
