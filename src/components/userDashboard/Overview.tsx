import { useEffect, useState, useMemo } from "react";
import api from "../../lib/api";
import {
  PlayCircle,
  ChevronRight,
  Search,
  AlertCircle,
  X,
  RefreshCw,
  ArrowUpDown,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────
interface ScoreBreakdownItem {
  earned: number;
  max: number;
  percent: number;
}

interface ScoreBreakdown {
  assignment_performance?: ScoreBreakdownItem;
  lecture_completion?: ScoreBreakdownItem;
  consistency?: ScoreBreakdownItem;
  overall?: ScoreBreakdownItem;
}

interface StudentSummary {
  overall_completion?: number;
  overall_performance_score: number;
  performance_points_earned?: number;
  performance_points_max?: number;
  assignment_average: number;
  completed_courses?: number;
  total_courses_purchased?: number;
  study_time_minutes?: number;
  study_hours?: number;
  consistency_score: number;
  completion_speed?: number;
  internship_eligible?: boolean;
  videos_completed?: number;
  assignments_submitted?: number;
  assignments_reviewed?: number;
  assignments_pending_review?: number;
  lectures_completed?: number;
  lectures_completed_percent?: number;
  modules_completed?: number;
  learning_streak?: number;
  score_breakdown?: ScoreBreakdown;
  dels_tier?: string;
  dels_value?: number;
  follow_through_rate?: number;
  purchased_courses?: number;
  purchased_courses_completed?: number;
  subscribed_courses?: number;
  subscribed_courses_completed?: number;
  subscribed_courses_started?: number;
}

interface RankingData {
  rank: number;
  total_students: number;
  percentile: number;
}

interface CourseAnalyticsItem {
  course_id: number;
  course_title: string;
  completion: number;
  course_status: string;
  assignment_average: number;
  videos_completed: number;
  total_lectures: number;
  completed_assignments: number;
  course_performance_score: number;
  course_max_score: number;
  expected_completion_date?: string | null;
  actual_completion_date?: string | null;
  lecture_completion_percent?: number;
}

interface ActivityItem {
  type: string;
  title: string;
  course_title?: string | null;
  status: string;
  timestamp?: string | null;
  score?: number | null;
}

interface GradedAssignmentItem {
  assignment_id: number;
  assignment_name: string;
  course_title: string;
  score: number;
  max_score: number;
  percentage: number;
  performance_points: number;
  submitted_at?: string | null;
  admin_review_time?: string | null;
  status: string;
  feedback?: string | null;
}

interface PerformanceAnalyticsData {
  summary: StudentSummary;
  ranking: RankingData;
  courses: CourseAnalyticsItem[];
  course_analytics: CourseAnalyticsItem[];
  recent_activity: ActivityItem[];
  activity_timeline: ActivityItem[];
  graded_assignments: GradedAssignmentItem[];
  assignment_history: GradedAssignmentItem[];
  insights: string[];
}

interface DELSTrendPoint {
  date: string;
  dels_value: number;
  tier: string;
}

interface DELSEnrollmentBreakdown {
  course_id: number;
  course_title?: string;
  ccs: number;
  weight: number;
  contribution: number;
  PALC?: number;
  AQS?: number;
}

interface DELSWhatChanged {
  enrollments?: DELSEnrollmentBreakdown[];
  ca?: number;
  dels_base?: number;
  delta_vs_yesterday?: number;
}

interface DELSDetailResponse {
  dels: number;
  tier: string;
  follow_through_rate: number;
  trend: DELSTrendPoint[];
  what_changed?: DELSWhatChanged;
}

interface EnrollmentMetricsResponse {
  course_id: number;
  PALC: number;
  ASR: number;
  ATS: number;
  AQS: number;
  ECI: number;
  MPA: number;
  OAB: number;
  LCR: number;
}



// ── Utility Helpers ─────────────────────────────────────────────────────
const formatDate = (dateString?: string | null): string => {
  if (!dateString) return "N/A";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "N/A";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return "N/A";
  }
};

