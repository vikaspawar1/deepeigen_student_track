import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../lib/api";
import { useAppSelector } from "../../redux/hooks";
import { selectIsAuthenticated, selectIsAdmin } from "../../redux/slices/auth";
import { getCourseVideo } from "../courses/utils/courseVideos";



// ─── Types ────────────────────────────────────────────────────────────────────

interface Course {
  id: number;
  title: string;
  category: string;
  url_link_name: string;
  duration?: string;
  level?: string;
  indian_fee?: number;
  foreign_fee?: number;
  course_image?: string;
  selected: number;  // count of selected lectures
  total: number;     // total lectures
  assignments: number; // total course assignments
}

interface Lecture {
  id: string;
  courseId: string;
  title: string;
  selected: boolean;
  lectureNumber?: string;
  lectureName?: string;
  already_owned?: boolean;
}

interface Assignment {
  id: string;
  name: string;
  selected: boolean;
  assignment_type?: string;
  pdf?: string;
  course_title?: string;
}

interface ApiVideo {
  id: number;
  title: string;
  already_owned?: boolean;
}

interface ApiModule {
  name: string;
  videos: ApiVideo[];
}

interface ApiSection {
  part_number: number;
  modules: ApiModule[];
}

interface ApiCourseOverview {
  success: boolean;
  sections: ApiSection[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

// ─── Component ────────────────────────────────────────────────────────────────

export default function MakePlaylist() {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAdmin = useAppSelector(selectIsAdmin);

  // Core state
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<number | null>(null);

  // allLectures holds ALL lectures from every fetched course, preserving selections
  const [allLectures, setAllLectures] = useState<Lecture[]>([]);

  // Cache: courseId -> raw fetched lectures (unselected)
  const [courseLecturesMap, setCourseLecturesMap] = useState<Record<number, Lecture[]>>({});

  // UI state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showAssignments, setShowAssignments] = useState(false);
  const [searchCourse, setSearchCourse] = useState("");
  const [searchLecture, setSearchLecture] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showCourseList, setShowCourseList] = useState(false);
  const [selectAllAssignments, setSelectAllAssignments] = useState(true);

  // Loading/error state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lecturesLoading, setLecturesLoading] = useState(false);
  const [playlistTitle, setPlaylistTitle] = useState("My Custom Playlist");
  const [playlistDescription, setPlaylistDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ─── Derived state ──────────────────────────────────────────────────────────

  // Lectures visible in the panel = only active course's lectures
  const lectures = useMemo(
    () => allLectures.filter(l => l.courseId === String(activeCourseId)),
    [allLectures, activeCourseId]
  );

  // All selected lectures across ALL courses
  const selectedLectures = useMemo(() => allLectures.filter(l => l.selected), [allLectures]);

  const activeCourse = courses.find(c => c.id === activeCourseId);

  // ─── Screen size ────────────────────────────────────────────────────────────

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsTablet(w >= 768 && w < 1024);
      setIsDesktop(w >= 1024);
      if (w >= 1024) setShowCourseList(true);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ─── Fetch courses ──────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get("/courses/");
        const responseData = response.data;

        let coursesArray: any[] = [];
        if (Array.isArray(responseData)) {
          coursesArray = responseData;
        } else if (responseData.courses && Array.isArray(responseData.courses)) {
          coursesArray = responseData.courses;
        } else {
          setError("Invalid response format");
          return;
        }

        const transformed: Course[] = coursesArray.map((c: any) => ({
          id: c.id,
          title: c.title,
          category: c.category,
          url_link_name: c.url_link_name,
          duration: c.duration,
          level: c.level,
          indian_fee: c.indian_fee,
          foreign_fee: c.foreign_fee,
          course_image: c.course_image,
          selected: 0,
          total: 0,
          assignments: c.assignments || 0,
        }));

        setCourses(transformed);
        if (transformed.length > 0) {
          setActiveCourseId(transformed[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load courses");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // ─── Fetch lectures for a course ────────────────────────────────────────────

  const fetchLecturesForCourse = useCallback(
    async (courseId: number, urlLinkName: string): Promise<Lecture[]> => {
      try {
        const response = await api.get(`/courses/${courseId}/${urlLinkName}/overview`);
        const data: ApiCourseOverview = response.data;
        if (!data.success || !data.sections) return [];

        const list: Lecture[] = [];
        data.sections.forEach(section => {
          section.modules.forEach((module, mIdx) => {
            module.videos.forEach((video, vIdx) => {
              list.push({
                id: String(video.id),
                courseId: String(courseId),
                title: video.title,
                selected: false,
                lectureNumber: `${section.part_number}.${mIdx + 1}.${vIdx + 1}`,
                lectureName: video.title,
                already_owned: video.already_owned || false,
              });
            });
          });
        });

        return list;
      } catch {
        return [];
      }
    },
    []
  );

  // ─── Load lectures when active course changes ────────────────────────────────

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!activeCourseId || courses.length === 0) return;

      const course = courses.find(c => c.id === activeCourseId);
      if (!course?.url_link_name) return;

      // Already cached — just merge into allLectures if not already there
      if (courseLecturesMap[activeCourseId]) {
        if (isMounted) {
          setAllLectures(prev => {
            const existingIds = new Set(prev.map(l => l.id));
            const toAdd = courseLecturesMap[activeCourseId].filter(l => !existingIds.has(l.id));
            return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
          });
        }
        return;
      }

      setLecturesLoading(true);
      const fetched = await fetchLecturesForCourse(activeCourseId, course.url_link_name);

      if (fetched.length > 0 && isMounted) {
        // Save to cache
        setCourseLecturesMap(prev => ({ ...prev, [activeCourseId]: fetched }));

        // Update course total
        setCourses(prev =>
          prev.map(c => (c.id === activeCourseId ? { ...c, total: fetched.length } : c))
        );

        // Merge into allLectures (preserving existing selections)
        setAllLectures(prev => {
          const existingIds = new Set(prev.map(l => l.id));
          const toAdd = fetched.filter(l => !existingIds.has(l.id));
          return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
        });
      }

      if (isMounted) setLecturesLoading(false);
    };

    load();
    return () => { isMounted = false; };
  }, [activeCourseId, courses, fetchLecturesForCourse, courseLecturesMap]);

  // ─── Sync course selected counts ────────────────────────────────────────────

  useEffect(() => {
    setCourses(prev =>
      prev.map(course => ({
        ...course,
        selected: allLectures.filter(l => l.courseId === String(course.id) && l.selected).length,
      }))
    );
  }, [allLectures]);

  // ─── Build assignments from selected lectures ────────────────────────────────

  useEffect(() => {
    if (selectedLectures.length === 0 || !showAssignments) {
      setAssignments([]);
      return;
    }

    // Proportional calculation logic (client-side preview)
    const previewAssignments: Assignment[] = [];
    const courseSelections: Record<number, number> = {};

    selectedLectures.forEach(l => {
      const cid = parseInt(l.courseId);
      courseSelections[cid] = (courseSelections[cid] || 0) + 1;
    });

    Object.entries(courseSelections).forEach(([cid, selectedCount]) => {
      const course = courses.find(c => c.id === parseInt(cid));
      if (course && course.total > 0 && course.assignments > 0) {
        // allowed_count = ceil((selected_count / total_lectures) * total_assessments)
        const allowedCount = Math.ceil((selectedCount / course.total) * course.assignments);

        for (let i = 0; i < allowedCount; i++) {
          previewAssignments.push({
            id: `asgn-${cid}-${i}`,
            name: `${course.title} - Assignment ${i + 1}`,
            selected: true
          });
        }
      }
    });

    setAssignments(previewAssignments);
  }, [selectedLectures, showAssignments, courses]);

  // ─── SVG connector paths (desktop) ──────────────────────────────────────────



  // ─── Handlers ───────────────────────────────────────────────────────────────

  const toggleLecture = (lectureId: string) => {
    setAllLectures(prev =>
      prev.map(l => (l.id === lectureId ? { ...l, selected: !l.selected } : l))
    );
  };

  const toggleAssignment = (assignmentId: string) => {
    setAssignments(prev =>
      prev.map(a => (a.id === assignmentId ? { ...a, selected: !a.selected } : a))
    );
  };

  const handleSelectAllAssignments = () => {
    const next = !selectAllAssignments;
    setSelectAllAssignments(next);
    setAssignments(prev => prev.map(a => ({ ...a, selected: next })));
  };


  const handleCourseClick = (courseId: number) => {
    setActiveCourseId(courseId);
    setSearchLecture("");
    if (isMobile) setShowCourseList(false);
  };


  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/make_playlist' } });
      return;
    }

