// types/makePlaylist.ts

export interface Course {
  id: number | string;
  title: string;
  selected: number;
  total: number;
  category: string;
  url_link_name?: string;
  duration?: number;
  level?: string;
  indian_fee?: number;
  foreign_fee?: number;
  course_image?: string;
}

// API Response type from /courses/ endpoint
export interface ApiCourse {
  id: number;
  title: string;
  url_link_name: string;
  category: string;
  duration: number;
  level: string;
  indian_fee: number;
  foreign_fee: number;
  course_image: string;
}

// Video/Lecture from API
export interface ApiVideo {
  id: number;
  title: string;
  link: string;
  type: string;
  duration: number;
}

// Module from API
export interface ApiModule {
  id: number;
  name: string;
  title: string;
  videos: ApiVideo[];
}

// Section from API
export interface ApiSection {
  id: number;
  name: string;
  title: string;
  part_number: number;
  estimated_time: number;
  total_assignments: number;
  modules: ApiModule[];
}

// API Course Overview Response
export interface ApiCourseOverview {
  success: boolean;
  course: {
    id: number;
    title: string;
    level: string;
    category: string;
  };
  sections: ApiSection[];
}

export interface Lecture {
  id: string;
  courseId: string;
  title: string;
  selected?: boolean;
  lectureNumber?: string;
  lectureName?: string;
}

export interface Assignment {
  id: string;
  lectureIds: string[];
  title: string;
  selected: boolean;
}

export interface PageData {
  title: string;
  description: string;
  buttonText: string;
  selectedText: string;
}

export interface UIData {
  placeholders: {
    searchCourse: string;
    searchLecture: string;
  };
  titles: {
    courses: string;
    lectures: string;
    assignments: string;
    customAssignment: string;
    selectedLectures: string;
    relatedAssignments: string;
  };
  buttons: {
    selectAll: string;
    viewLectures: string;
    hideLectures: string;
  };
  messages: {
    noLectures: string;
    assignmentsDescription: string;
  };
}

export interface Colors {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryText: string;
  primaryTextLight: string;
  border: string;
  background: string;
}

export interface MakePlaylistData {
  page: PageData;
  courses: Course[];
  lectures: Lecture[];
  ui: UIData;
  constants: {
    maxLecturesPerAssignment: number;
    defaultCourseId: string;
  };
  colors: Colors;
}