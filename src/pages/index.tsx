import { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

type Flag = {
  id: string
  imageUrl: string
  country: string
  language: string[]
  genres: string[]
  festival: string
  vibe: number
  createdAt: Timestamp
}

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
      flag.country.toLowerCase().includes(lowerSearch) ||
      flag.genres.join(',').toLowerCase().includes(lowerSearch)
    )
    setFilteredFlags(filtered)
  }, [search, flags])

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-indigo-900 to-purple-900 text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Navbar */}
        <nav className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-purple-200">🌍 Festival Flags</h1>
          <Link href="/submit" className="text-purple-300 hover:text-white underline">Submit a Flag</Link>
        </nav>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by festival, genre, or country..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full mb-8 p-2 border border-purple-500 rounded bg-black/40 text-white placeholder-purple-300"
        />

        {/* Content */}
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
                <div className="flex flex-col justify-between text-sm sm:text-base text-purple-100">
                  <p><strong>Festival:</strong> {flag.festival}</p>
                  <p><strong>Country:</strong> {flag.country}</p>
                  <p><strong>Languages:</strong> {flag.language.join(', ')}</p>
                  <p><strong>Genres:</strong> {flag.genres.join(', ')}</p>
                  <p><strong>Vibe:</strong> {flag.vibe}/5</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