    if (selectedLectures.length === 0) {
      toast.warning("Please select at least one lecture.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post("/customplaylist/create/", {
        title: playlistTitle,
        description: playlistDescription,
        lecture_ids: selectedLectures.map(l => parseInt(l.id)),
        include_assignments: showAssignments,
        duration: 12
      });

      if (response.data.success) {
        navigate(`/playlist-summary/${response.data.playlist_id}`);
      } else {
        toast.error(response.data.message || "Failed to create playlist");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "An error occurred while creating the playlist");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Filtered lists ──────────────────────────────────────────────────────────

  const filteredCourses = courses.filter(
    c =>
      c.title.toLowerCase().includes(searchCourse.toLowerCase()) ||
      c.category.toLowerCase().includes(searchCourse.toLowerCase())
  );

  const filteredLectures = lectures.filter(
    l =>
      l.title.toLowerCase().includes(searchLecture.toLowerCase()) ||
      l.lectureName?.toLowerCase().includes(searchLecture.toLowerCase()) ||
      l.lectureNumber?.toLowerCase().includes(searchLecture.toLowerCase())
  );

  // ─── Group assignments by course for display ─────────────────────────────────

  const groupAssignmentsByCourse = () => {
    const groups: { courseTitle: string; lectures: Lecture[]; assignments: Assignment[] }[] = [];

    const courseMap: Record<string, { lectures: Lecture[]; assignments: Assignment[] }> = {};

    selectedLectures.forEach(l => {
      const course = courses.find(c => String(c.id) === l.courseId);
      if (!course) return;
      if (!courseMap[l.courseId]) {
        courseMap[l.courseId] = { lectures: [], assignments: [] };
      }
      courseMap[l.courseId].lectures.push(l);
    });

    assignments.forEach(a => {
      // id format: asgn-{cid}-{i}
      const parts = a.id.split("-");
      const cid = parts[1];
      if (courseMap[cid]) {
        courseMap[cid].assignments.push(a);
      }
    });

    Object.entries(courseMap).forEach(([cid, data]) => {
      const course = courses.find(c => String(c.id) === cid);
      if (course) {
        groups.push({
          courseTitle: course.title,
          lectures: data.lectures,
          assignments: data.assignments
        });
      }
    });

    return groups;
  };

