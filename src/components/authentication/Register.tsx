import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../lib/api";
import SearchableDropdown from "./SearchableDropdown";
import "./auth.css";

interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    profession: string;
    phoneNo: string;
    password: string;
    reEnterPassword: string;
    country: string;
}

const Register: React.FC = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState<FormData>({
        firstName: "",
        lastName: "",
        email: "",
        username: "",
        profession: "",
        phoneNo: "",
        password: "",
        reEnterPassword: "",
        country: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showReEnterPassword, setShowReEnterPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // 1. Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        // 2. Phone Number Validation (10-15 digits)
        const phoneRegex = /^\d{10,15}$/;
        if (!phoneRegex.test(formData.phoneNo)) {
            toast.error("Phone number must be between 10 and 15 digits");
            return;
        }

        // 3. Password Validation (Min 6 chars, uppercase, special char)
        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
        if (!passwordRegex.test(formData.password)) {
            toast.error("Password must be at least 6 characters long and include an uppercase letter and a special character");
            return;
        }

        // 4. Password Match Validation
        if (formData.password !== formData.reEnterPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("/accounts/register/", {
                first_name: formData.firstName,
                last_name: formData.lastName,
                username: formData.username,
                email: formData.email,
                password: formData.password,
                confirm_password: formData.reEnterPassword,
                phone_number: formData.phoneNo,
                profession: formData.profession,
                country: formData.country,
            });

            const data = response.data;

            if (!data.success) {
                toast.error(data.message || "Registration failed");
                setLoading(false);
                return;
            }

            toast.success("Registration successful! Please check your email to verify your account.");

            // Redirect after delay
            setTimeout(() => {
                navigate("/login");
            }, 2500);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Server error. Please try again.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex flex-col lg:flex-row font-sans">
            {/* Left panel with branding and purple gradient - Hidden on mobile */}
            <div className="hidden lg:flex lg:flex-[0_0_45%] bg-gradient-to-b from-[#1D1F8E] to-[#3d024f] text-white p-8 lg:p-16 xl:p-20 flex-col justify-center items-center relative overflow-hidden">
                <div className="flex flex-col items-center mb-20 justify-center text-center w-full max-w-md">
                    <div className="slogan">
                        <h1 className="text-4xl font-bold tracking-wide">BRILLIANCE</h1>
                        <h1 className="text-4xl font-bold tracking-wide mt-2">INITIATED</h1>
                    </div>
                </div>
            </div>

            {/* Mobile Header - Only shown on mobile */}
            <div className="lg:hidden bg-gradient-to-b from-[#1D1F8E] h-42 to-[#3d024f] text-white py-6 px-4 flex flex-col items-center justify-center">
                <div className="text-center">
                    <h1 className="text-xl font-light tracking-[0.25em] uppercase leading-tight">
                        BRILLIANCE
                    </h1>
                    <h1 className="text-xl font-light tracking-[0.25em] uppercase leading-tight">
                        INITIATED
                    </h1>
                </div>
            </div>

            {/* Right panel with the registration form */}
            <div className="flex-1 flex flex-col justify-center p-4 sm:p-6 md:p-8 lg:p-12 xl:p-20 bg-white">
                <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl mx-auto">
                    <div className="mb-6 md:mb-8">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-normal text-black mb-1">
                            Register
                        </h1>
                        <p className="text-[#666] text-sm sm:text-base">
                            Learn from the best resources.
                        </p>
                    </div>

                    <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
                        {/* --- Row 1: First Name / Last Name --- */}
                        <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                            <div className="flex-1">
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-800 mb-1 sm:mb-2">
                                    First name<span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    id="firstName"
                                    type="text"
                                    name="firstName"
                                    placeholder="Enter first name"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border border-gray-300 rounded-lg focus:border-[#174cd2] focus:ring-2 sm:focus:ring-3 focus:ring-blue-100 outline-none transition-colors text-gray-900 placeholder:text-gray-500 text-sm sm:text-base"
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-800 mb-1 sm:mb-2">
                                    Last name<span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    id="lastName"
                                    type="text"
                                    name="lastName"
                                    placeholder="Enter last name"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border border-gray-300 rounded-lg focus:border-[#174cd2] focus:ring-2 sm:focus:ring-3 focus:ring-blue-100 outline-none transition-colors text-gray-900 placeholder:text-gray-500 text-sm sm:text-base"
                                />
                            </div>
                        </div>

                        {/* --- Row 2: Email / Username --- */}
                        <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                            <div className="flex-1">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-1 sm:mb-2">
                                    Email<span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder="Enter email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border border-gray-300 rounded-lg focus:border-[#174cd2] focus:ring-2 sm:focus:ring-3 focus:ring-blue-100 outline-none transition-colors text-gray-900 placeholder:text-gray-500 text-sm sm:text-base"
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="username" className="block text-sm font-medium text-gray-800 mb-1 sm:mb-2">
                                    Username<span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    name="username"
                                    placeholder="Enter username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border border-gray-300 rounded-lg focus:border-[#174cd2] focus:ring-2 sm:focus:ring-3 focus:ring-blue-100 outline-none transition-colors text-gray-900 placeholder:text-gray-500 text-sm sm:text-base"
                                />
                            </div>
                        </div>

                        {/* --- Row 3: Profession / Phone No --- */}
                        <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                            <div className="flex-1">
                                <label htmlFor="profession" className="block text-sm font-medium text-gray-800 mb-1 sm:mb-2">
                                    Profession<span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    id="profession"
                                    type="text"
                                    name="profession"
                                    placeholder="Enter profession"
                                    value={formData.profession}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border border-gray-300 rounded-lg focus:border-[#174cd2] focus:ring-2 sm:focus:ring-3 focus:ring-blue-100 outline-none transition-colors text-gray-900 placeholder:text-gray-500 text-sm sm:text-base"
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="phoneNo" className="block text-sm font-medium text-gray-800 mb-1 sm:mb-2">
                                    Phone No.<span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    id="phoneNo"
                                    type="tel"
                                    name="phoneNo"
                                    placeholder="Enter phone no."
                                    value={formData.phoneNo}
                                    onChange={handleChange}
                                    required
                                    maxLength={15}
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border border-gray-300 rounded-lg focus:border-[#174cd2] focus:ring-2 sm:focus:ring-3 focus:ring-blue-100 outline-none transition-colors text-gray-900 placeholder:text-gray-500 text-sm sm:text-base"
                                />
                            </div>
                        </div>

                        {/* --- Row 4: Password / Re-enter Password --- */}
                        <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                            <div className="flex-1">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-800 mb-1 sm:mb-2">
                                    Password<span className="text-red-500 ml-1">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="Enter password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border border-gray-300 rounded-lg focus:border-[#174cd2] focus:ring-2 sm:focus:ring-3 focus:ring-blue-100 outline-none transition-colors text-gray-900 placeholder:text-gray-500 text-sm sm:text-base pr-10 sm:pr-12"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 p-1 text-base sm:text-lg"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <i className="ri-eye-off-line"></i> : <i className="ri-eye-line"></i>}
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1">
                                <label htmlFor="reEnterPassword" className="block text-sm font-medium text-gray-800 mb-1 sm:mb-2">
                                    Re-enter Password<span className="text-red-500 ml-1">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id="reEnterPassword"
                                        type={showReEnterPassword ? "text" : "password"}
                                        name="reEnterPassword"
                                        placeholder="Re-enter password"
                                        value={formData.reEnterPassword}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border border-gray-300 rounded-lg focus:border-[#174cd2] focus:ring-2 sm:focus:ring-3 focus:ring-blue-100 outline-none transition-colors text-gray-900 placeholder:text-gray-500 text-sm sm:text-base pr-10 sm:pr-12"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 p-1 text-base sm:text-lg"
                                        onClick={() => setShowReEnterPassword(!showReEnterPassword)}
                                        aria-label={showReEnterPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showReEnterPassword ? <i className="ri-eye-off-line"></i> : <i className="ri-eye-line"></i>}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* --- Row 5: Current Residence (Select) --- */}
                        <div>
                            <label htmlFor="country" className="block text-sm font-medium text-gray-800 mb-1 sm:mb-2">
                                Your current residence<span className="text-red-500 ml-1">*</span>
                            </label>

                            <SearchableDropdown
                                value={formData.country}
                                onChange={(val) => setFormData(prev => ({ ...prev, country: val }))}
                                placeholder="Search your country..."
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border border-gray-300 rounded-lg focus:border-[#174cd2] focus:ring-2 sm:focus:ring-3 focus:ring-blue-100 outline-none transition-colors text-gray-900 placeholder:text-gray-400 text-sm sm:text-base pr-10"
                                required
                            />
                        </div>



                        {/* Register Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#174cd2] text-white py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base hover:bg-[#0d3db5] transition-colors mt-2 sm:mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Registering..." : "Register"}
                        </button>
                    </form>

                    <p className="text-center text-gray-600 mt-4 sm:mt-6 text-xs sm:text-sm">
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="text-[#174cd2] font-semibold hover:text-[#0d3db5] hover:underline"
                        >
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;

