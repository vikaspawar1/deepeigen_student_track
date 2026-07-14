import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "react-toastify"
import api from "../../lib/api"

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: any) => any;
  }
}

interface Lecture {
  id: number
  title: string
  duration?: string
  course: string
  price?: number
  already_owned?: boolean
}

interface Assignment {
  id: number
  name: string
  assignment_type: string
  module_id: number
  section_url: string
  pdf: string
  course_title: string
}

interface Playlist {
  id: number
  title: string
  description: string
  total_price: number
  include_assignments: boolean
  is_purchased: boolean
  created_at: string
  lectures: Lecture[]
  assignments?: Assignment[]
  assignments_count?: number
}

interface User {
  name: string
  email: string
}

export default function PlaylistSummary() {
  const { playlistId } = useParams<{ playlistId: string }>()
  const navigate = useNavigate()

  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userData, setUserData] = useState<User | null>(null)

  const [selectedDuration, setSelectedDuration] = useState<string>("1 Year")
  const [previewLoading, setPreviewLoading] = useState(false)
  const [displayTotalPrice, setDisplayTotalPrice] = useState(0)

  const [paymentLoading, setPaymentLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const playlistRes = await api.get(`/customplaylist/details/${playlistId}/`)

        if (playlistRes.data.success) {
          setPlaylist(playlistRes.data.playlist)
          setUserData(playlistRes.data.user)
          setDisplayTotalPrice(parseFloat(playlistRes.data.playlist.total_price))
        } else {
          setError(playlistRes.data.message || "Failed to load playlist")
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "An error occurred while fetching data")
      } finally {
        setLoading(false)
      }
    }

    if (playlistId) {
      fetchData()
    }
  }, [playlistId])

  // Fetch updated pricing when duration changes
  useEffect(() => {
    const fetchPreview = async () => {
      if (!playlist || !playlistId) return

      try {
        setPreviewLoading(true)
        const response = await api.post("/customplaylist/preview/", {
          lecture_ids: playlist.lectures.map(l => l.id),
          duration: selectedDuration,
          include_assignments: playlist.include_assignments
        })

        if (response.data.success) {
          setDisplayTotalPrice(parseFloat(response.data.total_price))
          // Update individual lecture prices if needed
          setPlaylist(prev => {
            if (!prev) return null
            const updatedLectures = prev.lectures.map(l => {
              const previewLec = response.data.breakdown.find((b: any) => b.id === l.id)
              return previewLec ? { ...l, price: previewLec.price } : l
            })
            return { ...prev, lectures: updatedLectures }
          })
        }
      } catch (err) {
        console.error("Failed to fetch price preview", err)
      } finally {
        setPreviewLoading(false)
      }
    }

    if (!loading && playlist) {
      fetchPreview()
    }
  }, [selectedDuration, playlistId, loading])

  const handlePayment = async () => {
    if (!playlist || !userData) return

    try {
      setPaymentLoading(true)

      const initRes = await api.post(
        `/customplaylist/initiate_payment/${playlistId}/`,
        {
          duration: selectedDuration,
        }
      )

      if (!initRes.data.success) {
        toast.error(initRes.data.message || "Failed to initiate payment")
        return
      }

      const orderData = initRes.data.data

      const options = {
        key: orderData.razorpay_key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Deep Eigen",
        description: `Payment for ${playlist.title}`,
        order_id: orderData.razorpay_order_id,

        handler: async (response: any) => {
          try {
            const verifyRes = await api.post(
              `/customplaylist/verify_payment/${playlistId}/`,
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }
            )

            if (verifyRes.data.success) {
              toast.success("Payment Successful")
              navigate("/user_dashboard", {
                state: { activeSection: "playlist" },
              })
            } else {
              toast.error("Payment verification failed")
            }
          } finally {
            setPaymentLoading(false)
          }
        },

        modal: {
          ondismiss: () => {
            setPaymentLoading(false)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Payment failed")
      setPaymentLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e9effb] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading playlist details...</p>
        </div>
      </div>
    )
  }

  if (error || !playlist) {
    return (
      <div className="min-h-screen bg-[#e9effb] flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center">
          <p className="text-red-500 font-medium mb-4">{error || "Playlist not found"}</p>
          <button onClick={() => navigate(-1)} className="text-blue-600 font-semibold">Go Back</button>
        </div>
      </div>
    )
  }

  const lectureTotal = playlist.lectures.reduce((sum, l) => sum + parseFloat(String(l.price || 0)), 0)
  const assignmentTotal = 100 * (playlist.assignments_count || 0)

  return (
    <div className="font-bricolage w-full min-h-screen bg-[#e9effb] px-4 py-8 sm:py-12 md:py-16 flex flex-col justify-center items-center">
      {/* Container card */}
      <div className="w-full max-w-[100vw]   sm:max-w-[60vw]  md:max-w-[90vw] lg:max-w-[60vw] bg-white rounded-[24px] border border-slate-200 p-6 sm:p-10 md:p-12 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        
        {/* Header (Title + Order ID) */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-none">
            Playlist Summary
          </h1>
          <span className="text-xs sm:text-sm text-slate-700 font-semibold opacity-70">
            Order ID: #{playlist.id}
          </span>
        </div>

        {/* User Info grey banner */}
        <div className="bg-[#f8faff] rounded-[16px] p-4 flex flex-col sm:flex-row justify-between gap-3 text-sm text-[#1a212f] mb-8 border border-slate-100">
          <p className="text-slate-600">
            <span className="font-bold text-slate-800">Name:</span> {userData?.name}
          </p>
          <p className="text-slate-600 break-all">
            <span className="font-bold text-slate-800">Registered Email:</span> {userData?.email}
          </p>
        </div>

        {/* Subscribe for row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100 mb-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-800">
            Subscribe for
          </h2>
          <div className="flex bg-[#fafafa] border border-slate-200 rounded-full p-1 w-fit">
            {[
              ["1 Month", "1 Month"],
              ["6 Months", "6 Months"],
              ["1 Year", "1 Year"],
            ].map(([key, label]) => (
              <button
                key={key}
                disabled={previewLoading}
                onClick={() => setSelectedDuration(key)}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap
                  ${selectedDuration === key
                    ? "bg-[#174cd2] text-white shadow-[0_2px_8px_rgba(23,76,210,0.15)]"
                    : "text-slate-600 hover:text-slate-900 bg-transparent"
                  } ${previewLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Lectures Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 font-bricolage">
            Selected Lectures ({playlist.lectures.length})
          </h3>
          <span className="text-lg sm:text-xl font-bold text-slate-800">
            ₹{lectureTotal.toFixed(2)}
          </span>
        </div>

        {/* Scrollable list of lectures */}
        <div className="max-h-[300px] overflow-y-auto pr-1 space-y-3 custom-scrollbar mb-8">
          {playlist.lectures.map((l, index) => (
            <div
              key={l.id || index}
              className="flex items-center justify-between py-2 border-b border-slate-50 last:border-b-0"
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Play Button Icon */}
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-slate-500 fill-current ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span className="text-sm sm:text-base text-slate-700 font-medium truncate">
                  {l.title}
                </span>
              </div>
              <div className="shrink-0 pl-4">
                {l.price === 0 ? (
                  <span className="text-sm font-semibold text-green-500">Purchased</span>
                ) : (
                  <span className="text-sm sm:text-base text-slate-600 font-medium">
                    ₹{l.price ? parseFloat(String(l.price)).toFixed(2) : "0.00"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Custom Assignment row */}
        {playlist.include_assignments && (
          <div className="mb-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 font-bricolage">
                Custom Assignment
              </h3>
              <span className="text-lg sm:text-xl font-bold text-slate-800">
                ₹{assignmentTotal.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Total Summary Row */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-8">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 font-bricolage">
            Total
          </h3>
          <span className={`text-xl sm:text-2xl font-bold text-[#174cd2] ${previewLoading ? "opacity-60" : ""}`}>
            ₹{displayTotalPrice.toFixed(2)}
          </span>
        </div>

        {/* Pay Button */}
        <button
          onClick={handlePayment}
          disabled={
            playlist.is_purchased ||
            previewLoading ||
            paymentLoading
          }
          className="w-full bg-[#174cd2] text-white py-2 rounded-[12px] text-base sm:text-lg font-bold hover:bg-blue-700 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2"
        >
          {playlist.is_purchased ? (
            "PLAYLIST ALREADY PURCHASED"
          ) : paymentLoading ? (
            <>
              <div className="w-5 h-5 border-2 capitalize border-white border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </>
          ) : previewLoading ? (
            "Calculating best price..."
          ) : (
            `Pay ₹${displayTotalPrice.toFixed(2)}`
          )}
        </button>

      </div>
    </div>
  )
}