const formatRelativeTime = (dateString?: string | null): string => {
  if (!dateString) return "Recently";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Recently";
    const diffHours = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  } catch {
    return "Recently";
  }
};

const getStatusStyle = (status?: string) => {
  switch (status) {
    case "Completed":
    case "Admin Reviewed":
    case "Active":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "In Progress":
    case "Submitted":
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
};

const requestFallback = async <T,>(primary: string, fallback: string): Promise<T> => {
  try {
    const res = await api.get<T>(primary);
    return res.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      const res2 = await api.get<T>(fallback);
      return res2.data;
    }
    throw err;
  }
};

// ── Main Overview Component ─────────────────────────────────────────────
export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [perfData, setPerfData] = useState<PerformanceAnalyticsData | null>(null);
  const [delsDetail, setDelsDetail] = useState<DELSDetailResponse | null>(null);

  // Metrics Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<EnrollmentMetricsResponse | null>(null);

  // Aggregated ASR / ATS / AQS across all enrolled courses
  const [aggregatedMetrics, setAggregatedMetrics] = useState<{
    ASR: number | null;
    ATS: number | null;
    AQS: number | null;
  }>({ ASR: null, ATS: null, AQS: null });

  // Assignment Table state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof GradedAssignmentItem>("submitted_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFeedback, setActiveFeedback] = useState<{ title: string; text: string } | null>(null);

  const pageSize = 5;

  // Fetch all backend APIs
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. GET /performance/
      const perfRes = await requestFallback<{ success: boolean; analytics: PerformanceAnalyticsData }>(
        "/student-analytics/performance/",
        "/performance/"
      );

      if (perfRes?.analytics) {
        setPerfData(perfRes.analytics);
      }

      // Resolve user ID for DELS & Follow Through endpoints
      const userId = localStorage.getItem("user_id") || "me";

      // 2. GET /users/{user_id}/dels/
      try {
        const delsRes = await requestFallback<DELSDetailResponse>(
          `/student-analytics/users/${userId}/dels/`,
          `/users/${userId}/dels/`
        );
        setDelsDetail(delsRes);
      } catch (e) {
        console.warn("DELS detail fetch skipped/failed:", e);
      }



      // 4. GET /users/{user_id}/avg-metrics/ — single call returns averaged ASR/ATS/AQS
      try {
        const avgRes = await requestFallback<{
          ASR: number; ATS: number; AQS: number; PALC: number; ECI: number; enrollment_count: number;
        }>(
          `/student-analytics/users/${userId}/avg-metrics/`,
          `/users/${userId}/avg-metrics/`
        );
        setAggregatedMetrics({
          ASR: avgRes.ASR,
          ATS: avgRes.ATS,
          AQS: avgRes.AQS,
        });
      } catch (e) {
        console.warn("Avg-metrics fetch skipped/failed:", e);
      }
    } catch (err: any) {
      console.error("Failed loading performance overview:", err);
      setError(err?.response?.data?.error || err?.message || "Failed to load student performance from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // 4. GET /enrollments/{enrollment_id}/metrics/
  const handleViewMetrics = async (enrollmentId: number) => {
    setIsModalOpen(true);
    setMetricsLoading(true);
    setMetricsError(null);
    setSelectedMetrics(null);

    try {
      const res = await requestFallback<EnrollmentMetricsResponse>(
        `/student-analytics/enrollments/${enrollmentId}/metrics/`,
        `/enrollments/${enrollmentId}/metrics/`
      );
      setSelectedMetrics(res);
    } catch (err: any) {
      console.error("Failed fetching enrollment metrics:", err);
      setMetricsError(err?.response?.data?.error || "Failed to load enrollment metrics.");
    } finally {
      setMetricsLoading(false);
    }
  };

  // Helper selectors
  const summary = perfData?.summary;
  const courses = perfData?.courses?.length ? perfData.courses : perfData?.course_analytics || [];
  const activities = perfData?.activity_timeline?.length ? perfData.activity_timeline : perfData?.recent_activity || [];
  const assignments = perfData?.graded_assignments?.length ? perfData.graded_assignments : perfData?.assignment_history || [];

  // Sort handler
  const handleSort = (field: keyof GradedAssignmentItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Filtered & Sorted Assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      const q = searchTerm.toLowerCase();
      return (
        item.assignment_name?.toLowerCase().includes(q) ||
        item.course_title?.toLowerCase().includes(q) ||
        item.status?.toLowerCase().includes(q)
      );
    });
  }, [assignments, searchTerm]);

  const sortedAssignments = useMemo(() => {
    return [...filteredAssignments].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      if (sortField === "submitted_at") {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredAssignments, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedAssignments.length / pageSize) || 1;
  const paginatedAssignments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAssignments.slice(start, start + pageSize);
  }, [sortedAssignments, currentPage, pageSize]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
        <p className="mt-4 text-xs font-semibold text-gray-500 tracking-wide">
          Loading performance data...
        </p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-8 max-w-lg mx-auto my-12 text-center bg-white border border-gray-200 rounded-3xl shadow-sm">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-black mb-2">Failed to Load Performance</h2>
        <p className="text-xs text-gray-500 mb-6">{error}</p>
        <button
          onClick={fetchAllData}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs inline-flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Retry Loading
        </button>
      </div>
    );
  }

  const score = summary.overall_performance_score ?? summary.dels_value ?? 0;
  const maxScore = summary.performance_points_max ?? 1000;
  const scorePercent = Math.min(100, Math.max(0, (score / maxScore) * 100));

  const tier = summary.dels_tier || delsDetail?.tier || "At Risk";

  const breakdown = summary.score_breakdown || {};
  const assignmentPerf = breakdown.assignment_performance || { earned: score * 0.5, max: 500, percent: summary.assignment_average };
  const lectureComp = breakdown.lecture_completion || { earned: score * 0.35, max: 350, percent: summary.lectures_completed_percent || summary.overall_completion || 0 };
  const consistency = breakdown.consistency || { earned: summary.consistency_score || 0, max: 150, percent: summary.consistency_score ? Math.round((summary.consistency_score / 150) * 100) : 0 };

  const rawTrend = delsDetail?.trend;
  let chartTrend: any[] = [];
  const todayStr = new Date().toISOString().split("T")[0];

  if (rawTrend && rawTrend.length > 0) {
    chartTrend = rawTrend.map((item: any) => ({ ...item }));
    const lastItem = chartTrend[chartTrend.length - 1];
    let lastDateStr = "";
    if (lastItem && lastItem.date) {
      try {
        lastDateStr = new Date(lastItem.date).toISOString().split("T")[0];
      } catch {
        lastDateStr = String(lastItem.date).split("T")[0];
      }
    }

    if (lastDateStr === todayStr) {
      chartTrend[chartTrend.length - 1] = {
        ...lastItem,
        dels_value: score,
        tier: tier,
      };
    } else if (lastDateStr && lastDateStr < todayStr) {
      chartTrend.push({
        date: todayStr,
        dels_value: score,
        tier: tier,
      });
    }
  }

  if (chartTrend.length === 1) {
    const single = chartTrend[0];
    const prevDate = new Date(new Date(single.date).getTime() - 86400000 * 7).toISOString().split("T")[0];
    chartTrend = [
      { date: prevDate, dels_value: 0, tier: "At Risk" },
      { date: single.date, dels_value: single.dels_value, tier: single.tier },
    ];
  } else if (chartTrend.length === 0) {
    const prevDate = new Date(Date.now() - 86400000 * 7).toISOString().split("T")[0];
    chartTrend = [
      { date: prevDate, dels_value: 0, tier: "At Risk" },
      { date: todayStr, dels_value: score, tier },
    ];
  }

  // Overall completion percent
  const overallCompletionPct = Math.round(summary.overall_completion ?? summary.lectures_completed_percent ?? 0);
  const totalCourses = summary.total_courses_purchased ?? summary.purchased_courses ?? 0;
  const completedCourses = summary.completed_courses ?? summary.purchased_courses_completed ?? 0;
  const totalAssignments = summary.assignments_submitted ?? 0;
  const reviewedAssignments = summary.assignments_reviewed ?? 0;
  const pendingAssignments = summary.assignments_pending_review ?? 0;
  const learningStreak = summary.learning_streak ?? 0;
  const streakPts = consistency.earned ?? 0;
  const streakMax = consistency.max ?? 150;

  // Bar colors for breakdown
  const barColors = [
    "#f59e0b", // amber — assignment
    "#8b5cf6", // purple — lecture
    "#ef4444", // red — consistency
  ];

  return (
    <div className=" sm:p-5 md:p-6 lg:p-8 sm:max-w-[85vw] md:max-w-[90vw] w-full mb-10  mx-auto space-y-6 sm:space-y-8 
    font-['Bricolage_Grotesque',sans-serif] bg-white min-w-0" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>

      {/* ── Blue Hero Banner ─────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl p-5 sm:p-7 md:p-8"
        style={{ background: "linear-gradient(135deg, #2251CC 0%, #1a3fb5 100%)" }}
      >
        {/* subtle decorative circles */}
        <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 sm:w-52 sm:h-52 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #fff, transparent)" }} />
        <div className="pointer-events-none absolute -bottom-12 -left-8 w-36 h-36 sm:w-44 sm:h-44 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #fff, transparent)" }} />

        <p className="text-[10px] sm:text-[11px] font-bold tracking-widest text-blue-200 uppercase mb-1">Student Analytics</p>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">
          Your Learning Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-blue-100 max-w-md leading-relaxed">
          Track every lecture, assignment, and course — with real-time performance scoring.
        </p>
      </div>




      {/* ── 6 Stat Pill Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
        {/* Overall Progress */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col justify-between gap-1">
          <span className="text-[11px] sm:text-[12px] font-bold uppercase tracking-widest text-gray-500">Course Progress</span>
          <span className="text-xl sm:text-2xl font-black text-gray-900">{overallCompletionPct}%</span>
          <span className="text-[11px] sm:text-sm text-gray-500">{completedCourses} / {totalCourses} courses done </span>
        </div>

        {/* Assignments */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col justify-between gap-1">
          <span className="text-[11px] sm:text-[12px] font-bold uppercase tracking-widest text-gray-500">Assignments</span>
          <span className="text-xl sm:text-2xl font-black text-gray-900">{totalAssignments}</span>
          <span className="text-[11px] sm:text-sm text-gray-500">{reviewedAssignments} reviewed · {pendingAssignments} pending</span>
        </div>

        {/* ATS */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col justify-between gap-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-[12px] font-bold uppercase tracking-widest text-gray-500">Timeliness Score</span>
            {/* <span className="text-[9px] sm:text-sm font-semibold text-violet-500 bg-violet-50 px-2 py-0.5 rounded-full truncate">Timeliness</span> */}
          </div>
          <span className="text-xl sm:text-2xl font-black text-gray-900">
            {aggregatedMetrics.ATS !== null ? `${aggregatedMetrics.ATS}%` : "—"}
          </span>
          <span className="text-[11px] sm:text-sm text-gray-500">All enrolled courses</span>
        </div>

        {/* AQS */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col justify-between gap-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-[12px] font-bold uppercase tracking-widest text-gray-500">Quality Score</span>
            {/* <span className="text-[9px] sm:text-[10px] font-semibold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full truncate">Quality</span> */}
          </div>
          <span className="text-xl sm:text-2xl font-black text-gray-900">
            {aggregatedMetrics.AQS !== null ? `${aggregatedMetrics.AQS}%` : "—"}
          </span>
          <span className="text-[11px] sm:text-sm text-gray-500">All enrolled courses</span>
        </div>

        {/* Average Assignment Score */}
        {/* <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col justify-between gap-1">
          <span className="text-[11px] sm:text-[12px] font-bold uppercase tracking-widest text-gray-500">Avg Assignment Score</span>
          <span className="text-xl sm:text-2xl font-black text-gray-900">{avgAssignmentScore.toFixed(1)}%</span>
          <span className="text-[11px] sm:text-[12px] text-gray-500">Average score</span>
        </div> */}

        {/* Learning Streak */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col justify-between gap-1">
          <span className="text-[11px] sm:text-[12px] font-bold uppercase tracking-widest text-gray-500">Learning Streak</span>
          <span className="text-xl sm:text-2xl font-black text-gray-900">{learningStreak} days</span>
          <span className="text-[11px] sm:text-sm text-gray-500">{streakPts} / {streakMax} pts</span>
        </div>
      </div>





      {/* ── Overall Score + Score Breakdown (two-column) ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-2xl bg-white border border-gray-200 flex flex-col items-center justify-center gap-4">
          <span className="text-base sm:text-lg font-bold text-gray-800">Deep Eigen Learning Score</span>
          <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="62" stroke="#e5e7eb" strokeWidth="12" fill="transparent" />
              <circle
                cx="80" cy="80" r="62"
                stroke="#2563eb"
                strokeWidth="12"
                strokeDasharray={2 * Math.PI * 62}
                strokeDashoffset={2 * Math.PI * 62 - (scorePercent / 100) * (2 * Math.PI * 62)}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl sm:text-4xl font-black text-gray-900">{Math.round(score)}</span>
              {/* <span className="text-xs text-gray-400">/ {maxScore} pts</span> */}
            </div>
          </div>
          <span className="text-SM text-gray-400">Max {maxScore} pts</span>
<span
  className={`px-4 py-1.5 text-xs font-bold rounded-full border ${
    tier === "Elite"
      ? "bg-purple-50 text-purple-700 border-purple-200"
      : tier === "Outstanding"
      ? "bg-green-50 text-green-700 border-green-200"
      : tier === "Strong"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tier === "Consistent"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : tier === "Proficient"
      ? "bg-cyan-50 text-cyan-700 border-cyan-200"
      : tier === "Developing"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : tier === "Beginner"
      ? "bg-orange-50 text-orange-700 border-orange-200"
      : "bg-orange-50 text-orange-700 border-rose-200"
  }`}
>
  {tier === "Elite" ||
  tier === "Outstanding" ||
  tier === "Strong" ||
  tier === "Consistent" ||
  tier === "Proficient" ||
  tier === "Developing" ||
  tier === "Beginner"
    ? tier
    : "Getting Started"}
</span>
        </div>





        {/* Right: Score Breakdown */}
        <div className="lg:col-span-8 p-5 sm:p-6 rounded-2xl bg-white border border-gray-200  flex flex-col justify-center gap-5">
          <div>
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5"> DEL Score Breakdown</p>
            <h2 className="text-base sm:text-lg font-black text-gray-900">Points earned by learning activity</h2>
          </div>

          <div className="space-y-4 sm:space-y-5">
            {[
              { label: "Assignment Performance", earned: assignmentPerf.earned, max: assignmentPerf.max, color: barColors[0] },
              { label: "Lecture Completion", earned: lectureComp.earned, max: lectureComp.max, color: barColors[1] },
              { label: "Consistency", earned: consistency.earned, max: consistency.max, color: barColors[2] },
            ].map((item) => {
              const pct = Math.min(100, Math.max(0, item.max > 0 ? (item.earned / item.max) * 100 : 0));
              return (
                <div key={item.label}>
                  <div className="flex flex-col min-[400px]:flex-row min-[400px]:items-center justify-between gap-1 mb-1.5">
                    <span className="text-xs sm:text-sm text-gray-700 font-medium">{item.label}</span>
                    <span className="text-xs font-bold text-gray-700">{Math.round(item.earned)} / {item.max} pts</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>





      {/* ── 4. Trend Chart ────────────────────────────── */}
      <div className="w-full min-w-0">
<div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-gray-200 ">
  <div className="flex items-center justify-between mb-5">
    <h3 className="text-lg font-bold flex items-center gap-2">
      <TrendingUp className="w-5 h-5 text-blue-600" />
      Performance Progress
    </h3>

    <span className="text-sm text-gray-500">
      DEL Score Growth
    </span>
  </div>

  <div className="h-72">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartTrend}
        margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
      >
        <defs>
          {/* Blue Gradient */}
          <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.9} />
            <stop offset="40%" stopColor="#3b82f6" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.08} />
          </linearGradient>

          {/* Shadow */}
          <filter id="shadow">
            <feDropShadow
              dx="0"
              dy="5"
              stdDeviation="6"
              floodColor="#2563eb"
              floodOpacity="0.25"
            />
          </filter>
        </defs>

        <CartesianGrid
          strokeDasharray="4 4"
          vertical={false}
          stroke="#e5e7eb"
        />

        <XAxis
          dataKey="date"
          tickFormatter={(v) => formatDate(v)}
          tick={{ fontSize: 12 }}
        />

        <YAxis
          domain={[0, 1000]}
          tick={{ fontSize: 12 }}
        />

        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-white border border-gray-100 p-3 rounded-2xl shadow-xl text-xs space-y-1 font-sans">
                  <p className="font-semibold text-gray-400">{formatDate(data.date)}</p>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600 inline-block shadow-sm" />
                    <span className="font-extrabold text-gray-900 text-sm">{Math.round(data.dels_value)} pts</span>
                    <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {data.tier || "DELS Score"}
                    </span>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />

        <Area
          type="monotone"
          dataKey="dels_value"
          stroke="#2563eb"
          strokeWidth={4}
          fill="url(#progressGradient)"
          filter="url(#shadow)"
          animationDuration={1800}
          activeDot={{
            r: 8,
            fill: "#2563eb",
            stroke: "#fff",
            strokeWidth: 3,
          }}
          dot={{
            r: 4,
            fill: "#2563eb",
            stroke: "#fff",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
</div>
      </div>





      {/* ── 5. Course Analytics Grid Cards ────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-base sm:text-lg font-extrabold text-black">Enrolled Courses Performance</h3>
        <div className="grid grid-cols-1  sm:grid-cols-1  md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">
          {courses.map((c, idx) => (
            <div key={c.course_id || idx} className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-gray-200  flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-bold text-md text-black truncate flex-1">{c.course_title}</span>
                  <span className={`px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold rounded-full border shrink-0 ${getStatusStyle(c.course_status)}`}>
                    {c.course_status}
                  </span>
                </div>

                <div className="space-y-1.5 my-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 text-sm font-medium">Course Progress</span>
                    <span className="font-bold text-blue-600">{c.completion}% Completed</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${c.completion}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-gray-50">
                    <span className="text-gray-500 block text-sm sm:text-sm mb-1 font-normal">Progress</span>
                    <span className="font-bold text-black text-xs sm:text-sm">{c.completion}%</span>
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-gray-50">
                    <span className="text-gray-500 block text-sm sm:text-sm mb-1 font-normal">Assignment Avg</span>
                    <span className="font-bold text-black text-xs sm:text-sm">{c.assignment_average}%</span>
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-gray-50">
                    <span className="text-gray-500 block text-sm sm:text-sm mb-1 font-normal">Lectures</span>
                    <span className="font-bold text-black text-xs sm:text-sm">{c.videos_completed}/{c.total_lectures}</span>
                  </div>
                </div>
              </div>

              {/* <div className="flex items-center justify-end pt-2">
                <button
                  onClick={() => handleViewMetrics(c.course_id)}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl  text-blue-600 hover:underline font-semibold text-sm flex items-center justify-center cursor-pointer gap-1 transition-colors"
                >
                  <span>View Metrics</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div> */}

            </div>
          ))}
        </div>
      </div>





      {/* ── 6. Graded Assignments Table ───────────────────────────────── */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-gray-200  space-y-4 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-extrabold text-black">Graded Assignment History</h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 min-w-0">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
              <tr>
                <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort("assignment_name")}>
                  <div className="flex items-center gap-1">Assignment <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort("course_title")}>
                  <div className="flex items-center gap-1">Course <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort("status")}>
                  <div className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort("score")}>
                  <div className="flex items-center gap-1">Score <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4">Perf. Points</th>
                <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort("submitted_at")}>
                  <div className="flex items-center gap-1">Submitted <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                {/* <th className="py-3 px-4 text-center">Feedback</th> */}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedAssignments.map((a, i) => (
                <tr key={a.assignment_id || i} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-sm text-black whitespace-nowrap">{a.assignment_name}</td>
                  <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{a.course_title}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xm font-semibold rounded-full border ${getStatusStyle(a.status)}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-sm text-black whitespace-nowrap">{a.score} / {a.max_score || 100}</td>
                  <td className="py-3 px-4 text-blue-600 font-medium text-sm whitespace-nowrap">{a.performance_points} pts</td>
                  <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{formatDate(a.submitted_at)}</td>
                  {/* <td className="py-3 px-4 text-center whitespace-nowrap">
                    {a.feedback ? (
                      <button
                        onClick={() => setActiveFeedback({ title: a.assignment_name, text: a.feedback! })}
                        className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    ) : "-"}
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>





        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 pt-2">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-medium transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-medium transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>





      {/* ── 7. Activity Timeline ─────────────── */}
      <div className="w-full">
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-gray-200 ">
          <h3 className="text-base font-bold text-black mb-4">Activity Timeline</h3>
          <div className="space-y-3 text-xs">
            {activities.map((act, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="flex items-start gap-3">
                  <PlayCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-black text-xs sm:text-sm">{act.title}</div>
                    {act.course_title && <div className="text-blue-600 text-xs">{act.course_title}</div>}
                  </div>
                </div>
                <span className="text-[11px] text-gray-400 self-end sm:self-auto shrink-0">{formatRelativeTime(act.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>




      {/* ── Metrics Modal ────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-6xl bg-white border border-gray-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl 
          space-y-8 h-[45vh] overflow-y-auto">

            <div className="flex justify-between items-center border-b border-gray-200 pb-1">
              <h3 className="font-bold text-base text-black">Enrollment Sub-Metrics</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {metricsLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-500 text-xs">
                <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mb-3" />
                Fetching sub-metrics from backend...
              </div>
            ) : metricsError ? (
              <div className="p-4 bg-rose-50 text-rose-600 text-xs text-center rounded-xl">{metricsError}</div>
            ) : selectedMetrics ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-8 text-xs">
                {[
                  { name: "PALC", label: "Pace-Adjusted Lecture", val: selectedMetrics.PALC },
                  { name: "ASR", label: "Assignment Submission Rate", val: selectedMetrics.ASR },
                  { name: "ATS", label: "Assignment Timeliness", val: selectedMetrics.ATS },
                  { name: "AQS", label: "Assignment Quality", val: selectedMetrics.AQS },
                  { name: "ECI", label: "Engagement & Consistency", val: selectedMetrics.ECI },
                  // { name: "MPA", label: "Module Progress Alignment", val: selectedMetrics.MPA },
                  // { name: "OAB", label: "Overdue Buffer", val: selectedMetrics.OAB },
                  { name: "LCR", label: "Lecture Completion Rate", val: selectedMetrics.LCR },
                ].map((m) => (
                  <div key={m.name} className="p-3 rounded-2xl bg-gray-50 border border-gray-200">
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-blue-600 text-lg">{m.name}</span>
                      <span className="text-black">{m.val}%</span>
                    </div>
                    <p className="text-[16px] font-[400] text-gray-500 mb-2">{m.label}</p>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, Math.max(0, m.val))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Feedback Modal ───────────────────────────────────────────── */}
      {activeFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h4 className="font-bold text-sm text-black">Feedback: {activeFeedback.title}</h4>
            <p className="text-xs text-gray-600 bg-gray-50 p-4 rounded-2xl leading-relaxed">{activeFeedback.text}</p>
            <div className="flex justify-end">
              <button onClick={() => setActiveFeedback(null)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
