// services/api.ts

import api from "../../../lib/api";

/* =======================
   TYPES
======================= */

export interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  profilePicture: string | null;
  postalCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: "paid" | "pending" | "failed";
  downloadUrl: string;
  // Phase 2 Enhancement Fields
  currency?: string;           // "₹" or "$"
  currency_code?: string;      // "INR" or "USD"
  payment_method?: string;     // "razorpay", etc.
  installment_number?: number; // 1, 2, or 3
  no_of_installments?: number; // Total installments
  course?: string;             // Course name
  course_amount?: number;      // Individual course amount
  amount_paid?: number;        // Amount paid so far
  total_amount?: number;       // Total invoice amount
}

export interface BillingData {
  currentPlan: string;
  nextBillingDate: string;
  status: "active" | "inactive" | "cancelled";
  invoices: Invoice[];
}

export interface SettingsData {
  emailNotifications: boolean;
  smsNotifications: boolean;
  twoFactorAuth: boolean;
  language: string;
  timezone: string;
  currency: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    profile: ProfileData;
    billing?: BillingData;
    settings?: SettingsData;
  };
}

// Helper to map backend profile data to frontend ProfileData
const mapBackendProfile = (backend: any): ProfileData => {
  const addressObj = backend.address || {};
  const addressParts = [
    backend.address_line_1 || addressObj.address_line_1 || "",
    backend.address_line_2 || addressObj.address_line_2 || "",
    backend.city || addressObj.city || "",
    backend.state || addressObj.state || "",
    backend.country || addressObj.country || "",
  ].filter(Boolean);

  return {
    id: String(backend.id || backend.user?.id || ""),
    name: backend.name || `${backend.first_name || backend.user?.first_name || ""} ${backend.last_name || backend.user?.last_name || ""}`.trim(),
    email: backend.email || backend.user?.email || "",
    phone: backend.phone_number || backend.phone || "",
    address: addressParts.join(", "),
    postalCode: backend.postal_code || addressObj.postal_code || "",
    profilePicture: (backend.profile_picture || (backend.profile && backend.profile.profile_picture))
      ? (backend.profile_picture?.startsWith('http') 
        ? backend.profile_picture 
        : `${api.defaults.baseURL}${backend.profile_picture || backend.profile.profile_picture}`)
      : null,
    createdAt: backend.created_at || "",
    updatedAt: backend.updated_at || "",
  };
};

/* =======================
   FETCH PROFILE DATA
======================= */

export const fetchProfileData = async (): Promise<ApiResponse> => {
  const response = await api.get("/accounts/profile/");
  const apiData = response.data;

  return {
    success: true,
    message: "Profile fetched successfully",
    data: {
      profile: mapBackendProfile(apiData.data),
    },
  };
};

/* =======================
   UPDATE PROFILE
======================= */

export const updateProfile = async (
  profileData: Partial<ProfileData>
): Promise<ApiResponse> => {
  const payload: Record<string, unknown> = {};

  if (profileData.name) {
    const parts = profileData.name.split(" ");
    payload.first_name = parts[0] || "";
    payload.last_name = parts.slice(1).join(" ");
  }

  if (profileData.phone) {
    payload.phone_number = profileData.phone;
  }

  if (profileData.postalCode) {
    payload.postal_code = profileData.postalCode;
  }

  if (profileData.address) {
    const parts = profileData.address.split(",").map(p => p.trim());
    if (parts[0]) payload.address_line_1 = parts[0];
    if (parts[1]) payload.address_line_2 = parts[1];
    if (parts[2]) payload.city = parts[2];
    if (parts[3]) payload.state = parts[3];
    if (parts[4]) payload.country = parts[4];
  }

  const response = await api.post("/accounts/edit_profile/", payload);
  const apiData = response.data;

  if (apiData.success && apiData.data) {
    // Combine user and profile data for mapping
    const combinedData = {
      ...apiData.data.user,
      ...apiData.data.profile,
      postal_code: apiData.data.profile.postal_code // Ensure postal_code is at top level for mapper
    };
    return {
      ...apiData,
      data: {
        profile: mapBackendProfile(combinedData)
      }
    };
  }

  return apiData;
};

/* =======================
   UPLOAD PROFILE PICTURE
======================= */

export const uploadProfilePicture = async (file: File): Promise<ApiResponse> => {
  const formData = new FormData();
  formData.append('profile_picture', file);

  // Use csrfFetch to include CSRF token automatically
  const response = await api.post("/accounts/upload_profile_picture/", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  });

  return response.data;
};

/* =======================
   UPDATE SETTINGS
======================= */

