import { useState, Dispatch, SetStateAction } from 'react'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import MultiSelect, { Option } from '@/components/MultiSelect'
import { locationOptions, genreOptions, languageOptions, festivalOptions } from '@/lib/options'
import type { Flag } from '@/pages' // Ensure the Flag type is imported correctly

export default function ClaimModal({ flagId, field, onClose, setFlags }: {
  flagId: string
  field: 'location' | 'genres' | 'language' | 'festival'
  onClose: () => void
  setFlags: Dispatch<SetStateAction<Flag[]>>
}) {
  const [selected, setSelected] = useState<Option[]>([])
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (selected.length === 0) return alert('Please select at least one item.');
    setSubmitting(true);

    const ref = doc(db, 'flags', flagId);

    // Fetch the current values of the field
    const currentDoc = await getDoc(ref);
    const currentValues = currentDoc.exists() ? currentDoc.data()[field] || [] : [];

    // Append new values to the existing ones
    const updatedValues = Array.isArray(currentValues)
      ? [...new Set([...currentValues, ...selected.map(s => s.value)])] // Ensure no duplicates
      : selected.map(s => s.value);

    await updateDoc(ref, {
      [field]: updatedValues,
    });

    // Update the local state instantly
    setFlags(prevFlags => prevFlags.map(flag => {
      if (flag.id === flagId) {
        return {
          ...flag,
          [field]: updatedValues,
        };
      }
      return flag;
    }));

    setSubmitting(false);
    onClose(); // Close the modal without showing an alert
  };

  const options = field === 'location' 
    ? locationOptions 
    : field === 'language' 
    ? languageOptions 
    : field === 'festival' 
    ? festivalOptions 
    : genreOptions

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-purple-900 text-white p-6 rounded-xl w-full max-w-md border border-purple-400">
        <h2 className="text-lg font-bold mb-4">
          Add {field === 'location' ? 'Location(s)' : field === 'language' ? 'Language(s)' : field === 'festival' ? 'Festival(s)' : 'Genre(s)'}
        </h2>
        <MultiSelect
          options={options}
          selectedOptions={selected}
          onChange={setSelected}
          placeholder={`Select ${field === 'location' ? 'location' : field === 'language' ? 'language' : field === 'festival' ? 'festival' : 'genre'}...`}
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
