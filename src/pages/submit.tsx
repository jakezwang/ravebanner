import { useState } from 'react'
import { db, storage } from '@/lib/firebase'
import { addDoc, collection, Timestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { v4 as uuidv4 } from 'uuid'
import Link from 'next/link'
import { useRouter } from 'next/router'
import countries from 'world-countries'
import MultiSelect, { Option } from '@/components/MultiSelect'
import imageCompression from 'browser-image-compression'

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

const groupedFestivalOptions = [
  {
    label: 'EDC',
    options: ['EDC Las Vegas', 'EDC Orlando', 'EDC Mexico', 'EDC China', 'EDC Korea']
  },
  {
    label: 'Ultra',
    options: ['Ultra Miami', 'Ultra Europe', 'Ultra Japan', 'Ultra South Africa', 'Ultra Brazil']
  },
  {
    label: 'Tomorrowland',
    options: ['Tomorrowland Belgium', 'Tomorrowland Winter', 'Tomorrowland Brasil']
  },
  {
    label: 'Other',
    options: [
      'Creamfields', 'Sónar Festival', 'Mysteryland', 'Sunburn Festival', 'Parookaville', 'Ozora Festival',
      'Amsterdam Dance Event', 'Untold Festival', 'Boom Festival', 'Dekmantel', 'Movement Festival',
      'Electric Love Festival', 'Neopop Festival', 'Sonus Festival', 'Veld Music Festival',
      'Hideout Festival', 'World DJ Festival', 'Lovefest', 'Terminal V', 'ARC Music Festival',
      'Loveland Festival', 'Snowbombing', 'Dimensions Festival', 'S2O Festival', 'Lollapalooza',
      'CRSSD Fest', 'DGTL Festival', 'MELT Festival', 'Balaton Sound', 'Neversea Festival',
      'Boomtown', 'Nuits Sonores'
    ]
  }
].map(group => ({
  label: group.label,
  options: group.options.map(name => ({ value: name, label: name }))
}))


export default function SubmitFlag() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [country, setCountry] = useState<string[]>([])
  const [languages, setLanguages] = useState<Option[]>([])
  const [genres, setGenres] = useState<Option[]>([])
  const [festivals, setFestivals] = useState<Option[]>([])
  const [description, setDescription] = useState('')
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
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      }
      const compressedFile = await imageCompression(imageFile, options)
      const imageRef = ref(storage, `flags/${uuidv4()}`)
      await uploadBytes(imageRef, compressedFile)
      const imageUrl = await getDownloadURL(imageRef)

      await addDoc(collection(db, 'flags'), {
        imageUrl,
        country,
        language: languages.map(l => l.value),
        genres: genres.map(g => g.value),
        festival: festivals.map(f => f.value),
        seen: 0,
        likes: 0,
        createdAt: Timestamp.now(),
        description,
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
            <div>
              <label className="block mb-1 font-semibold">Flag Description:</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={100}
                placeholder="Taiwan & Japan Unity Flag"
                className="w-full border border-purple-500 p-2 rounded bg-black/40 text-white placeholder-purple-300"
              />
            </div>

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
                options={groupedFestivalOptions}
                selectedOptions={festivals}
                onChange={setFestivals}
                placeholder="Select or type festival names"
              />
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
