import { useState } from 'react'
import { db, storage } from '@/lib/firebase'
import { addDoc, collection, Timestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getAuth } from 'firebase/auth'
import { v4 as uuidv4 } from 'uuid'
import Link from 'next/link'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import imageCompression from 'browser-image-compression'
import { toast } from 'react-toastify'

// Fix hydration mismatch for react-select
const MultiSelect = dynamic(() => import('@/components/MultiSelect'), {
  ssr: false,
})
import { Option } from '@/components/MultiSelect'
import {
  locationOptions,
  genreOptions,
  languageOptions,
  festivalOptions,
} from '@/lib/options'

export default function SubmitFlag() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [locations, setLocations] = useState<string[]>([])
  const [languages, setLanguages] = useState<Option[]>([])
  const [genres, setGenres] = useState<Option[]>([])
  const [festivals, setFestivals] = useState<Option[]>([])
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!imageFile) return toast.error('Please upload a flag image.')
    if (description.length < 4) return toast.error('Add a bit more detail to your flag description.')

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

      const auth = getAuth()
      const user = auth.currentUser

      const flagData = {
        imageUrl,
        description,
        location: locations, // Optional
        language: languages.map((l) => l.value), // Optional
        genres: genres.map((g) => g.value), // Optional
        festival: festivals.map((f) => f.value), // Optional
        seen: 0,
        likes: 0,
        createdAt: Timestamp.now(),
        createdBy: user?.uid || null,
      }

      await addDoc(collection(db, 'flags'), flagData)

      toast.success('Flag submitted successfully!')
      router.push('/')
    } catch (err) {
      console.error('Error uploading flag:', err)
      toast.error('Failed to submit. Try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-indigo-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <nav className="mb-8 text-sm">
          <Link href="/" className="text-purple-300 hover:text-white">
            ← Back to Home
          </Link>
        </nav>

        <div className="bg-white/10 p-8 rounded-2xl shadow-lg backdrop-blur-md">
          <h1 className="text-3xl font-bold mb-6 text-purple-200">
          Share Your Festival Flag, Banner, or Totem 🏳️‍🌈
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-semibold">Flag Description:</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={100}
                placeholder="eg: Taiwan & Japan Unity Flag"
                className="w-full border border-purple-500 p-2 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full border border-purple-500 p-2 rounded bg-black/40"
              required
            />

            <div>
              <label className="block mb-1">Location(s):</label>
              <MultiSelect
                options={locationOptions}
                selectedOptions={locationOptions.filter((option: Option) =>
                  locations.includes(option.value)
                )}
                onChange={(selected: Option[]) => setLocations(selected.map((opt) => opt.value))}
                placeholder="City, State, or Country of this flag comes from" 
              />
            </div>

            <div>
              <label className="block mb-1">Languages:</label>
              <MultiSelect
                options={languageOptions}
                selectedOptions={languages}
                onChange={setLanguages}
                placeholder="Select languages this group speaks"
              />
            </div>

            <div>
              <label className="block mb-1">EDM Genres:</label>
              <MultiSelect
                options={genreOptions}
                selectedOptions={genres}
                onChange={setGenres}
                placeholder="Select genres this flag supports"
              />
            </div>

            <div>
              <label className="block mb-1">Festival Name(s):</label>
              <MultiSelect
                options={festivalOptions}
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
