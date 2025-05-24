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
  country: string[]
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
          ...flag.country.map(code => countryMap[code] || code),
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
    `flex items-center gap-1 text-sm px-3 py-1 rounded-full font-medium transition-transform ${
      active ? 'scale-110 bg-purple-600 text-white' : 'bg-purple-700 hover:bg-purple-600 text-white'
    }`

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
          <h1 className="text-3xl font-bold text-purple-200">🌍 Festival Flags</h1>
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
                    <p
                      className="text-purple-200 text-sm font-semibold truncate mb-2"
                      title={flag.description}
                    >
                      {flag.description}
                    </p>
                  )}

                  {[
                    { label: 'Festival(s):', items: Array.isArray(flag.festival) ? flag.festival : flag.festival.split(',') },
                    { label: 'Country / Region(s):', items: flag.country.map(code => countryMap[code] || code) },
                    { label: 'Languages:', items: flag.language },
                    { label: 'Genres:', items: flag.genres }
                  ].map(({ label, items }, i) => (
                    <div className="flex flex-wrap items-center gap-2 mb-2" key={i}>
                      <span className="font-semibold text-purple-300">{label}</span>
                      {items.map((item, idx) => (
                        <span
                          key={idx}
                          onClick={() => showTagPopup(item)}
                          title={item}
                          className="cursor-pointer bg-purple-600/60 text-xs px-2 py-1 rounded-full truncate max-w-[100px]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ))}

                  <div className="flex gap-3 mt-2 overflow-x-auto sm:flex-wrap">
                    <button
                      onClick={() => handleInteraction(flag.id, 'seen')}
                      className={iconButtonStyle(seenFlags.includes(flag.id))}
                    >
                      <Eye size={16} /> {flag.seen}
                    </button>
                    <button
                      onClick={() => handleInteraction(flag.id, 'likes')}
                      className={iconButtonStyle(likedFlags.includes(flag.id))}
                    >
                      <ThumbsUp size={16} /> {flag.likes}
                    </button>
                    <button
                      onClick={() => router.push(`/flag/${flag.id}`)}
                      className="flex items-center gap-1 text-sm text-purple-300 hover:text-white"
                    >
                      <MessageCircle size={16} /> {commentCounts[flag.id] || 0}
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
        className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white p-4 rounded-full shadow-lg sm:hidden"
      >
        ➕
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