  // ─── Colors ──────────────────────────────────────────────────────────────────

  const primary = "#174cd2";
  const primaryLight = "rgba(23,76,210,0.08)";

  const border = "#dbe4ff";
  const background = "#f1f4fc";

  // ─── Loading / Error screens ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#174cd2] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Courses..</p>
          </div>
        </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-medium mb-2">Something went wrong</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-full md:max-w-[95vw] lg:max-w-[83.5vw] mx-auto p-4 md:p-6 lg:p-10">

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8 lg:gap-12 mb-10 md:mb-16">
          <div className="flex-1 w-full">
            <h1 className="text-2xl sm:text-2xl md:text-4xl lg:text-4xl text-[#1a212f] font-bold tracking-tight mb-4">
              Create Your Custom Playlist
            </h1>
            <p className="text-base sm:text-md md:text-lg text-gray-600 font-medium max-w-2xl leading-relaxed">
              Tailor your learning journey by selecting specific lectures from our extensive course library.
            </p>
          </div>

          <div className="flex flex-col gap-4 w-full lg:w-auto  p-6 rounded-2xl border border-blue-100/50">

            {/* Row Inputs */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <input
                type="text"
                placeholder="Playlist Name"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm font-[400] focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm"
                value={playlistTitle}
                onChange={(e) => setPlaylistTitle(e.target.value)}
              />

              <textarea
                rows={1}
                className="flex-[2] w-full sm:w-[20vw] md:w-[20vw] lg:w-[20vw] px-4 py-3 border border-gray-300 rounded-xl text-sm font-[400] resize-none overflow-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm"
                value={playlistDescription}
                placeholder="Description (optional)"
                onChange={(e) => {
                  setPlaylistDescription(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
              />
            </div>

            {/* Button */}
            <button
              className="px-6 py-3 text-white text-base sm:text-md font-bold rounded-xl  cursor-pointer w-full lg:min-w-[16rem] transition-all hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-100 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
              style={{ backgroundColor: primary }}
              onClick={handleSubscribe}
              disabled={submitting || selectedLectures.length === 0}
            >
              {submitting ? "Preparing..." : (isAdmin ? "PREPARE FULL ACCESS PLAYLIST" : "SUBSCRIBE TO PLAYLIST")}
            </button>

            {/* Info */}
            {/* <div className="flex  mx-auto items-center gap-1">
              <p className="text-sm font-[400] text-gray-600">
                <span className="text-blue-600 font-black">{selectedLectures.length}</span> lectures selected
              </p>
              <p className="text-sm ml-4 font-[400] text-gray-600 uppercase ">
                Across <span className="text-blue-600 font-black">{assignments.length}</span> assignments
              </p>
            </div> */}

          </div>
        </div>

        {/* Mobile Course Toggle */}
        {isMobile && (
          <div className="mb-4">
            <button
              onClick={() => setShowCourseList(!showCourseList)}
              className="w-full flex justify-between items-center px-4 py-3 bg-white border border-gray-300 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="truncate mr-2">{activeCourse ? activeCourse.title : "Select Course"}</span>
              <svg className={`w-5 h-5 flex-shrink-0 transition-transform ${showCourseList ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[27.438rem_1px_1fr] gap-6 my-8 md:my-12">

          {/* ── Courses Panel ── */}
          {((isDesktop || isTablet) || (isMobile && showCourseList)) && (
            <div className={`flex flex-col gap-3.5 ${isMobile && showCourseList ? "fixed inset-0 z-50 bg-white p-4 overflow-y-auto" : ""}`}>
              {isMobile && showCourseList && (
                <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-4 pt-2">
                  <h2 className="text-xl font-semibold text-[#1a212f]">Courses</h2>
                  <button onClick={() => setShowCourseList(false)} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              <h2 className="text-lg md:text-xl lg:text-[1.375rem] text-[#1a212f] font-normal leading-8">Courses</h2>

              <div className="mb-4 md:mb-5">
                <input
                  type="text"
                  placeholder="Search courses…"
                  className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-lg text-sm md:text-base text-gray-700 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={searchCourse}
                  onChange={e => setSearchCourse(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-3">
                {filteredCourses.map(course => (
                  <div
                    key={course.id}
                    className="flex items-center gap-4 md:gap-5 p-3 md:p-4 rounded-lg cursor-pointer transition-all border"
                    style={{
                      borderColor: activeCourseId === course.id ? primary : "transparent",
                      backgroundColor: activeCourseId === course.id ? primaryLight : "transparent",
                    }}
                    onClick={() => handleCourseClick(course.id)}
                  >
                    {/* Course image or category badge */}
                    {course.course_image ? (
                      <video
                        src={getCourseVideo(course.title)}
                        poster={`${api.defaults.baseURL}${course.course_image}`}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-20 md:w-32 h-16 md:h-[5.625rem] rounded-md object-cover shrink-0"
                      />
                    ) : (
                      <div className="flex justify-center items-center p-4 md:p-[1.625rem] rounded-md bg-gradient-to-b from-[#000155] to-[#153f9a] text-white text-sm md:text-base font-bold leading-tight text-center shrink-0 w-20 md:w-32 h-16 md:h-[5.625rem]">
                        <span className="text-xs md:text-sm line-clamp-2">{course.category}</span>
                      </div>
                    )}

                    <div className="flex-1 flex flex-col gap-1 md:gap-2 min-w-0">
                      <h3 className="text-sm md:text-base text-[#1a212f] font-bold leading-snug line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-xs md:text-sm text-[#1a212f] font-normal leading-6">
                        <span className="font-bold" style={{ color: primary }}>{course.selected}</span>
                        /{course.total} lectures{course.selected > 0 ? " selected" : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          {isDesktop && <div className="bg-[rgba(26,33,47,0.24)] self-stretch hidden lg:block" />}

          {/* ── Lectures Panel ── */}
          <div className="flex flex-col gap-3.5">
            <div className="flex justify-between items-center">
              <h2 className="text-lg md:text-xl lg:text-[1.375rem] text-[#1a212f] font-normal leading-8">
                Lectures {isMobile && activeCourse ? `- ${activeCourse.title}` : ""}
              </h2>
            </div>

            {activeCourseId && (
              <div className="mb-4 md:mb-5">
                <input
                  type="text"
                  placeholder="Search lectures…"
                  className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-lg text-sm md:text-base text-gray-700 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={searchLecture}
                  onChange={e => setSearchLecture(e.target.value)}
                />
              </div>
            )}

            <div
              className="relative rounded-xl md:rounded-2xl border border-[#4e4e4f9d] p-1 md:p-1.5 overflow-hidden min-h-[300px] md:min-h-[400px]"
              style={{ backgroundColor: background }}
            >
              {lecturesLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div
                    className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: primary, borderTopColor: "transparent" }}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-2 md:gap-2.5 max-h-[45rem] overflow-y-auto p-3 md:p-4 lg:p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {filteredLectures.length === 0 && !lecturesLoading && (
                    <div className="text-center py-10 text-gray-400 text-sm">
                      {activeCourseId ? "No lectures found." : "Select a course to view lectures."}
                    </div>
                  )}

                  {filteredLectures.map(lecture => (
                    <div
                      key={lecture.id}
                      className="flex justify-between items-start rounded-lg cursor-pointer transition-all p-4 md:p-6 border"
                      style={{
                        borderColor: lecture.selected ? primary : "transparent",
                        backgroundColor: lecture.selected ? "rgba(23,76,210,0.2)" : "white",
                        cursor: "pointer"
                      }}
                      onClick={() => toggleLecture(lecture.id)}
                    >
                      <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
                        <svg className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0" viewBox="0 0 32 32" fill="none">
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M16.0013 29.3333C23.3653 29.3333 29.3346 23.364 29.3346 16C29.3346 8.636 23.3653 2.66666 16.0013 2.66666C8.6373 2.66666 2.66797 8.636 2.66797 16C2.66797 23.364 8.6373 29.3333 16.0013 29.3333ZM14.26 21.128L20.5533 17.412C21.5946 16.796 21.5946 15.204 20.5533 14.588L14.26 10.872C13.2466 10.2747 12.0013 11.0533 12.0013 12.2853V19.716C12.0013 20.9467 13.2466 21.7253 14.26 21.128Z"
                            fill="#174CD2"
                          />
                        </svg>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm md:text-base text-[#1a212f] font-normal leading-[1.4] line-clamp-2">
                              {lecture.title}
                            </span>
                          </div>
                          {lecture.lectureNumber && (
                            <span className="text-xs md:text-sm text-gray-600 mt-1 line-clamp-1">
                              {lecture.lectureNumber}: {lecture.lectureName}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex p-1 flex-col justify-center items-center ml-2">
                        <div className="relative flex p-1.5 md:p-2.5 justify-center items-center rounded-full">
                          {lecture.selected ? (
                            <>
                              <div className="w-4 h-4 md:w-[1.125rem] md:h-[1.125rem] rounded-[0.125rem]" style={{ backgroundColor: primary }} />
                              <svg className="absolute w-5 h-5 md:w-6 md:h-6 left-1.5 top-1.5 md:left-2 md:top-2" viewBox="0 0 24 24" fill="none">
                                <path d="M10 16.4L6 12.4L7.4 11L10 13.6L16.6 7L18 8.4L10 16.4Z" fill="white" />
                              </svg>
                            </>
                          ) : (
                            <div className="w-4 h-4 md:w-[1.125rem] md:h-[1.125rem] rounded-[0.125rem] border-2 border-[#49454f]" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>






        {/* ── Assignments Section ── */}
        <div className="border-b border-[rgba(26,33,47,0.12)] pb-6 md:pb-8">
          <h2 className="text-lg md:text-xl font-semibold text-[#1A212F] mb-2 md:mb-3">Assignments</h2>
        Assignments are an integral part of each subscription plans, thoughtfully designed to support your learning. While we are unable to tailor assignments for every custom plan, we offer prepared assignments related to your selected lectures for a nominal fee.
        </div>

        {/* Custom Assignment Toggle */}
        <div className="mt-6 md:mt-8 flex items-center">
          <input
            type="checkbox"
            id="custom-assignment"
            checked={showAssignments}
            onChange={() => setShowAssignments(!showAssignments)}
            className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 cursor-pointer rounded border-gray-300"
            style={{ accentColor: primary }}
          />
          <label htmlFor="custom-assignment" className="text-base md:text-lg lg:text-xl cursor-pointer text-[#1A212F]">
          I want a custom made assignment
          </label>
        </div>

        {/* Assignments Panel */}
        {showAssignments && (
          <div
            className="mt-6 rounded-2xl border p-4 md:p-6"
            style={{ borderColor: border, backgroundColor: background }}
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-[#1A212F] hidden md:block">Selected Lectures</h3>
                <h3 className="text-lg font-semibold text-[#1A212F] md:hidden">Related Assignments</h3>
                <p className="text-sm text-gray-600 mt-1">Related Assignments ({assignments.length} Selected)</p>
              </div>

              <button
                onClick={handleSelectAllAssignments}
                className="flex items-center gap-2 px-4 py-2 bg-white border text-blue-800 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full md:w-auto justify-center"
              >
                <div
                  className="w-5 h-5 border rounded flex items-center justify-center"
                  style={{
                    backgroundColor: selectAllAssignments ? primary : "white",
                    borderColor: selectAllAssignments ? primary : "#d1d5db",
                  }}
                >
                  {selectAllAssignments && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium">Select All</span>
              </button>
            </div>

            {/* Groups */}
            {groupAssignmentsByCourse().map(group => (
              <div
                key={group.courseTitle}
                className="rounded-xl border border-[#dbe4ff] bg-[#f3f6ff] p-4 md:p-6 mb-6"
              >
                <p className="text-xs text-gray-500 mb-4 line-clamp-1">{group.courseTitle}</p>

                <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-8">
                  {/* Left — Lectures List (Scrollable) */}
                  <div className="flex flex-col gap-2 flex-1 max-w-full md:max-w-[400px]">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Selected Lectures ({group.lectures.length})</h4>
                    <div className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                      {group.lectures.map(lecture => (
                        <div
                          key={lecture.id}
                          className="bg-white rounded-lg px-4 py-3 text-sm font-medium text-[#1A212F]  border border-gray-200 mb-2"
                        >
                          {lecture.lectureNumber}: {lecture.lectureName}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right — Assignments preview for this course */}
                  <div className="flex flex-col gap-3 flex-1 max-w-full md:max-w-[400px]">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Included Assignments ({group.assignments.length})</h4>
                    <div className="flex flex-col gap-2">
                      {group.assignments.map((asgn) => (
                        <AssignmentCard
                          key={asgn.id}
                          assignment={asgn}
                          onToggle={toggleAssignment}
                          primary={primary}
                        />
                      ))}
                      {group.assignments.length === 0 && (
                        <div className="rounded-lg px-4 py-3 border-2 border-dashed border-gray-300 bg-white text-sm text-gray-400 text-center">
                          No assignments for this selection
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {selectedLectures.length === 0 && (
              <div className="text-center py-10 text-gray-500 text-sm">
                Select lectures to generate assignments.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Assignment Card Sub-component ────────────────────────────────────────────

function AssignmentCard({
  assignment,
  onToggle,
  primary,
  mobile = false,
}: {
  assignment: Assignment;
  onToggle: (id: string) => void;
  primary: string;
  mobile?: boolean;
}) {
  return (
    <div
      onClick={() => onToggle(assignment.id)}
      className={`rounded-lg px-4 md:px-6 py-4 flex justify-between items-center cursor-pointer transition-all border-2 ${mobile ? "mb-6" : ""}`}
      style={{
        backgroundColor: assignment.selected ? primary : "white",
        borderColor: assignment.selected ? primary : "#d1d5db",
      }}
    >
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${assignment.selected ? "text-white" : "text-[#1A212F]"}`}>
          {assignment.name}
        </span>
      </div>

      <div
        className="w-6 h-6 rounded-full flex items-center justify-center border-2"
        style={{
          backgroundColor: assignment.selected ? "white" : "transparent",
          borderColor: assignment.selected ? "white" : "#d1d5db",
        }}
      >
        {assignment.selected && (
          <svg className="w-4 h-4" fill="none" stroke={primary} viewBox="0 0 24 24">
            <path strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </div>
  );
}