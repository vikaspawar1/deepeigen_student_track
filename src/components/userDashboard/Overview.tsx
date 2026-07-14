import { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";

type SubscriptionInfo = {
  plan: string;
  duration: string;
  start_date: string;
  end_date: string;
};

type AnalyticsSummary = {
  overall_completion: number;
  overall_performance_score: number;
  performance_points_earned: number;
  performance_points_max: number;
  assignment_average: number;
  completed_courses: number;
  total_courses_purchased: number;
  study_time_minutes: number;
  study_hours: number;
  consistency_score: number;
  completion_speed: number;
  internship_eligible: boolean;
  videos_completed: number;
  assignments_submitted: number;
  assignments_reviewed: number;
  assignments_pending_review: number;
  lectures_completed: number;
  lectures_completed_percent: number;
  modules_completed: number;
  learning_streak: number;
  engagement_score: number;
  purchased_courses?: number;
  purchased_courses_completed?: number;
  subscribed_courses?: number;
  subscribed_courses_completed?: number;
  subscribed_courses_started?: number;
  subscription_info?: SubscriptionInfo | null;
  score_breakdown?: {
    course_completion?: { earned: number; max: number; percent: number };
    assignment_performance?: { earned: number; max: number; percent: number };
    submission_discipline?: { earned: number; max: number; percent: number };
    lecture_completion?: { earned: number; max: number; percent: number };
    consistency?: { earned: number; max: number; percent: number };
    engagement?: { earned: number; max: number; percent: number };
    overall?: { earned: number; max: number; percent: number };
  };
};

type GradedAssignment = {
  assignment_id: number;
  assignment_name: string;
  course_title: string;
  score: number;
  max_score: number;
  download_time: string | null;
  submitted_at: string | null;
  admin_review_time: string | null;
  status: string;
  feedback: string | null;
  submitted_file: string | null;
};

type Ranking = { rank: number; total_students: number; percentile: number };

type CourseBreakdown = {
  course_id: number;
  course_title: string;
  completion: number;
  course_status: string;
  assignment_average: number;
  videos_completed: number;
  total_lectures?: number;
  completed_assignments: number;
  course_performance_score: number;
  purchase_date?: string;
  started_date?: string;
  expected_completion_date?: string;
  actual_completion_date?: string;
  lecture_completion_percent?: number;
  completion_speed_points?: number;
  modules: { module_id: number; title: string; completion: number }[];
};

type RecentActivity = {
  type: string;
  title: string;
  course_title?: string;
  score?: number | null;
  status?: string;
  timestamp: string;
};

type AnalyticsData = {
  summary: AnalyticsSummary;
  ranking: Ranking;
  courses: CourseBreakdown[];
  recent_activity: RecentActivity[];
  graded_assignments: GradedAssignment[];
  insights: string[];
};

const defaultSummary: AnalyticsSummary = {
  overall_completion: 0,
  overall_performance_score: 0,
  performance_points_earned: 0,
  performance_points_max: 1000,
  assignment_average: 0,
  completed_courses: 0,
  total_courses_purchased: 0,
  study_time_minutes: 0,
  study_hours: 0,
  consistency_score: 0,
  completion_speed: 0,
  internship_eligible: false,
  videos_completed: 0,
  assignments_submitted: 0,
  assignments_reviewed: 0,
  assignments_pending_review: 0,
  lectures_completed: 0,
  lectures_completed_percent: 0,
  modules_completed: 0,
  learning_streak: 0,
  engagement_score: 0,
};

function CircularGauge({ score, max = 1500 }: { score: number; max?: number }) {
  const pct = Math.min(score / max, 1);
  const r = 68;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const pctInt = Math.round(pct * 100);
  const color = pctInt >= 60 ? "#22c55e" : pctInt >= 30 ? "#f59e0b" : "#174CD2";

  return (
    <div className="relative flex items-center justify-center w-[180px] h-[180px] sm:w-[200px] sm:h-[200px]">
      <svg
        className="absolute inset-0 w-full h-full rotate-[-90deg]"
        viewBox="0 0 168 168"
      >
        <circle cx="84" cy="84" r={r} fill="none" stroke="#e2e8f0" strokeWidth="14" />
        <circle
          cx="84"
          cy="84"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div className="relative text-center z-10">
        <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-none">
          {Math.round(score)}
        </p>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">/ {max} pts</p>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
// function fmt(dt: string | null | undefined) {
//   if (!dt) return "—";
//   return new Date(dt).toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// }

function statusBadge(s: string) {
  const map: Record<string, string> = {
    Completed:        "bg-emerald-100 text-emerald-700 border border-emerald-200",
    "In Progress":    "bg-blue-100    text-blue-700    border border-blue-200",
    "Not Started":    "bg-slate-100   text-slate-500   border border-slate-200",
    "Admin Reviewed": "bg-violet-100  text-violet-700  border border-violet-200",
    Pending:          "bg-amber-100   text-amber-700   border border-amber-200",
    Submitted:        "bg-sky-100     text-sky-700     border border-sky-200",
  };
  return `rounded-full px-3 py-0.5 text-xs font-semibold ${map[s] ?? "bg-slate-100 text-slate-600 border border-slate-200"}`;
}

// ─── MetricCard ───────────────────────────────────────────────────────────────
function MetricCard({
  title,
  value,
  subtitle,
  badge,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  badge?: string;
  icon?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between min-h-[130px]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-slate-400 leading-tight">
          {title}
        </p>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div>
        <p className="mt-3 text-3xl sm:text-2xl font-extrabold text-slate-900 leading-none">
          {value}
        </p>
        <p className="mt-1.5 text-sm sm:text-base text-slate-500">{subtitle}</p>
        {badge && (
          <span className={`mt-2 inline-block ${statusBadge(badge)}`}>{badge}</span>
        )}
      </div>
    </div>
  );
}

// ─── ProgressRow ─────────────────────────────────────────────────────────────
function ProgressRow({
  label,
  value,
  color,
  earned,
  max,
}: {
  label: string;
  value: number;
  color: string;
  earned?: number;
  max?: number;
}) {
  const safe = isNaN(value) ? 0 : value;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm sm:text-base font-medium text-slate-600">{label}</span>
        <span className="text-sm sm:text-base font-bold text-slate-800">
          {earned ?? Math.round(safe)} / {max ?? 100} pts
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-200">
        <div
          className={`h-2.5 rounded-full ${color} transition-all duration-700`}
          style={{ width: `${Math.min(safe, 100)}%` }}
        />
      </div>
    </div>
  );
}


// ─── Main Component ───────────────────────────────────────────────────────────
export default function Overview() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      console.log("Fetching analytics data...");

      const response = await api.get<{ success: boolean; analytics: AnalyticsData }>(
        "/student-analytics/performance/"
      );

      console.log("API Response:", response);
      console.log("Response Data:", response.data);
      console.log("Analytics:", response.data.analytics);

      if (response.data?.success && response.data.analytics) {
        setAnalytics(response.data.analytics);
        setError(null);
      } else {
        setError("No analytics data returned.");
      }
    } catch (e: any) {
      console.error("API Error:", e);
      console.error("Error Response:", e.response?.data);
      setError(e?.response?.data?.message ?? "Unable to load analytics.");
    }
  };



