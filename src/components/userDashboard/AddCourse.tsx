import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from "../../../src/lib/api";
import { getCourseVideo } from "../../components/courses/utils/courseVideos";

// import { useAppSelector } from "../../../redux/hooks";
// import { selectIsAuthenticated } from "../../../redux/slices/auth";

interface Course {
  id: number;
  title: string;
  course_description: string;
  course_image: string;
  duration: number
  category: string;
  level: string;
  indian_fee: number;
  foreign_fee: number;
  url_link_name: string;
  assignments?: number;
  originalPrice?: string;
}

export default function Showallcourses() {
  const navigate = useNavigate();
  // useAppSelector(selectIsAuthenticated);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/courses/');
        const data = response.data;
        console.log('Fetched courses:', data);

        // Backend returns array directly or inside courses property
        if (Array.isArray(data)) {
          setCourses(data);
        } else if (data.courses && Array.isArray(data.courses)) {
          setCourses(data.courses);
        } else {
          setError('Invalid response format');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to load courses');
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return (
     <div className="min-h-screen flex items-center mt-[-160px] justify-center ">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#174cd2] mx-auto mb-4"></div>

                <p className="text-gray-600  ">
                    Loading Courses...
                </p>
            </div>
        </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Connection Issue</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-gray-900 text-white rounded-full font-semibold hover:bg-black transition-all shadow-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="text-black py-10 bg-white pb-18">
      <div className="max-w-[100vw] sm:max-w-[82vw] md:max-w-[95vw] lg:max-w-[82vw] mx-auto px-6">

        {/* Header */}
        <div className="text-start mb-14">
          <div className="flex items-center justify-start mb-14">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 text-black w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium text-xl text-black">Back</span>
            </button>
          </div>



          <h1
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            className="text-4xl md:text-5xl text-gray-700"
          >
          Select a course
          </h1>



          <p className="text-gray-500 text-lg">
            View all your courses and track its progress
          </p>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {courses.map((course) => {
            const courseUrl = course.url_link_name
              ? `/courses/${course.id}/${course.url_link_name}`
              : `/courses/${course.id}`;

            /* const buyCourseUrl = course.url_link_name
              ? `/buycourse/${course.id}/${course.url_link_name}`
              : `/buycourse/${course.id}`; */

            return (
              <div
                key={course.id}
                className="rounded-xl border border-slate-200 overflow-hidden  flex flex-col h-full bg-white"
              >
                {/* Image */}
                <div className="relative group">
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
                    className="w-full h-56 object-cover  transition duration-500"
                  />

                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-300">
                    <Link
                      to={courseUrl}
                      className="bg-white text-black px-5 py-2 rounded-lg font-semibold"
                    >
                      View Course <i className="ri-arrow-right-line"></i>
                    </Link>
                  </div>
                </div>

                {/* Content */}
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
                            <span className="text-gray-500 sm:text-md text-md ">Assisment</span>
                            <span className="text-start">{course.assignments}</span>
                        </div>
                    </div>

                    <div className="course-divider my-4"></div>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between sm:gap-0  gap-4 md:gap-0 ">
                        <div className="flex flex-nowrap items-center gap-18 sm:gap-6 md:gap-18 lg:gap-6">
                            {/* Indian Fee */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center font-bold text-2xl">
                                    <span className="mr-0.5">₹</span>
                                    <span>{course.indian_fee}</span>
                                </div>
                                <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                                    ₹{course.indian_fee + 2000}
                                </span>
                            </div>

                            {/* Foreign Fee */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center font-bold text-lg sm:text-xl">
                                    <span className="mr-0.5">$</span>
                                    <span>{course.foreign_fee ?? 0}</span>
                                </div>
                                <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                                    ${(course.foreign_fee ?? 0) + 50}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                const slug = course.url_link_name || course.title;
                                navigate(`/buycourse/${course.id}/${slug}`);
                            }}
                            className="w-full md:w-auto bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 cursor-pointer py-3 rounded-lg transition-colors"
                        >
                            Buy Course
                        </button>
                    </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {courses.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-24 h-24 mb-6 text-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No Courses Found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              We couldn't find any courses available at the moment. Please check back later or explore other sections.
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-8 px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition"
            >
              Go to Home
            </button>
          </div>
        )}
      </div>
    </div>

  );
}
