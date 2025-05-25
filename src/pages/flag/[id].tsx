/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, getDocs, query, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useRouter } from 'next/router'
import countries from 'world-countries'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'

const countryMap: Record<string, string> = {}
countries.forEach(c => {
  countryMap[c.cca2] = c.flag + ' ' + c.name.common
})

// Use the pillClass function from the index page to ensure consistent styling for pills.
const pillClass = (label: string) => {
  if (label.includes('Spotted')) return "bg-yellow-200 text-yellow-900";
  if (label.includes('From')) return "bg-green-200 text-green-900";
  if (label.includes('Speaks')) return "bg-blue-200 text-blue-900";
  if (label.includes('Vibes')) return "bg-pink-200 text-pink-900";
  return "bg-white text-black";
}

export default function FlagDetailPage() {
  type Flag = {
    id: string
    imageUrl: string
    country: string[]
    language: string[]
    genres: string[]
    festival: string[] | string
    location: string[]
    seen: number
    likes: number
    createdAt?: string | number | Date
    description?: string
  }

  type Comment = {
    name: string
    message: string
    createdAt?: string | number | Date
    location?: string
  }

  const [flag, setFlag] = useState<Flag | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    if (!id) return

    const fetchFlag = async () => {
      const snapshot = await getDocs(query(collection(db, 'flags')))
      const flagDoc = snapshot.docs.find(doc => doc.id === id)
      if (flagDoc) {
        setFlag({ id: flagDoc.id, ...(flagDoc.data() as Omit<Flag, 'id'>) })
        const commentSnap = await getDocs(collection(db, `flags/${flagDoc.id}/comments`))
        const commentList = commentSnap.docs.map(doc => doc.data() as Comment)
        setComments(
          commentList.sort(
            (a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
          )
        )
      }
      setLoading(false)
    }

    fetchFlag()
  }, [id])

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || message.trim() === '') return

    const res = await fetch('https://ipapi.co/json/')
    const ipData = await res.json()

    await addDoc(collection(db, `flags/${id}/comments`), {
      name: name.trim() || 'Anonymous',
      message: message.trim(),
      createdAt: new Date().toISOString(),
      location: ipData.city ? `${ipData.city}, ${ipData.country_name}` : undefined,
    })

    setName('')
    setMessage('')
    const updatedComments = await getDocs(collection(db, `flags/${id}/comments`))
    setComments(
      updatedComments.docs
        .map(doc => doc.data() as Comment)
        .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-indigo-900 to-purple-900 text-white">
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur px-4 py-4">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/"
            className="inline-block mb-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full font-semibold transition"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-purple-200">🌍 Festival Flags</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <p>Loading flag...</p>
        ) : !flag ? (
          <p>Flag not found.</p>
        ) : (
          <>
            <div className="bg-white/10 p-6 rounded-xl border border-purple-700">
              <div
                className="cursor-pointer group"
                onClick={() => setLightboxOpen(true)}
              >
                <img
                  src={flag.imageUrl}
                  alt="Flag"
                  className="w-full aspect-[4/3] object-cover rounded mb-4 group-hover:brightness-110"
                />
              </div>

              {flag.description && (
                <p className="text-purple-200 text-base font-semibold mb-2" title={flag.description}>
                  {flag.description}
                </p>
              )}

              <div className="flex items-baseline flex-wrap gap-2 mb-2">
                <span className="text-xs font-semibold text-purple-300 whitespace-nowrap">🎉 Spotted At Festivals:</span>
                <div className="flex gap-2 overflow-x-auto py-1">
                  {(Array.isArray(flag.festival) ? flag.festival : [flag.festival]).map((f, idx) => (
                    <span
                      key={idx}
                      className={`${pillClass('🎉 Spotted At Festivals:')} text-xs px-2 py-1 rounded-full min-w-fit max-w-xs break-words`}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-baseline flex-wrap gap-2 mb-2">
                <span className="text-xs font-semibold text-purple-300 whitespace-nowrap">📍 From:</span>
                <div className="flex gap-2 overflow-x-auto py-1">
                  {(flag.location || []).map((loc, idx) => (
                    <span
                      key={idx}
                      className={`${pillClass('📍 From:')} text-xs px-2 py-1 rounded-full min-w-fit max-w-xs break-words`}
                    >
                      {loc}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-baseline flex-wrap gap-2 mb-2">
                <span className="text-xs font-semibold text-purple-300 whitespace-nowrap">🗣️ Speaks:</span>
                <div className="flex gap-2 overflow-x-auto py-1">
                  {flag.language.map((lang, idx) => (
                    <span
                      key={idx}
                      className={`${pillClass('🗣️ Speaks:')} text-xs px-2 py-1 rounded-full min-w-fit max-w-xs break-words`}
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-baseline flex-wrap gap-2 mb-2">
                <span className="text-xs font-semibold text-purple-300 whitespace-nowrap">🎧 Stage Vibes:</span>
                <div className="flex gap-2 overflow-x-auto py-1">
                  {flag.genres.map((genre, idx) => (
                    <span
                      key={idx}
                      className={`${pillClass('🎧 Stage Vibes:')} text-xs px-2 py-1 rounded-full min-w-fit max-w-xs break-words`}
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 mt-4 text-sm text-purple-300">
                <span>👁️ Seen: {flag.seen || 0}</span>
                <span>👍 Likes: {flag.likes || 0}</span>
                <span>💬 Comments: {comments.length}</span>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-bold text-purple-300 mb-4">💬 Comments</h2>
              <form onSubmit={handleCommentSubmit} className="space-y-3 mb-6">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full p-2 rounded bg-black/30 border border-purple-500 text-white"
                />
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Write a comment... 😊🚀🎶"
                  rows={3}
                  className="w-full p-2 rounded bg-black/30 border border-purple-500 text-white"
                  required
                />
                <button type="submit" className="bg-purple-600 px-4 py-2 rounded text-white hover:bg-purple-700">
                  Post Comment
                </button>
              </form>

              {comments.length === 0 ? (
                <p className="text-purple-400">No comments yet.</p>
              ) : (
                <div className="space-y-4">
                  {comments.map((c, idx) => (
                    <div key={idx} className="bg-white/10 p-3 rounded-lg border border-purple-700">
                      <p className="font-semibold text-purple-200">{c.name || 'Anonymous'}</p>
                      <p className="text-purple-100 text-sm whitespace-pre-wrap">{c.message}</p>
                      <p className="text-xs text-purple-400 mt-1">
                        🕒 {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
                        {c.location && c.location !== 'undefined, undefined' ? ` 🌍 ${c.location}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {lightboxOpen && flag && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={[{ src: flag.imageUrl }]}
        />
      )}
    </div>
  )
}
