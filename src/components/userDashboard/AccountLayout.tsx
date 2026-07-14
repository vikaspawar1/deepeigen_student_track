
import { useState } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux/slices/auth";
import { logoutUser } from "./data/typesprofile";

// import bill from "../../assets/Media/Images/bill.svg"

// import logouts from "../../assets/Media/Images/log-out.svg"

// import profile from "../../assets/Media/Images/profile.svg"

// import setting from "../../assets/Media/Images/settings-2-tuner.svg"

type ActiveSection = "overview" | "profile" | "billing" | "settings";

export default function AccountLayout() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    // Determine active section based on current URL
    const getActiveSection = (): ActiveSection => {
        if (location.pathname.includes("overview")) {
            return "overview";
        } else if (location.pathname.includes("billing") || location.pathname.includes("billings_invoices")) {
            return "billing";
        } else if (location.pathname.includes("settings")) {
            return "settings";
        }
        return "profile";
    };

    const activeSection = getActiveSection();

    const handleSectionClick = (section: ActiveSection) => {
        if (section === "overview") {
            navigate("/accounts/overview");
        } else if (section === "profile") {
            navigate("/accounts/profile");
        } else if (section === "billing") {
            navigate("/accounts/billings_invoices");
        } else if (section === "settings") {
            navigate("/accounts/settings");
        }
        // Auto-close sidebar on mobile
        setIsSidebarOpen(false);
    };

    const handleLogout = async () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);

        try {
            await logoutUser();

            dispatch(logout());

            setIsLogoutModalOpen(false);

            navigate("/", { replace: true });
        } catch (error) {
            console.error("Logout error:", error);

            dispatch(logout());

            setIsLogoutModalOpen(false);

            navigate("/", { replace: true });
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <div className="min-h-screen bg-white mt-[-50px]   relative">
            {/* Mobile Header - hide back button */}
            <div className="lg:hidden  left-0 right-0 z-40 bg-white px-2 py-3 flex items-center h-16 border-gray-200">
                {/* No back button for improved mobile UI */}
            </div>

            <div className="flex">
                {/* Sidebar toggle button for mobile */}
                <button
                    className="sidebar-toggle lg:hidden absolute text-2xl bg-blue-700 w-12 h-12 text-white 
                     rounded-full top-[80vh] fixed md:left-[90vw]   left-[83vw] z-50  "
                    onClick={() => setIsSidebarOpen(true)}
                    aria-label="Open sidebar"
                >
                    <span className="hamburger-icon ">&#9776;</span>
                </button>

                {/* Overlay for mobile sidebar */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <div className={`sidebar fixed lg:relative top-0 left-0 h-full lg:h-auto w-[280px] lg:w-[300px] flex-shrink-0 border-r border-[rgba(26,30,47,0.4)] bg-white z-50 lg:z-auto transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 flex flex-col pb-7 pt-6 lg:pt-0`}>
                    {/* Close button for mobile sidebar */}
                    <button
                        className="close-sidebar lg:hidden absolute top-8 text-3xl right-4 z-50"
                        onClick={() => setIsSidebarOpen(false)}
                        aria-label="Close sidebar"
                    >
                        &times;
                    </button>
                    {/* ...existing sidebar content... */}

                    <div className="flex flex-col lg:gap-3 gap-5 flex-1 mt-10 lg:mt-0 px-4 lg:px-0">


                        <div className="px-4 mt-0 sm:mt-10 lg:px-10">
                            <button
                                onClick={() => navigate("/user_dashboard", { replace: true })}
                                className="flex items-center gap-2 py-3 lg:py-10 lg:pb-[10px] w-full"
                            >
                                <i className="ri-dashboard-fill text-xl mt-2 text-[rgba(26,33,47,0.7)]"></i>
                                <span className="text-[rgba(26,33,47,0.7)] mt-2 cursor-pointer font-semibold text-lg leading-[93%]">
                                    Dashboard
                                </span>
                            </button>
                        </div>





                         <button
                            onClick={() => handleSectionClick("overview")}
                            className={`flex items-center cursor-pointer gap-3 px-4 lg:px-10 py-4 lg:py-5 w-full 
                                ${activeSection === "overview" ? "bg-[rgba(23,76,210,0.06)]" : "hover:bg-gray-50"}`}
                        >
                            <svg
                                className={
                                    activeSection === "overview"
                                        ? "text-[#174CD2]"
                                        : "text-[rgba(26,33,47,0.7)]"
                                }
                                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="3" width="7" height="9" rx="1"></rect>
                                <rect x="14" y="3" width="7" height="5" rx="1"></rect>
                                <rect x="14" y="12" width="7" height="9" rx="1"></rect>
                                <rect x="3" y="16" width="7" height="5" rx="1"></rect>
                            </svg>

                            <span className={`flex-1 text-left font-semibold text-base ${activeSection === "overview" ? "text-[#174CD2]" : "text-[rgba(26,33,47,0.7)]"}`}>
                                overview
                            </span>

                        </button>


                        {/* Profile */}
                        <button
                            onClick={() => handleSectionClick("profile")}
                            className={`flex items-center cursor-pointer gap-3 px-4 lg:px-10 py-4 lg:py-5 w-full 
                                ${activeSection === "profile" ? "bg-[rgba(23,76,210,0.06)]" : "hover:bg-gray-50"}`}
                        >
                            <svg
                                className={
                                    activeSection === "profile"
                                        ? "text-[#174CD2]"
                                        : "text-[rgba(26,33,47,0.7)]"
                                }
                                width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.0013 8.33317C11.8423 8.33317 13.3346 6.84079 13.3346 4.99984C13.3346 3.15889 11.8423 1.6665 10.0013 1.6665C8.16035 1.6665 6.66797 
                                3.15889 6.66797 4.99984C6.66797 6.84079 8.16035 8.33317 10.0013 8.33317Z" stroke="currentColor"
                                    stroke-opacity="0.7"
                                    stroke-width="1.5"
                                    strokeOpacity={activeSection === "profile" ? "1" : "0.7"}
                                    strokeWidth="1.25" />




                                <path

                                    d="M16.6673 14.5833C16.6673 16.6541 16.6673 18.3333 10.0007 18.3333C3.33398 18.3333 3.33398 16.6541 3.33398 14.5833C3.33398 12.5124 6.31898 10.8333
                              10.0007 10.8333C13.6823 10.8333 16.6673 12.5124 16.6673 14.5833Z"
                                    stroke="currentColor"
                                    stroke-opacity="0.7"
                                    stroke-width="1.5"
                                    strokeOpacity={activeSection === "profile" ? "1" : "0.7"}
                                    strokeWidth="1.25"

                                />
                            </svg>



                            <span className={`flex-1 text-left font-semibold text-base ${activeSection === "profile" ? "text-[#174CD2]" : "text-[rgba(26,33,47,0.7)]"}`}>
                                Profile
                            </span>



                        </button>
                        {/* ...existing navigation items... */}
                        {/* Billing and Invoices */}
                        <button
                            onClick={() => handleSectionClick("billing")}
                            className={`flex items-center cursor-pointer gap-3 px-4 lg:px-10 py-4 lg:py-5 w-full ${activeSection === "billing" ? "bg-[rgba(23,76,210,0.06)]" : "hover:bg-gray-50"}`}
                        >




<svg
                                className={
                                    activeSection === "billing"
                                        ? "text-[#174CD2]"
                                        : "text-[rgba(26,33,47,0.7)]"
                                }
                                width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M5.91667 1.0415H14.0842C14.9317 1.0415 15.515 1.0415 16.0058 1.2115C16.4645 1.37374 16.8795 1.63945 17.2189 1.98803C17.5582 2.33661 17.8127 2.75868 17.9625 3.2215C18.1258 3.719 18.125 4.31067 18.125 5.18817V16.9782C18.125 18.1998 16.6858 18.9265 15.7383 18.059C15.7079 18.0299 15.6675 18.0137 15.6254 18.0137C15.5833 18.0137 15.5429 18.0299 15.5125 18.059L15.1092 18.4273C14.3358 19.1357 13.1642 19.1357 12.3908 18.4273C12.2509 18.2966 12.0665 18.224 11.875 18.224C11.6835 18.224 11.4991 18.2966 11.3592 18.4273C10.5858 19.1357 9.41417 19.1357 8.64083 18.4273C8.50086 18.2966 8.3165 18.224 8.125 18.224C7.9335 18.224 7.74914 18.2966 7.60917 18.4273C6.83583 19.1357 5.66417 19.1357 4.89083 18.4273L4.48833 18.059C4.45789 18.0297 4.41727 18.0133 4.375 18.0133C4.33273 18.0133 4.29211 18.0297 4.26167 18.059C3.31417 18.9257 1.875 18.1998 1.875 16.9782V5.189C1.875 4.31067 1.875 3.719 2.0375 3.2215C2.18734 2.75868 2.4418 2.33661 2.78113 1.98803C3.12046 1.63945 3.53554 1.37374 3.99417 1.2115C4.48583 1.04067 5.06917 1.0415 5.91667 1.0415ZM6.0375 2.2915C5.02 2.2915 4.66917 2.29984 4.40417 2.39234C4.12741 2.49156 3.87718 2.65313 3.67286 2.86454C3.46853 3.07594 3.31558 3.33152 3.22583 3.6115C3.13333 3.89317 3.12583 4.26484 3.12583 5.30817V16.9782C3.12583 17.0782 3.175 17.1382 3.2375 17.1673C3.26602 17.1809 3.29781 17.1861 3.32917 17.1823C3.36289 17.1766 3.39402 17.1606 3.41833 17.1365C3.67909 16.8965 4.02057 16.7632 4.375 16.7632C4.72943 16.7632 5.07091 16.8965 5.33167 17.1365L5.73417 17.5048C5.87414 17.6355 6.0585 17.7082 6.25 17.7082C6.4415 17.7082 6.62586 17.6355 6.76583 17.5048C7.1362 17.1636 7.62139 16.9741 8.125 16.9741C8.62861 16.9741 9.1138 17.1636 9.48417 17.5048C9.62414 17.6355 9.8085 17.7082 10 17.7082C10.1915 17.7082 10.3759 17.6355 10.5158 17.5048C10.8862 17.1636 11.3714 16.9741 11.875 16.9741C12.3786 16.9741 12.8638 17.1636 13.2342 17.5048C13.3741 17.6355 13.5585 17.7082 13.75 17.7082C13.9415 17.7082 14.1259 17.6355 14.2658 17.5048L14.6683 17.1365C14.9291 16.8965 15.2706 16.7632 15.625 16.7632C15.9794 16.7632 16.3209 16.8965 16.5817 17.1365C16.6175 17.1698 16.6483 17.1798 16.6717 17.1823C16.7028 17.186 16.7342 17.1808 16.7625 17.1673C16.825 17.1382 16.875 17.0773 16.875 16.9782V5.30817C16.875 4.26484 16.8667 3.89317 16.775 3.61067C16.685 3.33067 16.5317 3.07514 16.3271 2.86388C16.1225 2.65261 15.872 2.49126 15.595 2.39234C15.3308 2.30067 14.98 2.29234 13.9625 2.29234L6.0375 2.2915ZM5.20917 6.24984C5.20917 6.08408 5.27501 5.92511 5.39222 5.8079C5.50943 5.69069 5.66841 5.62484 5.83417 5.62484H6.25083C6.41659 5.62484 6.57556 5.69069 6.69277 5.8079C6.80998 5.92511 6.87583 6.08408 6.87583 6.24984C6.87583 6.4156 6.80998 6.57457 6.69277 6.69178C6.57556 6.80899 6.41659 6.87484 6.25083 6.87484H5.83417C5.66841 6.87484 5.50943 6.80899 5.39222 6.69178C5.27501 6.57457 5.20917 6.4156 5.20917 6.24984ZM8.12583 6.24984C8.12583 6.08408 8.19168 5.92511 8.30889 5.8079C8.4261 5.69069 8.58507 5.62484 8.75083 5.62484H14.1675C14.3333 5.62484 14.4922 5.69069 14.6094 5.8079C14.7267 5.92511 14.7925 6.08408 14.7925 6.24984C14.7925 6.4156 14.7267 6.57457 14.6094 6.69178C14.4922 6.80899 14.3333 6.87484 14.1675 6.87484H8.75083C8.58507 6.87484 8.4261 6.80899 8.30889 6.69178C8.19168 6.57457 8.12583 6.4156 8.12583 6.24984ZM5.20917 9.1665C5.20917 9.00074 5.27501 8.84177 5.39222 8.72456C5.50943 8.60735 5.66841 8.5415 5.83417 8.5415H6.25083C6.41659 8.5415 6.57556 8.60735 6.69277 8.72456C6.80998 8.84177 6.87583 9.00074 6.87583 9.1665C6.87583 9.33226 6.80998 9.49123 6.69277 9.60845C6.57556 9.72566 6.41659 9.7915 6.25083 9.7915H5.83417C5.66841 9.7915 5.50943 9.72566 5.39222 9.60845C5.27501 9.49123 5.20917 9.33226 5.20917 9.1665ZM8.12583 9.1665C8.12583 9.00074 8.19168 8.84177 8.30889 8.72456C8.4261 8.60735 8.58507 8.5415 8.75083 8.5415H14.1675C14.3333 8.5415 14.4922 8.60735 14.6094 8.72456C14.7267 8.84177 14.7925 9.00074 14.7925 9.1665C14.7925 9.33226 14.7267 9.49123 14.6094 9.60845C14.4922 9.72566 14.3333 9.7915 14.1675 9.7915H8.75083C8.58507 9.7915 8.4261 9.72566 8.30889 9.60845C8.19168 9.49123 8.12583 9.33226 8.12583 9.1665ZM5.20917 12.0832C5.20917 11.9174 5.27501 11.7584 5.39222 11.6412C5.50943 11.524 5.66841 11.4582 5.83417 11.4582H6.25083C6.41659 11.4582 6.57556 11.524 6.69277 11.6412C6.80998 11.7584 6.87583 11.9174 6.87583 12.0832C6.87583 12.2489 6.80998 12.4079 6.69277 12.5251C6.57556 12.6423 6.41659 12.7082 6.25083 12.7082H5.83417C5.66841 12.7082 5.50943 12.6423 5.39222 12.5251C5.27501 12.4079 5.20917 12.2489 5.20917 12.0832ZM8.12583 12.0832C8.12583 11.9174 8.19168 11.7584 8.30889 11.6412C8.4261 11.524 8.58507 11.4582 8.75083 11.4582H14.1675C14.3333 11.4582 14.4922 11.524 14.6094 11.6412C14.7267 11.7584 14.7925 11.9174 14.7925 12.0832C14.7925 12.2489 14.7267 12.4079 14.6094 12.5251C14.4922 12.6423 14.3333 12.7082 14.1675 12.7082H8.75083C8.58507 12.7082 8.4261 12.6423 8.30889 12.5251C8.19168 12.4079 8.12583 12.2489 8.12583 12.0832Z"
                                    fill="currentColor"
                                    fillOpacity={activeSection === "billing" ? "1" : "0.7"}
                                />
                            </svg>

                            <span className={`flex-1 text-left font-semibold text-base ${activeSection === "billing" ? "text-[#174CD2]" : "text-[rgba(26,33,47,0.7)]"}`}>
                                Billing and Invoices
                            </span>
                        </button>




                        {/* Settings */}
                        <button
                            onClick={() => handleSectionClick("settings")}
                            className={`flex items-center cursor-pointer gap-3 px-4 lg:px-10 py-4 lg:py-5 w-full ${activeSection === "settings" ? "bg-[rgba(23,76,210,0.06)]" : "hover:bg-gray-50"}`}
                        >

                            <svg

                                className={
                                    activeSection === "settings"
                                        ? "text-[#174CD2]"
                                        : "text-[rgba(26,33,47,0.7)]"
                                }
                                width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.91602 11.6668C8.57906 11.6668 9.21494 11.9302 9.68378 12.3991C10.1526 12.8679 10.416 13.5038 10.416 14.1668C10.416 14.8299 10.1526 15.4658 9.68378 15.9346C9.21494 16.4034 8.57906 16.6668 7.91602 16.6668C7.25297 16.6668 6.61709 16.4034 6.14825 15.9346C5.67941 15.4658 5.41602 14.8299 5.41602 14.1668C5.41602 13.5038 5.67941 12.8679 6.14825 12.3991C6.61709 11.9302 7.25297 11.6668 7.91602 11.6668ZM12.0827 3.3335C11.7544 3.3335 11.4293 3.39816 11.126 3.5238C10.8227 3.64943 10.5471 3.83358 10.3149 4.06573C10.0828 4.29788 9.89862 4.57347 9.77298 4.87679C9.64735 5.1801 9.58268 5.50519 9.58268 5.8335C9.58268 6.1618 9.64735 6.48689 9.77298 6.7902C9.89862 7.09352 10.0828 7.36912 10.3149 7.60126C10.5471 7.83341 10.8227 8.01756 11.126 8.1432C11.4293 8.26883 11.7544 8.3335 12.0827 8.3335C12.7457 8.3335 13.3816 8.0701 13.8504 7.60126C14.3193 7.13242 14.5827 6.49654 14.5827 5.8335C14.5827 5.17045 14.3193 4.53457 13.8504 4.06573C13.3816 3.59689 12.7457 3.3335 12.0827 3.3335Z" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.25" strokeOpacity={activeSection === "settings" ? "1" : "0.7"} />
                                <path d="M12.4993 14.1326H18.3327M7.49935 5.79932H1.66602M1.66602 14.1326H3.33268M18.3327 5.79932H16.666"
                                    stroke="currentColor"
                                    stroke-opacity="0.7"
                                    stroke-width="1.25"
                                    strokeOpacity={activeSection === "settings" ? "1" : "0.7"}
                                    strokeWidth="1.25" />
                            </svg>


                            <span className={`flex-1 text-left font-semibold text-base ${activeSection === "settings" ? "text-[#174CD2]" : "text-[rgba(26,33,47,0.7)]"}`}>
                                Settings
                            </span>
                        </button>


                        {/* Logout */}
                        <button
                            onClick={() => setIsLogoutModalOpen(true)}
                            disabled={isLoggingOut}
                            className="flex items-center cursor-pointer gap-3 px-4 lg:px-10 py-4 lg:py-5 w-full hover:bg-gray-50 disabled:opacity-50"
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12.4545 1.0415C11.3153 1.0415 10.3961 1.0415 9.67363 1.139C8.92363 1.239 8.29196 1.45567 7.7903 1.9565C7.35363 2.394 7.13196 2.9315 7.01613 3.56317C6.90363 4.17734 6.88196 4.92817 6.87696 5.82984C6.87608 5.9956 6.94108 6.15492 7.05766 6.27276C7.17425 6.39059 7.33287 6.45729 7.49863 6.45817C7.66439 6.45905 7.82371 6.39405 7.94155 6.27747C8.05938 6.16088 8.12608 6.00226 8.12696 5.8365C8.13196 4.92567 8.1553 4.27984 8.2453 3.789C8.3328 3.31734 8.47196 3.04317 8.67446 2.84067C8.9053 2.60984 9.22946 2.45984 9.84113 2.37734C10.4703 2.29317 11.3045 2.2915 12.5003 2.2915H13.3336C14.5303 2.2915 15.3645 2.29317 15.9936 2.37734C16.6053 2.45984 16.9286 2.61067 17.1603 2.84067C17.3903 3.0715 17.5403 3.39484 17.6228 4.00734C17.7078 4.63567 17.7086 5.47067 17.7086 6.6665V13.3332C17.7086 14.529 17.7078 15.3632 17.6228 15.9932C17.5403 16.6048 17.3903 16.9282 17.1595 17.159C16.9286 17.3898 16.6053 17.5398 15.9936 17.6223C15.3645 17.7065 14.5303 17.7082 13.3336 17.7082H12.5003C11.3045 17.7082 10.4703 17.7065 9.8403 17.6223C9.22946 17.5398 8.9053 17.389 8.67446 17.159C8.47196 16.9557 8.3328 16.6823 8.2453 16.2107C8.1553 15.7198 8.13196 15.074 8.12696 14.1632C8.12652 14.0811 8.10992 13.9999 8.07811 13.9242C8.0463 13.8486 7.99989 13.7799 7.94155 13.7222C7.8832 13.6645 7.81406 13.6188 7.73806 13.5878C7.66206 13.5568 7.58071 13.5411 7.49863 13.5415C7.41655 13.5419 7.33537 13.5585 7.25971 13.5904C7.18404 13.6222 7.11539 13.6686 7.05766 13.7269C6.99994 13.7853 6.95427 13.8544 6.92326 13.9304C6.89226 14.0064 6.87652 14.0878 6.87696 14.1698C6.88196 15.0715 6.90363 15.8223 7.01613 16.4365C7.1328 17.0682 7.35363 17.6057 7.79113 18.0432C8.29196 18.5448 8.92446 18.7598 9.67446 18.8615C10.3961 18.9582 11.3153 18.9582 12.4545 18.9582H13.3795C14.5195 18.9582 15.4378 18.9582 16.1603 18.8615C16.9103 18.7598 17.542 18.5448 18.0436 18.0432C18.5453 17.5415 18.7603 16.9098 18.862 16.1598C18.9586 15.4373 18.9586 14.5182 18.9586 13.379V6.62067C18.9586 5.4815 18.9586 4.56234 18.862 3.83984C18.7611 3.08984 18.5453 2.45817 18.0436 1.9565C17.542 1.45484 16.9103 1.23984 16.1603 1.139C15.4378 1.0415 14.5186 1.0415 13.3795 1.0415H12.4545Z" fill="#CE2823" />
                                <path d="M12.4998 9.37506C12.6656 9.37506 12.8245 9.44091 12.9418 9.55812C13.059 9.67533 13.1248 9.8343 13.1248 10.0001C13.1248 10.1658 13.059 10.3248 
                                12.9418 10.442C12.8245 10.5592 12.6656 10.6251 12.4998 10.6251H3.35565L4.98981 12.0251C5.11579 12.1329 5.19376 12.2864 5.20658 12.4517C5.21939 12.6171
                                 5.166 12.7807 5.05815 12.9067C4.95029 13.0327 4.79681 13.1107 4.63147 13.1235C4.46612 13.1363 4.30246 13.0829 4.17648 12.9751L1.25981 10.4751C1.1912 
                                 10.4164 1.13612 10.3435 1.09834 10.2615C1.06057 10.1795 1.04102 10.0903 1.04102 10.0001C1.04102 9.90978 1.06057 9.82057 1.09834 9.73857C1.13612 9.65658
                                  1.1912 9.58373 1.25981 9.52506L4.17648 7.02506C4.23886 6.97165 4.31114 6.93106 4.38921 6.90559C4.46728 6.88012 4.5496 6.87028 4.63147 6.87663C4.71334
                                   6.88297 4.79316 6.90538 4.86637 6.94257C4.93958 6.97977 5.00474 7.03101 5.05815 7.09339C5.11155 7.15577 5.15215 7.22806 5.17761 7.30612C5.20308 
                                   7.38419 5.21292 7.46651 5.20658 7.54838C5.20023 7.63025 5.17783 7.71007 5.14063 7.78328C5.10344 7.85649 5.05219 7.92165 4.98981 7.97506L3.35648
                                    9.37506H12.4998Z" fill="#CE2823" />
                            </svg>



                            <span className="flex-1 text-left text-[#CE2823] font-semibold text-base">
                                Logout
                            </span>
                        </button>



                    </div>
                </div>



                {isLogoutModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                        <div className="relative w-full max-w-[500px] rounded-[24px] bg-white px-8 py-10 ">

                            {/* Close Button */}
                            <button
                                onClick={() => setIsLogoutModalOpen(false)}
                                className="absolute right-6 top-6 text-4xl leading-none text-[#1A2130] hover:opacity-70"
                            >
                                ×
                            </button>

                            {/* Logout Icon */}
                            <div className="flex justify-center">
                                <div className="flex sm:h-[90px] sm:w-[90px]   h-[80px] w-[80px] items-center justify-center rounded-full bg-[#FFD8AE]">
                                    <svg
                                        width="34"
                                        height="54"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#D92D20"
                                        strokeWidth="2.3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                        <path d="M10 17l-5-5 5-5" />
                                        <path d="M5 12h10" />
                                    </svg>
                                </div>
                            </div>

                            {/* Heading */}
                            <h2 className="mt-8 text-center text-xl  sm:text-3xl md:text-3xl font-semibold leading-none text-[#1A2130]">
                                Logout?
                            </h2>

                            {/* Description */}
                            <p className="mt-5 text-center text-[20px] leading-8 text-[#6B7280]">
                                Are you sure you want to log out of Deep
                                <br />
                                Eigen?
                            </p>

                            {/* Buttons */}
                            <div className="mt-10 flex justify-center gap-5">

                                <button
                                    onClick={() => setIsLogoutModalOpen(false)}
                                    className="sm:h-[55px] sm:w-[120px] h-[50px] w-[100px] rounded-xl bg-[#174CD2] sm:text-[18px] md:text-[18px] text-[16px]  font-semibold text-white transition hover:bg-[#123ca7]"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="sm:h-[55px] sm:w-[122px] h-[50px] w-[100px] rounded-xl border border-[#EF4444] bg-white sm:text-[18px] md:text-[18px]  text-[16px]  font-semibold text-[#EF4444] transition hover:bg-red-50 disabled:opacity-50"
                                >
                                    {isLoggingOut ? "..." : "Logout"}
                                </button>

                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 flex flex-col px-6 lg:px-12 pt-8 lg:pt-14 min-h-screen overflow-x-hidden">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