export const updateSettings = async (
  settingsData: Partial<SettingsData>
): Promise<ApiResponse> => {
  const response = await api.post("/accounts/update_settings/", settingsData);
  return response.data;
};

/* =======================
   CHANGE PASSWORD
======================= */

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
  status: number;
  user?: {
    id: number;
    email: string;
    username: string;
    password_changed_at: string;
  };
  action?: string;
}

export const changePassword = async (
  passwordData: ChangePasswordData
): Promise<ChangePasswordResponse> => {
  const response = await api.post("/accounts/change_password/", passwordData);
  return response.data;
};

/* =======================
   LOGOUT
======================= */

export interface LogoutResponse {
  success: boolean;
  message: string;
  status: number;
  user_email: string | null;
  session_cleared: boolean;
}

export const logoutUser = async (): Promise<LogoutResponse> => {
  const response = await api.post("/accounts/logout/");
  return response.data;
};

/* =======================
   PAYMENT DUE TYPES
======================= */

// export interface PaymentDueData {
//   course_id: number;
//   course_title: string;
//   no_of_installments: number;
//   second_installment_paid: number;
//   third_installment_paid: number;
// }

export interface PaymentDueData {
  course_id: number;
  course_title: string;
  no_of_installments: number;
  currency: string;
  currency_code: string;
  total_fee: number;
  per_installment: number;
  course_duration_months: number;
  end_at: string;

  second_installment_paid: number;
  second_installment_due: number;
  second_installment_due_date?: string;

  third_installment_paid: number;
  third_installment_due: number;
  third_installment_due_date?: string;
}


export interface PaymentDueResponse {
  success: boolean;
  message: string;
  status: number;
  data: PaymentDueData[];
  timestamp: string;
}

export interface InvoiceRegistrantData {
  // Original fields
  invoice_id: number;
  serial_no: string;
  order_id: number;
  course_id?: number;
  course: string;
  payment_id?: string;
  created_at: string;

  // Additional enrollment fields
  end_at?: string;
  amount?: number;

  // Phase 2 Enhancement Fields (from backend)
  course_amount?: number;
  amount_paid?: number;
  total_amount?: number;
  currency?: string;           // "₹" or "$"
  currency_code?: string;      // "INR" or "USD"
  status?: 'paid' | 'pending'; // Invoice status
  payment_method?: string;     // "razorpay", "credit_card", etc.
  installment_number?: number; // 1, 2, or 3
  no_of_installments?: number; // Total installments
  download_url?: string;       // Pre-formatted download URL
  is_playlist?: boolean;       // Flag for custom playlists
  playlist_id?: number;        // ID of the custom playlist
  is_subscription?: boolean;   // Flag for subscription plan purchases
}

export interface InvoiceListResponse {
  success: boolean;
  message: string;
  status: number;
  orders_exist: number;
  data: InvoiceRegistrantData[];
  timestamp: string;
}

/* =======================
   FETCH PAYMENT DUE
======================= */

export const fetchPaymentDue = async (): Promise<PaymentDueResponse> => {
  const response = await api.get("/accounts/payment_due/");
  return response.data;
};

/* =======================
   FETCH INVOICE LIST
======================= */

export const fetchInvoiceList = async (): Promise<InvoiceListResponse> => {
  const response = await api.get("/accounts/invoice/");
  return response.data;
};

/* =======================
   COMBINED BILLING DATA
======================= */

export interface ReminderItem {
  title: string;
  course: string;
  due: string;
  amount: string;
}

export interface BillingPaymentHistory {
  id: number;
  month: string;
  amount: string;
  status: "Paid" | "Pending" | "Due";
}

export interface PurchasedPayment {
  id: number;
  date: string;
  amount: string;
  status: "Paid" | "Pending";
}

export interface PurchasedCourse {
  id: number | string;
  title: string;
  category: string;
  url_link_name: string;
  purchaseDate: string;
  accessTill: string;
  price?: number;
  currency?: string;  // "₹" or "$" - dynamically set based on user's country
  is_subscription?: boolean;
  is_playlist?: boolean;
  is_sub_plan?: boolean;
}

export interface PurchasedCourseResponse {
  success: boolean;
  message: string;
  status: number;
  user_type: string;
  courses: {
    total_count: number;
    courses_list: {
      id: number;
      title: string;
      category: string;
      url_link_name: string;
      description?: string;
    }[];
  };
  timestamp: string;
}

export interface CombinedBillingResponse {
  reminders: ReminderItem[];
  basicInstallments: BillingPaymentHistory[];
  customInstallments: BillingPaymentHistory[];
  purchasedPayments: PurchasedPayment[];
}
