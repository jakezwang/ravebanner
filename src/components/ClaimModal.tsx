import { useState } from 'react'
import { addDoc, collection, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import MultiSelect, { Option } from '@/components/MultiSelect'
import { locationOptions, genreOptions } from '@/lib/options'

export default function ClaimModal({ flagId, field, onClose }: {
  flagId: string
  field: 'location' | 'genres'
  onClose: () => void
}) {
  const [selected, setSelected] = useState<Option[]>([])
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (selected.length === 0) return alert('Please select at least one item.')
    setSubmitting(true)
    await addDoc(collection(db, `flags/${flagId}/claims`), {
      type: field,
      value: selected.map(s => s.value),
      submittedAt: Timestamp.now()
    })
    setSubmitting(false)
    alert('Thanks! Your suggestion was submitted.')
    onClose()
  }

  const options = field === 'location' ? locationOptions : genreOptions

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-purple-900 text-white p-6 rounded-xl w-full max-w-md border border-purple-400">
        <h2 className="text-lg font-bold mb-4">
          Add {field === 'location' ? 'Location(s)' : 'Genre(s)'}
        </h2>
        <MultiSelect
          options={options}
          selectedOptions={selected}
          onChange={setSelected}
          placeholder={`Select ${field}...`}
        />
        <div className="flex justify-end mt-4 gap-2">
          <button
            className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded"
            onClick={onClose}
          >Cancel</button>
          <button
            className="bg-purple-600 hover:bg-purple-700 px-4 py-1 rounded font-semibold"
            onClick={handleSubmit}
            disabled={submitting}
          >{submitting ? 'Submitting...' : 'Submit'}</button>
        </div>
      </div>
    </div>
  )
}
