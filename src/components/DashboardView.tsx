import React from 'react';
import { 
  GraduationCap, 
  Flame, 
  Target, 
  TrendingUp, 
  Clock, 
  BookOpen, 
  ArrowRight, 
  Radio, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Award,
  Zap,
  Play,
  RotateCcw,
  Compass,
  FileText
} from 'lucide-react';
import { ExamLevel, SubjectInfo, LiveClass, TopicMastery, ActiveTab, ExamResult, AppUser, Language } from '../types';

interface DashboardViewProps {
  currentUser: AppUser | null;
  selectedLevel: ExamLevel;
  subjects: SubjectInfo[];
  examResults: ExamResult[];
  topicMasteries: TopicMastery[];
  liveClasses: LiveClass[];
  language?: Language;
  onNavigate: (tab: ActiveTab) => void;
  onStartPractice: (subjectId: string, mode: 'practice' | 'exam') => void;
  onJoinLiveClass: (classId: string) => void;
  onOpenAuth?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  selectedLevel,
  subjects,
  examResults,
  topicMasteries,
  liveClasses,
  language = 'en',
  onNavigate,
  onStartPractice,
  onJoinLiveClass,
  onOpenAuth,
}) => {
  const currentSubjects = subjects.filter((s) => s.level === selectedLevel);
  const currentResults = examResults.filter((r) => r.level === selectedLevel);
  const currentMasteries = topicMasteries.filter((t) => t.level === selectedLevel);

  // Statistics calculation - use actual user results if available
  const hasUserTakenExams = currentResults.length > 0;
  const totalExamsCompleted = hasUserTakenExams ? currentResults.length : 0;
  const totalQuestionsAnswered = hasUserTakenExams 
    ? currentResults.reduce((acc, r) => acc + r.totalQuestions, 0) 
    : 0;
  const totalCorrect = hasUserTakenExams 
    ? currentResults.reduce((acc, r) => acc + r.correctAnswersCount, 0) 
    : 0;
  const avgScore = hasUserTakenExams 
    ? Math.round(currentResults.reduce((acc, r) => acc + r.scorePercentage, 0) / currentResults.length) 
    : 0;
  const accuracy = totalQuestionsAnswered > 0 ? Math.round((totalCorrect / totalQuestionsAnswered) * 100) : 0;
  const streakDays = currentUser ? (hasUserTakenExams ? Math.min(currentResults.length, 7) : 1) : 0;

  // Active live broadcast matching student's grade level
  const targetLiveLevel =
    currentUser?.role === 'student' && currentUser.gradeLevel
      ? currentUser.gradeLevel
      : selectedLevel;
  const activeLive = liveClasses.find((c) => c.isLiveNow && c.level === targetLiveLevel);

  // Weak topics requiring review
  const weakTopics = currentMasteries.filter((t) => t.accuracy < 65);
  const topRecommendedSubject = currentSubjects[0] || subjects[0];

  const studentName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Student';

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* ------------------------------------------------------------- */}
      {/* 1. WELCOME & 'WHAT SHOULD I DO NEXT?' HERO BANNER             */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Student Learning Command Center
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold text-slate-500">
              {selectedLevel.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome back, {studentName} 👋
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
            Here is your daily exam preparation plan. You have maintained a <strong className="text-amber-700 font-bold">{streakDays}-day study streak</strong>. Let&apos;s build national examination mastery today.
          </p>
        </div>

        {/* Action card: What should I do next? */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5 max-w-sm w-full space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              What Should I Do Next?
            </span>
            <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
              Recommended
            </span>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-900">
              {weakTopics.length > 0 
                ? `Drill Weak Chapter: ${weakTopics[0].topic}`
                : `Take ${topRecommendedSubject?.name || 'Physics'} Mock Exam`}
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">
              {weakTopics.length > 0 
                ? 'Improve accuracy from 48% to clear national pass standards.'
                : 'Benchmark your retention with a 2016 E.C. Ministry simulation.'}
            </div>
          </div>

          <button
            onClick={() => onStartPractice(topRecommendedSubject?.id || 'g12_physics', 'exam')}
            className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span>Start Recommended Session</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. LIVE CLASS NOTIFICATION (If broadcast active)              */}
      {/* ------------------------------------------------------------- */}
      {activeLive && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              {activeLive.teacherAvatar ? (
                <img
                  src={activeLive.teacherAvatar}
                  alt={activeLive.teacherName}
                  className="w-11 h-11 rounded-xl object-cover border-2 border-red-300"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-red-100 border-2 border-red-300 flex items-center justify-center text-red-600 font-bold text-lg">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
              )}
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-600 border-2 border-white animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-600 border-2 border-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-600 text-white flex items-center gap-1">
                  <Radio className="w-3 h-3" />
                  Live Classroom Now
                </span>
                <span className="text-xs text-red-900 font-bold">{activeLive.subject}</span>
              </div>
              <h3 className="text-sm font-black text-slate-900 mt-1">
                {activeLive.title}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {activeLive.teacherName || (language === 'am' ? 'መምህር አልተመደበም' : 'No teacher assigned')}
              </p>
            </div>
          </div>

          <button
            onClick={() => onJoinLiveClass(activeLive.id)}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <span>Join Live Broadcast</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. PERFORMANCE STATISTICS CARDS                               */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Average Score</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
            {avgScore}%
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Passing benchmark: <span className="text-slate-800 font-bold">50%</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Accuracy Rate</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {accuracy}%
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Verified across official past tests
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Exams Completed</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {totalExamsCompleted}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Full mock & subject exams
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Questions Solved</span>
            <Target className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {totalQuestionsAnswered}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Drill & timed test questions
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Study Streak</span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">
            {streakDays} Days
          </div>
          <div className="text-[11px] text-amber-700 font-bold">
            Daily practice maintained 🔥
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. CONTINUE LEARNING & RECENT EXAMS                           */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols): Recent Exams & Progress */}
        <div className="lg:col-span-8 space-y-6">
          {/* Recent Exam Attempts */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Recent Examination Attempts
                </h3>
                <p className="text-xs text-slate-500">
                  Past test results and official national passing status
                </p>
              </div>

              <button
                onClick={() => onNavigate('exams')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Browse All Exams</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {currentResults.length > 0 ? (
                currentResults.slice(0, 4).map((res) => (
                  <div
                    key={res.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white hover:border-slate-300 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900">{res.title}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          res.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {res.passed ? 'Passed (50%+)' : 'Needs Review'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-3">
                        <span>{res.date}</span>
                        <span>•</span>
                        <span>{res.correctAnswersCount} / {res.totalQuestions} Correct</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <div className="text-lg font-black text-emerald-700 font-mono">
                          {res.scorePercentage}%
                        </div>
                        <div className="text-[10px] text-slate-500">Final Score</div>
                      </div>

                      <button
                        onClick={() => onStartPractice(res.subjectId, 'practice')}
                        className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                        title="Review or retake drill"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-500 space-y-2">
                  <p>You haven&apos;t taken a timed exam in this grade level yet.</p>
                  <button
                    onClick={() => onNavigate('exams')}
                    className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs"
                  >
                    Start Your First Timed Exam
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Subjects Launcher */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Quick Subject Drills ({currentSubjects.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Instant practice for {selectedLevel.replace(/_/g, ' ')}
                </p>
              </div>

              <button
                onClick={() => onNavigate('subjects')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Curriculum</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentSubjects.slice(0, 4).map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-white hover:border-emerald-300 transition flex items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
                      {sub.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {sub.questionCount} Questions • {sub.chapters.length} Chapters
                    </div>
                  </div>

                  <button
                    onClick={() => onStartPractice(sub.id, 'practice')}
                    className="p-2 rounded-xl bg-white border border-slate-200 group-hover:bg-emerald-700 group-hover:text-white group-hover:border-emerald-700 text-slate-700 transition cursor-pointer"
                    title="Start practice"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Recommended Practice & Diagnostic Guidance */}
        <div className="lg:col-span-4 space-y-6">
          {/* Weak Topics Diagnostic Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Targeted Chapter Drills
              </span>
              <span className="text-[10px] font-bold text-slate-500 font-mono">
                {weakTopics.length} Needed
              </span>
            </div>

            <div className="space-y-3">
              {weakTopics.length > 0 ? (
                weakTopics.slice(0, 3).map((wt) => (
                  <div key={wt.topic} className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{wt.topic}</span>
                      <span className="font-mono font-bold text-amber-700">{wt.accuracy}%</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {wt.suggestedAction}
                    </p>
                    <button
                      onClick={() => {
                        const matchedSubj =
                          currentSubjects.find((s) =>
                            s.name.toLowerCase().includes(wt.subject.toLowerCase()) ||
                            wt.subject.toLowerCase().includes(s.name.toLowerCase().split(' ')[0])
                          ) ||
                          subjects.find((s) =>
                            s.name.toLowerCase().includes(wt.subject.toLowerCase()) ||
                            wt.subject.toLowerCase().includes(s.name.toLowerCase().split(' ')[0])
                          );
                        onStartPractice(matchedSubj?.id || currentSubjects[0]?.id, 'practice');
                      }}
                      className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer"
                    >
                      Practice This Topic
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs text-center space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <div className="font-bold">Great job! No critical weak topics.</div>
                  <p className="text-[11px] text-emerald-700">You are performing well across all standard chapters.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Learning Suite Shortcuts */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                Self-Study Tools
              </span>
              <h3 className="text-base font-extrabold text-white">
                Exam Preparation Toolkit
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => onNavigate('live_classes')}
                className="w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 transition flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-red-400" />
                  <span className="font-bold">Live Classes & Q&A</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('documents')}
                className="w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 transition flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold">Notes & Formula PDFs</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('ai_lab')}
                className="w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 transition flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="font-bold">AI Problem Explainer</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function ChevronRight(props: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
