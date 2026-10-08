import React, { useState } from 'react';
import { 
  GraduationCap, 
  Radio, 
  BookOpen, 
  FileText, 
  Video, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ChevronRight, 
  Zap, 
  Globe, 
  School, 
  Building2, 
  User, 
  Smartphone, 
  Award,
  Bell,
  Play
} from 'lucide-react';
import { ExamLevel, SubjectInfo, LiveClass, TopicMastery, ActiveTab } from '../types';
import { TeacherDashboardView } from './TeacherDashboardView';

interface DashboardViewProps {
  selectedLevel: ExamLevel;
  subjects: SubjectInfo[];
  liveClasses: LiveClass[];
  weakTopics: TopicMastery[];
  onNavigate: (tab: ActiveTab) => void;
  onStartPractice: (subjectId: string, mode: 'practice' | 'exam') => void;
  onJoinLiveClass: (classId: string) => void;
  onSelectSubjectForStudy: (subjectId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  selectedLevel,
  subjects,
  liveClasses,
  weakTopics,
  onNavigate,
  onStartPractice,
  onJoinLiveClass,
}) => {
  const [activeRoleView, setActiveRoleView] = useState<'student' | 'teacher'>('student');
  const activeLive = liveClasses.find((c) => c.isLiveNow);

  return (
    <div className="space-y-10 pb-16">
      {/* 0. PROMINENT LIVE CLASS ALERT BANNER (If teacher is live now) */}
      {activeLive && (
        <div className="rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-red-400/40 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              <img
                src={activeLive.teacherAvatar}
                alt={activeLive.teacherName}
                className="w-12 h-12 rounded-xl object-cover border-2 border-white/40 shadow-sm"
              />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white animate-ping" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider backdrop-blur-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  ቀጥታ ስርጭት (Live Now)
                </span>
                <span className="text-xs text-red-100 font-semibold">{activeLive.subject}</span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                መምህር {activeLive.teacherName} - {activeLive.title}
              </h3>
              <p className="text-xs text-red-100/90 line-clamp-1">{activeLive.currentTopic}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onJoinLiveClass(activeLive.id)}
              className="px-4 py-2.5 rounded-xl bg-white text-red-600 hover:bg-red-50 text-xs sm:text-sm font-extrabold shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>ክፍሉን አሁኑኑ ተቀላቀል (Join Class)</span>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. TOP PLATFORM HERO & PILLARS (From Learnova screenshot) */}
      {/* ------------------------------------------------------------- */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 text-white p-6 sm:p-10 overflow-hidden shadow-xl border border-sky-900/40">
        <div className="relative z-10 space-y-6 max-w-4xl">
          {/* Brand header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 to-sky-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <span className="text-white font-black text-xl italic tracking-tighter">L</span>
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Learnova</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  Global Education Platform
                </span>
              </div>
              <p className="text-xs text-cyan-200/80 font-medium">
                Learn Today, Build Tomorrow
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              An AI-powered global learning & assessment platform for students, teachers & lifelong learners.
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Better learning, bigger dreams. Master national exams, attend real-time interactive classrooms, stream video lessons, and test retention with instant AI tutoring.
            </p>
          </div>

          {/* 5 Core Pillars from screenshot: Study | Practice | Live | Test | Grow */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {[
              { label: 'Study', action: () => onNavigate('documents'), color: 'hover:bg-emerald-500/20 hover:border-emerald-400' },
              { label: 'Practice', action: () => onNavigate('exam_prep'), color: 'hover:bg-purple-500/20 hover:border-purple-400' },
              { label: 'Live', action: () => onNavigate('live_classes'), color: 'hover:bg-red-500/20 hover:border-red-400' },
              { label: 'Test', action: () => onNavigate('exam_prep'), color: 'hover:bg-sky-500/20 hover:border-sky-400' },
              { label: 'Grow', action: () => onNavigate('analytics'), color: 'hover:bg-amber-500/20 hover:border-amber-400' },
            ].map((pillar) => (
              <button
                key={pillar.label}
                onClick={pillar.action}
                className={`px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold transition cursor-pointer ${pillar.color}`}
              >
                {pillar.label}
              </button>
            ))}

            {/* Quick Switcher between Student & Teacher View */}
            <div className="ml-auto flex items-center p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
              <button
                onClick={() => setActiveRoleView('student')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  activeRoleView === 'student' ? 'bg-cyan-500 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                Student View
              </button>
              <button
                onClick={() => setActiveRoleView('teacher')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  activeRoleView === 'teacher' ? 'bg-cyan-500 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                Teacher View
              </button>
            </div>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* If Teacher View is selected, render Teacher Dashboard */}
      {activeRoleView === 'teacher' ? (
        <TeacherDashboardView
          onNavigate={onNavigate}
          onStartLive={() => onNavigate('live_classes')}
        />
      ) : (
        /* ------------------------------------------------------------- */
        /* 2. STUDENT DASHBOARD (Exact layout from Learnova screenshot) */
        /* ------------------------------------------------------------- */
        <div className="space-y-6">
          {/* Header matching Learnova screenshot */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Student Dashboard
                </h2>
                <p className="text-xs text-slate-500">
                  Track your progress. Find your weak areas. Achieve your goals.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Alex Johnson</span>
                <span className="text-slate-400 font-normal">• Student Level 12</span>
              </div>
              <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer">
                <Bell className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3 Student Cards matching Learnova screenshot: Overall Progress | Subject Performance | Weak Topics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Overall Progress */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Overall Progress
              </h3>

              {/* Circular Gauge */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="text-slate-100"
                      strokeWidth="10"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="text-sky-600 transition-all duration-1000 ease-out"
                      strokeWidth="10"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 * (1 - 0.78)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">78%</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Mastery</span>
                  </div>
                </div>
                <p className="text-xs font-semibold text-emerald-600 mt-2 text-center">
                  Keep going! You're doing great.
                </p>
              </div>

              {/* 3 Metrics from screenshot */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="font-black text-slate-900 text-base font-mono">8</div>
                  <div className="text-[10px] text-slate-500 font-medium">Courses</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="font-black text-slate-900 text-base font-mono">15</div>
                  <div className="text-[10px] text-slate-500 font-medium">Tests</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="font-black text-slate-900 text-base font-mono">42h</div>
                  <div className="text-[10px] text-slate-500 font-medium">Study</div>
                </div>
              </div>
            </div>

            {/* Card 2: Subject Performance */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Subject Performance
              </h3>

              <div className="space-y-3 pt-1">
                {[
                  { name: 'Mathematics', score: 82, color: 'bg-blue-600' },
                  { name: 'Physics', score: 91, color: 'bg-emerald-600' },
                  { name: 'Chemistry', score: 74, color: 'bg-amber-500' },
                  { name: 'Biology', score: 68, color: 'bg-purple-600' },
                  { name: 'English', score: 80, color: 'bg-sky-500' },
                ].map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{item.name}</span>
                      <span className="font-bold text-slate-900 font-mono">{item.score}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${item.score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onNavigate('exam_prep')}
                className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer border border-slate-200"
              >
                Practice Weak Subjects →
              </button>
            </div>

            {/* Card 3: Weak Topics */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Weak Topics
              </h3>

              <div className="space-y-3 pt-1">
                {[
                  { topic: 'Trigonometry', subject: 'Mathematics' },
                  { topic: 'Organic Chemistry', subject: 'Chemistry' },
                  { topic: 'Reading Comprehension', subject: 'English' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => onNavigate('exam_prep')}
                    className="p-3.5 rounded-xl bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 transition cursor-pointer group flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-amber-950">
                        {item.topic}
                      </div>
                      <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                        Needs more practice
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition shrink-0" />
                  </div>
                ))}
              </div>

              <button
                onClick={() => onNavigate('ai_lab')}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Explain Weak Topics with AI</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. POWERFUL FEATURES (From Learnova screenshot) */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4 pt-4">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Powerful Features
          </h2>
          <p className="text-xs text-slate-500">
            Everything you need to learn, practice and succeed.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              id: 'exam_prep',
              title: 'Exam Preparation',
              desc: 'School, national, university, certification & more.',
              color: 'from-purple-500 to-indigo-600',
              icon: GraduationCap,
              action: () => onNavigate('exam_prep'),
            },
            {
              id: 'live_classes',
              title: 'Live Classes',
              desc: 'Join interactive sessions with expert teachers.',
              color: 'from-blue-500 to-sky-600',
              icon: Radio,
              action: () => onNavigate('live_classes'),
            },
            {
              id: 'documents',
              title: 'Documents & PDFs',
              desc: 'Access notes, slides, and study materials.',
              color: 'from-emerald-500 to-teal-600',
              icon: FileText,
              action: () => onNavigate('documents'),
            },
            {
              id: 'videos',
              title: 'Video Learning',
              desc: 'Watch lessons anytime, anywhere with real playback.',
              color: 'from-cyan-500 to-blue-600',
              icon: Video,
              action: () => onNavigate('videos'),
            },
            {
              id: 'ai_lab',
              title: 'AI Learning',
              desc: 'Generate questions, quizzes, summaries and more.',
              color: 'from-violet-500 to-purple-600',
              icon: Sparkles,
              action: () => onNavigate('ai_lab'),
            },
            {
              id: 'multi_lang',
              title: 'Multi-Language',
              desc: 'Learn in your preferred language seamlessly.',
              color: 'from-sky-500 to-indigo-600',
              icon: Globe,
              action: () => onNavigate('exam_prep'),
            },
          ].map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                onClick={feature.action}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-sky-400 hover:shadow-xs transition cursor-pointer group flex items-start gap-4"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${feature.color} flex items-center justify-center text-white shrink-0 shadow-xs group-hover:scale-105 transition`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-sky-700 transition">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. FOR EVERYONE (From Learnova screenshot) */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4 pt-4">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            For Everyone
          </h2>
          <p className="text-xs text-slate-500">
            A platform for every learner, at every stage.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              role: 'Students',
              desc: 'Prepare for exams, learn new skills.',
              icon: User,
              color: 'text-sky-600 bg-sky-50 border-sky-200',
              action: () => setActiveRoleView('student'),
            },
            {
              role: 'Teachers',
              desc: 'Create courses, host live classes.',
              icon: Award,
              color: 'text-purple-600 bg-purple-50 border-purple-200',
              action: () => setActiveRoleView('teacher'),
            },
            {
              role: 'Schools & Universities',
              desc: 'Manage learning and assessments.',
              icon: School,
              color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
              action: () => onNavigate('exam_prep'),
            },
            {
              role: 'Organizations',
              desc: 'Build custom exams and training programs.',
              icon: Building2,
              color: 'text-amber-600 bg-amber-50 border-amber-200',
              action: () => onNavigate('documents'),
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.role}
                onClick={item.action}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition cursor-pointer text-center space-y-3"
              >
                <div className={`w-12 h-12 rounded-2xl ${item.color} border flex items-center justify-center mx-auto shadow-2xs`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {item.role}
                </h3>
                <p className="text-xs text-slate-500 leading-snug">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. GLOBAL EXAMS & HOW IT WORKS (From Learnova screenshot) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
        {/* Global Exam Support (6 cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <Globe className="w-5 h-5 text-sky-600" />
            <span>Global Exam Support</span>
          </h3>
          <p className="text-xs text-slate-500">
            Structured preparation for every critical academic milestone.
          </p>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {[
              'School Exams',
              'National Exams',
              'University Entrance',
              'University Exit',
              'International Exams',
              'Professional Certifications',
            ].map((name) => (
              <button
                key={name}
                onClick={() => onNavigate('exam_prep')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-left transition cursor-pointer text-xs font-bold text-slate-800 flex items-center justify-between"
              >
                <span>{name}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ))}
          </div>
        </div>

        {/* How It Works (6 cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>How It Works</span>
          </h3>
          <p className="text-xs text-slate-500">
            A simple 5-step journey to academic excellence.
          </p>

          <div className="space-y-2.5 pt-1">
            {[
              { step: '1. Sign Up', desc: 'Create your account in minutes.' },
              { step: '2. Choose Exam', desc: 'Select your goals and subjects.' },
              { step: '3. Learn & Practice', desc: 'Use videos, documents, quizzes and live classes.' },
              { step: '4. Take Exams', desc: 'Track your score and progress in real-time.' },
              { step: '5. Achieve', desc: 'Reach your goals and grow with confidence.' },
            ].map((st, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 font-mono font-bold flex items-center justify-center text-[11px] shrink-0">
                  {idx + 1}
                </span>
                <div>
                  <strong className="text-slate-900">{st.step}</strong>: <span className="text-slate-600">{st.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
