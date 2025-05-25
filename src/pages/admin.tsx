import { useEffect, useState } from "react"
import { collection, getDocs, updateDoc, deleteDoc, doc, query, DocumentData } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth"
import toast, { Toaster } from 'react-hot-toast';
import { locationOptions, genreOptions, languageOptions, festivalOptions } from '@/lib/options';
import MultiSelect from "@/components/MultiSelect";
import Image from 'next/image';

interface Flag {
  id: string;
  title?: string;
  imageUrl: string;
  country?: string;
  festival?: string[];
  genres?: string[];
  description?: string;
  createdAt?: { seconds: number };
  language?: string[];
  location?: string[];
}

export default function AdminDashboard() {
  const [flags, setFlags] = useState<Flag[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")
  const [user, setUser] = useState<User | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{
    country: string;
    festival: string[];
    genres: string[];
    language?: string[];
  }>({
    country: "",
    festival: [],
    genres: [],
    language: [],
  })
  const [analytics, setAnalytics] = useState({
    totalPending: 0,
    totalApproved: 0,
    uploadedThisWeek: 0,
    commonFestivals: [] as string[],
    commonCountries: [] as string[],
  });
  const [bulkUploadMode, setBulkUploadMode] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [bulkImages, setBulkImages] = useState<File[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.email === "wangzhiyi05@gmail.com") {
        setUser(user)
      } else {
        setUser(null)
      }
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    const fetchFlags = async () => {
      const q = query(collection(db, "flags"))
      const snapshot = await getDocs(q)
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Flag[]
      setFlags(items)
      setLoading(false)
    }
    if (user) fetchFlags()
  }, [user])

  useEffect(() => {
    const fetchAnalytics = async () => {
      const snapshot = await getDocs(collection(db, "flags"));
      const flags = snapshot.docs.map(doc => doc.data());

      const now = new Date();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);

      const totalPending = flags.filter(flag => !flag.verified).length;
      const totalApproved = flags.filter(flag => flag.verified).length;
      const uploadedThisWeek = flags.filter(flag => flag.createdAt?.toDate() > oneWeekAgo).length;

      const festivalCounts: Record<string, number> = {};
      const countryCounts: Record<string, number> = {};

      flags.forEach((flag: DocumentData) => {
        const festivalList = (flag.festival || []) as string[];
        festivalList.forEach((festival: string) => {
          festivalCounts[festival] = (festivalCounts[festival] || 0) + 1;
        });
        const countryList = (flag.location || []) as string[];
        countryList.forEach((country: string) => {
          countryCounts[country] = (countryCounts[country] || 0) + 1;
        });
      });

      const commonFestivals = Object.entries(festivalCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([festival]) => festival);

      const commonCountries = Object.entries(countryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([country]) => country);

      setAnalytics({
        totalPending,
        totalApproved,
        uploadedThisWeek,
        commonFestivals,
        commonCountries,
      });
    };

    fetchAnalytics();
  }, []);

  const approveFlag = async (id: string) => {
    await updateDoc(doc(db, "flags", id), { verified: true })
    setFlags(flags.filter(flag => flag.id !== id))
    toast.success("Flag approved successfully!")
  }

  const deleteFlag = async (id: string) => {
    await deleteDoc(doc(db, "flags", id))
    setFlags(flags.filter(flag => flag.id !== id))
    toast.error("Flag deleted successfully!")
  }

  const saveEdit = async () => {
    if (!editId) return;
    await updateDoc(doc(db, "flags", editId), {
      country: editData.country,
      festival: editData.festival,
      genres: editData.genres,
    });
    setFlags(prev =>
      prev.map(f =>
        f.id === editId
          ? { ...f, ...editData }
          : f
      )
    );
    setEditId(null);
    toast.success("Changes saved successfully!");
  }

  const handleManualUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implement manual upload logic similar to the submit page.
  };

  const handleBulkUpload = async () => {
    if (!csvFile || bulkImages.length === 0) {
      return toast.error("Please upload both CSV and images.");
    }
    // Implement bulk upload logic to process CSV and images.
  };

  const filteredFlags = flags.filter(f =>
    (f.title ?? "").toLowerCase().includes(filter.toLowerCase()) ||
    String(f.country ?? "").toLowerCase().includes(filter.toLowerCase()) ||
    (Array.isArray(f.festival) ? f.festival.join(", ").toLowerCase() : "").includes(filter.toLowerCase())
  )

  if (!user) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold mb-4">Admin Sign In</h1>
        <button
          onClick={() => signInWithPopup(auth, new GoogleAuthProvider())}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Sign in with Google
        </button>
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold">Admin Flag Moderation</h1>
          <button onClick={() => signOut(auth)} className="text-sm text-red-600 underline">Sign out</button>
        </div>
        <input
          type="text"
          placeholder="Filter by title, country, or festival"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full p-2 mb-6 border rounded"
        />
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFlags.map(flag => (
              <div key={flag.id} className="border rounded-xl shadow p-4 bg-white">
                <Image
                  src={flag.imageUrl}
                  alt={flag.title ?? ''}
                  width={300}
                  height={200}
                  className="w-full h-48 object-cover rounded"
                />
                <h2 className="text-lg font-semibold mt-2">{flag.title}</h2>
                <p className="text-sm text-gray-500">{flag.country} • {flag.festival?.join(", ")}</p>
                <p className="text-sm italic mb-2">{flag.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Added on: {new Date((flag.createdAt as { seconds: number }).seconds * 1000).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => approveFlag(flag.id)} className="bg-green-600 text-white px-4 py-1 rounded">Approve</button>
                  <button onClick={() => deleteFlag(flag.id)} className="bg-red-600 text-white px-4 py-1 rounded">Delete</button>
                  <button onClick={() => {
                    setEditId(flag.id);
                    setEditData({
                      country: flag.country ?? "",
                      festival: Array.isArray(flag.festival) ? flag.festival : [],
                      genres: Array.isArray(flag.genres) ? flag.genres : [],
                    });
                  }} className="bg-yellow-500 text-white px-4 py-1 rounded">Edit</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Admin Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded shadow">
              <h3 className="text-lg font-semibold">Total Pending</h3>
              <p className="text-2xl font-bold">{analytics.totalPending}</p>
            </div>
            <div className="p-4 bg-white rounded shadow">
              <h3 className="text-lg font-semibold">Total Approved</h3>
              <p className="text-2xl font-bold">{analytics.totalApproved}</p>
            </div>
            <div className="p-4 bg-white rounded shadow">
              <h3 className="text-lg font-semibold">Uploaded This Week</h3>
              <p className="text-2xl font-bold">{analytics.uploadedThisWeek}</p>
            </div>
            <div className="p-4 bg-white rounded shadow col-span-2">
              <h3 className="text-lg font-semibold">Most Common Festivals</h3>
              <ul className="list-disc pl-5">
                {analytics.commonFestivals.map(festival => (
                  <li key={festival}>{festival}</li>
                ))}
              </ul>
            </div>
            <div className="p-4 bg-white rounded shadow col-span-2">
              <h3 className="text-lg font-semibold">Most Common Countries</h3>
              <ul className="list-disc pl-5">
                {analytics.commonCountries.map(country => (
                  <li key={country}>{country}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {editId && (
          <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Edit Flag Metadata</h3>
              <MultiSelect
                options={locationOptions}
                selectedOptions={locationOptions.filter(option => editData.country?.includes(option.value))}
                onChange={selected => setEditData({ ...editData, country: selected.map(opt => opt.value).join(", ") })}
                placeholder="Select locations"
              />
              <MultiSelect
                options={languageOptions}
                selectedOptions={languageOptions.filter(option => editData.language?.includes(option.value))}
                onChange={selected => setEditData({ ...editData, language: selected.map(opt => opt.value) })}
                placeholder="Select languages"
              />
              <MultiSelect
                options={genreOptions}
                selectedOptions={genreOptions.filter(option => (Array.isArray(editData.genres) ? editData.genres : []).includes(option.value))}
                onChange={selected => setEditData({ ...editData, genres: selected.map(opt => opt.value) })}
                placeholder="Select genres"
              />
              <MultiSelect
                options={festivalOptions}
                selectedOptions={festivalOptions.filter(option => (Array.isArray(editData.festival) ? editData.festival : []).includes(option.value))}
                onChange={selected => setEditData({ ...editData, festival: selected.map(opt => opt.value) })}
                placeholder="Select festivals"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setEditId(null)} className="text-sm px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button onClick={saveEdit} className="text-sm px-4 py-2 bg-blue-600 text-white rounded">Save</button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Admin Tools</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setBulkUploadMode(false)}
              className={`px-4 py-2 rounded ${!bulkUploadMode ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Manual Upload
            </button>
            <button
              onClick={() => setBulkUploadMode(true)}
              className={`px-4 py-2 rounded ${bulkUploadMode ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Bulk Upload
            </button>
          </div>
        </div>

        {!bulkUploadMode ? (
          <form onSubmit={handleManualUpload} className="space-y-4">
            <div>
              <label className="block mb-1 font-semibold">Flag Description:</label>
              <input
                type="text"
                placeholder="Enter description"
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Upload Image:</label>
              <input
                type="file"
                accept="image/*"
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Location(s):</label>
              <MultiSelect
                options={locationOptions}
                selectedOptions={[]}
                onChange={() => {}}
                placeholder="Select locations"
              />
            </div>
            <div>
              <label className="block mb-1">Festival(s):</label>
              <MultiSelect
                options={festivalOptions}
                selectedOptions={[]}
                onChange={() => {}}
                placeholder="Select festivals"
              />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Upload</button>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Upload CSV:</label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Upload Images:</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setBulkImages(Array.from(e.target.files || []))}
                className="w-full border p-2 rounded"
              />
            </div>
            <button onClick={handleBulkUpload} className="bg-blue-600 text-white px-4 py-2 rounded">Process Bulk Upload</button>
          </div>
        )}
      </div>
    </>
  )
}
