import { useState } from 'react'
import { db, storage } from '@/lib/firebase'
import { addDoc, collection, Timestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { v4 as uuidv4 } from 'uuid'
import Link from 'next/link'
import { useRouter } from 'next/router'
import countries from 'world-countries'
import MultiSelect from '@/components/MultiSelect'
import { Star } from 'lucide-react'

const languageOptions = [
  'English', 'Spanish', 'French', 'German', 'Mandarin', 'Hindi', 'Arabic',
  'Portuguese', 'Russian', 'Japanese', 'Korean', 'Italian', 'Dutch', 'Turkish',
  'Vietnamese', 'Polish', 'Ukrainian', 'Persian', 'Swahili', 'Indonesian',
].map(lang => ({ value: lang, label: lang }))

const genreOptions = [
  'House', 'Techno', 'Trance', 'Dubstep', 'Drum and Bass', 'Electro',
  'Progressive House', 'Deep House', 'Hardstyle', 'Trap', 'Future Bass',
  'Ambient', 'Chillout', 'Glitch Hop', 'Moombahton', 'Psytrance', 'Big Room',
  'Garage', 'Jungle', 'Synthwave'
].map(g => ({ value: g, label: g }))

const festivalOptions = [
  'Tomorrowland', 'Ultra Music Festival', 'Electric Daisy Carnival (EDC)',
  'Coachella', 'Lollapalooza', 'Creamfields', 'Sónar Festival', 'Awakenings',
  'Mysteryland', 'Exit Festival', 'Amsterdam Dance Event (ADE)',
  'Electric Zoo', 'Burning Man', 'Shambhala', 'Boom Festival',
  'Outlook Festival', 'Dimensions Festival', 'Sziget Festival',
  'Balaton Sound', 'Glastonbury'
].map(f => ({ value: f, label: f }))

export default function SubmitFlag() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [country, setCountry] = useState<string[]>([])
  const [languages, setLanguages] = useState<{ value: string; label: string }[]>([])
  const [genres, setGenres] = useState<{ value: string; label: string }[]>([])
  const [festivals, setFestivals] = useState<{ value: string; label: string }[]>([])
  const [vibe, setVibe] = useState(5)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const countryOptions = countries.map(c => ({
    value: c.cca2,
    label: `${c.flag} ${c.name.common}`,
  }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageFile) return alert('Please upload a flag image.')
    if (country.length === 0) return alert('Please select at least one country.')

    setLoading(true)
    try {
      const imageRef = ref(storage, `flags/${uuidv4()}`)
      await uploadBytes(imageRef, imageFile)
      const imageUrl = await getDownloadURL(imageRef)

      await addDoc(collection(db, 'flags'), {
        imageUrl,
        country,
        language: languages.map(l => l.value),
        genres: genres.map(g => g.value),
        festival: festivals.map(f => f.value).join(', '),
        vibe,
        createdAt: Timestamp.now(),
      })

      alert('Flag submitted successfully!')
      router.push('/')
    } catch (err) {
      console.error('Error uploading flag:', err)
      alert('Failed to submit. Try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-indigo-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-10">
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

            <div>
              <label className="block mb-1">Country / Region(s):</label>
              <MultiSelect
                options={countryOptions}
                selectedOptions={countryOptions.filter(option => country.includes(option.value))}
                onChange={(selected) => setCountry(selected.map(opt => opt.value))}
                placeholder="Select Countries"
              />
            </div>

            <div>
              <label className="block mb-1">Languages:</label>
              <MultiSelect
                options={languageOptions}
                selectedOptions={languages}
                onChange={setLanguages}
                placeholder="Select Languages"
              />
            </div>

            <div>
              <label className="block mb-1">EDM Genres:</label>
              <MultiSelect
                options={genreOptions}
                selectedOptions={genres}
                onChange={setGenres}
                placeholder="Select Genres"
              />
            </div>

            <div>
              <label className="block mb-1">Festival Name(s):</label>
              <MultiSelect
                options={festivalOptions}
                selectedOptions={festivals}
                onChange={setFestivals}
                placeholder="Select Festivals"
              />
            </div>

            <div>
              <label className="block mb-1">Vibe Rating:</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVibe(v)}
                    className="focus:outline-none"
                  >
                    <Star
                      size={24}
                      className={v <= vibe ? 'text-yellow-400' : 'text-gray-600'}
                      fill={v <= vibe ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
              </div>
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