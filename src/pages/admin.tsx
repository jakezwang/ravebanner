import { useEffect, useState } from "react"
import { collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy, DocumentData } from "firebase/firestore"
import { auth, db, storage } from "@/lib/firebase"
import { GoogleAuthProvider, onAuthStateChanged, signInWithRedirect, signOut, User } from "firebase/auth"
import toast, { Toaster } from 'react-hot-toast';
import { locationOptions, genreOptions, languageOptions, festivalOptions } from '@/lib/options';
import MultiSelect from "@/components/MultiSelect";
import Image from 'next/image';
import bcrypt from 'bcryptjs';
import { ref, deleteObject } from "firebase/storage";
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

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
  verified?: boolean; // Indicates if the flag is approved.
}

// Update the STATIC_PASSWORD_HASH with the newly generated hash.
const STATIC_PASSWORD_HASH = "$2b$10$wgiIxJcpXtvS2.oytSIsGuk3bZk9Sp9kVw3Fx7VK5tGyEN6XzB7EG";

export default function AdminDashboard() {
  const [flags, setFlags] = useState<Flag[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{
    country: string;
    festival: string[];
    genres: string[];
    language?: string[];
    description?: string;
  }>({
    country: "",
    festival: [],
    genres: [],
    language: [],
    description: "",
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'approved' | 'pending' | 'reports'>('all');
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [reports, setReports] = useState<{ id: string; flagId: string; details: string; createdAt: { seconds: number } }[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; type: 'flag' | 'report'; imageUrl?: string } | null>(null);

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

  // Update the approveFlag function to instantly reflect changes in the UI.
  const approveFlag = async (id: string) => {
    await updateDoc(doc(db, "flags", id), { verified: true });
    setFlags(prevFlags => prevFlags.map(flag => flag.id === id ? { ...flag, verified: true } : flag));
    toast.success("Flag approved successfully!");
  }

  // Add an unapproveFlag function to handle unapproving flags.
  const unapproveFlag = async (id: string) => {
    await updateDoc(doc(db, "flags", id), { verified: false });
    setFlags(prevFlags => prevFlags.map(flag => flag.id === id ? { ...flag, verified: false } : flag));
    toast.success("Flag unapproved successfully!");
  }

  // Update the deleteFlag function to validate Firebase Storage URLs
  const deleteFlag = async (id: string, imageUrl: string) => {
    try {
      // Check if the image URL is a valid Firebase Storage URL
      if (imageUrl.startsWith('https://firebasestorage.googleapis.com')) {
        // Delete the image from Firebase Storage
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      } else {
        console.warn('Skipping deletion for non-Firebase Storage URL:', imageUrl);
      }

      // Delete the document from Firestore
      await deleteDoc(doc(db, "flags", id));

      // Update the local state
      setFlags(flags.filter(flag => flag.id !== id));
      toast.success("Flag and associated image deleted successfully!");
    } catch (error) {
      console.error("Error deleting flag:", error);
      toast.error("Failed to delete flag. Please try again.");
    }
  }

  const saveEdit = async () => {
    if (!editId) return;
    await updateDoc(doc(db, "flags", editId), {
      country: editData.country,
      festival: editData.festival,
      genres: editData.genres,
      description: editData.description, // Save the description field
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

  // Update filteredFlags to include tag-based filtering
  const filteredFlags = flags.filter(f => {
    const allTags = [
      ...(Array.isArray(f.festival) ? f.festival : []),
      ...(Array.isArray(f.location) ? f.location : []),
      ...(Array.isArray(f.language) ? f.language : []),
      ...(Array.isArray(f.genres) ? f.genres : []),
      f.description || ''
    ].map(t => t.toLowerCase());

    return searchTags.every(tag => allTags.some(t => t.includes(tag.toLowerCase())));
  }).filter(f => {
    if (approvalFilter === 'approved') return f.verified;
    if (approvalFilter === 'pending') return !f.verified;
    return true;
  })

  const paginatedFlags = filteredFlags.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPages = Math.ceil(filteredFlags.length / itemsPerPage);

  // Remove debugging logs from the static password login function.
  const handleStaticPasswordLogin = async (password: string) => {
    const isMatch = await bcrypt.compare(password, STATIC_PASSWORD_HASH);
    if (isMatch) {
      setUser({
        email: "static-admin@festivalflags.com",
        displayName: "Static Admin",
      } as User);
      toast.success("Logged in as Static Admin!");
    } else {
      toast.error("Invalid password.");
    }
  };

  // Update the search bar to clear input after adding a filter
  const handleTagSearch = (tag: string) => {
    if (!searchTags.includes(tag)) {
      setSearchTags([...searchTags, tag]);
      setSearchInput(''); // Clear the input after adding a tag
    }
  };

  // Add a function to remove tags
  const removeTag = (tag: string) => {
    setSearchTags(searchTags.filter(t => t !== tag));
  };

  useEffect(() => {
    const fetchReports = async () => {
      setLoadingReports(true);
      try {
        const reportsCollection = collection(db, 'reports');
        const reportsQuery = query(reportsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(reportsQuery);
        const fetchedReports = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            flagId: data.flagId || '',
            details: data.details || '',
            createdAt: data.createdAt || { seconds: 0 },
          };
        });
        setReports(fetchedReports);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoadingReports(false);
      }
    };

    fetchReports();
  }, []);

  // Add a function to delete reports
  const deleteReport = async (id: string) => {
    try {
      await deleteDoc(doc(db, "reports", id));
      setReports(reports.filter(report => report.id !== id));
      toast.success("Report deleted successfully!");
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Failed to delete report. Please try again.");
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirmation) return;

    const { id, type, imageUrl } = deleteConfirmation;

    try {
      if (type === 'flag') {
        await deleteFlag(id, imageUrl || '');
      } else if (type === 'report') {
        await deleteReport(id);
      }
      setDeleteConfirmation(null);
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold mb-4">Admin Sign In</h1>
        <button
          onClick={() => signInWithRedirect(auth, new GoogleAuthProvider())}
          className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
        >
          Sign in with Google
        </button>
        <div>
          <input
            type="password"
            placeholder="Enter static password"
            className="border p-2 rounded mb-2"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleStaticPasswordLogin(e.currentTarget.value);
            }}
          />
          <button
            onClick={() => handleStaticPasswordLogin((document.querySelector('input[type=password]') as HTMLInputElement)?.value || "")}
            className="bg-gray-600 text-white px-4 py-2 rounded"
          >
            Login with Password
          </button>
        </div>
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
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by tag or keyword..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTagSearch(searchInput)}
            className="w-full p-2 border border-purple-500 rounded bg-black/40 text-white placeholder-purple-300"
          />
          <div className="flex gap-2 mt-2 flex-wrap">
            {searchTags.map((tag, idx) => (
              <span
                key={idx}
                className="bg-purple-700 text-white px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 cursor-pointer"
                onClick={() => removeTag(tag)}
              >
                {tag}
                <button className="text-white hover:text-gray-300">✕</button>
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setApprovalFilter('all')}
            className={`px-4 py-2 rounded ${approvalFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            All
          </button>
          <button
            onClick={() => setApprovalFilter('approved')}
            className={`px-4 py-2 rounded ${approvalFilter === 'approved' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Approved
          </button>
          <button
            onClick={() => setApprovalFilter('pending')}
            className={`px-4 py-2 rounded ${approvalFilter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setApprovalFilter('reports')}
            className={`px-4 py-2 rounded ${approvalFilter === 'reports' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Reports
          </button>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : approvalFilter === 'reports' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map(report => (
              <div key={report.id} className="border rounded-xl shadow p-4 bg-white">
                <Image
                  src={flags.find(flag => flag.id === report.flagId)?.imageUrl || '/placeholder.png'}
                  alt="Flag Image"
                  width={300}
                  height={200}
                  className="w-full h-48 object-cover rounded cursor-pointer"
                />
                <h2 className="text-lg font-semibold mt-2">Report Details</h2>
                <p className="text-sm text-gray-500">{report.details}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Submitted At: {new Date(report.createdAt.seconds * 1000).toLocaleDateString()}
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => deleteReport(report.id)}
                    className="bg-red-600 text-white px-4 py-1 rounded"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      setEditId(report.flagId);
                      const flag = flags.find(f => f.id === report.flagId);
                      if (flag) {
                        setEditData({
                          country: flag.country || '',
                          festival: flag.festival || [],
                          genres: flag.genres || [],
                          description: flag.description || '',
                          language: flag.language || [],
                        });
                      }
                    }}
                    className="bg-yellow-500 text-white px-4 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      deleteReport(report.id);
                      toast.success('Report resolved and deleted successfully!');
                    }}
                    className="bg-green-600 text-white px-4 py-1 rounded"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedFlags.map(flag => (
                <div key={flag.id} className="border rounded-xl shadow p-4 bg-white">
                  <Image
                    src={flag.imageUrl}
                    alt={flag.title ?? ''}
                    width={300}
                    height={200}
                    className="w-full h-48 object-cover rounded cursor-pointer"
                    onClick={() => {
                      setLightboxImage(flag.imageUrl);
                      setLightboxOpen(true);
                    }}
                  />
                  <h2 className="text-lg font-semibold mt-2">{flag.title}</h2>
                  <p className="text-sm text-gray-500">{flag.country} • {flag.festival?.join(", ")}</p>
                  <p className="text-sm italic mb-2">{flag.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Added on: {new Date((flag.createdAt as { seconds: number }).seconds * 1000).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    {!flag.verified && (
                      <button onClick={() => approveFlag(flag.id)} className="bg-green-600 text-white px-4 py-1 rounded">Approve</button>
                    )}
                    {flag.verified && (
                      <button onClick={() => unapproveFlag(flag.id)} className="bg-yellow-600 text-white px-4 py-1 rounded">Unapprove</button>
                    )}
                    <button
                      onClick={() => setDeleteConfirmation({ id: flag.id, type: 'flag', imageUrl: flag.imageUrl })}
                      className="bg-red-600 text-white px-4 py-1 rounded"
                    >
                      Delete
                    </button>
                    <button onClick={() => {
                      setEditId(flag.id);
                      setEditData({
                        country: flag.country ?? "",
                        festival: Array.isArray(flag.festival) ? flag.festival : [],
                        genres: Array.isArray(flag.genres) ? flag.genres : [],
                        description: flag.description ?? "", // Include description in edit data
                      });
                    }} className="bg-yellow-500 text-white px-4 py-1 rounded">Edit</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
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
              {/* Add a field to edit the description for each flag */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={editData.description || ''}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter a description for the flag"
                />
              </div>
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

        {lightboxOpen && lightboxImage && (
          <Lightbox
            open={lightboxOpen}
            close={() => setLightboxOpen(false)}
            slides={[{ src: lightboxImage }]}
          />
        )}

        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">Admin - Reports</h2>
          {loadingReports ? (
            <p>Loading reports...</p>
          ) : reports.length === 0 ? (
            <p>No reports found.</p>
          ) : (
            <ul className="space-y-4">
              {reports.map(report => (
                <li key={report.id} className="border p-4 rounded-md">
                  <p><strong>Flag ID:</strong> {report.flagId}</p>
                  <p><strong>Details:</strong> {report.details}</p>
                  <p><strong>Submitted At:</strong> {new Date(report.createdAt.seconds * 1000).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Delete confirmation modal */}
        {deleteConfirmation && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded shadow-md w-full max-w-sm">
              <h3 className="text-lg font-bold mb-4">Confirm Deletion</h3>
              <p className="text-sm text-gray-700 mb-4">
                Are you sure you want to delete this {deleteConfirmation.type === 'flag' ? 'flag' : 'report'}? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteConfirmation(null)}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
