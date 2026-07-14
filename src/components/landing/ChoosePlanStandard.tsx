import { useState, useEffect } from "react"
import { useNavigate, useSearchParams, useLocation } from "react-router-dom"
import api from "../../lib/api"
import { useAppSelector } from "../../redux/hooks"
import { selectUser, selectIsAdmin } from "../../redux/slices/auth"
import { toast } from "react-toastify"
import Loader from "../ui/Loader"

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: any) => any;
  }
}

interface Lecture {
  id: string | number
  title: string
  price: number
  purchased?: boolean
}

const normalizeDuration = (dur: string) => {
  if (!dur) return "Yearly";
  const d = dur.toLowerCase();
  if (d.includes("month") && !d.includes("6")) return "Monthly";
  if (d.includes("quarter") || d.includes("6") || d.includes("four")) return "Quarterly";
  if (d.includes("year") || d.includes("1 year")) return "Yearly";
  return dur.charAt(0).toUpperCase() + dur.slice(1);
};

const durationOptions = [
  { value: "Monthly", label: "1 Month" },
  { value: "Quarterly", label: "6 Months" },
  { value: "Yearly", label: "1 Year" }
];

function ChoosePlanStandard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const state = location.state as { planName?: string, subtitle?: string, priceInr?: number, priceUsd?: number, duration?: string } | null

  const planParam = searchParams.get("plan") || state?.planName?.toLowerCase() || "standard"
  const durationParam = searchParams.get("duration") || state?.duration || "Yearly"

  const [selectedDuration, setSelectedDuration] = useState(() => normalizeDuration(durationParam))

  const user = useAppSelector(selectUser)
  const isAdmin = useAppSelector(selectIsAdmin)
  const navigate = useNavigate()

  const [pageLoading, setPageLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [planData, setPlanData] = useState<any>(null)

  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        setPageLoading(true)
        const { data, status } = await api.get(`subscriptions/plan-details/${planParam}/${selectedDuration}/`)
        if (status === 200 && data.success) {
          setPlanData(data)
        }
      } catch (err) {
        console.error("Failed to fetch plan details:", err)
      } finally {
        setPageLoading(false)
      }
    }

    if (isAdmin) {
      navigate("/user_dashboard")
      return
    }

    fetchPlanDetails()
  }, [planParam, selectedDuration])

  const lectures: Lecture[] = planData ? [
    ...planData.courses.map((c: any) => ({
      id: c.id,
      title: c.title,
      price: c.price,
      purchased: false
    })),
    ...planData.already_purchased.map((c: any) => ({
      id: c.course_id,
      title: c.title,
      price: c.price,
      purchased: true
    }))
  ] : []

  // const lecturePrice = planData ? planData.plan_price : 0
  // const total = lecturePrice
  // const payAmount = planData ? planData.final_price : 0

  const handlePayment = async () => {
    if (!user) {
      toast.error("Please login to proceed with payment.");
      navigate("/login", { state: { from: `/choosestandard?plan=${planParam}&duration=${durationParam}` } });
      return;
    }

    if (!planData) {
      toast.error("Plan data not loaded yet.");
      return;
    }

    setPaymentLoading(true);

    try {
      // 1. Place order
      const formData = new FormData();
      formData.append("plan_id", planData.id.toString());

      const { data: orderData, status: orderStatus } = await api.post("subscriptions/place-order/", formData);

      if (orderStatus !== 200 || !orderData.success) {
        throw new Error(orderData.error || "Failed to place order");
      }

      // 1.5 Handle free subscription (full deduction)
      if (orderData.free) {
        toast.success(orderData.message || "Subscription activated successfully!");
        navigate("/user_dashboard");
        return;
      }

      // 2. Initialize Razorpay
      const razorpayOptions = orderData.razorpay;
      const orderNumber = orderData.order.order_number;

      const options = {
        key: "rzp_test_SC3habFpUn2zel", 
        amount: razorpayOptions.amount,
        currency: razorpayOptions.currency,
        name: "Deep Eigen",
        description: `${planData.plan} Plan - ${planData.duration}`,
        order_id: razorpayOptions.id,
        handler: async function (response: any) {
          try {
            // 3. Verify payment (payment_done)
            const verifyData = new FormData();
            verifyData.append("razorpay_payment_id", response.razorpay_payment_id);
            verifyData.append("razorpay_order_id", response.razorpay_order_id);
            verifyData.append("razorpay_signature", response.razorpay_signature);

            const { data: verifyResult, status: verifyStatus } = await api.post(`subscriptions/payment-done/${orderNumber}/`, verifyData);

            if (verifyStatus === 200 && verifyResult.success) {
              toast.success("Subscription activated successfully!");
              navigate("/user_dashboard");
            } else {
              toast.error(verifyResult.error || "Payment verification failed.");
            }
          } catch (err: any) {
            console.error("Payment verification error:", err);
            toast.error("An error occurred during payment verification.");
          }
        },
        prefill: {
          name: user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username : "Test User",
          email: user?.email || "test@example.com",
          contact: "",
        },
        theme: {
          color: "#174cd2",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast.error("Payment failed: " + response.error.description);
      });
      rzp.open();

    } catch (err: any) {
      console.error("Payment error:", err);
      toast.error(err.message || "An error occurred while initiating payment.");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#174cd2] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
    )
  }

  const getFriendlyDuration = () => {
    const rawDuration = planData?.duration || selectedDuration
    if (!rawDuration) return ""
    const d = rawDuration.toUpperCase()
    if (d === "MONTHLY" || d === "1 MONTH") return "1 Month"
    if (d === "FOUR_MONTH" || d === "QUARTERLY" || d === "6 MONTHS") return "6 Months"
    if (d === "YEARLY" || d === "1 YEAR") return "1 Year"
    return rawDuration
  }

  const displayName = planData?.plan || state?.planName || "Standard"
  const userCountry = user?.country?.toLowerCase() || ""
  const isIndia = userCountry === "india" || userCountry === "in"
  const currency = planData?.currency === "INR" || (isIndia && !planData) ? "₹" : "$"
  const displayPrice = planData ? planData.final_price : (isIndia ? state?.priceInr : state?.priceUsd) || 0
  const displayTotal = planData ? planData.plan_price : (isIndia ? state?.priceInr : state?.priceUsd) || 0

  return (
    <div className=" font-bricolage  max-w-full sm:max-w-[84vw] md:max-w-[90vw] lg:max-w-[86vw] mx-auto min-h-screen 
    bg-white px-3 sm:px-4 md:px-8 lg:px-12 py-4 sm:py-6 md:py-10">

      <div className=" w-full">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center md:ml-5 font-bold gap-2 text-gray-700 mb-4 sm:mb-6 hover:text-blue-600"
        >
          <i className="ri-arrow-left-line"></i><span className="text-sm sm:text-base font-bold">Go back</span>
        </button>

        {/* Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 md:p-8 lg:p-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8 border-b border-gray-400 pb-6">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold">
                {displayName} Plan - {getFriendlyDuration()}
              </h1>
              <p className="text-sm sm:text-base text-gray-500 mt-1">
                {state?.subtitle || (planParam === "standard" ? "Deep & specialized courses" : "")}
              </p>
            </div>

            {/* Duration Switcher */}
            <div className="flex items-center gap-3">
              <span className="text-sm sm:text-base font-semibold text-gray-800">Subscribe for</span>
              <div className="inline-flex bg-white border border-gray-400 rounded-full p-1 ">
                {durationOptions.map((opt) => {
                  const isActive = normalizeDuration(selectedDuration) === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSelectedDuration(opt.value);
                        setSearchParams((prev) => {
                          prev.set("duration", opt.value);
                          return prev;
                        });
                      }}
                      className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-blue-600 text-white shadow"
                          : "text-gray-600 hover:text-blue-600"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Name / Email */}
          <div className="bg-[#f1f5fd] rounded-lg font-bricolage px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0 mb-6 sm:mb-8">
            <p className="text-sm sm:text-base">
              <span className="font-medium">Name: </span>
              {user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username : "John Doe"}
            </p>
           
            <p className="text-sm font-bricolage sm:text-base">
              <span className="font-medium">Registered Email: </span>
              {user?.email || "johndoe@email.com"}
            </p>
          </div>

          {/* Lectures */}
          <div className="mb-6">
            <div className="max-h-96 sm:max-h-[30vh] md:max-h-[35vh] overflow-y-auto space-y-2 pr-1 sm:pr-2">
              {lectures.map(l => (
                <div
                  key={l.id}
                  className="flex items-start sm:items-center justify-between gap-3 p-3 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-start sm:items-center gap-3 flex-1">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs">
                      ▶
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {l.title}
                    </p>
                  </div>

                  {l.purchased && (
                    <span className="text-sm text-green-600 font-medium whitespace-nowrap">
                      Purchased
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center py-4 border-t border-gray-400">
            <h3 className="text-sm sm:text-base font-semibold">Total</h3>
            <span className="text-lg sm:text-xl font-semibold text-blue-600">
              {currency}{displayTotal}
            </span>
          </div>

          {/* Pay */}
          <button
            onClick={handlePayment}
            disabled={paymentLoading}
            className="w-full mt-2 bg-blue-600 cursor-pointer text-white py-3 sm:py-4 rounded-xl text-base sm:text-lg font-medium hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {paymentLoading ? (
              <>
                <Loader size={18} className="text-white" />
                <span>Processing...</span>
              </>
            ) : (
              `Pay ${currency}${displayPrice}`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChoosePlanStandard