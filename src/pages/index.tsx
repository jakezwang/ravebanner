// src/pages/index.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, getDocs, query, orderBy, Timestamp, updateDoc, doc } from 'firebase/firestore'
import { db, submitReport } from '@/lib/firebase'
import countries from 'world-countries'
import { ThumbsUp, Eye, MessageCircle, Plus } from 'lucide-react'
import { useRouter } from 'next/router'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import ClaimModal from '@/components/ClaimModal'
import Image from 'next/image';

const countryMap: Record<string, string> = {}
countries.forEach(c => {
  countryMap[c.cca2] = c.flag + ' ' + c.name.common
})

// Export the Flag type so it can be used in other files.
export type Flag = {
  id: string
  imageUrl: string
  location: string[]
  language: string[]
  genres: string[]
  festival: string[] | string
  seen: number
  likes: number
  createdAt: Timestamp
  description?: string
}

export default function HomePage() {
  const [flags, setFlags] = useState<Flag[]>([])
  const [loading, setLoading] = useState(true)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [seenFlags, setSeenFlags] = useState<string[]>([])
  const [likedFlags, setLikedFlags] = useState<string[]>([])
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImage, setLightboxImage] = useState('')
  const [sortOption, setSortOption] = useState<'newest' | 'popular' | 'seen' | 'likes'>('popular')
  const [interactionMessage, setInteractionMessage] = useState<string | null>(null)
  const [claimFlagId, setClaimFlagId] = useState<string | null>(null)
  const [claimField, setClaimField] = useState<"location" | "genres" | "festival" | "language" | null>(null)
  const [reportFlagId, setReportFlagId] = useState<string | null>(null)
  const [reportDetails, setReportDetails] = useState<string>('')
  const router = useRouter()

  const openClaimModal = (
    flagId: string,
    field: "location" | "genres" | "festival" | "language"
  ) => {
    setClaimFlagId(flagId)
    setClaimField(field)
  }
  

  const iconButtonStyle = (active: boolean) =>
    `flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold transition-transform ${active ? 'bg-white text-purple-700 scale-105' : 'bg-purple-700 hover:bg-purple-600 text-white'
    }`
  const pillClass = (label: string) => {
    if (label.includes('Spotted')) return "bg-yellow-200 text-yellow-900"
    if (label.includes('From')) return "bg-green-200 text-green-900"
    if (label.includes('Speaks')) return "bg-blue-200 text-blue-900"
    if (label.includes('Vibes')) return "bg-pink-200 text-pink-900"
    return "bg-white text-black"
  }

  const handleInteraction = async (flagId: string, field: 'seen' | 'likes') => {
    const storageKey = field === 'seen' ? 'seenFlags' : 'likedFlags'
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]')
    const alreadyClicked = stored.includes(flagId)

    const ref = doc(db, 'flags', flagId)
    const updatedFlags = flags.map(flag => {
      if (flag.id === flagId) {
        const updated = { ...flag, [field]: flag[field] + (alreadyClicked ? -1 : 1) }
        updateDoc(ref, { [field]: updated[field] })
          .catch(error => {
            // Suppress the error by adding a comment to indicate intentional handling.
            console.error('Error handling interaction:', error);
          })
        return updated
      }
      return flag
    })

    const updatedStored = alreadyClicked ? stored.filter((id: string) => id !== flagId) : [...stored, flagId]

    localStorage.setItem(storageKey, JSON.stringify(updatedStored))

    if (field === 'seen') setSeenFlags(updatedStored)
    if (field === 'likes') setLikedFlags(updatedStored)

    setFlags(updatedFlags)

    setInteractionMessage(alreadyClicked
      ? `Removed your ${field === 'seen' ? 'seen' : 'like'} mark.`
      : `Marked as ${field === 'seen' ? 'seen' : 'liked'}!`
    )
    setTimeout(() => setInteractionMessage(null), 2000)
  }

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setSeenFlags(JSON.parse(localStorage.getItem('seenFlags') || '[]'))
    setLikedFlags(JSON.parse(localStorage.getItem('likedFlags') || '[]'))
  }, [])

  // Fixed the missing dependency in useEffect
  useEffect(() => {
    const fetchFlags = async () => {
      setLoading(true);
      try {
        const flagsCollection = collection(db, 'flags');
        let flagsQuery;

        switch (sortOption) {
          case 'popular':
            flagsQuery = query(flagsCollection, orderBy('likes', 'desc'));
            break;
          case 'seen':
            flagsQuery = query(flagsCollection, orderBy('seen', 'desc'));
            break;
          case 'likes':
            flagsQuery = query(flagsCollection, orderBy('likes', 'desc'));
            break;
          case 'newest':
          default:
            flagsQuery = query(flagsCollection, orderBy('createdAt', 'desc'));
            break;
        }

        const querySnapshot = await getDocs(flagsQuery);
        const allFlags = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flag));
        setTotalPages(Math.ceil(allFlags.length / 15));
        const startIndex = (currentPage - 1) * 15;
        const paginatedFlags = allFlags.slice(startIndex, startIndex + 15);
        setFlags(paginatedFlags);
      } catch (error) {
        console.error('Error fetching flags:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlags();
  }, [sortOption, commentCounts, currentPage]);

  useEffect(() => {
    const fetchCommentCounts = async () => {
      const snapshot = await getDocs(collection(db, 'flags'));
      const counts: Record<string, number> = {};

      for (const doc of snapshot.docs) {
        const commentsSnapshot = await getDocs(collection(db, `flags/${doc.id}/comments`));
        counts[doc.id] = commentsSnapshot.size;
      }

      setCommentCounts(counts);
    };

    fetchCommentCounts();
  }, []); // Empty dependency array to run only on mount

  useEffect(() => {
    console.log('Flags before filtering:', flags);

    const result = [...flags];

    const sortedFlags = [...result];
    if (sortOption === 'popular') {
      sortedFlags.sort((a, b) => (b.seen + b.likes + (commentCounts[b.id] || 0)) - (a.seen + a.likes + (commentCounts[a.id] || 0)));
    } else if (sortOption === 'seen') {
      sortedFlags.sort((a, b) => b.seen - a.seen);
    } else if (sortOption === 'likes') {
      sortedFlags.sort((a, b) => b.likes - a.likes);
    } else {
      sortedFlags.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
    }

    console.log('Sorted Flags:', sortedFlags);

    const startIndex = (currentPage - 1) * 15;
    const paginatedFlags = sortedFlags.slice(startIndex, startIndex + 15);

    console.log('Paginated Flags:', paginatedFlags);

    setFlags(paginatedFlags);
  }, [flags, commentCounts, sortOption, currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  useEffect(() => {
    const fetchAndSortFlags = async () => {
      setLoading(true);

      // Fetch data (replace with your actual fetch logic)
      const fetchedFlags = await (async () => {
        const flagsCollection = collection(db, 'flags');
        const flagsQuery = query(flagsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(flagsQuery);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flag));
      })();

      // Sort the fetched data based on the selected sort option
      const sortedFlags = [...fetchedFlags];
      if (sortOption === 'popular') {
        sortedFlags.sort((a, b) => (b.seen + b.likes + (commentCounts[b.id] || 0)) - (a.seen + a.likes + (commentCounts[a.id] || 0)));
      } else if (sortOption === 'seen') {
        sortedFlags.sort((a, b) => b.seen - a.seen);
      } else if (sortOption === 'likes') {
        sortedFlags.sort((a, b) => b.likes - a.likes);
      } else {
        sortedFlags.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
      }

      // Apply pagination logic to limit flags to the first page
      const paginatedFlags = sortedFlags.slice(0, 15);

      // Update state with paginated data and reset to the first page
      setFlags(paginatedFlags);
      setCurrentPage(1);
      setLoading(false);
    };

    fetchAndSortFlags();
  }, [sortOption, commentCounts]);

  useEffect(() => {
    // Apply pagination whenever flags or currentPage changes
    const startIndex = (currentPage - 1) * 15;
    const paginatedFlags = flags.slice(startIndex, startIndex + 15);

    setFlags(paginatedFlags);
  }, [flags, currentPage]);

  const paginationButtonStyle = `px-4 py-2 rounded-md font-semibold text-white bg-purple-700 hover:bg-purple-600 transition-colors`;

  useEffect(() => {
    setFlags(flags);
  }, [flags]);

  const [filters, setFilters] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState('');

  const addFilter = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchInput.trim() && !filters.includes(searchInput.trim())) {
      setFilters([...filters, searchInput.trim()]);
      setSearchInput('');
    }
  };

  const removeFilter = (filter: string) => {
    setFilters(filters.filter(f => f !== filter));
  };

  useEffect(() => {
    const fetchFlagsWithFilters = async () => {
      setLoading(true);
      try {
        // Fetch the complete list of flags from the database
        const flagsCollection = collection(db, 'flags');
        const flagsQuery = query(flagsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(flagsQuery);
        const allFlags = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flag));

        // Filter flags based on the filters array
        const filteredFlags = filters.length > 0
          ? allFlags.filter(flag =>
              filters.every(filter => // Use 'every' to ensure all filters are matched
                (flag.description && flag.description.toLowerCase().includes(filter.toLowerCase())) ||
                (Array.isArray(flag.festival) && flag.festival.some(f => f.toLowerCase().includes(filter.toLowerCase()))) ||
                (flag.location && flag.location.some(loc => loc.toLowerCase().includes(filter.toLowerCase()))) ||
                (flag.language && flag.language.some(lang => lang.toLowerCase().includes(filter.toLowerCase()))) ||
                (flag.genres && flag.genres.some(genre => genre.toLowerCase().includes(filter.toLowerCase())))
              )
            )
          : allFlags;

        // Sort the filtered flags
        const sortedFlags = [...filteredFlags];
        if (sortOption === 'popular') {
          sortedFlags.sort((a, b) => (b.seen + b.likes + (commentCounts[b.id] || 0)) - (a.seen + a.likes + (commentCounts[a.id] || 0)));
        } else if (sortOption === 'seen') {
          sortedFlags.sort((a, b) => b.seen - a.seen);
        } else if (sortOption === 'likes') {
          sortedFlags.sort((a, b) => b.likes - a.likes);
        } else {
          sortedFlags.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
        }

        // Apply pagination
        setTotalPages(Math.ceil(sortedFlags.length / 15));
        const startIndex = (currentPage - 1) * 15;
        const paginatedFlags = sortedFlags.slice(startIndex, startIndex + 15);

        setFlags(paginatedFlags);
      } catch (error) {
        console.error('Error fetching flags with filters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlagsWithFilters();
  }, [filters, sortOption, currentPage, commentCounts]); // Added 'commentCounts' to the dependency array

  const handleReportSubmit = async (flagId: string) => {
    if (!reportDetails.trim()) {
      alert('Please enter details for the report.');
      return;
    }

    try {
      await submitReport(flagId, reportDetails);
      alert('Thank you for your report. We will review it shortly.');
      setReportFlagId(null);
      setReportDetails('');
    } catch (error) {
      alert('Failed to submit the report. Please try again later.');
      console.error('Error submitting report:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-indigo-900 to-purple-900 text-white">
      <div className="max-w-5xl mx-auto px-4 py-10 overflow-x-hidden">
        <div className="mb-4 flex flex-wrap sm:flex-nowrap justify-between items-start gap-4 relative">
          <div className="flex items-center gap-2 flex-1">
            <Image src="/favicon.svg" alt="Festival Flags Logo" width={32} height={32} className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold text-purple-200 whitespace-normal sm:whitespace-nowrap">Rave Banner - Discover Festival Flags & Totems</h1>
              <p className="text-sm text-purple-300">Share creative flags, banners, and totems you spotted at music festivals or raves, and explore their stories and info.</p>
            </div>
          </div>
          <div className="sm:ml-4">
            <Link
              href="/submit"
              className="hidden sm:block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full font-semibold shadow text-sm sm:text-base"
            >
              Submit a Flag
            </Link>
          </div>
          <Link
            href="/submit"
            className="sm:hidden fixed bg-purple-600 hover:bg-purple-700 text-white w-14 h-14 rounded-full flex flex-col items-center justify-center shadow bottom-4 right-4 z-50"
            title="Submit a Flag"
          >
            <Plus size={20} />
            <span className="text-[10px] font-medium">Submit</span>
          </Link>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-2">
          {/* Search Input Box */}
          <form onSubmit={addFilter} className="mb-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by keyword or any tag..."
              className="border border-gray-300 rounded-md p-2 w-full mb-2 text-[var(--foreground)] bg-[var(--background)] placeholder-gray-500"
            />
          </form>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1 mt-1">
            {filters.map((filter, index) => (
              <div
                key={index}
                className={`flex items-center ${pillClass(filter)} cursor-pointer font-medium px-2 py-0.5 rounded-full text-xs mr-1 mb-1 inline-block`}
              >
                {filter}
                <button
                  onClick={() => removeFilter(filter)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          {(['popular', 'newest', 'seen', 'likes'] as const).map(option => (
            <button
              key={option}
              onClick={() => setSortOption(option)}
              className={`text-sm font-medium ${sortOption === option ? 'underline text-white' : 'text-purple-300'}`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>

        {interactionMessage && (
          <div className="mb-4 text-green-300 text-sm">{interactionMessage}</div>
        )}

        {loading ? (
          <p>Loading flags...</p>
        ) : flags.length === 0 ? (
          <p>No flags found.</p>
        ) : (
          <div className="space-y-6">
            {/* Render paginated flags */}
            {flags.map(flag => (
              <div key={flag.id} className="bg-white/10 border border-purple-600 p-4 rounded-xl shadow-md">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div
                    className="relative cursor-pointer"
                    onClick={() => {
                      setLightboxImage(flag.imageUrl)
                      setLightboxOpen(true)
                    }}
                  >
                    <Image
                      src={flag.imageUrl}
                      alt="flag"
                      width={300} // Set a default width
                      height={225} // Set a default height to maintain aspect ratio
                      className="w-full sm:w-40 aspect-[4/3] object-cover rounded border border-purple-300"
                      loading="lazy"
                      onClick={() => {
                        setLightboxImage(flag.imageUrl);
                        setLightboxOpen(true);
                      }}
                    />
                  </div>

                  <div className="flex flex-col justify-between text-sm sm:text-base text-purple-100 w-full">
                    {flag.description && (
                      <p className="text-purple-200 font-semibold mb-2 truncate" title={flag.description}>{flag.description}</p>
                    )}

                    {[{
                      label: '🎉 Spotted At Festivals:',
                      items: Array.isArray(flag.festival) ? flag.festival : flag.festival ? flag.festival.split(',') : [],
                      field: 'festival'
                    }, {
                      label: '📍 From:',
                      items: flag.location || [],
                      field: 'location'
                    }, {
                      label: '🗣️ Speaks:',
                      items: flag.language || [],
                      field: 'language'
                    }, {
                      label: '🎧 Stage Vibes:',
                      items: flag.genres || [],
                      field: 'genres'
                    }].map(({ label, items, field }, i) => (
                      <div key={i} className="mb-1">
                        <span className="text-xs font-semibold text-purple-300 mr-2">{label}</span>
                        {items.map((item, idx) => (
                          <span
                            key={idx}
                            title={item}
                            className={`${pillClass(label)} cursor-pointer font-medium px-2 py-0.5 rounded-full text-xs mr-1 mb-1 inline-block`}
                          >
                            {item}
                          </span>
                        ))}
                        <button
                          onClick={() => openClaimModal(flag.id, field as 'location' | 'genres' | 'festival' | 'language')}
                          className="inline-flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white w-6 h-6 rounded-full text-xs font-medium shadow-sm hover:scale-105 transform transition"
                          title="Add"
                        >
                          <Plus size={12} className="animate-pulse" />
                        </button>
                      </div>
                    ))}

                    <div className="flex justify-between items-end">
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <button
                          onClick={() => handleInteraction(flag.id, 'seen')}
                          className={iconButtonStyle(seenFlags.includes(flag.id))}
                        >
                          <Eye size={16} />
                          <span>{seenFlags.includes(flag.id) ? 'Seen' : 'I have seen it!'} ({flag.seen})</span>
                        </button>
                        <button
                          onClick={() => handleInteraction(flag.id, 'likes')}
                          className={iconButtonStyle(likedFlags.includes(flag.id))}
                        >
                          <ThumbsUp size={16} />
                          <span>{likedFlags.includes(flag.id) ? 'Liked' : 'Like'} ({flag.likes})</span>
                        </button>
                        <button
                          onClick={() => router.push(`/flag/${flag.id}`)}
                          className="flex items-center gap-1 text-sm px-3 py-1 rounded-full font-semibold bg-indigo-700 hover:bg-indigo-600 text-white"
                        >
                          <MessageCircle size={16} />
                          <span>{commentCounts[flag.id] || 0} Comment{commentCounts[flag.id] === 1 ? '' : 's'}</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500">
                          Added on: {new Date(flag.createdAt.seconds * 1000).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => setReportFlagId(flag.id)}
                          className="text-[10px] text-blue-500 hover:underline"
                        >
                          Report
                        </button>
                      </div>
                    </div>

                    {/* Report Button */}
                    {/* <button
                      onClick={() => setReportFlagId(flag.id)}
                      className="text-xs text-gray-400 hover:text-gray-600 underline ml-2"
                    >
                      Report
                    </button> */}

                    {/* Report Input Box */}
                    {reportFlagId === flag.id && (
                      <div className="mt-2">
                        <textarea
                          placeholder="Enter your report details here..."
                          className="w-full p-2 border border-gray-300 rounded-md text-black"
                          rows={3}
                          value={reportDetails}
                          onChange={(e) => setReportDetails(e.target.value)}
                        ></textarea>
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => handleReportSubmit(flag.id)}
                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                          >
                            Submit
                          </button>
                          <button
                            onClick={() => setReportFlagId(null)}
                            className="ml-2 text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination controls */}
            <div className="pagination-container flex items-center justify-center gap-2 mt-4">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`${paginationButtonStyle} disabled:bg-gray-300 disabled:cursor-not-allowed text-sm`}
              >
                Previous
              </button>
              <span className="page-info text-xs font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`${paginationButtonStyle} disabled:bg-gray-300 disabled:cursor-not-allowed text-sm`}
              >
                Next
              </button>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = Math.min(Math.max(Number(e.target.value), 1), totalPages);
                    setCurrentPage(page);
                  }}
                  className="w-16 px-2 py-1 border border-gray-700 rounded bg-black/40 text-white placeholder-gray-400"
                />
                <button
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors text-sm"
                  onClick={() => setCurrentPage(currentPage)}
                >
                  Go
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Load More button */}
        {/* Removed the Load More button since pagination is being used. */}
        {/* <button onClick={loadMoreFlags}>Load More</button> */}

      </div>

      {lightboxOpen && (
        <Lightbox open={lightboxOpen} close={() => setLightboxOpen(false)} slides={[{ src: lightboxImage }]} />
      )}

      {claimFlagId && claimField && (
        <ClaimModal
          flagId={claimFlagId}
          field={claimField as "location" | "genres" | "festival" | "language"}
          onClose={() => {
            setClaimFlagId(null);
            setClaimField(null);
          }}
          setFlags={setFlags} // Pass setFlags to ClaimModal
        />
      )}
    </div>
  )
}
