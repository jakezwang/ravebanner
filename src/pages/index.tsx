// src/pages/index.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, getDocs, query, orderBy, Timestamp, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import countries from 'world-countries'
import { ThumbsUp, Eye, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/router'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'

const countryMap: Record<string, string> = {}
countries.forEach(c => {
  countryMap[c.cca2] = c.flag + ' ' + c.name.common
})

type Flag = {
  id: string
  imageUrl: string
  location: string[]
  language: string[]
  genres: string[]
  festival: string[] | string
  seen: number
  likes: number
  createdAt: Timestamp
  description?: string
}

export default function HomePage() {
  const [flags, setFlags] = useState<Flag[]>([])
  const [filteredFlags, setFilteredFlags] = useState<Flag[]>([])
  const [searchTags, setSearchTags] = useState<string[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [seenFlags, setSeenFlags] = useState<string[]>([])
  const [likedFlags, setLikedFlags] = useState<string[]>([])
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImage, setLightboxImage] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [sortOption, setSortOption] = useState<'newest' | 'popular' | 'seen' | 'likes'>('popular')
  const [interactionMessage, setInteractionMessage] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    setSeenFlags(JSON.parse(localStorage.getItem('seenFlags') || '[]'))
    setLikedFlags(JSON.parse(localStorage.getItem('likedFlags') || '[]'))
  }, [])

  useEffect(() => {
    const fetchFlags = async () => {
      const q = query(collection(db, 'flags'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      const counts: Record<string, number> = {}

      const flagsData: Flag[] = await Promise.all(
        snapshot.docs.map(async docSnap => {
          const data = docSnap.data()
          const commentSnap = await getDocs(collection(db, `flags/${docSnap.id}/comments`))
          counts[docSnap.id] = commentSnap.size

          return {
            id: docSnap.id,
            seen: data.seen || 0,
            likes: data.likes || 0,
            ...data,
          } as Flag
        })
      )

      setCommentCounts(counts)
      setFlags(flagsData)
      setLoading(false)
    }

    fetchFlags()
  }, [])

  useEffect(() => {
    let result = [...flags]

    if (searchTags.length > 0) {
      result = result.filter(flag => {
        const allTags = [
          ...flag.festival,
          ...flag.location,
          ...flag.language,
          ...flag.genres,
          flag.description || ''
        ].map(t => t.toLowerCase())
        return searchTags.every(tag => allTags.some(t => t.includes(tag.toLowerCase())))
      })
    }

    if (sortOption === 'popular') {
      result.sort(
        (a, b) => (b.seen + b.likes + (commentCounts[b.id] || 0)) - (a.seen + a.likes + (commentCounts[a.id] || 0))
      )
    } else if (sortOption === 'seen') {
      result.sort((a, b) => b.seen - a.seen)
    } else if (sortOption === 'likes') {
      result.sort((a, b) => b.likes - a.likes)
    } else {
      result.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)
    }

    setFilteredFlags(result)
  }, [flags, commentCounts, searchTags, sortOption])

  const iconButtonStyle = (active: boolean) =>
    `flex items-center gap-1 text-sm px-3 py-1 rounded-full font-semibold transition-transform ${
      active ? 'bg-white text-purple-700 scale-105' : 'bg-purple-700 hover:bg-purple-600 text-white'
    }`

  const pillClass = (label: string) => {
    if (label.includes('Spotted')) return "bg-yellow-200 text-yellow-900"
    if (label.includes('From')) return "bg-green-200 text-green-900"
    if (label.includes('Speaks')) return "bg-blue-200 text-blue-900"
    if (label.includes('Vibes')) return "bg-pink-200 text-pink-900"
    return "bg-white text-black"
  }

  const handleInteraction = async (flagId: string, field: 'seen' | 'likes') => {
    const storageKey = field === 'seen' ? 'seenFlags' : 'likedFlags'
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]')
    const alreadyClicked = stored.includes(flagId)

    const ref = doc(db, 'flags', flagId)
    const updatedFlags = flags.map(flag => {
      if (flag.id === flagId) {
        const updated = { ...flag, [field]: flag[field] + (alreadyClicked ? -1 : 1) }
        updateDoc(ref, { [field]: updated[field] })
        return updated
      }
      return flag
    })

    const updatedStored = alreadyClicked
      ? stored.filter((id: string) => id !== flagId)
      : [...stored, flagId]

    localStorage.setItem(storageKey, JSON.stringify(updatedStored))

    if (field === 'seen') setSeenFlags(updatedStored)
    if (field === 'likes') setLikedFlags(updatedStored)

    setFlags(updatedFlags)

    setInteractionMessage(alreadyClicked
      ? `Removed your ${field === 'seen' ? 'seen' : 'like'} mark.`
      : `Marked as ${field === 'seen' ? 'seen' : 'liked'}!`
    )
    setTimeout(() => setInteractionMessage(null), 2000)
  }

  const handleTagSearch = (tag: string) => {
    if (!searchTags.includes(tag)) {
      setSearchTags([...searchTags, tag])
    }
    setSearchInput('')
  }

  const showTagPopup = (tag: string) => {
    setSelectedTag(tag)
    setTimeout(() => setSelectedTag(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-indigo-900 to-purple-900 text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <nav className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-purple-200">🌍 Festival Flags</h1>
            <p className="text-sm text-purple-300 mt-1 max-w-xl">
              A community-powered platform for tracking creative flags, banners, and totems seen at music festivals. Share what you&apos;ve spotted, or explore stories and info behind the ones that caught your eye.
            </p>
          </div>
          <Link
            href="/submit"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full font-semibold transition hidden sm:inline"
          >
            Submit a Flag
          </Link>
        </nav>

        <div className="flex flex-wrap gap-2 mb-4">
          {searchTags.map((tag, idx) => (
            <span key={idx} className="bg-purple-500 px-2 py-1 text-sm rounded-full">
              {tag} <button onClick={() => setSearchTags(searchTags.filter(t => t !== tag))}>×</button>
            </span>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by tag or keyword..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleTagSearch(searchInput)}
          className="w-full mb-4 p-2 border border-purple-500 rounded bg-black/40 text-white placeholder-purple-300"
        />

        <div className="flex gap-4 mb-6 text-sm flex-wrap">
          {(['popular', 'newest', 'seen', 'likes'] as const).map(option => (
            <button
              key={option}
              onClick={() => setSortOption(option)}
              className={sortOption === option ? 'underline' : ''}
            >
              {option === 'popular' ? 'Most Popular' : option === 'newest' ? 'Newest' : option === 'seen' ? 'Most Seen' : 'Most Likes'}
            </button>
          ))}
        </div>

        <p className="text-xs text-purple-300 mb-2">
          ✅ Click <Eye size={12} className="inline" /> if you’ve <strong>seen</strong> this flag at a festival.
          💜 Click <ThumbsUp size={12} className="inline ml-2" /> if it <strong>passed your vibe check</strong>.
        </p>
        {interactionMessage && (
          <p className="text-xs text-green-300 mb-2">{interactionMessage}</p>
        )}

        {loading ? (
          <p>Loading flags...</p>
        ) : filteredFlags.length === 0 ? (
          <p>No matching flags found.</p>
        ) : (
          <div className="space-y-6">
            {filteredFlags.map(flag => (
              <div
                key={flag.id}
                className="flex flex-col sm:flex-row gap-4 p-4 bg-white/10 border border-purple-600 rounded-xl shadow-md backdrop-blur overflow-hidden"
              >
                <div
                  className="relative cursor-pointer group"
                  onClick={() => {
                    setLightboxImage(flag.imageUrl)
                    setLightboxOpen(true)
                  }}
                >
                  <img
                    src={flag.imageUrl}
                    alt="flag"
                    className="w-full sm:w-40 aspect-[4/3] object-cover rounded-lg border border-purple-300 group-hover:brightness-110"
                  />
                </div>
                <div className="flex flex-col justify-between text-sm sm:text-base text-purple-100 w-full">
                  {flag.description && (
                    <p className="text-purple-200 text-sm font-semibold truncate mb-2" title={flag.description}>
                      {flag.description}
                    </p>
                  )}

                  {[
                    { label: '🎉 Spotted At Festivals:', items: Array.isArray(flag.festival) ? flag.festival : flag.festival.split(',') },
                    { label: '📍 From:', items: flag.location || [] },
                    { label: '🗣️ Speaks:', items: flag.language },
                    { label: '🎧 Stage Vibes:', items: flag.genres }
                  ].map(({ label, items }, i) => (
                    <div className="flex flex-wrap gap-1 items-baseline mb-1" key={i}>
                      <div className="text-xs font-semibold text-purple-300 leading-tight mr-2 whitespace-nowrap">{label}</div>
                      <div className="flex flex-wrap gap-1">
                        {items.map((item, idx) => (
                          <span
                            key={idx}
                            onClick={() => showTagPopup(item)}
                            title={item}
                            className={`${pillClass(label)} cursor-pointer font-medium px-2 py-0.5 rounded-full text-xs max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap transition-all`}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-2 mt-2 flex-wrap sm:flex-nowrap">
                    <button
                      onClick={() => handleInteraction(flag.id, 'seen')}
                      className={iconButtonStyle(seenFlags.includes(flag.id))}
                      title="Click if you’ve seen this flag in real life"
                    >
                      <Eye size={16} />
                      <span>{seenFlags.includes(flag.id) ? 'Seen' : 'I have seen it!'} ({flag.seen})</span>
                    </button>
                    <button
                      onClick={() => handleInteraction(flag.id, 'likes')}
                      className={iconButtonStyle(likedFlags.includes(flag.id))}
                      title="Click if this flag passed your vibe check"
                    >
                      <ThumbsUp size={16} />
                      <span>{likedFlags.includes(flag.id) ? 'Liked' : 'Like'} ({flag.likes})</span>
                    </button>
                    <button
                      onClick={() => router.push(`/flag/${flag.id}`)}
                      title="See or add comments about this flag"
                      className="flex items-center gap-1 text-sm px-3 py-1 rounded-full font-semibold transition-transform bg-indigo-700 hover:bg-indigo-600 text-white"
                    >
                      <MessageCircle size={16} />
                      <span>{commentCounts[flag.id] || 0} Comment{commentCounts[flag.id] === 1 ? '' : 's'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link
        href="/submit"
        className="fixed bottom-4 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full font-semibold shadow-lg sm:hidden flex items-center gap-2"
      >
        <span className="text-lg">➕</span>
        <span className="text-sm">Submit</span>
      </Link>

      {lightboxOpen && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={[{ src: lightboxImage }]}
        />
      )}

      {selectedTag && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-purple-900 text-white px-6 py-4 rounded-xl border border-purple-400 shadow-lg max-w-sm text-center relative">
            <button
              className="absolute top-2 right-2 text-purple-300 hover:text-white"
              onClick={() => setSelectedTag(null)}
            >
              ✕
            </button>
            <p className="text-sm break-words">{selectedTag}</p>
          </div>
        </div>
      )}
    </div>
  )
}
