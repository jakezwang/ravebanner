import { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import countries from 'world-countries'
import { Star } from 'lucide-react'

type Flag = {
  id: string
  imageUrl: string
  country: string[]
  language: string[]
  genres: string[]
  festival: string
  vibe: number
  createdAt: Timestamp
}

const countryMap = Object.fromEntries(
  countries.map(c => [c.cca2, `${c.flag} ${c.name.common}`])
)

export default function HomePage() {
  const [flags, setFlags] = useState<Flag[]>([])
  const [filteredFlags, setFilteredFlags] = useState<Flag[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFlags = async () => {
      const q = query(collection(db, 'flags'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      const flagsData: Flag[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Flag[]
      setFlags(flagsData)
      setFilteredFlags(flagsData)
      setLoading(false)
    }

    fetchFlags()
  }, [])

  useEffect(() => {
    const lowerSearch = search.toLowerCase()
    const filtered = flags.filter(flag =>
      flag.festival.toLowerCase().includes(lowerSearch) ||
      flag.country.join(',').toLowerCase().includes(lowerSearch) ||
      flag.genres.join(',').toLowerCase().includes(lowerSearch)
    )
    setFilteredFlags(filtered)
  }, [search, flags])

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-indigo-900 to-purple-900 text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <nav className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-purple-200">🌍 Festival Flags</h1>
          <Link
            href="/submit"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full font-semibold transition"
          >
            Submit a Flag
          </Link>
        </nav>

        <input
          type="text"
          placeholder="Search by festival, genre, or country..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full mb-8 p-2 border border-purple-500 rounded bg-black/40 text-white placeholder-purple-300"
        />

        {loading ? (
          <p>Loading flags...</p>
        ) : filteredFlags.length === 0 ? (
          <p>No matching flags found.</p>
        ) : (
          <div className="space-y-6">
            {filteredFlags.map(flag => (
              <div
                key={flag.id}
                className="flex flex-col sm:flex-row gap-4 p-4 bg-white/10 border border-purple-600 rounded-xl shadow-md backdrop-blur"
              >
                <img
                  src={flag.imageUrl}
                  alt="flag"
                  className="w-full sm:w-40 h-24 object-cover rounded-lg border border-purple-300"
                />
                <div className="flex flex-col justify-between text-sm sm:text-base text-purple-100 w-full">

                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-semibold text-purple-300">Festival(s):</span>
                    {flag.festival.split(',').map((f, idx) => (
                      <span key={idx} className="bg-purple-700/60 text-xs px-2 py-1 rounded-full">{f.trim()}</span>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-semibold text-purple-300">Country / Region(s):</span>
                    {flag.country.map((code, idx) => (
                      <span key={idx} className="bg-purple-600/60 text-xs px-2 py-1 rounded-full">
                        {countryMap[code] || code}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-semibold text-purple-300">Languages:</span>
                    {flag.language.map((lang, idx) => (
                      <span key={idx} className="bg-purple-500/40 text-xs px-2 py-1 rounded-full">{lang}</span>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-semibold text-purple-300">Genres:</span>
                    {flag.genres.map((genre, idx) => (
                      <span key={idx} className="bg-indigo-600/50 text-xs px-2 py-1 rounded-full">{genre}</span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < flag.vibe ? 'text-yellow-400' : 'text-gray-600'}
                        fill={i < flag.vibe ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}