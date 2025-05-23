import { useState } from 'react'
import { db, storage } from '@/lib/firebase'
import { addDoc, collection, Timestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { v4 as uuidv4 } from 'uuid'
import Link from 'next/link'

export default function SubmitFlag() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [country, setCountry] = useState('')
  const [language, setLanguage] = useState('')
  const [genres, setGenres] = useState('')
  const [festival, setFestival] = useState('')
  const [vibe, setVibe] = useState(5)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageFile) return alert('Please upload a flag image.')

    setLoading(true)
    try {
      const imageRef = ref(storage, `flags/${uuidv4()}`)
      await uploadBytes(imageRef, imageFile)
      const imageUrl = await getDownloadURL(imageRef)

      await addDoc(collection(db, 'flags'), {
        imageUrl,
        country,
        language: language.split(',').map(s => s.trim()),
        genres: genres.split(',').map(s => s.trim()),
        festival,
        vibe,
        createdAt: Timestamp.now(),
      })

      alert('Flag submitted successfully!')
      setCountry('')
      setLanguage('')
      setGenres('')
      setFestival('')
      setVibe(5)
      setImageFile(null)
    } catch (err) {
      console.error('Error uploading flag:', err)
      alert('Failed to submit. Try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-indigo-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Navigation */}
        <nav className="mb-8 text-sm">
          <Link href="/" className="text-purple-300 hover:text-white">← Back to Home</Link>
        </nav>

        <div className="bg-white/10 p-8 rounded-2xl shadow-lg backdrop-blur-md">
          <h1 className="text-3xl font-bold mb-6 text-purple-200">Submit Your Festival Flag 🏳️‍🌈</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={e => setImageFile(e.target.files?.[0] || null)}
              className="w-full border border-purple-500 p-2 rounded bg-black/40"
              required
            />
            <input
              type="text"
              placeholder="Country / Region"
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="w-full border border-purple-500 p-2 rounded bg-black/40"
              required
            />
            <input
              type="text"
              placeholder="Languages (comma-separated)"
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="w-full border border-purple-500 p-2 rounded bg-black/40"
              required
            />
            <input
              type="text"
              placeholder="EDM Genres (comma-separated)"
              value={genres}
              onChange={e => setGenres(e.target.value)}
              className="w-full border border-purple-500 p-2 rounded bg-black/40"
              required
            />
            <input
              type="text"
              placeholder="Festival Name (e.g. EDC 2025)"
              value={festival}
              onChange={e => setFestival(e.target.value)}
              className="w-full border border-purple-500 p-2 rounded bg-black/40"
              required
            />
            <div className="flex items-center gap-2">
              <label htmlFor="vibe">Vibe Rating:</label>
              <select
                id="vibe"
                value={vibe}
                onChange={e => setVibe(Number(e.target.value))}
                className="p-1 border border-purple-500 rounded bg-black/40"
              >
                {[1, 2, 3, 4, 5].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-xl transition"
            >
              {loading ? 'Uploading...' : '🚀 Submit Flag'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
