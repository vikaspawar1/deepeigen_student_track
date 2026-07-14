import type { FC } from "react"
import "../landing/courses.css"
import { Link, useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { useAppSelector } from "../../redux/hooks";
import { selectIsAuthenticated } from "../../redux/slices/auth";
import { getCourseVideo } from "./utils/courseVideos";



interface Course {
    id: number;
    title: string;
    course_description: string;
    course_image: string;
    duration: string;
    category: string;
    assignments: number;
    indian_fee: number;
    originalPrice: string;
    url_link_name?: string;
    level: string;
    foreign_fee?: number;
}

interface CourseCardItemProps {
    course: Course;
}

const CourseCardITem: FC<CourseCardItemProps> = ({ course }) => {
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const navigate = useNavigate();

    const courseUrl = course.url_link_name
        ? `/courses/${course.id}/${course.url_link_name}`
        : `/courses/${course.id}`;

    const buyCourseUrl = course.url_link_name
        ? `/buycourse/${course.id}/${course.url_link_name}`
        : `/buycourse/${course.id}`;


    return (
        <>

            <div key={course.id} className="course-card h-full flex flex-col">
                <div className="course-image-container flex-shrink-0">
                    <video
                        src={getCourseVideo(course.title)}
                        poster={
                            course.course_image?.startsWith("http")
                                ? course.course_image
                                : `${api.defaults.baseURL}${course.course_image}`
                        }
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="course-image"
                    />
                    <div className="course-overlay">
                        <Link to={courseUrl} className="view-course-link">View Course <i className="ri-arrow-right-line"></i></Link>
                    </div>
                </div>
                {/* h-full and flex-grow here ensure the content area fills the card */}
                <div className="course-content flex flex-col flex-grow">
                    <h3 className="course-title line-clamp-2 min-h-[3rem]">{course.title}</h3>
                    <p className="course-description line-clamp-2 mt-2">{course.course_description}</p>

                    <div className="flex-grow"></div> {/* Pushes content below to bottom */}

                    {/* <div className="course-divider"></div> */}

                    <div className="course-meta">
                        <div className="meta-item">
                            <span className="text-gray-500 sm:text-md text-md ">Duration</span>
                            <span className="meta-value">{course.duration} Months</span>
                        </div>
                        <div className="meta-divider"></div>
                        <div className="meta-item">
                            <span className="text-gray-500 sm:text-md text-md ">Category</span>
                            <div className="meta-value-wrapper">
                                <span className="meta-value">{course.category}</span>
                                <svg className="info-icon" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7.50008 10.8542C7.61611 10.8542 7.72739 10.8081 7.80944 10.7261C7.89149 10.644 7.93758 10.5327 7.93758 10.4167V6.91671C7.93758 6.80068 7.89149 6.6894 7.80944 6.60735C7.72739 6.5253 7.61611 6.47921 7.50008 6.47921C7.38405 6.47921 7.27277 6.5253 7.19072 6.60735C7.10868 6.6894 7.06258 6.80068 7.06258 6.91671V10.4167C7.06258 10.6582 7.25858 10.8542 7.50008 10.8542ZM7.50008 4.58337C7.65479 4.58337 7.80316 4.64483 7.91256 4.75423C8.02196 4.86362 8.08341 5.012 8.08341 5.16671C8.08341 5.32142 8.02196 5.46979 7.91256 5.57919C7.80316 5.68858 7.65479 5.75004 7.50008 5.75004C7.34537 5.75004 7.197 5.68858 7.0876 5.57919C6.97821 5.46979 6.91675 5.32142 6.91675 5.16671C6.91675 5.012 6.97821 4.86362 7.0876 4.75423C7.197 4.64483 7.34537 4.58337 7.50008 4.58337Z" fill="#1A212F" fillOpacity="0.4" />
                                    <path fillRule="evenodd" clipRule="evenodd" d="M1.22925 7.49996C1.22925 4.03671 4.03683 1.22913 7.50008 1.22913C10.9633 1.22913 13.7709 4.03671 13.7709 7.49996C13.7709 10.9632 10.9633 13.7708 7.50008 13.7708C4.03683 13.7708 1.22925 10.9632 1.22925 7.49996ZM7.50008 2.10413C6.06902 2.10413 4.69657 2.67261 3.68465 3.68453C2.67274 4.69644 2.10425 6.0689 2.10425 7.49996C2.10425 8.93102 2.67274 10.3035 3.68465 11.3154C4.69657 12.3273 6.06902 12.8958 7.50008 12.8958C8.93115 12.8958 10.3036 12.3273 11.3155 11.3154C12.3274 10.3035 12.8959 8.93102 12.8959 7.49996C12.8959 6.0689 12.3274 4.69644 11.3155 3.68453C10.3036 2.67261 8.93115 2.10413 7.50008 2.10413Z" fill="#1A212F" fillOpacity="0.4" />
                                </svg>
                            </div>
                        </div>
                        <div className="meta-divider"></div>
                        <div className="meta-item">
                            <span className="text-gray-500 sm:text-md text-md ">Assignment</span>
                            <span className="text-start">{course.assignments}</span>
                        </div>
                    </div>

                    <div className="course-divider my-4"></div>

                    {/* Prices row — always visible */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-start gap-1">
                            <div className="flex items-center font-bold text-xl sm:text-2xl">
                                <span className="mr-0.5">₹</span>
                                <span>{course.indian_fee}</span>
                            </div>
                            <span className="text-[9px] sm:text-xs text-gray-400 line-through mt-1">
                                ₹{course.indian_fee + 2000}
                            </span>
                        </div>

                        <div className="flex flex-col items-center gap-0.5">
                            <div className="flex items-center font-bold text-base sm:text-xl">
                                <span className="mr-0.5">$</span>
                                <span>{course.foreign_fee ?? 0}</span>
                            </div>
                            <span className="text-[9px] sm:text-xs text-gray-400 line-through">
                                ${(course.foreign_fee ?? 0) + 50}
                            </span>
                        </div>

                        {/* Buy Course button — inline on sm+ screens, hidden on mobile */}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                if (!isAuthenticated) {
                                    navigate("/login", { state: { from: buyCourseUrl } });
                                } else {
                                    navigate(buyCourseUrl);
                                }
                            }}
                            className="hidden sm:block bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 cursor-pointer py-3 rounded-lg transition-colors whitespace-nowrap"
                        >
                            Buy Course
                        </button>
                    </div>

                    {/* Buy Course button — full-width at bottom on mobile only */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            if (!isAuthenticated) {
                                navigate("/login", { state: { from: buyCourseUrl } });
                            } else {
                                navigate(buyCourseUrl);
                            }
                        }}
                        className="sm:hidden mt-3 w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition-colors cursor-pointer text-sm"
                    >
                        Buy Course
                    </button>
                </div>
            </div>

        </>
    )
}

export default CourseCardITem

