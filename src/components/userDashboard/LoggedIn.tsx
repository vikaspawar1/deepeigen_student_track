import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { toPng, toJpeg } from "html-to-image";
import jsPDF from "jspdf";

import { FaPlay } from "react-icons/fa";
import type { SectionType, LoggedInData, Certificate } from "./data/types";
import paylistimg from "../../assets/Logo/playlist.svg";
import api from "../../lib/api";
import { getCourseVideo } from "../courses/utils/courseVideos";
import { CertificateTemplate, type CertificateData, DEFAULT_SIGNATURE_SVG } from "../certificates/CertificateTemplate";




export default function LoggedIn() {
  const [data, setData] = useState<LoggedInData>({
    user: { name: "", email: "", avatar: "", plan: "" },
    currentCourse: { title: "", instructor: "" },
    sections: ["courses", "playlist", "certificates", "ai-labs"],
    customizedCourse: { title: "", lectures: 0, assignments: 0 },
    courses: [],
    playlists: [],
    certificates: [],
    aiLabs: { title: "", description: "" },
    messages: {
      welcome: "",
      courses: { title: "", description: "" },
      certificates: { title: "", description: "" },
      playlists: { title: "", description: "" },
      aiLabs: { title: "", description: "" }
    }
  });
  const [loading, setLoading] = useState(true);
  const [playlistLoading, setPlaylistLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const [activeSection, setActiveSection] = useState<SectionType>("courses");
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  // Recent watch state
  const [recentWatch, setRecentWatch] = useState<{
    video_id?: number;
    video_title: string;
    video_link?: string;
    video_duration?: string;
    video_thumbnail?: string;
    course_id: number;
    course_title: string;
    course_url: string;
    section_id?: number;
    section_title?: string;
    section_url: string;
    module_name?: string;
    completed: boolean;
    watched_at: string;
  } | null>(null);

  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Set active section from location state if provided
  useEffect(() => {
    const locationState = location.state as { activeSection?: SectionType } | null;
    if (locationState?.activeSection) {
      console.log("Setting active section from state:", locationState.activeSection);
      setActiveSection(locationState.activeSection);
    }
  }, [location.state]);

  // import { getRequest } from "../../utils/api";
  // import { API_BASE } from "../../utils/api";



  // Fetch dashboard data with course progress from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // console.log("Fetching dashboard data from API...");
        // console.log("document.cookie:", document.cookie);

        const dashboardResponse = await api.get("/accounts/dashboard/");
        const dashboardData = dashboardResponse.data;

        let playlistsData = null;
        try {
          setPlaylistLoading(true);
          // Fetch default/section-based playlists
          const playlistsResponse = await api.get("/accounts/playlists/");
          playlistsData = playlistsResponse.data;
        } catch (err) {
          console.warn("Failed to fetch playlists, using mock data:", err);
        }

        // Fetch CUSTOM purchased playlists
        let customPlaylistsData = null;
        try {
          const customPlaylistsResponse = await api.get("/customplaylist/my-playlists/");
          customPlaylistsData = customPlaylistsResponse.data;
        } catch (err) {
          console.warn("Failed to fetch custom playlists:", err);
        } finally {
          setPlaylistLoading(false);
        }

        // Fetch certificates data
        let certificatesData = null;
        try {
          const certificatesResponse = await api.get("/accounts/certificates/");
          certificatesData = certificatesResponse.data;
        } catch (err) {
          console.warn("Failed to fetch certificates, using mock data:", err);
        }

        if (dashboardData.success && dashboardData.courses?.courses_list) {
          const transformedCourses = dashboardData.courses.courses_list.map((course: any) => ({
            id: course.id.toString(),
            title: course.title,
            description: course.description || "",
            validity: course.validity || "N/A",
            category: course.category,
            assignments: course.assignments || 0,
            completion: Math.round(course.completion) || 0,
            image: course.course_image || "/placeholder-course.png",
            courseUrl: course.courseUrl || course.url_link_name || "",
            sectionUrl: course.sectionUrl || "overview",
          }));

          const inProgressCourse = transformedCourses.find(
            (c: any) => c.completion > 0 && c.completion < 100
          );
          const currentCourse = inProgressCourse || transformedCourses[0] || null;
          const firstCourse = transformedCourses[0] || null;

          // Combine Playlists: Section-based + Custom Purchased
          const sectionPlaylists = playlistsData?.playlists || [];
          const purchasedCustomPlaylists = customPlaylistsData?.success ? customPlaylistsData.playlists.map((p: any) => ({
            id: `custom-${p.id}`,
            originalId: p.id,
            title: p.title,
            lectures: p.lectures?.length || 0,
            assignments: p.assignments_count || p.assignments?.length || 0,
            isCustom: true
          })) : [];

          const playlistsList = [...purchasedCustomPlaylists, ...sectionPlaylists];
          const fetchedCertificates: Certificate[] = certificatesData?.certificates || [];
          
          const autoGeneratedCertificates: Certificate[] = transformedCourses
            .filter((c: any) => c.completion >= 100)
            .map((c: any) => ({
              id: `CERT-${c.id}`,
              title: c.title,
              completionDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
              grade: '100%',
              image: c.image || '',
              courseId: c.id,
              candidateName: dashboardData.user?.first_name ? `${dashboardData.user.first_name} ${dashboardData.user.last_name || ''}`.trim() : "Student",
              courseName: c.title,
              instructorName: "Sanjeev Sharma",
              instructorDesignation: "CEO, Deep Eigen",
              awardDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
              registrationCode: `0097303-${c.id}`,
            }));

          const existingIds = new Set(fetchedCertificates.map(c => c.id || c.title));
          const certificatesList = [...fetchedCertificates];
          autoGeneratedCertificates.forEach(ac => {
            if (!existingIds.has(ac.id) && !existingIds.has(ac.title)) {
              certificatesList.push(ac);
            }
          });

          const updatedData: LoggedInData = {
            user: {
              name: dashboardData.user?.first_name || "",
              email: dashboardData.user?.email || "",
              avatar: dashboardData.user?.profile_picture || "",
              plan: dashboardData.user?.active_plan || "",
            },
            currentCourse: {
              title: currentCourse?.title || "",
              instructor: currentCourse?.category || "",
            },
            customizedCourse: {
              title: firstCourse?.title || "",
              lectures: (firstCourse?.assignments || 0) * 3,
              assignments: firstCourse?.assignments || 0,
            },
            sections: ["courses", "playlist", "certificates"],
            courses: transformedCourses,
            playlists: playlistsList,
            certificates: certificatesList,
            aiLabs: { title: "AI Labs", description: "Experiment with AI tools to enhance your learning" },
            messages: {
              welcome: "Welcome back!",
              courses: { title: "Courses", description: "View all your courses and track its progress" },
              certificates: { title: "Certificates", description: "View and share all your earned certificates" },
              playlists: { title: "Playlists", description: "View all your playlist of lectures here" },
              aiLabs: { title: "AI Labs", description: "Experiment with AI tools to enhance your learning" }
            }
          };

          setData(updatedData);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Failed to load course data. Using default data.");
        // Update error state if API fails
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);



  // Fetch recent watch data
  useEffect(() => {
    const fetchRecentWatch = async () => {
      try {
        const response = await api.get("/accounts/recent-watch/");
        const data = response.data;

        console.log("Recent watch API response:", data);
        if (data.success && data.recent_watch) {
          setRecentWatch(data.recent_watch);
        } else {
          // Clear recent watch if no data found
          setRecentWatch(null);
        }
      } catch (err) {
        console.warn("Failed to fetch recent watch:", err);
      }
    };

    // Fetch on initial load
    fetchRecentWatch();

    // Re-fetch when user comes back to this tab/page
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("User returned to dashboard, re-fetching recent watch...");
        fetchRecentWatch();
      }
    };

    // Listen for visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Also listen for focus events (when user clicks back from another page)
    window.addEventListener("focus", fetchRecentWatch);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", fetchRecentWatch);
    };
  }, [location.pathname]);



  useEffect(() => {
    const index = data.sections.indexOf(activeSection);
    const currentTab = tabsRef.current[index];

    if (currentTab) {
      const { offsetLeft, offsetWidth } = currentTab;
      setIndicatorStyle({
        left: offsetLeft,
        width: offsetWidth,
      });
    }
  }, [activeSection, data.sections]);






  const handleAddCourseClick = () => {
    navigate("/addcourse");
  };




  //Create handleWatch function to navigate to course view page with course info in state --- vikas 9feb
  const handleWatch = (event?: React.MouseEvent<HTMLButtonElement, MouseEvent> | string) => {
    let courseId: string | undefined;
    let course;

    if (typeof event === "string") {
      courseId = event;
      course = data.courses.find((c) => c.id === courseId);
    } else {
      course = data.courses.find(
        (c) => c.completion > 0 && c.completion < 100
      );
      if (!course && data.courses.length > 0) {
        course = data.courses[0];
      }
    }

    // console.log("handleWatch called:", { 
    //   eventType: typeof event, 
    //   courseId, 
    //   coursesLength: data.courses.length,
    //   foundCourse: course
    // });

    if (!course || !course.id) {
      console.log("No course found to watch");
      return;
    }

    if (!course.id) {
      // console.error("Course ID is missing or invalid", { course, coursesLength: data.courses.length });
      return;
    }

    const courseTitle = (course.title && course.title.trim() !== "") ? course.title : "Default Course";
    const courseUrl = (course.courseUrl && course.courseUrl.trim() !== "") ? course.courseUrl : "course";
    const sectionUrl = (course.sectionUrl && course.sectionUrl.trim() !== "") ? course.sectionUrl : "overview";
    const courseImage = course.image || "";

    console.log("Navigating to course:", { id: course.id, title: courseTitle, courseUrl, sectionUrl });
    navigate(
      `/course-view/${course.id}/${courseUrl}/${sectionUrl}`,
      {
        state: {
          courseTitle: courseTitle,
          courseImage: courseImage,
          returnTo: "/user_dashboard"
        }
      }
    );
  };







  const exportRef = useRef<HTMLDivElement>(null);
  const [exportCertData, setExportCertData] = useState<CertificateData | null>(null);

  const getCertData = (cert: Certificate): CertificateData => ({
    candidateName: cert.candidateName || data.user.name || "Student Name",
    courseName: cert.courseName || cert.title || "Course Name",
    instructorName: cert.instructorName || "Sanjeev Sharma",
    instructorDesignation: cert.instructorDesignation || "CEO, Deep Eigen",
    awardDate: cert.awardDate || cert.completionDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    registrationCode: cert.registrationCode || `0097303-${cert.id || '123'}`,
    signatureImage: cert.signatureImage,
    qrImage: cert.qrImage,
    logoImage: cert.logoImage,
    backgroundImage: cert.backgroundImage,
  });

  const downloadCertificatePDF = async (cert: Certificate) => {
    try {
      const certData = getCertData(cert);
      setExportCertData(certData);
      await new Promise((r) => setTimeout(r, 150));

      if (!exportRef.current) {
        toast.error("Export template element not ready");
        return;
      }

      const imgData = await toPng(exportRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        cacheBust: false,
        imagePlaceholder: DEFAULT_SIGNATURE_SVG,
        style: { transform: "none", margin: "0" },
        filter: (node: HTMLElement) => node.tagName !== "SCRIPT",
      });

      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      const safeCandidate = certData.candidateName.replace(/[^a-z0-9]/gi, "_");
      const safeCourse = certData.courseName.replace(/[^a-z0-9]/gi, "_");
      pdf.save(`certificate_${safeCandidate}_${safeCourse}.pdf`);
      toast.success("Certificate PDF downloaded!");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to generate PDF");
    }
  };

  const downloadCertificateImage = async (cert: Certificate, format: "png" | "jpeg" = "png") => {
    try {
      const certData = getCertData(cert);
      setExportCertData(certData);
      await new Promise((r) => setTimeout(r, 150));

      if (!exportRef.current) {
        toast.error("Export template element not ready");
        return;
      }

      const func = format === "png" ? toPng : toJpeg;
      const dataUrl = await func(exportRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        cacheBust: false,
        imagePlaceholder: DEFAULT_SIGNATURE_SVG,
        style: { transform: "none", margin: "0" },
        filter: (node: HTMLElement) => node.tagName !== "SCRIPT",
      });

      const link = document.createElement("a");
      const safeCandidate = certData.candidateName.replace(/[^a-z0-9]/gi, "_");
      const safeCourse = certData.courseName.replace(/[^a-z0-9]/gi, "_");
      link.download = `certificate_${safeCandidate}_${safeCourse}.${format}`;
      link.href = dataUrl;
      link.click();
      toast.success(`Certificate ${format.toUpperCase()} downloaded!`);
    } catch (err) {
      console.error("Image export error:", err);
      toast.error(`Failed to generate ${format.toUpperCase()} image.`);
    }
  };




  const handleShareLinkedIn = (certificate: Certificate) => {
    const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}&title=${encodeURIComponent(certificate.title)}`;
    window.open(linkedInShareUrl, '_blank');
    setSelectedCertificate(null);
  };




  return (
    <div className="min-h-screen px-0 bg-white font-['Bricolage_Grotesque',-apple-system,Roboto,Helvetica,sans-serif]">
      {/* Loading State */}
      {loading && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#174cd2] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Only show when not loading */}
      {!loading && (
        <>
          <div className="bg-gradient-to-r from-[#2b1062] to-[#6e228c]">
            <div className="px-6 md:px-8 w-[100vw] sm:w-[100vw] md:w-[95vw] lg:w-[100vw] mx-auto lg:px-10 xl:px-36 2xl:px-48">
              {/* Welcome Section */}
              <div className="flex flex-row items-start justify-between mb-6 gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3.5xl mt-10 lg:text-4xl text-white font-normal  capitalize tracking-tight line-clamp-2">
                    Welcome, {data.user.name}
                  </h1>
                  <p className="text-white/80 text-md mt-2 capitalize">
                    Let's continue your learning 
                  </p>
                </div>

                {/* <div className="inline-flex px-3 py-1.5 mt-10 bg-[#0f9c95] text-white text-xs sm:text-sm font-semibold rounded-full flex-shrink-0">
                  {data.user.plan}
                </div> */}
              </div>

              {/* Current Course Card - Shows Recent Watch if available, else shows enrolled course */}
              {(recentWatch || (data.courses && data.courses.length > 0)) ? (
                // Recent Watch Card OR Enrolled Course Card
                <div className="bg-white/12 rounded-xl p-5 md:p-7 mb-15">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                    <div className="flex-1">
                      {recentWatch ? (
                        // Show recent watch data
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            {/* <p className="text-white/70 text-xs uppercase tracking-wider">
                              {recentWatch.video_title ? "Continue Watching" : "Continue Learning"}
                            </p> */}
                            {/* {recentWatch.video_duration && (
                              <span className="text-white/50 text-xs">• {recentWatch.video_duration}</span>
                            )} */}
                            {recentWatch.completed && (
                              <span className="text-green-400 text-xs">• Completed</span>
                            )}
                          </div>
                          <h2 className="text-white text-lg md:text-xl font-semibold tracking-tight line-clamp-1">
                            {recentWatch.video_title || recentWatch.course_title}
                          </h2>
                          <p className="text-white/80 text-sm font-light mt-1 line-clamp-1">
                            {recentWatch.video_title ? recentWatch.course_title : "Continue your learning journey"}
                          </p>
                          {recentWatch.module_name && (
                            <p className="text-white/60 text-xs mt-1">
                              {recentWatch.module_name}
                            </p>
                          )}
                        </>
                      ) : (
                        // Show enrolled course when no recent watch - use first course with progress or first course
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-white/70 text-xs uppercase tracking-wider">Your Course</p>
                          </div>
                          <h2 className="text-white cursor-pointer text-lg md:text-xl font-semibold tracking-tight line-clamp-1">
                            {data.currentCourse?.title || (data.courses && data.courses[0]?.title) || "Start Learning"}
                          </h2>
                          <p className="text-white/80 text-sm font-light mt-1 line-clamp-1">
                            {data.currentCourse?.instructor || (data.courses && data.courses[0]?.category) || "Begin your learning journey"}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Right side: button + watched_at */}
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => {
                          if (recentWatch) {
                            navigate(
                              `/course-view/${recentWatch.course_id}/${recentWatch.course_url}/${recentWatch.section_url}`,
                              {
                                state: {
                                  courseTitle: recentWatch.course_title,
                                  returnTo: "/user_dashboard",
                                },
                              }
                            );
                          } else {
                            handleWatch();
                          }
                        }}
                        className="flex items-center cursor-pointer justify-center gap-2 w-full md:w-auto px-4 py-2 border border-white text-white text-sm md:text-base font-semibold rounded-full hover:bg-white/10 transition"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M8 5.14v14l11-7-11-7z" fill="currentColor" />
                        </svg>
                        {recentWatch ? "Continue Watching" : "Start Learning"}
                      </button>
                      {/* Watched timestamp - below button */}
                      {/* {recentWatch?.watched_at && (
                        <p className="text-white/80 text-xs  text-right">
                          Last watched:{" "}
                          {new Date(recentWatch.watched_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )} */}
                    </div>

                  </div>
                </div>
              ) : (
                // No enrolled course - show empty state
                <div className="bg-white/12 rounded-xl p-5 md:p-7 mb-15">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="text-white text-lg md:text-xl font-semibold tracking-tight">
                        No courses enrolled yet
                      </h2>
                      <p className="text-white/80 text-sm font-light mt-1">
                        Browse our courses and start learning today!
                      </p>
                    </div>
                    <button
                      onClick={() => navigate("/showallcourses")}
                      className="flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2 border border-white text-white text-sm md:text-base font-semibold rounded-full hover:bg-white/10 transition"
                    >
                      Browse Courses
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              <div className="relative">
                {/* Tabs */}
                <div className="flex border-b border-white/20 cursor-pointer overflow-x-auto no-scrollbar relative">
                  {data.sections.map((section, index) => (
                    <button
                      key={section}
                      ref={(el) => { tabsRef.current[index] = el; }}
                      onClick={() => setActiveSection(section)}
                      className={`py-3 text-sm whitespace-nowrap cursor-pointer transition ${index === 0 ? "pl-0 pr-4" : "px-4"} ${activeSection === section
                        ? "text-white font-semibold"
                        : "text-white/70 hover:text-white"
                        }`}
                    >
                      {section.charAt(0).toUpperCase() +
                        section.slice(1).replace("-", " ")}
                    </button>
                  ))}

                  {/* Underline Indicator */}
                  <span
                    className="absolute bottom-0 h-1 bg-white transition-all duration-300"
                    style={{
                      left: indicatorStyle.left,
                      width: indicatorStyle.width,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>



          {/* Main Content */}
          <div className="px-6  w-[100vw] sm:w-[100vw] md:w-[95vw] lg:w-[100vw] mx-auto py-12 md:px-8 lg:px-10 xl:px-36 2xl:px-48">
            {/* Courses Section */}
            {activeSection === "courses" && (
              <>



                {/* Customized Course Card - Only show when user has enrolled courses */}
                {data.courses && data.courses.length > 0 && (
                  <div className="bg-gradient-to-r from-[#6e53e9] to-[#1d2396] rounded-xl p-6 md:p-6 mb-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex flex-col md:flex-row items-center gap-6 text-left">

                        <div>
                          <h3 className="text-white text-xl md:text-2xl font-bold mb-1">
                            {recentWatch && recentWatch.video_id ? recentWatch.video_title : (recentWatch ? recentWatch.course_title : data.customizedCourse.title)}
                          </h3>
                          {/* Show course/module info when watching video */}
                          {recentWatch && recentWatch.video_id ? (
                            <div className="flex items-center justify-start gap-2 text-white/80 text-sm">
                              <span>{recentWatch.course_title}</span>

                            </div>
                          ) : (
                            <div className="flex items-center justify-start gap-3 text-white/80 text-sm">
                              <span>{data.customizedCourse.lectures} Lectures</span>
                              <div className="w-px h-4 bg-white/60"></div>
                              <span>{data.customizedCourse.assignments} Assignments</span>
                            </div>
                          )}
                          {/* Last watched time */}
                          {recentWatch && recentWatch.watched_at && (
                            <p className="text-white/50 text-xs mt-1">
                              {recentWatch.video_id ? 'Last watched' : 'Last accessed'}: {new Date(recentWatch.watched_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (recentWatch && recentWatch.course_id) {
                            navigate(`/course-view/${recentWatch.course_id}/${recentWatch.course_url}/${recentWatch.section_url}`, {
                              state: { courseTitle: recentWatch.course_title, returnTo: "/user_dashboard" }
                            });
                          } else {
                            handleWatch();
                          }
                        }}
                        className="flex items-center justify-center gap-2 px-6 py-3 border border-white text-white text-sm font-semibold rounded-full cursor-pointer transition w-full md:w-auto"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M21.409 9.35306C21.8893 9.60848 22.291 9.98975 22.5712 10.456C22.8514 10.9223 22.9994 11.4561 22.9994 12.0001C22.9994 12.544 22.8514 13.0778 22.5712 13.5441C22.291 14.0104 21.8893 14.3917 21.409 14.6471L8.597 21.6141C6.534 22.7371 4 21.2771 4 18.9681V5.03306C4 2.72306 6.534 1.26406 8.597 2.38506L21.409 9.35306Z" fill="currentColor" />
                        </svg>
                        {recentWatch && recentWatch.video_id ? "Watch Now" : "Play"}
                      </button>
                    </div>
                  </div>
                )}




                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div className="flex-1">
                    <h2 className="text-2xl text-[#1a212f] font-normal tracking-tight">
                      {data.messages.courses.title}
                    </h2>
                  </div>
                  <button
                    onClick={handleAddCourseClick}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-[#174cd2] text-white text-base cursor-pointer font-semibold rounded-lg hover:bg-[#174cd2]/90 transition w-full md:w-auto"
                  >
                    Add Course
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                {/* Courses Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                  {data.courses.map((course) => (
                    <div key={course.id} className="border border-[#1a212f]/24 rounded-xl overflow-hidden hover:shadow-lg transition">
                      {/* Course Image */}
                      <div className="h-62 bg-gray-300 relative overflow-hidden">
                   <video
  src={getCourseVideo(course.title)}
  poster={course.image}
  autoPlay
  muted
  playsInline
  onTimeUpdate={(e) => {
    const video = e.currentTarget;

    if (video.currentTime >= 6) {
      video.currentTime = 0;
      video.play();
    }
  }}
  className="w-full h-full object-cover"
/>
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                          <button
                            onClick={() => {
                              handleWatch(course.id);
                            }}
                            className={`px-6 py-2 text-white text-sm font-semibold rounded-full 
                             flex items-center gap-2 transition
                            ${course.completion === 0
                                ? ""
                                : course.completion === 100
                                  ? "bg-green-600 hover:bg-green-700"
                                  : ""
                              }
  `}
                          >
                            {course.completion === 0 && (
                              <div className="flex gap-2 items-center cursor-pointer ">
                                <FaPlay className="text-xs" /> Start Learning
                              </div>
                            )}
                            {course.completion === 100 && (
                              <div className="flex items-center gap-2">
                                <FaPlay className="text-xs" />
                                Watch Again
                              </div>
                            )}
                            {course.completion > 0 && course.completion < 100 && (
                              <div className="flex items-center gap-2">
                                <FaPlay className="text-xs" />
                                Resume Learning
                              </div>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Course Content */}
                      <div className="p-5">
                        <h3 className="text-[#1a212f] text-xl font-semibold tracking-tight mb-2 line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-[#1a212f]/70 text-sm font-light leading-relaxed mb-3 line-clamp-3">
                          {course.description}
                        </p>

                        <div className="h-px bg-black/8 my-3"></div>

                        {/* Course Meta */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="text-center">
                            <p className="text-[#1a212f]/70 text-xs font-light mb-1">Validity</p>
                            <p className="text-[#1a212f] text-sm font-semibold">{course.validity}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[#1a212f]/70 text-xs font-light mb-1">Category</p>
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-[#1a212f] text-sm font-semibold">{course.category}</span>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M7.0013 10.3548C7.11733 10.3548 7.22861 10.3087 7.31066 10.2267C7.39271 10.1446 7.4388 10.0334 7.4388 9.91732V6.41732C7.4388 6.30129 7.39271 6.19001 7.31066 6.10796C7.22861 6.02591 7.11733 5.97982 7.0013 5.97982C6.88527 5.97982 6.77399 6.02591 6.69194 6.10796C6.6099 6.19001 6.5638 6.30129 6.5638 6.41732V9.91732C6.5638 10.1588 6.7598 10.3548 7.0013 10.3548ZM7.0013 4.08398C7.15601 4.08398 7.30438 4.14544 7.41378 4.25484C7.52318 4.36424 7.58464 4.51261 7.58464 4.66732C7.58464 4.82203 7.52318 4.9704 7.41378 5.0798C7.30438 5.18919 7.15601 5.25065 7.0013 5.25065C6.84659 5.25065 6.69822 5.18919 6.58882 5.0798C6.47943 4.9704 6.41797 4.82203 6.41797 4.66732C6.41797 4.51261 6.47943 4.36424 6.58882 4.25484C6.69822 4.14544 6.84659 4.08398 7.0013 4.08398Z" fill="#1A212F" fillOpacity="0.4" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M0.730469 6.99935C0.730469 3.5361 3.53805 0.728516 7.0013 0.728516C10.4646 0.728516 13.2721 3.5361 13.2721 6.99935C13.2721 10.4626 10.4646 13.2702 7.0013 13.2702C3.53805 13.2702 0.730469 10.4626 0.730469 6.99935ZM7.0013 1.60352C5.57024 1.60352 4.19779 2.172 3.18587 3.18392C2.17396 4.19583 1.60547 5.56829 1.60547 6.99935C1.60547 8.43041 2.17396 9.80286 3.18587 10.8148C4.19779 11.8267 5.57024 12.3952 7.0013 12.3952C8.43237 12.3952 9.80482 11.8267 10.8167 10.8148C11.8286 9.80286 12.3971 8.43041 12.3971 6.99935C12.3971 5.56829 11.8286 4.19583 10.8167 3.18392C9.80482 2.172 8.43237 1.60352 7.0013 1.60352Z" fill="#1A212F" fillOpacity="0.4" />
                              </svg>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-[#1a212f]/70 text-xs font-light mb-1">Assignments</p>
                            <p className="text-[#1a212f] text-sm font-semibold">{course.assignments}</p>
                          </div>
                        </div>

                        <div className="h-px bg-black/8 my-3"></div>

                        {/* Progress Bar */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 h-1.5 bg-black/4 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${course.completion === 100 ? "bg-green-600" : "bg-[#174cd2]"
                                }`}
                              style={{ width: `${course.completion}%` }}
                            ></div>
                          </div>
                          <span className="text-[#1a212f] text-xs font-light">
                            {course.completion}% Completed
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Certificates Section */}
            {activeSection === "certificates" && (
              <>
                {/* Header */}
                <div className="mb-8">
                  <h2 className="text-2xl font-normal text-[#1a212f]">
                    {data.messages.certificates.title}
                  </h2>
                  <p className="text-sm text-[#1a212f]/70 mt-1">
                    Certificates are automatically generated when you complete a course or reach the course end date.
                  </p>
                </div>

                {/* Certificates List or Empty State */}
                {data.certificates.length > 0 ? (
                  <div className="space-y-6">
                    {data.certificates.map((cert) => {
                      const certData = getCertData(cert);
                      return (
                        <div
                          key={cert.id}
                          className="border border-black/10 rounded-xl p-6 bg-white hover:shadow-md transition"
                        >
                          <div className="flex flex-col md:flex-row md:items-center gap-6">
                            {/* Certificate Image / Mini Template Preview */}
                            <div 
                              onClick={() => setSelectedCertificate(cert)}
                              className="w-full md:w-72 h-48 bg-[#1a0b2e] rounded-lg overflow-hidden border border-black/10 cursor-pointer relative shadow-sm flex items-center justify-center group"
                            >
                              <div className="transform scale-[0.32] origin-center pointer-events-none transition-transform group-hover:scale-[0.34]">
                                <CertificateTemplate data={certData} scale={1} />
                              </div>
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-medium text-xs">
                                Click to View Certificate
                              </div>
                            </div>

                            {/* Certificate Details */}
                            <div className="flex-1 space-y-2">
                              <h3 className="text-xl font-bold text-[#1a212f]">
                                {certData.courseName}
                              </h3>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-[#1a212f]/70">
                                <span>Candidate: <strong className="text-[#1a212f]">{certData.candidateName}</strong></span>
                                <span>•</span>
                                <span>Awarded on: <strong className="text-[#1a212f]">{certData.awardDate}</strong></span>
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-xs text-[#1a212f]/60">
                                <span>Grade: <span className="font-semibold text-green-600">{cert.grade || '100%'}</span></span>
                                <span>•</span>
                                <span>Code: <code className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-800">{certData.registrationCode}</code></span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto">
                              <button
                                onClick={() => setSelectedCertificate(cert)}
                                className="px-5 py-2 border border-[#174cd2] text-[#174cd2] cursor-pointer text-sm font-medium rounded-lg hover:bg-blue-50 transition flex items-center justify-center gap-2"
                              >
                                View Certificate
                              </button>
                              <button
                                onClick={() => downloadCertificatePDF(cert)}
                                className="px-5 py-2 bg-[#174cd2] text-white cursor-pointer text-sm font-medium rounded-lg hover:bg-[#174cd2]/90 transition flex items-center justify-center gap-2"
                              >
                                Download PDF
                              </button>
                              <button
                                onClick={() => handleShareLinkedIn(cert)}
                                className="px-5 py-2 border border-gray-300 text-gray-700 cursor-pointer text-xs font-medium rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-1.5"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
                                </svg>
                                LinkedIn
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Empty State */
                  <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center max-w-2xl mx-auto my-6">
                    <div className="w-16 h-16 bg-blue-50 text-[#174cd2] rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 15l-2 5l9-9l-9-9l2 5l-7 4l7 4z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Certificates Earned Yet</h3>
                    <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                      Complete 100% of your course lectures & assignments or reach your course end date to automatically generate your official Deep Eigen Certificate of Completion!
                    </p>
                    <button
                      onClick={() => setActiveSection("courses")}
                      className="px-6 py-3 bg-[#174cd2] text-white text-sm font-semibold rounded-full hover:bg-[#174cd2]/90 transition"
                    >
                      Start / Continue Learning
                    </button>
                  </div>
                )}

                {/* Certificate Preview Modal */}
                {selectedCertificate && (
                  <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={() => setSelectedCertificate(null)}
                  >
                    <div
                      className="relative max-w-5xl w-full bg-[#0b152b] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Modal Header */}
                      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
                        <div>
                          <h2 className="text-xl font-bold text-white">
                            {selectedCertificate.title}
                          </h2>
                          <p className="text-xs text-white/60">
                            Auto-Generated Verified Certificate • Deep Eigen AI Labs
                          </p>
                        </div>

                        {/* Close Button */}
                        <button
                          onClick={() => setSelectedCertificate(null)}
                          className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>

                      {/* Certificate Template Preview Container */}
                      <div className="p-6 flex-1 overflow-auto flex items-center justify-center bg-[#070d1b]">
                        <div className="transform scale-[0.6] sm:scale-[0.75] md:scale-[0.9] origin-center my-4">
                          <CertificateTemplate data={getCertData(selectedCertificate)} scale={1} />
                        </div>
                      </div>

                      {/* Modal Actions */}
                      <div className="flex flex-wrap items-center justify-center gap-3 p-4 bg-white/5 border-t border-white/10">
                        <button
                          onClick={() => downloadCertificatePDF(selectedCertificate)}
                          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition"
                        >
                          Download PDF
                        </button>
                        <button
                          onClick={() => downloadCertificateImage(selectedCertificate, "png")}
                          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium text-sm transition"
                        >
                          Download PNG
                        </button>
                        <button
                          onClick={() => downloadCertificateImage(selectedCertificate, "jpeg")}
                          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium text-sm transition"
                        >
                          Download JPEG
                        </button>
                        <button
                          onClick={() => handleShareLinkedIn(selectedCertificate)}
                          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0077b5] hover:bg-[#0077b5]/90 text-white rounded-lg font-medium text-sm transition"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
                          </svg>
                          Share on LinkedIn
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Hidden Export Render */}
            <div style={{ position: "fixed", left: "-9999px", top: "-9999px", zIndex: -1 }}>
              {exportCertData && (
                <CertificateTemplate ref={exportRef} data={exportCertData} scale={1} />
              )}
            </div>



            

            {/* Playlist Section */}
            {activeSection === "playlist" && (
              <div>
                {/* Header */}
                <div className="flex flex-row items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-normal text-gray-900">{data.messages.playlists.title}</h2>
                  </div>

                  <button
                    onClick={() => navigate("/make_playlist")}
                    className="flex items-center gap-2 bg-[#174cd2] text-white px-4 py-2 cursor-pointer  rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0"
                  >
                    Create Playlist
                    <span className="text-lg">+</span>
                  </button>
                </div>

                {/* Playlist Cards — Skeleton while loading */}
                {playlistLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="border border-gray-200 rounded-xl px-6 py-4 animate-pulse"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gray-200 rounded-full flex-shrink-0" />
                            <div className="h-4 bg-gray-200 rounded w-48" />
                          </div>
                          <div className="hidden md:flex items-center gap-4">
                            <div className="h-3 bg-gray-200 rounded w-20" />
                            <div className="h-3 bg-gray-200 rounded w-24" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.playlists.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <img src={paylistimg} alt="" className="w-14 h-14 opacity-30 mb-4" />
                        <p className="text-gray-500 text-base font-medium">No playlists yet</p>
                        <p className="text-gray-400 text-sm mt-1">Create your first custom playlist to get started.</p>
                      </div>
                    ) : (
                      data.playlists.map((playlist) => (
                        <div
                          key={playlist.id}
                          onClick={() => {
                            if (playlist.isCustom) {
                              navigate(`/playlist-view/${playlist.originalId}`, {
                                state: {
                                  courseTitle: playlist.title,
                                  returnTo: "/user_dashboard",
                                  activeSection: "playlist"
                                }
                              });
                            }
                            // Add navigation for section playlists if needed
                          }}
                          className="border border-gray-300 rounded-xl px-6 py-4 hover:shadow-sm transition cursor-pointer"
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 flex items-center justify-center">
                                <img src={paylistimg} alt="" />
                              </div>
                              <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                {playlist.title}
                                {playlist.isCustom && (
                                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] rounded-md font-bold uppercase tracking-wider">
                                    Custom
                                  </span>
                                )}
                              </h3>
                            </div>
                            <div className="hidden md:flex items-center text-sm text-gray-500 gap-4">
                              <span>{playlist.lectures} Lectures</span>
                              <span className="text-gray-300">|</span>
                              <span>{playlist.assignments} Assignments</span>
                            </div>
                            <div className="flex md:hidden items-center text-sm text-gray-500 gap-3 pl-12">
                              <span>{playlist.lectures} Lectures</span>
                              <span className="text-gray-300">|</span>
                              <span>{playlist.assignments} Assignments</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* AI Labs Section */}
            {activeSection === "ai-labs" && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <h2 className="text-2xl md:text-3.5xl text-[#1a212f] font-semibold mb-4">{data.aiLabs.title}</h2>
                <p className="text-[#1a212f]/70 text-base">{data.aiLabs.description}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}