// src/pages/index.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, getDocs, query, orderBy, Timestamp, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import countries from 'world-countries'
import { ThumbsUp, Eye, MessageCircle, Plus } from 'lucide-react'
import { useRouter } from 'next/router'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import ClaimModal from '@/components/ClaimModal'
import Image from 'next/image';

const countryMap: Record<string, string> = {}
countries.forEach(c => {
  countryMap[c.cca2] = c.flag + ' ' + c.name.common
})

// Export the Flag type so it can be used in other files.
export type Flag = {
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
  const [claimFlagId, setClaimFlagId] = useState<string | null>(null)
  const [claimField, setClaimField] = useState<"location" | "genres" | "festival" | "language" | null>(null)
  const router = useRouter()

  const openClaimModal = (
    flagId: string,
    field: "location" | "genres" | "festival" | "language"
  ) => {
    setClaimFlagId(flagId)
    setClaimField(field)
  }
  

  const iconButtonStyle = (active: boolean) =>
    `flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold transition-transform ${active ? 'bg-white text-purple-700 scale-105' : 'bg-purple-700 hover:bg-purple-600 text-white'
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
          .catch(error => {
            // Suppress the error by adding a comment to indicate intentional handling.
            console.error('Error handling interaction:', error);
          })
        return updated
      }
      return flag
    })

    const updatedStored = alreadyClicked ? stored.filter((id: string) => id !== flagId) : [...stored, flagId]

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
    let result = [...flags];

    if (searchTags.length > 0) {
      result = result.filter(flag => {
        const allTags = [
          ...(Array.isArray(flag.festival) ? flag.festival : []),
          ...(Array.isArray(flag.location) ? flag.location : []),
          ...(Array.isArray(flag.language) ? flag.language : []),
          ...(Array.isArray(flag.genres) ? flag.genres : []),
          flag.description || ''
        ].map(t => t.toLowerCase()); // Normalize tags to lowercase

        return searchTags.every(tag => allTags.some(t => t.includes(tag.toLowerCase()))); // Match case-insensitively
      });
    }

    if (sortOption === 'popular') {
      result.sort((a, b) => (b.seen + b.likes + (commentCounts[b.id] || 0)) - (a.seen + a.likes + (commentCounts[a.id] || 0)));
    } else if (sortOption === 'seen') {
      result.sort((a, b) => b.seen - a.seen);
    } else if (sortOption === 'likes') {
      result.sort((a, b) => b.likes - a.likes);
    } else {
      result.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
    }

    setFilteredFlags(result);
  }, [flags, commentCounts, searchTags, sortOption]);

return (
  <div className="min-h-screen bg-gradient-to-br from-black via-indigo-900 to-purple-900 text-white">
    <div className="max-w-5xl mx-auto px-4 py-10 overflow-x-hidden">
      <div className="mb-6 flex flex-wrap sm:flex-nowrap justify-between items-start gap-4 relative">
        <div className="flex items-center gap-2 flex-1">
          <Image src="/favicon.svg" alt="Festival Flags Logo" width={32} height={32} className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold text-purple-200 whitespace-normal sm:whitespace-nowrap">Rave Banner - Discover Festival Flags & Totems</h1>
            <p className="text-sm text-purple-300">Share creative flags, banners, and totems you spotted at music festivals or raves, and explore their stories and info.</p>
          </div>
        </div>
        <div className="sm:ml-4">
          <Link
            href="/submit"
            className="hidden sm:block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full font-semibold shadow text-sm sm:text-base"
          >
            Submit a Flag
          </Link>
        </div>
        <Link
          href="/submit"
          className="sm:hidden fixed bg-purple-600 hover:bg-purple-700 text-white w-14 h-14 rounded-full flex flex-col items-center justify-center shadow bottom-4 right-4 z-50"
          title="Submit a Flag"
        >
          <Plus size={20} />
          <span className="text-[10px] font-medium">Submit</span>
        </Link>
      </div>

      <input
        type="text"
        placeholder="Search by tag or keyword..."
        value={searchInput}
        onChange={e => setSearchInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleTagSearch(searchInput)}
        className="w-full mb-4 p-2 border border-purple-500 rounded bg-black/40 text-white placeholder-purple-300"
      />

      {/* Display selected filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {searchTags.map((tag, idx) => (
          <span
            key={idx}
            className="bg-purple-700 text-white px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 cursor-pointer"
            onClick={() => setSearchTags(searchTags.filter((_, i) => i !== idx))} // Remove filter on click
          >
            {tag}
            <button className="text-white hover:text-gray-300">✕</button>
          </span>
        ))}
      </div>

      <div className="flex gap-3 mb-4">
        {(['popular', 'newest', 'seen', 'likes'] as const).map(option => (
          <button
            key={option}
            onClick={() => setSortOption(option)}
            className={`text-sm font-medium ${sortOption === option ? 'underline text-white' : 'text-purple-300'}`}
          >
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>

      {interactionMessage && (
        <div className="mb-4 text-green-300 text-sm">{interactionMessage}</div>
      )}

      {loading ? (
        <p>Loading flags...</p>
      ) : filteredFlags.length === 0 ? (
        <p>No matching flags found.</p>
      ) : (
        <div className="space-y-6">
          {filteredFlags.map(flag => (
            <div key={flag.id} className="bg-white/10 border border-purple-600 p-4 rounded-xl shadow-md">
              <div className="flex flex-col sm:flex-row gap-4">
                <div
                  className="relative cursor-pointer"
                  onClick={() => {
                    setLightboxImage(flag.imageUrl)
                    setLightboxOpen(true)
                  }}
                >
                  <Image
                    src={flag.imageUrl}
                    alt="flag"
                    width={300} // Set a default width
                    height={225} // Set a default height to maintain aspect ratio
                    className="w-full sm:w-40 aspect-[4/3] object-cover rounded border border-purple-300"
                    onClick={() => {
                      setLightboxImage(flag.imageUrl);
                      setLightboxOpen(true);
                    }}
                  />
                </div>

                <div className="flex flex-col justify-between text-sm sm:text-base text-purple-100 w-full">
                  {flag.description && (
                    <p className="text-purple-200 font-semibold mb-2 truncate" title={flag.description}>{flag.description}</p>
                  )}

                  {[{
                    label: '🎉 Spotted At Festivals:',
                    items: Array.isArray(flag.festival) ? flag.festival : flag.festival ? flag.festival.split(',') : [],
                    field: 'festival'
                  }, {
                    label: '📍 From:',
                    items: flag.location || [],
                    field: 'location'
                  }, {
                    label: '🗣️ Speaks:',
                    items: flag.language || [],
                    field: 'language'
                  }, {
                    label: '🎧 Stage Vibes:',
                    items: flag.genres || [],
                    field: 'genres'
                  }].map(({ label, items, field }, i) => (
                    <div key={i} className="mb-1">
                      <span className="text-xs font-semibold text-purple-300 mr-2">{label}</span>
                      {items.map((item, idx) => (
                        <span
                          key={idx}
                          onClick={() => showTagPopup(item)}
                          title={item}
                          className={`${pillClass(label)} cursor-pointer font-medium px-2 py-0.5 rounded-full text-xs mr-1 mb-1 inline-block`}
                        >
                          {item}
                        </span>
                      ))}
                      <button
                        onClick={() => openClaimModal(flag.id, field as 'location' | 'genres' | 'festival' | 'language')}
                        className="inline-flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white w-6 h-6 rounded-full text-xs font-medium shadow-sm hover:scale-105 transform transition"
                        title="Add"
                      >
                        <Plus size={12} className="animate-pulse" />
                      </button>
                    </div>
                  ))}

                  <div className="flex justify-between items-end">
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <button
                        onClick={() => handleInteraction(flag.id, 'seen')}
                        className={iconButtonStyle(seenFlags.includes(flag.id))}
                      >
                        <Eye size={16} />
                        <span>{seenFlags.includes(flag.id) ? 'Seen' : 'I have seen it!'} ({flag.seen})</span>
                      </button>
                      <button
                        onClick={() => handleInteraction(flag.id, 'likes')}
                        className={iconButtonStyle(likedFlags.includes(flag.id))}
                      >
                        <ThumbsUp size={16} />
                        <span>{likedFlags.includes(flag.id) ? 'Liked' : 'Like'} ({flag.likes})</span>
                      </button>
                      <button
                        onClick={() => router.push(`/flag/${flag.id}`)}
                        className="flex items-center gap-1 text-sm px-3 py-1 rounded-full font-semibold bg-indigo-700 hover:bg-indigo-600 text-white"
                      >
                        <MessageCircle size={16} />
                        <span>{commentCounts[flag.id] || 0} Comment{commentCounts[flag.id] === 1 ? '' : 's'}</span>
                      </button>
                    </div>
                    <span className="text-[10px] text-gray-500">
                      Added on: {new Date(flag.createdAt.seconds * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {lightboxOpen && (
      <Lightbox open={lightboxOpen} close={() => setLightboxOpen(false)} slides={[{ src: lightboxImage }]} />
    )}

    {selectedTag && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-purple-900 text-white px-6 py-4 rounded-xl border border-purple-400 shadow-lg max-w-sm text-center relative">
          <button
            className="absolute top-2 right-2 text-purple-300 hover:text-white"
            onClick={() => setSelectedTag(null)}
          >✕</button>
          <p className="text-sm break-words">{selectedTag}</p>
        </div>
      </div>
    )}

    {claimFlagId && claimField && (
      <ClaimModal
        flagId={claimFlagId}
        field={claimField as "location" | "genres" | "festival" | "language"}
        onClose={() => {
          setClaimFlagId(null);
          setClaimField(null);
        }}
        setFlags={setFlags} // Pass setFlags to ClaimModal
      />
    )}
  </div>
)
}