useEffect(() => {
  let alive = true;

  fetchAnalytics()
    .finally(() => {
      if (alive) setLoading(false);
    });

  // Auto-refresh every 10 seconds to show admin review updates
  const interval = setInterval(() => {
    if (alive) {
      fetchAnalytics().catch(err => console.error("Auto-refresh failed:", err));
    }
  }, 10000);

  return () => {
    alive = false;
    clearInterval(interval);
  };
}, []);
  const s = analytics?.summary ?? defaultSummary;
  const score = Number(s.overall_performance_score ?? 0);
  const breakdown = s.score_breakdown ?? {};

  const speedLabel = useMemo(() => {
    if (s.completion_speed >= 90) return "Excellent";
    if (s.completion_speed >= 70) return "Strong";
    if (s.completion_speed >= 40) return "Steady";
    return "Needs focus";
  }, [s.completion_speed]);

  const speedColor = useMemo(() => {
    if (s.completion_speed >= 90) return "bg-emerald-100 text-emerald-700";
    if (s.completion_speed >= 70) return "bg-blue-100 text-blue-700";
    if (s.completion_speed >= 40) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-600";
  }, [s.completion_speed]);

  return (
    <div className="space-y-5 sm:space-y-6 mb-10 mt-10">
      {/* ── Hero Banner ── */}
      <div className="rounded-[24px] sm:rounded-[28px] bg-[#174CD2] p-5 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">
              Student Analytics
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight">
              Your Learning Dashboard
            </h2>
            <p className="mt-2 sm:mt-3 max-w-xl text-sm sm:text-base text-blue-100 leading-relaxed">
              Track every lecture, assignment, and course — with real-time performance scoring.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            



           
            <div className="rounded-2xl bg-white/15 px-5 sm:px-6 py-3 sm:py-4 backdrop-blur text-center min-w-[110px]">
              <p className="text-xs sm:text-sm text-blue-200">Overall Score</p>
              <p className="text-lg sm:text-xl font-bold mt-0.5">{Math.round(score)} / 1000</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Loading / Error ── */}
      {loading ? (
        <div className="rounded-[24px] border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#174CD2]" />
          <p className="text-base text-slate-500">Loading analytics...</p>
        </div>
      ) : error ? (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-6 text-base text-amber-700 shadow-sm">
          {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Overall Progress"
              value={`${s.overall_completion.toFixed(0)}%`}
              subtitle={`${s.completed_courses} / ${s.total_courses_purchased} courses done`}
              icon=""
            />
           

            {/* <MetricCard
              title="Performance Score"
              value={`${Math.round(score)}`}
              subtitle={`${s.performance_points_earned}/${s.performance_points_max} points earned`}
              icon=""
            /> */}

            
            <MetricCard
              title="Assignments"
              value={`${s.assignments_submitted}`}
              subtitle={`${s.assignments_reviewed} reviewed · ${s.assignments_pending_review} pending`}
              icon=""
            />

            <MetricCard
              title="Average Assignment Score"
              value={`${s.assignment_average.toFixed(1)}%`}
              subtitle="Average score"
              icon=""
            />

            <MetricCard
              title="Learning Streak"
              value={`${s.learning_streak} days`}
              subtitle={`${breakdown.consistency?.earned ?? 0} / ${breakdown.consistency?.max ?? 100} pts earned`}
              icon=""
            />

            {/* <MetricCard
              title="Study Time"
              value={`${s.study_hours.toFixed(1)}h`}
              subtitle={`${s.study_time_minutes} mins tracked`}
              icon=""
            /> */}
          </div>

          <div className="grid gap-4 lg:grid-cols-[260px_1fr] xl:grid-cols-[300px_1fr]">
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 sm:p-8  flex flex-col items-center justify-center gap-4">
              <p className="text-base sm:text-lg font-bold text-slate-700">Overall Score</p>
              <CircularGauge score={score} max={1000} />
              <p className="text-xs sm:text-sm text-slate-400 -mt-2">Max 1000 pts</p>
              <span
                className={`rounded-full px-5 py-1.5 text-sm font-semibold ${speedColor}`}
              >
                {speedLabel}
              </span>
            </div>




            {/* Progress bars card */}
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <p className="text-sm sm:text-base font-semibold text-slate-500">
                Score Breakdown
              </p>
              <h3 className="mt-1 text-xl sm:text-2xl font-bold text-slate-900">
                Points earned by learning activity
              </h3>
              <div className="mt-6 space-y-5">
                 <ProgressRow
                  label="Lecture Completion"
                  value={breakdown.lecture_completion?.percent ?? s.lectures_completed_percent}
                  color="bg-violet-500"
                  earned={breakdown.lecture_completion?.earned}
                  max={breakdown.lecture_completion?.max}
                />
                <ProgressRow
                  label="Assignment Performance"
                  value={breakdown.assignment_performance?.percent ?? s.assignment_average}
                  color="bg-[#F59E0B]"
                  earned={breakdown.assignment_performance?.earned}
                  max={breakdown.assignment_performance?.max}
                />
                <ProgressRow
                  label="Consistency"
                  value={breakdown.consistency?.percent ?? s.consistency_score}
                  color="bg-rose-500"
                  earned={breakdown.consistency?.earned}
                  max={breakdown.consistency?.max}
                />
              </div>
            </div>
          </div>

          {/* ── Course-by-Course Breakdown ── */}
          {(() => {
            const activeCourses = (analytics?.courses ?? []).filter(c => c.videos_completed > 0);
            if (activeCourses.length === 0) return null;
            
            return (
              <div className="rounded-[24px] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <p className="text-sm sm:text-base font-semibold text-slate-500">
                  Course Focus
                </p>
                <h3 className="mt-1 text-xl sm:text-2xl font-bold text-slate-900">
                  Progress by Course
                </h3>
                <div className="mt-5 space-y-4">
                  {activeCourses.map((c) => (
                    <div
                    key={c.course_id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-5"
                  >
                    {/* Course header */}
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <p className="text-base sm:text-lg font-bold text-slate-800 leading-snug flex-1">
                        {c.course_title}
                      </p>
                      <div className="flex gap-2 items-center flex-wrap shrink-0">
                        <span className={statusBadge(c.course_status)}>
                          {c.course_status}
                        </span>
                        <span className="text-base sm:text-lg font-extrabold text-[#174CD2]">
                          {c.completion.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2.5 rounded-full bg-slate-200 mb-4">
                      <div
                        className="h-2.5 rounded-full bg-[#174CD2] transition-all duration-700"
                        style={{ width: `${Math.min(c.completion, 100)}%` }}
                      />
                    </div>

                    {/* Per-course stats */}
                    <div className="flex items-center gap-4 mt-2 text-md text-slate-500">
                      <span><i className="ri-shield-check-fill text-green-500"></i> 
                      <span className="font-semibold text-slate-700">{c.videos_completed}</span> / 
                      <span className="font-semibold text-slate-700">{c.total_lectures}</span> lectures done</span>
                    </div>

                  </div>
                ))}
              </div>
            </div>
            );
          })()}

          

          {/* ── Insights ── */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <p className="text-sm sm:text-base font-semibold text-slate-500">Insights</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {(analytics?.insights ?? []).map((ins, i) => (
                <div
                  key={i}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm sm:text-base text-slate-600 font-medium"
                >
                  {ins}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
