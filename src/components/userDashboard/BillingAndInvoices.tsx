import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../redux/slices/auth/index';
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css/pagination";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import { toast } from 'react-toastify';
import type {
  BillingData,
  Invoice,
  PaymentDueData,
  InvoiceRegistrantData,
  PurchasedCourse
} from './data/typesprofile';
import api from "../../lib/api";


interface BillingAndInvoicesProps {
  billingData?: BillingData;
}

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};



// Helper to format currency
const formatCurrency = (amount: number, currency: string = '$') => {
  return `${currency}${amount.toFixed(2)}`;
};




// Helper to get status indicator
const getStatusBadge = (status: 'paid' | 'pending' | 'failed' | undefined) => {
  const statusConfig = {
    paid: { label: '✓ Paid', color: 'bg-green-100 text-green-700' },
    pending: { label: '⏳ Pending', color: 'bg-yellow-100 text-yellow-700' },
    failed: { label: '✗ Failed', color: 'bg-red-100 text-red-700' },
  };
  const config = statusConfig[status || 'pending'];
  return config;
};




export default function BillingAndInvoices({ billingData }: BillingAndInvoicesProps) {
  const [basicModal, setBasicModal] = useState(false);
  const [customModal, setCustomModal] = useState(false);
  const [purchasedModal, setPurchasedModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [accessedCoursesModal, setAccessedCoursesModal] = useState(false);
  const [accessedCourses, setAccessedCourses] = useState<{ id: number; title: string; category: string }[]>([]);
  const [accessedCoursesLoading, setAccessedCoursesLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [invoiceCheckLoading, setInvoiceCheckLoading] = useState<number | null>(null);
  const [paymentDueData, setPaymentDueData] = useState<PaymentDueData[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<any>(null);
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceRegistrantData[]>([]);
  const [purchasedCourses, setPurchasedCourses] = useState<PurchasedCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const user = useSelector(selectUser);
  const isAdmin = user?.is_staff || user?.is_superadmin;



  const defaultBillingData: BillingData = {
    currentPlan: "Basic Plan",
    nextBillingDate: "2024-04-15",
    status: "active",
    invoices: []
  };
  const data = billingData || defaultBillingData;


  // Fetch data from backend APIs
  useEffect(() => {
    const fetchData = async () => {
      const invoiceListDataFromApi: InvoiceRegistrantData[] = [];
      let paymentDueJsonData: any[] = [];
      try {
        try {
          const paymentDueResponse = await api.get("/accounts/payment_due/");
          const paymentDueJson = paymentDueResponse.data;
          if (paymentDueJson.success) {
            setPaymentDueData(paymentDueJson.data || []);
            paymentDueJsonData = paymentDueJson.data;
          }
        } catch (err) {
          console.error('Error fetching payment due data:', err);
        }
        try {
          const invoiceResponse = await api.get("/accounts/invoice/");
          const invoiceJson = invoiceResponse.data;
          if (invoiceJson.success) {
            const fetchedInvoiceData = invoiceJson.data || [];
            setInvoiceData(fetchedInvoiceData);
            invoiceListDataFromApi.push(...fetchedInvoiceData);
          }
        } catch (err) {
          console.error('Error fetching invoice list:', err);
        }
        let mycoursesJsonFromApi: any = null;
        try {
          const mycoursesResponse = await api.get("/accounts/mycourses/");
          mycoursesJsonFromApi = mycoursesResponse.data;

          if (mycoursesJsonFromApi.success) {
            const coursesList = mycoursesJsonFromApi.courses?.courses_list || [];

            const transformedCourses = coursesList.map((course: any) => {
              const enrollmentData = invoiceListDataFromApi.find((inv: InvoiceRegistrantData) => inv.course_id === course.id);
              const paymentDueInfo = paymentDueJsonData?.find((pdue: PaymentDueData) => pdue.course_id === course.id);

              let coursePrice = course.price ?? 0;
              let courseCurrency = course.currency ?? '₹';

              if (coursePrice === 0 && !course.is_subscription) {
                if (paymentDueInfo) {
                  coursePrice = (paymentDueInfo.per_installment || 0) * (paymentDueInfo.no_of_installments || 1);
                  courseCurrency = paymentDueInfo.currency || '₹';
                } else {
                  coursePrice = enrollmentData?.amount || 0;
                  courseCurrency = enrollmentData?.currency || '₹';
                }
              }

              return {
                id: `course-${course.id}`,
                title: course.title,
                category: course.category || 'Course',
                url_link_name: course.url_link_name,
                purchaseDate: enrollmentData?.created_at || new Date().toISOString(),
                accessTill: enrollmentData?.end_at || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
                price: coursePrice,
                currency: courseCurrency,
                is_subscription: course.is_subscription
              };
            });

            let transformedPlaylists: any[] = [];
            try {
              const playlistsResponse = await api.get("/customplaylist/my-playlists/");
              if (playlistsResponse.data.success) {
                transformedPlaylists = (playlistsResponse.data.playlists || []).map((p: any) => {
                  const invoiceP = invoiceListDataFromApi.find(inv => inv.is_playlist && inv.playlist_id === p.id);
                  return {
                    id: `playlist-${p.id}`,
                    title: p.title,
                    category: 'Playlist',
                    url_link_name: '',
                    purchaseDate: p.created_at,
                    accessTill: invoiceP?.end_at || new Date(new Date(p.created_at).getTime() + 180 * 24 * 60 * 60 * 1000).toISOString(),
                    price: p.total_price,
                    currency: invoiceP?.currency || '₹',
                    is_playlist: true
                  };
                });
              }
            } catch (pErr) {
              console.error('Error fetching playlists:', pErr);
            }

            // Extract Subscription Plan purchases from invoice list
            const subscriptionPlans = invoiceListDataFromApi
              .filter(inv => inv.is_subscription)
              .map(inv => ({
                id: `sub-${inv.invoice_id}`,
                title: inv.course, // Plan name
                category: 'Subscription',
                url_link_name: '',
                purchaseDate: inv.created_at,
                accessTill: inv.end_at,
                price: inv.amount_paid,
                currency: inv.currency || '₹',
                is_sub_plan: true
              }));

            const allPurchased = [...transformedCourses, ...transformedPlaylists, ...subscriptionPlans].sort((a, b) =>
              new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
            );

            setPurchasedCourses(allPurchased);
            setLoadingCourses(false);
            return;
          }
        } catch (err) {
          console.error('Error fetching mycourses:', err);
        }

        // Fallback logic if mycourses failed or returned empty
        if (mycoursesJsonFromApi?.courses?.courses_list?.length > 0) {
          const coursesList = mycoursesJsonFromApi.courses.courses_list;
          const transformedCourses = coursesList.map((course: any) => {
            const paymentDueInfo = paymentDueJsonData?.find((pdue: PaymentDueData) => pdue.course_id === course.id);
            let coursePrice = 0;
            let courseCurrency = '$'; // Default to USD
            if (paymentDueInfo) {
              coursePrice = (paymentDueInfo.per_installment || 0) * (paymentDueInfo.no_of_installments || 1);
              courseCurrency = paymentDueInfo.currency || '$';
            }
            return {
              id: course.id,
              title: course.title,
              category: course.category || 'Course',
              url_link_name: course.url_link_name,
              purchaseDate: new Date().toISOString(),
              accessTill: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
              price: coursePrice,
              currency: courseCurrency
            };
          });
          console.log('Setting courses from fallback:', transformedCourses);
          setPurchasedCourses(transformedCourses);
          setLoadingCourses(false);
          return;
        }

        // Final fallback: use invoice data
        if (invoiceListDataFromApi.length > 0) {
          console.log('Using invoice data as fallback for courses');
          const seenCourseIds = new Set();
          const uniqueInvoiceData: InvoiceRegistrantData[] = [];

          invoiceListDataFromApi.forEach((inv: InvoiceRegistrantData) => {
            const key = inv.course_id || inv.course;
            if (key && !seenCourseIds.has(key)) {
              seenCourseIds.add(key);
              uniqueInvoiceData.push(inv);
            }
          });

          const coursesFromInvoices = uniqueInvoiceData.map((inv: InvoiceRegistrantData, index: number) => {
            const paymentDueInfo = paymentDueJsonData?.find((pdue: PaymentDueData) => pdue.course_id === inv.course_id);
            let coursePrice = 0;
            let courseCurrency = '$'; // Default to USD
            if (paymentDueInfo) {
              coursePrice = (paymentDueInfo.per_installment || 0) * (paymentDueInfo.no_of_installments || 1);
              courseCurrency = paymentDueInfo.currency || '$';
            } else {
              coursePrice = inv.amount || 0;
            }
            return {
              id: inv.course_id || index + 100,
              title: inv.course || `Course ${index + 1}`,
              category: 'Course',
              url_link_name: '',
              purchaseDate: inv.created_at || new Date().toISOString(),
              accessTill: inv.end_at || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
              price: coursePrice,
              currency: courseCurrency
            };
          });
          console.log('Courses from invoices (deduplicated):', coursesFromInvoices);
          setPurchasedCourses(coursesFromInvoices);
        }


      } catch (err) {
        console.error('Error fetching billing data:', err);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchData();
  }, []);


  // Body scroll lock when any modal is open
  useEffect(() => {
    const anyModalOpen = basicModal || customModal || purchasedModal || cancelModal || accessedCoursesModal;
    if (anyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [basicModal, customModal, purchasedModal, cancelModal, accessedCoursesModal]);


  // Fetch payment history when modal opens with a selected course
  useEffect(() => {
    const fetchPaymentHistory = async () => {
      if (!selectedCourseId || !purchasedModal) {
        return;
      }

      const selectedItem = purchasedCourses.find(c => c.id === selectedCourseId);
      const isPlaylist = (selectedItem as any)?.is_playlist;

      const idString = String(selectedCourseId);
      const realId = idString.includes('-') ? idString.split('-').pop() : idString;

      setPaymentHistoryLoading(true);
      try {
        const response = await api.get(`/accounts/payment_history/${realId}/`, {
          params: { is_playlist: isPlaylist }
        });
        const json = response.data;
        if (json.success) {
          setPaymentHistory(json.data);
        }
      } catch (err) {
        console.error('Error fetching payment history:', err);
        setPaymentHistory(null);
      } finally {
        setPaymentHistoryLoading(false);
      }
    };

    fetchPaymentHistory();
  }, [selectedCourseId, purchasedModal, purchasedCourses]);


  const getRemindersFromApi = () => {
    const reminders: Array<{
      title: string;
      course: string;
      due: string;
      amount: string;
      course_id: number;
      currency: string;
      installment_number: number;
      payment_amount: number;
    }> = [];

    paymentDueData.forEach((item) => {

      // Second installment reminder
      if (item.no_of_installments >= 0 && item.second_installment_due > 0) {
        reminders.push({
          title: "Payment reminder",
          course: item.course_title,
          due: item.second_installment_due_date ? formatDate(item.second_installment_due_date) : formatDate(new Date().toISOString()),
          amount: formatCurrency(item.second_installment_due, item.currency),
          course_id: item.course_id,
          currency: item.currency,
          installment_number: 2,
          payment_amount: item.second_installment_due,
        });
      }

      // Third installment reminder
      if (item.no_of_installments === 3 && item.third_installment_due > 0) {
        reminders.push({
          title: "Payment reminder",
          course: item.course_title,
          due: item.third_installment_due_date ? formatDate(item.third_installment_due_date) : formatDate(new Date().toISOString()),
          amount: formatCurrency(item.third_installment_due, item.currency),
          course_id: item.course_id,
          currency: item.currency,
          installment_number: 3,
          payment_amount: item.third_installment_due,
        });
      }

    });

    return reminders;
  };


  const remindersFromApi = getRemindersFromApi();
  const displayReminders = remindersFromApi;
  const hasPurchasedCourses = purchasedCourses.length > 0;
  const hasDueInstallments = displayReminders.length > 0;
  const isLoading = loadingCourses;


  // Convert API invoice data to component format
  const getInvoiceItems = (): Invoice[] => {
    if (invoiceData.length > 0) {
      return invoiceData.map((inv, index) => {
        let prefix = 'inv';
        if (inv.is_playlist) prefix = 'playlist-inv';
        if (inv.is_subscription) prefix = 'sub-inv';

        return {
          id: `${prefix}-${inv.invoice_id || index + 1}`,
          date: inv.created_at || new Date().toISOString(),
          amount: inv.amount_paid
            ? `${inv.currency || '$'}${Number(inv.amount_paid).toFixed(2)}`
            : "$0.00",
          status: (inv.status || 'pending') as 'paid' | 'pending' | 'failed',
          downloadUrl: inv.download_url || `/accounts/invoice/${inv.order_id}/${inv.invoice_id}/None`,
          // New Phase 2 fields
          currency: inv.currency || '$',
          currency_code: inv.currency_code || 'USD',
          payment_method: inv.payment_method,
          installment_number: inv.installment_number,
          no_of_installments: inv.no_of_installments,
          course: inv.course,
          course_amount: inv.course_amount,
          amount_paid: inv.amount_paid,
          total_amount: inv.total_amount,
        };
      });
    }
    return data.invoices;
  };
  const invoices = getInvoiceItems();

  // Generate payment history from API data
  const getBasicInstallments = () => {
    if (paymentDueData.length > 0) {
      const installments: Array<{
        id: number;
        paid: string;
        status: "Paid" | "Pending" | "Due";
      }> = [];

      paymentDueData.forEach((item, index) => {
        installments.push({
          id: index + 1,
          paid: formatCurrency(item.second_installment_paid || 0),
          status: item.second_installment_paid > 0 ? "Paid" : "Due"
        });
      });

      return installments;
    }

    return [];
  };

  const basicInstallments = getBasicInstallments();
  const customInstallments: any[] = [];


  const getPlanDetails = () => {
    if (data.currentPlan.includes("Basic")) {
      return {
        name: "Basic Plan",
        price: "$15/Month",
        expires: "21 July 2026",
        description: "Basic Plan"
      };
    } else if (data.currentPlan.includes("Pro")) {
      return {
        name: "Pro Monthly",
        price: "$29/Month",
        expires: formatDate(data.nextBillingDate),
        description: data.currentPlan
      };
    } else {
      return {
        name: data.currentPlan,
        price: "$25/Month",
        expires: formatDate(data.nextBillingDate),
        description: data.currentPlan
      };
    }
  };

  const planDetails = getPlanDetails();

  // Fetch accessed courses when modal opens
  useEffect(() => {
    if (!accessedCoursesModal) return;
    const fetchAccessedCourses = async () => {
      setAccessedCoursesLoading(true);
      try {
        const response = await api.get('/subscriptions/accessed-courses/');
        if (response.data.success) {
          setAccessedCourses(response.data.courses || []);
        } else {
          setAccessedCourses([]);
        }
      } catch (err) {
        console.error('Error fetching accessed courses:', err);
        setAccessedCourses([]);
      } finally {
        setAccessedCoursesLoading(false);
      }
    };
    fetchAccessedCourses();
  }, [accessedCoursesModal]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (basicModal || customModal || purchasedModal || cancelModal || accessedCoursesModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [basicModal, customModal, purchasedModal, cancelModal, accessedCoursesModal]);


  // Handle download invoice
  const handleDownloadInvoice = async (invoice: Invoice) => {
    console.log("Invoice object:", invoice);
    console.log("Download URL:", invoice.downloadUrl);

    try {
      const matchedInvoice = invoiceData.find(inv => inv.invoice_id === parseInt(invoice.id));
      if (matchedInvoice?.order_id) {
        setInvoiceCheckLoading(matchedInvoice.order_id);

        const statusResponse = await api.get(`/accounts/invoice/status/${matchedInvoice.order_id}/`);
        const statusData = statusResponse.data;
        setInvoiceCheckLoading(null);

        if (!statusData.success) {
          toast.error(`${statusData.message}`);
          return;
        }

        if (!statusData.can_download) {
          const reasons = {
            'pending_payment': '⏳ Payment is still pending. Please complete the payment first.',
            'order_incomplete': '⏳ Order is not yet complete. Please try again later.',
          };
          toast.warning(`Cannot download invoice: ${reasons[statusData.invoice_status as keyof typeof reasons] || 'Unknown reason'}`);
          return;
        }
      }

      const fullUrl = invoice.downloadUrl.startsWith('http')
        ? invoice.downloadUrl
        : `${api.defaults.baseURL}${invoice.downloadUrl}`;

      // Fetch the PDF from backend
      const response = await api.get(fullUrl, {
        responseType: 'blob'
      });

      // Get the blob from response
      const blob = response.data;

      // Create a temporary download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${invoice.id}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('Invoice downloaded:', invoice.id);
    } catch (error) {
      console.error(' Download failed:', error);
      toast.error(`Failed to download invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle payment for installment
  const handlePaymentClick = async (reminder: any) => {
    setPaymentLoading(true);
    try {
      const response = await api.post('/courses/payment/', {
        course_id: reminder.course_id,
        installment_number: reminder.installment_number,
        amount: reminder.payment_amount,
        currency: reminder.currency,
      });

      const data = response.data;

      if (data.success) {
        // If we have Razorpay order details, open payment gateway
        if (data.data?.razorpay_order_id) {
          // Launch Razorpay payment window
          const options = {
            key: data.data.razorpay_key,
            amount: data.data.amount,
            currency: data.data.currency,
            name: 'DeepEigen Courses',
            description: `Installment ${reminder.installment_number} - ${reminder.course}`,
            order_id: data.data.razorpay_order_id,
            prefill: {
              name: data.data.customer_name,
              email: data.data.customer_email,
            },
            handler: async function (razorpayResponse: any) {
              // Payment successful - now verify with backend
              try {
                // Verification with backend
                const verifyResponse = await api.post('/courses/payment_verify/', {
                  payment_id: razorpayResponse.razorpay_payment_id,
                  order_id: razorpayResponse.razorpay_order_id,
                  signature: razorpayResponse.razorpay_signature,
                  course_id: data.data.course_id,
                  installment_number: data.data.installment_number,
                  amount: data.data.amount / 100, // Convert back from paise/cents
                });

                const verifyData = verifyResponse.data;

                if (verifyData.success) {
                  toast.success(`Payment verified! Installment ${data.data.installment_number} marked as paid.`);
                  // Refresh payment due data
                  window.location.reload();
                } else {
                  toast.error(` Payment received but verification failed: ${verifyData.message}`);
                }
              } catch (err) {
                console.error('Verification error:', err);
                toast.error(` Payment completed but verification failed. Please contact support.`);
              }
            },
            modal: {
              ondismiss: function () {
                toast.info('Payment cancelled by user');
              }
            }
          };

          // Create Razorpay instance and open
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } else {
          toast.success(`Payment processed for ${reminder.amount}`);
          window.location.reload();
        }
      } else {
        toast.error(`Payment failed: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error(`Error processing payment: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setPaymentLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#174cd2] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full sm:mt-12 md:mt-0 mb-10 sm:max-w-[78vw] md:max-w-[95vw] lg:max-w-[71vw] sm:gap-6 lg:gap-8 py-8 sm:py-10 lg:py-12 flex-1 overflow-x-hidden tablet-center">
      <style>{`@media (min-width: 768px) and (max-width: 1023px) { .tablet-center { margin-left: auto; margin-right: auto; } }`}</style>

      <div className="w-full mt-[-8vw] sm:mt-[-2vw]">
        <div className="w-full">

          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <span className="text-gray-500">Loading...</span>
            </div>
          )}

          {!isLoading && !hasPurchasedCourses && (
            <div className="hidden">
            </div>
          )}

          {!isLoading && hasPurchasedCourses && hasDueInstallments && !isAdmin && (
            <Swiper
              modules={[Pagination, Autoplay]}
              autoplay={{
                delay: 2000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              pagination={{
                clickable: true,
                dynamicBullets: true,
              }}
              spaceBetween={12}
              slidesPerView={1}
              className="w-full mx-auto"
            >
              {displayReminders.map((item, i) => (
                <SwiperSlide key={i}>
                  <div className="flex justify-center px-2 sm:px-2">
                    <div className="bg-[#ffd06c] p-4 sm:p-5 md:p-6 rounded-xl w-full ">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-3 sm:gap-4 lg:gap-6">
                        {/* Left Section */}
                        <div className="flex-1 min-w-0">
                          <h2 className="text-[#1a212f] font-bricolage text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3">
                            {item.title}
                          </h2>
                          <div className="pb-2 sm:pb-3">
                            <p className="text-[rgba(26,33,47,0.7)] text-xs sm:text-sm md:text-base leading-relaxed">
                              Your course: <span className="font-semibold">{item.course}</span> payment is due. Please complete the payment to continue uninterrupted access to courses and learning tools.
                            </p>
                          </div>
                        </div>

                        {/* Right Section */}
                        <div className="flex flex-col items-start lg:items-end gap-3 sm:gap-3 w-full lg:w-auto">
                          <button
                            onClick={() => handlePaymentClick(item)}
                            disabled={paymentLoading}
                            className="bg-[#174cd2] text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base w-full lg:w-auto hover:bg-[#1546c0] transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {paymentLoading ? 'Processing...' : `Pay ${item.amount}`}
                          </button>
                          <p className="text-[rgba(26,33,47,0.7)] text-xs sm:text-sm lg:text-sm whitespace-nowrap">
                            Due on {item.due}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}

          {/* CONDITION 4: Has courses + all installments paid → Show Thank You message */}
          {!isLoading && hasPurchasedCourses && !hasDueInstallments && !isAdmin && (
            <div className="w-full">
              <div className="bg-[#d4f8e8] p-4 sm:p-5 md:p-6 rounded-xl w-full">
                <div className="flex flex-col items-center text-center gap-2">
                  <h2 className="text-[#065f46] font-bricolage text-lg sm:text-xl md:text-2xl font-bold">
                    Thank You!
                  </h2>
                  <p className="text-[rgba(6,95,70,0.8)] text-sm sm:text-base">
                    All your payments are completed successfully. Keep learning and growing!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Custom Swiper Pagination Styles */}
          <style>{`
            .swiper-pagination {
              position: relative !important;
              margin-top: 12px !important;
              bottom: 0 !important;
            }
            .swiper-pagination-bullet {
              width: 8px !important;
              height: 8px !important;
              margin: 0 4px !important;
              background-color: #D1D5DB !important;
              opacity: 1 !important;
            }
            .swiper-pagination-bullet-active {
              width: 24px !important;
              border-radius: 4px !important;
              background-color: #174cd2 !important;
            }
            @media (min-width: 640px) {
              .swiper-pagination-bullet {
                width: 10px !important;
                height: 10px !important;
              }
              .swiper-pagination-bullet-active {
                width: 32px !important;
              }
            }
          `}</style>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col justify-center items-start gap-4 sm:gap-5 lg:gap-6 self-stretch w-full">
        {/* Subscription Plan */}
        {/* <div className="flex flex-col items-start gap-2 sm:gap-3 self-stretch w-full">
          <h3 className="text-[rgba(26,33,47,0.7)] font-bricolage text-sm sm:text-base lg:text-base font-semibold tracking-[-0.14px] sm:tracking-[-0.16px] lg:tracking-[-0.16px]">
            Subscription plan
          </h3>
          <div className="flex flex-col justify-center items-start gap-3 sm:gap-4 self-stretch rounded-lg sm:rounded-xl px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 bg-gradient-to-r from-[#E5F4FF] to-[#F8FBFF] w-full">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center self-stretch gap-3 sm:gap-0 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 flex-1">
                <span className="text-[#1A212F] font-bricolage text-base sm:text-lg lg:text-lg font-normal">
                  {planDetails.name}
                </span>
                <span className="text-[#174CD2] font-bricolage text-sm sm:text-base lg:text-base font-semibold tracking-[-0.14px] sm:tracking-[-0.16px] lg:tracking-[-0.16px]">
                  {planDetails.price}
                </span>
              </div>


              <Link to="/payment" className="flex px-3 sm:px-4 py-2 cursor-pointer justify-center items-center gap-2 rounded-[90px] border border-[#174CD2] text-[#174CD2] font-bricolage text-xs sm:text-sm lg:text-sm font-semibold leading-[93%] w-full sm:w-auto hover:bg-blue-50 transition-colors whitespace-nowrap">
                {data.status === 'active' ? 'Upgrade' : 'Subscribe'}
              </Link>

            </div>
            <div className="h-px self-stretch bg-[rgba(0,0,0,0.08)] w-full" />
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center self-stretch gap-2 sm:gap-0 w-full">
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M8.0026 1.83325C6.3671 1.83325 4.79859 2.48295 3.64211 3.63943C2.48564 4.7959 1.83594 6.36442 1.83594 7.99992C1.83594 9.63542 2.48564 11.2039 3.64211 12.3604C4.79859 13.5169 6.3671 14.1666 8.0026 14.1666C9.63811 14.1666 11.2066 13.5169 12.3631 12.3604C13.5196 11.2039 14.1693 9.63542 14.1693 7.99992C14.1693 6.36442 13.5196 4.7959 12.3631 3.63943C11.2066 2.48295 9.63811 1.83325 8.0026 1.83325ZM0.835938 7.99992C0.835938 4.04192 4.0446 0.833252 8.0026 0.833252C11.9606 0.833252 15.1693 4.04192 15.1693 7.99992C15.1693 11.9579 11.9606 15.1666 8.0026 15.1666C4.0446 15.1666 0.835938 11.9579 0.835938 7.99992ZM8.0026 4.83325C8.13521 4.83325 8.26239 4.88593 8.35616 4.9797C8.44993 5.07347 8.5026 5.20064 8.5026 5.33325V7.79325L10.0226 9.31325C10.0717 9.35903 10.1111 9.41423 10.1385 9.47556C10.1658 9.53689 10.1805 9.6031 10.1817 9.67024C10.1828 9.73737 10.1705 9.80406 10.1454 9.86632C10.1202 9.92858 10.0828 9.98513 10.0353 10.0326C9.98782 10.0801 9.93126 10.1175 9.869 10.1427C9.80674 10.1678 9.74006 10.1802 9.67292 10.179C9.60579 10.1778 9.53958 10.1631 9.47825 10.1084C9.41691 10.1084 9.36171 10.069 9.31594 10.0199L7.64927 8.35325C7.55548 8.25957 7.50272 8.13248 7.5026 7.99992V5.33325C7.5026 5.20064 7.55528 5.07347 7.64905 4.9797C7.74282 4.88593 7.87 4.83325 8.0026 4.83325Z" fill="#1A212F" fillOpacity="0.7" />
                </svg>
                <span className="text-[rgba(26,33,47,0.7)] font-bricolage text-xs lg:text-sm font-light leading-[150%] truncate">
                  Expires on {planDetails.expires}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 lg:gap-4 flex-wrap mt-2 sm:mt-0">
                <button
                  onClick={() => setBasicModal(true)}
                  className="text-[rgba(26,33,47,0.7)] cursor-pointer font-bricolage text-xs lg:text-sm font-semibold tracking-[-0.12px] sm:tracking-[-0.14px] lg:tracking-[-0.14px] underline text-left hover:text-[#1A212F] whitespace-nowrap"
                >
                  View Payment History
                </button>
                <Link to="/courses" className="text-[rgba(26,33,47,0.7)] cursor-pointer font-bricolage text-xs lg:text-sm font-semibold tracking-[-0.12px] sm:tracking-[-0.14px] lg:tracking-[-0.14px] underline text-left hover:text-[#1A212F] whitespace-nowrap">
                  View Courses
                </Link>


                <button
                  onClick={() => setCancelModal(true)}
                  className="text-[#CE2823] cursor-pointer font-bricolage text-xs lg:text-sm font-semibold tracking-[-0.12px] sm:tracking-[-0.14px] lg:tracking-[-0.14px] text-left hover:text-red-700 whitespace-nowrap"
                >
                  {data.status === 'active' ? 'Cancel Subscription' : 'Reactivate'}
                </button>


              </div>
            </div>
          </div>
        </div> */}



        {/* Purchase History */}
        <div className="flex flex-col items-start gap-2 sm:gap-3 self-stretch mb-4 w-full">
          <h3 className="text-[rgba(3, 4, 6, 0.7)] font-bricolage text-2xl sm:text-base lg:text-base font-semibold tracking-[-0.14px] sm:tracking-[-0.16px] lg:tracking-[-0.16px]">
            Purchase History
          </h3>
          <div className="flex flex-col justify-center items-start gap-3 sm:gap-4 self-stretch rounded-lg sm:rounded-xl px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 
          bg-gradient-to-r from-[#E5F4FF] to-[#F8FBFF] w-full">
            {loadingCourses ? (
              <div className="w-full flex justify-center items-center py-8">
                <span className="text-[rgba(26,33,47,0.7)] font-bricolage text-sm">Loading history...</span>
              </div>
            ) : isAdmin ? (
              <div className="w-full flex flex-col items-center justify-center py-10 px-6 text-center bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#174cd2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M12 8v4" />
                    <path d="M12 16h.01" />
                  </svg>
                </div>
                <h4 className="text-[#1A212F] font-bricolage text-xl font-bold mb-2">Lifetime Admin Access</h4>
                <p className="text-[rgba(26,33,47,0.7)] font-bricolage text-sm max-w-md leading-relaxed">
                  You have full administrative access to all current and future courses on the platform. No purchase history to display.
                </p>
              </div>
            ) : purchasedCourses.filter(p => p.is_playlist || p.is_sub_plan || !p.is_subscription).length > 0 ? (
              purchasedCourses.filter(p => p.is_playlist || p.is_sub_plan || !p.is_subscription).map((item, index, filteredArray) => (
                <div key={item.id} className="w-full rounded-lg   p-4 ">
                  <div className="flex flex-col gap-4 sm:gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 w-full">
                      <div className="flex items-start gap-3 flex-1 min-w-0">


                        <div className="flex px-3 py-3 justify-center items-center rounded-md bg-gradient-to-b from-[#000155] to-[#153F9A] w-14 sm:w-16 lg:w-20 h-14 sm:h-16
                         flex-shrink-0 overflow-hidden">
                          <span className="text-white font-bricolage text-[10px] sm:text-[11px] lg:text-xs font-bold leading-tight text-center break-words">
                            {item.category === 'Subscription' ? 'Subscription' : (item.category.split(' ')[0] || 'Item')}
                          </span>
                        </div>




                        <div className="flex flex-col justify-center items-start gap-2 flex-1 min-w-0">
                          <h4 className="text-[#1A212F] font-bricolage text-sm sm:text-base lg:text-base font-semibold line-clamp-2">
                            {item.title}
                          </h4>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap text-[rgba(26,33,47,0.7)] text-xs lg:text-xs font-light leading-[150%]">
                            <span className="whitespace-nowrap">Purchased on {formatDate(item.purchaseDate)}</span>
                            {!item.is_sub_plan && (
                              <>
                                <span className="hidden sm:inline-block w-px h-3 bg-[rgba(26,33,47,0.24)]" />
                                <span className="whitespace-nowrap">Access till {formatDate(item.accessTill)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-start sm:items-end justify-center gap-2 min-w-[120px] sm:min-w-[150px]">
                        <span className="text-[#1A212F] font-bricolage text-base sm:text-lg font-bold whitespace-nowrap text-right">
                          {item.price ? `${item.currency || '₹'}${item.price.toFixed(2)}` : `${item.currency || '₹'}0`}
                        </span>
                        {!item.is_sub_plan ? (
                          <button
                            onClick={() => {
                              setSelectedCourseId(item.id);
                              setPurchasedModal(true);
                            }}
                            className="text-[#174CD2] font-bricolage text-xs lg:text-xs font-semibold underline hover:text-[#0f3ead] whitespace-nowrap text-right"
                          >
                            View Payment History
                          </button>
                        ) : (
                          item.is_sub_plan && (
                            <button
                              onClick={() => {
                                setAccessedCoursesModal(true);
                              }}
                              className="text-[#174CD2] font-bricolage cursor-pointer text-xs lg:text-xs font-semibold underline hover:text-[#0f3ead] whitespace-nowrap text-right"
                            >
                              View Accessed Courses
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                  {index < filteredArray.length - 1 && (
                    <div className="h-px bg-[rgba(26,33,47,0.08)] my-4" />
                  )}
                </div>
              ))
            ) : (
              <div className="w-[80vw] flex justify-center items-center py-8">
                <span className="text-[rgba(26,33,47,0.7)] font-bricolage text-sm">No purchase history found</span>
              </div>
            )}
          </div>
        </div>







        {/* Invoices */}
        <div className="flex flex-col gap-3 sm:gap-4 w-full">
          <h3 className="text-[rgba(0, 0, 0, 0.7)] font-bricolage text-xl sm:text-base font-semibold tracking-[-0.14px] sm:tracking-[-0.16px]">
            Invoices
          </h3>

          {isAdmin ? (
            <div className="w-full p-6 bg-blue-50 border border-blue-100 rounded-xl text-center">
              <p className="text-blue-700 font-medium">
                No invoices are generated for Administrative Access.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop and Tablet */}
              <div className="hidden md:block w-full overflow-x-auto rounded-xl border border-[rgba(26,33,47,0.1)] bg-white">
                <div className="min-w-[550px]">

                  {/* Header */}
                  <div className="grid grid-cols-[2fr_minmax(80px,1fr)_minmax(80px,1fr)_minmax(100px,1fr)_minmax(80px,1fr)_minmax(60px,0.5fr)] gap-4 px-5 lg:px-6 py-4 border-b border-[rgba(26,33,47,0.1)] bg-gray-50 items-center">
                    <span className="text-xs lg:text-sm font-semibold text-[#1A212F] uppercase tracking-wider">Course / Invoice</span>
                    <span className="text-xs lg:text-sm font-semibold text-[#1A212F] uppercase tracking-wider">Amount</span>
                    <span className="text-xs lg:text-sm font-semibold text-[#1A212F] uppercase tracking-wider">Status</span>
                    <span className="text-xs lg:text-sm font-semibold text-[#1A212F] uppercase tracking-wider">Date</span>
                    <span className="text-xs lg:text-sm font-semibold text-[#1A212F] uppercase tracking-wider">Installment</span>
                    <span className="text-xs lg:text-sm font-semibold text-[#1A212F] uppercase tracking-wider text-center">Action</span>
                  </div>

                  {/* Rows */}
                  <div className="flex flex-col">
                    {invoices.length > 0 ? invoices.map((invoice, index) => {
                      const statusBadge = getStatusBadge(invoice.status);
                      const isLoading = invoiceCheckLoading === parseInt(invoice.id);
                      return (
                        <div
                          key={invoice.id}
                          className={`grid grid-cols-[2fr_minmax(80px,1fr)_minmax(80px,1fr)_minmax(100px,1fr)_minmax(80px,1fr)_minmax(60px,0.5fr)] gap-4 px-5 lg:px-6 py-4 items-center hover:bg-[#F8FBFF] transition-colors ${index !== invoices.length - 1 ? 'border-b border-[rgba(26,33,47,0.06)]' : ''}`}
                        >
                          <div className="flex flex-col gap-1.5 overflow-hidden">
                            <span className="text-sm font-semibold text-[#1A212F] truncate">
                              {invoice.id}
                            </span>
                            {invoice.course && (
                              <span className="text-xs font-semibold text-[rgba(26,33,47,0.6)] truncate" title={invoice.course}>
                                {invoice.course}
                              </span>
                            )}
                          </div>

                          <span className="text-sm font-medium text-[#1A212F] truncate">
                            {invoice.amount}
                          </span>

                          <div>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md inline-flex items-center justify-center ${statusBadge.color}`}>
                              {statusBadge.label}
                            </span>
                          </div>

                          <span className="text-sm font-medium text-[rgba(26,33,47,0.8)] truncate">
                            {formatDate(invoice.date)}
                          </span>

                          <span className="text-sm  font-medium text-[rgba(26,33,47,0.8)] truncate">
                            {invoice.installment_number ? `${invoice.installment_number}/${invoice.no_of_installments || 1}` : '1/1'}
                          </span>

                          <div className="flex justify-center">
                            <button
                              onClick={() => handleDownloadInvoice(invoice)}
                              disabled={isLoading}
                              className="p-1.5 rounded-md hover:bg-[#E5F4FF] text-[#174CD2] cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                              title={isLoading ? 'Checking invoice status...' : 'Download invoice'}
                            >
                              {isLoading ? (
                                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25"></circle>
                                  <path d="M12 2a10 10 0 0 1 0 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
                                </svg>
                              ) : (
                                <svg
                                  className="w-5 h-5 group-hover:scale-110 transition-transform"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M12 4v11m0 0l-3.5-3.5M12 15l3.5-3.5M6 19h12"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="py-8 text-center text-sm text-[rgba(26,33,47,0.6)]">
                        No invoices found.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile */}
              <div className="md:hidden flex flex-col w-full">
                {invoices.length > 0 ? invoices.map((invoice) => {
                  const statusBadge = getStatusBadge(invoice.status);
                  const isLoading = invoiceCheckLoading === parseInt(invoice.id);
                  return (
                    <div key={invoice.id} className="flex flex-col px-1">
                      <div className="py-4 hover:bg-gray-50 transition-colors">

                        {/* Top Row: Title + Download */}
                        <div className="flex justify-between items-start gap-3 w-full mb-3">
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#1A212F] truncate">
                              {invoice.id}
                            </p>
                            {invoice.course && (
                              <p className="text-xs text-[rgba(26,33,47,0.6)] line-clamp-2">
                                {invoice.course}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => handleDownloadInvoice(invoice)}
                            disabled={isLoading}
                            className="p-2 shrink-0 bg-[#F8FBFF] hover:bg-[#E5F4FF] text-[#174CD2] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isLoading ? (
                              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25"></circle>
                                <path d="M12 2a10 10 0 0 1 0 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
                              </svg>
                            ) : (
                              <svg
                                className="w-4 h-4"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <path
                                  d="M12 4v11m0 0l-3.5-3.5M12 15l3.5-3.5M6 19h12"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </button>
                        </div>

                        {/* Middle Row: Status + Installment */}
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md inline-block ${statusBadge.color}`}>
                            {statusBadge.label}
                          </span>
                          {invoice.installment_number && (
                            <span className="text-xs font-medium text-[rgba(26,33,47,0.7)] bg-gray-100 px-2 py-1 rounded-md">
                              Inst. {invoice.installment_number}/{invoice.no_of_installments || 1}
                            </span>
                          )}
                        </div>

                        {/* Bottom Row: Date and Amount */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 text-[rgba(26,33,47,0.7)]">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span className="font-medium">{formatDate(invoice.date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[rgba(26,33,47,0.6)]">Amount:</span>
                            <span className="font-bold text-[#1A212F] text-sm">{invoice.amount}</span>
                          </div>
                        </div>

                      </div>
                      {/* Gray 300 line mark after each invoice */}
                      <div className="w-full h-[1px] bg-gray-300" />
                    </div>
                  );
                }) : (
                  <div className="py-6 text-center text-sm text-[rgba(26,33,47,0.6)]">
                    No invoices found.
                  </div>
                )}
              </div>
            </>
          )}
        </div>




      </div>

      {/* Modal Overlay */}
      {(basicModal || customModal || purchasedModal || cancelModal || accessedCoursesModal) && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] transition-all duration-300"
          onClick={() => {
            setBasicModal(false);
            setCustomModal(false);
            setPurchasedModal(false);
            setCancelModal(false);
            setAccessedCoursesModal(false);
          }}
        />
      )}

      {/* Basic Plan Modal */}
      {basicModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[101] px-2 sm:px-4 overflow-y-auto py-4">
          <div
            className="bg-white rounded-xl sm:rounded-2xl shadow-xl relative 
                        w-full max-w-[95%] xs:max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl
                        max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 my-auto"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              onClick={() => setBasicModal(false)}
              className="absolute top-2 right-3 sm:top-3 sm:right-4 text-xl sm:text-2xl md:text-3xl text-gray-500 hover:text-gray-700 cursor-pointer z-10"
            >
              &times;
            </button>

            <h2 className="text-center text-lg sm:text-xl md:text-2xl lg:text-3xl mt-4 sm:mt-5 font-semibold text-gray-900">
              {planDetails.name}
            </h2>

            <p className="text-center text-gray-500 mt-1 sm:mt-2 mb-4 sm:mb-5 text-sm sm:text-base md:text-lg lg:text-xl">
              Monthly Subscription
            </p>

            <div className="overflow-x-auto -mx-1 sm:-mx-0">
              <table className="w-full text-xs sm:text-sm md:text-base text-left text-gray-700 min-w-[280px]">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="py-2 sm:py-3 px-2 sm:px-3 font-medium whitespace-nowrap">Month</th>
                    <th className="py-2 sm:py-3 px-2 sm:px-3 font-medium whitespace-nowrap">Amount</th>
                    <th className="py-2 sm:py-3 px-2 sm:px-3 font-medium whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {basicInstallments.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 sm:py-3 px-2 sm:px-3 whitespace-nowrap">Month {item.id}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3 whitespace-nowrap">{item.paid}</td>
                      <td
                        className={`py-2 sm:py-3 px-2 sm:px-3 font-medium whitespace-nowrap ${item.status === "Paid" ? "text-green-600" : "text-gray-500"
                          }`}
                      >
                        {item.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 sm:mt-5 text-center">
              <button
                onClick={() => setBasicModal(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 sm:py-2.5 md:py-3 px-4 sm:px-5 md:px-6 rounded-lg text-sm sm:text-base md:text-lg w-full sm:w-auto transition-colors whitespace-nowrap"
              >
                Okay, Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Plan Modal */}
      {customModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[101] px-2 sm:px-4 overflow-y-auto py-4">
          <div
            className="bg-white rounded-xl sm:rounded-2xl shadow-xl relative 
                        w-full max-w-[95%] xs:max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl
                        max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 my-auto"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              onClick={() => setCustomModal(false)}
              className="absolute top-2 right-3 sm:top-3 sm:right-4 text-xl sm:text-2xl md:text-3xl text-gray-500 hover:text-gray-700 cursor-pointer z-10"
            >
              &times;
            </button>

            <h2 className="text-center text-lg sm:text-xl md:text-2xl lg:text-3xl mt-4 sm:mt-5 font-semibold text-gray-900">
              Custom plan
            </h2>

            <p className="text-center text-gray-500 mt-1 sm:mt-2 mb-4 sm:mb-5 text-sm sm:text-base md:text-lg lg:text-xl">
              Yearly Subscription
            </p>

            <div className="overflow-x-auto -mx-1 sm:-mx-0">
              <table className="w-full text-xs sm:text-sm md:text-base text-left text-gray-700 min-w-[280px]">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="py-2 sm:py-3 px-2 sm:px-3 font-medium whitespace-nowrap">Installment</th>
                    <th className="py-2 sm:py-3 px-2 sm:px-3 font-medium whitespace-nowrap">Amount</th>
                    <th className="py-2 sm:py-3 px-2 sm:px-3 font-medium whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customInstallments.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 sm:py-3 px-2 sm:px-3 whitespace-nowrap">Installment {item.id}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3 whitespace-nowrap">{item.paid}</td>
                      <td
                        className={`py-2 sm:py-3 px-2 sm:px-3 font-medium whitespace-nowrap ${item.status === "Paid" ? "text-green-600" : "text-gray-500"
                          }`}
                      >
                        {item.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 sm:mt-5 text-center">
              <button
                onClick={() => setCustomModal(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 sm:py-2.5 md:py-3 px-4 sm:px-5 md:px-6 rounded-lg text-sm sm:text-base md:text-lg w-full sm:w-auto transition-colors whitespace-nowrap"
              >
                Okay, Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purchased Course Modal */}
      {purchasedModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[101] px-2 sm:px-4 overflow-y-auto py-4">
          <div
            className="bg-white rounded-xl sm:rounded-2xl shadow-xl relative 
                        w-full max-w-[95%] xs:max-w-xs sm:max-w-md md:max-w-lg
                        max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-4 md:p-6 my-auto"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              onClick={() => setPurchasedModal(false)}
              className="absolute top-2 right-3 sm:top-3 sm:right-4 text-xl sm:text-2xl text-gray-500 hover:text-gray-700 cursor-pointer z-10"
            >
              &times;
            </button>

            {paymentHistoryLoading ? (
              <div className="flex items-center justify-center py-8">
                <span className="text-gray-500 text-sm">Loading payment history...</span>
              </div>
            ) : paymentHistory ? (
              <>
                <h2 className="text-center text-lg sm:text-xl md:text-2xl mt-3 sm:mt-4 font-semibold text-gray-900">
                  Payment History
                </h2>

                <p className="text-center text-gray-500 mt-1 mb-3 sm:mb-4 text-sm sm:text-base md:text-lg px-2">
                  {paymentHistory.course_name}
                </p>

                <div className="bg-gradient-to-r from-[#E5F4FF] to-[#F8FBFF] rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 mb-3 sm:mb-4 md:mb-5">
                  <div className="flex flex-col xs:flex-row xs:items-center gap-1.5 xs:gap-2 sm:gap-3 md:gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">Course Fee:</span>
                      <span className="text-xs sm:text-sm font-semibold">{paymentHistory.currency}{paymentHistory.total_fee?.toFixed(2)}</span>
                    </div>
                    <div className="hidden xs:block w-px h-3 sm:h-4 bg-gray-300"></div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">Installments:</span>
                      <span className="text-xs sm:text-sm">{paymentHistory.no_of_installments}</span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto -mx-1 sm:-mx-0">
                  <table className="w-full text-xs sm:text-sm md:text-base text-left text-gray-700 min-w-[280px]">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500">
                        <th className="py-2 sm:py-3 px-2 sm:px-3 font-medium whitespace-nowrap">Installment</th>
                        <th className="py-2 sm:py-3 px-2 sm:px-3 font-medium whitespace-nowrap">Amount</th>
                        <th className="py-2 sm:py-3 px-2 sm:px-3 font-medium whitespace-nowrap">Paid Date</th>
                        <th className="py-2 sm:py-3 px-2 sm:px-3 font-medium whitespace-nowrap">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.payments.map((payment: any, index: number) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 sm:py-3 px-2 sm:px-3 whitespace-nowrap">#{payment.installment_number}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-3 whitespace-nowrap">{paymentHistory.currency}{payment.amount?.toFixed(2)}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-3 whitespace-nowrap">
                            {payment.paid_at ? formatDate(payment.paid_at) : 'N/A'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-3 font-medium text-green-600 whitespace-nowrap">
                            {payment.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-2 mt-3 sm:mt-4 md:mt-5 pt-2 sm:pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm md:text-base font-medium text-gray-700">Total Paid:</span>
                    <span className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                      {paymentHistory.currency}{paymentHistory.total_paid?.toFixed(2)}
                    </span>
                  </div>
                  {paymentHistory.remaining_due > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm md:text-base font-medium text-gray-700">Remaining Due:</span>
                      <span className="text-base sm:text-lg md:text-xl font-bold text-orange-600">
                        {paymentHistory.currency}{paymentHistory.remaining_due?.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 sm:mt-4 md:mt-5 text-center">
                  <button
                    onClick={() => setPurchasedModal(false)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 sm:py-2.5 md:py-3 px-4 sm:px-5 md:px-6 rounded-lg text-sm sm:text-base w-full sm:w-auto transition-colors whitespace-nowrap"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-center text-lg sm:text-xl md:text-2xl mt-3 sm:mt-4 font-semibold text-gray-900">
                  Payment History
                </h2>
                <p className="text-center text-gray-500 mt-4 mb-4">No payment history found</p>
                <div className="mt-3 sm:mt-4 md:mt-5 text-center">
                  <button
                    onClick={() => setPurchasedModal(false)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 sm:py-2.5 md:py-3 px-4 sm:px-5 md:px-6 rounded-lg text-sm sm:text-base w-full sm:w-auto transition-colors whitespace-nowrap"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[101] px-3 sm:px-4 overflow-y-auto py-4">
          <div
            className="bg-white rounded-xl sm:rounded-2xl shadow-xl w-full max-w-[95%] xs:max-w-xs sm:max-w-md p-3 sm:p-4 md:p-6 relative my-auto"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              onClick={() => setCancelModal(false)}
              className="absolute top-2 right-3 sm:top-3 sm:right-4 text-lg sm:text-xl text-gray-500 hover:text-gray-700 cursor-pointer z-10"
            >
              ✕
            </button>

            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="bg-[#FFF4E5] p-2 sm:p-3 rounded-full">
                <span className="text-2xl sm:text-3xl">⚠️</span>
              </div>
            </div>

            <h2 className="text-center text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 px-2">
              {data.status === 'active' ? 'Cancel Subscription?' : 'Reactivate Subscription?'}
            </h2>

            <p className="text-center text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base px-2">
              <span className="font-medium">{planDetails.name}</span>{" "}
              <span className="text-indigo-600 font-semibold">{planDetails.price}</span>
            </p>

            <p className="text-center text-gray-500 mt-2 sm:mt-3 md:mt-4 text-xs sm:text-sm leading-relaxed px-1 sm:px-2">
              {data.status === 'active'
                ? 'Are you sure you want to cancel this subscription? You will lose access to all courses and resources provided in this plan.'
                : 'Do you want to reactivate your subscription? You will regain access to all courses and resources in this plan.'}
            </p>

            <div className="flex flex-col sm:flex-row justify-center mt-4 sm:mt-5 md:mt-6 gap-2 sm:gap-3 md:gap-4">
              <button
                onClick={() => setCancelModal(false)}
                className="px-3 sm:px-4 md:px-5 py-2 cursor-pointer rounded-md font-medium border border-purple-600 text-purple-700 hover:bg-purple-50 flex items-center justify-center gap-1 sm:gap-2 transition-colors text-sm sm:text-base"
              >
                <span>←</span> Go Back
              </button>

              <button className="px-3 sm:px-4 md:px-5 py-2 cursor-pointer rounded-md font-medium border border-red-500 text-red-600 hover:bg-red-50 transition-colors text-sm sm:text-base">
                {data.status === 'active' ? 'Cancel Subscription' : 'Reactivate'}
              </button>
            </div>

            <p className="text-center text-gray-500 text-xs mt-3 sm:mt-4 md:mt-5 px-1">
              To check the eligibility of refund, please refer our{" "}
              <a href="#" className="text-blue-600 underline hover:text-blue-800">
                Refund Policy
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Accessed Courses Modal (Subscription) */}
      {accessedCoursesModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[101] px-4 py-6 overflow-hidden">
          <div
            className="bg-white rounded-2xl shadow-2xl relative 
                        w-full max-w-4xl overflow-hidden no-scrollbar flex flex-col my-auto animate-in fade-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#1A212F] tracking-tight">
                  Accessed Courses
                </h2>
                <p className="text-[#1A212F]/60 mt-0.5 text-xs sm:text-sm font-medium">
                  Included in your subscription plan
                </p>
              </div>
              <button
                onClick={() => setAccessedCoursesModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Modal Content - List */}
            <div className="px-6 py-4 overflow-y-auto max-h-[50vh] scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
              <div className="flex flex-col gap-3">
                {accessedCoursesLoading ? (
                  <div className="text-center py-10 px-4">
                    <span className="text-gray-500 text-sm font-medium">Loading courses...</span>
                  </div>
                ) : accessedCourses.length > 0 ? (
                  accessedCourses.map((item) => (
                    <div key={item.id} className="group">
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all duration-200">
                        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[#1A212F] text-sm sm:text-base font-semibold truncate leading-snug">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <span className="text-[#1A212F]/50 text-[11px] font-medium uppercase tracking-wider">
                              {item.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 px-4">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">No courses found for this plan.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-5 border-t border-gray-100">
              <button
                onClick={() => setAccessedCoursesModal(false)}
                className="w-full py-3 bg-[#174cd2] hover:bg-[#174cd2]/90 text-white rounded-xl font-bold text-sm sm:text-base cursor-pointer shadow-lg shadow-blue-200 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}