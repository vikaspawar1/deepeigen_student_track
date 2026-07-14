import { useState, useEffect } from "react";
import api from "../../lib/api";
import "./styles/subscriptionCard.css"
import { FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../redux/hooks";
import { selectIsAuthenticated, selectIsAdmin } from "../../redux/slices/auth";
import { toast } from "react-toastify";

const SubscriptionCard = () => {
    const [pricingData, setPricingData] = useState<any>({
        Monthly: {},
        Quarterly: {},
        Yearly: {},
    });


    const [loading, setLoading] = useState(true);

    const [active, setActive] = useState<string>("Yearly");
    const navigate = useNavigate();
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const isAdmin = useAppSelector(selectIsAdmin);

 useEffect(() => {
    setLoading(true);

    api.get("subscriptions/plans/")
        .then((res) => {
            const plans = res.data.plans;

            const formatted: any = {
                Monthly: {},
                Quarterly: {},
                Yearly: {},
            };

            plans.forEach((plan: any) => {
                let durationKey = "";

                if (plan.duration === "MONTHLY") durationKey = "Monthly";
                if (plan.duration === "FOUR_MONTH") durationKey = "Quarterly";
                if (plan.duration === "YEARLY") durationKey = "Yearly";

                const planKey = plan.plan_type.toLowerCase();

                formatted[durationKey][planKey] = {
                    inr: plan.indian_price,
                    usd: plan.foreign_price,
                    is_active: plan.is_currently_active,
                };
            });

            setPricingData(formatted);
        })
        .catch((err) => {
            console.error(err);
        })
        .finally(() => {
            setLoading(false);
        });
}, []);

    const tabs = Object.keys(pricingData).filter((k): k is string => typeof k === "string");
    const basic = pricingData[active]?.basic || {};
    const standard = pricingData[active]?.standard || {};
    const premium = pricingData[active]?.premium || {};
    const periodLabel = active === "Monthly" ? "/month" : active === "Quarterly" ? "/quarter" : "/year";

if (loading) {
    return (
        <div className="min-h-screen flex items-center mt-[-160px] justify-center ">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#174cd2] mx-auto mb-4"></div>

                <p className="text-gray-600  ">
                    Loading subscription plans...
                </p>
            </div>
        </div>
    );
}

    return (
        <div className="Pricing-card-wrapper">
            <div className="pricing-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActive(tab)}
                        className={`tab-button ${active === tab ? "tab-active" : ""}`}>
                        {tab}
                    </button>
                ))}
            </div>

            <div className="pricing-cards">

                <div className="pricing-card basic-access">

                    <div className="card-header">
                        <h2 className="card-title">Basic</h2>
                        <p className="card-subtitle">Learn By Building</p>
                    </div>

                    <div className="full-access-pricing">
                        <div className="full-divider"></div>

                        <div className="full-price-row">
                            <div className="price-group">
                                <span className="currency">₹</span>
                                <span className="price-large">{basic.inr}</span>
                                <span className="price-period">{periodLabel}</span>
                            </div>
                            <div className="price-divider"></div>
                            <div className="price-group">
                                <span className="currency-small">$</span>
                                <span className="price-medium">{basic.usd}</span>
                                <span className="price-period-small">{periodLabel}</span>
                            </div>
                        </div>

                        <div className="full-divider"></div>

                        <h3 className="plus-title1">CAT-II</h3>

                        <div className="feature-list">
                            <div className="feature-item">
                                <svg className="check-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_63_707)">
                                        <path d="M5.62508 12.2501L15.0834 2.79175L16.2917 4.04175L5.62508 14.7084L0.666748 9.75008L1.91675 8.50008L5.62508 12.2501Z" fill="#0F9C0F" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_63_707">
                                            <rect width="16" height="16" fill="white" transform="translate(0.5 0.5)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span>Access to application-focused courses</span>
                            </div>
                            <div className="feature-item">
                                <svg className="check-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_63_711)">
                                        <path d="M5.62508 12.2501L15.0834 2.79175L16.2917 4.04175L5.62508 14.7084L0.666748 9.75008L1.91675 8.50008L5.62508 12.2501Z" fill="#0F9C0F" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_63_711">
                                            <rect width="16" height="16" fill="white" transform="translate(0.5 0.5)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span>End-to-end projects</span>
                            </div>
                            <div className="feature-item">
                                <svg className="check-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_63_715)">
                                        <path d="M5.62508 12.2501L15.0834 2.79175L16.2917 4.04175L5.62508 14.7084L0.666748 9.75008L1.91675 8.50008L5.62508 12.2501Z" fill="#0F9C0F" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_63_715">
                                            <rect width="16" height="16" fill="white" transform="translate(0.5 0.5)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span>Programming assignments</span>
                            </div>
                            <div className="feature-item">
                                <svg className="check-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_63_719)">
                                        <path d="M5.62508 12.2501L15.0834 2.79175L16.2917 4.04175L5.62508 14.7084L0.666748 9.75008L1.91675 8.50008L5.62508 12.2501Z" fill="#0F9C0F" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_63_719">
                                            <rect width="16" height="16" fill="white" transform="translate(0.5 0.5)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span>Course completion certificate</span>
                            </div>
                            <div className="feature-item">
                                <svg className="check-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_63_723)">
                                        <path d="M5.62508 12.2501L15.0834 2.79175L16.2917 4.04175L5.62508 14.7084L0.666748 9.75008L1.91675 8.50008L5.62508 12.2501Z" fill="#0F9C0F" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_63_723">
                                            <rect width="16" height="16" fill="white" transform="translate(0.5 0.5)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span>Community support</span>
                            </div>
                            <div className="feature-item">
                                <svg className="check-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_63_727)">
                                        <path d="M5.62508 12.2501L15.0834 2.79175L16.2917 4.04175L5.62508 14.7084L0.666748 9.75008L1.91675 8.50008L5.62508 12.2501Z" fill="#0F9C0F" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_63_727">
                                            <rect width="16" height="16" fill="white" transform="translate(0.5 0.5)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span>Lifetime access to purchased courses</span>
                            </div>
                            <div className="feature-item">
                                <svg className="check-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_63_731)">
                                        <path d="M5.62508 12.2501L15.0834 2.79175L16.2917 4.04175L5.62508 14.7084L0.666748 9.75008L1.91675 8.50008L5.62508 12.2501Z" fill="#0F9C0F" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_63_731">
                                            <rect width="16" height="16" fill="white" transform="translate(0.5 0.5)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span>Course updates</span>
                            </div>

                            <div className="mt-2">
                                <span className="text-[#0F9C95] text-lg font-[600]">Who is this for:</span>
                                <p className="text-[15px] text-gray-700 font-[300]">Beginners, Software Engineers, Students wanting practical AI Skills</p>
                            </div>

                            <div className="flex items-center mt-4 cursor-pointer gap-2" onClick={() => navigate("/showallcourses")}>
                                <span className="text-sm font-semibold text-blue-700 leading-none">
                                    View Courses
                                </span>
                                <FaArrowRight className="text-blue-700 text-base" />
                            </div>





                        </div>
                    </div>

                    {/* <Link to="/chooseplan" className="join-now-btn basic-access-btn">Choose Plan</Link> */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            if (isAdmin) {
                                toast.info("Full Access active via Administrative account.");
                                return;
                            }
                            if (basic.is_active) {
                                toast.info("This plan is already active on your account.");
                                return;
                            }
                            const destUrl = `/chooseplan?plan=basic&duration=${active}`;
                            const destState = { planName: "Basic", subtitle: "Essential & foundation courses", priceInr: basic.inr, priceUsd: basic.usd, duration: active };
                            if (!isAuthenticated) {
                                navigate("/login", { state: { from: destUrl, ...destState } });
                            } else {
                                navigate(destUrl, { state: destState });
                            }
                        }}
                        className={`join-now-btn basic-access-btn ${(isAdmin || basic.is_active) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >{isAdmin ? "Admin Access Enabled" : (basic.is_active ? "Active Plan" : "Choose Plan")}
                    </button>
                </div>

                <div className="pricing-card standard-access">
                    <div className="card-header">
                        <h2 className="card-title">Standard</h2>
                        <p className="card-subtitle">Build Strong AI Foundations</p>
                    </div>

                    <div className="full-access-pricing">
                        <div className="full-divider"></div>

                        <div className="full-price-row">
                            <div className="price-group">
                                <span className="currency">₹</span>
                                <span className="price-large">{standard.inr}</span>
                                <span className="price-period">{periodLabel}</span>
                            </div>
                            <div className="price-divider"></div>
                            <div className="price-group">
                                <span className="currency-small">$</span>
                                <span className="price-medium">{standard.usd}</span>
                                <span className="price-period-small">{periodLabel}</span>
                            </div>
                        </div>

                        <div className="full-divider"></div>

                        <h3 className="plus-title2">CAT-IA & CAT-II</h3>

                        <div className="feature-list">
                            <div className="feature-item">
                                <svg className="check-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_63_707)">
                                        <path d="M5.62508 12.2501L15.0834 2.79175L16.2917 4.04175L5.62508 14.7084L0.666748 9.75008L1.91675 8.50008L5.62508 12.2501Z" fill="#0F9C0F" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_63_707">
                                            <rect width="16" height="16" fill="white" transform="translate(0.5 0.5)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span>Theoretical modules</span>
                            </div>
                            <div className="feature-item">
                                <svg className="check-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_63_711)">
                                        <path d="M5.62508 12.2501L15.0834 2.79175L16.2917 4.04175L5.62508 14.7084L0.666748 9.75008L1.91675 8.50008L5.62508 12.2501Z" fill="#0F9C0F" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_63_711">
                                            <rect width="16" height="16" fill="white" transform="translate(0.5 0.5)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span>Mathematical intuition behind algorithms</span>
                            </div>
                            <div className="feature-item">
                                <svg className="check-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_63_715)">
                                        <path d="M5.62508 12.2501L15.0834 2.79175L16.2917 4.04175L5.62508 14.7084L0.666748 9.75008L1.91675 8.50008L5.62508 12.2501Z" fill="#0F9C0F" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_63_715">
                                            <rect width="16" height="16" fill="white" transform="translate(0.5 0.5)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span>Architecture deep dives</span>
                            </div>
                            <div className="feature-item">
                                <svg className="check-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_63_719)">
                                        <path d="M5.62508 12.2501L15.0834 2.79175L16.2917 4.04175L5.62508 14.7084L0.666748 9.75008L1.91675 8.50008L5.62508 12.2501Z" fill="#0F9C0F" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_63_719">
                                            <rect width="16" height="16" fill="white" transform="translate(0.5 0.5)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span>Additional assignments</span>
                            </div>
                            <div className="feature-item">
                                <svg className="check-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_63_723)">
                                        <path d="M5.62508 12.2501L15.0834 2.79175L16.2917 4.04175L5.62508 14.7084L0.666748 9.75008L1.91675 8.50008L5.62508 12.2501Z" fill="#0F9C0F" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_63_723">
                                            <rect width="16" height="16" fill="white" transform="translate(0.5 0.5)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span>Priority doubt support</span>
                            </div>
                            <div className="feature-item">
                                <svg className="check-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_63_727)">
                                        <path d="M5.62508 12.2501L15.0834 2.79175L16.2917 4.04175L5.62508 14.7084L0.666748 9.75008L1.91675 8.50008L5.62508 12.2501Z" fill="#0F9C0F" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_63_727">
                                            <rect width="16" height="16" fill="white" transform="translate(0.5 0.5)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span>Mini research projects</span>
                            </div>
                            <div className="feature-item">
                                <svg className="check-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_63_731)">
                                        <path d="M5.62508 12.2501L15.0834 2.79175L16.2917 4.04175L5.62508 14.7084L0.666748 9.75008L1.91675 8.50008L5.62508 12.2501Z" fill="#0F9C0F" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_63_731">
                                            <rect width="16" height="16" fill="white" transform="translate(0.5 0.5)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span>Industry case studies</span>
                            </div>



                            <div className="feature-item">
                                <svg className="check-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_63_731)">
                                        <path d="M5.62508 12.2501L15.0834 2.79175L16.2917 4.04175L5.62508 14.7084L0.666748 9.75008L1.91675 8.50008L5.62508 12.2501Z" fill="#0F9C0F" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_63_731">
                                            <rect width="16" height="16" fill="white" transform="translate(0.5 0.5)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span>
                                    Early access to new courses</span>
                            </div>

                            <div className="mt-2">
                                <span className="text-[#4672C4] text-lg font-[600]">Who is this for:</span>
                                <p className="text-[15px] text-gray-700 font-[300]">AI/ML Engineers, Professional Upskilling</p>
                            </div>



                            <div className="flex items-center mt-4 cursor-pointer gap-2" onClick={() => navigate("/showallcourses")}>
                                <span className="text-sm font-semibold text-blue-700 leading-none">
                                    View Courses
                                </span>
                                <FaArrowRight className="text-blue-700 text-base" />
                            </div>
                        </div>
                    </div>

                    {/* <Link to="/choosestandard" className="join-now-btn standard-access-btn">Choose Plan</Link>
                     */}
                    <button onClick={(e) => {
                        e.preventDefault();
                        if (isAdmin) {
                            toast.info("Full Access active via Administrative account.");
                            return;
                        }
                        if (standard.is_active) {
                            toast.info("This plan is already active on your account.");
                            return;
                        }
                        const destUrl = `/choosestandard?plan=standard&duration=${active}`;
                        const destState = { planName: "Standard", subtitle: "Deep & specialized courses", priceInr: standard.inr, priceUsd: standard.usd, duration: active };
                        if (!isAuthenticated) {
                            navigate("/login", { state: { from: destUrl, ...destState } });
                        } else {
                            navigate(destUrl, { state: destState });
                        }
                    }}
                        className={`join-now-btn standard-access-btn ${(isAdmin || standard.is_active) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >{isAdmin ? "Admin Access Enabled" : (standard.is_active ? "Active Plan" : "Choose Plan")}</button>
                </div>

                <div className="pricing-card premium-access">
                    <div className="best-value-badge">Best Value</div>

                    <div className="card-header">
                        <h2 className="card-title">Premium</h2>
                        <p className="card-subtitle">Research-Level AI Education</p>
                    </div>

                    <div className="full-access-pricing">
                        <div className="full-divider"></div>

                        <div className="full-price-row">
                            <div className="price-group">
                                <span className="currency">₹</span>
                                <span className="price-large">{premium.inr}</span>
                                {/* <span className="price-strikethrough">₹9,999</span> */}
                                <span className="price-period">{periodLabel}</span>
                            </div>
                            <div className="price-divider"></div>
                            <div className="price-group">
                                <span className="currency-small">$</span>
                                <span className="price-medium">{premium.usd}</span>
                                {/* <span className="price-strikethrough-small">$75</span> */}
                                <span className="price-period-small">{periodLabel}</span>
                            </div>
                        </div>

                        <div className="full-divider"></div>

                        <h3 className="plus-title3">CAT-IA + CAT-IB + CAT-II</h3>

                        <div className="feature-list">
                            <div className="feature-item">
                                <svg className="check-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_63_707)">
                                        <path d="M5.62508 12.2501L15.0834 2.79175L16.2917 4.04175L5.62508 14.7084L0.666748 9.75008L1.91675 8.50008L5.62508 12.2501Z" fill="#0F9C0F" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_63_707">
                                            <rect width="16" height="16" fill="white" transform="translate(0.5 0.5)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span>Complete theoretical curriculum</span>
                            </div>
                            <div className="feature-item">
                                <svg className="check-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_63_711)">
                                        <path d="M5.62508 12.2501L15.0834 2.79175L16.2917 4.04175L5.62508 14.7084L0.666748 9.75008L1.91675 8.50008L5.62508 12.2501Z" fill="#0F9C0F" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_63_711">
                                            <rect width="16" height="16" fill="white" transform="translate(0.5 0.5)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span>Mathematical derivations</span>
                            </div>
                            <div className="feature-item">
                                <svg className="check-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_63_715)">
                                        <path d="M5.62508 12.2501L15.0834 2.79175L16.2917 4.04175L5.62508 14.7084L0.666748 9.75008L1.91675 8.50008L5.62508 12.2501Z" fill="#0F9C0F" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_63_715">
                                            <rect width="16" height="16" fill="white" transform="translate(0.5 0.5)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span>Research paper reading sessions</span>
                            </div>
                            <div className="feature-item">
                                <svg className="check-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_63_719)">
                                        <path d="M5.62508 12.2501L15.0834 2.79175L16.2917 4.04175L5.62508 14.7084L0.666748 9.75008L1.91675 8.50008L5.62508 12.2501Z" fill="#0F9C0F" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_63_719">
                                            <rect width="16" height="16" fill="white" transform="translate(0.5 0.5)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span>Paper implementation walkthroughs</span>
                            </div>

                            <div className="feature-item">
                                <svg className="check-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_63_723)">
                                        <path d="M5.62508 12.2501L15.0834 2.79175L16.2917 4.04175L5.62508 14.7084L0.666748 9.75008L1.91675 8.50008L5.62508 12.2501Z" fill="#0F9C0F" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_63_723">
                                            <rect width="16" height="16" fill="white" transform="translate(0.5 0.5)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span>State-of-the-art architecture analysis</span>
                            </div>
                            <div className="feature-item">
                                <svg className="check-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_63_727)">
                                        <path d="M5.62508 12.2501L15.0834 2.79175L16.2917 4.04175L5.62508 14.7084L0.666748 9.75008L1.91675 8.50008L5.62508 12.2501Z" fill="#0F9C0F" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_63_727">
                                            <rect width="16" height="16" fill="white" transform="translate(0.5 0.5)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span>Advanced capstone projects</span>
                            </div>
                            <div className="feature-item">
                                <svg className="check-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_63_731)">
                                        <path d="M5.62508 12.2501L15.0834 2.79175L16.2917 4.04175L5.62508 14.7084L0.666748 9.75008L1.91675 8.50008L5.62508 12.2501Z" fill="#0F9C0F" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_63_731">
                                            <rect width="16" height="16" fill="white" transform="translate(0.5 0.5)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span>Research mentorship</span>
                            </div>





                            <div className="feature-item">
                                <svg className="check-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_63_723)">
                                        <path d="M5.62508 12.2501L15.0834 2.79175L16.2917 4.04175L5.62508 14.7084L0.666748 9.75008L1.91675 8.50008L5.62508 12.2501Z" fill="#0F9C0F" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_63_723">
                                            <rect width="16" height="16" fill="white" transform="translate(0.5 0.5)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span>Certificate of Excellence</span>
                            </div>
                            <div className="feature-item">
                                <svg className="check-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_63_727)">
                                        <path d="M5.62508 12.2501L15.0834 2.79175L16.2917 4.04175L5.62508 14.7084L0.666748 9.75008L1.91675 8.50008L5.62508 12.2501Z" fill="#0F9C0F" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_63_727">
                                            <rect width="16" height="16" fill="white" transform="translate(0.5 0.5)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span>Priority support</span>
                            </div>
                            <div className="feature-item">
                                <svg className="check-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_63_731)">
                                        <path d="M5.62508 12.2501L15.0834 2.79175L16.2917 4.04175L5.62508 14.7084L0.666748 9.75008L1.91675 8.50008L5.62508 12.2501Z" fill="#0F9C0F" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_63_731">
                                            <rect width="16" height="16" fill="white" transform="translate(0.5 0.5)" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <span>Future premium course updates</span>
                            </div>



                            <div className="mt-2">
                                <span className="text-[#9E8236] text-lg font-[600]">Who is this for:</span>
                                <p className="text-[15px] text-gray-700 font-[300]">Researchers, M.Tech/PhD students, AI Scientists, Advanced ML Engineers</p>
                            </div>


                            <div className="flex items-center mt-4 cursor-pointer gap-2" onClick={() => navigate("/showallcourses")}>
                                <span className="text-sm font-semibold text-blue-700 leading-none">
                                    View Courses
                                </span>
                                <FaArrowRight className="text-blue-700 text-base" />
                            </div>
                        </div>
                    </div>

                    {/* <Link to="/choosepremium" className="join-now-btn premium-access-btn">Get Full Access | Join Now</Link> */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            if (isAdmin) {
                                toast.info("Full Access active via Administrative account.");
                                return;
                            }
                            if (premium.is_active) {
                                toast.info("This plan is already active on your account.");
                                return;
                            }
                            const destUrl = `/choosepremium?plan=premium&duration=${active}`;
                            const destState = { planName: "Premium", subtitle: "Complete curriculum & all premium courses", priceInr: premium.inr, priceUsd: premium.usd, duration: active };
                            if (!isAuthenticated) {
                                navigate("/login", { state: { from: destUrl, ...destState } });
                            } else {
                                navigate(destUrl, { state: destState });
                            }
                        }}
                        className={`join-now-btn premium-access-btn ${(isAdmin || premium.is_active) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >{isAdmin ? "Admin Access Enabled" : (premium.is_active ? "Active Plan" : "Choose Plan")}</button>
                </div>

            </div>
        </div>

    )
}

export default SubscriptionCard