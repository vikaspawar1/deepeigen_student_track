import React, { useState, useEffect, useCallback } from 'react';
import './styles/courseView.css';
import { ChevronLeft } from 'lucide-react';

// Responsive chevron icon size
const useChevronSize = () => {
  const [size, setSize] = useState(() => {
    if (typeof window === 'undefined') return 26;
    if (window.innerWidth <= 375) return 20;
    if (window.innerWidth <= 640) return 22;
    if (window.innerWidth <= 1024) return 24;
    return 26;
  });
  useEffect(() => {
    const update = () => {
      if (window.innerWidth <= 375) setSize(20);
      else if (window.innerWidth <= 640) setSize(22);
      else if (window.innerWidth <= 1024) setSize(24);
      else setSize(26);
    };
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return size;
};
import { useParams, useLocation } from 'react-router-dom';
import video_c from '../../assets/Hero/Videos/drone.mp4';
import SideBar from './ui/SideBar';
import VideoPlayer from './ui/VideoPlayer';
import type { Week, TabType, Lecture, Assignment } from './types/courseView';

import Overview from './ui/Overview';
import DiscussionForum from './ui/DiscussionForum';
import Announcements from './ui/Announcements';
import Assignments from './ui/Assignments';
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { getCourseVideo } from "../courses/utils/courseVideos";



// Interface for API response
interface CourseAPIResponse {
  success: boolean;
  course: {
    id: number;
    title: string;
    level: string;
    category: string;
  };
  sections: SectionData[];
  enrolled_user: {
    id: number;
    enrolled: boolean;
    end_at: string;
    full_access_flag: boolean;
    no_of_installments: number;
  } | null;
  title: string;
  canonical_url: string;
}

interface VideoData {
  id: number;
  title: string;
  link: string;
  type: string;
  duration: string;
}

interface ModuleData {
  id: number;
  name: string;
  title: string;
  videos: VideoData[];
}

interface SectionData {
  id: number;
  name: string;
  title: string;
  part_number: number;
  estimated_time?: string;
  total_assignments?: number;
  modules: ModuleData[];
}

const Index: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const chevronSize = useChevronSize();

  const params = useParams();
  const courseIdStr = params.id;
  const courseUrl = params.course_url || params.slug;
  const sectionUrl = params.section_url || params.sectionUrl;
  const courseId = courseIdStr ? parseInt(courseIdStr, 10) : undefined;
  const playlistIdStr = params.playlistId;
  const playlistId = playlistIdStr ? parseInt(playlistIdStr, 10) : undefined;

  // Get course title and image from navigation state
  const courseTitle = location.state?.courseTitle || '';
  const courseImage = location.state?.courseImage || null;


  // State for real data
  const [courseData, setCourseData] = useState<CourseAPIResponse | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playlistAssignments, setPlaylistAssignments] = useState<Assignment[] | undefined>(undefined);

  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const isReady = (courseId && courseUrl && sectionUrl) || !!playlistId; // Updated readiness check
  const [accessibleSectionIds, setAccessibleSectionIds] = useState<Set<number> | null>(null);
  // Video player state
  const [currentLecture, setCurrentLecture] = useState<Lecture | null>(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');

  // Tabs configuration
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'forum', label: 'Discussion' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'assignments', label: 'Assignments' }
  ];

  useEffect(() => {
    const fetchCourseData = async () => {
      // Handle Playlist View
      if (playlistId) {
        try {
          setLoading(true);
          setError(null);

          const response = await api.get(`/customplaylist/details/${playlistId}/`);
          const data = response.data;
          console.log('Playlist API Response:', data);

          if (data.success && data.playlist) {
            const playlist = data.playlist;

            // Set playlist assignments
            if (playlist.include_assignments && playlist.assignments) {
              setPlaylistAssignments(playlist.assignments);
            }

            // Transform lectures into Week format
            const lectures = playlist.lectures || [];
            
            // Group lectures by course title
            const courseGroups: { [courseTitle: string]: Lecture[] } = {};
            lectures.forEach((lecture: any) => {
              const courseTitle = lecture.course || "General";
              if (!courseGroups[courseTitle]) {
                courseGroups[courseTitle] = [];
              }
              courseGroups[courseTitle].push({
                id: lecture.id,
                title: lecture.title,
                duration: lecture.duration || '00:00',
                completed: false,
                videoUrl: lecture.videoUrl || lecture.link,
                videoId: lecture.id,
                sectionId: playlist.id, // Mark section ID as accessible
                course_id: lecture.course_id,
                course_url: lecture.course_url,
                section_url: lecture.section_url
              });
            });

            const sections = Object.keys(courseGroups).map(courseTitle => ({
              name: courseTitle,
              lectures: courseGroups[courseTitle]
            }));

            const playlistWeeks: Week[] = [
              {
                id: 1,
                name: playlist.title || "Custom Playlist",
                sections: sections
              }
            ];

            setWeeks(playlistWeeks);
            if (playlistWeeks.length > 0) {
              setExpandedWeeks([playlistWeeks[0].id]);
              // Select first lecture by default
              if (sections.length > 0 && sections[0].lectures.length > 0) {
                const firstLecture = sections[0].lectures[0];
                setCurrentLecture(firstLecture);
                setCurrentVideoUrl(firstLecture.videoUrl || '');

              }
            }

            // Since it is a playlist view, all its sections are accessible
            const accessibleIds = new Set<number>();
            accessibleIds.add(playlist.id);
            setAccessibleSectionIds(accessibleIds);

            // Mock/simulated CourseAPIResponse to prevent other sub-components from crashing
            setCourseData({
              success: true,
              course: {
                id: playlist.id,
                title: playlist.title,
                level: 'Custom',
                category: 'Playlist'
              },
              sections: [],
              enrolled_user: {
                id: playlist.id,
                enrolled: true,
                end_at: '',
                full_access_flag: true,
                no_of_installments: 1
              },
              title: playlist.title,
              canonical_url: ''
            });

          } else {
            setError(data.message || 'Failed to load playlist data');
          }
        } catch (err) {
          console.error('Failed to fetch playlist data:', err);
          setError('Failed to load playlist data. Please try again.');
        } finally {
          setLoading(false);
        }
        return;
      }

      // Handle Standard Course
      if (!courseId || !courseUrl) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);


        const response = await api.get(`/courses/${courseId}/${courseUrl}/overview`);
        const data: CourseAPIResponse = response.data;
        console.log('API Response course view:', data);


        if (data.success) {
          setCourseData(data);

          // Transform sections to weeks format
          let weeksData: Week[] = transformSectionsToWeeks(data.sections);

          // Fetch video progress to get completed videos
          try {
            console.log('Fetching video progress for course:', courseId);
            const progressResponse = await api.get(`/courses/${courseId}/get-video-progress/`);
            const progressData = progressResponse.data;

            if (progressData.success && progressData.data && Array.isArray(progressData.data.completed_videos)) {
              const completedVideoIds = new Set(progressData.data.completed_videos.map((v: any) => v.video_id));
              // Mark lectures as completed in weeksData
              weeksData = weeksData.map(week => ({
                ...week,
                sections: week.sections.map(section => ({
                  ...section,
                  lectures: section.lectures.map(lecture => ({
                    ...lecture,
                    completed: completedVideoIds.has(lecture.videoId || lecture.id)
                  }))
                }))
              }));
            }
          } catch (progressErr) {
            console.warn('Failed to fetch video progress:', progressErr);
          }

          try {
            console.log('Fetching accessible sections for course:', courseId);
            const accessResponse = await api.get(`/courses/${courseId}/sections/accessible/`);
            
            // The backend returns the data inside a 'data' object: { success: true, data: { sections: [...] } }
            if (accessResponse.data && accessResponse.data.success && accessResponse.data.data) {
              const accessibleIds = new Set<number>();
              const sections = accessResponse.data.data.sections;
              
              if (Array.isArray(sections)) {
                sections.forEach((section: { id: number }) => {
                  accessibleIds.add(section.id);
                });
                console.log(` Loaded ${accessibleIds.size} accessible sections`);
              }
              setAccessibleSectionIds(accessibleIds);
            } else {
              console.warn(' Access API success flag is false or data is missing');
            }
          } catch (accessErr) {
            console.warn(' Failed to fetch access data:', accessErr);
            // On error, we still want to keep the restricted state unless we explicitly decided otherwise
          }

          setWeeks(weeksData);

          // Expand first week by default
          if (weeksData.length > 0) {
            setExpandedWeeks([weeksData[0].id]);
          }

          // Track last accessed course when course is loaded
          try {
            await api.post('/accounts/track-last-accessed-course/', {
              course_id: courseId,
            });
            console.log('Course access tracked for course ID:', courseId);
          } catch (trackErr) {
            console.warn('Failed to track course access:', trackErr);
          }
        } else {
          setError('Failed to load course data');
        }
      } catch (err) {
        console.error('Failed to fetch course data:', err);
        setError('Failed to load course data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, courseUrl, playlistId]);







  const transformSectionsToWeeks = (sections: SectionData[]): Week[] => {
    const weekMap = new Map<number, Week>();

    sections.forEach((section) => {
      const weekId = section.part_number;

      if (!weekMap.has(weekId)) {
        weekMap.set(weekId, {
          id: weekId,
          name: `Week - ${weekId}`,
          sections: []
        });
      }

      const week = weekMap.get(weekId)!;

      // Map section name to expected format
      let sectionName = 'Main Lectures';
      if (section.name.toLowerCase().includes('ta')) {
        sectionName = 'TA-Lectures';
      } else if (section.name.toLowerCase().includes('programming')) {
        sectionName = 'Programming Lectures';
      } else if (section.name.toLowerCase().includes('assignment')) {
        sectionName = 'Assignments';
      }

      // Check if section already exists
      let existingSection = week.sections.find(s => s.name === sectionName);
      if (!existingSection) {
        existingSection = {
          name: sectionName,
          lectures: []
        };
        week.sections.push(existingSection);
      }

      // Process modules and their videos
      if (section.modules && section.modules.length > 0) {
        section.modules.forEach((module) => {
          // Group videos by type within this module
          const mainVideos = module.videos.filter(v => v.type === 'main_lectures');
          const taVideos = module.videos.filter(v => v.type === 'ta_lectures');
          const progVideos = module.videos.filter(v => v.type === 'programming_lectures');


          // Add main lectures
          mainVideos.forEach((video) => {
            existingSection!.lectures.push({
              id: video.id,
              title: video.title,
              duration: video.duration || '00:00',
              completed: false,
              videoUrl: video.link,
              videoId: video.id,
              sectionId: section.id // Store the parent section ID for access control
            });
          });

          // Add TA lectures if any
          if (taVideos.length > 0) {
            let taSection = week.sections.find(s => s.name === 'TA-Lectures');
            if (!taSection) {
              taSection = {
                name: 'TA-Lectures',
                lectures: []
              };
              week.sections.push(taSection);
            }
            taVideos.forEach((video) => {
              taSection!.lectures.push({
                id: video.id,
                title: video.title,
                duration: video.duration || '00:00',
                completed: false,
                videoUrl: video.link,
                videoId: video.id,
                sectionId: section.id // Store the parent section ID for access control
              });
            });
          }

          // Add programming lectures if any
          if (progVideos.length > 0) {
            let progSection = week.sections.find(s => s.name === 'Programming Lectures');
            if (!progSection) {
              progSection = {
                name: 'Programming Lectures',
                lectures: []
              };
              week.sections.push(progSection);
            }
            progVideos.forEach((video) => {
              progSection!.lectures.push({
                id: video.id,
                title: video.title,
                duration: video.duration || '00:00',
                completed: false,
                videoUrl: video.link,
                videoId: video.id,
                sectionId: section.id // Store the parent section ID for access control
              });
            });
          }
        });
      } else {
        // Fallback: use section data as lecture if no modules
        existingSection.lectures.push({
          id: section.id,
          title: section.title || section.name,
          duration: section.estimated_time || '00:00',
          completed: false,
          sectionId: section.id // Store the parent section ID for access control
        });
      }
    });

    return Array.from(weekMap.values());
  };





  const toggleWeek = (weekId: number) => {
    setExpandedWeeks((prev) =>
      prev.includes(weekId) ? prev.filter((id) => id !== weekId) : [...prev, weekId]
    );
  };

  // Handle lecture click to play video
  const handleLectureClick = useCallback((lecture: Lecture) => {
    setCurrentLecture(lecture);

    // Save video progress to backend when user clicks on a video
    const saveVideoProgress = async () => {
      const targetCourseId = playlistId ? lecture.course_id : courseId;
      const targetSectionId = playlistId ? (lecture.sectionId || 1) : (courseData?.sections?.[0]?.id || 1);

      if (targetCourseId && lecture.videoId) {
        try {
          // Send video progress update
          await api.post('/courses/save-video-progress/', {
            video_id: lecture.videoId,
            course_id: targetCourseId,
            section_id: targetSectionId,
            completed: false,
          });
          console.log('Video progress saved for:', lecture.title);
        } catch (err) {
          console.warn('Failed to save video progress:', err);
        }
      }
    };

    // Save progress when lecture is clicked
    saveVideoProgress();


    // console.log('Lecture clicked:', lecture);
    // console.log('Video URL:', lecture.videoUrl);



    if (lecture.videoUrl) {
      setCurrentVideoUrl(lecture.videoUrl);
      console.log('Setting actual video URL:', lecture.videoUrl);
    } else {
      console.log('No video URL found, using fallback');
      setCurrentVideoUrl(video_c);
    }
    setActiveTab('overview');
  }, [courseId, playlistId, courseData]);




  // Helper to find next/previous lecture
  const findNextLecture = useCallback(() => {
    if (!currentLecture) return null;

    for (const week of weeks) {
      for (const section of week.sections) {
        const lectureIndex = section.lectures.findIndex(l => l.id === currentLecture.id);
        if (lectureIndex !== -1 && lectureIndex < section.lectures.length - 1) {
          return section.lectures[lectureIndex + 1];
        }
        if (lectureIndex !== -1 && lectureIndex === section.lectures.length - 1) {
          // Check next section in same week
          const sectionIndex = week.sections.findIndex(s => s.name === section.name);
          if (sectionIndex !== -1 && sectionIndex < week.sections.length - 1) {
            return week.sections[sectionIndex + 1].lectures[0];
          }
        }
      }
    }
    return null;
  }, [currentLecture, weeks]);




  const findPreviousLecture = useCallback(() => {
    if (!currentLecture) return null;

    for (const week of weeks) {
      for (const section of week.sections) {
        const lectureIndex = section.lectures.findIndex(l => l.id === currentLecture.id);
        if (lectureIndex !== -1 && lectureIndex > 0) {
          return section.lectures[lectureIndex - 1];
        }
        if (lectureIndex !== -1 && lectureIndex === 0) {
          // Check previous section in same week
          const sectionIndex = week.sections.findIndex(s => s.name === section.name);
          if (sectionIndex !== -1 && sectionIndex > 0) {
            const prevSection = week.sections[sectionIndex - 1];
            return prevSection.lectures[prevSection.lectures.length - 1];
          }
        }
      }
    }
    return null;
  }, [currentLecture, weeks]);



  const handleVideoEnded = useCallback(() => {
    // Mark current lecture as completed
    if (currentLecture) {
      // Update the weeks state to mark this lecture as completed
      setWeeks(prevWeeks => {
        return prevWeeks.map(week => ({
          ...week,
          sections: week.sections.map(section => ({
            ...section,
            lectures: section.lectures.map(lecture =>
              lecture.id === currentLecture.id
                ? { ...lecture, completed: true }
                : lecture
            )
          }))
        }));
      });

      // Save video progress to backend with completed: true
      const markVideoCompleted = async () => {
        const targetCourseId = playlistId ? currentLecture.course_id : courseId;
        const targetSectionId = playlistId ? (currentLecture.sectionId || 1) : (courseData?.sections?.[0]?.id || 1);

        if (targetCourseId && currentLecture.videoId) {
          try {
            // Send final completion status
            await api.post('/courses/save-video-progress/', {
              video_id: currentLecture.videoId,
              course_id: targetCourseId,
              section_id: targetSectionId,
              completed: true,
            });
            console.log('Video marked as completed:', currentLecture.title);
          } catch (err) {
            console.warn('Failed to mark video as completed:', err);
          }
        }
      };

      markVideoCompleted();
    }

    // Move to next lecture
    const nextLecture = findNextLecture();
    if (nextLecture) {
      handleLectureClick(nextLecture);
    }
  }, [currentLecture, courseId, playlistId, courseData, findNextLecture, handleLectureClick]);


  // Handle video progress - mark as completed when 90% watched
  // Only update progress bar, do not mark completed or switch video here
  const handleVideoProgress = useCallback((_progress: number) => {
    // No completion logic here, only update progress bar
  }, []);




  // Handle back button - return to previous page or fallback
  const handleBackBtn = () => {
    const locationState = location.state as { returnTo?: string; activeSection?: string } | null;
    const returnTo = locationState?.returnTo;

    // If we have a valid return path that's not the current page, use it
    if (returnTo && returnTo !== location.pathname) {
      navigate(returnTo, { 
        replace: true, 
        state: { activeSection: locationState?.activeSection } 
      });

    } else {
      // Try browser history first, then fallback
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate("/user_dashboard", { replace: true });
      }
    }
  };





  const renderTabContent = () => {
    if (loading) {
      return <div className="loading-container">Loading course content...</div>;
    }

    if (error) {
      return <div className="error-container">{error}</div>;
    }

    switch (activeTab) {
      case 'overview':
        if (playlistId) {
          if (!currentLecture?.course_id) {
            return <div className="p-6">Select a lecture to view overview...</div>;
          }
          return <Overview courseId={currentLecture.course_id} courseSlug={currentLecture.course_url} isPlaylist={true} />;

        }
        if (!isReady) {
          return <div>Loading overview...</div>;
        }
        return <Overview />;

      case 'forum':
        return (
          <DiscussionForum
            courseId={playlistId ? currentLecture?.course_id : courseId}
            courseUrl={playlistId ? currentLecture?.course_url : courseUrl}
            sectionUrl={playlistId ? currentLecture?.section_url : (sectionUrl || 'main-lectures')}
            sectionId={playlistId ? (currentLecture?.sectionId || 1) : (courseData?.sections[0]?.id || 1)}
          />
        );
      case 'announcements':
        return <Announcements />;
      case 'assignments':
        return (
          <Assignments
            courseId={playlistId ? currentLecture?.course_id : courseId}
            courseUrl={playlistId ? currentLecture?.course_url : courseUrl}
            playlistAssignments={playlistAssignments}
          />
        );
      default:
        return <Overview />;
    }
  };





  // if (loading) {
  //   return (
  //     <div className="course-view-wrapper animate-pulse">
  //       <div className="course-view-container">
  //         <div className="course-view-main">
  //           <div className="course-view-header">
  //             <div className="h-8 bg-gray-200 rounded w-1/3 my-2"></div>
  //           </div>

  //           <div className="video-section bg-gray-200 rounded-xl flex items-center justify-center min-h-[300px] md:min-h-[400px]">
  //             <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
  //               <div className="w-0 h-0 border-y-8 border-y-transparent border-l-[12px] border-l-gray-400 ml-1"></div>
  //             </div>
  //           </div>

  //           <div className="tabs-container flex gap-4 mt-6">
  //             {[1, 2, 3, 4].map((i) => (
  //               <div key={i} className="h-10 bg-gray-200 rounded w-24"></div>
  //             ))}
  //           </div>

  //           <div className="mt-6 space-y-4 px-4">
  //             <div className="h-6 bg-gray-200 rounded w-1/4"></div>
  //             <div className="h-4 bg-gray-200 rounded w-full"></div>
  //             <div className="h-4 bg-gray-200 rounded w-5/6"></div>
  //             <div className="h-4 bg-gray-200 rounded w-4/5"></div>
  //           </div>
  //         </div>

  //         <div className="course-view-sidebar">
  //           <div className="w-full lg:w-[28vw] mr-9 lg:ml-5 lg:p-0 mb:ml-10 h-screen bg-white border-l border-gray-300 overflow-hidden">
  //             <div className="pb-8 space-y-4 p-4">
  //               {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
  //                 <div key={i} className="py-4 border-b border-gray-200 flex justify-between items-center">
  //                   <div className="h-6 bg-gray-200 rounded w-3/4"></div>
  //                   <div className="h-4 bg-gray-200 rounded-full w-4 h-4 ml-4 flex-shrink-0"></div>
  //                 </div>
  //               ))}
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  const displayTitle = courseTitle || courseData?.course?.title || 'Course';

  return (

    <div className="course-view-wrapper">
      <div className='course-view-container'>
        <div className="course-view-main">
          <div className="course-view-header">
            <button
              onClick={handleBackBtn}
              className="back-button"
            >
              <ChevronLeft size={chevronSize} />
              <span className=''>{displayTitle}</span>
            </button>
          </div>

          <div className="video-section">
            {currentVideoUrl && currentLecture ? (
              <VideoPlayer
                key={currentLecture.id}
                src={currentVideoUrl}
                title={currentLecture.title}
                autoPlay={true}
                onNext={() => {
                  const next = findNextLecture();
                  if (next) handleLectureClick(next);
                }}
                onPrevious={() => {
                  const prev = findPreviousLecture();
                  if (prev) handleLectureClick(prev);
                }}
                hasNext={!!findNextLecture()}
                hasPrevious={!!findPreviousLecture()}
                onEnded={handleVideoEnded}
                onProgress={handleVideoProgress}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <video
                  src={getCourseVideo(displayTitle)}
                  poster={courseImage || undefined}
                  autoPlay
                  loop
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
              </div>
            )}
          </div>

          <div className="course-view-sidebar-mobile">
            <SideBar
              weeks={weeks}
              expandedWeeks={expandedWeeks}
              toggleWeek={toggleWeek}
              onLectureClick={handleLectureClick}
              currentLectureId={currentLecture?.id}
              accessibleSectionIds={accessibleSectionIds}
              courseId={courseId}
              enrollmentData={courseData?.enrolled_user}
              loading={loading}
            />
          </div>

          <div className="tabs-container">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id as TabType)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {renderTabContent()}
        </div>

        <div className="course-view-sidebar">
          <SideBar
            weeks={weeks}
            expandedWeeks={expandedWeeks}
            toggleWeek={toggleWeek}
            onLectureClick={handleLectureClick}
            currentLectureId={currentLecture?.id}
              accessibleSectionIds={accessibleSectionIds}
            courseId={courseId}
            enrollmentData={courseData?.enrolled_user}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;

