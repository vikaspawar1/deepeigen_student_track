


import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { selectIsAuthenticated, selectIsAdmin } from "../../../redux/slices/auth";
import api from "../../../lib/api";
import { getCourseVideo } from "../../courses/utils/courseVideos";



declare global {
  interface Window {
    Razorpay: new (options: any) => any;
  }
}

interface Course {
  id: number;
  title: string;
  meta_description: string;
  category: string;
  duration: number;
  level: string;
  course_type: string;
  indian_fee: number;
  foreign_fee: number;
  image: string;
}

interface CourseResponse {
  success: boolean;
  course: Course;
}

// const BASE_URL = ""; // Empty for proxy - requests go through Vite proxy to localhost:8000

export default function Payment() {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);
  const { id, slug } = useParams();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form state
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [installmentOption, setInstallmentOption] = useState("pay_once");
  const [country, setCountry] = useState("India");
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setIsCountryOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch course details
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await api.get(`/courses/${id}/${slug}`);
        const data: CourseResponse = res.data;
        setCourse(data.course);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      navigate(`/course-view/${id}/${slug}`, { replace: true });
      return;
    }

    fetchCourse();
  }, [id, slug]);

  // Calculate amounts
  const courseAmount = country.toLowerCase() === "india"
    ? course?.indian_fee || 0
    : course?.foreign_fee || 0;

  const installmentAmount = installmentOption === "pay_once"
    ? courseAmount
    : installmentOption === "pay_twice"
      ? courseAmount / 2
      : courseAmount / 3;
  console.log("isAuthenticated:", isAuthenticated);
  console.log("User in Redux:", useSelector((state: any) => state.auth.user));

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // console.log("isAuthenticated:", isAuthenticated);
    // console.log("User in Redux:", useSelector((state: any) => state.auth.user));

    if (!isAuthenticated) {
      toast.warning("Please login to purchase this course.");
      navigate("/login", { state: { from: `/buycourse/${id}/${slug}` } });
      return;
    }

    if (!address || !city || !state || !zipcode) {
      toast.warning("Please fill in all address fields");
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("address", address);
      formData.append("city", city);
      formData.append("state", state);
      formData.append("zipcode", zipcode);
      formData.append("installment_options", installmentOption);
      formData.append("country", country);  // Send country to backend for correct fee calculation

      const response = await api.post(
        `/courses/${id}/${slug}/place_order`,
        formData
      );

      const data = response.data;
      console.log("PLACE ORDER RESPONSE:", data);

      if (!data.success) {
        throw new Error(data.error || "Failed to place order");
      }

      // Initialize Razorpay
      if (data.razorpay && data.razorpay.id) {
        initializeRazorpay(data);
      } else {
        // Free course - already enrolled
        toast.success("Enrollment successful!");
        navigate("/user_dashboard");
      }

    } catch (error: any) {
      console.error("PLACE ORDER ERROR:", error);
      toast.error(error.response?.data?.error || error.message || "An error occurred while placing the order.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Initialize Razorpay payment
  const initializeRazorpay = (orderData: any) => {
    const options = {
      key: "rzp_test_SC3habFpUn2zel",  // TEST key for development
      amount: orderData.razorpay.amount,
      currency: orderData.razorpay.currency || "INR",
      name: "Deep Eigen AI Labs",
      description: `Course: ${course?.title}`,
      order_id: orderData.razorpay.id,
      handler: function (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) {
        console.log("Payment Success:", response);

        // Call payment done API
        handlePaymentSuccess(response, orderData.order.order_number);
      },
      prefill: {
        name: "",
        email: "",
        contact: "",
      },
      theme: {
        color: "#174CD2",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", function (response: any) {
      console.error("Payment Failed:", response);
      toast.error("Payment failed. Please try again.");
    });
    rzp.open();
  };

  // Handle payment success
  const handlePaymentSuccess = async (
    paymentResponse: any,
    orderNumber: string
  ) => {
    try {
      const formData = new FormData();
      formData.append("razorpay_payment_id", paymentResponse.razorpay_payment_id);
      formData.append("razorpay_order_id", paymentResponse.razorpay_order_id);
      formData.append("razorpay_signature", paymentResponse.razorpay_signature);

      const response = await api.post(
        `/courses/${id}/${slug}/payment_done/${orderNumber}`,
        formData
      );

      const data = response.data;
      console.log("PAYMENT DONE RESPONSE:", data);

      if (data.success) {
        toast.success("Payment successful! You are now enrolled.");
        navigate("/user_dashboard");
      } else {
        toast.error(data.message || "Payment verification failed");
      }
    } catch (error: any) {
      console.error("PAYMENT DONE ERROR:", error);
      toast.error("Payment completed but verification failed. Contact support.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 text-[15px]">
            Loading courses...
          </p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-red-600">Error</div>
          <p className="text-gray-500 mt-2">{error || "Course not found"}</p>
          <Link to="/courses" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  max-w-[100vw] sm:max-w-[82vw] md:max-w-[95vw] 
    lg:max-w-[82vw] mx-auto bg-white py-4 sm:py-8 px-2 sm:px-6">
      <div className="">
        {/* Back Link */}
        <Link
          to={`/courses/${id}/${slug}`}
          className="inline-flex font-semibold items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Courses
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Course Details */}
          <div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Details</h2>

              <div className="aspect-video rounded-lg overflow-hidden mb-4">
                <video
                  src={getCourseVideo(course.title)}
                  poster={`${api.defaults.baseURL}${course.image}`}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>

              <h3 className="text-lg font-bold mb-3 text-gray-900">{course.title}</h3>
              <p className="text-gray-600 mt-2 text-sm leading-relaxed">{course.meta_description}</p>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 mb-2">Duration</span>
                  <span className="font-medium">{course.duration} weeks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 mb-2">Level</span>
                  <span className="font-medium">{course.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category</span>
                  <span className="font-medium">{course.category}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Enrollment Form */}
          <div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Enrollment Details</h2>

              <form onSubmit={handleSubmit}>
                {/* Country Selection - Custom Dropdown */}
                <div className="mb-8" ref={countryRef}>
                  <label className="block text-md font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  {/* Trigger input */}
                  <button
                    type="button"
                    onClick={() => setIsCountryOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <span>
                      {country === "India" ? "India" : "Other Countries"}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isCountryOpen ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {/* Options list — opens below, inside page flow */}
                  {isCountryOpen && (
                    <div className="mt-1 w-full border border-gray-200 rounded-lg bg-white shadow-md overflow-hidden z-20">
                      <button
                        type="button"
                        onClick={() => { setCountry("India"); setIsCountryOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-blue-50 transition-colors ${
                          country === "India" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                        }`}
                      >
                        <span>India</span>
                        <span className="text-xs text-gray-500">₹{course.indian_fee}</span>
                      </button>
                      <div className="border-t border-gray-100" />
                      <button
                        type="button"
                        onClick={() => { setCountry("Other"); setIsCountryOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-blue-50 transition-colors ${
                          country === "Other" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                        }`}
                      >
                        <span> Other Countries</span>
                        <span className="text-xs text-gray-500">${course.foreign_fee}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Installment Options */}
                <div className="mb-4">
                  <label className="block text-md font-medium text-gray-700 mb-2">
                    Payment Options
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setInstallmentOption("pay_once")}
                      className={`py-2 px-3 text-md rounded-lg border transition-colors ${installmentOption === "pay_once"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                        }`}
                    >
                      Pay Once
                      <span className="block text-md opacity-75">₹{courseAmount.toLocaleString()}</span>
                    </button>



                    <button
                      type="button"
                      onClick={() => setInstallmentOption("pay_twice")}
                      className={`py-2 px-3 text-md rounded-lg border transition-colors ${installmentOption === "pay_twice"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                        }`}
                    >
                      2 Installments
                      <span className="block text-md opacity-75">₹{(courseAmount / 2).toLocaleString()}/mo</span>
                    </button>


                    <button
                      type="button"
                      onClick={() => setInstallmentOption("pay_thrice")}
                      className={`py-2 px-3 text-sm rounded-lg border transition-colors ${installmentOption === "pay_thrice"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                        }`}
                    >
                      3 Installments
                      <span className="block text-sm opacity-75">₹{(courseAmount / 3).toLocaleString()}/mo</span>
                    </button>


                  </div>
                </div>

                {/* Address Fields */}
                <div className="mb-4">
                  <label className="block text-md font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="State"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zipcode
                  </label>
                  <input
                    type="text"
                    value={zipcode}
                    onChange={(e) => setZipcode(e.target.value)}
                    placeholder="Enter zipcode"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Price Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Total Amount</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ₹{installmentAmount.toLocaleString()}
                    </span>
                  </div>
                  {installmentOption !== "pay_once" && (
                    <p className="text-sm text-gray-500 mt-1">
                      First installment of ₹{installmentAmount.toLocaleString()} due now
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 px-4 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    "Proceed to Payment"
                  )}
                </button>

                {!isAuthenticated && (
                  <p className="text-sm text-gray-500 text-center mt-4">
                    You will be asked to login before payment
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
