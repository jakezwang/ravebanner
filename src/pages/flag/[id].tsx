import { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, getDocs, query, orderBy, Timestamp, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import countries from 'world-countries'
import { ThumbsUp, Eye, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/router'

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
}

export default function HomePage() {
  const [flags, setFlags] = useState<Flag[]>([])
  const [filteredFlags, setFilteredFlags] = useState<Flag[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [seenFlags, setSeenFlags] = useState<string[]>([]);
  const [likedFlags, setLikedFlags] = useState<string[]>([]);
  const router = useRouter()

  useEffect(() => {
    setSeenFlags(JSON.parse(localStorage.getItem('seenFlags') || '[]'));
    setLikedFlags(JSON.parse(localStorage.getItem('likedFlags') || '[]'));
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

      const sortedFlags = flagsData.sort(
        (a, b) => (b.seen + b.likes + (counts[b.id] || 0)) - (a.seen + a.likes + (counts[a.id] || 0))
      )

      setFlags(sortedFlags)
      setFilteredFlags(sortedFlags)
      setLoading(false)
    }

    fetchFlags()
  }, [])

  const iconButtonStyle = (active: boolean) =>
    `flex items-center gap-1 text-sm px-3 py-1 rounded-full font-medium transition-transform ${
      active ? 'scale-110 bg-purple-600 text-white' : 'bg-purple-700 hover:bg-purple-600 text-white'
    }`

  const handleInteraction = async (flagId: string, field: 'seen' | 'likes') => {
    const storageKey = field === 'seen' ? 'seenFlags' : 'likedFlags';
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const alreadyClicked = stored.includes(flagId);

    const ref = doc(db, 'flags', flagId);
    const updatedFlags = flags.map(flag => {
      if (flag.id === flagId) {
        const updated = { ...flag, [field]: flag[field] + (alreadyClicked ? -1 : 1) };
        updateDoc(ref, { [field]: updated[field] });
        return updated;
      }
      return flag;
    });

    const updatedStored = alreadyClicked
      ? stored.filter((id: string) => id !== flagId)
      : [...stored, flagId];

    localStorage.setItem(storageKey, JSON.stringify(updatedStored));

    if (field === 'seen') setSeenFlags(updatedStored);
    if (field === 'likes') setLikedFlags(updatedStored);

    setFlags(updatedFlags);
    setFilteredFlags(updatedFlags);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-indigo-900 to-purple-900 text-white">
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur px-4 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-200">🌍 Festival Flags</h1>
          <Link
            href="/submit"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full font-semibold transition hidden sm:inline"
          >
            Submit a Flag
          </Link>
        </div>
        <input
          type="text"
          placeholder="Search by festival, genre, or country..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full mt-4 p-2 border border-purple-500 rounded bg-black/40 text-white placeholder-purple-300"
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <p>Loading flags...</p>
        ) : filteredFlags.length === 0 ? (
          <p>No matching flags found.</p>
        ) : (
          <div className="space-y-6">
            {/* ...flag cards remain unchanged... */}
          </div>
        )}
      </div>
      <Link
        href="/submit"
        className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white p-4 rounded-full shadow-lg sm:hidden"
      >
        ➕
      </Link>
    </div>
  )
}
